import path from 'path';
import fs from 'fs';
import { mkdirp } from 'mkdirp';
import { Request, Response } from 'express';
import { secrets } from '../../../server';
import { BankStatement, Transaction } from './business_sample';
import { generateBusinessCapitecStatementsAI } from './ai';
import { createBusinessBankStatementHandler } from './business';
import { generateFinancialStatementFromPdf } from './financial';

export type GenerateBusinessBankStatementRequest = {
    bankName: string;
    months?: number;
    accountNumber: string;
    accountType: string;
    businessName: string;
    comment?: string;
    salaryDay: number;
    rentalDay: number;
    openingBalance: number;
    targetFinalClosingBalance?: number;
    address: BankStatement['address'];
    bankDetails: BankStatement['bankDetails'];
    // Financial statement generation fields

    financials?: {
        required: boolean;
        startDate: string;
        endDate: string;
        directorName?: string;
        accountingCompanyName?: string;
    };
};

// Helper function to merge multiple bank statements into one
const mergeBankStatements = (statements: BankStatement[]): BankStatement => {
    if (statements.length === 0) {
        throw new Error('No statements to merge');
    }

    if (statements.length === 1) {
        return statements[0];
    }

    // Collect all transactions from all statements
    let allTransactions: Transaction[] = [];
    for (const stmt of statements) {
        allTransactions = allTransactions.concat(stmt.transactions);
    }

    // Sort transactions by postDate
    allTransactions.sort((a, b) => {
        const dateA = new Date(a.postDate).getTime();
        const dateB = new Date(b.postDate).getTime();
        return dateA - dateB;
    });

    // Recalculate balances after sorting
    let runningBalance = allTransactions[0].balanceAfter - allTransactions[0].amount;
    for (const tx of allTransactions) {
        tx.balanceAfter = runningBalance + tx.amount;
        runningBalance = tx.balanceAfter;
    }

    // Get the first statement's account info as base
    const firstStmt = statements[0];
    const lastStmt = statements[statements.length - 1];

    // Calculate total fees
    let totalFee = 0;
    let totalVat = 0;
    for (const stmt of statements) {
        if (stmt.fees) {
            totalFee += Math.abs(stmt.fees.feeTotal || 0);
            totalVat += Math.abs(stmt.fees.vatTotal || 0);
        }
    }

    // Create merged statement
    const mergedStatement: BankStatement = {
        account: {
            ...firstStmt.account,
            statementDate: lastStmt.account.statementDate,
            statementNumber: '00001',
            page: 1,
            totalPages: 1
        },
        balances: {
            openingBalance: firstStmt.balances.openingBalance,
            closingBalance: lastStmt.balances.closingBalance
        },
        address: firstStmt.address,
        bankDetails: firstStmt.bankDetails,
        fees: {
            feeTotal: -totalFee,
            vatTotal: -totalVat,
            vatRate: '15.00%'
        },
        transactions: allTransactions
    };

    return mergedStatement;
};

