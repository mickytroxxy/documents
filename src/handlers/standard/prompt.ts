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
    companyName,
    comment
}: FormStatementPrompt & { comment?: string }) => {
    const totalPayments = averageMonthlySpending * months;
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

    let prompt = `
You are a South African bank-statement generator.
Your output MUST be mathematically perfect, internally consistent,
and suitable for loan approval.
The user works at ${companyName} so your salary deposits mainDescription can include the name

================================================================
MAINDESCRIPTION AND SUBDESCRIPTION NAMING RULES (STRICT)
================================================================

mainDescription rules:
• CAN contain merchant names (e.g., "SHOPRITE", "ENGEN GARAGE")
• CAN contain transaction types (e.g., "MONTHLY RENTAL", "ATM WITHDRAWAL")
• CAN contain company names for salary deposits
• MUST be descriptive of the main transaction purpose

subDescription rules:
• MUST NOT contain merchant names like "Shoprite purchase" or "Engen garage"
• MUST follow standard bank statement requirements
• MUST use standardized formats only:
  - "PAYMENT TO" (for payments to recipients)
  - "PAYMENT FROM" (for payments received from)
  - "DEBIT CARD PURCHASE FROM" (for card purchases)
  - "DEBIT CARD PURCHASE" (for online purchases)
  - "AUTOBANK CASH DEPOSIT" (for ATM cash deposits)
  - "CASH WITHDRAWAL - [LOCATION]" (for ATM withdrawals)
  - "PREPAID MOBILE PURCHASE" (for airtime/data)
  - "FEE: [FEE_TYPE]" (for fees)

STRICT EXAMPLES:
• ✅ CORRECT: mainDescription: "SHOPRITE SPRINGS", subDescription: "DEBIT CARD PURCHASE FROM"
• ❌ WRONG: mainDescription: "SHOPRITE", subDescription: "SHOPRITE PURCHASE"
• ✅ CORRECT: mainDescription: "MONTHLY RENTAL", subDescription: "PAYMENT TO"
• ❌ WRONG: mainDescription: "RENT", subDescription: "RENT PAYMENT"
• ✅ CORRECT: mainDescription: "FEE: INTERNATIONAL TRANSACTION", subDescription: "FEE: INTERNATIONAL TRANSACTION"
• ❌ WRONG: mainDescription: "INTERNATIONAL FEE", subDescription: "TRANSACTION FEE"

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
If currentBalance < payment amount → YOU MUST ADD DEPOSITS FIRST TO COVER THE PAYMENT BEFORE MAKING THE PAYMENT.

IMPORTANT:
The balance of the LAST transaction MUST equal:
${availableBalance.toFixed(2)}

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

Payments outside this window should be occasional only.

================================================================
RENT (STRICTLY ENFORCED)
================================================================
Rent is MONEY LEAVING the account.

mainDescription examples:
• "MONTHLY RENTAL"
• "RENTAL PAYMENT"
• "RENT PAYMENT"

subDescription MUST ALWAYS BE:
"PAYMENT TO"

Rules:
• Occurs between the 1st and 3rd of each month
• Amount range: 2000–12000 (must be 20–40% of salary)
• SAME amount every month
• NEVER mark rent as income
• NEVER use "RENTAL INCOME"

Opening balance is treated as CURRENT balance.

================================================================
CARD PURCHASE CLASSIFICATION (MANDATORY)
================================================================

LOCAL CARD PURCHASE:
"DEBIT CARD PURCHASE FROM"

LOCAL ONLINE PURCHASE:
"DEBIT CARD PURCHASE"

INTERNATIONAL CARD PURCHASE:
"INT DEBIT CARD PURCHASE"

FOR EVERY INTERNATIONAL CARD PURCHASE:
Create the purchase, then immediately create:
payment: 11.83
mainDescription: "FEE: INTERNATIONAL TRANSACTION"
subDescription: "FEE: INTERNATIONAL TRANSACTION"

================================================================
ATM CASH & FEES (CRITICAL)
================================================================
ATM CASH DEPOSIT:
subDescription: "AUTOBANK CASH DEPOSIT"

AFTER EVERY ATM CASH DEPOSIT:
"CASH WITHDRAWAL FEE"

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
PROGRESSIVE BALANCING (ENFORCED, NATURAL)
================================================================
You MUST reach the final availableBalance gradually.

• Never fix the balance with one transaction
• Never repeat identical amounts consecutively
• Never create obvious “balancing” transactions
• Spread corrections across multiple realistic activities

By the FINAL transactions:
• Remaining difference must be very small
• Final transaction must appear routine
• Final balance MUST equal availableBalance

================================================================
BALANCE UPDATE ALGORITHM (MANDATORY)
================================================================
currentBalance = openingBalance

For EACH transaction:
• deposit → currentBalance += deposit
• payment → currentBalance -= payment
• transaction.balance = currentBalance

Payments must NEVER exceed currentBalance.

================================================================
FINAL SELF-CHECK (MANDATORY — DO NOT SKIP)
================================================================
Before returning JSON, YOU MUST:

1. Recalculate currentBalance from openingBalance
2. Iterate through ALL transactions in order
3. Recompute every transaction.balance
4. Confirm LAST transaction.balance === ${availableBalance.toFixed(2)}

❌ If NOT equal:
→ Adjust earlier realistic transactions
→ Recalculate balances
→ Repeat validation
→ ONLY return JSON when correct

================================================================
OUTPUT REQUIREMENTS
================================================================
• EXACTLY ${transactionCount} transactions
• Two decimal places
• NO currency symbols
• RETURN ONLY valid JSON
• Structure MUST match sampleStatementData EXACTLY

REFERENCE STRUCTURE:
${JSON.stringify(sampleStatementData, null, 2)}
`;

    if (comment) {
        prompt += `\n\nADDITIONAL USER REQUIREMENTS: ${comment}\n\nIMPORTANT: Even user requirements must follow the mainDescription/subDescription naming rules above. No merchant names in subDescription!`;
    }

    return prompt;
};
