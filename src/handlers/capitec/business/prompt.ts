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
    const extraComment = p.comment ? `\n\nFOLLOW THESE INSTRUCTIONS FROM THE USER:\n${p.comment}` : '';

    return `You are generating realistic South African BUSINESS bank statement JSON data for ${p.bankName}.

Return ONLY valid JSON (no markdown, no commentary) matching this schema exactly:

{
  "account": {
    "accountNumber": string,
    "accountType": string,
    "businessName": string,
    "statementDate": string (ISO date, today's stamp date),
    "statementNumber": string,
    "page": 1,
    "totalPages": 1
  },
  "balances": {
    "openingBalance": number,
    "closingBalance": number
  },
  "address": { "line1": string, "line2": string, "line3": string, "province": string, "postalCode": string },
  "bankDetails": { "branch": string, "branchCode": string, "deviceCode": string, "telephone": string, "businessRegNo": string, "vatNo": string, "interestRate": string },
  "fees": { "feeTotal": number (negative), "vatTotal": number (negative), "vatRate": string },
  "transactions": [
    {
      "postDate": string (ISO date between fromISO and toISO),
      "transactionDate": string (ISO date between fromISO and toISO),
      "description": string,
      "reference": string,
      "authId": string,
      "amount": number (positive = credit IN, negative = debit OUT),
      "fees": number (ALWAYS negative — bank charges only; omit if no fee applies),
      "balanceAfter": number (MANDATORY on every transaction),
      "type": "credit" | "debit"
    }
  ]
}

═══════════════════════════════════════════════
CRITICAL BALANCE RULES — NO EXCEPTIONS
═══════════════════════════════════════════════

OPENING BALANCE = CURRENT BALANCE CAP
  openingBalance = EXACTLY ${p.openingBalance.toFixed(2)}
  The opening balance is your CURRENT available balance at transaction #1.
  NO debit (money out) may exceed the current running balance at that point.
  Example: if openingBalance = R300, the first transaction CANNOT be a debit of R400.
  Example: if running balance = R50,000, salary debit of R350,000 is ONLY allowed
           if a credit has already been received BEFORE that debit row.

RUNNING BALANCE: each transaction's balanceAfter = previous balanceAfter + amount + fees
  • Compute this carefully and include balanceAfter on EVERY transaction.
  • balanceAfter must NEVER be negative.

CLOSING BALANCE:
  closingBalance = balanceAfter of the last transaction.
  ${p.targetClosingBalance !== undefined
        ? `The closing balance MUST be exactly ${p.targetClosingBalance.toFixed(2)}. Adjust credit amounts near month-end to hit this.`
        : 'Set a realistic closing balance based on month activity.'}

SALARY & RENT:
  Before day ${p.salaryDay}, the running balance MUST be >= R${(p.salaryAmount * 1.1).toFixed(2)} (salary + 10% buffer).
  If the balance is too low, include client payments / EFT receipts before that day.
  • Salary: day ${p.salaryDay}, amount = -${p.salaryAmount.toFixed(2)}, type = "debit", description = "PAYROLL", reference = "PAYROLL ${p.businessName.substring(0, 12).toUpperCase()}"
  • Rent:   day ${p.rentalDay}, amount = -${p.rentalAmount.toFixed(2)}, type = "debit", description = "RENT", reference = "PROP LEASE"

═══════════════════════════════════════════════
FEE RULES PER TRANSACTION TYPE (EXACT)
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

8. MONTHLY BANK CHARGES (last day of period: ${p.statementPeriod.toISO}):
   These are fee-only rows. The charge goes in the "fees" field, NOT in "amount".
   • Monthly Service Fee:
     - description: "" (empty string)
     - reference: "" (empty string)
     - amount: null
     - fees: between -180.00 and -350.00 (negative, this is the actual charge)
     - type: "debit"
     - balanceAfter: previous balanceAfter + fees (amount contributes nothing since it is null)
   • Notification Fee:
     - description: "" (empty string)
     - reference: "" (empty string)
     - amount: null
     - fees: between -5.00 and -15.00 (negative)
     - type: "debit"
     - balanceAfter: previous balanceAfter + fees

═══════════════════════════════════════════════
COMPANY NAMES — DETERMINED BY BUSINESS CONTEXT
═══════════════════════════════════════════════

DO NOT use: "Client Payment", "Supplier Payment", "Client A", "Company X", or any placeholder.
DO NOT default to IT companies unless the business context says so.

The companies used in transaction descriptions MUST match the industry and nature of the business
described in the "Additional business context" section below.

Examples of how to pick companies:
• If the business is IT/software → use Microsoft, SAP Africa, Bytes Technology, iOCO, Dimension Data, AWS, Oracle SA etc.
• If the business is construction → use Raubex Group, WBHO, Murray & Roberts, Aveng, Stefanutti Stocks, PPC Ltd, AfriSam etc.
• If the business is retail/FMCG → use Shoprite, Pick n Pay, Spar Group, Massmart, Woolworths, Famous Brands etc.
• If the business is logistics/transport → use Imperial Logistics, DSV SA, DHL Express, Mainfreight SA, Freight Dynamics etc.
• If the business is finance/professional services → use Deloitte, PwC SA, KPMG, Grant Thornton, ENSafrica, Bowmans etc.
• If the business is healthcare → use Netcare, Mediclinic, Life Healthcare, Dischem, Aspen Pharmacare, Adcock Ingram etc.

Always include a mix of:
  - Clients / customers paying the business (credits)
  - Suppliers / service providers the business pays (debits)
  - Utilities: Eskom Holdings, City of Joburg, eThekwini Municipality, SARS EFT, UIF Contribution
  - Fuel/logistics if relevant: Sasol Retail, BP Southern Africa, Engen Petroleum, DHL Express SA

═══════════════════════════════════════════════
DATE & VOLUME RULES
═══════════════════════════════════════════════

Statement period: fromISO=${p.statementPeriod.fromISO}, toISO=${p.statementPeriod.toISO}
All postDate and transactionDate must fall within this range.
Avoid Saturdays, Sundays, and SA public holidays (16 Jun, 16 Dec, 25-26 Dec, 1 Jan, 21 Mar, 27 Apr, 1 May).
Generate 30–55 transactions. Mix busy days (3–6 transactions) with quiet days (0 transactions).
Use realistic cent values: 47382.37, 15250.00, 8731.55 — avoid round thousands like 10000, 100000.

Fixed account details (copy exactly):
- accountNumber: ${p.accountNumber}
- accountType: ${p.accountType}
- businessName: ${p.businessName}
- line1: ${p.address.line1 || ''}
- line2: ${p.address.line2 || ''}
- line3: ${p.address.line3 || ''}
- province: ${p.address.province || ''}
- postalCode: ${p.address.postalCode || ''}
- branch: ${p.bankDetails.branch || ''}
- branchCode: ${p.bankDetails.branchCode || ''}
- deviceCode: ${p.bankDetails.deviceCode || ''}
- telephone: ${p.bankDetails.telephone || ''}
- businessRegNo: ${p.bankDetails.businessRegNo || ''}
- vatNo: ${p.bankDetails.vatNo || ''}
- interestRate: ${p.bankDetails.interestRate || ''}
${extraComment}

Return ONLY the JSON object. No explanation, no markdown.`;
};
