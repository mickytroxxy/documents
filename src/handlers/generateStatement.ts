import path from 'path';
import fs from 'fs';
import { mkdirp } from 'mkdirp';
import { generatePayslipPDF } from './generatePayslip';
import { rebalanceStatement } from '../helpers/statementBalancer';
import { secrets } from '../server';
import { PayslipData, StatementData } from './standard/types';
import { generateStandardBankStatement } from './standard';
import { BankType } from '../helpers/openai';
import { generateTymeBankPDF } from './tymebank';
import { TymeBankStatement } from './tymebank/sample';
import { generateCapitecBankPDF } from './capitec';

// Helper: rebalance TymeBank statements to enforce opening balance and continuity
function rebalanceTymeStatements(statements: TymeBankStatement[], opening?: number): TymeBankStatement[] {
    const toNum = (v: any): number => {
        if (v === '-' || v === undefined || v === null) return 0;
        const n = typeof v === 'number' ? v : Number(String(v).replace(/[,\s]/g, ''));
        return isNaN(n) ? 0 : n;
    };
    const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

    const normalizeOpeningRow = (txs: TymeBankStatement['transactions'], openingBalance: number) => {
        if (!txs || !txs.length) return txs;
        const [first, ...rest] = txs;
        const isOpeningRow = typeof first.description === 'string' && first.description.toLowerCase().includes('opening balance');

        if (!isOpeningRow) return txs;

        return [
            {
                ...first,
                fees: '-',
                money_out: '-',
                money_in: '-',
                balance: round2(openingBalance)
            },
            ...rest
        ];
    };

    // Sort statements by end date ascending to ensure chronological order
    const parseDate = (s: string) => new Date(s);
    const sorted = [...statements].sort((a, b) => parseDate(a.statement_period.to).getTime() - parseDate(b.statement_period.to).getTime());

    let runningStart = typeof opening === 'number' ? opening : sorted[0]?.opening_balance ?? 0;

    return sorted.map((stmt) => {
        const txsWithOpening = normalizeOpeningRow(stmt.transactions, runningStart);

        let balance = round2(runningStart);
        const adjustedTxs: TymeBankStatement['transactions'] = [];

        for (const tx of txsWithOpening || []) {
            const moneyIn = toNum(tx.money_in);
            const moneyOut = toNum(tx.money_out);
            const fees = toNum(tx.fees);

            // If a debit would exceed available funds (opening + same-line money in), add a smart top-up first
            const totalDebit = moneyOut + fees;
            const availableForDebit = balance + moneyIn;
            if (totalDebit > availableForDebit) {
                const needed = round2(totalDebit - availableForDebit);
                const topUp: TymeBankStatement['transactions'][number] = {
                    ...tx,
                    description: 'Balance Top-up',
                    money_in: needed,
                    money_out: '-',
                    fees: '-',
                    balance: round2(balance + needed)
                };
                balance += needed;
                adjustedTxs.push(topUp);
            }

            balance += moneyIn;
            balance -= moneyOut;
            balance -= fees;

            adjustedTxs.push({ ...(tx as TymeBankStatement['transactions'][number]), balance: round2(balance) });
        }

        const opening_balance = round2(runningStart);
        const closing_balance = round2(balance);

        // Next month's opening is this month's closing
        runningStart = closing_balance;

        return {
            ...stmt,
            opening_balance,
            closing_balance,
            transactions: adjustedTxs
        } as TymeBankStatement;
    });
}

/**
 * Shared payslip generation per account folder.
 */
async function generatePayslipsForAccount(accountFolder: string, payslipData?: PayslipData[]): Promise<string[]> {
    if (!payslipData || !payslipData.length) return [];
    try {
        const urls: string[] = [];
        const payslipsToGenerate = Array.isArray(payslipData) ? payslipData : [payslipData];
        for (let i = 0; i < payslipsToGenerate.length; i++) {
            const payslip = payslipsToGenerate[i];
            if (payslip) {
                const pdfPath = await generatePayslipPDF(payslip, i, `${accountFolder}/payslip_${i + 1}.pdf`);
                urls.push(pdfPath);
                console.log(`Payslip ${i + 1} generated: ${pdfPath}`);
            }
        }
        return urls;
    } catch (error) {
        console.error('Error generating payslips:', error);
        return [];
    }
}

