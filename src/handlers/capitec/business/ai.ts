import OpenAI from 'openai';
import { getSecretKeys } from '../../../helpers/api';
import { parseJSONResponse } from '../../../ai/shared';
import { BankStatement } from './business_sample';
import { formBusinessCapitecPrompt } from './prompt';

export type GenerateBusinessCapitecInput = {
    bankName: string;
    months: number;
    accountNumber: string;
    accountType: string;
    businessName: string;
    comment?: string;
    salaryDay: number;
    salaryAmount: number;
    rentalDay: number;
    rentalAmount: number;
    openingBalance: number;
    availableBalance?: number;
    address: BankStatement['address'];
    bankDetails: BankStatement['bankDetails'];
    statementNumberStart?: number;
    targetFinalClosingBalance?: number;
};

const toNumber = (v: any): number => {
    if (v === null || v === undefined) return 0;
    const n = typeof v === 'number' ? v : Number(String(v).replace(/[\s,]/g, ''));
    return Number.isFinite(n) ? n : 0;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const clampMonths = (m: any) => {
    const n = Number(m);
    if (!Number.isFinite(n)) return 1;
    return Math.min(24, Math.max(1, Math.floor(n)));
};

const isoDateOnly = (d: Date) => d.toISOString().slice(0, 10);

const parseISODate = (iso: string) => {
    const d = new Date(String(iso));
    return Number.isNaN(d.getTime()) ? null : d;
};



const buildPeriods = (months: number) => {
    const now = new Date();
    const todayISO = isoDateOnly(now);
    const currentMonthFromISO = isoDateOnly(new Date(now.getFullYear(), now.getMonth(), 1));
    const lastCompleteMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const periods: { fromISO: string; toISO: string }[] = [];

    // Last period is the current month up to today (so you see March activity on March 10).
    // Prior periods are full calendar months.
    if (months <= 1) {
        periods.push({ fromISO: currentMonthFromISO, toISO: todayISO });
        return periods;
    }

    for (let i = months - 2; i >= 0; i--) {
        const d = new Date(lastCompleteMonthEnd.getFullYear(), lastCompleteMonthEnd.getMonth() - i, 1);
        const from = new Date(d.getFullYear(), d.getMonth(), 1);
        const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        periods.push({ fromISO: isoDateOnly(from), toISO: isoDateOnly(to) });
    }

    periods.push({ fromISO: currentMonthFromISO, toISO: todayISO });

    return periods;
};


export const generateBusinessCapitecStatementsAI = async (input: GenerateBusinessCapitecInput): Promise<{
    statements: BankStatement[];
    raw: any[];
}> => {
    const months = clampMonths(input.months);

    const keys = await getSecretKeys();
    if (!keys?.length || !keys[0].DEEP_SEEK_API) {
        throw new Error('DeepSeek API key not found in database');
    }

    const deepseek = new OpenAI({
        apiKey: keys[0].DEEP_SEEK_API,
        baseURL: 'https://api.deepseek.com/v1'
    });

    const periods = buildPeriods(months);
    const statements: BankStatement[] = [];
    const raw: any[] = [];

    let runningOpening = round2(input.openingBalance);

    for (let i = 0; i < months; i++) {
        const period = periods[i];
        const isLast = i === months - 1;
        const targetClosing = isLast ? input.targetFinalClosingBalance : undefined;
        const statementNo = (input.statementNumberStart ?? 1) + i;

        const stampDateISO = isoDateOnly(new Date());

        const prompt = formBusinessCapitecPrompt({
            bankName: input.bankName,
            months,
            accountNumber: input.accountNumber,
            accountType: input.accountType,
            businessName: input.businessName,
            comment: input.comment,
            salaryDay: input.salaryDay,
            salaryAmount: input.salaryAmount,
            rentalDay: input.rentalDay,
            rentalAmount: input.rentalAmount,
            statementNumberStart: input.statementNumberStart,
            statementPeriod: period,
            openingBalance: runningOpening,
            targetClosingBalance: targetClosing,
            address: input.address || {},
            bankDetails: input.bankDetails || {},
            vatRate: '15.00%'
        });

        const completion = await deepseek.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: `Generate realistic South African BUSINESS bank statement data in valid JSON format only.`
                },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 8192
        });

        const content = completion.choices?.[0]?.message?.content || '{}';
        const parsed = parseJSONResponse(content);
        raw.push(parsed);

        const transactions = Array.isArray(parsed?.transactions) ? parsed.transactions : [];

        // Determine closing balance:
        // Prefer AI-provided balances; otherwise derive from transaction amounts/fees.
        const aiClosing = parsed?.balances?.closingBalance;
        const aiOpening = parsed?.balances?.openingBalance;

        let closingBalance: number | null = typeof aiClosing === 'number' ? aiClosing : null;

        // If the AI provided a closingBalance, trust it; else compute from the transactions.
        if (closingBalance === null) {
            let computed = runningOpening;
            for (const t of transactions) {
                const amount = toNumber(t?.amount);
                const fees = t?.fees === undefined ? 0 : toNumber(t?.fees);
                computed = round2(computed + amount + fees);
            }
            closingBalance = computed;
        }

        // Ensure transactions are passed through as authored by the AI.
        // If balanceAfter is missing, compute it for downstream consumers, but do not alter other fields.
        let runningBalance = runningOpening;
        const transactionsWithBalance = transactions.map((t: any) => {
            const amount = toNumber(t?.amount);
            const fees = t?.fees === undefined ? undefined : toNumber(t?.fees);
            runningBalance = round2(runningBalance + amount + (fees ?? 0));

            if (t?.balanceAfter === undefined || typeof t.balanceAfter !== 'number') {
                return {
                    ...t,
                    balanceAfter: runningBalance
                };
            }
            return t;
        });

        const statement: BankStatement = {
            ...parsed,
            account: {
                ...(parsed?.account || {}),
                accountNumber: input.accountNumber,
                accountType: input.accountType,
                businessName: input.businessName,
                statementNumber: String(statementNo).padStart(5, '0'),
                // Stamp date must be the current date
                statementDate: stampDateISO,
                page: 1,
                totalPages: 1
            },
            balances: {
                openingBalance: runningOpening,
                closingBalance: closingBalance ?? runningOpening
            },
            address: input.address || parsed?.address || {},
            bankDetails: input.bankDetails || parsed?.bankDetails || {},
            transactions: transactionsWithBalance
        };

        // Chain balances: next month opens with this month closing.
        runningOpening = closingBalance;

        statements.push(statement);
    }

    return { statements, raw };
};
