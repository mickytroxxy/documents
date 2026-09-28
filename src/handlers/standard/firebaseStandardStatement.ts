import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { generateStandardBankStatement } from './index';
import { StatementData, Transaction } from './types';
import { secrets } from '../../server';

const firebaseConfig = {
    apiKey: 'AIzaSyD0dJUBCtG1vt6b-xywAasSw4liwrASMXE',
    authDomain: 'standardbank-7c3ca.firebaseapp.com',
    projectId: 'standardbank-7c3ca',
    storageBucket: 'standardbank-7c3ca.firebasestorage.app',
    messagingSenderId: '909459531420',
    appId: '1:909459531420:web:3e7a9c304b87f24d382f59',
    measurementId: 'G-NDM6LNCDJ3'
};

// Initialize named Firebase App to avoid conflicts with other firebase instances
const standardApp = getApps().find((app) => app.name === 'standardBankApp') || initializeApp(firebaseConfig, 'standardBankApp');
const standardDb = getFirestore(standardApp);

/**
 * Helper to parse raw transaction amounts from Firebase into credit status and absolute float value.
 */
function parseAmount(amountVal: any, explicitCredit?: boolean): { isCredit: boolean; absVal: number } {
    if (typeof amountVal === 'number') {
        const isCredit = explicitCredit !== undefined ? explicitCredit : amountVal >= 0;
        return { isCredit, absVal: Math.abs(amountVal) };
    }
    const str = String(amountVal || '').trim();
    const hasMinus = str.includes('-');
    const hasPlus = str.includes('+');
    let isCredit = false;

    if (explicitCredit !== undefined) {
        isCredit = explicitCredit;
    } else if (hasPlus) {
        isCredit = true;
    } else if (hasMinus) {
        isCredit = false;
    } else {
        isCredit = true;
    }

    const cleanNum = parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
    return { isCredit, absVal: cleanNum };
}

/**
 * Helper to parse a Date object from various Firestore transaction date formats.
 */
