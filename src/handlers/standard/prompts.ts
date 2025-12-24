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
    openingBalance,
    physicalAddress,
    isLastMonth = false,
    comment
}: GenerateDocs & {
    statementPeriod?: { from: string; to: string; generation_date: string };
    currentMonth?: number;
    totalMonths?: number;
    openingBalance?: number;
    physicalAddress: string;
    companyName: string;
    isLastMonth?: boolean;
    comment?: string;
}) => {
    const currentDate = new Date();
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - (months - 1));
    console.log('using ', physicalAddress);
    // Calculate specific month period if statementPeriod is provided
    let periodFrom = statementPeriod?.from || `01 ${fromDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
    let periodTo = statementPeriod?.to || currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    let generationDate =
        statementPeriod?.generation_date || currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let prompt = `You are a financial-data generator for TymeBank statements. Your goal is to create a bank statement that is convincing enough for a vehicle, house, or loan application. Produce strictly valid JSON with realistic, chronological, and fully balanced TymeBank transaction data.

IMPORTANT:
- Today's date is ${currentDate.toLocaleDateString('en-GB')}.
- All generated dates MUST be on or before today's date.
- All balances must recalculate correctly after each transaction.
- Use "–" (dash) instead of "0.00" in money_in, money_out, and fees fields when the value is zero.
- DO NOT include "Opening Balance" as a transaction in the transactions array.
- Amount range: 2000–12000. rent must be realistic based on salary. a person earning 3000 cannot be paying 9000 rent. rent must be at less than 20% - 40% of salary
- Salary deposits must not be trailed by company name like ABC.
- The opening_balance field should contain the starting balance, but there should be NO transaction with description "Opening Balance".

🚫 YOU ARE STRICTLY FORBIDDEN FROM:
• Making any payment that exceeds the CURRENT balance
• NO PAYMENT THAT IS BIGGER THAN THE OPEN BALANCE MUST HAPPEN, OPENING BALANCE SHOULD BE TREATED AS CURRENT BALANCE. IF OPENING BALANCE IS 300, THE FIRST TRANSACTION CAN NOT BE A MONEY OUT OF MORE THAN 300 UNLESS ITS A FEE.
• Allowing the balance to go negative at ANY point
• Creating a transaction that would cause insufficient funds
• No repeated fees in a row. fees should be next to a real transaction

THIS IS A HARD FAILURE CONDITION.
If currentBalance < payment amount → YOU MUST REDUCE THE PAYMENT AMOUNT TO EQUAL THE CURRENT BALANCE OR ADD A DEPOSIT BEFORE THE PAYMENT.
NO PAYMENT THAT IS BIGGER THAN THE OPEN BALANCE MUST HAPPEN, OPENING BALANCE SHOULD BE TREATED AS CURRENT BALANCE. IF OPENING BALANCE IS 300, THE FIRST TRANSACTION CAN NOT BE A MONEY OUT OF MORE THAN 300 UNLESS ITS A FEE.

================================================================
STANDARD BANK NAMING CONVENTION (MUST FOLLOW)
================================================================
Based on the attached Standard Bank statement, ALL transactions must use the Standard Bank format:

1. SINGLE "description" FIELD (NO separate mainDescription/subDescription):
   - Combine what would be mainDescription and subDescription into ONE "description" field
   - Format: "MAIN DESCRIPTION SUB DESCRIPTION"
   - Example from PDF: "EXCESS INTEREST EXCESS INTEREST"
   - Example from PDF: "MA-AFRIKA CON 5196*4905 26 SEP DEBIT CARD PURCHASE FROM"

