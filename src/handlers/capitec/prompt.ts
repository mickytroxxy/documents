import { FormStatementPrompt } from '../standard/prompt';

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
   • Home Loans: R4000.00-R12000.00
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
BALANCE CALCULATION RULES (CRITICAL - MUST FOLLOW EXACTLY)
=================================================================
• Starting balance: R${openBalance.toFixed(2)}
• Each transaction: new_balance = previous_balance + money_in - money_out - fee
• money_in is positive (e.g., 20000.00), money_out is negative (e.g., -300.00), fee is negative (e.g., -1.00)
• Final balance in the LAST transaction MUST EXACTLY be: R${availableBalance.toFixed(2)}
• Balance can go negative temporarily, but recover with deposits
• Include 2-3 insufficient funds scenarios with -6.00 fees
• NO balance adjustments or corrections - calculate progressively and accurately
• If the final balance doesn't match R${availableBalance.toFixed(2)}, the response is INVALID

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
OUTPUT REQUIREMENTS (STRICT)
=================================================================
• EXACTLY ${transactionCount} transactions
• NO future dates
• Multiple transactions per day (some days 2-5 transactions)
• Dates may repeat
• NO adjustment/balance-fixing descriptions
• All money_out values negative: -300.00, -500.00
• All fee values negative: -1.00, -6.00, -10.00
• All money_in values positive: 20000.00, 500.00
• Final balance in the last transaction MUST EXACTLY be: R${availableBalance.toFixed(2)}
• RETURN ONLY JSON OBJECT with transactions array and address, NO EXPLANATIONS
• NO additional text before or after JSON
• We also need the physical address in the output
• We also need money_in live better round-up transfers
• BALANCE MUST BE CALCULATED PROGRESSIVELY: balance = previous_balance + money_in + money_out + fee (since money_out and fee are negative)
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
