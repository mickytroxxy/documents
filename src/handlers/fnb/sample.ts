interface ContactNumbers {
    lost_cards: string;
    account_enquiries: string;
    relationship_manager: string;
}

interface VATNumbers {
    customer: string;
    bank: string;
}

export interface FNBAddressType {
    street_number: string;
    street_name: string;
    location: string;
    postal_code: string;
}

interface StatementInfo {
    reference_number: string;
    issue_date: string;
    statement_period: string;
    statement_date: string;
    customer_name: string;
    customer_id: string;
    customer_address: FNBAddressType;
    account_number: string;
    account_type: string;
    tax_invoice_statement_number: string;
    branch_code: string;
    branch_address: string;
    contact_numbers: ContactNumbers;
    vat_numbers: VATNumbers;
}

interface Balance {
    amount: string;
    action: 'Cr' | 'Dr' | null;
}

interface BankCharge {
    amount: string;
    action: 'Cr' | 'Dr' | null;
}

interface Balances {
    opening_balance: Balance;
    closing_balance: Balance;
    vat_inclusive: Balance;
    total_vat_zar: Balance;
}

interface BankCharges {
    service_fees: BankCharge;
    cash_deposit_fees: BankCharge;
    cash_handling_fees: BankCharge;
    other_fees: BankCharge;
}

interface InterestRates {
    credit_rate: string;
    debit_rate: string;
}

export interface Transaction {
    date: string;
    description: string;
    amount: string;
    action: 'Cr' | 'Dr' | null;
    balance: string;
    fees: string | null;
}

interface CreditTransactions {
    count: number;
    total: string;
    action: 'Cr' | 'Dr' | null;
}

interface DebitTransactions {
    count: number;
    total: string;
    action: 'Cr' | 'Dr' | null;
}

interface TurnoverSummary {
    credit_transactions: CreditTransactions;
    debit_transactions: DebitTransactions;
}

export interface FNBBankStatementType {
    statement_info: StatementInfo;
    balances: Balances;
    bank_charges: BankCharges;
    interest_rates: InterestRates;
    transactions: Transaction[];
    turnover_summary: TurnoverSummary;
}

