import { amountToWords, calculatePAYE } from '../../helpers';
import { BankType, generateStatementData } from '../../helpers/openai';
import { generateBankStatement } from '../generateStatement';
import { StatementData } from './types';
import { TymeBankStatement } from '../tymebank/sample';

type PayslipRequestBody = {
    accountHolder: string;
    accountNumber: string;
    months: number;
    openBalance: number;
    availableBalance: number;
    salaryAmount: number;
    payDate: string; // day of the month salary is paid
    employeeID: string;
    paymentMethod: string;
    bankName: string;
    idNumber: string;
    taxReference: string;
    department: string;
    branchCode: string;
    companyName: string;
    companyAddress: string;
    companyEmail: string;
    companyTel: string;
    title: string;
    bankType: string;
    physicalAddress: string;
    isPayslipIncluded: string;
};
export const handleDocumentGeneration = async ({
    accountHolder,
    accountNumber,
    months,
    openBalance,
    availableBalance,
    salaryAmount,
    payDate,
    employeeID,
    paymentMethod,
    bankName,
    idNumber,
    taxReference,
    department,
    branchCode,
    companyName,
    companyAddress,
    companyEmail,
    companyTel,
    title,
    bankType,
    physicalAddress,
    isPayslipIncluded
}: PayslipRequestBody) => {
    const { paye, uif, net, totalDeductions } = calculatePAYE({ grossSalary: salaryAmount });

    const payslipData: any[] = [];
    const today = new Date();
    const paydayNum = parseInt(payDate);

    // Determine the anchor month: handle different pay day logic
    let anchorMonth = today.getMonth();
    let anchorYear = today.getFullYear();

    if (paydayNum === 1) {
        // If payday is the 1st, always pay next month
        // So current month's work should be paid next month (exclude current month from generation)
        anchorMonth -= 1;
        if (anchorMonth < 0) {
            anchorMonth = 11;
            anchorYear -= 1;
        }
    } else {
        // If payday is NOT the 1st, pay same month only if date has passed
        const thisMonthPayDate = new Date(anchorYear, anchorMonth, paydayNum);
        if (thisMonthPayDate > today) {
            // Pay date hasn't passed yet, exclude current month
            anchorMonth -= 1;
            if (anchorMonth < 0) {
                anchorMonth = 11;
                anchorYear -= 1;
            }
        }
        // If date has passed, include current month (no change to anchorMonth)
    }

    for (let i = 0; i < months; i++) {
        const slipMonth = anchorMonth - i;
        const normalizedMonth = ((slipMonth % 12) + 12) % 12;
        const slipYear = anchorYear + Math.floor(slipMonth / 12);

        const periodStart = new Date(slipYear, normalizedMonth, 1);
        const periodEnd = new Date(slipYear, normalizedMonth + 1, 0);

        // Pay date logic based on payday
        let salaryPayDate: Date;
        if (paydayNum === 1) {
            // If payday is 1st, pay NEXT month
            salaryPayDate = new Date(slipYear, normalizedMonth + 1, 1);
        } else {
            // If payday is not 1st, pay the SAME month
            salaryPayDate = new Date(slipYear, normalizedMonth, paydayNum);
        }

        const formatLong = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        const formatShort = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });

        const payslip = {
            payslipNumber: `PSL${salaryPayDate.getFullYear()}${String(salaryPayDate.getMonth() + 1).padStart(2, '0')}001`,
            payDate: formatLong(salaryPayDate),
            payPeriod: `${formatLong(periodStart)} - ${formatLong(periodEnd)}`,
            employee: {
                name: accountHolder,
                employeeNumber: employeeID,
                idNumber,
                taxReference,
                department,
                bankName,
                accountNumber,
                branchCode
            },
            employer: {
                name: companyName,
                registrationNumber: '2020/123456/07',
                address: companyAddress,
                email: companyEmail,
                phone: companyTel
            },
            income: [{ description: 'Basic Salary', amount: salaryAmount, ytd: salaryAmount * (i + 1) }],
            deductions: [
                { description: 'PAYE Tax', amount: paye, ytd: paye * (i + 1) },
                { description: 'UIF', amount: uif, ytd: uif * (i + 1) },
                { description: 'Medical Aid', amount: 0, ytd: 0 },
                { description: 'Pension Fund', amount: 0, ytd: 0 }
            ],
            totals: {
                grossPay: salaryAmount,
                totalDeductions,
                netPay: net,
                netPayInWords: amountToWords(net)
            },
            paymentDetails: {
                paymentMethod,
                paymentDate: formatLong(salaryPayDate),
                bankName,
                accountNumber,
                reference: `SALARY ${formatShort(salaryPayDate).toUpperCase()}`
            },
            leave: {
                annualLeave: {
                    opening: 15,
                    taken: 0,
                    accrued: (i + 1) * 1.25,
                    closing: 15 + (i + 1) * 1.25
                },
                sickLeave: {
                    opening: 30,
                    taken: 0,
                    closing: 30
                }
            },
            linkedToStatement: {
                statementAccount: accountNumber,
                transactionDate: formatShort(salaryPayDate),
                depositAmount: net,
                transactionDescription: `SALARY DEPOSIT - ${formatLong(periodStart).toUpperCase()}`
            }
        };

        payslipData.push(payslip);
    }
    // Add title to account holder name in the required format (e.g., "MR LAMECK NDHLOVU")
    const accountHolderWithTitle = title ? `${title.toUpperCase()} ${accountHolder.toUpperCase()}` : accountHolder.toUpperCase();

    const financialData = await generateStatementData({
        accountHolder: accountHolderWithTitle,
        accountNumber,
        months,
        openBalance,
        availableBalance,
        salaryAmount: net,
        payDate,
        physicalAddress,
        bankType: bankType as BankType,
        companyName
    });
    if (financialData.status && financialData.data?.statements) {
        // Pass the original availableBalance to ensure it's respected
        // Handle the case where we have a mixed array of StatementData | TymeBankStatement | CapitecBankStatement
        let statementDetails: StatementData | { statements: any[]; rawData: any } | TymeBankStatement[] | any;

        // Check if this is TymeBank data (array of statements) or Standard Bank data (single statement)
        if (bankType === 'TYMEBANK') {
            // For TymeBank, we need to create a raw data structure that generateBankStatement can handle
            statementDetails = {
                statements: financialData.data.statements,
                rawData: {
                    bankType: 'TYMEBANK',
                    accountHolder: accountHolderWithTitle,
                    accountNumber: accountNumber
                }
            };
        } else {
            // For standard banks and Capitec, use the first statement directly
            statementDetails = financialData.data.statements[0];
        }

        const results = await generateBankStatement({
            statementDetails,
            payslipData: isPayslipIncluded ? payslipData : [],
            availableBalance,
            bankType: bankType?.toUpperCase() as BankType,
            openBalance
        });
        return results;
    } else {
        return {
            status: 0,
            message: `Error could not generate statement`,
            bankstatementUrl: null
        };
    }
};
