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
    fromDate,
    toDate,
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
    console.log(availableBalance);
    let prompt = `
You are a South African bank-statement generator.
Your output MUST be mathematically perfect, internally consistent,
and suitable for loan approval.
The user works at ${companyName} so your salary deposits mainDescription can include the name
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

***SERIOUS REQUIREMENT - FINAL BALANCE MUST BE:***
availableBalance: ${availableBalance.toFixed(2)}

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

================================================================
***SERIOUS REQUIREMENT - FINAL TRANSACTION BALANCE***
================================================================
***THE LAST BALANCE OF THE LAST TRANSACTION MUST BE THE AVAILABLE BALANCE: ${availableBalance.toFixed(2)}***
***THIS IS NOT A SUGGESTION - THIS IS A HARD REQUIREMENT***
***THE FINAL TRANSACTION'S BALANCE FIELD MUST EQUAL ${availableBalance.toFixed(2)}***

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
ALSO PLEASE NOTE: We need realistic mainDescriptions, not things like LARGE PAYMENT, SMALL PAYMENT etc. The bank statement must look like a real bank statement that even the banks and reviewers can accept

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
• Amount range: 2000–12000. rent must be realistic based on salary. a person earning 3000 cannot be paying 9000 rent. rent must be at less than 20% - 40% of salary
• SAME amount every month
• NEVER mark rent as income
• NEVER use "RENTAL INCOME"
> NO PAYMENT THAT IS BIGGER THAN THE OPEN BALANCE MUST HAPPEN, OPENING BALANCE SHOULD BE TREATED AS CURRENT BALANCE. IF OPENING BALANCE IS 300, THE FIRST TRANSACTION CAN NOT BE A MONEY OUT OF MORE THAN 300 UNLESS ITS A FEE.

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
mainDescription: "FEE:INTERNATIONAL TRANSACTION"
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
PROGRESSIVE BALANCING (STRICT — NEW)
================================================================
You MUST achieve the final availableBalance progressively.

🚫 NEVER use a single large deposit or payment to "fix" the balance.
🚫 NEVER insert obvious balancing transactions.
🚫 NEVER adjust more than 15–25% of the remaining balance gap in one transaction.

If balance is too LOW:
• Gradually increase deposits across multiple realistic transactions
• Use salary, PAYSHAP, EFT, or ATM cash deposits
• Spread corrections across days and weeks

If balance is too HIGH:
• Gradually increase spending via groceries, fuel, utilities, subscriptions, card purchases
• Use realistic merchant descriptions
• Prefer multiple small-to-medium payments over time

By the FINAL WEEK:
• Remaining balance difference should be < 5%
• Final transactions must appear routine and unsuspicious
• The last transaction MUST NOT look like an adjustment

***REMEMBER: THE FINAL BALANCE AFTER THE LAST TRANSACTION MUST BE ${availableBalance.toFixed(2)}***

This MUST look like natural financial behaviour over time.

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

***SERIOUS FINAL BALANCE REQUIREMENT:***
***FINAL currentBalance (after LAST transaction) MUST EQUAL:***
***${availableBalance.toFixed(2)}***

================================================================
OUTPUT REQUIREMENTS
================================================================
• EXACTLY ${transactionCount} transactions
• Two decimal places only
• NO currency symbols
• RETURN ONLY valid JSON
• Structure MUST match sampleStatementData EXACTLY
• address:"${physicalAddress}" in this format ['Address:', '3860 SUPERCHARGER ST', 'Devland Ext', 'Freedom Park', '1832', 'ZA']
Please use the physical address ${physicalAddress}

***CRITICAL FINAL CHECK:***
***Transaction #${transactionCount}'s balance field MUST BE ${availableBalance.toFixed(2)}***

REFERENCE STRUCTURE:
${JSON.stringify(sampleStatementData, null, 2)}

FINAL VALIDATION STEP (MANDATORY):
Before returning JSON:
✔ Validate running balance
✔ Validate no overdrafts
✔ ***Validate final balance is EXACTLY ${availableBalance.toFixed(2)}***
✔ Fix any violations BEFORE returning

***FAILURE TO MAKE THE LAST TRANSACTION BALANCE ${availableBalance.toFixed(2)} WILL RESULT IN INVALID OUTPUT***
`;

    if (comment) {
        prompt += `\n\nADDITIONAL USER REQUIREMENTS: ${comment}`;
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
-• Amount range: 2000–12000. rent must be realistic based on salary. a person earning 3000 cannot be paying 9000 rent. rent must be at less than 20% - 40% of salary
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
4. Include realistic merchant names used in South Africa.
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
     "description": "Fee: Transactional SMS Notification",
     "fees": "0.50",
     "money_out": "-",
     "money_in": "-",
     "balance": (previous balance - 0.50)
   }

- DO NOT combine fees with the main purchase.
- DO NOT generate standalone fee transactions without a preceding purchase on the same date.
- Every fee must be paired with a money_out transaction immediately before it.

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
- DO NOT include "Opening Balance" as a transaction in the transactions array.
- The opening_balance field contains the starting amount, but transactions should start with real transactions.
- Balances must be mathematically accurate.
- No invalid numbers.
- All fields strictly follow the format above.
- Output ONLY the JSON.`;

    if (comment) {
        prompt += `\n\nADDITIONAL USER REQUIREMENTS: ${comment}`;
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