export const fnb_sample_statement: FNBBankStatementType = {
    statement_info: {
        reference_number: 'SMT7920466253',
        issue_date: '2912/2025',
        statement_period: '31 October 2025 to 30 November 2025',
        statement_date: '30 November 2025',
        customer_name: 'RG INNOVATIONS (PTY) LTD',
        customer_id: '11261',
        customer_address: {
            street_number: '11261',
            street_name: 'KUWADZANA EXT',
            location: 'HARARE',
            postal_code: '0000 ZIMBABWE'
        },
        account_number: '63152517852',
        account_type: 'Gold Business Account',
        tax_invoice_statement_number: '8',
        branch_code: '260665',
        branch_address: 'P O Box 5711, Weiteweden Park, 1709',
        contact_numbers: {
            lost_cards: '087-575-9406',
            account_enquiries: '087-736-2247',
            relationship_manager: '(087) 345-0702'
        },
        vat_numbers: {
            customer: 'Not Provided',
            bank: '4210102051'
        }
    },
    balances: {
        opening_balance: { amount: '153.40', action: 'Dr' },
        closing_balance: { amount: '1,113.44', action: 'Cr' },
        vat_inclusive: { amount: '92.49', action: 'Dr' },
        total_vat_zar: { amount: '92.49', action: 'Dr' }
    },
    bank_charges: {
        service_fees: { amount: '569.66', action: 'Dr' },
        cash_deposit_fees: { amount: '9.08', action: 'Dr' },
        cash_handling_fees: { amount: '0.00', action: 'Dr' },
        other_fees: { amount: '130.54', action: 'Dr' }
    },
    interest_rates: {
        credit_rate: 'Tiered',
        debit_rate: '24.00%'
    },
    transactions: [
        {
            date: '04 Nov',
            description: 'Payshap Credit Betterdays',
            amount: '1,800.00',
            action: 'Cr',
            balance: '1,646.60',
            fees: null
        },
        {
            date: '04 Nov',
            description: 'Payshap Account Off-Us Rg Innovations',
            amount: '120.00',
            action: 'Dr',
            balance: '1,526.60',
            fees: '3.00'
        },
        {
            date: '04 Nov',
            description: 'FNB App Prepaid Aftime 0746510683',
            amount: '50.00',
            action: 'Dr',
            balance: '1,476.60',
            fees: '2.50'
        },
        {
            date: '05 Nov',
            description: 'FNB App Payment From Payment',
            amount: '310.00',
            action: 'Cr',
            balance: '1,786.60',
            fees: null
        },
        {
            date: '06 Nov',
            description: 'Payshap Account Off-Us Rg Innovations',
            amount: '25.00',
            action: 'Dr',
            balance: '1,761.60',
            fees: '3.00'
        },
        {
            date: '06 Nov',
            description: 'FNB App Payment From Billions Vip Rentals',
            amount: '1,500.00',
            action: 'Cr',
            balance: '3,261.60',
            fees: null
        },
        {
            date: '06 Nov',
            description: 'Payshap Account Off-Us Ads',
            amount: '400.00',
            action: 'Dr',
            balance: '2,861.60',
            fees: '3.00'
        },
        {
            date: '06 Nov',
            description: 'FNB App Ric Pint To Ryan',
            amount: '200.00',
            action: 'Dr',
            balance: '2,861.60',
            fees: '3.00'
        },
        {
            date: '06 Nov',
            description: 'Payshap Account Off-Us T Shirt',
            amount: '200.00',
            action: 'Dr',
            balance: '2,461.60',
            fees: '3.00'
        },
        {
            date: '06 Nov',
            description: 'Payshap Account Off-Us Cap',
            amount: '180.00',
            action: 'Dr',
            balance: '2,281.60',
            fees: '3.00'
        },
        {
            date: '04 Nov',
            description: 'Payshap Credit Betterdays',
            amount: '1,800.00',
            action: 'Cr',
            balance: '1,646.60',
            fees: null
        },
        {
            date: '04 Nov',
            description: 'Payshap Account Off-Us Rg Innovations',
            amount: '120.00',
            action: 'Dr',
            balance: '1,526.60',
            fees: '3.00'
        },
        {
            date: '04 Nov',
            description: 'FNB App Prepaid Aftime 0746510683',
            amount: '50.00',
            action: 'Dr',
            balance: '1,476.60',
            fees: '2.50'
        },
        {
            date: '05 Nov',
            description: 'FNB App Payment From Payment',
            amount: '310.00',
            action: 'Cr',
            balance: '1,786.60',
            fees: null
        },
        {
            date: '06 Nov',
            description: 'Payshap Account Off-Us Rg Innovations',
            amount: '25.00',
            action: 'Dr',
            balance: '1,761.60',
            fees: '3.00'
        },
        {
            date: '06 Nov',
            description: 'FNB App Payment From Billions Vip Rentals',
            amount: '1,500.00',
            action: 'Cr',
            balance: '3,261.60',
            fees: null
        },
        {
            date: '06 Nov',
            description: 'Payshap Account Off-Us Ads',
            amount: '400.00',
            action: 'Dr',
            balance: '2,861.60',
            fees: '3.00'
        },
        {
            date: '06 Nov',
            description: 'FNB App Ric Pint To Ryan',
            amount: '200.00',
            action: 'Dr',
            balance: '2,861.60',
            fees: '3.00'
        },
        {
            date: '06 Nov',
            description: 'Payshap Account Off-Us T Shirt',
            amount: '200.00',
            action: 'Dr',
            balance: '2,461.60',
            fees: '3.00'
        },
        {
            date: '06 Nov',
            description: 'Payshap Account Off-Us Cap',
            amount: '180.00',
            action: 'Dr',
            balance: '2,281.60',
            fees: '3.00'
        },
        {
            date: '06 Nov',
            description: 'Send Money App Dr Send Lamar Sean',
            amount: '200.00',
            action: 'Dr',
            balance: '2,081.60',
            fees: '7.24'
        },
        {
            date: '06 Nov',
            description: 'Online Send Reversal Cf Send Rev 27677299995',
            amount: '200.00',
            action: 'Cr',
            balance: '2,281.60',
            fees: null
        },
        {
            date: '06 Nov',
            description: 'JErwa Manual Reversal Fee Send Rev',
            amount: '19.00',
            action: 'Dr',
            balance: '2,262.60',
            fees: null
        },
        {
            date: '06 Nov',
            description: 'POS Purchase Shopfile Devland',
            amount: '55.73',
            action: 'Dr',
            balance: '2,206.87',
            fees: '3.68'
        },
        {
            date: '07 Nov',
            description: 'Payshap Account Off-Us Food',
            amount: '250.00',
            action: 'Dr',
            balance: '1,966.87',
            fees: '3.00'
        },
        {
            date: '07 Nov',
            description: '#Debit Card POS Unsuccessful If #Fee Declined Purch Tran 4854422151000846',
            amount: '6.00',
            action: 'Dr',
            balance: '1,980.87',
            fees: null
        },
        {
            date: '07 Nov',
            description: '#Debit Card POS Unsuccessful If #Fee Declined Purch Tran 4854422151000846',
            amount: '6.00',
            action: 'Dr',
            balance: '1,944.87',
            fees: null
        },
        {
            date: '07 Nov',
            description: 'Cha Card ATM Local Cash Advance Cash Devland Shopri 74552165309000124039',
            amount: '1,700.00',
            action: 'Dr',
            balance: '244.87',
            fees: '57.54'
        },
        {
            date: '08 Nov',
            description: 'Payshap Credit Betterdays 1880417804',
            amount: '1,900.00',
            action: 'Cr',
            balance: '2,144.87',
            fees: null
        },
        {
            date: '10 Nov',
            description: 'Ric Credit Betterdays 48544208046',
            amount: '7,000.00',
            action: 'Cr',
            balance: '9,144.87',
            fees: null
        },
        {
            date: '10 Nov',
            description: 'ATM Cash 00505167',
            amount: '4,000.00',
            action: 'Dr',
            balance: '5,144.87',
            fees: '104.80'
        },
        {
            date: '10 Nov',
            description: 'Send Money App Dr Send Ryan Goofi',
            amount: '3,000.00',
            action: 'Dr',
            balance: '2,144.87',
            fees: '80.60'
        },
        {
            date: '10 Nov',
            description: 'FNB App Transfer From Rr',
            amount: '200.00',
            action: 'Cr',
            balance: '2,344.87',
            fees: null
        },
        {
            date: '10 Nov',
            description: 'FNB App Payment From Payment',
            amount: '150.00',
            action: 'Cr',
            balance: '2,494.87',
            fees: null
        },
        {
            date: '10 Nov',
            description: 'Send Money App Dr Send Portia Portia',
            amount: '200.00',
            action: 'Dr',
            balance: '2,294.87',
            fees: '7.24'
        },
        {
            date: '10 Nov',
            description: 'Ric Credit Betterdays 48544208046',
            amount: '7,000.00',
            action: 'Cr',
            balance: '9,144.87',
            fees: null
        },
        {
            date: '10 Nov',
            description: 'ATM Cash 00505167',
            amount: '4,000.00',
            action: 'Dr',
            balance: '5,144.87',
            fees: '104.80'
        },
        {
            date: '10 Nov',
            description: 'Send Money App Dr Send Ryan Goofi',
            amount: '3,000.00',
            action: 'Dr',
            balance: '2,144.87',
            fees: '80.60'
        },
        {
            date: '10 Nov',
            description: 'FNB App Transfer From Rr',
            amount: '200.00',
            action: 'Cr',
            balance: '2,344.87',
            fees: null
        },
        {
            date: '10 Nov',
            description: 'FNB App Payment From Payment',
            amount: '150.00',
            action: 'Cr',
            balance: '2,494.87',
            fees: null
        },
        {
            date: '10 Nov',
            description: 'Send Money App Dr Send Portia Portia',
            amount: '200.00',
            action: 'Dr',
            balance: '2,294.87',
            fees: '7.24'
        },
        {
            date: '10 Nov',
            description: 'Ric Credit Betterdays 48544208046',
            amount: '7,000.00',
            action: 'Cr',
            balance: '9,144.87',
            fees: null
        },
        {
            date: '10 Nov',
            description: 'ATM Cash 00505167',
            amount: '4,000.00',
            action: 'Dr',
            balance: '5,144.87',
            fees: '104.80'
        },
        {
            date: '10 Nov',
            description: 'Send Money App Dr Send Ryan Goofi',
            amount: '3,000.00',
            action: 'Dr',
            balance: '2,144.87',
            fees: '80.60'
        },
        {
            date: '10 Nov',
            description: 'FNB App Transfer From Rr',
            amount: '200.00',
            action: 'Cr',
            balance: '2,344.87',
            fees: null
        },
        {
            date: '10 Nov',
            description: 'FNB App Payment From Payment',
            amount: '150.00',
            action: 'Cr',
            balance: '2,494.87',
            fees: null
        },
        {
            date: '10 Nov',
            description: 'Send Money App Dr Send Portia Portia',
            amount: '200.00',
            action: 'Dr',
            balance: '2,294.87',
            fees: '7.24'
        },
        {
            date: '10 Nov',
            description: 'Ric Credit Betterdays 48544208046',
            amount: '7,000.00',
            action: 'Cr',
            balance: '9,144.87',
            fees: null
        },
        {
            date: '10 Nov',
            description: 'ATM Cash 00505167',
            amount: '4,000.00',
            action: 'Dr',
            balance: '5,144.87',
            fees: '104.80'
        },
        {
            date: '10 Nov',
            description: 'Send Money App Dr Send Ryan Goofi',
            amount: '3,000.00',
            action: 'Dr',
            balance: '2,144.87',
            fees: '80.60'
        },
        {
            date: '10 Nov',
            description: 'FNB App Transfer From Rr',
            amount: '200.00',
            action: 'Cr',
            balance: '2,344.87',
            fees: null
        },
        {
            date: '10 Nov',
            description: 'FNB App Payment From Payment',
            amount: '150.00',
            action: 'Cr',
            balance: '2,494.87',
            fees: null
        },
        {
            date: '10 Nov',
            description: 'Send Money App Dr Send Portia Portia',
            amount: '200.00',
            action: 'Dr',
            balance: '2,294.87',
            fees: '7.24'
        }
    ],
    turnover_summary: {
        credit_transactions: {
            count: 0,
            total: '0.00',
            action: 'Cr'
        },
        debit_transactions: {
            count: 0,
            total: '0.00',
            action: 'Dr'
        }
    }
};
