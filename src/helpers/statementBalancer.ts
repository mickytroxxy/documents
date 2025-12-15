import { StatementData, Transaction } from '../handlers/standard/types';
import { placeholder } from '../handlers/standard/transactionplaceholder';

/* -------------------- helpers -------------------- */

const toNum = (v: string | null) => {
    if (!v) return 0;
    const n = Number(v.replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
};

const fmt = (n: number) =>
    n.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const cloneTx = (tx: Transaction): Transaction => ({
    ...tx,
    date: '',
    deposit: '',
    payment: '',
    balance: ''
});

/* -------------------- realism rules -------------------- */

const MAX_SINGLE_TX_PCT = 0.08; // 8% of balance
const LATE_PERIOD_DAYS = 10;
const MIN_VARIANCE = 0.6;
const MAX_VARIANCE = 1.4;

/* -------------------- main function -------------------- */

export function rebalanceStatement(data: StatementData, targetAvailableBalance?: number, openBalance = 0): StatementData {
    const today = new Date();

    /**
     * End date:
     * Use today (or yesterday) to show recent activity
     */
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() - rand(0, 1)); // today or yesterday

    /**
     * Start date:
     * Go back ~3 months from endDate,
     * but NEVER before statementPeriod.from
     */
    const requestedFrom = new Date(data.statementPeriod.from);

    const rollingFrom = new Date(endDate);
    rollingFrom.setMonth(rollingFrom.getMonth() - 3);

    const fromDate = rollingFrom > requestedFrom ? rollingFrom : requestedFrom;

    /* remove AI opening balance noise */
    let transactions = data.transactions.filter((t) => !t.mainDescription.toUpperCase().includes('OPENING BALANCE'));

    /* calculate base balance */
    let runningBalance = openBalance;
    transactions.forEach((t) => {
        runningBalance += toNum(t.deposit);
        runningBalance -= toNum(t.payment);
    });

    const finalTarget = targetAvailableBalance ?? runningBalance;
    let delta = finalTarget - runningBalance;

    /* -------------------- progressive correction -------------------- */

    if (Math.abs(delta) > 0.01) {
        const daysSpan = (endDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);

        const chunks = Math.min(Math.max(Math.ceil(daysSpan / 7), 3), 8);

        let lastAmount = 0;

        for (let i = 0; i < chunks; i++) {
            if (Math.abs(delta) < 5) break;

            const isLate = i >= chunks - 2;

            const maxAllowed = runningBalance * (isLate ? 0.04 : MAX_SINGLE_TX_PCT);

            let raw = delta / (chunks - i);
            raw *= rand(MIN_VARIANCE, MAX_VARIANCE);

            let amount = Math.min(Math.abs(raw), maxAllowed);

            /* prevent repetition */
            if (Math.abs(amount - lastAmount) < 50) {
                amount *= rand(0.7, 1.3);
            }

            amount = Math.max(50, Math.round(amount / 10) * 10);

            if (amount <= 0) continue;
            if (delta < 0 && amount > runningBalance) continue;

            const date = new Date(fromDate.getTime() + rand(0.2, 0.9) * (endDate.getTime() - fromDate.getTime()));

            const isDeposit = delta > 0;

            const source = isDeposit ? pick(placeholder.deposits) : pick(placeholder.payments);

            const tx = cloneTx(source as any);

            tx.date = date
                .toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit'
                })
                .replace(/ /g, ' ');

            if (isDeposit) {
                tx.deposit = fmt(amount);
                runningBalance += amount;
                delta -= amount;
            } else {
                tx.payment = fmt(amount);
                runningBalance -= amount;
                delta += amount;
            }

            tx.balance = fmt(runningBalance);
            lastAmount = amount;

            transactions.push(tx);
        }
    }

    /* -------------------- opening balance tx -------------------- */

    transactions.unshift({
        date: '',
        mainDescription: 'STATEMENT OPENING BALANCE',
        subDescription: '',
        deposit: '',
        payment: '',
        balance: fmt(openBalance)
    });

    /* -------------------- sort + rebalance -------------------- */

    const parseDate = (s: string) => (s ? new Date(s.replace(/(\d{2}) (\w{3}) (\d{2})/, '20$3-$2-$1')) : fromDate);

    transactions.sort((a, b) => {
        if (a.mainDescription.includes('OPENING')) return -1;
        if (b.mainDescription.includes('OPENING')) return 1;
        return parseDate(a.date).getTime() - parseDate(b.date).getTime();
    });

    runningBalance = openBalance;

    for (let i = 1; i < transactions.length; i++) {
        const t = transactions[i];
        runningBalance += toNum(t.deposit);
        runningBalance -= toNum(t.payment);
        t.balance = fmt(runningBalance);
    }

    /* -------------------- totals -------------------- */

    const totalDeposits = transactions.reduce((s, t) => s + toNum(t.deposit), 0);
    const totalPayments = transactions.reduce((s, t) => s + toNum(t.payment), 0);

    return {
        ...data,
        transactions,
        summary: {
            totalDeposits: fmt(totalDeposits),
            totalPayments: fmt(totalPayments),
            availableBalance: fmt(runningBalance)
        }
    };
}
