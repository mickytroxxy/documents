import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSecretKeys } from '../../../helpers/api';
import { parseJSONResponse } from '../../../ai/shared';
import { BankStatement, Transaction } from './business_sample';
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
    console.log(`AI: Processing ${months} months, targetFinalClosingBalance: ${input.targetFinalClosingBalance}, openingBalance: ${input.openingBalance}`);

    const keys = await getSecretKeys();
    if (!keys?.length || !keys[0].DEEP_SEEK_API) {
        throw new Error('Gemini API key not found in database');
    }

    const genAI = new GoogleGenerativeAI(keys[0].DEEP_SEEK_API);
    const model = genAI.getGenerativeModel({
        model: 'gemini-3.1-pro-preview'
    });

    const periods = buildPeriods(months);
    console.log(`AI: Built ${periods.length} periods:`, periods.map(p => `${p.fromISO} to ${p.toISO}`));
    const statements: BankStatement[] = [];
    const raw: any[] = [];

    let runningOpening = round2(input.openingBalance);
    const totalDelta = input.targetFinalClosingBalance! - input.openingBalance;
    for (let i = 0; i < months; i++) {
        const period = periods[i];
        const monthlyDelta = totalDelta / months;

        const targetClosing = round2(
            runningOpening + monthlyDelta
        );


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

        const result = await model.generateContent(
            `Generate realistic South African BUSINESS bank statement data in valid JSON format only.\n\n${prompt}`
        );

        const content = result.response.text() || '{}';
        const parsed = parseJSONResponse(content);
        raw.push(parsed);

        const transactions = Array.isArray(parsed?.transactions) ? parsed.transactions : [];

        // Recompute balanceAfter for every transaction from scratch using the
        // AI's exact amount and fees values.
        // Rules enforced here (without patching any amounts):
        //   • fees are ALWAYS negative (bank charges) — if AI returned positive, negate it
        //   • a debit that would push the balance below 0 is dropped (opening balance is
        //     the current balance limit — no transaction can exceed it unless it is a credit)
        let runningBalance = runningOpening;
        let fixed = transactions
            .filter((t: Transaction) => {
                const amt = toNumber(t?.amount);
                const fee = t.fees !== undefined ? toNumber(t.fees) : 0;
                // Keep the transaction if it has a non-zero amount OR a non-zero fee
                return amt !== 0 || fee !== 0;
            })
            .reduce((acc: any[], t: any) => {
                // If the transaction is pure fee (like Monthly Service Fee), amount is 0/null.
                const rawAmount = t.amount;
                const amount = (rawAmount === null || rawAmount === undefined) ? null : toNumber(rawAmount);
                
                // Fees must ALWAYS be negative (debit). If AI returned positive, negate it.
                let fees: number | undefined = undefined;
                if (t.fees !== undefined) {
                    const rawFee = toNumber(t.fees);
                    fees = rawFee > 0 ? -rawFee : rawFee; // force negative
                }
                const feeVal = fees ?? 0;
                const amountVal = amount ?? 0;

                // Skip any debit that would push balance below 0.
                // Opening balance == current balance cap — no money-out can exceed it.
                if (amountVal < 0 && round2(runningBalance + amountVal + feeVal) < 0) {
                    return acc; // drop this transaction entirely — don't patch, don't insert
                }

                runningBalance = round2(runningBalance + amountVal + feeVal);
                
                // Keep the actual amount from the AI: if it's null (for fee only), it stays null
                acc.push({ ...t, amount: amount, fees, balanceAfter: runningBalance });
                return acc;
            }, []);
        
        console.log('Before fee patch, sample transactions:', fixed?.slice(-3).map((t: any) => ({ desc: t.description, ref: t.reference, amount: t.amount, fees: t.fees })));
        
        fixed = fixed?.map((t: Transaction) => {
            const isServiceFee = (t.reference?.toLowerCase().includes('service') || t.description?.toLowerCase().includes('service')) && 
                                 (t.reference?.toLowerCase().includes('fee') || t.description?.toLowerCase().includes('fee'));
            const isNotificationFee = (t.reference?.toLowerCase().includes('notification') || t.description?.toLowerCase().includes('notification')) &&
                                     (t.reference?.toLowerCase().includes('fee') || t.description?.toLowerCase().includes('fee'));
            
            if (isServiceFee) {
                console.log(`Patching Service Fee: desc='${t.description}', ref='${t.reference}'`);
                return { ...t, description: '', reference: 'Monthly Service Fee' };
            }
            if (isNotificationFee) {
                console.log(`Patching Notification Fee: desc='${t.description}', ref='${t.reference}'`);
                return { ...t, description: '', reference: 'Notification Fee' };
            }
            return t;
        });
        
        console.log('After fee patch, sample transactions:', fixed?.slice(-3).map((t: any) => ({ desc: t.description, ref: t.reference, amount: t.amount, fees: t.fees })));
        const closingBalance = round2(runningBalance);

        console.log(`AI Response: Generated closingBalance: ${closingBalance}, requested target: ${targetClosing}`);

        // Use fee totals from the AI if provided; otherwise sum from transactions.
        const aiFeeTotalAbs = parsed?.fees?.feeTotal !== undefined ? Math.abs(toNumber(parsed.fees.feeTotal)) : undefined;
        let feeTotal: number;
        let vatTotal: number;
        if (aiFeeTotalAbs !== undefined && aiFeeTotalAbs > 0) {
            feeTotal = aiFeeTotalAbs;
            vatTotal = parsed?.fees?.vatTotal !== undefined ? Math.abs(toNumber(parsed.fees.vatTotal)) : round2(feeTotal * 0.15);
        } else {
            feeTotal = 0;
            for (const t of fixed) {
                if (t.fees !== undefined) feeTotal = round2(feeTotal + Math.abs(toNumber(t.fees)));
            }
            vatTotal = round2(feeTotal * 0.15);
        }

        const statement: BankStatement = {
            ...parsed,
            account: {
                ...(parsed?.account || {}),
                accountNumber: input.accountNumber,
                accountType: input.accountType,
                businessName: input.businessName,
                statementNumber: String(statementNo).padStart(5, '0'),
                statementDate: stampDateISO,
                page: 1,
                totalPages: 1
            },
            balances: {
                openingBalance: runningOpening,
                closingBalance
            },
            fees: {
                feeTotal: -feeTotal,
                vatTotal: -vatTotal,
                vatRate: '15.00%'
            },
            address: input.address || parsed?.address || {},
            bankDetails: input.bankDetails || parsed?.bankDetails || {},
            transactions: fixed
        };

        // Chain: next month's opening = this month's closing
        runningOpening = closingBalance;

        statements.push(statement);
    }

    return { statements, raw };
};