2. NO "shoprite purchase" or similar merchant names in sub-description position
3. Transaction types and their standard descriptions:
   - Salary/Pension: "NRMLSASSA GP 1291170410 PENSION"
   - ATM Withdrawal: "SBSA 2025-09-26T13:25:54 5196*4905 OTHER BANK ATM CASH WITHD. AT"
   - Card Purchase: "MA-AFRIKA CON 5196*4905 26 SEP DEBIT CARD PURCHASE FROM"
   - Fees: "CASH WITHDRAWAL FEE CASH WITHDRAWAL FEE"
   - Management Fees: "MONTHLY MANAGEMENT FEE MONTHLY MANAGEMENT FEE"
   - SMS Fees: "0000010157960941 00005 R2.25 FEE-MU PRIMARY SMS"
   - Debit Orders: "SBIB-MOBI FUN010874215 250930 DEBICHECK DEBIT ORDER RE-PRES"
   - Airtime: "VAS00157255141 CELLC0845582592 PREPAID MOBILE PURCHASE"

4. MERCHANT NAMES:
   - Merchant names can ONLY appear in the FIRST PART (main description position)
   - Examples: "MA-AFRIKA CON", "S2SHALFPR RANDFONTEIN ZAF"
   - NEVER put merchant names like "Shoprite" in the sub-description position
   - The SECOND PART should be transaction type/fee description only

================================================================
TRANSACTION DESCRIPTION FORMAT RULES
================================================================
For TymeBank, follow this combined description format:

1. CARD PURCHASES:
   • Format: "[MERCHANT/REFERENCE] [CARD]*[LAST4DIGITS] [DATE] DEBIT CARD PURCHASE"
   • Example: "MA-AFRIKA CON 5196*4905 26 SEP DEBIT CARD PURCHASE"

2. ATM WITHDRAWALS:
   • Format: "SBSA [TIMESTAMP] [CARD]*[LAST4DIGITS] OTHER BANK ATM CASH WITHD. AT"
   • Example: "SBSA 2025-09-26T13:25:54 5196*4905 OTHER BANK ATM CASH WITHD. AT"

3. SALARY/PENSION DEPOSITS:
   • Format: "NRMLSASSA GP [REFERENCE] PENSION"
   • Or company payments: "[COMPANY_CODE] [REFERENCE] SALARY"

4. FEES (ALWAYS DUPLICATE):
   • Format: "[FEE_TYPE] [FEE_TYPE]"
   • Example: "CASH WITHDRAWAL FEE CASH WITHDRAWAL FEE"
   • Example: "FEE: PREPAID MOBILE PURCHASE FEE: PREPAID MOBILE PURCHASE"

5. RENT PAYMENTS:
   • Format: "MONTHLY RENTAL PAYMENT TO [LANDLORD]"
   • Example: "MONTHLY RENTAL PAYMENT TO ABC PROPERTIES"

6. DEBIT ORDERS:
   • Format: "SBIB-MOBI [REFERENCE] [DATE] DEBICHECK DEBIT ORDER RE-PRES"

CRITICAL BALANCE ENFORCEMENT:
- Initialize currentBalance = opening_balance
- Process transactions in STRICT chronological order (by date)
- For each transaction:
  - Add money_in to currentBalance
  - Subtract money_out from currentBalance (but ONLY if currentBalance >= money_out, otherwise add a deposit before the transaction to cover it)
  - Subtract fees from currentBalance
- Balance MUST NEVER go below 0. If it would, add a realistic deposit transaction before the problematic transaction.
- Large money_out transactions like rent must be the full amount; add deposits earlier in the month if needed to cover them.
- Every month MUST have a rent payment between the 1st and 3rd, even if it requires adding income first.
- Rent amount must be realistic (20-40% of salary) and consistent every month.

Core Input Data:
- account_holder: "${accountHolder}"
- account_number: "${accountNumber}",
- statement_period_from: "${periodFrom}"
- statement_period_to: "${periodTo}"
- statement_period_generation_date: "${generationDate}"
- opening_balance: ${openingBalance?.toFixed(2) || openBalance.toFixed(2)}
${isLastMonth ? ` - closing_balance: ${availableBalance.toFixed(2)}` : ''}
- salary_amount: ${salaryAmount.toFixed(2)}, paid monthly on day ${payDate}
${currentMonth && totalMonths ? `- This is month ${currentMonth} of ${totalMonths} in the series` : ''}