/**
 * Generate TymeBank statements (single or multi-month).
 */
async function generateTymeBankStatements({
    statements,
    accountFolder,
    openBalance,
    accountHolder,
    rawAccountNumber
}: {
    statements: TymeBankStatement[];
    accountFolder: string;
    openBalance?: number;
    accountHolder?: string;
    rawAccountNumber?: string;
}): Promise<{ statementFiles: string[]; statementPath?: string }> {
    const fixedStatements = rebalanceTymeStatements(statements, openBalance);
    mkdirp.sync(accountFolder);

    if (fixedStatements.length > 1) {
        const today = new Date();
        const statementFiles: string[] = [];
        for (let i = 0; i < fixedStatements.length; i++) {
            const statementData = fixedStatements[i];
            const monthDate = new Date(today);
            monthDate.setMonth(today.getMonth() - (fixedStatements.length - 1 - i));

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthNames[monthDate.getMonth()];
            const year = monthDate.getFullYear();

            const individualStatement = accountHolder
                ? ({
                      ...statementData,
                      account_holder: accountHolder,
                      account_details: {
                          ...statementData.account_details,
                          account_number: rawAccountNumber ?? statementData.account_details.account_number
                      }
                  } as TymeBankStatement)
                : statementData;

            const monthFileName = `bankstatement_${monthName}_${year}.pdf`;
            const monthOutputPath = path.resolve(`${accountFolder}/${monthFileName}`);

            console.log(`Generating TymeBank PDF for ${monthName} ${year} at ${monthOutputPath}`);
            await generateTymeBankPDF(individualStatement, monthOutputPath, {
                includeLegalText: i === fixedStatements.length - 1,
                includeClosingBorder: i === fixedStatements.length - 1,
                includeClosingRow: i === fixedStatements.length - 1
            });
            console.log(`Successfully generated PDF at ${monthOutputPath}`);

            if (fs.existsSync(monthOutputPath)) {
                console.log(`File exists: ${monthOutputPath}, size: ${fs.statSync(monthOutputPath).size} bytes`);
                statementFiles.push(monthFileName);
            } else {
                console.error(`File was not created: ${monthOutputPath}`);
            }
        }
        return { statementFiles };
    }

    // Single statement path
    const [single] = fixedStatements;
    const outputFilePath = path.resolve(`${accountFolder}/bankstatement.pdf`);
    const statementPath = await generateTymeBankPDF(single, outputFilePath, {
        includeLegalText: true,
        includeClosingBorder: true,
        includeClosingRow: true
    });
    return { statementFiles: [], statementPath };
}

/**
 * Generate Capitec statement.
 */
async function generateCapitecStatement({ statement, accountFolder }: { statement: any; accountFolder: string }): Promise<{ statementPath: string }> {
    const outputFilePath = path.resolve(`${accountFolder}/bankstatement.pdf`);
    const statementPath = await generateCapitecBankPDF(statement, outputFilePath);
    return { statementPath };
}

/**
 * Generate Standard bank statement.
 */
async function generateStandardStatement({
    statement,
    accountFolder,
    availableBalance,
    openBalance
}: {
    statement: StatementData;
    accountFolder: string;
    availableBalance?: number;
    openBalance?: number;
}): Promise<{ statementPath: string }> {
    const outputFilePath = path.resolve(`${accountFolder}/bankstatement.pdf`);
    const data = rebalanceStatement(statement, availableBalance, openBalance);
    const statementPath = await generateStandardBankStatement(outputFilePath, data);
    return { statementPath };
}

