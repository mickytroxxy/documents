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
    rentalDay: number;
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

const isWeekend = (d: Date) => {
    const day = d.getDay();
    return day === 0 || day === 6;
};

// Light-weight SA holiday approximation (fixed-date holidays only) to reduce obviously fake patterns.
// We deliberately do not implement complex "observed" logic; we just nudge off these dates.
const isCommonSAHoliday = (d: Date) => {
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const key = `${m}-${day}`;
    const fixed = new Set([
        '1-1', // New Year's Day
        '3-21', // Human Rights Day
        '4-27', // Freedom Day
        '5-1', // Workers' Day
        '6-16', // Youth Day
        '8-9', // National Women's Day
        '9-24', // Heritage Day
        '12-16', // Day of Reconciliation
        '12-25', // Christmas Day
        '12-26' // Day of Goodwill
    ]);
    return fixed.has(key);
};

const nextBusinessDayISO = (iso: string, maxSteps = 10) => {
    const d = parseISODate(iso);
    if (!d) return iso;
    let steps = 0;
    while ((isWeekend(d) || isCommonSAHoliday(d)) && steps < maxSteps) {
        d.setDate(d.getDate() + 1);
        steps++;
    }
    return isoDateOnly(d);
};

const clampToPeriodISO = (iso: string, fromISO: string, toISO: string) => {
    const d = parseISODate(iso);
    const from = parseISODate(fromISO);
    const to = parseISODate(toISO);
    if (!d || !from || !to) return iso;
    if (d < from) return fromISO;
    if (d > to) return toISO;
    return isoDateOnly(d);
};

const makeDayOfMonthISO = (periodToISO: string, dayOfMonth: number) => {
    const end = parseISODate(periodToISO);
    if (!end) return periodToISO;
    const y = end.getFullYear();
    const m = end.getMonth();
    const maxDay = new Date(y, m + 1, 0).getDate();
    const day = Math.min(Math.max(1, Math.floor(dayOfMonth)), maxDay);
    return isoDateOnly(new Date(y, m, day));
};

