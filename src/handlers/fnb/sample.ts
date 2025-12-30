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
        reference_number: 'SMT0989249613536',
        issue_date: '30/12/2025',
        statement_period: '01 October 2025 to 31 December 2025',
        statement_date: '31/12/2025',
        customer_name: 'MR JOHN DOE',
        customer_id: '010801',
        customer_address: {
            street_number: '456',
            street_name: 'Elm Street',
            location: 'Johannesburg',
            postal_code: '2000'
        },
        account_number: '63152517855',
        account_type: 'Business Account',
        tax_invoice_statement_number: '1',
        branch_code: '260665',
        branch_address: 'P O Box 5711, Weiteweden Park, 1709',
        contact_numbers: {
            lost_cards: '087-575-9406',
            account_enquiries: '087-736-2247',
            relationship_manager: '(087) 345-0702'
        },
        vat_numbers: { customer: 'Not Provided', bank: '4210102051' }
    },
    balances: {
        opening_balance: { amount: '1003.00', action: 'Cr' },
        closing_balance: { amount: '230.84', action: 'Cr' },
        vat_inclusive: { amount: '0.00', action: null },
        total_vat_zar: { amount: '0.00', action: null }
    },
    bank_charges: {
        service_fees: { amount: '1708.98', action: 'Dr' },
        cash_deposit_fees: { amount: '0.00', action: 'Dr' },
        cash_handling_fees: { amount: '0.00', action: 'Dr' },
        other_fees: { amount: '0.00', action: 'Dr' }
    },
    interest_rates: { credit_rate: 'Tiered', debit_rate: '24.00%' },
    transactions: [
        {
            date: '01 Nov',
            description: 'Payshap Account Off-Us Landlord',
            amount: '-2570.44',
            action: 'Dr',
            balance: '-1570.44',
            fees: '3.00'
        },
        {
            date: '02 Nov',
            description: 'Debit Order: CarTrack',
            amount: '-145.60',
            action: 'Dr',
            balance: '-1716.04',
            fees: '3.00'
        },
        {
            date: '02 Nov',
            description: 'POS Purchase Shoprite Devland',
            amount: '-387.25',
            action: 'Dr',
            balance: '-2103.29',
            fees: '3.68'
        },
        {
            date: '03 Nov',
            description: 'Debit Order: Insurance',
            amount: '-325.87',
            action: 'Dr',
            balance: '-2429.16',
            fees: '3.00'
        },
        {
            date: '04 Nov',
            description: 'ATM Cash 00505167',
            amount: '-500.00',
            action: 'Dr',
            balance: '-2929.16',
            fees: '57.54'
        },
        {
            date: '05 Nov',
            description: 'FNB App Prepaid Airtime 0746510683',
            amount: '-100.00',
            action: 'Dr',
            balance: '-3029.16',
            fees: '2.50'
        },
        {
            date: '06 Nov',
            description: 'Payshap Account Off-Us Rg Innovations',
            amount: '-200.00',
            action: 'Dr',
            balance: '-3229.16',
            fees: '3.00'
        },
        {
            date: '07 Nov',
            description: 'POS Purchase Pick n Pay Randburg',
            amount: '-245.73',
            action: 'Dr',
            balance: '-3474.89',
            fees: '3.68'
        },
        {
            date: '08 Nov',
            description: 'ATM Cash 00321456',
            amount: '-800.00',
            action: 'Dr',
            balance: '-4274.89',
            fees: '104.80'
        },
        {
            date: '09 Nov',
            description: 'Debit Order: Funeral',
            amount: '-189.50',
            action: 'Dr',
            balance: '-4464.39',
            fees: '3.00'
        },
        {
            date: '10 Nov',
            description: 'POS Purchase Engen Rosebank',
            amount: '-550.00',
            action: 'Dr',
            balance: '-5014.39',
            fees: '3.68'
        },
        {
            date: '11 Nov',
            description: 'FNB App Payment From Payment',
            amount: '-150.00',
            action: 'Dr',
            balance: '-5164.39',
            fees: '3.00'
        },
        {
            date: '12 Nov',
            description: 'Debit Order: Gym',
            amount: '-345.00',
            action: 'Dr',
            balance: '-5509.39',
            fees: '3.00'
        },
        {
            date: '13 Nov',
            description: 'Payshap Account Off-Us Ads',
            amount: '-120.00',
            action: 'Dr',
            balance: '-5629.39',
            fees: '3.00'
        },
        {
            date: '14 Nov',
            description: 'ATM Cash 00234567',
            amount: '-300.00',
            action: 'Dr',
            balance: '-5929.39',
            fees: '57.54'
        },
        {
            date: '15 Nov',
            description: 'POS Purchase Woolworths Sandton',
            amount: '-425.60',
            action: 'Dr',
            balance: '-6354.99',
            fees: '3.68'
        },
        {
            date: '16 Nov',
            description: 'Debit Order: Home Loans',
            amount: '-1250.00',
            action: 'Dr',
            balance: '-7604.99',
            fees: '3.00'
        },
        {
            date: '17 Nov',
            description: 'FNB App Prepaid Electricity 0746510683',
            amount: '-50.00',
            action: 'Dr',
            balance: '-7654.99',
            fees: '2.50'
        },
        {
            date: '18 Nov',
            description: 'POS Purchase Dischem Fourways',
            amount: '-187.35',
            action: 'Dr',
            balance: '-7842.34',
            fees: '3.68'
        },
        {
            date: '19 Nov',
            description: 'ATM Cash 00456789',
            amount: '-200.00',
            action: 'Dr',
            balance: '-8042.34',
            fees: '57.54'
        },
        {
            date: '20 Nov',
            description: 'Payshap Account Off-Us Rg Innovations',
            amount: '-80.00',
            action: 'Dr',
            balance: '-8122.34',
            fees: '3.00'
        },
        {
            date: '21 Nov',
            description: 'Debit Order: CarTrack',
            amount: '-159.00',
            action: 'Dr',
            balance: '-8281.34',
            fees: '3.00'
        },
        {
            date: '22 Nov',
            description: 'POS Purchase Checkers Cresta',
            amount: '-312.45',
            action: 'Dr',
            balance: '-8593.79',
            fees: '3.68'
        },
        {
            date: '23 Nov',
            description: 'FNB App Transfer From Sender',
            amount: '-100.00',
            action: 'Dr',
            balance: '-8693.79',
            fees: '3.00'
        },
        {
            date: '24 Nov',
            description: 'ATM Cash 00123456',
            amount: '-1000.00',
            action: 'Dr',
            balance: '-9693.79',
            fees: '104.80'
        },
        {
            date: '25 Nov',
            description: 'Salary Payment from Tech Innovations',
            amount: '13636.25',
            action: 'Cr',
            balance: '3942.46',
            fees: null
        },
        {
            date: '26 Nov',
            description: 'Send Money App Dr Send Lamar Sean',
            amount: '-200.00',
            action: 'Dr',
            balance: '3742.46',
            fees: '7.24'
        },
        {
            date: '27 Nov',
            description: 'Debit Order: Insurance',
            amount: '-450.00',
            action: 'Dr',
            balance: '3292.46',
            fees: '3.00'
        },
        {
            date: '28 Nov',
            description: 'POS Purchase Makro Woodmead',
            amount: '-675.30',
            action: 'Dr',
            balance: '2617.16',
            fees: '3.68'
        },
        {
            date: '29 Nov',
            description: 'Payshap Account Off-Us Rg Innovations',
            amount: '-500.00',
            action: 'Dr',
            balance: '2117.16',
            fees: '3.00'
        },
        {
            date: '30 Nov',
            description: 'Monthly Account Admin Fee',
            amount: '-569.66',
            action: 'Dr',
            balance: '1547.50',
            fees: null
        },
        {
            date: '01 Dec',
            description: 'Payshap Account Off-Us Landlord',
            amount: '-2570.44',
            action: 'Dr',
            balance: '-1022.94',
            fees: '3.00'
        },
        {
            date: '02 Dec',
            description: 'Debit Order: CarTrack',
            amount: '-120.87',
            action: 'Dr',
            balance: '-1143.81',
            fees: '3.00'
        },
        {
            date: '03 Dec',
            description: 'POS Purchase Clicks Rosebank',
            amount: '-89.99',
            action: 'Dr',
            balance: '-1233.80',
            fees: '3.68'
        },
        {
            date: '04 Dec',
            description: 'ATM Cash 00505167',
            amount: '-4000.00',
            action: 'Dr',
            balance: '-5233.80',
            fees: '104.80'
        },
        {
            date: '05 Dec',
            description: 'FNB App Prepaid Airtime 0746510683',
            amount: '-50.00',
            action: 'Dr',
            balance: '-5283.80',
            fees: '2.50'
        },
        {
            date: '06 Dec',
            description: 'Payshap Account Off-Us Ads',
            amount: '-60.00',
            action: 'Dr',
            balance: '-5343.80',
            fees: '3.00'
        },
        {
            date: '07 Dec',
            description: 'POS Purchase Spar Randburg',
            amount: '-245.60',
            action: 'Dr',
            balance: '-5589.40',
            fees: '3.68'
        },
        {
            date: '08 Dec',
            description: 'ATM Cash 00321456',
            amount: '-500.00',
            action: 'Dr',
            balance: '-6089.40',
            fees: '57.54'
        },
        {
            date: '09 Dec',
            description: 'Debit Order: Funeral',
            amount: '-210.00',
            action: 'Dr',
            balance: '-6299.40',
            fees: '3.00'
        },
        {
            date: '10 Dec',
            description: 'POS Purchase Caltex Sandton',
            amount: '-600.00',
            action: 'Dr',
            balance: '-6899.40',
            fees: '3.68'
        },
        {
            date: '11 Dec',
            description: 'FNB App Payment From Payment',
            amount: '-100.00',
            action: 'Dr',
            balance: '-6999.40',
            fees: '3.00'
        },
        {
            date: '12 Dec',
            description: 'Debit Order: Gym',
            amount: '-399.00',
            action: 'Dr',
            balance: '-7398.40',
            fees: '3.00'
        },
        {
            date: '13 Dec',
            description: 'Payshap Account Off-Us Rg Innovations',
            amount: '-200.00',
            action: 'Dr',
            balance: '-7598.40',
            fees: '3.00'
        },
        {
            date: '14 Dec',
            description: 'ATM Cash 00234567',
            amount: '-300.00',
            action: 'Dr',
            balance: '-7898.40',
            fees: '57.54'
        },
        {
            date: '15 Dec',
            description: 'POS Purchase Woolworths Sandton',
            amount: '-425.60',
            action: 'Dr',
            balance: '-8324.00',
            fees: '3.68'
        },
        {
            date: '16 Dec',
            description: 'Debit Order: Home Loans',
            amount: '-1500.00',
            action: 'Dr',
            balance: '-9824.00',
            fees: '3.00'
        },
        {
            date: '17 Dec',
            description: 'FNB App Prepaid Electricity 0746510683',
            amount: '-150.00',
            action: 'Dr',
            balance: '-9974.00',
            fees: '2.50'
        },
        {
            date: '18 Dec',
            description: 'POS Purchase Dischem Fourways',
            amount: '-187.35',
            action: 'Dr',
            balance: '-10161.35',
            fees: '3.68'
        },
        {
            date: '19 Dec',
            description: 'ATM Cash 00456789',
            amount: '-200.00',
            action: 'Dr',
            balance: '-10361.35',
            fees: '57.54'
        },
        {
            date: '20 Dec',
            description: 'Payshap Account Off-Us Rg Innovations',
            amount: '-80.00',
            action: 'Dr',
            balance: '-10441.35',
            fees: '3.00'
        },
        {
            date: '21 Dec',
            description: 'Debit Order: CarTrack',
            amount: '-159.00',
            action: 'Dr',
            balance: '-10600.35',
            fees: '3.00'
        },
        {
            date: '22 Dec',
            description: 'POS Purchase Checkers Cresta',
            amount: '-312.45',
            action: 'Dr',
            balance: '-10912.80',
            fees: '3.68'
        },
        {
            date: '23 Dec',
            description: 'FNB App Transfer From Sender',
            amount: '-100.00',
            action: 'Dr',
            balance: '-11012.80',
            fees: '3.00'
        },
        {
            date: '24 Dec',
            description: 'ATM Cash 00123456',
            amount: '-1000.00',
            action: 'Dr',
            balance: '-12012.80',
            fees: '104.80'
        },
        {
            date: '25 Dec',
            description: 'Salary Payment from Tech Innovations',
            amount: '13636.25',
            action: 'Cr',
            balance: '1623.45',
            fees: null
        },
        {
            date: '26 Dec',
            description: 'Send Money App Dr Send Portia Portia',
            amount: '-300.00',
            action: 'Dr',
            balance: '1323.45',
            fees: '7.24'
        },
        {
            date: '27 Dec',
            description: 'Debit Order: Insurance',
            amount: '-380.25',
            action: 'Dr',
            balance: '943.20',
            fees: '3.00'
        },
        {
            date: '28 Dec',
            description: 'POS Purchase Makro Woodmead',
            amount: '-675.30',
            action: 'Dr',
            balance: '267.90',
            fees: '3.68'
        },
        {
            date: '29 Dec',
            description: 'Payshap Account Off-Us Rg Innovations',
            amount: '-500.00',
            action: 'Dr',
            balance: '-232.10',
            fees: '3.00'
        },
        {
            date: '30 Dec',
            description: 'Monthly Account Admin Fee',
            amount: '-569.66',
            action: 'Dr',
            balance: '-801.76',
            fees: null
        },
        {
            date: '01 Oct',
            description: 'Payshap Account Off-Us Landlord',
            amount: '-2570.44',
            action: 'Dr',
            balance: '-3372.20',
            fees: '3.00'
        },
        {
            date: '02 Oct',
            description: 'Debit Order: CarTrack',
            amount: '-110.50',
            action: 'Dr',
            balance: '-3482.70',
            fees: '3.00'
        },
        {
            date: '03 Oct',
            description: 'POS Purchase Shoprite Devland',
            amount: '-387.25',
            action: 'Dr',
            balance: '-3869.95',
            fees: '3.68'
        },
        {
            date: '04 Oct',
            description: 'ATM Cash 00505167',
            amount: '-500.00',
            action: 'Dr',
            balance: '-4369.95',
            fees: '57.54'
        },
        {
            date: '05 Oct',
            description: 'FNB App Prepaid Airtime 0746510683',
            amount: '-100.00',
            action: 'Dr',
            balance: '-4469.95',
            fees: '2.50'
        },
        {
            date: '06 Oct',
            description: 'Payshap Account Off-Us Rg Innovations',
            amount: '-200.00',
            action: 'Dr',
            balance: '-4669.95',
            fees: '3.00'
        },
        {
            date: '07 Oct',
            description: 'POS Purchase Pick n Pay Randburg',
            amount: '-245.73',
            action: 'Dr',
            balance: '-4915.68',
            fees: '3.68'
        },
        {
            date: '08 Oct',
            description: 'ATM Cash 00321456',
            amount: '-800.00',
            action: 'Dr',
            balance: '-5715.68',
            fees: '104.80'
        },
        {
            date: '09 Oct',
            description: 'Debit Order: Funeral',
            amount: '-189.50',
            action: 'Dr',
            balance: '-5905.18',
            fees: '3.00'
        },
        {
            date: '10 Oct',
            description: 'POS Purchase Engen Rosebank',
            amount: '-550.00',
            action: 'Dr',
            balance: '-6455.18',
            fees: '3.68'
        },
        {
            date: '11 Oct',
            description: 'FNB App Payment From Payment',
            amount: '-150.00',
            action: 'Dr',
            balance: '-6605.18',
            fees: '3.00'
        },
        {
            date: '12 Oct',
            description: 'Debit Order: Gym',
            amount: '-345.00',
            action: 'Dr',
            balance: '-6950.18',
            fees: '3.00'
        },
        {
            date: '13 Oct',
            description: 'Payshap Account Off-Us Ads',
            amount: '-120.00',
            action: 'Dr',
            balance: '-7070.18',
            fees: '3.00'
        },
        {
            date: '14 Oct',
            description: 'ATM Cash 00234567',
            amount: '-300.00',
            action: 'Dr',
            balance: '-7370.18',
            fees: '57.54'
        },
        {
            date: '15 Oct',
            description: 'POS Purchase Woolworths Sandton',
            amount: '-425.60',
            action: 'Dr',
            balance: '-7795.78',
            fees: '3.68'
        },
        {
            date: '16 Oct',
            description: 'Debit Order: Home Loans',
            amount: '-1250.00',
            action: 'Dr',
            balance: '-9045.78',
            fees: '3.00'
        },
        {
            date: '17 Oct',
            description: 'FNB App Prepaid Electricity 0746510683',
            amount: '-50.00',
            action: 'Dr',
            balance: '-9095.78',
            fees: '2.50'
        },
        {
            date: '18 Oct',
            description: 'POS Purchase Dischem Fourways',
            amount: '-187.35',
            action: 'Dr',
            balance: '-9283.13',
            fees: '3.68'
        },
        {
            date: '19 Oct',
            description: 'ATM Cash 00456789',
            amount: '-200.00',
            action: 'Dr',
            balance: '-9483.13',
            fees: '57.54'
        },
        {
            date: '20 Oct',
            description: 'Payshap Account Off-Us Rg Innovations',
            amount: '-80.00',
            action: 'Dr',
            balance: '-9563.13',
            fees: '3.00'
        },
        {
            date: '21 Oct',
            description: 'Debit Order: CarTrack',
            amount: '-159.00',
            action: 'Dr',
            balance: '-9722.13',
            fees: '3.00'
        },
        {
            date: '22 Oct',
            description: 'POS Purchase Checkers Cresta',
            amount: '-312.45',
            action: 'Dr',
            balance: '-10034.58',
            fees: '3.68'
        },
        {
            date: '23 Oct',
            description: 'FNB App Transfer From Sender',
            amount: '-100.00',
            action: 'Dr',
            balance: '-10134.58',
            fees: '3.00'
        },
        {
            date: '24 Oct',
            description: 'ATM Cash 00123456',
            amount: '-1000.00',
            action: 'Dr',
            balance: '-11134.58',
            fees: '104.80'
        },
        {
            date: '25 Oct',
            description: 'Salary Payment from Tech Innovations',
            amount: '13636.25',
            action: 'Cr',
            balance: '2501.67',
            fees: null
        },
        {
            date: '26 Oct',
            description: 'Send Money App Dr Send Lamar Sean',
            amount: '-200.00',
            action: 'Dr',
            balance: '2301.67',
            fees: '7.24'
        },
        {
            date: '27 Oct',
            description: 'Debit Order: Insurance',
            amount: '-325.87',
            action: 'Dr',
            balance: '1975.80',
            fees: '3.00'
        },
        {
            date: '28 Oct',
            description: 'POS Purchase Makro Woodmead',
            amount: '-675.30',
            action: 'Dr',
            balance: '1300.50',
            fees: '3.68'
        },
        {
            date: '29 Oct',
            description: 'Payshap Account Off-Us Rg Innovations',
            amount: '-500.00',
            action: 'Dr',
            balance: '800.50',
            fees: '3.00'
        },
        {
            date: '30 Oct',
            description: 'Monthly Account Admin Fee',
            amount: '-569.66',
            action: 'Dr',
            balance: '230.84',
            fees: null
        }
    ],
    turnover_summary: {
        credit_transactions: { count: 3, total: '40908.75', action: 'Cr' },
        debit_transactions: { count: 88, total: '41677.91', action: 'Dr' }
    }
};
