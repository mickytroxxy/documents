import { GenerateDocs } from '../../ai/shared';

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
  "customer_address": "${physicalAddress}",
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
