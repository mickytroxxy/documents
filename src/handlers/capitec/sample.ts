export interface Transaction {
    date: string;
    description: string | null;
    category: string | null;
    money_in: number | null;
    money_out: number | null;
    fee: number | null;
    balance: number | null;
}

export interface CapitecAddressType {
    street: string;
    city: string;
    location: string;
    postal_code: string;
}
export interface CapitecBankStatement {
    account_holder: {
        name: string;
        account_number?: string;
        address: CapitecAddressType;
    };
    statement_period: {
        from_date: string;
        to_date: string;
    };
    balances: {
        opening_balance: number;
        closing_balance: number;
        available_balance: number;
    };
    money_in_summary: {
        total: number;
        breakdown: {
            other_income: number;
            cash_deposit: number;
            transfer: number;
            interest: number;
        };
    };
    live_better_benefits: {
        live_better_savings: number;
    };
    money_out_summary: {
        total: number;
        breakdown: {
            digital_payments: number;
            card_payments: number;
            cash_withdrawals: number;
            send_cash: number;
            fees: number;
            card_subscriptions: number;
            prepaid: number;
            debit_orders: number;
            transfer: number;
            vouchers: number;
        };
    };
    fee_summary: {
        total: number;
        breakdown: { name: string; value: number }[];
    };
    scheduled_payments: {
        debit_orders: Array<{
            date: string;
            description: string;
            amount: number;
        }>;
        card_subscriptions: Array<{
            date: string;
            description: string;
            amount: number;
        }>;
    };
    spending_summary: {
        breakdown: {
            cash_withdrawal: number;
            digital_payments: number;
            rent: number;
            uncategorised: number;
            groceries: number;
            fuel: number;
            online_store: number;
            alcohol: number;
            investments: number;
            children_dependants: number;
            software_games: number;
            takeaways: number;
            restaurants: number;
            cellphone: number;
            vehicle_tracking: number;
            activities: number;
            pharmacy: number;
            other_loans_accounts: number;
            betting_lottery: number;
            doctors_therapists: number;
        };
    };
    transaction_history: Transaction[];
}
export const capitec_sample: CapitecBankStatement = {
    account_holder: {
        name: 'MISS REBECCA KHAMBULA',
        account_number: '2234969383',
        address: {
            street: '3860 SUPERCHARGE STREET',
            city: 'DEVLAND',
            location: 'FREEDOM PARK',
            postal_code: '1811'
        }
    },
    statement_period: {
        from_date: '01/07/2025',
        to_date: '18/10/2025'
    },
    balances: {
        opening_balance: 0,
        closing_balance: 0,
        available_balance: 0
    },
    money_in_summary: {
        total: 99544.79,
        breakdown: {
            other_income: 91241.27,
            cash_deposit: 8060,
            transfer: 238.88,
            interest: 4.64
        }
    },
    live_better_benefits: {
        live_better_savings: 237.18
    },
    money_out_summary: {
        total: 99299.11,
        breakdown: {
            digital_payments: 41334.0,
            card_payments: 22622.95,
            cash_withdrawals: 22045.0,
            send_cash: 10720.0,
            fees: 915.19,
            card_subscriptions: 594.8,
            prepaid: 421.0,
            debit_orders: 259.0,
            transfer: 237.17,
            vouchers: 150.0
        }
    },
    fee_summary: {
        total: 913.19,
        breakdown: [
            { name: 'Cash Withdrawal Fee', value: 330.0 },
            { name: 'Cash Sent Fee', value: 180.0 },
            { name: 'Cash Deposit Fee (Notes)', value: 112.84 },
            { name: 'DebtCheck Insufficient Funds Fee', value: 60.0 },
            { name: 'External Immediate Payment Fee', value: 48.0 },
            { name: 'International Processing Fee', value: 31.0 },
            { name: 'Other Fees', value: 151.35 }
        ]
    },
    scheduled_payments: {
        debit_orders: [
            { date: '25/07/2025', description: 'CarTrack', amount: -100.0 },
            { date: '25/08/2025', description: 'CarTrack', amount: -159.0 }
        ],
        card_subscriptions: [
            { date: '09/08/2025', description: 'Canva* I04601-34333028', amount: -60.0 },
            { date: '26/08/2025', description: 'Netlify', amount: -70.94 },
            { date: '10/09/2025', description: 'Netlify', amount: -168.97 },
            { date: '12/09/2025', description: 'Canva* I04632-25969134', amount: -60.0 },
            { date: '18/09/2025', description: 'Afribost.com 2', amount: -1.0 },
            { date: '12/10/2025', description: 'Canva* I04662-33281010', amount: -60.0 },
            { date: '17/10/2025', description: 'Netlify', amount: -104.37 },
            { date: '17/10/2025', description: 'Netlify', amount: -69.52 }
        ]
    },
    spending_summary: {
        breakdown: {
            cash_withdrawal: -32765.0,
            digital_payments: -25030.0,
            rent: -13500.0,
            uncategorised: -6719.57,
            groceries: -6494.97,
            fuel: -3743.31,
            online_store: -2204.13,
            alcohol: -2080.93,
            investments: -1295.0,
            children_dependants: -900.0,
            software_games: -683.75,
            takeaways: -556.0,
            restaurants: -455.0,
            cellphone: -421.0,
            vehicle_tracking: -259.0,
            activities: -240.0,
            pharmacy: -230.09,
            other_loans_accounts: -180.0,
            betting_lottery: -150.0,
            doctors_therapists: -134.0
        }
    },
    transaction_history: [
        {
            date: '01/07/2025',
            description: 'Eft Debit Order Insufficient Funds (R180.00): Cartrack (CART30F55SHMZ2)',
            category: null,
            money_in: null,
            money_out: null,
            fee: null,
            balance: null
        },
        {
            date: '01/07/2025',
            description: 'Eft Debit Order Insufficient Funds Fee',
            category: 'Fees',
            money_in: null,
            money_out: null,
            fee: -6.0,
            balance: -120.45
        },
        {
            date: '01/07/2025',
            description: 'Registered Debit Order Insufficient Funds (R100.00): Cartrack (2121827)',
            category: null,
            money_in: null,
            money_out: null,
            fee: null,
            balance: null
        },
        {
            date: '01/07/2025',
            description: 'DebtCheck Insufficient Funds Fee',
            category: 'Fees',
            money_in: null,
            money_out: null,
            fee: -6.0,
            balance: -126.45
        },
        {
            date: '01/07/2025',
            description: 'Registered Debit Order Insufficient Funds (R100.00): Cartrack (2121827)',
            category: null,
            money_in: null,
            money_out: null,
            fee: null,
            balance: null
        },
        {
            date: '01/07/2025',
            description: 'DebtCheck Insufficient Funds Fee',
            category: 'Fees',
            money_in: null,
            money_out: null,
            fee: -6.0,
            balance: -132.45
        },
        {
            date: '05/07/2025',
            description: 'Payment Received: Rtc 05n0jh29tn Rebecca Khambula',
            category: 'Other Income',
            money_in: 3502.0,
            money_out: null,
            fee: null,
            balance: 3369.55
        },
        {
            date: '05/07/2025',
            description: 'ATM Balance Enquiry Fee',
            category: 'Fees',
            money_in: null,
            money_out: null,
            fee: -10.0,
            balance: 3359.55
        },
        {
            date: '05/07/2025',
            description: 'ATM Cash Withdrawal: Matlapeng Centr Soweto Za',
            category: 'Cash Withdrawal',
            money_in: null,
            money_out: -3300.0,
            fee: null,
            balance: null
        },
        {
            date: '07/07/2025',
            description: 'International Online Purchase Insufficient Funds Fee: Goodje *play G.co/helppay# Us',
            category: 'Fees',
            money_in: null,
            money_out: null,
            fee: -3.0,
            balance: 16.55
        },
        {
            date: '07/07/2025',
            description: 'International Online Purchase Insufficient Funds Fee: Goodje*play G.co/helppay# Us',
            category: 'Fees',
            money_in: null,
            money_out: null,
            fee: -3.0,
            balance: 13.55
        },
        {
            date: '08/07/2025',
            description: 'PayShap Payment Received: 22775837294876524544',
            category: 'Other Income',
            money_in: 1407.0,
            money_out: null,
            fee: null,
            balance: 1420.55
        },
        {
            date: '09/07/2025',
            description: 'PayShap Payment Received: Pay',
            category: 'Other Income',
            money_in: 532.51,
            money_out: null,
            fee: null,
            balance: 1953.06
        },
        {
            date: '09/07/2025',
            description: 'ATM Balance Enquiry Fee',
            category: 'Fees',
            money_in: null,
            money_out: null,
            fee: -10.0,
            balance: 1943.06
        },
        {
            date: '09/07/2025',
            description: 'ATM Cash Withdrawal: Matlapeng Centr Soweto Za',
            category: 'Cash Withdrawal',
            money_in: null,
            money_out: -100.0,
            fee: -10.0,
            balance: 1833.06
        },
        {
            date: '10/07/2025',
            description: 'Doctors Place Freedom Park (Card 7420)',
            category: 'Alcohol',
            money_in: null,
            money_out: -135.0,
            fee: null,
            balance: 1698.06
        },
        {
            date: '10/07/2025',
            description: 'Doctors Place Freedom Park (Card 7420)',
            category: 'Alcohol',
            money_in: null,
            money_out: -84.0,
            fee: null,
            balance: 1614.06
        },
        {
            date: '10/07/2025',
            description: 'Doctors Place Freedom Park (Card 7420)',
            category: 'Alcohol',
            money_in: null,
            money_out: -120.0,
            fee: null,
            balance: 1494.06
        },
        {
            date: '10/07/2025',
            description: 'Doctors Place Freedom Park (Card 7420)',
            category: 'Alcohol',
            money_in: null,
            money_out: -84.0,
            fee: null,
            balance: 1410.06
        },
        {
            date: '10/07/2025',
            description: 'Clicks Johannesburg (Card 7420)',
            category: 'Pharmacy',
            money_in: null,
            money_out: -230.09,
            fee: null,
            balance: 1179.97
        },
        {
            date: '11/07/2025',
            description: 'Online Purchase: Google Mountain View (Card 7420)',
            category: 'Online Store',
            money_in: null,
            money_out: -447.11,
            fee: -3.0,
            balance: 729.86
        },
        {
            date: '11/07/2025',
            description: 'Card Purchase & Cashback (R200.00): Shoprite Eldoradopark (Card 7420)',
            category: 'Groceries',
            money_in: null,
            money_out: -483.55,
            fee: -2.0,
            balance: 244.31
        },
        {
            date: '11/07/2025',
            description: 'BP Johannesburg (Card 7420)',
            category: 'Fuel',
            money_in: null,
            money_out: -200.0,
            fee: null,
            balance: 44.31
        },
        {
            date: '11/07/2025',
            description: 'Banking App Prepaid Purchase: Telkom Mobile',
            category: 'Cellphone',
            money_in: null,
            money_out: -12.0,
            fee: -0.5,
            balance: 31.81
        },
        {
            date: '15/07/2025',
            description: 'Payment Received: Rtc 05hrd4pgwn 0404420608',
            category: 'Other Income',
            money_in: 137.48,
            money_out: null,
            fee: null,
            balance: 169.29
        },
        {
            date: '16/07/2025',
            description: 'PayShap Payment Received: 22778811999949979648',
            category: 'Other Income',
            money_in: 340.05,
            money_out: null,
            fee: null,
            balance: 509.34
        },
        {
            date: '17/07/2025',
            description: 'Banking App Prepaid Purchase: Telkom Mobile',
            category: 'Cellphone',
            money_in: null,
            money_out: -35.0,
            fee: -0.5,
            balance: 473.84
        },
        {
            date: '18/07/2025',
            description: 'Doctors Place Freedom Park (Card 7420)',
            category: 'Alcohol',
            money_in: null,
            money_out: -84.0,
            fee: null,
            balance: 389.84
        },
        {
            date: '18/07/2025',
            description: 'Doctors Place Freedom Park (Card 7420)',
            category: 'Alcohol',
            money_in: null,
            money_out: -130.0,
            fee: null,
            balance: 259.84
        },
        {
            date: '20/07/2025',
            description: 'Card Purchase & Cashback (R50.00): Shoprite Eldoradopark (Card 7420)',
            category: 'Groceries',
            money_in: null,
            money_out: -229.91,
            fee: -2.0,
            balance: 27.93
        },
        {
            date: '25/07/2025',
            description: 'Payment Received: Rtc 161950e21e Rebecca',
            category: 'Other Income',
            money_in: 11457.0,
            money_out: null,
            fee: null,
            balance: 11484.93
        },
        {
            date: '25/07/2025',
            description: 'Banking App Prepaid Purchase: Telkom Mobile',
            category: 'Cellphone',
            money_in: null,
            money_out: -30.0,
            fee: -0.5,
            balance: 11454.43
        },
        {
            date: '25/07/2025',
            description: 'Registered Debit Order (2567297865): Cartrack (2121827)',
            category: 'Vehicle Tracking',
            money_in: null,
            money_out: -100.0,
            fee: -3.0,
            balance: 11351.43
        },
        {
            date: '25/07/2025',
            description: 'Banking App Immediate Payment: Mdu Landlord',
            category: 'Rent',
            money_in: null,
            money_out: -250.0,
            fee: -1.0,
            balance: 11100.43
        },
        {
            date: '25/07/2025',
            description: 'Banking App Immediate Payment: Mdu Landlord',
            category: 'Rent',
            money_in: null,
            money_out: -1750.0,
            fee: -1.0,
            balance: 9349.43
        },
        {
            date: '25/07/2025',
            description: 'Banking App Prepaid Purchase: MTN',
            category: 'Cellphone',
            money_in: null,
            money_out: -30.0,
            fee: -0.5,
            balance: 9318.93
        },
        {
            date: '25/07/2025',
            description: 'ATM Cash Withdrawal: Matlapeng Centr Soweto Za',
            category: 'Cash Withdrawal',
            money_in: null,
            money_out: -800.0,
            fee: -10.0,
            balance: 8508.93
        },
        {
            date: '26/07/2025',
            description: 'Banking App Immediate Payment: Mr Ms Mkhari',
            category: 'Digital Payments',
            money_in: null,
            money_out: -1200.0,
            fee: -1.0,
            balance: 7307.93
        },
        {
            date: '26/07/2025',
            description: 'Palee 210022 Devland (Card 7420)',
            category: 'Uncategorised',
            money_in: null,
            money_out: -180.0,
            fee: null,
            balance: 7127.93
        },
        {
            date: '26/07/2025',
            description: 'Palee 210022 Devland (Card 7420)',
            category: 'Uncategorised',
            money_in: null,
            money_out: -60.0,
            fee: null,
            balance: 7067.93
        },
        {
            date: '26/07/2025',
            description: 'Palee 210022 Devland (Card 7420)',
            category: 'Uncategorised',
            money_in: null,
            money_out: -60.0,
            fee: null,
            balance: 7007.93
        },
        {
            date: '26/07/2025',
            description: 'Palee 210022 Devland (Card 7420)',
            category: 'Uncategorised',
            money_in: null,
            money_out: -90.0,
            fee: null,
            balance: 6917.93
        },
        {
            date: '26/07/2025',
            description: 'Banking App Cash Sent: C*******936',
            category: 'Cash Withdrawal',
            money_in: null,
            money_out: -400.0,
            fee: -10.0,
            balance: 6507.93
        },
        {
            date: '26/07/2025',
            description: 'Banking App External PayShap Payment: Manyelani',
            category: 'Digital Payments',
            money_in: null,
            money_out: -300.0,
            fee: -6.0,
            balance: 6201.93
        },
        {
            date: '26/07/2025',
            description: 'Banking App External PayShap Payment: Manyelani',
            category: 'Digital Payments',
            money_in: null,
            money_out: -400.0,
            fee: -6.0,
            balance: 5795.93
        },
        {
            date: '27/07/2025',
            description: 'Doctors Place Freedom Park (Card 7420)',
            category: 'Alcohol',
            money_in: null,
            money_out: -230.0,
            fee: null,
            balance: 5565.93
        },
        {
            date: '27/07/2025',
            description: 'Doctors Place Freedom Park (Card 7420)',
            category: 'Alcohol',
            money_in: null,
            money_out: -84.0,
            fee: null,
            balance: 5481.93
        },
        {
            date: '27/07/2025',
            description: 'Doctors Place Freedom Park (Card 7420)',
            category: 'Alcohol',
            money_in: null,
            money_out: -146.0,
            fee: null,
            balance: 5335.93
        },
        {
            date: '27/07/2025',
            description: 'Doctors Place Freedom Park (Card 7420)',
            category: 'Alcohol',
            money_in: null,
            money_out: -86.0,
            fee: null,
            balance: 5249.93
        },
        {
            date: '27/07/2025',
            description: 'Ccn*blue Supermark70 Devland (Card 7420)',
            category: 'Groceries',
            money_in: null,
            money_out: -107.0,
            fee: null,
            balance: 5142.93
        },
        {
            date: '27/07/2025',
            description: 'Ccn*teddys West Tuc Devland (Card 7420)',
            category: 'Groceries',
            money_in: null,
            money_out: -275.0,
            fee: null,
            balance: 4867.93
        },
        {
            date: '27/07/2025',
            description: 'ATM Cash Withdrawal: 000000000000002 --johannesbur Za',
            category: 'Cash Withdrawal',
            money_in: null,
            money_out: -360.0,
            fee: -10.0,
            balance: 4497.93
        },
        {
            date: '28/07/2025',
            description: 'Live Better Round-up Transfer',
            category: 'Transfer',
            money_in: null,
            money_out: -22.0,
            fee: null,
            balance: 4475.93
        },
        {
            date: '28/07/2025',
            description: 'Sasol Johannesburg (Card 7420)',
            category: 'Fuel',
            money_in: null,
            money_out: -300.0,
            fee: null,
            balance: 4175.93
        },
        {
            date: '28/07/2025',
            description: 'Doctors Place Freedom Park (Card 7420)',
            category: 'Alcohol',
            money_in: null,
            money_out: -90.0,
            fee: null,
            balance: 4085.93
        },
        {
            date: '28/07/2025',
            description: 'Doctors Place Freedom Park (Card 7420)',
            category: 'Alcohol',
            money_in: null,
            money_out: -203.0,
            fee: null,
            balance: 3882.93
        },
        {
            date: '28/07/2025',
            description: 'Card Purchase & Cashback (R300.00): Roots Gauteng (Card 7420)',
            category: 'Groceries',
            money_in: null,
            money_out: -1167.7,
            fee: -2.0,
            balance: 2713.23
        },
        {
            date: '28/07/2025',
            description: 'Ccn*doctors Place4 Devland (Card 7420)',
            category: 'Groceries',
            money_in: null,
            money_out: -112.0,
            fee: null,
            balance: 2601.23
        },
        {
            date: '28/07/2025',
            description: 'BP Johannesburg (Card 7420)',
            category: 'Fuel',
            money_in: null,
            money_out: -204.76,
            fee: null,
            balance: 2396.47
        },
        {
            date: '28/07/2025',
            description: 'Card Purchase Insufficient Funds Fee: Ik *zwakala Ngapha Tra Eldoradopark Za',
            category: 'Fees',
            money_in: null,
            money_out: null,
            fee: -1.0,
            balance: 2395.47
        },
        {
            date: '30/07/2025',
            description: 'Ccn*sbush Tuckshop Eldoradopark (Card 7420)',
            category: 'Takeaways',
            money_in: null,
            money_out: -42.0,
            fee: null,
            balance: 2353.47
        },
        {
            date: '30/07/2025',
            description: 'Cash Withdrawal: Fundhani Amu Trading E Devland Zaza',
            category: 'Cash Withdrawal',
            money_in: null,
            money_out: -105.0,
            fee: -2.0,
            balance: 2246.47
        },
        {
            date: '30/07/2025',
            description: 'Hyperland Devland Eldoradopark (Card 7420)',
            category: 'Groceries',
            money_in: null,
            money_out: -1446.1,
            fee: null,
            balance: 800.37
        }
    ]
};

