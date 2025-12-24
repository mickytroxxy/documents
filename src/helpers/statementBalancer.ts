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

const MAX_SINGLE_TX_PCT = 0.08;
const MIN_VARIANCE = 0.6;
const MAX_VARIANCE = 1.4;
const MIN_TX_AMOUNT = 50;

/* -------------------- date helpers -------------------- */

const parseStatementDate = (s: string, fallback: Date) => {
    if (!s) return fallback;
    const [dd, mon, yy] = s.split(' ');
    if (!dd || !mon || !yy) return fallback;
    return new Date(`${dd} ${mon} 20${yy}`);
};

/* -------------------- SAFE BALANCE PLACEHOLDERS -------------------- */
/* ONLY used for balancing – never merchants */

const SAFE_DEPOSIT = {
    date: '',
    mainDescription: 'PAYMENT RECEIVED',
    subDescription: 'PAYMENT FROM',
    deposit: '',
    payment: '',
    balance: ''
};

const SAFE_PAYMENT = {
    date: '',
    mainDescription: 'EFT PAYMENT',
    subDescription: 'PAYMENT TO',
    deposit: '',
    payment: '',
    balance: ''
};

/* -------------------- main function -------------------- */

export function rebalanceStatement(data: StatementData, targetAvailableBalance?: number, openBalance = 0): StatementData {
    const today = new Date();

    /* end date = today or yesterday */
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() - Math.floor(rand(0, 2)));

    const requestedFrom = new Date(data.statementPeriod.from);
    const rollingFrom = new Date(endDate);
    rollingFrom.setMonth(rollingFrom.getMonth() - 3);

    const fromDate = rollingFrom > requestedFrom ? rollingFrom : requestedFrom;

    /* remove opening balance artifacts */
    let transactions = data.transactions.filter((t) => !t.mainDescription.toUpperCase().includes('OPENING BALANCE'));

    /* initial recompute */
    let runningBalance = openBalance;
    for (const t of transactions) {
        runningBalance += toNum(t.deposit);
        runningBalance -= toNum(t.payment);
    }

    const finalTarget = targetAvailableBalance ?? runningBalance;
    let delta = Number((finalTarget - runningBalance).toFixed(2));

    /* -------------------- progressive correction -------------------- */

    if (Math.abs(delta) >= 0.01) {
        const daysSpan = (endDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);

        // More aggressive chunking for better distribution
        const chunks = Math.min(Math.max(Math.ceil(daysSpan / 5), 4), 12);
        let lastAmount = 0;

        for (let i = 0; i < chunks; i++) {
            if (Math.abs(delta) < 0.1) break; // More precise threshold

            const isLate = i >= chunks - 3; // Start being more aggressive earlier
            const maxAllowed = Math.max(MIN_TX_AMOUNT, runningBalance * (isLate ? 0.1 : MAX_SINGLE_TX_PCT));

            // More aggressive delta distribution
            let raw = (delta / (chunks - i)) * rand(MIN_VARIANCE * 0.8, MAX_VARIANCE * 1.2);

            let amount = Math.min(Math.abs(raw), maxAllowed);

            // Ensure we don't get stuck with similar amounts
            if (Math.abs(amount - lastAmount) < 30 && lastAmount > 0) {
                amount *= rand(0.5, 1.5);
            }

            // More precise rounding for better final balance
            amount = Math.max(MIN_TX_AMOUNT * 0.8, Math.round(amount * 100) / 100);

            if (delta < 0 && amount > runningBalance) {
                // If we can't make the payment, reduce it to what we can afford
                amount = runningBalance * 0.9;
                if (amount < MIN_TX_AMOUNT) break;
            }

            const date = new Date(fromDate.getTime() + rand(0.1, 0.9) * (endDate.getTime() - fromDate.getTime()));

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

    /* -------------------- FINAL CONVERGENCE (FIX) -------------------- */
    /* Multiple small, natural transactions – NEVER edit existing ones */

    let finalDelta = Number((finalTarget - runningBalance).toFixed(2));
    let safety = 0;

    // More aggressive final convergence with higher safety limit
    while (Math.abs(finalDelta) >= 0.01 && safety < 20) {
        const isDeposit = finalDelta > 0;

        // More precise amount calculation for final convergence
        let amount = Math.min(Math.abs(finalDelta), Math.max(5, runningBalance * (isDeposit ? 0.05 : 0.02)));

        // Ensure we get to exact target by using more precise rounding
        if (Math.abs(finalDelta) < 1) {
            amount = Math.abs(finalDelta); // Use exact remaining delta for small amounts
        } else {
            amount = Math.round(amount * 100) / 100;
        }

        if (!isDeposit && amount > runningBalance) {
            // If we can't make the payment, use what we have
            amount = runningBalance;
        }

        const tx = cloneTx(isDeposit ? SAFE_DEPOSIT : SAFE_PAYMENT);

        tx.date = endDate
            .toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
            })
            .replace(/ /g, ' ');

        if (isDeposit) {
            tx.deposit = fmt(amount);
            runningBalance += amount;
            finalDelta -= amount;
        } else {
            tx.payment = fmt(amount);
            runningBalance -= amount;
            finalDelta += amount;
        }

        tx.balance = fmt(runningBalance);
        transactions.push(tx);
        safety++;
    }

    // Final safety check - if we still have a tiny delta, adjust the last transaction
    if (Math.abs(finalDelta) >= 0.01 && transactions.length > 1) {
        const lastTxIndex = transactions.length - 1;
        const lastTx = transactions[lastTxIndex];

        if (lastTx.deposit && !lastTx.payment) {
            // It's a deposit transaction, adjust it
            const currentDeposit = toNum(lastTx.deposit);
            const adjustedDeposit = currentDeposit + finalDelta;
            if (adjustedDeposit > 0) {
                lastTx.deposit = fmt(adjustedDeposit);
                runningBalance += finalDelta;
            }
        } else if (lastTx.payment && !lastTx.deposit) {
            // It's a payment transaction, adjust it
            const currentPayment = toNum(lastTx.payment);
            const adjustedPayment = currentPayment - finalDelta;
            if (adjustedPayment > 0 && adjustedPayment <= runningBalance + toNum(lastTx.payment)) {
                lastTx.payment = fmt(adjustedPayment);
                runningBalance -= finalDelta;
            }
        }

        // Update the balance for the adjusted transaction
        lastTx.balance = fmt(runningBalance);
    }

    /* -------------------- opening balance row -------------------- */

    transactions.unshift({
        date: '',
        mainDescription: 'STATEMENT OPENING BALANCE',
        subDescription: '',
        deposit: '',
        payment: '',
        balance: fmt(openBalance)
    });

    /* -------------------- sort chronologically -------------------- */

    transactions.sort((a, b) => {
        if (a.mainDescription.includes('OPENING')) return -1;
        if (b.mainDescription.includes('OPENING')) return 1;
        return parseStatementDate(a.date, fromDate).getTime() - parseStatementDate(b.date, fromDate).getTime();
    });

    /* -------------------- recompute balances cleanly -------------------- */

    runningBalance = openBalance;
    for (let i = 1; i < transactions.length; i++) {
        const t = transactions[i];
        runningBalance += toNum(t.deposit);
        runningBalance -= toNum(t.payment);
        t.balance = fmt(runningBalance);
    }

    // Final verification and adjustment if needed
    const finalBalance = runningBalance;
    const targetBalance = targetAvailableBalance ?? finalBalance;
    const finalDifference = Math.abs(finalBalance - targetBalance);

    // If we're still not at the target, add one final adjustment transaction
    if (finalDifference >= 0.01) {
        const adjustmentAmount = targetBalance - finalBalance;
        const isDeposit = adjustmentAmount > 0;

        const adjustmentTx = cloneTx(isDeposit ? SAFE_DEPOSIT : SAFE_PAYMENT);
        adjustmentTx.date = endDate
            .toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
            })
            .replace(/ /g, ' ');

        if (isDeposit) {
            adjustmentTx.deposit = fmt(Math.abs(adjustmentAmount));
            adjustmentTx.payment = '';
        } else {
            adjustmentTx.payment = fmt(Math.abs(adjustmentAmount));
            adjustmentTx.deposit = '';
        }

        adjustmentTx.balance = fmt(targetBalance);
        transactions.push(adjustmentTx);
        runningBalance = targetBalance;
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
            availableBalance: fmt(targetBalance) // Use target balance to ensure exact match
        }
    };
}
