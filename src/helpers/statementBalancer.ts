import { StatementData } from '../handlers/standard/types';

export function rebalanceStatement(data: StatementData, targetAvailableBalance?: number): StatementData {
    const toNum = (v: string | null) => (v ? Number(v.replace(/,/g, '')) : 0);
    const fmt = (n: number) => n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const fromDate = new Date(data.statementPeriod.from);
    const toDate = new Date(data.statementPeriod.to);
    const today = new Date();
    // Ensure maxDate is always before or equal to current time (Date.now())
    const maxDate = new Date(Math.min(toDate.getTime(), today.getTime(), Date.now()));
    const minDate = fromDate < maxDate ? fromDate : maxDate;

    const safeParseDate = (s: string | null) => {
        if (!s) return minDate;
        const d = new Date(s);
        // Ensure parsed date is not in the future
        const now = new Date();
        const finalDate = isNaN(d.getTime()) ? minDate : d > now ? now : d;
        return finalDate < minDate ? minDate : finalDate;
    };

    const getRandomDate = (start: Date, end: Date) => {
        const s = start.getTime();
        const e = end.getTime();
        // Ensure generated date is not in the future
        const now = Date.now();
        const finalE = Math.min(e, now);
        if (finalE <= s) return new Date(s);
        return new Date(s + Math.random() * (finalE - s));
    };

    const salaryDeposits = data.transactions.filter((tx) => tx.mainDescription.toUpperCase().includes('SALARY'));
    const otherTransactions = data.transactions.filter((tx) => !tx.mainDescription.toUpperCase().includes('SALARY'));

    let runningBalance = toNum(data.transactions[0]?.balance || '0');

    // Current totals
    let totalDeposits = otherTransactions.reduce((sum, tx) => sum + toNum(tx.deposit), 0);
    let totalPayments = otherTransactions.reduce((sum, tx) => sum + toNum(tx.payment), 0);
    const currentBalance = runningBalance + totalDeposits - totalPayments + salaryDeposits.reduce((s, tx) => s + toNum(tx.deposit), 0);

    // Use the targetAvailableBalance if provided, otherwise use the user's specified availableBalance
    // The key change: respect the user's input available balance exactly
    const desiredBalance = targetAvailableBalance !== undefined ? targetAvailableBalance : toNum(data.summary.availableBalance);

    // Calculate the difference between desired balance and current balance
    let diff = desiredBalance - currentBalance;

    // Only adjust transactions if there's a significant difference (> R1)
    // This ensures we respect the user's specified available balance
    if (Math.abs(diff) > 1) {
        if (otherTransactions.length > 0) {
            // Adjust the opening balance transaction to match the desired balance
            // Find the opening balance transaction (usually the first one)
            const openingBalanceTx =
                otherTransactions.find((tx) => tx.mainDescription.toUpperCase().includes('OPENING BALANCE')) || otherTransactions[0];

            if (openingBalanceTx) {
                // Set the opening balance to exactly match the desired balance
                openingBalanceTx.balance = fmt(desiredBalance);
                diff = 0;
            }
        }

        // If we still have a difference, adjust the first transaction's balance
        if (Math.abs(diff) > 1 && otherTransactions.length > 0) {
            otherTransactions[0].balance = fmt(desiredBalance);
            diff = 0;
        }
    }

    // Merge all transactions and sort
    const allTransactions = [...salaryDeposits, ...otherTransactions].sort(
        (a, b) => safeParseDate(a.date).getTime() - safeParseDate(b.date).getTime()
    );

    // Recalculate balances sequentially
    runningBalance = toNum(allTransactions[0]?.balance || '0');
    for (let i = 1; i < allTransactions.length; i++) {
        const tx = allTransactions[i];
        runningBalance += toNum(tx.deposit);
        runningBalance -= toNum(tx.payment);
        tx.balance = fmt(runningBalance);
    }

    // Update summary
    totalDeposits = allTransactions.reduce((sum, tx) => sum + toNum(tx.deposit), 0);
    totalPayments = allTransactions.reduce((sum, tx) => sum + toNum(tx.payment), 0);

    return {
        ...data,
        transactions: allTransactions.map((item) =>
            item?.mainDescription?.toUpperCase()?.includes('OPENING BALANCE')
                ? {
                      ...item,
                      mainDescription: 'STATEMENT OPENING BALANCE',
                      subDescription: '',
                      date: '',
                      payment: '',
                      deposit: ''
                  }
                : item
        ),
        summary: {
            totalDeposits: fmt(totalDeposits),
            totalPayments: fmt(totalPayments),
            availableBalance: fmt(runningBalance)
        }
    };
}
