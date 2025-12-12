// types.ts
export interface Transaction {
    date: string;
    mainDescription: string;
    subDescription?: string;
    payment: string;
    deposit: string;
    balance: string;
}

export interface StatementData {
    accountNumber: string;
    accountHolder: string;
    productName: string;
    address: string[];
    statementPeriod: {
        from: string;
        to: string;
    };
    transactions: Transaction[];
    summary: {
        totalPayments: string;
        totalDeposits: string;
        availableBalance: string;
    };
}

export interface TableConfig {
    rowHeight: number;
    headerHeight: number;
    fontSize: number;
    leftMargin: number;
    rightMargin: number;
    columnWidths: number[];
}

// payslipTypes.ts
export interface PayslipData {
    payslipNumber: string;
    payDate: string;
    payPeriod: string;

    employee: {
        name: string;
        employeeNumber: string;
        idNumber: string;
        taxReference: string;
        department: string;
        bankName: string;
        accountNumber: string;
        branchCode: string;
    };

    employer: {
        name: string;
        registrationNumber?: string;
        email?: string;
        phone?: string;
        address: string;
    };

    income: Array<{
        description: string;
        amount: number;
        ytd: number;
    }>;

    deductions: Array<{
        description: string;
        amount: number;
        ytd: number;
    }>;

    totals: {
        grossPay: number;
        totalDeductions: number;
        netPay: number;
        netPayInWords: string;
    };

    leave: {
        annualLeave: {
            opening: number;
            taken: number;
            accrued: number;
            closing: number;
        };
        sickLeave: {
            opening: number;
            taken: number;
            closing: number;
        };
    };

    paymentDetails: {
        paymentMethod: string;
        paymentDate: string;
        bankName: string;
        accountNumber: string;
        reference: string;
    };

    linkedToStatement: {
        statementAccount: string;
        transactionDate: string;
        depositAmount: number;
        transactionDescription: string;
    };
}
