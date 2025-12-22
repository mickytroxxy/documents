import OpenAI from 'openai';
import { formCapitecTransactionsPrompt } from '../handlers/standard/prompts';
import { getSecretKeys } from '../helpers/api';
import { parseJSONResponse, FinancialDataResponse, GenerateDocs } from './shared';
import { capitec_transactions_sample, CapitecAddressType, CapitecBankStatement, Transaction } from '../handlers/capitec/sample';
import { create } from 'domain';
import { generateCapitecBankPDF } from '../handlers/capitec';

const normalizeJsObjectString = (str: string): string => {
    let s = str.trim();

    // Drop trailing semicolons
    s = s.replace(/;+\s*$/, '');

    // Quote bare keys: { foo: 1 } -> { "foo": 1 }
    s = s.replace(/([{[,]\s*)([A-Za-z_][\w]*)\s*:/g, '$1"$2":');

    // Single to double quotes
    s = s.replace(/'/g, '"');

    // Remove trailing commas
    s = s.replace(/,(\s*[}\]])/g, '$1');

    // Replace undefined with null
    s = s.replace(/\bundefined\b/g, 'null');

    return s;
};

const parseCapitecCompletion = (raw: any): any => {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;

    const str = String(raw);

    // Strict JSON
    try {
        return JSON.parse(str);
    } catch {
        /* ignore */
    }

    // Tolerant helper
    try {
        const parsed = parseJSONResponse(str);
        if (parsed) return parsed;
    } catch {
        /* ignore */
    }

    // Normalized JS-object-string -> JSON
    try {
        const normalized = normalizeJsObjectString(str);
        return JSON.parse(normalized);
    } catch {
        /* ignore */
    }

    // Last resort: evaluate as JS object literal (controlled AI output)
    try {
        // eslint-disable-next-line no-new-func
        return new Function(`return (${str});`)();
    } catch (err) {
        console.warn('Failed to parse completion content', err);
        return {};
    }
};

export const generateCapitecAI = async (data: GenerateDocs): Promise<any> => {
    const {
        accountHolder,
        payDate = 25,
        accountNumber,
        months = 3,
        openBalance,
        availableBalance,
        salaryAmount,
        physicalAddress,
        companyName
    } = data;

    if (!physicalAddress) {
        throw new Error('physicalAddress is required to generate Capitec statements');
    }

    const keys = await getSecretKeys();
    if (!keys?.length || !keys[0].DEEP_SEEK_API) {
        throw new Error('DeepSeek API key not found in database');
    }

    const deepseek = new OpenAI({
        apiKey: keys[0].DEEP_SEEK_API,
        baseURL: 'https://api.deepseek.com/v1'
    });

    const systemMessage = 'Generate realistic South African Capitec bank statement data in valid JSON format only.';

    const userMessage = formCapitecTransactionsPrompt({
        accountHolder,
        accountNumber,
        months,
        openBalance,
        availableBalance,
        payDate, // 25th of each month
        salaryAmount,
        companyName,
        physicalAddress
    });
    try {
        const completion = await deepseek.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: systemMessage
                },
                { role: 'user', content: userMessage }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 8192
        });

        const rawContent = completion.choices?.[0]?.message?.content || '{}';
        const results: any = parseCapitecCompletion(rawContent);
        const transactions = Array.isArray(results?.transactions) ? results.transactions : capitec_transactions_sample.transactions;
        const address = results?.address || capitec_transactions_sample.address;
        const content = createCapitecStatementData(transactions, address, accountHolder, accountNumber);
        // const content = createCapitecStatementData(
        //     capitec_transactions_sample?.transactions,
        //     capitec_transactions_sample?.address,
        //     accountHolder,
        //     accountNumber
        // );
        return {
            status: 1,
            message: 'Generated AI data for Capitec bank statement',
            data: {
                statements: [content],
                rawData: { bankType: 'CAPITEC', accountHolder, accountNumber }
            }
        };
    } catch (error) {
        return {
            status: 0,
            message: 'Something went wrong with the AI response',
            data: {
                statements: [],
                rawData: { bankType: 'CAPITEC', accountHolder, accountNumber }
            }
        };
    }
};

