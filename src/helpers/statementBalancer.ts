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
const MIN_DEPOSIT_BEFORE_PAYMENT = 0.3; // At least 30% deposit needed before large payments

/* -------------------- date helpers -------------------- */
const parseStatementDate = (s: string, fallback: Date) => {
    if (!s) return fallback;
    const [dd, mon, yy] = s.split(' ');
    if (!dd || !mon || !yy) return fallback;
    return new Date(`${dd} ${mon} 20${yy}`);
};

const formatDate = (date: Date): string => {
    return date
        .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
        })
        .replace(/ /g, ' ');
};

/* -------------------- REALISTIC TRANSACTION GENERATORS -------------------- */

function generateRealisticDeposit(amount: number, date: Date): Transaction {
    const source = pick(placeholder.deposits);
    const tx = cloneTx(source as any);

    tx.date = formatDate(date);
    tx.deposit = fmt(amount);
    tx.payment = '';

    // Replace placeholders in description if needed
    if (tx.mainDescription.includes('[DATE]')) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleDateString('en-GB', { month: 'short' });
        tx.mainDescription = tx.mainDescription.replace('[DATE]', `${day} ${month}`);
    }

    return tx;
}

function generateRealisticPayment(amount: number, date: Date): Transaction {
    // Filter out fees if amount > 999
    const availablePayments = amount > 999 ? placeholder.payments.filter((p) => !p.subDescription?.startsWith('FEE:')) : placeholder.payments;
    const source = pick(availablePayments);
    const tx = cloneTx(source as any);

    tx.date = formatDate(date);
    tx.payment = fmt(amount);
    tx.deposit = '';

    // Replace placeholders in description if needed
    if (tx.mainDescription.includes('[DATE]')) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleDateString('en-GB', { month: 'short' });
        tx.mainDescription = tx.mainDescription.replace('[DATE]', `${day} ${month}`);
    }

    if (tx.mainDescription.includes('[TIMESTAMP]')) {
        const timestamp = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
            .getDate()
            .toString()
            .padStart(2, '0')}T${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date
            .getSeconds()
            .toString()
            .padStart(2, '0')}`;
        tx.mainDescription = tx.mainDescription.replace('[TIMESTAMP]', timestamp);
    }

    // Use static amounts for bank fees
    if (tx?.subDescription?.startsWith('FEE:')) {
        const feeAmount = toNum(tx.payment || '0');
        if (feeAmount > 0) {
            tx.payment = fmt(feeAmount); // Keep original static fee amount
        }
    }

    return tx;
}

/* -------------------- REALISTIC DEPOSIT-PAYMENT CYCLE -------------------- */

function createRealisticDepositPaymentCycle(amount: number, date: Date, isDeposit: boolean, currentBalance: number): Transaction[] {
    const transactions: Transaction[] = [];

    if (isDeposit) {
        // For deposits, just create the deposit
        transactions.push(generateRealisticDeposit(amount, date));
    } else {
        // For payments, ensure we have enough balance

        // If payment is large relative to current balance, add a deposit first
        if (amount > currentBalance * 0.7) {
            // Need to add a deposit before making this payment
            const neededDeposit = amount * 1.2; // Deposit slightly more than needed

            // Add deposit a day or two before the payment
            const depositDate = new Date(date);
            depositDate.setDate(depositDate.getDate() - Math.floor(rand(1, 3)));

            transactions.push(generateRealisticDeposit(neededDeposit, depositDate));
        }

        // Then add the payment
        transactions.push(generateRealisticPayment(amount, date));
    }

    return transactions;
}

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

    /* -------------------- REALISTIC PROGRESSIVE CORRECTION -------------------- */

    if (Math.abs(delta) >= 0.01) {
        const daysSpan = (endDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
        const chunks = Math.min(Math.max(Math.ceil(daysSpan / 5), 4), 12);

        // Determine if we need more deposits or payments overall
        const isOverallDepositNeeded = delta > 0;
        let depositCount = 0;
        let paymentCount = 0;

        // Calculate how many deposits vs payments we need
        if (Math.abs(delta) > 5000) {
            // Large adjustment - need multiple transactions
            depositCount = isOverallDepositNeeded ? Math.max(2, Math.floor(chunks * 0.7)) : Math.floor(chunks * 0.3);
            paymentCount = chunks - depositCount;
        } else {
            // Small adjustment - mix of both
            depositCount = Math.floor(chunks / 2);
            paymentCount = chunks - depositCount;
        }

        // Ensure we have at least some deposits if we're making payments
        if (paymentCount > 0 && depositCount === 0) {
            depositCount = Math.max(1, Math.floor(chunks * 0.3));
            paymentCount = chunks - depositCount;
        }

        let remainingDelta = delta;

        // Create realistic deposit-payment pattern
        for (let i = 0; i < chunks; i++) {
            if (Math.abs(remainingDelta) < 0.1) break;

            // Determine if this should be a deposit or payment
            let isDeposit = false;
            if (isOverallDepositNeeded) {
                // We need deposits overall
                if (depositCount > 0) {
                    isDeposit = true;
                    depositCount--;
                } else {
                    isDeposit = false;
                    paymentCount--;
                }
            } else {
                // We need payments overall
                if (paymentCount > 0) {
                    isDeposit = false;
                    paymentCount--;
                } else {
                    isDeposit = true;
                    depositCount--;
                }
            }

            // Calculate amount for this transaction
            const maxAllowed = Math.max(MIN_TX_AMOUNT, runningBalance * MAX_SINGLE_TX_PCT);
            let rawAmount = Math.abs(remainingDelta / (chunks - i)) * rand(MIN_VARIANCE, MAX_VARIANCE);
            let amount = Math.min(rawAmount, maxAllowed);

            // For payments, ensure we don't exceed balance
            if (!isDeposit && amount > runningBalance) {
                // Need to add a deposit first
                const neededDeposit = amount * 1.3;
                const depositDate = new Date(fromDate.getTime() + rand(0.1, 0.9) * (endDate.getTime() - fromDate.getTime()));
                depositDate.setDate(depositDate.getDate() - 1); // Deposit a day earlier

                const depositTx = generateRealisticDeposit(neededDeposit, depositDate);
                depositTx.balance = fmt(runningBalance + neededDeposit);
                transactions.push(depositTx);
                runningBalance += neededDeposit;
                remainingDelta += neededDeposit;
            }

            // Generate transaction
            const date = new Date(fromDate.getTime() + rand(0.1, 0.9) * (endDate.getTime() - fromDate.getTime()));

            const newTransactions = createRealisticDepositPaymentCycle(amount, date, isDeposit, runningBalance);

            // Update balances for new transactions
            for (const tx of newTransactions) {
                if (tx.deposit) {
                    const depositAmount = toNum(tx.deposit);
                    runningBalance += depositAmount;
                    remainingDelta -= depositAmount;
                } else if (tx.payment) {
                    const paymentAmount = toNum(tx.payment);
                    runningBalance -= paymentAmount;
                    remainingDelta += paymentAmount;
                }
                tx.balance = fmt(runningBalance);
                transactions.push(tx);
            }
        }

        delta = remainingDelta;
    }

    /* -------------------- FINAL CONVERGENCE -------------------- */

    let finalDelta = Number((finalTarget - runningBalance).toFixed(2));

    // Small final adjustment if needed
    if (Math.abs(finalDelta) >= 0.01) {
        const isDeposit = finalDelta > 0;
        const amount = Math.abs(finalDelta);
        const date = endDate;

        const adjustmentTx = isDeposit ? generateRealisticDeposit(amount, date) : generateRealisticPayment(amount, date);

        adjustmentTx.balance = fmt(isDeposit ? runningBalance + amount : runningBalance - amount);
        transactions.push(adjustmentTx);
        runningBalance = isDeposit ? runningBalance + amount : runningBalance - amount;
        finalDelta = 0;
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
        if (!a.date || !b.date) return 0;
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

    /* -------------------- FINAL BALANCE VERIFICATION -------------------- */
    const finalBalance = runningBalance;
    const targetBalance = targetAvailableBalance ?? finalBalance;
    const finalDifference = targetBalance - finalBalance;

    if (Math.abs(finalDifference) >= 0.01) {
        // Add one final realistic adjustment
        const adjustmentAmount = Math.abs(finalDifference);
        const isDeposit = finalDifference > 0;
        const date = new Date(parseStatementDate(transactions[transactions.length - 1].date, endDate));

        const adjustmentTx = isDeposit ? generateRealisticDeposit(adjustmentAmount, date) : generateRealisticPayment(adjustmentAmount, date);

        adjustmentTx.balance = fmt(isDeposit ? finalBalance + adjustmentAmount : finalBalance - adjustmentAmount);
        transactions.push(adjustmentTx);
        runningBalance = isDeposit ? finalBalance + adjustmentAmount : finalBalance - adjustmentAmount;
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
            availableBalance: fmt(targetBalance)
        }
    };
}