const isMonthEndISO = (toISO: string) => {
    const d = parseISODate(toISO);
    if (!d) return false;
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return isoDateOnly(last) === isoDateOnly(d);
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

const normalizeStatement = (stmt: any, openingBalance: number): BankStatement => {
    const rawTransactions = Array.isArray(stmt?.transactions) ? stmt.transactions : [];

    // Sorting prevents "scattered" looking dates and ensures balances are computed in time order.
    const sortedTransactions = [...rawTransactions].sort((a: any, b: any) => {
        const aPost = String(a?.postDate || '');
        const bPost = String(b?.postDate || '');
        if (aPost !== bPost) return aPost.localeCompare(bPost);
        const aTxn = String(a?.transactionDate || aPost);
        const bTxn = String(b?.transactionDate || bPost);
        if (aTxn !== bTxn) return aTxn.localeCompare(bTxn);
        return toNumber(a?.amount) - toNumber(b?.amount);
    });

    let balance = round2(openingBalance);
    const transactions: BankStatement['transactions'] = sortedTransactions.map((t: any) => {
        let amount = round2(toNumber(t?.amount));
        const fees = t?.fees === undefined ? undefined : round2(toNumber(t?.fees));

        const ref = String(t?.reference || '').toUpperCase();
        const isMandatory =
            ref.includes('SAGE PAYROLL') ||
            ref === 'RENT' ||
            ref === 'MONTHLY SERVICE FEE' ||
            ref === 'NOTIFICATION FEE';

        // Safety: never allow negative balance. If a non-mandatory debit would overdraw,
        // clamp its amount so the resulting balance is slightly above zero.
        if (!isMandatory && amount < 0) {
            const projected = round2(balance + amount + (fees ?? 0));
            if (projected < 0) {
                const targetMin = 50; // keep a small positive buffer
                const maxDebit = round2(balance + (fees ?? 0) - targetMin);
                amount = round2(-Math.max(0, maxDebit));
            }
        }

        balance = round2(balance + amount + (fees ?? 0));

        const type = amount >= 0 ? 'credit' : 'debit';

        return {
            postDate: String(t?.postDate || ''),
            transactionDate: String(t?.transactionDate || t?.postDate || ''),
            description: String(t?.description || ''),
            reference: t?.reference ? String(t.reference) : undefined,
            authId: t?.authId ? String(t.authId) : undefined,
            amount,
            fees,
            balanceAfter: balance,
            type
        };
    });

    const feeTotalValue = round2(transactions.reduce((s, t) => s + (t.fees || 0), 0));
    const vatTotalValue = round2(feeTotalValue * 0.15);

    const account = {
        accountNumber: String(stmt?.account?.accountNumber || ''),
        accountType: String(stmt?.account?.accountType || ''),
        businessName: String(stmt?.account?.businessName || ''),
        statementDate: String(stmt?.account?.statementDate || ''),
        statementNumber: String(stmt?.account?.statementNumber || ''),
        page: 1,
        totalPages: 1
    };

    return {
        account,
        balances: {
            openingBalance: round2(openingBalance),
            closingBalance: round2(balance)
        },
        address: stmt?.address || {},
        bankDetails: stmt?.bankDetails || {},
        fees: {
            feeTotal: feeTotalValue,
            vatTotal: vatTotalValue,
            vatRate: String(stmt?.fees?.vatRate || '15.00%')
        },
        transactions
    };
};

const enforceMonthEndFees = (
    transactions: any[],
    toISO: string
): any[] => {
    const postingDate = toISO;
    // Match business_sample.ts: description is empty and fee type is in `reference`, amount is negative.
    const required = [
        { reference: 'Monthly Service Fee', amount: -100.0 },
        { reference: 'Notification Fee', amount: -7.0 }
    ];

    const feeRefs = new Set(required.map((r) => r.reference.toLowerCase().trim()));

    // If this period is NOT month-end (e.g. current month up to today), fees must not appear mid-month.
    if (!isMonthEndISO(toISO)) {
        return (Array.isArray(transactions) ? transactions : []).filter((t) => {
            const ref = String(t?.reference || '').toLowerCase().trim();
            return !feeRefs.has(ref);
        });
    }

    // Normalize any AI-provided fee rows: force onto month-end and blank description.
    const refined = (Array.isArray(transactions) ? transactions : []).map((t) => {
        const ref = String(t?.reference || '').toLowerCase().trim();
        if (!feeRefs.has(ref)) return t;

        const amt = toNumber(t?.amount);
        return {
            ...t,
            postDate: postingDate,
            transactionDate: postingDate,
            description: '',
            amount: amt <= 0 ? amt : -Math.abs(amt),
            fees: undefined,
            type: 'debit'
        };
    });

    const hasFeeRef = (ref: string) =>
        refined.some((t) => String(t?.reference || '').toLowerCase().trim() === ref.toLowerCase().trim());

    const out = [...refined];
    for (const f of required) {
        if (!hasFeeRef(f.reference)) {
            out.push({
                postDate: postingDate,
                transactionDate: postingDate,
                reference: f.reference,
                authId: '',
                description: '',
                amount: f.amount,
                fees: undefined,
                type: 'debit'
            });
        }
    }

    // Deduplicate by reference so each fee appears once.
    const seen = new Set<string>();
    const deduped: any[] = [];
    for (let i = out.length - 1; i >= 0; i--) {
        const t = out[i];
        const ref = String(t?.reference || '').toLowerCase().trim();
        if (feeRefs.has(ref)) {
            if (seen.has(ref)) continue;
            seen.add(ref);
        }
        deduped.push(t);
    }

    return deduped.reverse();
};

const cleanReferenceNotDescription = (transactions: any[]) => {
    return (Array.isArray(transactions) ? transactions : []).map((t, idx) => {
        const description = sanitizeText(t?.description);
        const reference = sanitizeText(t?.reference);

        const refLower = reference.toLowerCase().trim();
        const isFeeRef = refLower === 'monthly service fee' || refLower === 'notification fee';
        if (isFeeRef) {
            return { ...t, description: '', reference };
        }

        if (!reference || reference.toLowerCase().trim() === description.toLowerCase().trim()) {
            return { ...t, reference: `INV-${String(300000 + idx)}` };
        }

        return t;
    });
};

const sanitizeText = (v: any) => {
    const s = String(v || '').trim();
    return s;
};

const sanitizePlaceholders = (transactions: any[]) => {
    const companies = [
        'Bidvest',
        'MTN',
        'Vodacom',
        'Takealot',
        'Shoprite',
        'Pick n Pay',
        'Sasol',
        'Woolworths',
        'Dis-Chem',
        'Clicks',
        'SARS',
        'Eskom',
        'City Power',
        'DHL',
        'FedEx'
    ];

    const payrollProviders = ['Sage Payroll', 'PaySpace', 'SimplePay', 'SARS EMP201'];

    const looksPlaceholder = (s: string) => {
        const x = s.toLowerCase();
        if (!x) return true;
        return (
            x.includes('client a') ||
            x.includes('client b') ||
            x.includes('client c') ||
            x.includes('company a') ||
            x.includes('company b') ||
            x.includes('company c') ||
            x.includes('test') ||
            x.includes('placeholder')
        );
    };

    return transactions.map((t, idx) => {
        const description = sanitizeText(t?.description);
        const reference = sanitizeText(t?.reference);

        const company = companies[idx % companies.length];
        const payroll = payrollProviders[idx % payrollProviders.length];

        const nextDesc = looksPlaceholder(description) ? `EFT ${company}` : description;
        const nextRef = looksPlaceholder(reference) ? `INV-${String(100000 + idx)}` : reference;

        // If AI emits "Client A" etc in a longer sentence, patch it too.
        const patchedDesc = nextDesc
            .replace(/client\s+[a-z]/gi, company)
            .replace(/company\s+[a-z]/gi, company);

        const patchedRef = nextRef
            .replace(/ref[_\s-]*[a-z0-9]+/gi, `REF-${String(900000 + idx)}`)
            .replace(/auth[_\s-]*id/gi, 'AUTH');

        // Keep explicit payroll/rent/fees text as-is.
        const forceKeep = ['notification fee', 'monthly service fee', 'rental', 'rent', 'payroll', 'salary'];
        const keep = forceKeep.some((k) => description.toLowerCase().includes(k));

        return {
            ...t,
            description: keep ? description : patchedDesc,
            reference: keep ? (reference || undefined) : (patchedRef || undefined),
            authId: t?.authId ? String(t.authId) : ''
        };
    });
};

const enforceScheduledTransactions = (p: {
    transactions: any[];
    fromISO: string;
    toISO: string;
    salaryDay: number;
    rentalDay: number;
}) => {
    const salaryISO = clampToPeriodISO(makeDayOfMonthISO(p.toISO, p.salaryDay), p.fromISO, p.toISO);
    const rentalISO = clampToPeriodISO(makeDayOfMonthISO(p.toISO, p.rentalDay), p.fromISO, p.toISO);

    // If statement period ends before scheduled day (partial current month), do not inject future-dated items.
    const salaryIsInRange = salaryISO <= p.toISO;
    const rentIsInRange = rentalISO <= p.toISO;

    const hasSalary = p.transactions.some((t) => {
        const d = String(t?.postDate || '');
        const desc = String(t?.description || '').toLowerCase();
        const amt = toNumber(t?.amount);
        return d.slice(0, 10) === salaryISO && (desc.includes('salary') || desc.includes('payroll')) && amt < 0;
    });

    const hasRent = p.transactions.some((t) => {
        const d = String(t?.postDate || '');
        const desc = String(t?.description || '').toLowerCase();
        return d.slice(0, 10) === rentalISO && (desc.includes('rent') || desc.includes('rental')) && toNumber(t?.amount) < 0;
    });

    const out = [...p.transactions];
    if (salaryIsInRange && !hasSalary) {
        out.push({
            postDate: salaryISO,
            transactionDate: salaryISO,
            description: 'Payroll Payment - Sage Payroll',
            reference: 'SAGE PAYROLL',
            authId: '',
            // Payroll is money out for a business account.
            amount: -85000,
            fees: undefined,
            type: 'debit'
        });
    }

    if (rentIsInRange && !hasRent) {
        out.push({
            postDate: rentalISO,
            transactionDate: rentalISO,
            description: 'Monthly Rental Payment',
            reference: 'RENT',
            authId: '',
            amount: -25000,
            fees: -3.5,
            type: 'debit'
        });
    }

    return out;
};

const normalizeDatesWithinPeriod = (transactions: any[], fromISO: string, toISO: string) => {
    return transactions.map((t) => {
        const ref = String(t?.reference || '').toUpperCase();
        const desc = String(t?.description || '').toLowerCase();
        const isMandatory =
            ref.includes('SAGE PAYROLL') ||
            ref === 'RENT' ||
            ref === 'MONTHLY SERVICE FEE' ||
            ref === 'NOTIFICATION FEE';

        const post = clampToPeriodISO(String(t?.postDate || toISO), fromISO, toISO);
        const txn = clampToPeriodISO(String(t?.transactionDate || post), fromISO, toISO);
        const postAdj = isMandatory ? post : nextBusinessDayISO(post);
        const txnAdj = isMandatory ? txn : nextBusinessDayISO(txn);
        return {
            ...t,
            postDate: clampToPeriodISO(postAdj, fromISO, toISO),
            transactionDate: clampToPeriodISO(txnAdj, fromISO, toISO)
        };
    });
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
            rentalDay: input.rentalDay,
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

        const withRulesApplied = {
            ...parsed,
            transactions: normalizeDatesWithinPeriod(
                cleanReferenceNotDescription(
                    sanitizePlaceholders(
                        enforceMonthEndFees(
                            enforceScheduledTransactions({
                                transactions: Array.isArray(parsed?.transactions) ? parsed.transactions : [],
                                fromISO: period.fromISO,
                                toISO: period.toISO,
                                salaryDay: input.salaryDay,
                                rentalDay: input.rentalDay
                            }),
                            period.toISO
                        )
                    )
                ),
                period.fromISO,
                period.toISO
            )
        };

        // Enforce our own continuity and balances regardless of AI mistakes.
        const normalized = normalizeStatement(
            {
                ...withRulesApplied,
                account: {
                    ...(withRulesApplied?.account || {}),
                    accountNumber: input.accountNumber,
                    accountType: input.accountType,
                    businessName: input.businessName,
                    statementNumber: String(statementNo).padStart(5, '0'),
                    // Stamp date must be the current date
                    statementDate: stampDateISO,
                    page: 1,
                    totalPages: 1
                },
                address: input.address || withRulesApplied?.address || {},
                bankDetails: input.bankDetails || withRulesApplied?.bankDetails || {}
            },
            runningOpening
        );

        // Chain balances: next month opens with this month closing.
        runningOpening = round2(normalized.balances.closingBalance);

        statements.push(normalized);
    }

    return { statements, raw };
};
