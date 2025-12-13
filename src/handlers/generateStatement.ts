import path from 'path';
import fs from 'fs';
import { mkdirp } from 'mkdirp';
import { generatePayslipPDFs, generatePayslipPDF } from './generatePayslip';
import { rebalanceStatement } from '../helpers/statementBalancer';
import { secrets } from '../server';
import { PayslipData, StatementData } from './standard/types';
import { generateStandardBankStatement } from './standard';
import { BankType } from '../helpers/openai';
import { generateTymeBankPDF } from './tymebank';
import { TymeBankStatement } from './tymebank/sample';

// Helper: rebalance TymeBank statements to enforce opening balance and continuity
function rebalanceTymeStatements(statements: TymeBankStatement[], opening?: number): TymeBankStatement[] {
    const toNum = (v: any): number => {
        if (v === '-' || v === undefined || v === null) return 0;
        const n = typeof v === 'number' ? v : Number(String(v).replace(/[,\s]/g, ''));
        return isNaN(n) ? 0 : n;
    };
    const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

    // Sort statements by end date ascending to ensure chronological order
    const parseDate = (s: string) => new Date(s);
    const sorted = [...statements].sort((a, b) => parseDate(a.statement_period.to).getTime() - parseDate(b.statement_period.to).getTime());

    let runningStart = typeof opening === 'number' ? opening : sorted[0]?.opening_balance ?? 0;

    return sorted.map((stmt, idx) => {
        let balance = runningStart;
        const txs = (stmt.transactions || []).map((tx) => {
            balance += toNum(tx.money_in);
            balance -= toNum(tx.money_out);
            balance -= toNum(tx.fees);
            return { ...tx, balance: round2(balance) };
        });

        const opening_balance = round2(runningStart);
        const closing_balance = round2(balance);
        // Next month's opening is this month's closing
        runningStart = closing_balance;

        return {
            ...stmt,
            opening_balance,
            closing_balance,
            transactions: txs
        } as TymeBankStatement;
    });
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
        // Handle raw AI data structure
        let processedStatements: StatementData | TymeBankStatement[] | { statements: any[]; rawData: any };
        let accountNumber: string;
        let statementFiles: string[] = [];

        if ('statements' in statementDetails && 'rawData' in statementDetails) {
            // Raw AI data that needs processing
            const rawData = statementDetails as { statements: any[]; rawData: any };
            const { bankType: aiBankType, accountHolder, accountNumber: rawAccountNumber } = rawData.rawData;

            accountNumber = rawAccountNumber.replace(/\s+/g, '');
            const accountFolder = `./files/${accountNumber}`;
            mkdirp.sync(accountFolder);

            if (aiBankType === 'TYMEBANK') {
                // Process each TymeBank statement separately and create individual PDF files
                const today = new Date();
                statementFiles = [];

                // Enforce opening balance and continuity across months
                const fixedStatements = rebalanceTymeStatements(rawData.statements as TymeBankStatement[], openBalance);

                for (let i = 0; i < fixedStatements.length; i++) {
                    const statementData = fixedStatements[i];
                    const monthDate = new Date(today);
                    monthDate.setMonth(today.getMonth() - (fixedStatements.length - 1 - i));

                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthName = monthNames[monthDate.getMonth()];
                    const year = monthDate.getFullYear();

                    // Create individual statement for this month
                    const individualStatement = {
                        ...statementData,
                        account_holder: accountHolder,
                        account_details: {
                            ...statementData.account_details,
                            account_number: rawAccountNumber
                        }
                    } as TymeBankStatement;

                    // Generate PDF for this specific month
                    const monthFileName = `bankstatement_${monthName}_${year}.pdf`;
                    const monthOutputPath = path.resolve(`${accountFolder}/${monthFileName}`);

                    console.log(`Generating TymeBank PDF for ${monthName} ${year} at ${monthOutputPath}`);
                    await generateTymeBankPDF(individualStatement, monthOutputPath, {
                        includeLegalText: i === fixedStatements.length - 1,
                        includeClosingBorder: i === fixedStatements.length - 1,
                        includeClosingRow: i === fixedStatements.length - 1
                    });
                    console.log(`Successfully generated PDF at ${monthOutputPath}`);

                    // Check if file actually exists
                    if (fs.existsSync(monthOutputPath)) {
                        console.log(`File exists: ${monthOutputPath}, size: ${fs.statSync(monthOutputPath).size} bytes`);
                        statementFiles.push(monthFileName);
                    } else {
                        console.error(`File was not created: ${monthOutputPath}`);
                    }
                }

                // Return the array of statement files
                processedStatements = fixedStatements as TymeBankStatement[];
            } else {
                // Process standard bank statement from raw AI data
                const [statementData] = rawData.statements;
                processedStatements = {
                    ...statementData,
                    accountNumber: rawAccountNumber,
                    accountHolder: accountHolder
                } as StatementData;

                accountNumber = rawAccountNumber.replace(/\s+/g, '');
            }
        } else {
            // Already processed statements
            processedStatements = statementDetails as StatementData | TymeBankStatement[];
            if (Array.isArray(processedStatements)) {
                // TymeBankStatement array type - generate separate files for each
                accountNumber = (processedStatements as TymeBankStatement[])[0].account_details.account_number.replace(/\s+/g, '');
                const accountFolder = `./files/${accountNumber}`;
                mkdirp.sync(accountFolder);
                statementFiles = [];

                // Enforce opening balance and continuity across months
                const fixedStatements = rebalanceTymeStatements(processedStatements as TymeBankStatement[], openBalance);

                for (let i = 0; i < fixedStatements.length; i++) {
                    const statement = fixedStatements[i] as TymeBankStatement;
                    const monthDate = new Date();
                    monthDate.setMonth(monthDate.getMonth() - (fixedStatements.length - 1 - i));

                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthName = monthNames[monthDate.getMonth()];
                    const year = monthDate.getFullYear();

                    const monthFileName = `bankstatement_${monthName}_${year}.pdf`;
                    const monthOutputPath = path.resolve(`${accountFolder}/${monthFileName}`);

                    console.log(`Generating TymeBank PDF for ${monthName} ${year} at ${monthOutputPath}`);
                    await generateTymeBankPDF(statement, monthOutputPath, {
                        includeLegalText: i === fixedStatements.length - 1,
                        includeClosingBorder: i === fixedStatements.length - 1,
                        includeClosingRow: i === fixedStatements.length - 1
                    });
                    console.log(`Successfully generated PDF at ${monthOutputPath}`);

                    // Check if file actually exists
                    if (fs.existsSync(monthOutputPath)) {
                        console.log(`File exists: ${monthOutputPath}, size: ${fs.statSync(monthOutputPath).size} bytes`);
                        statementFiles.push(monthFileName);
                    } else {
                        console.error(`File was not created: ${monthOutputPath}`);
                    }
                }
            } else {
                // StatementData type
                accountNumber = (processedStatements as StatementData).accountNumber.replace(/\s+/g, '');
            }
        }

        // Ensure accountFolder is available for payslip generation
        const accountFolder = `./files/${accountNumber}`;
        mkdirp.sync(accountFolder);

        let statementPath = '';
        if (!statementFiles.length) {
            // Handle single statement case
            const outputFilePath = path.resolve(`${accountFolder}/bankstatement.pdf`);

            if (bankType === 'STANDARD') {
                const data = rebalanceStatement(processedStatements as StatementData, availableBalance, openBalance);
                statementPath = await generateStandardBankStatement(outputFilePath, data);
            } else if (!Array.isArray(processedStatements)) {
                // Safe type check before casting
                const fixed = rebalanceTymeStatements([processedStatements as unknown as TymeBankStatement], openBalance);
                const tymeStatement = fixed[0];
                statementPath = await generateTymeBankPDF(tymeStatement, outputFilePath, {
                    includeLegalText: true,
                    includeClosingBorder: true,
                    includeClosingRow: true
                });
            }
        }

        let payslipUrls: string[] = [];
        if (payslipData && payslipData.length > 0) {
            const customGeneratePayslipPDFs = async (payslipData?: PayslipData | PayslipData[]): Promise<string[]> => {
                try {
                    const urls: string[] = [];
                    const payslipsToGenerate = payslipData ? (Array.isArray(payslipData) ? payslipData : [payslipData]) : [];
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
            };
            payslipUrls = await customGeneratePayslipPDFs(payslipData);
            console.log('Payslip PDFs generated:', payslipUrls.length);
        }
        const payslipReturnUrls: { [key: string]: string } = {};
        payslipUrls.forEach((url, index) => {
            const fileName = path.basename(url);
            payslipReturnUrls[`payslip${index + 1}`] = `${secrets?.BASE_URL}/${accountNumber}/${fileName}`;
        });

        // Handle return value - use statementFiles if available, otherwise use single statementPath
        let bankStatementUrls: string[] = [];
        if (statementFiles.length > 0) {
            // Multiple statement files
            bankStatementUrls = statementFiles.map((fileName) => `${secrets?.BASE_URL}/${accountNumber}/${fileName}`);
        } else if (statementPath) {
            // Single statement file
            const bankStatementFileName = path.basename(statementPath);
            bankStatementUrls = [`${secrets?.BASE_URL}/${accountNumber}/${bankStatementFileName}`];
        }

        return {
            status: 1,
            message: 'Documents generated successfully',
            bankstatements: bankStatementUrls,
            payslips: Object.values(payslipReturnUrls)
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