Transaction Rules:
1. Start transactions from the FIRST day of the period, NOT with an opening balance transaction.
2. Include monthly salary deposits exactly on day ${payDate} of each month.
3. Include realistic spending categories: groceries, fuel, restaurants, clothing, transport, utilities, airtime, data, takeaways, online purchases, etc.
4. Use Standard Bank description format as shown in the PDF - SINGLE "description" field combining both parts.
5. Include bank-related transactions where appropriate (ATM withdrawal fees, immediate EFT fees, etc.).
6. Each month must contain AT LEAST 15 transactions and no more than 25 transactions.
7. NO more than 5 transactions per day (some days may have 0).
8. NO future dates.
9. The running balance MUST be updated after every transaction.
10. The first transaction should NOT be "Opening Balance" - start with actual transactions.

MANDATORY FEE RULE:
TymeBank charges R0.50 for transactional SMS notifications on every purchase.

Therefore:
- For EVERY purchase transaction (money_out > 0), you MUST immediately generate a fee transaction after it:

   {
     "date": "same date",
     "description": "Fee: Transactional SMS Notification Fee: Transactional SMS Notification",
     "fees": "0.50",
     "money_out": "-",
     "money_in": "-",
     "balance": (previous balance - 0.50)
   }

- DO NOT combine fees with the main purchase.
- DO NOT generate standalone fee transactions without a preceding purchase on the same date.
- Every fee must be paired with a money_out transaction immediately before it.
- FEES MUST FOLLOW STANDARD BANK FORMAT: Duplicate the description as shown in PDF.

Additional TymeBank Fees You MAY apply (only when logically relevant):
- Cash withdrawal at SA ATM: R10 per R1,000 or part thereof (separate fee transaction)
- Immediate EFT (PayShap): R7 per R1,000 (max R35)
- Flash voucher purchase fee: R7
- Unsuccessful debit order dispute: R60
- Inactive account fee: R7 (only if account inactive for 6+ months)
- Cash deposit (till point): R10 per R1,000
- International ATM balance enquiry: R70
- Debit card or debit order decline: R3
- Include a consistent, significant rent payment between the 1st and 3rd of each month, shortly after the salary is paid.
- Add other income sources besides salary with varied, realistic South African descriptions to make the statement look stronger and more credible. Examples include payments from clients, freelance work, side businesses, refunds, gifts, etc. Avoid repeating the same descriptions.

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
      "description": "Transaction description in Standard Bank format: MAIN DESCRIPTION SUB DESCRIPTION",
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
- DO NOT include "Opening Balance" as a transaction in the transactions array.
- The opening_balance field contains the starting amount, but transactions should start with real transactions.
- Balances must be mathematically accurate.
- No invalid numbers.
- ALL descriptions MUST follow Standard Bank format: Single field with combined main and sub descriptions.
- NEVER use separate mainDescription/subDescription fields - only ONE "description" field.
- NEVER put merchant names like "Shoprite" in sub-description position.
- FEES MUST have duplicated descriptions as shown in PDF.
- Output ONLY the JSON.`;

    if (comment) {
        prompt += `\n\nADDITIONAL USER REQUIREMENTS: ${comment}\n\nIMPORTANT: Even user requirements must follow Standard Bank description format rules above.`;
    }

    return prompt;
};

export const formCapitecTransactionsPrompt = ({
    accountHolder,
    accountNumber,
    months,
    openBalance,
    availableBalance,
    payDate,
    salaryAmount = 20000,
    companyName,
    physicalAddress,
    comment
}: FormStatementPrompt & { comment?: string }) => {
    const rentMin = salaryAmount * 0.15;
    const rentMax = salaryAmount * 0.2;
    const rentAmount = Math.floor(Math.random() * (rentMax - rentMin + 1)) + rentMin;

    const transactionCount = months * 30;

    const currentDate = new Date();
    const toDate = new Date(currentDate);
    const fromDate = new Date(currentDate);
    fromDate.setMonth(fromDate.getMonth() - (months - 1));

    const formatDate = (date: Date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    const todayStr = formatDate(currentDate);
    const fromDateStr = formatDate(fromDate);
    const toDateStr = formatDate(toDate);

    let prompt = `
