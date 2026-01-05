import OpenAI from 'openai';
import { getSecretKeys } from '../helpers/api';
import { parseJSONResponse, FinancialDataResponse, GenerateDocs } from './shared';
import { fnb_sample_statement, FNBBankStatementType, Transaction } from '../handlers/fnb/sample';
import { formFnbStatementPrompt } from '../handlers/fnb/prompt';
import { formatDate } from '../handlers/fnb/index';

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

    // Replace "null" strings with null
    s = s.replace(/"null"/g, 'null');

    return s;
};

const parseFnbCompletion = (raw: any): any => {
    if (!raw) return { transactions: [], address: {} };
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw;

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
        return { transactions: [], address: {} };
    }
};

export const generateFnbAI = async (data: GenerateDocs): Promise<FinancialDataResponse> => {
    const {
        accountHolder,
        payDate = 25,
        accountNumber,
        months = 3,
        openBalance,
        availableBalance,
        salaryAmount,
        physicalAddress,
        companyName,
        comment,
        accountType
    } = data;

    if (!physicalAddress) {
        throw new Error('physicalAddress is required to generate FNB statements');
    }

    const keys = await getSecretKeys();
    if (!keys?.length || !keys[0].DEEP_SEEK_API) {
        throw new Error('DeepSeek API key not found in database');
    }

    const deepseek = new OpenAI({
        apiKey: keys[0].DEEP_SEEK_API,
        baseURL: 'https://api.deepseek.com/v1'
    });

    const systemMessage = 'Generate realistic South African FNB bank statement data in valid JSON format only.';

    const statements: FNBBankStatementType[] = [];
    const today = new Date();
    let currentBalance = openBalance;

    for (let i = 0; i < months; i++) {
        // Calculate 30-day periods starting from 90 days ago and moving forward
        const daysPerPeriod = 30;
        const totalDays = months * daysPerPeriod;

        // Calculate start date (90 days ago + i*30 days)
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - totalDays + i * daysPerPeriod);

        // Calculate end date (start date + 30 days)
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + daysPerPeriod);

        // Ensure end date doesn't exceed today
        if (endDate > today) {
            endDate.setTime(today.getTime());
        }

        // Ensure start date is not after end date
        if (startDate > endDate) {
            startDate.setTime(endDate.getTime());
            startDate.setDate(endDate.getDate() - 1);
        }

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const startMonth = monthNames[startDate.getMonth()];
        const endMonth = monthNames[endDate.getMonth()];
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();

        const startDay = startDate.getDate().toString().padStart(2, '0');
        const endDay = endDate.getDate().toString().padStart(2, '0');

        const statementPeriod = {
            from: `${startDay} ${startMonth} ${startYear}`,
            to: `${endDay} ${endMonth} ${endYear}`,
            generation_date: today.toISOString().split('T')[0]
        };

        // Create prompt for this specific month with proper opening balance
        const monthlyPromptData = {
            accountHolder,
            payDate,
            accountNumber,
            months,
            salaryAmount,
            availableBalance: i === months - 1 ? availableBalance : undefined, // Only set final balance for last month
            openBalance,
            statementPeriod,
            currentMonth: i + 1,
            totalMonths: months,
            openingBalance: currentBalance, // carried-over balance
            physicalAddress,
            companyName,
            isLastMonth: i === months - 1,
            comment,
            accountType
        };

        const monthlyUserMessage = formFnbStatementPrompt(monthlyPromptData);

        try {
            const completion = await deepseek.chat.completions.create({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: systemMessage
                    },
                    { role: 'user', content: monthlyUserMessage }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.7,
                max_tokens: 8192
            });

            const rawContent = completion.choices?.[0]?.message?.content || '{}';
            const results: any = parseFnbCompletion(rawContent);
            const transactions = Array.isArray(results?.transactions) ? results.transactions : [];
            const address = results?.address || {};

            // Recalculate balances if needed, similar to TymeBank
            if (transactions.length > 0) {
                let recalculatedBalance = typeof currentBalance === 'number' ? currentBalance : 0;
                const adjustedTransactions: Transaction[] = [];
                transactions.forEach((tx: Transaction) => {
                    const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : typeof tx.amount === 'number' ? tx.amount : 0;
                    const fees = tx.fees ? (typeof tx.fees === 'string' ? parseFloat(tx.fees) : tx.fees) : 0;

                    let effectiveAmount = Math.abs(amount);
                    let effectiveFees = fees;

                    if (tx.action === 'Dr') {
                        if (recalculatedBalance - effectiveAmount < 0) {
                            // Adjust to prevent negative balance
                            effectiveAmount = recalculatedBalance;
                            // Update tx.amount to reflect adjustment
                            tx.amount = tx.amount.startsWith('-') ? `-${effectiveAmount.toFixed(2)}` : `-${effectiveAmount.toFixed(2)}`;
                        }
                        recalculatedBalance -= effectiveAmount;
                        // Fees are not subtracted from balance - they are accrued
                    } else if (tx.action === 'Cr') {
                        recalculatedBalance += effectiveAmount;
                    }

                    // Ensure balance is a valid number
                    if (isNaN(recalculatedBalance)) {
                        recalculatedBalance = 0;
                    }

                    tx.balance = recalculatedBalance.toFixed(2);
                    adjustedTransactions.push(tx);
                });
                // Update transactions
                results.transactions = adjustedTransactions;

                // For the last month, ensure closing balance matches availableBalance
                if (i === months - 1 && availableBalance !== undefined && !isNaN(availableBalance)) {
                    // Adjust the last transaction's amount to make final balance match availableBalance
                    const lastTx = adjustedTransactions[adjustedTransactions.length - 1];
                    if (lastTx) {
                        const currentFinal = parseFloat(lastTx.balance);
                        const diff = availableBalance - currentFinal;
                        if (Math.abs(diff) > 0.01) {
                            // Adjust amount by diff (positive diff increases balance, negative decreases)
                            const newAmount = parseFloat(lastTx.amount) + diff;
                            lastTx.amount = newAmount.toFixed(2);
                            // Update action based on sign of amount
                            lastTx.action = parseFloat(lastTx.amount) >= 0 ? 'Cr' : 'Dr';
                            lastTx.balance = availableBalance.toFixed(2);
                        }
                    }
                }
            }

            const content = createFnbStatementData(
                transactions,
                accountHolder,
                accountNumber,
                address,
                statementPeriod,
                accountType || 'Easy Account'
            );
            statements.push(content);
            currentBalance = parseFloat(content.balances.closing_balance.amount);
        } catch (monthlyError) {
            console.error(`Failed to generate statement for month ${i + 1}:`, monthlyError);
            // Continue with next month even if one fails
        }
    }

    if (statements.length > 0) {
        return {
            status: 1,
            message: `Generated AI data for ${statements.length} FNB statements`,
            data: {
                statements: statements,
                rawData: { bankType: 'FNB', accountHolder, accountNumber }
            }
        };
    } else {
        return {
            status: 0,
            message: 'Failed to generate any FNB statement data from AI',
            error: 'Generation failed'
        };
    }
};

