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

            if (aiBankType === 'tymebank') {
                // Process each TymeBank statement separately and create individual PDF files
                const today = new Date();
                statementFiles = [];

                for (let i = 0; i < rawData.statements.length; i++) {
                    const statementData = rawData.statements[i];
                    const monthDate = new Date(today);
                    monthDate.setMonth(today.getMonth() - (rawData.statements.length - 1 - i));

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
                    await generateTymeBankPDF(individualStatement, monthOutputPath);
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
                processedStatements = rawData.statements as TymeBankStatement[];
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

                for (let i = 0; i < processedStatements.length; i++) {
                    const statement = processedStatements[i] as TymeBankStatement;
                    const monthDate = new Date();
                    monthDate.setMonth(monthDate.getMonth() - (processedStatements.length - 1 - i));

                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthName = monthNames[monthDate.getMonth()];
                    const year = monthDate.getFullYear();

                    const monthFileName = `bankstatement_${monthName}_${year}.pdf`;
                    const monthOutputPath = path.resolve(`${accountFolder}/${monthFileName}`);

                    console.log(`Generating TymeBank PDF for ${monthName} ${year} at ${monthOutputPath}`);
                    await generateTymeBankPDF(statement, monthOutputPath);
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
                const data = rebalanceStatement(processedStatements as StatementData, availableBalance);
                statementPath = await generateStandardBankStatement(outputFilePath, data);
            } else if (!Array.isArray(processedStatements)) {
                // Safe type check before casting
                const tymeStatement = processedStatements as unknown as TymeBankStatement;
                statementPath = await generateTymeBankPDF(tymeStatement, outputFilePath);
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