You are a South African Capitec Bank transaction generator.
Generate ONLY realistic transaction data for a Capitec bank statement.

=================================================================
ACCOUNT INFORMATION
=================================================================
Account Holder: ${accountHolder}
Account Number: ${accountNumber}
Company: ${companyName}
Pay Date: ${payDate}th of each month

=================================================================
DATE RULES (CRITICAL)
=================================================================
TODAY: ${todayStr}
STATEMENT PERIOD: ${fromDateStr} to ${toDateStr} (${months} months)

• NO FUTURE DATES — NOTHING after ${todayStr}
• All dates MUST be between ${fromDateStr} and ${toDateStr}
• Dates MAY repeat (multiple transactions per day REQUIRED)
• DO NOT generate 1 transaction per day
• Some days must have 0 transactions
• Some days must have 0-5 transactions, but NO more than 5 transactions per day

Salary:
• Paid on the ${payDate}th of each month

Rent:
• Paid between the 1st–3rd of each month

Debit Orders:
• Typically between the 25th–28th

=================================================================
FINANCIAL PARAMETERS
=================================================================
• Opening Balance: R${openBalance.toFixed(2)}
• Required Final Balance: R${availableBalance.toFixed(2)}
• Monthly Salary: R${salaryAmount.toFixed(2)}
• Monthly Rent: R${rentAmount.toFixed(2)}
. NO PAYMENT THAT IS BIGGER THAN THE OPEN BALANCE MUST HAPPEN, OPENING BALANCE SHOULD BE TREATED AS CURRENT BALANCE. IF OPENING BALANCE IS 300, THE FIRST TRANSACTION CAN NOT BE A MONEY OUT OF MORE THAN 300 UNLESS ITS A FEE.
=================================================================
CRITICAL PAYMENT & FEE RULES (MUST FOLLOW EXACTLY)
=================================================================

1. INTERNAL PAYMENTS (Capitec → Capitec):
   • Fee: R1.00
   • Description examples:
     - "Banking App Immediate Payment: Mdu Landlord"
     - "Banking App Payment: Love"
     - "Banking App Immediate Payment: Mr Ms Mkhari"
   • Category: Rent, Digital Payments, or specific category

2. EXTERNAL PAYMENTS (Capitec → Other Bank):
   • If description contains "Immediate": R6.00 fee
   • If NO "Immediate": R1.00 fee
   • Description examples:
     - R6 fee: "Banking App Immediate Payment: Manyelani"
     - R6 fee: "Banking App Immediate Payment: Cipc"
     - R1 fee: "Banking App Payment: Toni (ABSA)"
   • Category: Digital Payments

3. CASH SEND:
   • Fee: R10.00
   • Description: "Banking App Cash Sent: C*******[last 3 digits]"

4. CASH WITHDRAWALS:
   • Fee: R10.00 (R40.00 for R4000+ withdrawals)
   • Description: "ATM Cash Withdrawal: [Location]"

5. CASH DEPOSITS:
   • Fee: R7.00-R15.00 (based on amount)
   • Description: "Cash Deposit: [Location]"

6. DEBIT ORDERS (1-2 per month):
   • Successful: R3.00 fee
   • Failed (insufficient funds): R6.00 fee
   • Description: "Registered Debit Order
   . We need at maximum of 2 debit orders per month
  

