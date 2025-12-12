export interface AccountDetails {
    account_number: string;
    branch_code: string;
    tax_invoice_number: string;
    vat_registration_number: string;
}

export interface StatementPeriod {
    from: string;
    to: string;
    generation_date: string;
}

export interface TransactionItem {
    date: string;
    description: string;
    fees: number | '-';
    money_out: number | '-';
    money_in: number | '-';
    balance: number;
}

export interface Summary {
    total_fees: number;
    total_money_out: number;
    total_money_in: number;
}

export interface BankDetails {
    registered_name: string;
    registration_number: string;
    fsp_number: string;
    credit_provider_number: string;
    address: string;
    website: string;
    contact_number: string;
}

export interface TymeBankStatement {
    bank: string;
    statement_type: string;
    account_holder: string;
    account_details: AccountDetails;
    statement_period: StatementPeriod;
    account_type: string;
    opening_balance: number;
    transactions: TransactionItem[];
    closing_balance: number;
    summary: Summary;
    bank_details: BankDetails;
    pages: string;
}
export const tymeBankSample: TymeBankStatement = {
    bank: 'TymeBank',
    statement_type: 'Monthly business account statement',
    account_holder: 'REBECCA KHAMBULA',
    account_details: {
        account_number: '51128758637',
        branch_code: '678910',
        tax_invoice_number: '002',
        vat_registration_number: 'Not Provided'
    },
    statement_period: {
        from: '01 Oct 2025',
        to: '31 Oct 2025',
        generation_date: '02 Nov 2025'
    },
    account_type: 'EveryDay account',
    opening_balance: 1500.0, // Starting with some balance
    transactions: [
        // October 1-5
        {
            date: '01 Oct 2025',
            description: 'Opening Balance',
            fees: '-',
            money_out: '-',
            money_in: '-',
            balance: 1500.0
        },
        {
            date: '01 Oct 2025',
            description: 'Salary Deposit - Standard Corp #wo eheh ehe ehe eh. Nice one baba',
            fees: '-',
            money_out: '-',
            money_in: 25000.0,
            balance: 26500.0
        },
        {
            date: '01 Oct 2025',
            description: 'Rent Payment - Online Transfer to Mr. Smith',
            fees: '-',
            money_out: 7500.0,
            money_in: '-',
            balance: 19000.0
        },
        {
            date: '01 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 18999.5
        },
        {
            date: '02 Oct 2025',
            description: 'Checkers Hyde Park - Groceries and Household Items',
            fees: '-',
            money_out: 1250.75,
            money_in: '-',
            balance: 17748.75
        },
        {
            date: '02 Oct 2025',
            description: 'Engen Rosebank - Fuel Payment',
            fees: '-',
            money_out: 850.0,
            money_in: '-',
            balance: 16898.75
        },
        {
            date: '02 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 16898.25
        },
        {
            date: '03 Oct 2025',
            description: 'Discovery Health - Medical Aid Premium',
            fees: '-',
            money_out: 3200.0,
            money_in: '-',
            balance: 13698.25
        },
        {
            date: '03 Oct 2025',
            description: 'Netflix Subscription - Monthly Recurring Payment',
            fees: '-',
            money_out: 139.0,
            money_in: '-',
            balance: 13559.25
        },
        {
            date: '03 Oct 2025',
            description: 'Woolworths Food - Weekend Groceries Purchase',
            fees: '-',
            money_out: 875.6,
            money_in: '-',
            balance: 12683.65
        },
        {
            date: '04 Oct 2025',
            description: 'ATM Withdrawal - FNB ATM Johannesburg CBD',
            fees: '-',
            money_out: 2000.0,
            money_in: '-',
            balance: 10683.65
        },
        {
            date: '04 Oct 2025',
            description: 'Fee: ATM Withdrawal Charge',
            fees: 8.5,
            money_out: '-',
            money_in: '-',
            balance: 10675.15
        },
        {
            date: '04 Oct 2025',
            description: 'Restaurant - The Grillhouse Sandton Dinner',
            fees: '-',
            money_out: 450.0,
            money_in: '-',
            balance: 10225.15
        },
        {
            date: '05 Oct 2025',
            description: 'Vodacom - Mobile Data and Airtime Top-up',
            fees: '-',
            money_out: 350.0,
            money_in: '-',
            balance: 9875.15
        },
        {
            date: '05 Oct 2025',
            description: 'DSTV Subscription - Premium Package Monthly',
            fees: '-',
            money_out: 899.0,
            money_in: '-',
            balance: 8976.15
        },
        {
            date: '05 Oct 2025',
            description: 'Takealot.com - Online Shopping Electronics',
            fees: '-',
            money_out: 1250.0,
            money_in: '-',
            balance: 7726.15
        },
        {
            date: '06 Oct 2025',
            description: 'Payment Received - Freelance Design Work Invoice #4567',
            fees: '-',
            money_out: '-',
            money_in: 5000.0,
            balance: 12726.15
        },
        {
            date: '06 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 12725.65
        },
        {
            date: '07 Oct 2025',
            description: 'Car Insurance - Outsurance Monthly Premium',
            fees: '-',
            money_out: 1250.0,
            money_in: '-',
            balance: 11475.65
        },
        {
            date: '07 Oct 2025',
            description: 'Gym Membership - Virgin Active Monthly',
            fees: '-',
            money_out: 450.0,
            money_in: '-',
            balance: 11025.65
        },
        {
            date: '08 Oct 2025',
            description: 'School Fees - Johannesburg Primary School',
            fees: '-',
            money_out: 1200.0,
            money_in: '-',
            balance: 9825.65
        },
        {
            date: '08 Oct 2025',
            description: 'CNA - Stationery and Office Supplies',
            fees: '-',
            money_out: 325.5,
            money_in: '-',
            balance: 9500.15
        },
        {
            date: '09 Oct 2025',
            description: 'BP Fourways - Fuel and Convenience Store',
            fees: '-',
            money_out: 650.0,
            money_in: '-',
            balance: 8850.15
        },
        {
            date: '09 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 8849.65
        },
        {
            date: '10 Oct 2025',
            description: 'Payment Received - Consulting Services Client ABC Corp',
            fees: '-',
            money_out: '-',
            money_in: 8000.0,
            balance: 16849.65
        },
        {
            date: '10 Oct 2025',
            description: 'Dis-Chem Pharmacies - Prescription Medication',
            fees: '-',
            money_out: 420.75,
            money_in: '-',
            balance: 16428.9
        },
        {
            date: '11 Oct 2025',
            description: 'Movie Tickets - Ster-Kinekor Nouveau Rosebank',
            fees: '-',
            money_out: 240.0,
            money_in: '-',
            balance: 16188.9
        },
        {
            date: '12 Oct 2025',
            description: 'Mr Price Home - Home Decor and Furniture',
            fees: '-',
            money_out: 875.0,
            money_in: '-',
            balance: 15313.9
        },
        {
            date: '12 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 15313.4
        },
        {
            date: '13 Oct 2025',
            description: 'Transfer to Savings Account - Monthly Savings Plan',
            fees: '-',
            money_out: 2000.0,
            money_in: '-',
            balance: 13313.4
        },
        {
            date: '13 Oct 2025',
            description: 'Pick n Pay - Weekly Grocery Shopping',
            fees: '-',
            money_out: 987.35,
            money_in: '-',
            balance: 12326.05
        },
        {
            date: '14 Oct 2025',
            description: 'Internet Payment - Web Africa Fiber Monthly',
            fees: '-',
            money_out: 899.0,
            money_in: '-',
            balance: 11427.05
        },
        {
            date: '14 Oct 2025',
            description: 'Payment Received - Web Development Project Final Payment',
            fees: '-',
            money_out: '-',
            money_in: 12000.0,
            balance: 23427.05
        },
        {
            date: '15 Oct 2025',
            description: 'Municipal Bill - City of Johannesburg Services',
            fees: '-',
            money_out: 1850.0,
            money_in: '-',
            balance: 21577.05
        },
        {
            date: '15 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 21576.55
        },
        {
            date: '16 Oct 2025',
            description: 'Car Service - Halfway Toyota Service Center',
            fees: '-',
            money_out: 3200.0,
            money_in: '-',
            balance: 18376.55
        },
        {
            date: '17 Oct 2025',
            description: 'Restaurant - Mugg & Bean Breakfast Meeting',
            fees: '-',
            money_out: 185.0,
            money_in: '-',
            balance: 18191.55
        },
        {
            date: '18 Oct 2025',
            description: 'Clothing - Cotton On Mall of Africa',
            fees: '-',
            money_out: 675.0,
            money_in: '-',
            balance: 17516.55
        },
        {
            date: '19 Oct 2025',
            description: 'Electronics - Incredible Connection Laptop Purchase',
            fees: '-',
            money_out: 12500.0,
            money_in: '-',
            balance: 5016.55
        },
        {
            date: '19 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 5016.05
        },
        {
            date: '20 Oct 2025',
            description: 'Payment Received - Photography Services Wedding Event',
            fees: '-',
            money_out: '-',
            money_in: 4500.0,
            balance: 9516.05
        },
        {
            date: '20 Oct 2025',
            description: 'Petrol - Shell Rosebank Fuel Station',
            fees: '-',
            money_out: 550.0,
            money_in: '-',
            balance: 8966.05
        },
        {
            date: '21 Oct 2025',
            description: 'Medical - Netcare Hospital Consultation Fee',
            fees: '-',
            money_out: 850.0,
            money_in: '-',
            balance: 8116.05
        },
        {
            date: '22 Oct 2025',
            description: 'Books - Exclusive Books Mall of Rosebank',
            fees: '-',
            money_out: 320.0,
            money_in: '-',
            balance: 7796.05
        },
        {
            date: '22 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 7795.55
        },
        {
            date: '23 Oct 2025',
            description: 'Bank Charges - Monthly Account Fee',
            fees: '-',
            money_out: 65.0,
            money_in: '-',
            balance: 7730.55
        },
        {
            date: '24 Oct 2025',
            description: 'Insurance - Life Cover Premium Liberty Life',
            fees: '-',
            money_out: 450.0,
            money_in: '-',
            balance: 7280.55
        },
        {
            date: '25 Oct 2025',
            description: 'Salary Deposit - Monthly Salary Standard Corp',
            fees: '-',
            money_out: '-',
            money_in: 25000.0,
            balance: 32280.55
        },
        {
            date: '25 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 32280.05
        },
        {
            date: '26 Oct 2025',
            description: 'Investment - Unit Trusts Monthly Contribution',
            fees: '-',
            money_out: 3000.0,
            money_in: '-',
            balance: 29280.05
        },
        {
            date: '27 Oct 2025',
            description: 'Furniture - @home Living Room Set',
            fees: '-',
            money_out: 8500.0,
            money_in: '-',
            balance: 20780.05
        },
        {
            date: '28 Oct 2025',
            description: 'Payment Received - PaySnap Invoice Payment',
            fees: '-',
            money_out: '-',
            money_in: 985.0,
            balance: 21765.05
        },
        {
            date: '28 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 21764.55
        },
        {
            date: '28 Oct 2025',
            description: 'Purchase at GRACES KITCHEN 175412 JOHANNESBURG ZA 530112865501',
            fees: '-',
            money_out: 65.0,
            money_in: '-',
            balance: 21699.55
        },
        {
            date: '28 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 21699.05
        },
        {
            date: '28 Oct 2025',
            description: 'Purchase at EMASOFENI 168003 SOWETO ZA 530112868330',
            fees: '-',
            money_out: 96.0,
            money_in: '-',
            balance: 21603.05
        },
        {
            date: '28 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 21602.55
        },
        {
            date: '28 Oct 2025',
            description: 'Purchase at IK Zwakala Naghha Trad ELDORADOPARK ZA 530115955616',
            fees: '-',
            money_out: 93.0,
            money_in: '-',
            balance: 21509.55
        },
        {
            date: '28 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 21509.05
        },
        {
            date: '28 Oct 2025',
            description: 'Purchase at BP DEVLAND FORECOURT JOHANNESBURG ZA 530116470154',
            fees: '-',
            money_out: 440.0,
            money_in: '-',
            balance: 21069.05
        },
        {
            date: '28 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 21068.55
        },
        {
            date: '28 Oct 2025',
            description: 'Immediate EFT for Payment - Client XYZ Corporation',
            fees: '-',
            money_out: '-',
            money_in: 7200.0,
            balance: 28268.55
        },
        {
            date: '28 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 28268.05
        },
        {
            date: '28 Oct 2025',
            description: 'Purchase at KFC Eldorado Park Eldoradopark ZA 530117720270',
            fees: '-',
            money_out: 382.7,
            money_in: '-',
            balance: 27885.35
        },
        {
            date: '29 Oct 2025',
            description: 'Payment Received - Final Settlement Legal Matter',
            fees: '-',
            money_out: '-',
            money_in: 15000.0,
            balance: 42885.35
        },
        {
            date: '29 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: 0.5,
            money_out: '-',
            money_in: '-',
            balance: 42884.85
        },
        {
            date: '30 Oct 2025',
            description: 'Tax Payment - SARS Provisional Tax',
            fees: '-',
            money_out: 5000.0,
            money_in: '-',
            balance: 37884.85
        },
        {
            date: '31 Oct 2025',
            description: 'Charity Donation - Red Cross Monthly Contribution',
            fees: '-',
            money_out: 500.0,
            money_in: '-',
            balance: 37384.85
        },
        {
            date: '31 Oct 2025',
            description: 'Closing Balance - End of Month',
            fees: '-',
            money_out: '-',
            money_in: '-',
            balance: 37384.85
        }
    ],
    closing_balance: 37384.85,
    summary: {
        total_fees: 15.0, // Updated based on all fees
        total_money_out: 68966.5, // Updated based on all money out
        total_money_in: 100770.0 // Updated based on all money in
    },
    bank_details: {
        registered_name: 'Tyme Bank Limited',
        registration_number: '2015/23151006',
        fsp_number: '49140',
        credit_provider_number: 'NCRCP 10774',
        address: '30 Jellicoe Avenue, Rosebank 2196',
        website: 'www.tymebank.co.za',
        contact_number: '0860 999 119'
    },
    pages: '1 of 3' // Will be updated by the PDF generator
};