function getTxDate(raw: any): Date {
    if (raw.createdAt) {
        if (typeof raw.createdAt.toDate === 'function') {
            return raw.createdAt.toDate();
        }
        if (typeof raw.createdAt.seconds === 'number') {
            return new Date(raw.createdAt.seconds * 1000);
        }
        if (raw.createdAt instanceof Date) {
            return raw.createdAt;
        }
        if (typeof raw.createdAt === 'number') {
            return new Date(raw.createdAt);
        }
    }
    if (raw.fullDate) {
        const parsed = new Date(raw.fullDate);
        if (!isNaN(parsed.getTime())) return parsed;
    }
    if (raw.date) {
        const parsed = new Date(raw.date);
        if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date(0);
}

/**
 * Helper to format Date object as "28 Sep 2026".
 */
function formatDateString(d: Date): string {
    if (!d || isNaN(d.getTime()) || d.getTime() === 0) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
}

/**
 * Express Handler to fetch user transactions by account number from Firebase
 * and generate a Standard Bank statement PDF.
 */
export const generateStandardBankStatementHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const accountNumberInput = (req.body?.accountNumber || req.query?.accountNumber) as string;

        if (!accountNumberInput) {
            res.status(400).json({
                status: 0,
                message: 'accountNumber is required in request body or query params'
            });
            return;
        }

        const targetAccNum = String(accountNumberInput).trim();
        const cleanTargetAccNum = targetAccNum.replace(/\s+/g, '').replace(/-/g, '');

        // Months parameter: default 1 month if not specified
        const monthsInput = req.body?.months || req.query?.months;
        const months = typeof monthsInput !== 'undefined' && !isNaN(Number(monthsInput)) ? Math.max(1, parseInt(String(monthsInput), 10)) : 1;

        // Search for user account document matching clean accountNumber
        const accountsSnap = await getDocs(collection(standardDb, 'accounts'));
        let foundAccount: any = null;
        let phoneNumber: string = '';

        for (const docSnap of accountsSnap.docs) {
            const data = docSnap.data();
            const accNum = String(data.accountNumber || '').replace(/\s+/g, '').replace(/-/g, '');
            if (accNum && accNum === cleanTargetAccNum) {
                foundAccount = data;
                phoneNumber = docSnap.id;
                break;
            }
        }

        // Fallback: search if accountNumberInput was directly passed as phoneNumber / doc ID
        if (!foundAccount) {
            const directDocRef = doc(standardDb, 'accounts', targetAccNum);
            const directDocSnap = await getDoc(directDocRef);
            if (directDocSnap.exists()) {
                foundAccount = directDocSnap.data();
                phoneNumber = directDocSnap.id;
            }
        }

        if (!foundAccount) {
            res.status(404).json({
                status: 0,
                message: `Account not found for provided account number: ${targetAccNum}`
            });
            return;
        }

        // Fetch transactions for this account
        const txRef = collection(standardDb, 'accounts', phoneNumber, 'transactions');
        let txSnap;
        try {
            const q = query(txRef, orderBy('createdAt', 'desc'));
            txSnap = await getDocs(q);
        } catch (err) {
            // Fallback without orderBy if index is unavailable
            txSnap = await getDocs(txRef);
        }

        // Parse documents and associate dates
        const parsedDocs = txSnap.docs.map((d) => ({
            raw: d.data(),
            dateObj: getTxDate(d.data())
        }));

        // Sort chronologically descending: NEWEST transactions on top, OLDEST at bottom
        parsedDocs.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

        // Calculate cutoff date based on requested `months`
        const now = new Date();
        const cutoffDate = new Date(now);
        cutoffDate.setMonth(now.getMonth() - months);

        // Filter transactions within requested months window
        const filteredDocs = parsedDocs.filter((item) => {
            if (item.dateObj.getTime() === 0) return true; // Keep if date could not be parsed
            return item.dateObj >= cutoffDate;
        });

        let totalPaymentsNum = 0;
        let totalDepositsNum = 0;

        const transactions: Transaction[] = filteredDocs.map((item) => {
            const raw = item.raw;
            const { isCredit, absVal } = parseAmount(raw.amount, raw.credit);

            const payment = !isCredit && absVal > 0 ? absVal.toFixed(2) : '';
            const deposit = isCredit && absVal > 0 ? absVal.toFixed(2) : '';

            if (!isCredit) {
                totalPaymentsNum += absVal;
            } else {
                totalDepositsNum += absVal;
            }

            let balanceStr = '';
            if (raw.runningBalance) {
                balanceStr = String(raw.runningBalance).replace(/R\s*/g, '').trim();
            } else if (raw.balance !== undefined) {
                balanceStr = String(raw.balance).replace(/R\s*/g, '').trim();
            } else {
                balanceStr = '0.00';
            }

            const formattedDate = item.dateObj.getTime() > 0 ? formatDateString(item.dateObj) : raw.date || raw.fullDate || '';

            return {
                date: formattedDate || raw.date || raw.fullDate || '',
                mainDescription: raw.title || raw.mainDescription || 'TRANSACTION',
                subDescription: raw.sub || raw.subDescription || '',
                payment,
                deposit,
                balance: balanceStr
            };
        });

        // Compute statement period
        let fromDate = formatDateString(cutoffDate);
        let toDate = formatDateString(now);

        if (filteredDocs.length > 0) {
            const newestDateObj = filteredDocs[0].dateObj;
            const oldestDateObj = filteredDocs[filteredDocs.length - 1].dateObj;

            if (oldestDateObj.getTime() > 0) {
                fromDate = formatDateString(oldestDateObj);
            }
            if (newestDateObj.getTime() > 0) {
                toDate = formatDateString(newestDateObj);
            }
        }

        if (req.body?.statementPeriod?.from) {
            fromDate = req.body.statementPeriod.from;
        }
        if (req.body?.statementPeriod?.to) {
            toDate = req.body.statementPeriod.to;
        }

        // Account holder formatting
        const titlePart = foundAccount.title ? `${foundAccount.title}.` : '';
        const nameParts = [titlePart, foundAccount.firstName, foundAccount.lastName].filter(Boolean).join(' ').trim();
        const accountHolder = req.body?.accountHolder || nameParts || 'ACCOUNT HOLDER';

        // Address formatting
        let address: string[] = ['3860 SUPERCHARGE STREET', 'DEVLAND', 'FREEDOM PARK 1811'];
        if (req.body?.address && Array.isArray(req.body.address)) {
            address = req.body.address;
        } else if (foundAccount.address) {
            if (Array.isArray(foundAccount.address)) {
                address = foundAccount.address;
            } else if (typeof foundAccount.address === 'string') {
                address = foundAccount.address.split(/,|\n/).map((s: string) => s.trim()).filter(Boolean);
            }
        }

        const productName = req.body?.productName || foundAccount.productName || 'MYMO ACCOUNT';

        const availableBalNum =
            typeof foundAccount.availableBalance === 'number'
                ? foundAccount.availableBalance
                : typeof foundAccount.latestBalance === 'number'
                ? foundAccount.latestBalance
                : 0;

        const statementData: StatementData = {
            accountNumber: foundAccount.accountNumber || targetAccNum,
            accountHolder,
            productName,
            address,
            statementPeriod: {
                from: fromDate,
                to: toDate
            },
            transactions,
            summary: {
                totalPayments: totalPaymentsNum.toFixed(2),
                totalDeposits: totalDepositsNum.toFixed(2),
                availableBalance: availableBalNum.toFixed(2)
            }
        };

        const cleanAccNoForPath = (foundAccount.accountNumber || targetAccNum).replace(/\s+/g, '');
        const accountFolder = path.resolve(`./files/${cleanAccNoForPath}`);
        if (!fs.existsSync(accountFolder)) {
            fs.mkdirSync(accountFolder, { recursive: true });
        }

        const outputFilePath = path.resolve(`${accountFolder}/bankstatement.pdf`);

        // Generate Standard Bank Statement PDF using generateStandardBankStatement
        const pdfPath = await generateStandardBankStatement(outputFilePath, statementData);

        const fileUrl = `${secrets?.BASE_URL}/${cleanAccNoForPath}/bankstatement.pdf`;

        res.status(200).json({
            status: 1,
            message: 'Standard Bank statement generated successfully',
            bankstatements: [fileUrl],
            data: {
                url: fileUrl,
                pdfPath,
                months,
                statementData
            }
        });
    } catch (error) {
        console.error('Error in generateStandardBankStatementHandler:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            status: 0,
            message: 'Failed to generate Standard Bank statement: ' + errorMessage
        });
    }
};
