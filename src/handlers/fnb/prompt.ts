import { FormStatementPrompt } from '../standard/prompt';

export const formFnbStatementPrompt = ({
    accountHolder,
    accountNumber,
    months,
    openBalance,
    availableBalance,
    payDate,
    salaryAmount = 20000,
    companyName,
    physicalAddress,
    comment,
    rentAmount
}: FormStatementPrompt & { comment?: string }) => {
    const calculatedRent =
        rentAmount ||
        (() => {
            const rentMin = salaryAmount * 0.15;
            const rentMax = salaryAmount * 0.2;
            return Math.floor(Math.random() * (rentMax - rentMin + 1)) + rentMin;
        })();

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
You are a South African FNB Bank transaction generator.
Generate ONLY realistic transaction data for an FNB bank statement.

================================================================
ACCOUNT INFORMATION
================================================================
Account Holder: ${accountHolder}
Account Number: ${accountNumber}
Company: ${companyName}
Pay Date: ${payDate}th of each month

================================================================
DATE RULES (CRITICAL)
================================================================
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

================================================================
FINANCIAL PARAMETERS
================================================================
• Opening Balance: R${openBalance.toFixed(2)}
• Required Final Balance: R${availableBalance.toFixed(2)}
• Monthly Salary: R${salaryAmount.toFixed(2)}
• Monthly Rent: R${calculatedRent.toFixed(2)}
. NO PAYMENT THAT IS BIGGER THAN THE OPEN BALANCE MUST HAPPEN, OPENING BALANCE SHOULD BE TREATED AS CURRENT BALANCE. IF OPENING BALANCE IS 300, THE FIRST TRANSACTION CAN NOT BE A MONEY OUT OF MORE THAN 300 UNLESS ITS A FEE.

================================================================
CRITICAL PAYMENT & FEE RULES (MUST FOLLOW EXACTLY)
================================================================

1. PAYSHAP PAYMENTS:
   • Fee: R3.00 for off-us, R0 for on-us
   • Description examples:
     - "Payshap Credit [Recipient]"
     - "Payshap Account Off-Us [Recipient]"
   • For credits: "Payshap Credit [Sender]"

2. FNB APP PAYMENTS:
   • Fee: R2.50 for prepaid, R3.00 for transfers
   • Description examples:
     - "FNB App Prepaid [Service] [Number]"
     - "FNB App Payment From [Sender]"
     - "FNB App Transfer From [Sender]"

3. ATM CASH WITHDRAWALS:
   • Fee: R104.80 for large amounts, R57.54 for smaller
   • Description: "ATM Cash [Location]"

4. SEND MONEY APP:
   • Fee: R7.24
   • Description: "Send Money App Dr Send [Recipient]"

5. POS PURCHASES:
   • Fee: R3.68
   • Description: "POS Purchase [Merchant] [Location]"

6. DEBIT CARD UNSUCCESSFUL:
   • Fee: R6.00
   • Description: "#Debit Card POS Unsuccessful If #Fee Declined Purch Tran [Card]"

================================================================
REQUIRED TRANSACTION TYPES (${transactionCount} TOTAL)
================================================================

1. SALARY (${months})
   • Amount: R${salaryAmount.toFixed(2)} each
   • Date: ${payDate}th of each month
   • Description: "Salary Payment from ${companyName}"
   • action: 'Cr'
   • amount: "${salaryAmount.toFixed(2)}"
   • fees: null

2. RENT (${months})
    • Amount: R${calculatedRent.toFixed(2)} each (SAME amount every month)
    • Date: Between 1st-3rd of each month
    • Fee: R3.00
    • Description: "Payshap Account Off-Us Landlord"
    • action: 'Dr'
    • amount: "-${calculatedRent.toFixed(2)}"
    • fees: "3.00"

3. DEBIT ORDERS (4-6 total)
   • CarTrack: R100.00-R159.00
   • Insurance: R250.00-R450.00
   • Funeral: R150.00-R250.00
   • Home Loans: R800.00-R1500.00
   • Gym: R299.00-R399.00
   • Successful fee: 3.00
   • Failed fee (occasional): 6.00
   • Description: "Debit Order: CarTrack" or "Debit Order: Insurance"
   • action: 'Dr'

4. CASH WITHDRAWALS (2–4 per month, ${months * 2}-${months * 4} total)
   • Amounts: 200.00, 300.00, 500.00, 800.00, 1000.00, 4000.00
   • Fee: 57.54 or 104.80
   • Description: "ATM Cash 00505167" or "Cha Card ATM Local Cash Advance Cash Devland Shopri [Card]"
   • action: 'Dr'

5. PAYSHAP PAYMENTS (3–5 total)
   • Fee: 3.00
   • Amounts: 60.00, 80.00, 120.00, 200.00, 500.00
   • Description: "Payshap Account Off-Us Rg Innovations" or "Payshap Account Off-Us Ads"
   • action: 'Dr'

6. FNB APP PAYMENTS (2–4 total)
   • Fee: 2.50 or 3.00
   • Amounts: 50.00, 100.00, 150.00
   • Description: "FNB App Prepaid Aftime 0746510683" or "FNB App Payment From Payment"
   • action: 'Dr'

7. SEND MONEY (1–2 total)
   • Fee: 7.24
   • Amounts: 200.00, 300.00
   • Description: "Send Money App Dr Send Lamar Sean" or "Send Money App Dr Send Portia Portia"
   • action: 'Dr'

8. OTHER MANDATORY (PER MONTH)
   • Monthly Account Admin Fee: 569.66 (last day)
   • Interest Received: occasional small credits like "Interest Received"
   • Cash Deposit Fees: 9.08
   • POS Purchases: "POS Purchase Shopfile Devland"
   • Reversals: "Online Send Reversal Cf Send Rev 27677299995"
   • Fees: "JErwa Manual Reversal Fee Send Rev"
   • Unsuccessful: "#Debit Card POS Unsuccessful If #Fee Declined Purch Tran 4854422151000846"

================================================================
TRANSACTION FORMAT (JSON ONLY)
================================================================
{
  "date": "DD MMM",
  "description": "Real FNB description",
  "amount": "string with 2 decimals",
  "action": "Cr" or "Dr",
  "balance": "string with 2 decimals",
  "fees": "string with 2 decimals or null"
}

CRITICAL FORMATTING:
• amount MUST be string with 2 decimals (positive for Cr, negative for Dr? Wait, in sample it's positive for Cr, negative for Dr? Wait, looking at sample: amount can be positive or negative, action indicates Cr/Dr)
• In sample: amount: '1,800.00' for Cr, '-120.00' for Dr
• balance MUST be string with 2 decimals
• fees MUST be string with 2 decimals or null
• NO adjustment descriptions like "ADJUSTMENT", "FINAL", "BALANCE"
• Use ONLY realistic FNB descriptions

================================================================
BALANCE CALCULATION RULES
================================================================
• Starting balance: ${openBalance.toFixed(2)}
• For Cr: balance = previous + amount
• For Dr: balance = previous - abs(amount)
• IMPORTANT: DO NOT subtract fees from balance calculation. Fees are separate and will be handled later.
• Final balance MUST be: ${availableBalance.toFixed(2)}
• Balance can go negative temporarily
• Include 2-3 insufficient funds scenarios with fees
• Ensure progressive balancing: the balance must gradually reach the final availableBalance without sudden jumps
• For multi-month statements, ensure the balance progresses naturally from month to month, with the closing balance of one month effectively becoming the opening for the next.

================================================================
CRITICAL FEE HANDLING
================================================================
• Fees are separate from balance calculation and must not affect the balance.
• For transactions that have fees (as specified in the rules), set the "fees" field to the exact amount (e.g., "3.00").
• For transactions without fees, set "fees" to null.
• Do not set fees to "0.00" unless the fee is actually 0.
• Ensure all mandatory fees are included as per the transaction types.

================================================================
RENT CONSISTENCY
================================================================
• Use the same rent amount (${calculatedRent.toFixed(2)}) every month.
• Rent is debited from the account with the specified fee.

================================================================
REALISTIC VALUES (WITH DECIMALS)
================================================================
Use realistic decimal endings:
• .00, .60, .87, etc.
• Purchases: 55.73, 120.00, 400.00
• Fees: 3.00, 7.24, 104.80

================================================================
OUTPUT REQUIREMENTS
================================================================
• EXACTLY ${transactionCount} transactions
• NO future dates
• Multiple transactions per day (some days 2-5 transactions)
• Dates may repeat
• NO adjustment/balance-fixing descriptions
• Final balance: ${availableBalance.toFixed(2)}
• Ensure transactions are distributed across all ${months} months. Do not skip any month - every month must have at least some transactions.
• RETURN ONLY JSON ARRAY, NO EXPLANATIONS
• NO additional text before or after JSON

================================================================
EXAMPLE TRANSACTIONS
================================================================
I need you to construct a ${physicalAddress} into this format:
address: {
  street_number: '11261',
  street_name: 'KUWADZANA EXT',
  location: 'HARARE',
  postal_code: '0000 ZIMBABWE'
}
AND YOUR RESPONSE MUST BE LIKE:
{
  transactions:[
    {
      "date": "01 Nov",
      "description": "Payshap Account Off-Us Landlord",
      "amount": "-${calculatedRent.toFixed(2)}",
      "action": "Dr",
      "balance": "${(openBalance - calculatedRent - 3).toFixed(2)}",
      "fees": "3.00"
    },
    {
      "date": "${payDate} Nov",
      "description": "Salary Payment from ${companyName}",
      "amount": "${salaryAmount.toFixed(2)}",
      "action": "Cr",
      "balance": "${(openBalance - calculatedRent - 3 + salaryAmount).toFixed(2)}",
      "fees": null
    }
  ],
  address: {
    street_number: '11261',
    street_name: 'KUWADZANA EXT',
    location: 'HARARE',
    postal_code: '0000 ZIMBABWE'
  }
}

Calculate balances correctly through all ${transactionCount} transactions.
Use ONLY realistic FNB transaction descriptions.
`;

    if (comment) {
        prompt += `\n\nADDITIONAL USER REQUIREMENTS: ${comment}`;
    }

    return prompt;
};