7. CARD SUBSCRIPTIONS:
    . We need at maximum of 2 card subscriptions per month

=================================================================
REQUIRED TRANSACTION TYPES (${transactionCount} TOTAL)
=================================================================

1. SALARY (${months})
   • Amount: R${salaryAmount.toFixed(2)} each
   • Date: ${payDate}th of each month
   • Description: "Payment Received: ${companyName}"
   • Category: "Other Income"
   • money_in: R${salaryAmount.toFixed(2)}
   • money_out: null
   • fee: null

2. RENT (${months})
   • Amount: R${rentAmount.toFixed(2)} each (SAME amount every month)
   • Date: Between 1st-3rd of each month
   • Fee: R1.00
   • Description: "Banking App Immediate Payment: Mdu Landlord"
   • Category: "Rent"
   • money_in: null
   • money_out: -${rentAmount.toFixed(2)}
   • fee: -1.00

3. DEBIT ORDERS (4-6 total)
   • CarTrack: R100.00-R159.00
   • Insurance: R250.00-R450.00
   • Funeral: R150.00-R250.00
   • Home Loans: R800.00-R1500.00
   • Gym: R299.00-R399.00
   • Successful fee: -3.00
   • Failed fee (occasional): -6.00
   • Description: "Registered Debit Order: CarTrack (2121827)"
   • Category: "Vehicle Tracking" or "Other Loans & Accounts"

4. CARD SUBSCRIPTIONS (4-6 total)
   • Netflix: R149.00 or R199.00
   • Spotify: R59.99
   • Canva: R60.00
   • YouTube Premium: R79.99
   • Microsoft 365: R89.00
   • Description: "Recurring Card Purchase: [Service]"
   • Category: "Software/Games" or "Other Loans & Accounts"
   • fee: -2.00 or -3.00

5. CASH WITHDRAWALS (2–4 per month, ${months * 2}-${months * 4} total)
   • Amounts: -200.00, -300.00, -500.00, -800.00, -1000.00
   • Fee: -10.00
   • Description: "ATM Cash Withdrawal: [Location] Za"
   • Category: "Cash Withdrawal"

6. CASH DEPOSITS (1–2 per month, ${months}-${months * 2} total)
   • Amounts: 500.00, 1000.00, 2000.00
   • Fees: -7.00, -10.50, -14.00
   • Description: "Cash Deposit: [Location]"
   • Category: null

7. INTERNAL PAYMENTS (3–5 total)
   • Fee: -1.00
   • Amounts: -60.00, -80.00, -120.00, -200.00, -500.00
   • Description: "Banking App Immediate Payment: [Name]"
   • Category: "Digital Payments" or "Children & Dependants"

8. EXTERNAL PAYMENTS (2–4 total)
   • Immediate (R6 fee): "Banking App Immediate Payment: [Name]"
   • Non-immediate (R1 fee): "Banking App Payment: [Name]"
   • Amounts: -300.00, -400.00, -1000.00, -2000.00
   • Category: "Digital Payments"

9. OTHER MANDATORY (PER MONTH)
   • Monthly Account Admin Fee: -7.50 (last day)
   • Interest Received: 1.49-1.66 (last day)
   • Live Better Round-up Transfers: -5.00 to 70.00, at least 2 money_in transactions per month
   • ATM Balance Enquiry Fee: -10.00 (occasional)
   • SMS Notification Fee: -0.35 (occasional)

=================================================================
TRANSACTION FORMAT (JSON ONLY)
=================================================================
{
  "date": "DD/MM/YYYY",
  "description": "Real Capitec description",
  "category": "Category name",
  "money_in": null or positive number,
  "money_out": null or negative number,
  "fee": null or negative number,
  "balance": running balance
}

CRITICAL FORMATTING:
• money_out MUST be negative: -300.00, -500.00
• fee MUST be negative: -1.00, -6.00, -10.00
• money_in MUST be positive: 20000.00, 500.00
• NO adjustment descriptions like "ADJUSTMENT", "FINAL", "BALANCE"
• Use ONLY realistic Capitec descriptions

