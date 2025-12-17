export interface CapitecBankStatement {
    account_holder: {
        name: string;
        address: {
            street: string;
            city: string;
            location: string;
            postal_code: string;
        };
    };
    bank_details: {
        name: string;
        branch: string;
        address: string;
        print_date: string;
        device: string;
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
        breakdown: string[];
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
    transaction_history: Array<{
        date: string;
        description: string | null;
        category: string | null;
        money_in: number | null;
        money_out: number | null;
        fee: number | null;
        balance: number | null;
    }>;
    tax_invoice: {
        vat_registration_number: string;
    };
    additional_info: {
        unique_document_number: string;
        page: string;
        version: string;
        client_care: {
            phone: string;
            email: string;
            website: string;
        };
    };
}
export const capitec_sample: CapitecBankStatement = {
    account_holder: {
        name: 'MISS REBECCA KHAMBULA',
        address: {
            street: '3860 SUPERCHARGE STREET',
            city: 'DEVLAND',
            location: 'FREEDOM PARK',
            postal_code: '1811'
        }
    },
    bank_details: {
        name: 'Capital Bank Limited',
        branch: '470010',
        address: '5 Neutron Road, Techno Park, Stellenbosch, 7600',
        print_date: '18/10/2025 11:43',
        device: '9003'
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
            'Cash Withdrawal Fee',
            'Cash Sent Fee',
            'Cash Deposit Fee (Notes)',
            'DebtCheck Insufficient Funds Fee',
            'External Immediate Payment Fee',
            'International Processing Fee',
            'Other Fees'
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
            money_out: -6.0,
            fee: null,
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
            money_out: -6.0,
            fee: null,
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
            money_out: -6.0,
            fee: null,
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
            category: null,
            money_in: null,
            money_out: null,
            fee: -40.0,
            balance: 19.55
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
            money_out: -3.0,
            fee: null,
            balance: 16.55
        },
        {
            date: '07/07/2025',
            description: 'International Online Purchase Insufficient Funds Fee: Goodje*play G.co/helppay# Us',
            category: 'Fees',
            money_in: null,
            money_out: -3.0,
            fee: null,
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
        }
    ],
    tax_invoice: {
        vat_registration_number: '4680173723'
    },
    additional_info: {
        unique_document_number: 'cfa74907-39a2-40c7-a50d-996f386b27ee',
        page: '1 of 10',
        version: 'V2.0 - 08/07/2022',
        client_care: {
            phone: '0860 10 20 43',
            email: 'ClientCare@capitecbank.co.za',
            website: 'capitecbank.co.za'
        }
    }
};