/**
 * Build payslip URL map.
 */
function mapPayslipUrls(accountNumber: string, payslipPaths: string[]): string[] {
    return payslipPaths.map((url) => {
        const fileName = path.basename(url);
        return `${secrets?.BASE_URL}/${accountNumber}/${fileName}`;
    });
}

/**
 * TymeBank flow: statements -> PDFs -> payslips.
 */
async function processTymeBank({
    statementDetails,
    payslipData,
    openBalance
}: {
    statementDetails: TymeBankStatement[] | { statements: any[]; rawData: any };
    payslipData?: PayslipData[];
    openBalance?: number;
}) {
    let statements: TymeBankStatement[];
    let accountNumber = '';
    let accountHolder: string | undefined;
    let rawAccountNumber: string | undefined;

    if ('statements' in statementDetails && 'rawData' in statementDetails) {
        const raw = statementDetails as { statements: any[]; rawData: any };
        statements = raw.statements as TymeBankStatement[];
        const { accountNumber: rawAcc, accountHolder: holder } = raw.rawData;
        rawAccountNumber = rawAcc;
        accountHolder = holder;
        accountNumber = rawAcc?.replace(/\s+/g, '') || '';
    } else {
        statements = statementDetails as TymeBankStatement[];
        accountNumber = statements[0]?.account_details?.account_number?.replace(/\s+/g, '') || '';
    }

    if (!accountNumber) throw new Error('Missing account number for TymeBank');

    const accountFolder = `./files/${accountNumber}`;
    mkdirp.sync(accountFolder);

    const { statementFiles, statementPath } = await generateTymeBankStatements({
        statements,
        accountFolder,
        openBalance,
        accountHolder,
        rawAccountNumber
    });

    const bankStatementUrls =
        statementFiles.length > 0
            ? statementFiles.map((fileName) => `${secrets?.BASE_URL}/${accountNumber}/${fileName}`)
            : statementPath
            ? [`${secrets?.BASE_URL}/${accountNumber}/${path.basename(statementPath)}`]
            : [];

    const payslipPaths = await generatePayslipsForAccount(accountFolder, payslipData);
    const payslipUrls = mapPayslipUrls(accountNumber, payslipPaths);

    return { bankStatementUrls, payslipUrls };
}

/**
 * Capitec flow: statement -> PDF -> payslips.
 */
async function processCapitecBank({
    statementDetails,
    payslipData,
    openBalance,
    availableBalance
}: {
    statementDetails: any | { statements: any[]; rawData: any };
    payslipData?: PayslipData[];
    openBalance?: number;
    availableBalance?: number;
}) {
    let statement: any;
    let accountNumber = '';

    if ('statements' in statementDetails && 'rawData' in statementDetails) {
        const raw = statementDetails as { statements: any[]; rawData: any };
        [statement] = raw.statements;
        accountNumber = raw.rawData?.accountNumber?.replace(/\s+/g, '') || '';
    } else {
        statement = statementDetails;
        accountNumber =
            statement?.account_details?.account_number?.replace(/\s+/g, '') || statement?.account_holder?.account_number?.replace(/\s+/g, '') || '';
    }

    if (!accountNumber) throw new Error('Missing account number for Capitec');

    // Override balances with provided values
    if (openBalance !== undefined) {
        statement.balances = statement.balances || {};
        statement.balances.opening_balance = openBalance;
    }
    if (availableBalance !== undefined) {
        statement.balances = statement.balances || {};
        statement.balances.closing_balance = availableBalance;
        statement.balances.available_balance = availableBalance;
    }

    // Recalculate transaction balances to match the provided balances
    if (statement.transaction_history && Array.isArray(statement.transaction_history)) {
        let currentBalance = openBalance !== undefined ? openBalance : statement.balances?.opening_balance || 0;
        statement.transaction_history.forEach((tx: any) => {
            // money_in is positive, money_out and fee are negative in the data
            currentBalance += tx.money_in || 0;
            currentBalance += tx.money_out || 0; // negative
            currentBalance += tx.fee || 0; // negative
            tx.balance = currentBalance;
        });
        // Adjust the last balance to match availableBalance if provided
        if (availableBalance !== undefined && statement.transaction_history.length > 0) {
            const lastTx = statement.transaction_history[statement.transaction_history.length - 1];
            lastTx.balance = availableBalance;
        }
    }

    const accountFolder = `./files/${accountNumber}`;
    mkdirp.sync(accountFolder);

    const { statementPath } = await generateCapitecStatement({ statement, accountFolder });
    const bankStatementUrls = statementPath ? [`${secrets?.BASE_URL}/${accountNumber}/${path.basename(statementPath)}`] : [];

    const payslipPaths = await generatePayslipsForAccount(accountFolder, payslipData);
    const payslipUrls = mapPayslipUrls(accountNumber, payslipPaths);

    return { bankStatementUrls, payslipUrls };
}

