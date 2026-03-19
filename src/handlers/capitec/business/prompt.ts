import { Address, BankDetails } from './business_sample';

export type BusinessCapitecPromptParams = {
    bankName: string;
    months: number;
    accountNumber: string;
    accountType: string;
    businessName: string;
    comment?: string;
    salaryDay: number;
    salaryAmount: number;
    rentalDay: number;
    rentalAmount: number;
    statementNumberStart?: number;
    statementPeriod: { fromISO: string; toISO: string };
    openingBalance: number;
    targetClosingBalance?: number;
    address: Address;
    bankDetails: BankDetails;
    vatRate?: string;
};

export const formBusinessCapitecPrompt = (p: BusinessCapitecPromptParams) => {
    const vatRate = p.vatRate || '15.00%';
    const extraComment = p.comment ? `\n\nAdditional user context (optional):\n${p.comment}` : '';

    return `You are generating realistic South African BUSINESS bank statement JSON data for ${p.bankName}.

Return ONLY valid JSON (no markdown, no commentary) that matches this schema exactly:

{
  "account": {
    "accountNumber": string,
    "accountType": string,
    "businessName": string,
    "statementDate": string (ISO date, MUST be the current date / stamp date),
    "statementNumber": string,
    "page": 1,
    "totalPages": 1
  },
  "balances": {
    "openingBalance": number,
    "closingBalance": number
  },
  "address": {
    "line1": string,
    "line2": string,
    "line3": string,
    "province": string,
    "postalCode": string
  },
  "bankDetails": {
    "branch": string,
    "branchCode": string,
    "deviceCode": string,
    "telephone": string,
    "businessRegNo": string,
    "vatNo": string,
    "interestRate": string
  },
  "fees": {
    "feeTotal": number,
    "vatTotal": number,
    "vatRate": string
  },
  "transactions": [
    {
      "postDate": string (ISO date, must be between fromISO and toISO),
      "transactionDate": string (ISO date, must be between fromISO and toISO),
      "description": string,
      "reference": string,
      "authId": string,
      "amount": number (credits positive, debits negative),
      "fees": number (optional; if present, typically negative for debits),
      "type": "credit" | "debit"
    }
  ]
}

Important rules:
- Statement period: fromISO=${p.statementPeriod.fromISO} toISO=${p.statementPeriod.toISO}
- NO NEGATIVE BALANCES: the running balance must never go below zero at any point in the statement.
- Amounts must be realistic with decimal cents (e.g., 1234.56). Do not use whole numbers always like 10000, 100000, 50000 or unrealistic decimals.
- Salary and rent scheduling (these inputs never change across months):
  - Salary date: day ${p.salaryDay} of the month. This is a PAYROLL payout, so it MUST be a DEBIT (money out) on that exact day.
    - Salary amount: R${p.salaryAmount.toFixed(2)} (use this exact amount)
  - Rental date: day ${p.rentalDay} of the month. This MUST be a DEBIT (money out) on that exact day.
    - Rental amount: R${p.rentalAmount.toFixed(2)} (use this exact amount)
- Opening balance MUST be exactly: ${p.openingBalance}
- CRITICAL: The closing balance in your JSON output MUST be exactly ${p.targetClosingBalance}. This is mandatory and non-negotiable. Any other value will result in rejection.
- Do NOT allow the account to go into overdraft: the running balance must never be negative at any point in the transactions.
- Generate a funding-grade, realistic statement (typical SA business activity: EFTs, POS, supplier payments, SARS, rent, payroll, fuel, etc.).
- Provide 25 to 60 transactions.
- Dates must look real:
  - Some days have 0 transactions.
  - Some days have many transactions (more than 2) due to multiple customers and business activity.
  - Avoid weekends and avoid common South African public holidays as transaction dates.
- Descriptions and references MUST be realistic:
  - DO NOT use placeholders like "Client A", "Client B", "Company A", "Test", "Placeholder".
  - Use real-looking company/provider names (e.g., Mr Price, Real Estate names, industrial names, Takealot, Shoprite, Pick n Pay, DSTV, Eskom, DHL etc.).
  - References must look real (invoice numbers, EFT refs, merchant names) and not generic single letters.
- Salary and rent scheduling (these inputs never change across months):
  - Salary date: day ${p.salaryDay} of the month. This is a PAYROLL payout, so it MUST be a DEBIT (money out) on that exact day.
    - Salary amount: R${p.salaryAmount.toFixed(2)} (use this exact amount)
  - Rental date: day ${p.rentalDay} of the month. This MUST be a DEBIT (money out) on that exact day.
    - Rental amount: R${p.rentalAmount.toFixed(2)} (use this exact amount)
Use these fixed account/header details (copy them into the JSON exactly):
- accountNumber: ${p.accountNumber}
- accountType: ${p.accountType}
- businessName: ${p.businessName}

Use this address (copy exactly):
- line1: ${p.address.line1 || ''}
- line2: ${p.address.line2 || ''}
- line3: ${p.address.line3 || ''}
- province: ${p.address.province || ''}
- postalCode: ${p.address.postalCode || ''}

Use these bank details (copy exactly):
- branch: ${p.bankDetails.branch || ''}
- branchCode: ${p.bankDetails.branchCode || ''}
- deviceCode: ${p.bankDetails.deviceCode || ''}
- telephone: ${p.bankDetails.telephone || ''}
- businessRegNo: ${p.bankDetails.businessRegNo || ''}
- vatNo: ${p.bankDetails.vatNo || ''}
- interestRate: ${p.bankDetails.interestRate || ''}
═══════════════════════════════════════════════
STRICT FINANCIAL RECONCILIATION (MANDATORY)
═══════════════════════════════════════════════

You MUST strictly enforce this equation:

closingBalance = openingBalance + sum(all credits) - sum(all debits)

TARGET:
- Required closingBalance = ${p.targetClosingBalance}

STEP-BY-STEP INSTRUCTIONS (MANDATORY):

1. First, generate all transactions normally (realistic business activity).
2. Calculate the running balance after ALL transactions.
3. Compute the difference:

   difference = requiredClosingBalance - calculatedClosingBalance

4. ADD ONE FINAL ADJUSTMENT TRANSACTION as the LAST transaction:

   - If difference > 0:
     • Add a CREDIT transaction equal to difference
   - If difference < 0:
     • Add a DEBIT transaction equal to ABS(difference)

5. This adjustment transaction MUST:
   - Be the LAST transaction in the array
   - Have description: Use a realistic company name for money coming in or going out (e.g., "EFT Receipt: Takealot Pty Ltd" for credit or "Banking App Payment: Shoprite" for debit). NEVER mention "Adjustment", "Correction", "Balance" or any similar word in the description - just use a normal business transaction description with a real company name.
   - Have a realistic reference (e.g., "Ref12345", "Invoice67890", "Payment98765")
   - Have NO fees
   - Respect transaction date within the statement period

6. AFTER adding this adjustment:
   - The closing balance MUST EXACTLY equal ${p.targetClosingBalance}
   - No tolerance. No approximation. EXACT match required.
7. No future-dating: the transaction dates must be realistic and not all clustered at the end of the month. The adjustment transaction can be on the last day of the month, but do not make all transactions on that day.
8. Today is ${new Date().toISOString().split('T')[0]} (current date). Use realistic dates within the statement period, but do not future-date transactions beyond today.
9. CRITICAL: Check if the statement period END DATE (toISO=${p.statementPeriod.toISO}) falls on the actual last day of that month (28th for February, 30th for months with 30 days, 31st for months with 31 days). Only if it is the TRUE month-end date (28, 30, or 31 depending on the month), THEN include Monthly Service Fee and Notification Fee on that date. If the period ends BEFORE month-end (e.g., March 19, March 15, March 10, etc.), do NOT include these monthly fees - leave them out completely.

10. SALARY AND RENTAL - CONDITIONAL: The salary (day ${p.salaryDay}) and rental (day ${p.rentalDay}) transactions should only appear if the period INCLUDES those dates. If the period ends BEFORE the salary date (e.g., salary day is 25th but period ends on March 19), do NOT include the salary transaction. Similarly, if the period ends before the rental date, omit the rental transaction. These are only included if the period actually covers those dates.

FAILURE TO FOLLOW THIS WILL RESULT IN INVALID OUTPUT.

You MUST calculate the closing balance using this EXACT formula:
  closingBalance = openingBalance + sumOfAllCredits - sumOfAllDebits

For example:
  - If openingBalance = 1000
  - And total credits (money in) = 5000
  - And total debits (money out) = 2000
  - Then closingBalance = 1000 + 5000 - 2000 = 4000
═══════════════════════════════════════════════
AMOUNT FORMATTING RULES (MANDATORY)
═══════════════════════════════════════════════

All monetary values MUST include cents (2 decimal places).

CRITICAL DISTRIBUTION RULE:
- At least 80% of all transaction amounts MUST have NON-ZERO decimal values
  (e.g., 43739.74, 354.60, 12793.44)
- No more than 20% of transactions may use round amounts
  (e.g., 50000.00, 3000.00)

INVALID PATTERNS (DO NOT USE FREQUENTLY):
- Repeating .00 values across most transactions
- Repeating predictable decimals like .50, .25, .75
- Identical cent values across many transactions

VALID PATTERNS:
- Use varied and realistic cents such as:
  .13, .27, .44, .58, .63, .74, .89, etc.

ADDITIONAL RULES:
- Salary and rental amounts may remain exact as provided (even if .00)
- The Balance Adjustment transaction may use exact cents if required
- All other transactions MUST follow the distribution rule

FAILURE TO FOLLOW THIS DISTRIBUTION WILL RESULT IN INVALID OUTPUT.
CRITICAL REQUIREMENTS:
1. The closingBalance value in your JSON MUST be exactly: ${p.targetClosingBalance}
2. This is NOT optional - you MUST produce this exact value
3. If your calculated closing balance is NOT equal to ${p.targetClosingBalance}, adjust your transaction amounts to match
4. Your JSON output will be REJECTED if the closing balance does not match

════════════════════════════════════════════════════════════════════════════
FEE RULES PER TRANSACTION TYPE (EXACT)
════════════════════════════════════════════════════════════════════════════

Your JSON output will be REJECTED if the closing balance does not match
═══════════════════════════════════════════════

FEES ARE ALWAYS NEGATIVE. A positive fee value is WRONG and will break the statement.
Only include fees when the transaction type below specifies one. Omit the fees field entirely for transactions with no fee.

1. INTERNAL PAYMENTS (Capitec → Capitec bank account):
   • fee: -1.00
   • description examples: "Banking App Immediate Payment: Mdu Landlord" / "Banking App Payment: Love" / "Banking App Immediate Payment: Mr Ms Mkhari"

2. EXTERNAL PAYMENTS (Capitec → Other bank):
   • If description contains "Immediate": fee = -6.00
   • If description does NOT contain "Immediate": fee = -1.00
   • description examples: "Banking App Immediate Payment: Manyelani" (fee -6), "Banking App Payment: Toni (ABSA)" (fee -1)

3. DEBIT ORDERS (max 2 per month):
   • Successful: fee = -3.00
   • Failed (insufficient funds, occasional): fee = -6.00
   • description: "Registered Debit Order: CarTrack (2121827)" / "Registered Debit Order: Outsurance (45821)"

4. CARD SUBSCRIPTIONS (max 2 per month):
   • fee: -2.00 or -3.00
   • description: "Recurring Card Purchase: Microsoft 365" / "Recurring Card Purchase: Adobe Cloud"
   • Suitable SaaS/subscriptions for an IT business: Microsoft 365, Adobe Creative Cloud, AWS, Google Workspace, Zoom, Salesforce, Xero, Sage Business Cloud

5. CASH WITHDRAWALS:
   • fee: -10.00 (fee: -40.00 for withdrawals >= R4,000)
   • description: "ATM Cash Withdrawal: Sandton Za" or similar SA location

6. CASH DEPOSITS:
   • fee: -7.00 (small), -10.50 (medium), -14.00 (large)
   • description: "Cash Deposit: Centurion" or similar

7. EFT RECEIPTS / APP TRANSFERS (money IN from clients — ZERO fees):
   • fees: DO NOT include a fees field. Inbound EFTs and app transfers NEVER attract fees.
   • description: Use real SA company names relevant to the business type described in the comment below.
8. MONTHLY BANK CHARGES - CONDITIONAL (only include if the period ends on month-end):
   FIRST, determine if toISO=${p.statementPeriod.toISO} is the TRUE last day of the month:
   - For February: last day is 28
   - For April, June, September, November: last day is 30
   - For January, March, May, July, August, October, December: last day is 31
   
   ONLY IF the toISO date IS the actual last day of that month (28, 30, or 31), then add these fee-only rows on that date. If toISO is NOT the month-end date (e.g., the period ends on March 19, March 15, etc.), then do NOT include Monthly Service Fee or Notification Fee at all - omit them completely.
   These are fee-only rows. The charge goes in the "fees" field, NOT in "amount".
   • Monthly Service Fee:
     - reference: "Monthly Service Fee"
     - description: "No value here"(empty  string)
     - amount: null
     - fees: between -180.00 and -350.00 (negative, this is the actual charge)
     - type: "debit"
     - balanceAfter: previous balanceAfter + fees (amount contributes nothing since it is null)
   • Notification Fee:
     - reference: "Notification Fee"
     - description: "No value here" (empty string)
     - amount: null
     - fees: between -5.00 and -15.00 (negative)
     - type: "debit"
     - balanceAfter: previous balanceAfter + fees
  9 Fees: include some transactions with fees and compute feeTotal as the sum of all fees. Compute vatTotal = feeTotal * 0.15. Use vatRate="${vatRate}".

${extraComment}

Return ONLY the JSON.`;
};