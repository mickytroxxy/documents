import { PayslipData, StatementData } from './types';

// Static opening balance

// generateStatement.ts (partial update - just the sample data)

export const payslipSample: PayslipData[] = [
    {
        payslipNumber: 'PSL202512001',
        payDate: '05 December 2025',
        payPeriod: '01 November 2025 - 30 November 2025',

        employee: {
            name: '',
            employeeNumber: '',
            idNumber: '',
            taxReference: '',
            department: '',
            bankName: '',
            accountNumber: '',
            branchCode: ''
        },

        employer: {
            name: '',
            registrationNumber: '',
            address: '',
            email: '',
            phone: ''
        },

        income: [
            {
                description: 'Basic Salary',
                amount: 25000.0,
                ytd: 275000.0
            },
            {
                description: 'Overtime',
                amount: 3000.0,
                ytd: 33000.0
            },
            {
                description: 'Bonus',
                amount: 5000.0,
                ytd: 55000.0
            }
        ],

        deductions: [
            {
                description: 'PAYE Tax',
                amount: 0,
                ytd: 0
            },
            {
                description: 'UIF',
                amount: 280.0,
                ytd: 3080.0
            },
            {
                description: 'Pension Fund',
                amount: 2000.0,
                ytd: 22000.0
            },
            {
                description: 'Medical Aid',
                amount: 1800.0,
                ytd: 19800.0
            }
        ],

        totals: {
            grossPay: 33000.0,
            totalDeductions: 9880.0,
            netPay: 23120.0,
            netPayInWords: 'Twenty three thousand one hundred and twenty rand only'
        },

        leave: {
            annualLeave: {
                opening: 15,
                taken: 2,
                accrued: 1.25,
                closing: 14.25
            },
            sickLeave: {
                opening: 30,
                taken: 1,
                closing: 29
            }
        },

        paymentDetails: {
            paymentMethod: 'Bank Deposit',
            paymentDate: '05 December 2025',
            bankName: 'Standard Bank',
            accountNumber: '10 4674 4888 2',
            reference: 'SALARY NOV2025'
        },

        linkedToStatement: {
            statementAccount: '10 4674 4888 2',
            transactionDate: '05 December 2025',
            depositAmount: 23120.0,
            transactionDescription: 'SALARY DEPOSIT - NOVEMBER 2025'
        }
    }
];

export const sampleStatementData: StatementData = {
    accountNumber: '10 4674 4888 1',
    accountHolder: 'MR. JOHNSON NDLOVU',
    productName: 'MYMOACC',
    address: ['Address:', '3860 SUPERCHARGER ST', 'Devland Ext', 'Freedom Park', '1832', 'ZA'],
    statementPeriod: {
        from: '08 Sep 2025',
        to: '07 Dec 2025'
    },
    transactions: [
        {
            date: '09 Sep 25',
            mainDescription: 'SHOPRITE SPRINGS',
            subDescription: '5190*6375 DEBIT CARD PURCHASE',
            payment: '850.50',
            deposit: '',
            balance: '4,149.50'
        }
    ],
    summary: {
        totalPayments: '',
        totalDeposits: '',
        availableBalance: ''
    }
};
