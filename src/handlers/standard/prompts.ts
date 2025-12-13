import { GenerateDocs } from '../../helpers/openai';
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
};

export const formStatementPrompt = ({
    accountHolder,
    payDate,
    accountNumber,
    months,
    openBalance,
    availableBalance,
    salaryAmount = 0,
    averageMonthlySpending = 8000
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

export const generateTymeBankPrompt = ({
    accountHolder,
    payDate,
    accountNumber,
    months = 3,
    openBalance,
    availableBalance,
    salaryAmount = 0,
    statementPeriod,
    currentMonth,
    totalMonths,
    openingBalance
}: GenerateDocs & {
    statementPeriod?: { from: string; to: string; generation_date: string };
    currentMonth?: number;
    totalMonths?: number;
    openingBalance?: number;
}) => {
    const currentDate = new Date();
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - (months - 1));

    let periodFrom = statementPeriod?.from || `01 ${fromDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;

    let periodTo =
        statementPeriod?.to ||
        currentDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

    let generationDate =
        statementPeriod?.generation_date ||
        currentDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

    return `You are a financial-data generator for TymeBank statements. Your goal is to create a bank statement that is convincing enough for a vehicle, house, or loan application. Produce strictly valid JSON with realistic, chronological, and fully balanced TymeBank transaction data.

IMPORTANT:
- Today's date is ${currentDate.toLocaleDateString('en-GB')}.
- All generated dates MUST be on or before today's date.
- All balances must recalculate correctly after each transaction.
- Use "–" (dash) instead of "0.00" in money_in, money_out, and fees fields when the value is zero.
- DO NOT include "Opening Balance" as a transaction in the transactions array.
- The opening_balance field should contain the starting balance, but there should be NO transaction with description "Opening Balance".
- The closing_balance is the FINAL AVAILABLE BALANCE and MUST equal the last transaction balance exactly.

====================================================
CRITICAL BALANCE ENFORCEMENT (NON-NEGOTIABLE)
====================================================
- At NO POINT may a transaction cause the balance to go negative.
- You are STRICTLY FORBIDDEN from creating a payment transaction
  where money_out is GREATER than the current running balance.
🚫 YOU ARE STRICTLY FORBIDDEN FROM:
• Making any payment that exceeds the CURRENT balance
• Allowing the balance to go negative at ANY point
• Creating a transaction that would cause insufficient funds
Example (FORBIDDEN):
- current balance: 1500
- attempted payment: 2000

This transaction MUST NOT exist.

If the balance is insufficient:
- Reduce the payment amount
- Delay the transaction to a later date
- OR omit the transaction entirely

Violating this rule makes the output INVALID.

====================================================
MONTHLY DATE BEHAVIOUR
====================================================
- Most monthly spending (utilities, groceries, rent, transfers)
  occurs between the 25th of one month and the 5th of the next month.
- Salary must still occur exactly on day ${payDate}.
- Rent must occur shortly AFTER salary and between the 1st–3rd.

Core Input Data:
- account_holder: "${accountHolder}"
- account_number: "${accountNumber}"
- statement_period_from: "${periodFrom}"
- statement_period_to: "${periodTo}"
- statement_period_generation_date: "${generationDate}"
- opening_balance: ${openingBalance?.toFixed(2) || openBalance.toFixed(2)}
- closing_balance: ${availableBalance.toFixed(2)}
- salary_amount: ${salaryAmount.toFixed(2)}, paid monthly on day ${payDate}
${currentMonth && totalMonths ? `- This is month ${currentMonth} of ${totalMonths} in the series` : ''}

Transaction Rules:
1. Start transactions from the FIRST day of the period, NOT with an opening balance transaction.
2. Include monthly salary deposits exactly on day ${payDate} of each month.
   - Salary description must be "Salary Deposit" (do NOT invent company names).
3. Include realistic spending categories: groceries, fuel, restaurants, clothing, transport, utilities, airtime, data, takeaways, online purchases, etc.
4. Include realistic merchant names used in South Africa.
5. Include bank-related transactions where appropriate (ATM withdrawal fees, immediate EFT fees, etc.).
6. Each month must contain AT LEAST 15 transactions and no more than 25 transactions.
7. NO future dates.
8. The running balance MUST be updated after every transaction.
9. The first transaction should NOT be "Opening Balance" - start with actual transactions.

MANDATORY RENT RULE (VERY IMPORTANT):
- Rent is MONEY OUT.
- Rent MUST occur EVERY month.
- Rent date must be between the 1st and 3rd.
- Rent must occur AFTER salary.
- Rent must be a fixed, consistent amount across all months.
- Rent must NEVER be labelled as income.

MANDATORY FEE RULE (VERY IMPORTANT):
TymeBank does NOT charge for card purchases.
TymeBank ONLY charges for SMS notifications.

Therefore:
- For EVERY purchase transaction (money_out),
  you MUST immediately generate a SECOND transaction object:

{
  "date": "same date",
  "description": "Fee: Transactional SMS Notification",
  "fees": "0.50",
  "money_out": "-",
  "money_in": "-",
  "balance": (previous balance - 0.50)
}

- DO NOT combine fees with the main purchase.
- The fee must ALWAYS appear as its own standalone transaction.

Additional TymeBank Fees You MAY apply (only when logically relevant):
- Cash withdrawal at SA ATM: R10 per R1,000 or part thereof
- Immediate EFT (PayShap): R7 per R1,000 (max R35)
- Flash voucher purchase fee: R7
- Cash deposit (till point): R10 per R1,000
- Debit card or debit order decline: R3

JSON STRUCTURE (return ONLY valid JSON in this exact structure):

{
  "bank": "TymeBank",
  "statement_type": "Monthly account statement",
  "account_holder": "${accountHolder}",
  "account_details": {
    "account_number": "${accountNumber}",
    "branch_code": "678910",
    "tax_invoice_number": "001",
    "vat_registration_number": "Not Provided"
  },
  "statement_period": {
    "from": "${periodFrom}",
    "to": "${periodTo}",
    "generation_date": "${generationDate}"
  },
  "account_type": "EveryDay account",
  "opening_balance": ${openingBalance?.toFixed(2) || openBalance.toFixed(2)},
  "transactions": [
    {
      "date": "DD MMM YYYY",
      "description": "Transaction description",
      "fees": "-",
      "money_out": "-",
      "money_in": "-",
      "balance": 0.00
    }
  ],
  "closing_balance": ${availableBalance.toFixed(2)},
  "summary": {
    "total_fees": 0.00,
    "total_money_out": 0.00,
    "total_money_in": 0.00
  },
  "bank_details": {
    "registered_name": "TymeBank Limited",
    "registration_number": "2015/246310/06",
    "fsp_number": "49140",
    "credit_provider_number": "NCRCP 10774",
    "address": "30 Jellicoe Avenue, Rosebank 2196",
    "website": "www.tymebank.co.za",
    "contact_number": "0860 999 119"
  },
  "pages": "1 of 1"
}

CRITICAL REQUIREMENTS:
- DO NOT include "Opening Balance" as a transaction.
- The closing balance MUST equal the final transaction balance.
- NO transaction may overdraw the account.
- All balances must be mathematically accurate.
- Output ONLY the JSON.`;
};