export const createFnbStatementData = (
    transactions: Transaction[],
    accountHolder: string,
    accountNumber: string,
    address: any,
    statementPeriod: { from: string; to: string },
    accountType: string
): FNBBankStatementType => {
    const VAT_RATE = 0.15;

    const toNumber = (v?: string | null) => (v ? parseFloat(v) || 0 : 0);

    // ---------- Opening / Closing ----------
    const openingBalanceAmount =
        transactions.length > 0
            ? toNumber(transactions[0].balance) - toNumber(transactions[0].amount) + (transactions[0].fees ? toNumber(transactions[0].fees) : 0)
            : 0;

    const closingBalanceAmount = transactions.length > 0 ? toNumber(transactions[transactions.length - 1].balance) : 0;

    // ---------- Credits / Debits ----------
    const creditTransactions = transactions.filter((t) => t.action === 'Cr');
    const debitTransactions = transactions.filter((t) => t.action === 'Dr');

    const creditTotal = creditTransactions.reduce((s, t) => s + toNumber(t.amount), 0);

    const debitTotal = debitTransactions.reduce((s, t) => s + Math.abs(toNumber(t.amount)), 0);

    // ---------- BANK CHARGE CLASSIFICATION ----------

    const serviceFees = transactions
        .filter((t) => t.action === 'Dr' && /service fees|monthly fee|bank fee|account fee/i.test(t.description || ''))
        .reduce((s, t) => s + Math.abs(toNumber(t.amount)), 0);

    // Cash Deposit Fees
    const cashDepositFees = transactions
        .filter((t) => t.action === 'Dr' && /cash deposit fee|cash deposit charges?/i.test(t.description || ''))
        .reduce((s, t) => s + (t.fees ? toNumber(t.fees) : Math.abs(toNumber(t.amount))), 0);

    // Cash Handling Fees
    const cashHandlingFees = transactions
        .filter((t) => t.action === 'Dr' && /cash handling/i.test(t.description || ''))
        .reduce((s, t) => s + Math.abs(toNumber(t.amount)), 0);

    // Debit interest (separate, not included in other fees)
    const debitInterestCharges = transactions
        .filter((t) => t.action === 'Dr' && /int on debit balance|debit interest|interest on overdraft/i.test(t.description || ''))
        .reduce((s, t) => s + Math.abs(toNumber(t.amount)), 0);

    // STRICT other fees: bank-created costs ONLY
    const otherFees = transactions
        .filter((t) => {
            if (t.action !== 'Dr') return false;

            const d = (t.description || '').toLowerCase();

            // exclude normal spend/payment activity
            if (
                /pos|purchase|atm|withdrawal|withdraw|cashsend|send money|eft|transfer|payment|debit order|fuel|kfc|shoprite|spar|pick n pay|bolt|uber/i.test(
                    d
                )
            )
                return false;

            // exclude already-counted categories
            if (/charge|commission|declined|Unsuccessful|penalty|reversal|overdraft|withdrawal fee/i.test(d)) {
                // ok: still a bank fee but not yet classified above
                return true;
            }

            // otherwise do NOT count
            return false;
        })
        .reduce((s, t) => s + Math.abs(toNumber(t.amount)), 0);

    // ---------- VAT COMPUTATION ----------

    const vatInclusiveTotal = serviceFees + cashDepositFees + cashHandlingFees + otherFees + debitInterestCharges;

    // Extract 15% VAT portion from VAT-inclusive amount
    const vatPortion = vatInclusiveTotal * (VAT_RATE / (1 + VAT_RATE));

    // ---------- ADDRESS ----------
    const customerAddress = address || {};

    // ---------- DATE HANDLING ----------
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const parseDate = (dateStr: string) => {
        const [dayStr, monStr, yearStr] = dateStr.split(' ');
        return new Date(parseInt(yearStr), monthNames.indexOf(monStr), parseInt(dayStr));
    };

    const fromDate = parseDate(statementPeriod.from);
    const toDate = parseDate(statementPeriod.to);
    const currentDate = toDate;

    const statementPeriodStr =
        `${fromDate.getDate().toString().padStart(2, '0')} ` +
        `${fromDate.toLocaleString('default', { month: 'long' })} ` +
        `${fromDate.getFullYear()} to ` +
        `${toDate.getDate().toString().padStart(2, '0')} ` +
        `${toDate.toLocaleString('default', { month: 'long' })} ` +
        `${toDate.getFullYear()}`;

    return {
        statement_info: {
            reference_number: `SMT${Math.random().toString().slice(2, 15)}`,
            issue_date: formatDate(currentDate, 'long'),
            statement_period: statementPeriodStr,
            statement_date: formatDate(Date.now(), 'long'),
            customer_name: accountHolder,
            customer_id: Math.random().toString().slice(2, 8),
            customer_address: customerAddress,
            account_number: accountNumber,
            account_type: accountType || 'Easy Account',
            tax_invoice_statement_number: '1',
            branch_code: '260665',
            branch_address: 'P O Box 5711, Weiteweden Park, 1709',
            contact_numbers: {
                lost_cards: '087-575-9406',
                account_enquiries: '087-736-2247',
                relationship_manager: '(087) 345-0702'
            },
            vat_numbers: {
                customer: 'Not Provided',
                bank: '4210102051'
            }
        },
        balances: {
            opening_balance: {
                amount: openingBalanceAmount.toFixed(2),
                action: openingBalanceAmount >= 0 ? 'Cr' : 'Dr'
            },
            closing_balance: {
                amount: closingBalanceAmount.toFixed(2),
                action: closingBalanceAmount >= 0 ? 'Cr' : 'Dr'
            },
            vat_inclusive: {
                amount: vatInclusiveTotal.toFixed(2),
                action: 'Dr'
            },
            total_vat_zar: {
                amount: vatPortion.toFixed(2),
                action: 'Dr'
            }
        },
        bank_charges: {
            service_fees: { amount: serviceFees.toFixed(2), action: 'Dr' },
            cash_deposit_fees: { amount: cashDepositFees.toFixed(2), action: 'Dr' },
            cash_handling_fees: { amount: cashHandlingFees.toFixed(2), action: 'Dr' },
            other_fees: {
                amount: (otherFees + debitInterestCharges).toFixed(2),
                action: 'Dr'
            }
        },
        interest_rates: {
            credit_rate: 'Tiered',
            debit_rate: '24.00%' // rate label — monetary charge captured in other_fees
        },
        transactions,
        turnover_summary: {
            credit_transactions: {
                count: creditTransactions.length,
                total: creditTotal.toFixed(2),
                action: 'Cr'
            },
            debit_transactions: {
                count: debitTransactions.length,
                total: debitTotal.toFixed(2),
                action: 'Dr'
            }
        }
    };
};