export const generate_business_bank_statement = async (req: Request, res: Response) => {
    try {
        const {
            bankName,
            months = 1,
            accountNumber,
            accountType,
            businessName,
            comment,
            salaryDay,
            rentalDay,
            openingBalance,
            targetFinalClosingBalance,
            address,
            bankDetails,
            financials,
        } = (req.body || {}) as GenerateBusinessBankStatementRequest;

        if (!bankName || !accountNumber || !accountType || !businessName) {
            return res.status(400).json({ status: 0, message: 'Missing required fields: bankName, accountNumber, accountType, businessName' });
        }

        if (!address || !bankDetails) {
            return res.status(400).json({ status: 0, message: 'Missing required fields: address, bankDetails' });
        }

        const opening = Number(openingBalance);
        if (!Number.isFinite(opening)) {
            return res.status(400).json({ status: 0, message: 'openingBalance must be a number' });
        }

        const salary = Number(salaryDay);
        const rental = Number(rentalDay);
        if (!Number.isFinite(salary) || salary < 1 || salary > 31) {
            return res.status(400).json({ status: 0, message: 'salaryDay must be a number between 1 and 31' });
        }
        if (!Number.isFinite(rental) || rental < 1 || rental > 31) {
            return res.status(400).json({ status: 0, message: 'rentalDay must be a number between 1 and 31' });
        }

        const normalizedBankName = String(bankName).toUpperCase();
        if (normalizedBankName !== 'CAPITEC') {
            return res.status(400).json({ status: 0, message: 'Only CAPITEC business statements are supported for now' });
        }

        let monthsToGenerate = Number(months);
        
        if (financials?.required) {
            const start = new Date(financials.startDate);
            const end =  new Date();
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ status: 0, message: 'Invalid financials startDate or endDate' });
            }
            
            // Calculate months between start and end for the long statement
            const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
            monthsToGenerate = diffMonths > 0 ? diffMonths : 1;
            
            console.log(`Financials required: Generating ${monthsToGenerate} months from ${financials.startDate} to ${financials.endDate || end.toISOString().slice(0, 10)}`);
        }

        console.log(`Generating ${monthsToGenerate} month(s) of statements for ${normalizedBankName} business account ${accountNumber}`);
        
        const { statements } = await generateBusinessCapitecStatementsAI({
            bankName: normalizedBankName,
            months: monthsToGenerate,
            accountNumber: String(accountNumber),
            accountType: String(accountType),
            businessName: String(businessName),
            comment: comment ? String(comment) : undefined,
            salaryDay: salary,
            rentalDay: rental,
            openingBalance: opening,
            address,
            bankDetails,
            statementNumberStart: 10,
            targetFinalClosingBalance: targetFinalClosingBalance !== undefined ? Number(targetFinalClosingBalance) : undefined
        });

        // Write PDFs
        const folder = path.join(process.cwd(), 'files', 'business', normalizedBankName.toLowerCase(), String(accountNumber));
        mkdirp.sync(folder);

        const urls: string[] = [];
        const baseUrl = secrets?.BASE_URL;

        // Always create the monthly statements (based on months input
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            const filename = `Account Statement_${stmt.account.statementNumber}_${stmt.account.statementDate}.pdf`;
            const outPath = path.join(folder, filename);

            await createBusinessBankStatementHandler(outPath, stmt);

            if (fs.existsSync(outPath)) {
                urls.push(`${baseUrl}/business/${normalizedBankName.toLowerCase()}/${accountNumber}/${filename}`);
            }
        }

        // If financials.required is true, also create the long merged statement for Gemini
        if (financials?.required) {
            const mergedStatement = mergeBankStatements(statements);
            
            const startDateStr = financials.startDate;
            const endDateStr = financials.endDate || new Date().toISOString().slice(0, 10);
            const filename = `Financial Reference_${startDateStr}_to_${endDateStr}.pdf`;
            const outPath = path.join(folder, filename);

            await createBusinessBankStatementHandler(outPath, mergedStatement);

            if (fs.existsSync(outPath)) {
                urls.push(`${baseUrl}/business/${normalizedBankName.toLowerCase()}/${accountNumber}/${filename}`);
            }
            
            console.log(`Created long merged statement for financials: ${filename}`);
            
            // Generate comprehensive financial statement using Gemini
            try {
                // Generate financial statement from the merged PDF
                const financialResultPath = await generateFinancialStatementFromPdf(outPath,accountNumber, financials.accountingCompanyName, financials.directorName);
                
                if (fs.existsSync(financialResultPath)) {
                    const financialFilename = path.basename(financialResultPath);
                    // Copy to the business folder for easier access
                    const financialDestPath = path.join(folder, financialFilename);
                    fs.copyFileSync(financialResultPath, financialDestPath);
                    urls.push(`${baseUrl}/business/${normalizedBankName.toLowerCase()}/${accountNumber}/${financialFilename}`);
                    console.log(`Created comprehensive financial statement: ${financialFilename}`);
                }
            } catch (financialError) {
                console.error('Error generating financial statement:', financialError);
                // Don't fail the whole request if financial generation fails
            }
        }

        return res.status(200).json({
            status: 1,
            message: 'Business bank statements generated successfully',
            data: {
                bankName: normalizedBankName,
                months: statements.length,
                accountNumber,
                urls,
                statements
            }
        });
    } catch (error) {
        console.error('generate_business_bank_statement error:', error);
        return res.status(500).json({
            status: 0,
            message: 'Failed to generate business bank statement',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