/**
 * Standard flow: statement -> PDF -> payslips.
 */
async function processStandardBank({
    statementDetails,
    payslipData,
    availableBalance,
    openBalance
}: {
    statementDetails: StatementData | { statements: any[]; rawData: any };
    payslipData?: PayslipData[];
    availableBalance?: number;
    openBalance?: number;
}) {
    let statement: StatementData;
    let accountNumber = '';

    if ('statements' in statementDetails && 'rawData' in statementDetails) {
        const raw = statementDetails as { statements: any[]; rawData: any };
        const { accountNumber: rawAcc, accountHolder } = raw.rawData;
        const [statementData] = raw.statements;
        statement = {
            ...statementData,
            accountNumber: rawAcc,
            accountHolder
        } as StatementData;
        accountNumber = rawAcc?.replace(/\s+/g, '') || '';
    } else {
        statement = statementDetails as StatementData;
        accountNumber = statement?.accountNumber?.replace(/\s+/g, '') || '';
    }

    if (!accountNumber) throw new Error('Missing account number for Standard');

    const accountFolder = `./files/${accountNumber}`;
    mkdirp.sync(accountFolder);

    const { statementPath } = await generateStandardStatement({
        statement,
        accountFolder,
        availableBalance,
        openBalance
    });
    const bankStatementUrls = statementPath ? [`${secrets?.BASE_URL}/${accountNumber}/${path.basename(statementPath)}`] : [];

    const payslipPaths = await generatePayslipsForAccount(accountFolder, payslipData);
    const payslipUrls = mapPayslipUrls(accountNumber, payslipPaths);

    return { bankStatementUrls, payslipUrls };
}

export const generateBankStatement = async ({
    statementDetails,
    payslipData,
    availableBalance,
    bankType,
    openBalance
}: {
    statementDetails: StatementData | TymeBankStatement[] | { statements: any[]; rawData: any };
    payslipData?: PayslipData[];
    availableBalance?: number;
    bankType: BankType;
    openBalance?: number;
}) => {
    try {
        let result: { bankStatementUrls: string[]; payslipUrls: string[] };

        if (bankType === 'TYMEBANK') {
            result = await processTymeBank({ statementDetails: statementDetails as any, payslipData, openBalance });
        } else if (bankType === 'CAPITEC') {
            result = await processCapitecBank({ statementDetails: statementDetails as any, payslipData, openBalance, availableBalance });
        } else {
            result = await processStandardBank({
                statementDetails: statementDetails as any,
                payslipData,
                availableBalance,
                openBalance
            });
        }

        return {
            status: 1,
            message: 'Documents generated successfully',
            bankstatements: result.bankStatementUrls,
            payslips: result.payslipUrls
        };
    } catch (error) {
        console.error('Error in generateBankStatement:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            status: 0,
            message: 'Something went wrong: ' + errorMessage,
            bankstatements: [],
            payslips: []
        };
    }
};
