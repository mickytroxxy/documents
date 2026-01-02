import { GenerateDocs } from '../../ai/shared';
import { sampleStatementData } from './transactions';

export type FormStatementPrompt = {
    accountHolder: string;
    accountNumber: string;
    months: number;
    openBalance: number;
    availableBalance: number;
    payDate: any; // Day of month (1-31)
    salaryAmount?: number;
    includePayslip?: boolean;
    averageMonthlySpending?: number;
    physicalAddress: string;
    fromDate?: string;
    toDate?: string;
    companyName: string;
    rentAmount?: number;
    comment?: string;
};

export const formStatementPrompt = ({
    accountHolder,
    payDate,
    accountNumber,
    months,
    openBalance,
    availableBalance,
    salaryAmount = 0,
    averageMonthlySpending = 8000,
    physicalAddress,
    comment = ''
}: FormStatementPrompt) => {
    /**
     * =========================
     * CORE CALCULATIONS
     * =========================
     */

    // Total money leaving the account
    const totalPayments = averageMonthlySpending * months;

    /**
     * NON-NEGOTIABLE BALANCE LAW
     * openingBalance + totalDeposits - totalPayments = availableBalance
     */
    const totalDeposits = availableBalance - openBalance + totalPayments;

    const salaryTotal = salaryAmount * months;
    const otherDepositsNeeded = totalDeposits - salaryTotal;

    const transactionCount = 30 + months * 10;

    const currentDate = new Date();
    const currentDateStr = currentDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return `
You are a South African bank-statement generator.
Your output MUST be mathematically perfect, internally consistent,
and suitable for loan approval.

================================================================
ABSOLUTE DATE CONSTRAINT (HARD RULE)
================================================================
Current date: ${currentDateStr}

• ALL transaction dates MUST be on or before this date
• NO future dates
• Violating this rule INVALIDATES the output

================================================================
ACCOUNT FACTS (DO NOT CHANGE)
================================================================
accountHolder: "${accountHolder}"
accountNumber: "${accountNumber}"
periodMonths: ${months}
openingBalance: ${openBalance.toFixed(2)}

REQUIRED FINAL availableBalance (MUST MATCH EXACTLY):
${availableBalance.toFixed(2)}

================================================================
BALANCE INVARIANT (CRITICAL — DO NOT VIOLATE)
================================================================
openingBalance + totalDeposits - totalPayments = availableBalance

Use these EXACT totals:
• totalPayments: ${totalPayments.toFixed(2)}
• totalDeposits: ${totalDeposits.toFixed(2)}
• salaryTotal: ${salaryTotal.toFixed(2)}
• otherDepositsNeeded: ${otherDepositsNeeded.toFixed(2)}

🚫 YOU ARE STRICTLY FORBIDDEN FROM:
• Making any payment that exceeds the CURRENT balance
• Allowing the balance to go negative at ANY point
• Creating a transaction that would cause insufficient funds

THIS IS A HARD FAILURE CONDITION.
If currentBalance < payment amount → YOU MUST REDUCE THE PAYMENT.

================================================================
DATE & SALARY RULES
================================================================
• Date format: "DD MMM YY"
• Cover EXACTLY the last ${months} months
• Salary deposits occur on day ${payDate} of each month (if salaryAmount > 0)

================================================================
MONTHLY PAYMENT WINDOW (VERY IMPORTANT)
================================================================
Most recurring monthly payments MUST occur between:
• 25th of the current month
• and 5th of the following month

This applies to:
• Rent
• Utilities
• Subscriptions
• Insurance-like payments

Payments outside this window should be occasional only.

================================================================
RENT (STRICTLY ENFORCED)
================================================================
Rent is MONEY LEAVING the account.

mainDescription examples:
• "MONTHLY RENTAL"
• "RENTAL PAYMENT"

subDescription MUST ALWAYS BE:
"PAYMENT TO"

Rules:
• Occurs between the 1st and 3rd of each month
• Amount range: 4000–12000
• SAME amount every month
• NEVER mark rent as income
• NEVER use "RENTAL INCOME"

================================================================
CARD PURCHASE CLASSIFICATION (MANDATORY)
================================================================

LOCAL CARD PURCHASE (garage, shop, POS):
subDescription:
"DEBIT CARD PURCHASE FROM"

LOCAL ONLINE PURCHASE (Takealot, local ecommerce):
subDescription:
"DEBIT CARD PURCHASE"

INTERNATIONAL CARD PURCHASE (Google, Facebook, Amazon, Apple, Meta):
subDescription:
"INT DEBIT CARD PURCHASE"

FOR EVERY INTERNATIONAL CARD PURCHASE:
1️⃣ Create the purchase transaction
2️⃣ IMMEDIATELY AFTER create a FEE transaction:

payment: 11.83
mainDescription: "FEE: INTERNATIONAL TRANSACTION"
subDescription: "FEE: INTERNATIONAL TRANSACTION"
ALL SALARY DEPOSIT, incoming funds not through ATM deposits must have a subDescription of PAYMENT FROM.
================================================================
ATM CASH & FEES (CRITICAL)
================================================================

ATM CASH DEPOSIT:
mainDescription example:
"SPRINGS NEW 3 13H07 409266375" (must be unique)
subDescription:
"AUTOBANK CASH DEPOSIT"

AFTER EVERY ATM CASH DEPOSIT:
Create a TRAILING FEE transaction:

mainDescription: "CASH WITHDRAWAL FEE"
subDescription: "CASH WITHDRAWAL FEE"

ATM DEPOSIT FEE CALCULATION:
• 1200 → 31.80
• 2300 → 51.80
• Use proportional scaling for other values
• Round to 2 decimals

================================================================
AIRTIME PURCHASE
================================================================
Airtime purchase:
mainDescription:
"VAS00161296940 TELKM0658016132"
subDescription:
"PREPAID MOBILE PURCHASE"

IMMEDIATELY AFTER:
Fee transaction:
payment: 0.70
mainDescription: "FEE: PREPAID MOBILE PURCHASE"
subDescription: "FEE: PREPAID MOBILE PURCHASE"

================================================================
INCOMING MONEY RULES
================================================================
Incoming APP payment (NOT ATM):
subDescription:
"PAYSHAP PAYMENT FROM"
OR
"PAYMENT FROM"

mainDescription:
Sender name or reference

ATM deposits MUST NEVER use these labels.

================================================================
MINIMUM TRANSACTION COUNTS
================================================================
Salary deposits: ${months}
Rent payments: ${months}
Groceries: ${months * 3}
Fuel: ${months * 2}
ATM activity: ${months}
Utilities: ${months}
Entertainment: ${Math.floor(months * 1.5)}
Bank fees: ${months * 2}
Transfers: ${Math.floor(months * 0.5)}

================================================================
BALANCE UPDATE ALGORITHM (NON-NEGOTIABLE)
================================================================
currentBalance = openingBalance

For EACH transaction (chronological):
• if deposit > 0 → currentBalance += deposit
• if payment > 0 → currentBalance -= payment
• transaction.balance = currentBalance

🚫 At NO POINT may currentBalance drop below 0
🚫 Payments MUST NEVER exceed currentBalance

FINAL currentBalance MUST EQUAL:
${availableBalance.toFixed(2)}

================================================================
OUTPUT REQUIREMENTS
================================================================
• EXACTLY ${transactionCount} transactions
• Two decimal places only
• NO currency symbols
• RETURN ONLY valid JSON
• Structure MUST match sampleStatementData EXACTLY
USE ${physicalAddress} AS THE ACCOUNT HOLDER'S ADDRESS.
This is the format ['Address:', '3260 SUPER MEGA ST', 'Soweto Ext', 'Orlando', '1112', 'ZA'], split by commas.
STATEMENT PERIOD MUST BE IN THE FORMAT:
from: "DD MMM YYYY"
to: "DD MMM YYYY"

INCLUDE THIS ADDITIONAL COMMENT IN THE STATEMENT IF APPLICABLE. THIS IS ADDITIONAL CONTEXT FROM THE USER:
"${comment}"
REFERENCE STRUCTURE:
${JSON.stringify(sampleStatementData, null, 2)}

FINAL VALIDATION STEP (MANDATORY):
Before returning JSON:
✔ Validate running balance
✔ Validate no overdrafts
✔ Validate final balance EXACT MATCH
✔ Fix any violations BEFORE returning
`;
};