=================================================================
BALANCE CALCULATION RULES
=================================================================
• Starting balance: R${openBalance.toFixed(2)}
• Each transaction: new_balance = previous + money_in - money_out - fee
• Final balance MUST be: R${availableBalance.toFixed(2)}
• Balance can go negative temporarily
• Include 2-3 insufficient funds scenarios with -6.00 fees

=================================================================
REALISTIC VALUES (WITH DECIMALS)
=================================================================
Use realistic decimal endings:
• .00, .50, .99, .95, .49, .75, .25
• Groceries: 229.91, 483.55, 107.70
• Fuel: 200.00, 150.00, 214.80
• Alcohol: 84.00, 135.00, 100.99
• Online: 447.11, 440.81, 435.83

=================================================================
CATEGORIES TO USE (EXACT)
=================================================================
- Other Income
- Rent
- Cash Withdrawal
- Digital Payments
- Groceries
- Fuel
- Online Store
- Alcohol
- Takeaways
- Restaurants
- Cellphone
- Software/Games
- Fees
- Transfer
- Vehicle Tracking
- Investments
- Betting/Lottery
- Children & Dependants
- Activities
- Pharmacy
- Other Loans & Accounts
- Doctors & Therapists
- Uncategorised

=================================================================
OUTPUT REQUIREMENTS
=================================================================
• EXACTLY ${transactionCount} transactions
• NO future dates
• Multiple transactions per day (some days 2-5 transactions)
• Dates may repeat
• NO adjustment/balance-fixing descriptions
• All money_out values negative: -300.00, -500.00
• All fee values negative: -1.00, -6.00, -10.00
• Final balance: R${availableBalance.toFixed(2)}
• RETURN ONLY JSON ARRAY, NO EXPLANATIONS
• NO additional text before or after JSON
. We also need the physical address in the output
. We also need money_in live better
=================================================================
EXAMPLE TRANSACTIONS
=================================================================
I need you to construct a ${physicalAddress} into this format:
address: {
  street: '3860 SUPERCHARGE STREET',
  city: 'DEVLAND',
  location: 'FREEDOM PARK',
  postal_code: '1811'
}
AND YOUR RESPONSE MUST BE LIKE:
{
  transactions:[
    {
      "date": "01/10/2024",
      "description": "Banking App Immediate Payment: Mdu Landlord",
      "category": "Rent",
      "money_in": null,
      "money_out": -${rentAmount.toFixed(2)},
      "fee": -1.00,
      "balance": ${(openBalance - rentAmount - 1).toFixed(2)}
    },
    {
      "date": "01/10/2024",
      "description": "ATM Cash Withdrawal: Matlapeng Centr Soweto Za",
      "category": "Cash Withdrawal",
      "money_in": null,
      "money_out": -300.00,
      "fee": -10.00,
      "balance": ${(openBalance - rentAmount - 1 - 300 - 10).toFixed(2)}
    },
    {
      "date": "${payDate}/10/2024",
      "description": "Payment Received: ${companyName}",
      "category": "Other Income",
      "money_in": ${salaryAmount.toFixed(2)},
      "money_out": null,
      "fee": null,
      "balance": ${(openBalance - rentAmount - 1 - 300 - 10 + salaryAmount).toFixed(2)}
    }
  ],
  address: {
    street: '3860 SUPERCHARGE STREET',
    city: 'DEVLAND',
    location: 'FREEDOM PARK',
    postal_code: '1811'
  }
}

Calculate balances correctly through all ${transactionCount} transactions.
Use ONLY realistic Capitec transaction descriptions.

`;

    if (comment) {
        prompt += `\n\nADDITIONAL USER REQUIREMENTS: ${comment}`;
    }

    return prompt;
};
