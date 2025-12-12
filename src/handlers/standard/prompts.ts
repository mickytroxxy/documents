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
    // core totals (numbers only — no currency symbol)
    const totalPayments = averageMonthlySpending * months;
    const totalDeposits = availableBalance - openBalance + totalPayments;
    const salaryTotal = salaryAmount * months;
    const otherDepositsNeeded = totalDeposits - salaryTotal;

    // Number of transactions to request
    const transactionCount = 30 + months * 10;

    // Get current date for reference
    const currentDate = new Date();
    const currentDateStr = currentDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    // compact prompt (numbers without "R")
    return `You are a financial-data generator for South African bank statements. Produce realistic, chronological, and mathematically perfect statement JSON that matches the structure in sampleStatementData.

IMPORTANT: Current date is ${currentDateStr}. All dates in the statement MUST be on or before this date. NO FUTURE DATES ALLOWED.

Keep these required facts (numbers only — DO NOT include currency symbols):
- accountHolder: "${accountHolder}"
- accountNumber: "${accountNumber}"
- periodMonths: ${months}
- openingBalance: ${openBalance.toFixed(2)}
- availableBalance should always amount to: ${availableBalance.toFixed(
        2
    )}. so make sure that your deposits and payments will leave the ${availableBalance}. This is very import. Don't subtract payments from deposits
- totalPayments (sum of payment amounts) MUST equal: ${totalPayments.toFixed(2)}
- totalDeposits (sum of deposit amounts) MUST equal: ${totalDeposits.toFixed(2)}
- salaryTotal (salaryAmount * months): ${salaryTotal.toFixed(2)}
- otherDepositsNeeded: ${otherDepositsNeeded.toFixed(2)}
FINAL CHECK: openingBalance + totalDeposits - totalPayments MUST EQUAL requiredFinalBalance.

Dates and format:
- Use date format "DD MMM YY" (e.g. "27 Nov 25")
- Cover the last ${months} months, absolutely NO future dates (dates must be on or before ${currentDateStr}), chronological order
- Salary deposits occur on day ${payDate} of each month (if salaryAmount > 0)

Transaction rules:
- For deposits use the "deposit" field (positive numbers). For payments use the "payment" field (positive numbers for amounts but treated as debits); balances must update after each entry.
- Include these minimum counts:
  - Salary deposits: ${months}
  - Grocery purchases: ${months * 3}
  - Fuel purchases: ${months * 2}
  - ATM withdrawals: ${months}
  - Utility payments: ${months}
  - Entertainment: ${Math.floor(months * 1.5)}
  - Bank fees: ${months * 2}
  - Transfers: ${Math.floor(months * 0.5)}

Amounts must be realistic (examples, ranges):
- Groceries: 200–1500
- Fuel: 300–800
- Utilities: 500–2000
- Telecoms: 100–500
- Entertainment: 100–1000
- Retail: 150–3000
- Dining: 80–500
- Transfers: 200–5000
- ATM withdrawals: 200–2000
- Bank fees: 3.20–65.00

Balance algorithm (enforce):
- currentBalance = openingBalance
- For each transaction in chronological order:
  - if deposit: currentBalance += deposit
  - if payment: currentBalance -= payment
  - set transaction.balance = currentBalance
- After all transactions, final currentBalance MUST equal requiredFinalBalance

Additional requirements:
- Generate exactly ${transactionCount} transactions that satisfy all rules above.
- Use consistent decimals (two decimal places).
- RETURN ONLY valid JSON exactly matching the structure of sampleStatementData. No extra text, no explanations.
- Do not include currency symbols in numeric fields.
- Create also lots of deposits. don't just create payments transactions only
Structure reference (use identical keys and nesting as sampleStatementData): ${JSON.stringify(sampleStatementData, null, 2)}

IMPORTANT: Validate all sums and the final balance before returning.`;
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

    // Calculate specific month period if statementPeriod is provided
    let periodFrom = statementPeriod?.from || `01 ${fromDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
    let periodTo = statementPeriod?.to || currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    let generationDate =
        statementPeriod?.generation_date || currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return `You are a financial-data generator for TymeBank statements. Produce strictly valid JSON with realistic, chronological, fully balanced TymeBank transaction data.

IMPORTANT:
- Today's date is ${currentDate.toLocaleDateString('en-GB')}.
- All generated dates MUST be on or before today's date.
- All balances must recalculate correctly after each transaction.
- Use "–" (dash) instead of "0.00" in money_in, money_out, and fees fields when the value is zero.
- DO NOT include "Opening Balance" as a transaction in the transactions array.
- The opening_balance field should contain the starting balance, but there should be NO transaction with description "Opening Balance".

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
3. Include realistic spending categories: groceries, fuel, restaurants, clothing, transport, utilities, airtime, data, takeaways, online purchases, etc.
4. Include realistic merchant names used in South Africa.
5. Include bank-related transactions where appropriate (ATM withdrawal fees, immediate EFT fees, etc.).
6. Each month must contain AT LEAST 15 transactions and no more than 25 transactions.
7. NO future dates.
8. The running balance MUST be updated after every transaction.
9. The first transaction should NOT be "Opening Balance" - start with actual transactions.

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
- This applies to ANY POS purchase, online purchase, petrol station purchase, grocery store, clothing, restaurant, etc.

Additional TymeBank Fees You MAY apply (only when logically relevant):
- Cash withdrawal at SA ATM: R10 per R1,000 or part thereof (separate fee transaction)
- Immediate EFT (PayShap): R7 per R1,000 (max R35)
- Flash voucher purchase fee: R7
- Unsuccessful debit order dispute: R60
- Inactive account fee: R7 (only if account inactive for 6+ months)
- Cash deposit (till point): R10 per R1,000
- International ATM balance enquiry: R70
- Debit card or debit order decline: R3
- Also add more money_in transactions to make it look like the user has other incomes

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
};
