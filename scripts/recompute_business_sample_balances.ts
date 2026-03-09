import { CapitecBankStatement } from '../src/handlers/capitec/business/business_sample';

function clone(obj: any) {
    return JSON.parse(JSON.stringify(obj));
}

function recompute(stmt: any) {
    // move salary batch (reference SALARIES1204) to after final incoming payments
    const txs: any[] = clone(stmt.transactions);
    const salaryIdx = txs.findIndex((t) => t.reference === 'SALARIES1204');
    if (salaryIdx !== -1) {
        const [salary] = txs.splice(salaryIdx, 1);
        // append salary to the end (after existing txs)
        txs.push(salary);
    }

    let running = Number(stmt.balances.openingBalance || 0);
    const out: any[] = [];
    for (const t of txs) {
        running = Number((running + Number(t.amount || 0)).toFixed(2));
        const nt = { ...t, balanceAfter: running };
        out.push(nt);
    }

    // compute new closing
    const closing = Number(running.toFixed(2));
    return { transactions: out, closing };
}

function main() {
    const stmt = CapitecBankStatement[0];
    const res = recompute(stmt);
    console.log('NEW_CLOSING:', res.closing);
    console.log(JSON.stringify(res.transactions, null, 4));
}

main();
