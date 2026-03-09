import { CapitecBankStatement } from '../src/handlers/capitec/business/business_sample';

function fmt(n: number) {
    return n.toFixed(2);
}

function checkStatement(stmt: (typeof CapitecBankStatement)[0]) {
    console.log('Checking statement:', stmt.account.statementNumber, stmt.account.businessName);
    const opening = Number(stmt.balances.openingBalance || 0);
    let running = opening;
    let sumCredits = 0;
    let sumDebits = 0;
    let sumFees = 0;
    const errors: string[] = [];

    stmt.transactions.forEach((t, i) => {
        const amt = Number(t.amount || 0);
        const fees = Number(t.fees || 0);
        if (t.type === 'credit') sumCredits += amt;
        else sumDebits += amt; // debits are negative in the sample
        sumFees += fees;

        running = Number((running + amt).toFixed(2));

        const reported = Number(t.balanceAfter);
        if (Math.abs(reported - running) > 0.01) {
            errors.push(`Txn[${i}] balanceAfter mismatch: expected ${fmt(running)} reported ${fmt(reported)} description=${t.description}`);
        }
        if (reported < 0) {
            errors.push(`Txn[${i}] negative balance after transaction: ${fmt(reported)} description=${t.description}`);
        }
    });

    const computedClosing = Number((opening + sumCredits + sumDebits).toFixed(2));
    const reportedClosing = Number(stmt.balances.closingBalance || 0);

    console.log('Opening:', fmt(opening));
    console.log('Total Credits:', fmt(sumCredits));
    console.log('Total Debits:', fmt(sumDebits));
    console.log('Total Fees:', fmt(sumFees));
    console.log('Computed Closing:', fmt(computedClosing));
    console.log('Reported Closing:', fmt(reportedClosing));

    if (Math.abs(computedClosing - reportedClosing) > 0.01) {
        errors.push(`Closing balance mismatch: computed ${fmt(computedClosing)} vs reported ${fmt(reportedClosing)}`);
    }

    if (errors.length === 0) {
        console.log('OK — statement balances internally consistent.');
    } else {
        console.log('Issues found:');
        errors.forEach((e) => console.log('-', e));
    }
    console.log('----\n');
}

function main() {
    if (!CapitecBankStatement || CapitecBankStatement.length === 0) {
        console.error('No statements found in sample.');
        process.exit(1);
    }

    CapitecBankStatement.forEach(checkStatement);
}

main();
