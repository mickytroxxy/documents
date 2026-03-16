import { Address, BankDetails } from './business_sample';

export type BusinessCapitecPromptParams = {
    bankName: string;
    months: number;
    accountNumber: string;
    accountType: string;
    businessName: string;
    comment?: string;
    salaryDay: number;
    rentalDay: number;
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
  - Rental date: day ${p.rentalDay} of the month. This MUST be a DEBIT (money out) on that exact day.
- Month-end fees:
  - On the last day of the month (toISO), include bank charges for (THIS IS A MUST):
    - Monthly Service Fee -> THIS HAS NO DESCRIPTION
    - Notification Fee -> THIS HAS NO DESCRIPTION
- Opening balance MUST be exactly: ${p.openingBalance}
- Closing balance should be realistic. ${p.targetClosingBalance !== undefined ? `The final closing balance MUST be exactly ${p.targetClosingBalance}.` : 'Do not force a specific closing balance unless it naturally fits.'}
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
  - Rental date: day ${p.rentalDay} of the month. This MUST be a DEBIT (money out) on that exact day.
- Month-end fees:
  - On the last day of the month (toISO), include bank charges for (THIS IS A MUST):
    - Monthly Service Fee -> THIS HAS NO DESCRIPTION
    - Notification Fee -> THIS HAS NO DESCRIPTION
  - These MUST match the Capitec Business statement style:
    - description should be an empty string
    - reference should contain the fee name (exactly as above)
    - amount must be negative (debit)
- Fees: include some transactions with fees and compute feeTotal as the sum of all fees. Compute vatTotal = feeTotal * 0.15. Use vatRate="${vatRate}".

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

${extraComment}

Return ONLY the JSON.`;
};