export const createCapitecStatementData = (
    transactions: Transaction[],
    address: CapitecAddressType,
    accountHolder: string,
    account_number: string
): CapitecBankStatement => {
    // Calculate values from transactions
    const openingBalance =
        transactions.length > 0
            ? parseFloat(
                  (
                      (transactions[0].balance ?? 0) -
                      (transactions[0].money_in || 0) +
                      Math.abs(transactions[0].money_out || 0) +
                      Math.abs(transactions[0].fee || 0)
                  ).toFixed(2)
              )
            : 0;

    const closingBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;
    const availableBalance = closingBalance;

    // Calculate money in summary
    const otherIncome = transactions.filter((t) => t.category === 'Other Income' && t.money_in).reduce((sum, t) => sum + (t.money_in || 0), 0);

    // Cash deposits: any transaction with "cash deposit" in description and money_in
    const cashDeposit = transactions
        .filter((t) => {
            const desc = t.description?.toLowerCase() || '';
            return desc.includes('cash deposit') && t.money_in;
        })
        .reduce((sum, t) => sum + (t.money_in || 0), 0);

    // Transfer in: Live Better transfers or other transfers with money_in
    const transferIn = transactions
        .filter((t) => {
            const desc = t.description?.toLowerCase() || '';
            return (t.category === 'Transfer' || desc.includes('transfer')) && t.money_in;
        })
        .reduce((sum, t) => sum + (t.money_in || 0), 0);

    const interest = transactions.filter((t) => t.category === 'Interest' && t.money_in).reduce((sum, t) => sum + (t.money_in || 0), 0);
    const totalMoneyIn = otherIncome + cashDeposit + transferIn + interest;

    // Calculate money out summary
    const categories = {
        digital_payments: 0,
        card_payments: 0,
        cash_withdrawals: 0,
        send_cash: 0,
        fees: 0,
        card_subscriptions: 0,
        prepaid: 0,
        debit_orders: 0,
        transfer: 0,
        vouchers: 0
    };

    // Debug: Log some sample transaction values
    console.log(
        'Sample transactions money_out values:',
        transactions.slice(0, 5).map((t) => ({ description: t.description, money_out: t.money_out, category: t.category }))
    );

    // Calculate spending summary
    const spendingCategories = {
        cash_withdrawal: 0,
        digital_payments: 0,
        rent: 0,
        uncategorised: 0,
        groceries: 0,
        fuel: 0,
        online_store: 0,
        alcohol: 0,
        investments: 0,
        children_dependants: 0,
        software_games: 0,
        takeaways: 0,
        restaurants: 0,
        cellphone: 0,
        vehicle_tracking: 0,
        activities: 0,
        pharmacy: 0,
        other_loans_accounts: 0,
        betting_lottery: 0,
        doctors_therapists: 0
    };

    // Track all fees by type for fee summary
    const feeBreakdown = {
        cash_withdrawal_fee: 0,
        cash_sent_fee: 0,
        cash_deposit_fee: 0,
        debtcheck_fee: 0,
        external_payment_fee: 0,
        international_fee: 0,
        other_fees: 0
    };

    // Calculate Live Better savings (transfers from Live Better account)
    let liveBetterSavings = 0;

    // Process all transactions
    transactions.forEach((transaction) => {
        const amountOut = Math.abs(transaction.money_out || 0);
        const feeAmount = Math.abs(transaction.fee || 0);
        const description = transaction.description?.toLowerCase() || '';
        const category = transaction.category || '';
        let mappedCategory = false;

        // Calculate Live Better savings (transfers FROM Live Better account)
        if (description.includes('live better') && description.includes('transfer') && transaction.money_in) {
            liveBetterSavings += transaction.money_in || 0;
        }

        // Categorize fees by type
        if (feeAmount > 0) {
            if (description.includes('atm') && description.includes('cash withdrawal')) {
                feeBreakdown.cash_withdrawal_fee += feeAmount;
            } else if (description.includes('cash sent')) {
                feeBreakdown.cash_sent_fee += feeAmount;
            } else if (description.includes('cash deposit')) {
                feeBreakdown.cash_deposit_fee += feeAmount;
            } else if (description.includes('debtcheck') || description.includes('insufficient funds')) {
                feeBreakdown.debtcheck_fee += feeAmount;
            } else if (
                (description.includes('external') && description.includes('payment')) ||
                (description.includes('immediate') && description.includes('payment'))
            ) {
                feeBreakdown.external_payment_fee += feeAmount;
            } else if (description.includes('international')) {
                feeBreakdown.international_fee += feeAmount;
            } else {
                feeBreakdown.other_fees += feeAmount;
            }

            // Add to categories.fees for money_out_summary
            categories.fees += feeAmount;
        }

        // Map to money_out_summary categories
        const isSendCash = description.includes('send cash') || description.includes('cash sent');
        const isDigitalPayment =
            category === 'Digital Payments' ||
            description.includes('immediate payment') ||
            (description.includes('banking app') && description.includes('payment') && !isSendCash) ||
            description.includes('payshap payment');

        if (isSendCash) {
            categories.send_cash += amountOut;
            mappedCategory = true;
        } else if (isDigitalPayment) {
            categories.digital_payments += amountOut;
            mappedCategory = true;
        } else if (category === 'Cash Withdrawal') {
            categories.cash_withdrawals += amountOut;
            mappedCategory = true;
        } else if (
            description.includes('subscription') ||
            description.includes('netflix') ||
            description.includes('spotify') ||
            description.includes('canva')
        ) {
            categories.card_subscriptions += amountOut;
            mappedCategory = true;
        } else if (category === 'Cellphone' || description.includes('prepaid')) {
            categories.prepaid += amountOut;
            mappedCategory = true;
        } else if (description.includes('debit order') || description.includes('cartrack') || description.includes('registered debit order')) {
            categories.debit_orders += amountOut;
            mappedCategory = true;
        } else if (category === 'Transfer' && transaction.money_out) {
            categories.transfer += amountOut;
            mappedCategory = true;
        } else if (description.includes('voucher')) {
            categories.vouchers += amountOut;
            mappedCategory = true;
        }

        // Default: any remaining outgoing spend counts as card payments
        if (transaction.money_out && !mappedCategory) {
            categories.card_payments += amountOut;
        }

        // Map to spending_summary categories
        const amount = Math.abs(transaction.money_out || 0);

        // First check category, then description
        if (category) {
            switch (category) {
                case 'Cash Withdrawal':
                    spendingCategories.cash_withdrawal += amount;
                    break;
                case 'Digital Payments':
                    spendingCategories.digital_payments += amount;
                    break;
                case 'Rent':
                    spendingCategories.rent += amount;
                    break;
                case 'Uncategorised':
                    spendingCategories.uncategorised += amount;
                    break;
                case 'Groceries':
                    spendingCategories.groceries += amount;
                    break;
                case 'Fuel':
                    spendingCategories.fuel += amount;
                    break;
                case 'Online Store':
                    spendingCategories.online_store += amount;
                    break;
                case 'Alcohol':
                    spendingCategories.alcohol += amount;
                    break;
                case 'Investments':
                    spendingCategories.investments += amount;
                    break;
                case 'Children & Dependants':
                    spendingCategories.children_dependants += amount;
                    break;
                case 'Software/Games':
                    spendingCategories.software_games += amount;
                    break;
                case 'Takeaways':
                    spendingCategories.takeaways += amount;
                    break;
                case 'Restaurants':
                    spendingCategories.restaurants += amount;
                    break;
                case 'Cellphone':
                    spendingCategories.cellphone += amount;
                    break;
                case 'Vehicle Tracking':
                    spendingCategories.vehicle_tracking += amount;
                    break;
                case 'Activities':
                    spendingCategories.activities += amount;
                    break;
                case 'Pharmacy':
                    spendingCategories.pharmacy += amount;
                    break;
                case 'Other Loans & Accounts':
                    spendingCategories.other_loans_accounts += amount;
                    break;
                case 'Betting/Lottery':
                    spendingCategories.betting_lottery += amount;
                    break;
                case 'Doctors & Therapists':
                    spendingCategories.doctors_therapists += amount;
                    break;
            }
        }
    });

    const totalMoneyOut = Object.values(categories).reduce((sum, val) => sum + val, 0);
    const totalFees = categories.fees;

    // Debug: Log the calculated values
    console.log('Calculated Money In Summary:', {
        total: totalMoneyIn,
        breakdown: {
            other_income: otherIncome,
            cash_deposit: cashDeposit,
            transfer: transferIn,
            interest: interest
        }
    });
    console.log('Calculated Money Out Summary:', {
        total: totalMoneyOut,
        breakdown: categories
    });
    console.log('Total fees calculated:', totalFees);

    // Calculate fee breakdown - use actual fees from transactions
    const feeBreakdownArray = [
        { name: 'Cash Withdrawal Fee', value: parseFloat(feeBreakdown.cash_withdrawal_fee.toFixed(2)) },
        { name: 'Cash Sent Fee', value: parseFloat(feeBreakdown.cash_sent_fee.toFixed(2)) },
        { name: 'Cash Deposit Fee (Notes)', value: parseFloat(feeBreakdown.cash_deposit_fee.toFixed(2)) },
        { name: 'DebtCheck Insufficient Funds Fee', value: parseFloat(feeBreakdown.debtcheck_fee.toFixed(2)) },
        { name: 'External Immediate Payment Fee', value: parseFloat(feeBreakdown.external_payment_fee.toFixed(2)) },
        { name: 'International Processing Fee', value: parseFloat(feeBreakdown.international_fee.toFixed(2)) },
        { name: 'Other Fees', value: parseFloat(feeBreakdown.other_fees.toFixed(2)) }
    ].filter((fee) => fee.value > 0);

    // Recalculate total fees from the breakdown
    const calculatedTotalFees = feeBreakdownArray.reduce((sum, fee) => sum + fee.value, 0);

    // Extract scheduled payments from transactions
    const debitOrders = transactions
        .filter((t) => {
            const desc = t.description?.toLowerCase() || '';
            return (desc.includes('cartrack') || desc.includes('debit order')) && t.money_out;
        })
        .map((t) => ({
            date: t.date,
            description: t.description!,
            amount: -(t.money_out || 0)
        }));

    const cardSubscriptions = transactions
        .filter((t) => {
            const desc = t.description?.toLowerCase() || '';
            return (
                (desc.includes('netlify') ||
                    desc.includes('canva') ||
                    desc.includes('netflix') ||
                    desc.includes('spotify') ||
                    desc.includes('subscription')) &&
                t.money_out
            );
        })
        .map((t) => ({
            date: t.date,
            description: t.description!,
            amount: -(t.money_out || 0)
        }));

    // Get statement dates from transactions
    const fromDate = transactions.length > 0 ? transactions[0].date : '01/01/2024';
    const toDate = transactions.length > 0 ? transactions[transactions.length - 1].date : '31/12/2024';

    // Construct the full statement
    return {
        account_holder: {
            name: accountHolder,
            account_number: account_number,
            address
        },
        statement_period: {
            from_date: fromDate,
            to_date: toDate
        },
        balances: {
            opening_balance: openingBalance,
            closing_balance: closingBalance || 0,
            available_balance: availableBalance || 0
        },
        money_in_summary: {
            total: parseFloat(totalMoneyIn.toFixed(2)),
            breakdown: {
                other_income: parseFloat(otherIncome.toFixed(2)),
                cash_deposit: parseFloat(cashDeposit.toFixed(2)),
                transfer: parseFloat(transferIn.toFixed(2)),
                interest: parseFloat(interest.toFixed(2))
            }
        },
        live_better_benefits: {
            live_better_savings: parseFloat(liveBetterSavings.toFixed(2))
        },
        money_out_summary: {
            total: parseFloat(totalMoneyOut.toFixed(2)),
            breakdown: {
                digital_payments: parseFloat(categories.digital_payments.toFixed(2)),
                card_payments: parseFloat(categories.card_payments.toFixed(2)),
                cash_withdrawals: parseFloat(categories.cash_withdrawals.toFixed(2)),
                send_cash: parseFloat(categories.send_cash.toFixed(2)),
                fees: parseFloat((calculatedTotalFees || totalFees).toFixed(2)),
                card_subscriptions: parseFloat(categories.card_subscriptions.toFixed(2)),
                prepaid: parseFloat(categories.prepaid.toFixed(2)),
                debit_orders: parseFloat(categories.debit_orders.toFixed(2)),
                transfer: parseFloat(categories.transfer.toFixed(2)),
                vouchers: parseFloat(categories.vouchers.toFixed(2))
            }
        },
        fee_summary: {
            total: parseFloat((calculatedTotalFees || totalFees).toFixed(2)),
            breakdown:
                feeBreakdownArray.length > 0
                    ? feeBreakdownArray
                    : [
                          { name: 'Cash Withdrawal Fee', value: 330.0 },
                          { name: 'Cash Sent Fee', value: 180.0 },
                          { name: 'Cash Deposit Fee (Notes)', value: 112.84 },
                          { name: 'DebtCheck Insufficient Funds Fee', value: 60.0 },
                          { name: 'External Immediate Payment Fee', value: 48.0 },
                          { name: 'International Processing Fee', value: 31.0 },
                          { name: 'Other Fees', value: 151.35 }
                      ].filter((fee) => fee.value > 0)
        },
        scheduled_payments: {
            debit_orders: debitOrders,
            card_subscriptions: cardSubscriptions
        },
        spending_summary: {
            breakdown: Object.fromEntries(
                Object.entries(spendingCategories).map(([key, value]) => [key, parseFloat((-value).toFixed(2))])
            ) as typeof spendingCategories
        },
        transaction_history: transactions
    };
};