export const capitec_prompt_sample: CapitecBankStatement = {
    account_holder: {
        name: 'MISS REBECCA KHAMBULA',
        address: {
            street: '3860 SUPERCHARGE STREET',
            city: 'DEVLAND',
            location: 'FREEDOM PARK',
            postal_code: '1811'
        }
    },
    statement_period: {
        from_date: '01/07/2025',
        to_date: '18/10/2025'
    },
    balances: {
        opening_balance: -114.45,
        closing_balance: 131.23,
        available_balance: 1.23
    },
    money_in_summary: {
        total: 99544.79,
        breakdown: {
            other_income: 91241.27,
            cash_deposit: 8060,
            transfer: 238.88,
            interest: 4.64
        }
    },
    live_better_benefits: {
        live_better_savings: 237.18
    },
    money_out_summary: {
        total: 99299.11,
        breakdown: {
            digital_payments: 41334.0,
            card_payments: 22622.95,
            cash_withdrawals: 22045.0,
            send_cash: 10720.0,
            fees: 915.19,
            card_subscriptions: 594.8,
            prepaid: 421.0,
            debit_orders: 259.0,
            transfer: 237.17,
            vouchers: 150.0
        }
    },
    fee_summary: {
        total: 913.19,
        breakdown: [
            { name: 'Cash Withdrawal Fee', value: 330.0 },
            { name: 'Cash Sent Fee', value: 180.0 },
            { name: 'Cash Deposit Fee (Notes)', value: 112.84 },
            { name: 'DebtCheck Insufficient Funds Fee', value: 60.0 },
            { name: 'External Immediate Payment Fee', value: 48.0 },
            { name: 'International Processing Fee', value: 31.0 },
            { name: 'Other Fees', value: 151.35 }
        ]
    },
    scheduled_payments: {
        debit_orders: [
            { date: '25/07/2025', description: 'CarTrack', amount: -100.0 },
            { date: '25/08/2025', description: 'CarTrack', amount: -159.0 }
        ],
        card_subscriptions: [
            { date: '09/08/2025', description: 'Canva* I04601-34333028', amount: -60.0 },
            { date: '26/08/2025', description: 'Netlify', amount: -70.94 },
            { date: '10/09/2025', description: 'Netlify', amount: -168.97 },
            { date: '12/09/2025', description: 'Canva* I04632-25969134', amount: -60.0 },
            { date: '18/09/2025', description: 'Afribost.com 2', amount: -1.0 },
            { date: '12/10/2025', description: 'Canva* I04662-33281010', amount: -60.0 },
            { date: '17/10/2025', description: 'Netlify', amount: -104.37 },
            { date: '17/10/2025', description: 'Netlify', amount: -69.52 }
        ]
    },
    spending_summary: {
        breakdown: {
            cash_withdrawal: -32765.0,
            digital_payments: -25030.0,
            rent: -13500.0,
            uncategorised: -6719.57,
            groceries: -6494.97,
            fuel: -3743.31,
            online_store: -2204.13,
            alcohol: -2080.93,
            investments: -1295.0,
            children_dependants: -900.0,
            software_games: -683.75,
            takeaways: -556.0,
            restaurants: -455.0,
            cellphone: -421.0,
            vehicle_tracking: -259.0,
            activities: -240.0,
            pharmacy: -230.09,
            other_loans_accounts: -180.0,
            betting_lottery: -150.0,
            doctors_therapists: -134.0
        }
    },
    transaction_history: [
        {
            date: '01/07/2025',
            description: 'Eft Debit Order Insufficient Funds (R180.00): Cartrack (CART30F55SHMZ2)',
            category: null,
            money_in: null,
            money_out: null,
            fee: null,
            balance: null
        }
    ]
};
export const capitec_transactions_sample = {
    transactions: [
        {
            date: '22/10/2025',
            description: 'ATM Balance Enquiry Fee',
            category: 'Fees',
            money_in: null,
            money_out: null,
            fee: -10.0,
            balance: -124.45
        },
        {
            date: '22/10/2025',
            description: 'SMS Notification Fee',
            category: 'Fees',
            money_in: null,
            money_out: null,
            fee: -0.35,
            balance: -124.8
        },
        {
            date: '23/10/2025',
            description: 'ATM Cash Withdrawal: Matlapeng Centr Soweto Za',
            category: 'Cash Withdrawal',
            money_in: null,
            money_out: -500.0,
            fee: -10.0,
            balance: -634.8
        },
        {
            date: '24/10/2025',
            description: 'Banking App Immediate Payment: Manyelani',
            category: 'Digital Payments',
            money_in: null,
            money_out: -400.0,
            fee: -6.0,
            balance: -1040.8
        },
        {
            date: '25/10/2025',
            description: 'Payment Received: Tech Solutions Ltd',
            category: 'Other Income',
            money_in: 35000.0,
            money_out: null,
            fee: null,
            balance: 33959.2
        },
        {
            date: '25/10/2025',
            description: 'Registered Debit Order: CarTrack (2121827)',
            category: 'Vehicle Tracking',
            money_in: null,
            money_out: -120.0,
            fee: -3.0,
            balance: 33836.2
        },
        {
            date: '25/10/2025',
            description: 'Registered Debit Order: Discovery Ins (342187)',
            category: 'Other Loans & Accounts',
            money_in: null,
            money_out: -350.0,
            fee: -3.0,
            balance: 33483.2
        },
        {
            date: '26/10/2025',
            description: 'Recurring Card Purchase: Netflix',
            category: 'Software/Games',
            money_in: null,
            money_out: -149.0,
            fee: -2.0,
            balance: 33332.2
        },
        {
            date: '26/10/2025',
            description: 'Recurring Card Purchase: Spotify',
            category: 'Software/Games',
            money_in: null,
            money_out: -59.99,
            fee: -2.0,
            balance: 33270.21
        },
        {
            date: '27/10/2025',
            description: 'Banking App Immediate Payment: Mdu Landlord',
            category: 'Rent',
            money_in: null,
            money_out: -6603.0,
            fee: -1.0,
            balance: 26666.21
        },
        {
            date: '27/10/2025',
            description: 'Live Better Round-up Transfer',
            category: 'Investments',
            money_in: 12.5,
            money_out: null,
            fee: null,
            balance: 26678.71
        },
        {
            date: '28/10/2025',
            description: 'Banking App Payment: Toni (ABSA)',
            category: 'Digital Payments',
            money_in: null,
            money_out: -300.0,
            fee: -1.0,
            balance: 26377.71
        },
        {
            date: '29/10/2025',
            description: 'ATM Cash Withdrawal: Cresta Mall Jhb Za',
            category: 'Cash Withdrawal',
            money_in: null,
            money_out: -800.0,
            fee: -10.0,
            balance: 25567.71
        },
        {
            date: '30/10/2025',
            description: 'Card Purchase: Pick n Pay Cresta',
            category: 'Groceries',
            money_in: null,
            money_out: -483.55,
            fee: null,
            balance: 25084.16
        },
        {
            date: '31/10/2025',
            description: 'Monthly Account Admin Fee',
            category: 'Fees',
            money_in: null,
            money_out: null,
            fee: -7.5,
            balance: 25076.66
        },
        {
            date: '31/10/2025',
            description: 'Interest Received',
            category: 'Other Income',
            money_in: 1.55,
            money_out: null,
            fee: null,
            balance: 25078.21
        },
        {
            date: '01/11/2025',
            description: 'Banking App Immediate Payment: Mdu Landlord',
            category: 'Rent',
            money_in: null,
            money_out: -6603.0,
            fee: -1.0,
            balance: 18474.21
        },
        {
            date: '01/11/2025',
            description: 'Live Better Round-up Transfer',
            category: 'Investments',
            money_in: 8.25,
            money_out: null,
            fee: null,
            balance: 18482.46
        },
        {
            date: '02/11/2025',
            description: 'Card Purchase: Engen Rosebank',
            category: 'Fuel',
            money_in: null,
            money_out: -214.8,
            fee: null,
            balance: 18267.66
        },
        {
            date: '03/11/2025',
            description: 'Card Purchase: Woolworths Food Rosebank',
            category: 'Groceries',
            money_in: null,
            money_out: -229.91,
            fee: null,
            balance: 18037.75
        },
        {
            date: '04/11/2025',
            description: 'Banking App Immediate Payment: Love',
            category: 'Children & Dependants',
            money_in: null,
            money_out: -200.0,
            fee: -1.0,
            balance: 17836.75
        },
        {
            date: '05/11/2025',
            description: 'Cash Deposit: Capitec Fourways',
            category: null,
            money_in: 1000.0,
            money_out: null,
            fee: -10.5,
            balance: 18826.25
        },
        {
            date: '06/11/2025',
            description: 'Card Purchase: Uber Eats',
            category: 'Takeaways',
            money_in: null,
            money_out: -135.0,
            fee: null,
            balance: 18691.25
        },
        {
            date: '07/11/2025',
            description: 'ATM Cash Withdrawal: Fourways Mall Za',
            category: 'Cash Withdrawal',
            money_in: null,
            money_out: -300.0,
            fee: -10.0,
            balance: 18381.25
        },
        {
            date: '08/11/2025',
            description: 'Card Purchase: Dischem Fourways',
            category: 'Pharmacy',
            money_in: null,
            money_out: -107.7,
            fee: null,
            balance: 18273.55
        },
        {
            date: '09/11/2025',
            description: 'Card Purchase: Nandos Rosebank',
            category: 'Restaurants',
            money_in: null,
            money_out: -84.0,
            fee: null,
            balance: 18189.55
        },
        {
            date: '10/11/2025',
            description: 'Banking App Cash Sent: C***789',
            category: 'Transfer',
            money_in: null,
            money_out: -500.0,
            fee: -10.0,
            balance: 17679.55
        },
        {
            date: '11/11/2025',
            description: 'Card Purchase: Takealot.com',
            category: 'Online Store',
            money_in: null,
            money_out: -447.11,
            fee: null,
            balance: 17232.44
        },
        {
            date: '12/11/2025',
            description: 'Live Better Round-up Transfer',
            category: 'Investments',
            money_in: 15.75,
            money_out: null,
            fee: null,
            balance: 17248.19
        },
        {
            date: '13/11/2025',
            description: 'Registered Debit Order: Old Mutual Funeral (55321)',
            category: 'Other Loans & Accounts',
            money_in: null,
            money_out: -180.0,
            fee: -3.0,
            balance: 17065.19
        },
        {
            date: '14/11/2025',
            description: 'Recurring Card Purchase: YouTube Premium',
            category: 'Software/Games',
            money_in: null,
            money_out: -79.99,
            fee: -2.0,
            balance: 16983.2
        },
        {
            date: '15/11/2025',
            description: 'Card Purchase: Vodacom Fourways',
            category: 'Cellphone',
            money_in: null,
            money_out: -150.0,
            fee: null,
            balance: 16833.2
        },
        {
            date: '16/11/2025',
            description: 'ATM Cash Withdrawal: Rosebank Za',
            category: 'Cash Withdrawal',
            money_in: null,
            money_out: -200.0,
            fee: -10.0,
            balance: 16623.2
        },
        {
            date: '17/11/2025',
            description: 'Card Purchase: Checkers Fourways',
            category: 'Groceries',
            money_in: null,
            money_out: -435.83,
            fee: null,
            balance: 16187.37
        },
        {
            date: '18/11/2025',
            description: 'Banking App Immediate Payment: Mr Ms Mkhari',
            category: 'Digital Payments',
            money_in: null,
            money_out: -120.0,
            fee: -1.0,
            balance: 16066.37
        },
        {
            date: '19/11/2025',
            description: 'Card Purchase: Engen Fourways',
            category: 'Fuel',
            money_in: null,
            money_out: -200.0,
            fee: null,
            balance: 15866.37
        },
        {
            date: '20/11/2025',
            description: 'Live Better Round-up Transfer',
            category: 'Investments',
            money_in: 22.5,
            money_out: null,
            fee: null,
            balance: 15888.87
        },
        {
            date: '21/11/2025',
            description: 'Card Purchase: Liquor City Fourways',
            category: 'Alcohol',
            money_in: null,
            money_out: -100.99,
            fee: null,
            balance: 15787.88
        },
        {
            date: '22/11/2025',
            description: 'ATM Balance Enquiry Fee',
            category: 'Fees',
            money_in: null,
            money_out: null,
            fee: -10.0,
            balance: 15777.88
        },
        {
            date: '23/11/2025',
            description: 'Banking App Immediate Payment: Cipc',
            category: 'Digital Payments',
            money_in: null,
            money_out: -1000.0,
            fee: -6.0,
            balance: 14771.88
        },
        {
            date: '24/11/2025',
            description: 'Registered Debit Order: Virgin Active (887654)',
            category: 'Activities',
            money_in: null,
            money_out: -350.0,
            fee: -3.0,
            balance: 14418.88
        },
        {
            date: '25/11/2025',
            description: 'Payment Received: Tech Solutions Ltd',
            category: 'Other Income',
            money_in: 35000.0,
            money_out: null,
            fee: null,
            balance: 49418.88
        },
        {
            date: '25/11/2025',
            description: 'Registered Debit Order: FNB Home Loan (665432)',
            category: 'Other Loans & Accounts',
            money_in: null,
            money_out: -1200.0,
            fee: -3.0,
            balance: 48215.88
        },
        {
            date: '25/11/2025',
            description: 'Registered Debit Order: Outsurance (998877)',
            category: 'Other Loans & Accounts',
            money_in: null,
            money_out: -420.0,
            fee: -3.0,
            balance: 47792.88
        },
        {
            date: '26/11/2025',
            description: 'Recurring Card Purchase: Microsoft 365',
            category: 'Software/Games',
            money_in: null,
            money_out: -89.0,
            fee: -2.0,
            balance: 47701.88
        },
        {
            date: '26/11/2025',
            description: 'Recurring Card Purchase: Canva',
            category: 'Software/Games',
            money_in: null,
            money_out: -60.0,
            fee: -2.0,
            balance: 47639.88
        },
        {
            date: '27/11/2025',
            description: 'Banking App Immediate Payment: Mdu Landlord',
            category: 'Rent',
            money_in: null,
            money_out: -6603.0,
            fee: -1.0,
            balance: 41035.88
        },
        {
            date: '27/11/2025',
            description: 'Live Better Round-up Transfer',
            category: 'Investments',
            money_in: 18.25,
            money_out: null,
            fee: null,
            balance: 41054.13
        },
        {
            date: '28/11/2025',
            description: 'Banking App Payment: Sbu (FNB)',
            category: 'Digital Payments',
            money_in: null,
            money_out: -2000.0,
            fee: -1.0,
            balance: 39053.13
        },
        {
            date: '29/11/2025',
            description: 'ATM Cash Withdrawal: Sandton City Za',
            category: 'Cash Withdrawal',
            money_in: null,
            money_out: -1000.0,
            fee: -10.0,
            balance: 38043.13
        },
        {
            date: '30/11/2025',
            description: 'Monthly Account Admin Fee',
            category: 'Fees',
            money_in: null,
            money_out: null,
            fee: -7.5,
            balance: 38035.63
        },
        {
            date: '30/11/2025',
            description: 'Interest Received',
            category: 'Other Income',
            money_in: 1.62,
            money_out: null,
            fee: null,
            balance: 38037.25
        },
        {
            date: '01/12/2025',
            description: 'Banking App Immediate Payment: Mdu Landlord',
            category: 'Rent',
            money_in: null,
            money_out: -6603.0,
            fee: -1.0,
            balance: 31433.25
        },
        {
            date: '01/12/2025',
            description: 'Live Better Round-up Transfer',
            category: 'Investments',
            money_in: 10.5,
            money_out: null,
            fee: null,
            balance: 31443.75
        },
        {
            date: '02/12/2025',
            description: 'Card Purchase: Engen Sandton',
            category: 'Fuel',
            money_in: null,
            money_out: -150.0,
            fee: null,
            balance: 31293.75
        },
        {
            date: '03/12/2025',
            description: 'Card Purchase: Woolworths Food Sandton',
            category: 'Groceries',
            money_in: null,
            money_out: -440.81,
            fee: null,
            balance: 30852.94
        },
        {
            date: '04/12/2025',
            description: 'Banking App Immediate Payment: Manyelani',
            category: 'Digital Payments',
            money_in: null,
            money_out: -300.0,
            fee: -6.0,
            balance: 30546.94
        },
        {
            date: '05/12/2025',
            description: 'Cash Deposit: Capitec Sandton',
            category: null,
            money_in: 500.0,
            money_out: null,
            fee: -7.0,
            balance: 31039.94
        },
        {
            date: '06/12/2025',
            description: 'Card Purchase: Mr D Food',
            category: 'Takeaways',
            money_in: null,
            money_out: -135.0,
            fee: null,
            balance: 30904.94
        },
        {
            date: '07/12/2025',
            description: 'ATM Cash Withdrawal: Sandton City Za',
            category: 'Cash Withdrawal',
            money_in: null,
            money_out: -500.0,
            fee: -10.0,
            balance: 30394.94
        },
        {
            date: '08/12/2025',
            description: 'Card Purchase: Clicks Sandton',
            category: 'Pharmacy',
            money_in: null,
            money_out: -84.0,
            fee: null,
            balance: 30310.94
        },
        {
            date: '09/12/2025',
            description: 'Card Purchase: Spur Sandton',
            category: 'Restaurants',
            money_in: null,
            money_out: -100.99,
            fee: null,
            balance: 30209.95
        },
        {
            date: '10/12/2025',
            description: 'Banking App Cash Sent: C***456',
            category: 'Transfer',
            money_in: null,
            money_out: -800.0,
            fee: -10.0,
            balance: 29399.95
        },
        {
            date: '11/12/2025',
            description: 'Card Purchase: Takealot.com',
            category: 'Online Store',
            money_in: null,
            money_out: -435.83,
            fee: null,
            balance: 28964.12
        },
        {
            date: '12/12/2025',
            description: 'Live Better Round-up Transfer',
            category: 'Investments',
            money_in: 20.25,
            money_out: null,
            fee: null,
            balance: 28984.37
        },
        {
            date: '13/12/2025',
            description: 'Registered Debit Order: Old Mutual Funeral (55321)',
            category: 'Other Loans & Accounts',
            money_in: null,
            money_out: -180.0,
            fee: -3.0,
            balance: 28801.37
        },
        {
            date: '14/12/2025',
            description: 'Recurring Card Purchase: Netflix',
            category: 'Software/Games',
            money_in: null,
            money_out: -149.0,
            fee: -2.0,
            balance: 28650.37
        },
        {
            date: '15/12/2025',
            description: 'Card Purchase: MTN Sandton',
            category: 'Cellphone',
            money_in: null,
            money_out: -200.0,
            fee: null,
            balance: 28450.37
        },
        {
            date: '16/12/2025',
            description: 'ATM Cash Withdrawal: Sandton Za',
            category: 'Cash Withdrawal',
            money_in: null,
            money_out: -300.0,
            fee: -10.0,
            balance: 28140.37
        },
        {
            date: '17/12/2025',
            description: 'Card Purchase: Checkers Sandton',
            category: 'Groceries',
            money_in: null,
            money_out: -483.55,
            fee: null,
            balance: 27656.82
        },
        {
            date: '18/12/2025',
            description: 'Banking App Immediate Payment: Mr Ms Mkhari',
            category: 'Digital Payments',
            money_in: null,
            money_out: -60.0,
            fee: -1.0,
            balance: 27595.82
        },
        {
            date: '19/12/2025',
            description: 'Card Purchase: Engen Sandton',
            category: 'Fuel',
            money_in: null,
            money_out: -214.8,
            fee: null,
            balance: 27381.02
        },
        {
            date: '20/12/2025',
            description: 'Live Better Round-up Transfer',
            category: 'Investments',
            money_in: 25.75,
            money_out: null,
            fee: null,
            balance: 27406.77
        },
        {
            date: '21/12/2025',
            description: 'Card Purchase: Tops Sandton',
            category: 'Alcohol',
            money_in: null,
            money_out: -135.0,
            fee: null,
            balance: 27271.77
        },
        {
            date: '22/12/2025',
            description: 'SMS Notification Fee',
            category: 'Fees',
            money_in: null,
            money_out: null,
            fee: -0.35,
            balance: 27271.42
        },
        {
            date: '22/12/2025',
            description: 'Registered Debit Order: Virgin Active (887654)',
            category: 'Activities',
            money_in: null,
            money_out: -350.0,
            fee: -3.0,
            balance: 26918.42
        },
        {
            date: '22/12/2025',
            description: 'Registered Debit Order: FNB Home Loan (665432)',
            category: 'Other Loans & Accounts',
            money_in: null,
            money_out: -1200.0,
            fee: -3.0,
            balance: 25715.42
        },
        {
            date: '22/12/2025',
            description: 'Registered Debit Order: Outsurance (998877)',
            category: 'Other Loans & Accounts',
            money_in: null,
            money_out: -420.0,
            fee: -3.0,
            balance: 25292.42
        },
        {
            date: '22/12/2025',
            description: 'Recurring Card Purchase: Spotify',
            category: 'Software/Games',
            money_in: null,
            money_out: -59.99,
            fee: -2.0,
            balance: 25230.43
        },
        {
            date: '22/12/2025',
            description: 'Recurring Card Purchase: YouTube Premium',
            category: 'Software/Games',
            money_in: null,
            money_out: -79.99,
            fee: -2.0,
            balance: 25148.44
        },
        {
            date: '22/12/2025',
            description: 'Banking App Immediate Payment: Cipc',
            category: 'Digital Payments',
            money_in: null,
            money_out: -1000.0,
            fee: -6.0,
            balance: 24142.44
        },
        {
            date: '22/12/2025',
            description: 'Banking App Payment: Sbu (FNB)',
            category: 'Digital Payments',
            money_in: null,
            money_out: -2000.0,
            fee: -1.0,
            balance: 22141.44
        },
        {
            date: '22/12/2025',
            description: 'Banking App Cash Sent: C***123',
            category: 'Transfer',
            money_in: null,
            money_out: -500.0,
            fee: -10.0,
            balance: 21631.44
        },
        {
            date: '22/12/2025',
            description: 'ATM Cash Withdrawal: Sandton City Za',
            category: 'Cash Withdrawal',
            money_in: null,
            money_out: -1000.0,
            fee: -10.0,
            balance: 20621.44
        },
        {
            date: '22/12/2025',
            description: 'Cash Deposit: Capitec Sandton',
            category: null,
            money_in: 2000.0,
            money_out: null,
            fee: -14.0,
            balance: 22607.44
        },
        {
            date: '22/12/2025',
            description: 'Banking App Immediate Payment: Manyelani',
            category: 'Digital Payments',
            money_in: null,
            money_out: -300.0,
            fee: -6.0,
            balance: 22301.44
        },
        {
            date: '22/12/2025',
            description: 'Banking App Payment: Toni (ABSA)',
            category: 'Digital Payments',
            money_in: null,
            money_out: -400.0,
            fee: -1.0,
            balance: 21900.44
        },
        {
            date: '22/12/2025',
            description: 'Banking App Immediate Payment: Love',
            category: 'Children & Dependants',
            money_in: null,
            money_out: -80.0,
            fee: -1.0,
            balance: 21819.44
        },
        {
            date: '22/12/2025',
            description: 'Registered Debit Order: CarTrack (2121827)',
            category: 'Vehicle Tracking',
            money_in: null,
            money_out: -120.0,
            fee: -3.0,
            balance: 21696.44
        },
        {
            date: '22/12/2025',
            description: 'Registered Debit Order: Discovery Ins (342187)',
            category: 'Other Loans & Accounts',
            money_in: null,
            money_out: -350.0,
            fee: -3.0,
            balance: 21343.44
        },
        {
            date: '22/12/2025',
            description: 'Registered Debit Order: Old Mutual Funeral (55321)',
            category: 'Other Loans & Accounts',
            money_in: null,
            money_out: -180.0,
            fee: -6.0,
            balance: 21157.44
        },
        {
            date: '22/12/2025',
            description: 'Registered Debit Order: Virgin Active (887654)',
            category: 'Activities',
            money_in: null,
            money_out: -350.0,
            fee: -6.0,
            balance: 20801.44
        },
        {
            date: '22/12/2025',
            description: 'Registered Debit Order: FNB Home Loan (665432)',
            category: 'Other Loans & Accounts',
            money_in: null,
            money_out: -1200.0,
            fee: -6.0,
            balance: 19595.44
        },
        {
            date: '22/12/2025',
            description: 'Registered Debit Order: Outsurance (998877)',
            category: 'Other Loans & Accounts',
            money_in: null,
            money_out: -420.0,
            fee: -6.0,
            balance: 19169.44
        },
        {
            date: '22/12/2025',
            description: 'Payment Received: Tech Solutions Ltd',
            category: 'Other Income',
            money_in: 35000.0,
            money_out: null,
            fee: null,
            balance: 54169.44
        },
        {
            date: '22/12/2025',
            description: 'Banking App Immediate Payment: Mdu Landlord',
            category: 'Rent',
            money_in: null,
            money_out: -6603.0,
            fee: -1.0,
            balance: 47565.44
        },
        {
            date: '22/12/2025',
            description: 'Banking App Immediate Payment: Manyelani',
            category: 'Digital Payments',
            money_in: null,
            money_out: -400.0,
            fee: -6.0,
            balance: 47159.44
        },
        {
            date: '22/12/2025',
            description: 'Banking App Immediate Payment: Cipc',
            category: 'Digital Payments',
            money_in: null,
            money_out: -1000.0,
            fee: -6.0,
            balance: 46153.44
        },
        {
            date: '22/12/2025',
            description: 'Banking App Payment: Toni (ABSA)',
            category: 'Digital Payments',
            money_in: null,
            money_out: -300.0,
            fee: -1.0,
            balance: 45852.44
        },
        {
            date: '22/12/2025',
            description: 'Banking App Payment: Sbu (FNB)',
            category: 'Digital Payments',
            money_in: null,
            money_out: -2000.0,
            fee: -1.0,
            balance: 43851.44
        },
        {
            date: '22/12/2025',
            description: 'Banking App Cash Sent: C***789',
            category: 'Transfer',
            money_in: null,
            money_out: -500.0,
            fee: -10.0,
            balance: 43341.44
        },
        {
            date: '22/12/2025',
            description: 'ATM Cash Withdrawal: Sandton City Za',
            category: 'Cash Withdrawal',
            money_in: null,
            money_out: -800.0,
            fee: -10.0,
            balance: 42531.44
        },
        {
            date: '22/12/2025',
            description: 'Cash Deposit: Capitec Sandton',
            category: null,
            money_in: 1000.0,
            money_out: null,
            fee: -10.5,
            balance: 43520.94
        },
        {
            date: '22/12/2025',
            description: 'Live Better Round-up Transfer',
            category: 'Investments',
            money_in: 30.25,
            money_out: null,
            fee: null,
            balance: 43551.19
        },
        {
            date: '22/12/2025',
            description: 'Monthly Account Admin Fee',
            category: 'Fees',
            money_in: null,
            money_out: null,
            fee: -7.5,
            balance: 43543.69
        },
        {
            date: '22/12/2025',
            description: 'Interest Received',
            category: 'Other Income',
            money_in: 1.49,
            money_out: null,
            fee: null,
            balance: 43545.18
        },
        {
            date: '22/12/2025',
            description: 'Banking App Immediate Payment: Manyelani',
            category: 'Digital Payments',
            money_in: null,
            money_out: -43413.95,
            fee: -6.0,
            balance: 125.23
        },
        {
            date: '22/12/2025',
            description: 'Live Better Round-up Transfer',
            category: 'Investments',
            money_in: 6.0,
            money_out: null,
            fee: null,
            balance: 131.23
        }
    ],
    address: {
        street: '3860 SUPERCHARGE STREET',
        city: 'DEVLAND',
        location: 'FREEDOM PARK',
        postal_code: '1811'
    }
};
