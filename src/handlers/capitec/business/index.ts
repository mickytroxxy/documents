import path from 'path';
import fs from 'fs';
import { mkdirp } from 'mkdirp';
import { Request, Response } from 'express';
import { secrets } from '../../../server';
import { BankStatement } from './business_sample';
import { generateBusinessCapitecStatementsAI } from './ai';
import { createBusinessBankStatementHandler } from './business';

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
            bankDetails
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

        const { statements } = await generateBusinessCapitecStatementsAI({
            bankName: normalizedBankName,
            months: Number(months),
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

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            const filename = `Account Statement_${stmt.account.statementNumber}_${stmt.account.statementDate}.pdf`;
            const outPath = path.join(folder, filename);

            await createBusinessBankStatementHandler(outPath, stmt);

            // Ensure file exists
            if (fs.existsSync(outPath)) {
                urls.push(`${baseUrl}/business/${normalizedBankName.toLowerCase()}/${accountNumber}/${filename}`);
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
