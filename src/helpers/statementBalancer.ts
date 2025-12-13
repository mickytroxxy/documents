import { StatementData } from '../handlers/standard/types';

export function rebalanceStatement(data: StatementData, targetAvailableBalance?: number, openBalance?: number): StatementData {
    const toNum = (v: string | null) => {
        if (!v) return 0;
        const num = Number(v.replace(/,/g, ''));
        return isNaN(num) ? 0 : num;
    };
    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const fromDate = new Date(data.statementPeriod.from);
    const toDate = new Date(data.statementPeriod.to);
    const today = new Date();
    const maxDate = new Date(Math.min(toDate.getTime(), today.getTime()));

    const safeParseDate = (s: string | null) => {
        if (!s) return fromDate;
        const d = new Date(s);
        return isNaN(d.getTime()) ? fromDate : d;
    };

    // Filter out any opening balance transactions from AI
    let transactions = data.transactions.filter((tx) => !tx.mainDescription.toUpperCase().includes('OPENING BALANCE'));

    // Calculate current balance based on provided transactions (without opening balance)
    let balanceFromTransactions = 0;
    transactions.forEach((tx) => {
        balanceFromTransactions += toNum(tx.deposit);
        balanceFromTransactions -= toNum(tx.payment);
    });

    const openingBalance = openBalance ?? 0;
    const calculatedFinalBalance = openingBalance + balanceFromTransactions;

    // If a target balance is provided, calculate and apply the adjustment
    if (targetAvailableBalance !== undefined) {
        const adjustment = targetAvailableBalance - calculatedFinalBalance;

        if (Math.abs(adjustment) > 0.005) {
            // Check if adjustment is non-trivial
            const adjustmentDate = new Date(maxDate);
            adjustmentDate.setDate(adjustmentDate.getDate() - 1); // Place adjustment before the last day

            transactions.push({
                date: adjustmentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, ' '),
                mainDescription: 'Balance Adjustment',
                subDescription: 'Correction to align with target balance',
                deposit: adjustment > 0 ? fmt(adjustment) : '',
                payment: adjustment < 0 ? fmt(Math.abs(adjustment)) : '',
                balance: '' // Will be recalculated
            });
        }
    }

    // Add the definitive opening balance transaction at the beginning
    transactions.unshift({
        date: '',
        mainDescription: 'STATEMENT OPENING BALANCE',
        subDescription: '',
        deposit: '',
        payment: '',
        balance: fmt(openingBalance)
    });

    // Sort all transactions chronologically, keeping opening balance at the top
    transactions.sort((a, b) => {
        if (a.mainDescription.toUpperCase().includes('OPENING BALANCE')) return -1;
        if (b.mainDescription.toUpperCase().includes('OPENING BALANCE')) return 1;
        return safeParseDate(a.date).getTime() - safeParseDate(b.date).getTime();
    });

    // Recalculate all balances sequentially and format amounts consistently
    let runningBalance = openingBalance;
    for (let i = 1; i < transactions.length; i++) {
        const tx = transactions[i];
        const depositNum = toNum(tx.deposit);
        const paymentNum = toNum(tx.payment);

        runningBalance += depositNum;
        runningBalance -= paymentNum;

        // Format fields: keep empties as empty strings
        tx.deposit = depositNum > 0 ? fmt(depositNum) : '';
        tx.payment = paymentNum > 0 ? fmt(paymentNum) : '';
        tx.balance = fmt(runningBalance);
    }

    // Final totals from the rebalanced transactions
    const totalDeposits = transactions.reduce((sum, tx) => sum + toNum(tx.deposit), 0);
    const totalPayments = transactions.reduce((sum, tx) => sum + toNum(tx.payment), 0);

    return {
        ...data,
        transactions: transactions,
        summary: {
            totalDeposits: fmt(totalDeposits),
            totalPayments: fmt(totalPayments),
            availableBalance: fmt(runningBalance) // This is now the targetAvailableBalance
        }
    };
}
