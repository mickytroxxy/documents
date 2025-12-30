import OpenAI from 'openai';
import { getSecretKeys } from '../helpers/api';
import { parseJSONResponse, FinancialDataResponse, GenerateDocs } from './shared';
import { fnb_sample_statement, FNBBankStatementType, Transaction } from '../handlers/fnb/sample';
import { formFnbStatementPrompt } from '../handlers/fnb/prompt';

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

export const generateFnbAI = async (data: GenerateDocs): Promise<any> => {
    const {
        accountHolder,
        payDate = 25,
        accountNumber,
        months = 1,
        openBalance,
        availableBalance,
        salaryAmount,
        physicalAddress,
        companyName
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

    const userMessage = formFnbStatementPrompt({
        accountHolder,
        accountNumber,
        months,
        openBalance,
        availableBalance,
        payDate,
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
        const results: any = parseFnbCompletion(rawContent);
        const transactions = Array.isArray(results?.transactions) ? results.transactions : [];
        const address = results?.address || {};
        const content = createFnbStatementData(transactions, accountHolder, accountNumber, address, months);
        console.log(content);
        return {
            status: 1,
            message: 'Generated AI data for FNB bank statement',
            data: {
                statements: [content],
                rawData: { bankType: 'FNB', accountHolder, accountNumber }
            }
        };
    } catch (error) {
        return {
            status: 0,
            message: 'Something went wrong with the AI response',
            data: {
                statements: [],
                rawData: { bankType: 'FNB', accountHolder, accountNumber }
            }
        };
    }
};

export const createFnbStatementData = (
    transactions: Transaction[],
    accountHolder: string,
    accountNumber: string,
    address: any,
    months: number
): FNBBankStatementType => {
    // Calculate opening balance from first transaction
    const openingBalanceAmount =
        transactions.length > 0
            ? parseFloat(transactions[0].balance) - parseFloat(transactions[0].amount) + (transactions[0].fees ? parseFloat(transactions[0].fees) : 0)
            : 0;

    const closingBalanceAmount = transactions.length > 0 ? parseFloat(transactions[transactions.length - 1].balance) : 0;

    // Calculate totals
    const creditTransactions = transactions.filter((t) => t.action === 'Cr');
    const debitTransactions = transactions.filter((t) => t.action === 'Dr');

    const creditTotal = creditTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const debitTotal = debitTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    // Bank charges
    const serviceFees = transactions
        .filter((t) => t.description?.toLowerCase().includes('fee') && t.action === 'Dr')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    const cashDepositFees = transactions
        .filter((t) => t.description?.toLowerCase().includes('cash deposit') && t.fees)
        .reduce((sum, t) => sum + parseFloat(t.fees!), 0);

    // For simplicity, set other fees to 0 or calculate if needed
    const cashHandlingFees = 0;
    const otherFees = 0;

    // Use the provided address
    const customerAddress = address || {};

    // Statement period (assume current month for 1 month)
    const currentDate = new Date();
    const fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - months + 1, 1);
    const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 31);

    const formatDate = (date: Date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    const statementPeriod = `${fromDate.getDate().toString().padStart(2, '0')} ${fromDate.toLocaleString('default', {
        month: 'long'
    })} ${fromDate.getFullYear()} to ${toDate.getDate().toString().padStart(2, '0')} ${toDate.toLocaleString('default', {
        month: 'long'
    })} ${toDate.getFullYear()}`;

    return {
        statement_info: {
            reference_number: `SMT${Math.random().toString().slice(2, 15)}`,
            issue_date: formatDate(currentDate),
            statement_period: statementPeriod,
            statement_date: formatDate(toDate),
            customer_name: accountHolder,
            customer_id: Math.random().toString().slice(2, 8),
            customer_address: customerAddress,
            account_number: accountNumber,
            account_type: 'Business Account',
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
            opening_balance: { amount: openingBalanceAmount.toFixed(2), action: openingBalanceAmount >= 0 ? 'Cr' : 'Dr' },
            closing_balance: { amount: closingBalanceAmount.toFixed(2), action: closingBalanceAmount >= 0 ? 'Cr' : 'Dr' },
            vat_inclusive: { amount: '0.00', action: null },
            total_vat_zar: { amount: '0.00', action: null }
        },
        bank_charges: {
            service_fees: { amount: serviceFees.toFixed(2), action: 'Dr' },
            cash_deposit_fees: { amount: cashDepositFees.toFixed(2), action: 'Dr' },
            cash_handling_fees: { amount: cashHandlingFees.toFixed(2), action: 'Dr' },
            other_fees: { amount: otherFees.toFixed(2), action: 'Dr' }
        },
        interest_rates: {
            credit_rate: 'Tiered',
            debit_rate: '24.00%'
        },
        transactions: transactions,
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
