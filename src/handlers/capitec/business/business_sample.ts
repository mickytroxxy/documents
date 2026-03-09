const phoneNumber = '012 0040615';
export type BankStatement = {
    account: Account;
    balances: Balances;
    transactions: Transaction[];
    address?: Address;
    bankDetails?: BankDetails;
    fees?: FeeInfo;
};

export type Address = {
    line1?: string;
    line2?: string;
    line3?: string;
    province?: string;
    postalCode?: string;
};

export type BankDetails = {
    branch?: string;
    branchCode?: string;
    deviceCode?: string;
    telephone?: string;
    businessRegNo?: string;
    vatNo?: string;
    interestRate?: string;
    overdraftInfo?: string;
};

export type FeeInfo = {
    feeTotal?: number;
    vatTotal?: number;
    vatRate?: string;
};

export type Account = {
    accountNumber: string;
    accountType: string;
    businessName: string;
    statementDate: string; // ISO
    statementNumber: string;
    page?: number;
    totalPages?: number;
};

export type Balances = {
    openingBalance: number;
    closingBalance: number;
};

export type Transaction = {
    postDate: string; // ISO
    transactionDate: string; // ISO
    description: string;
    reference?: string;
    authId?: string;
    amount: number; // principal amount
    fees?: number; // fee amount (negative for debits)
    balanceAfter: number;
    type: 'credit' | 'debit';
};

export const CapitecBankStatement: BankStatement[] = [
    {
        account: {
            accountNumber: '1054814708',
            accountType: 'Capitec Business Account',
            businessName: 'FIRE-IT PTY LTD',
            statementDate: '2026-02-22',
            statementNumber: '00010',
            page: 1,
            totalPages: 1
        },
        balances: {
            openingBalance: 362418.67,
            closingBalance: 642418.67
        },
        address: {
            line1: '36 REGENCY DRIVE',
            line2: 'ROUTE 21 BUSINESS PARK',
            line3: 'CENTURION',
            province: 'GAUTENG',
            postalCode: '0178'
        },
        bankDetails: {
            branchCode: '450105',
            deviceCode: '9998',
            branch: 'Relationship Suite',
            telephone: phoneNumber,
            businessRegNo: '2012/173035/07',
            vatNo: '4680173723',
            interestRate: '22.1000%'
        },
        fees: {
            feeTotal: -208.0,
            vatTotal: -31.2,
            vatRate: '15.00%'
        },
        transactions: [
            // ==================== AUGUST (17–31) ====================
            // 17 Aug
            {
                postDate: '2025-08-17',
                transactionDate: '2025-08-17',
                description: 'PayShapReceived Mzanzi Logistics 247',
                reference: '*****901234** **',
                authId: '778001',
                amount: 125000.0,
                balanceAfter: 487418.67,
                type: 'credit'
            },
            // 18 Aug
            {
                postDate: '2025-08-18',
                transactionDate: '2025-08-18',
                description: 'EFT Received Gauteng Tech Guru',
                reference: 'GHD0818',
                authId: '778002',
                amount: 280000.0,
                balanceAfter: 767418.67,
                type: 'credit'
            },
            {
                postDate: '2025-08-18',
                transactionDate: '2025-08-18',
                description: 'Immediate Payment Orion Security',
                reference: 'IMM0818',
                authId: '778003',
                amount: -35000.0,
                fees: -6.0,
                balanceAfter: 732412.67,
                type: 'debit'
            },
            // 19 Aug
            {
                postDate: '2025-08-19',
                transactionDate: '2025-08-19',
                description: 'PayShapReceived BlueTech Solutions',
                reference: '*****912345** **',
                authId: '778004',
                amount: 42000.0,
                balanceAfter: 774412.67,
                type: 'credit'
            },
            {
                postDate: '2025-08-19',
                transactionDate: '2025-08-19',
                description: 'Business Payment to TechSource SA',
                reference: 'CBT0819',
                authId: '778005',
                amount: -22000.0,
                fees: -1.0,
                balanceAfter: 752411.67,
                type: 'debit'
            },
            // 20 Aug
            {
                postDate: '2025-08-20',
                transactionDate: '2025-08-20',
                description: 'EFT Received M.A.G',
                reference: 'TRA0820',
                authId: '778006',
                amount: 195000.0,
                balanceAfter: 947411.67,
                type: 'credit'
            },
            {
                postDate: '2025-08-20',
                transactionDate: '2025-08-20',
                description: 'Payment to Bidvest',
                reference: 'BID0820',
                authId: '778007',
                amount: -42000.0,
                balanceAfter: 905411.67,
                type: 'debit'
            },
            // 21 Aug
            {
                postDate: '2025-08-21',
                transactionDate: '2025-08-21',
                description: 'Immediate Payment Dimension Data',
                reference: 'IMM0821',
                authId: '778008',
                amount: -55000.0,
                fees: -6.0,
                balanceAfter: 850405.67,
                type: 'debit'
            },
            {
                postDate: '2025-08-21',
                transactionDate: '2025-08-21',
                description: 'PayShapReceived Sasol',
                reference: '*****923456** **',
                authId: '778009',
                amount: 38000.0,
                balanceAfter: 888405.67,
                type: 'credit'
            },
            // 22 Aug
            {
                postDate: '2025-08-22',
                transactionDate: '2025-08-22',
                description: 'EFT Payment Microsoft SA',
                reference: 'MSFT0822',
                authId: '778010',
                amount: -28000.0,
                balanceAfter: 860405.67,
                type: 'debit'
            },
            {
                postDate: '2025-08-22',
                transactionDate: '2025-08-22',
                description: 'PayShapReceived RCL Foods',
                reference: '*****934567** **',
                authId: '778011',
                amount: 22000.0,
                balanceAfter: 882405.67,
                type: 'credit'
            },
            // 23 Aug
            {
                postDate: '2025-08-23',
                transactionDate: '2025-08-23',
                description: 'Business Payment to Imperial Logistics',
                reference: 'IMP0823',
                authId: '778012',
                amount: -16500.0,
                fees: -1.0,
                balanceAfter: 865904.67,
                type: 'debit'
            },
            // 24 Aug
            {
                postDate: '2025-08-24',
                transactionDate: '2025-08-24',
                description: 'Immediate Payment Tsebo Solutions',
                reference: 'IMM0824',
                authId: '778013',
                amount: -24000.0,
                fees: -6.0,
                balanceAfter: 841898.67,
                type: 'debit'
            },
            // 25 Aug
            {
                postDate: '2025-08-25',
                transactionDate: '2025-08-25',
                description: 'EFT Received ABSA',
                reference: 'ABS0825',
                authId: '778014',
                amount: 165000.0,
                balanceAfter: 1006898.67,
                type: 'credit'
            },
            {
                postDate: '2025-08-25',
                transactionDate: '2025-08-25',
                description: 'Immediate Payment Afrox',
                reference: 'IMM0825',
                authId: '778015',
                amount: -29000.0,
                fees: -6.0,
                balanceAfter: 977892.67,
                type: 'debit'
            },
            // 26 Aug
            {
                postDate: '2025-08-26',
                transactionDate: '2025-08-26',
                description: 'PayShapReceived Aveng',
                reference: '*****945678** **',
                authId: '778016',
                amount: 26000.0,
                balanceAfter: 1003892.67,
                type: 'credit'
            },
            {
                postDate: '2025-08-26',
                transactionDate: '2025-08-26',
                description: 'Payment to Eskom',
                reference: 'ESK0826',
                authId: '778017',
                amount: -18000.0,
                balanceAfter: 985892.67,
                type: 'debit'
            },
            // 27 Aug
            {
                postDate: '2025-08-27',
                transactionDate: '2025-08-27',
                description: 'EFT Received Betterdays Technologies',
                reference: 'STD0827',
                authId: '778018',
                amount: 110000.0,
                balanceAfter: 1095892.67,
                type: 'credit'
            },
            {
                postDate: '2025-08-27',
                transactionDate: '2025-08-27',
                description: 'Immediate Payment Grindrod',
                reference: 'IMM0827',
                authId: '778019',
                amount: -21000.0,
                fees: -6.0,
                balanceAfter: 1074886.67,
                type: 'debit'
            },
            // 28 Aug
            {
                postDate: '2025-08-28',
                transactionDate: '2025-08-28',
                description: 'PayShapReceived Old Mutual',
                reference: '*****956789** **',
                authId: '778020',
                amount: 19000.0,
                balanceAfter: 1093886.67,
                type: 'credit'
            },
            {
                postDate: '2025-08-28',
                transactionDate: '2025-08-28',
                description: 'Business Payment to Engen',
                reference: 'ENG0828',
                authId: '778021',
                amount: -35000.0,
                fees: -1.0,
                balanceAfter: 1058885.67,
                type: 'debit'
            },
            // 29 Aug
            {
                postDate: '2025-08-29',
                transactionDate: '2025-08-29',
                description: 'Immediate Payment Basil Read',
                reference: 'IMM0829',
                authId: '778022',
                amount: -14000.0,
                fees: -6.0,
                balanceAfter: 1044879.67,
                type: 'debit'
            },
            {
                postDate: '2025-08-29',
                transactionDate: '2025-08-29',
                description: 'PayShapReceived Momentum',
                reference: '*****967890** **',
                authId: '778023',
                amount: 12000.0,
                balanceAfter: 1056879.67,
                type: 'credit'
            },
            // 30 Aug
            {
                postDate: '2025-08-30',
                transactionDate: '2025-08-30',
                description: 'EFT Payment City Power',
                reference: 'CPW0830',
                authId: '778024',
                amount: -13000.0,
                balanceAfter: 1043879.67,
                type: 'debit'
            },
            // 31 Aug – month-end fees and interest
            {
                postDate: '2025-08-31',
                transactionDate: '2025-08-31',
                description: '',
                reference: 'Monthly Service Fee',
                authId: '778025',
                amount: -100.0,
                balanceAfter: 1043779.67,
                type: 'debit'
            },
            {
                postDate: '2025-08-31',
                transactionDate: '2025-08-31',
                description: '',
                reference: 'Notification Fee',
                authId: '778026',
                amount: -7.0,
                balanceAfter: 1043772.67,
                type: 'debit'
            },
            {
                postDate: '2025-08-31',
                transactionDate: '2025-08-31',
                description: 'Interest Earned Business Account',
                reference: 'INT083125',
                authId: '778027',
                amount: 16227.33,
                balanceAfter: 1060000.0,
                type: 'credit'
            },

            // ==================== SEPTEMBER (1–17) ====================
            // 1 Sep – salary & rent
            {
                postDate: '2025-09-01',
                transactionDate: '2025-09-01',
                description: 'Salary Payments Batch XERO',
                reference: 'SALARIES0901',
                authId: '778028',
                amount: -600000.0,
                balanceAfter: 460000.0,
                type: 'debit'
            },
            {
                postDate: '2025-09-01',
                transactionDate: '2025-09-01',
                description: 'Office Rental Payment',
                reference: 'MLC Group Rent',
                authId: '778029',
                amount: -45000.0,
                balanceAfter: 415000.0,
                type: 'debit'
            },
            // 2 Sep
            {
                postDate: '2025-09-02',
                transactionDate: '2025-09-02',
                description: 'EFT Received FNB',
                reference: 'FNB0902',
                authId: '778030',
                amount: 180000.0,
                balanceAfter: 595000.0,
                type: 'credit'
            },
            {
                postDate: '2025-09-02',
                transactionDate: '2025-09-02',
                description: 'Immediate Payment WBHO',
                reference: 'IMM0902',
                authId: '778031',
                amount: -38000.0,
                fees: -6.0,
                balanceAfter: 556994.0,
                type: 'debit'
            },
            // 3 Sep
            {
                postDate: '2025-09-03',
                transactionDate: '2025-09-03',
                description: 'PayShapReceived Discovery',
                reference: '*****978901** **',
                authId: '778032',
                amount: 52000.0,
                balanceAfter: 608994.0,
                type: 'credit'
            },
            {
                postDate: '2025-09-03',
                transactionDate: '2025-09-03',
                description: 'Payment to Telkom',
                reference: 'TEL0903',
                authId: '778033',
                amount: -14000.0,
                balanceAfter: 594994.0,
                type: 'debit'
            },
            // 4 Sep
            {
                postDate: '2025-09-04',
                transactionDate: '2025-09-04',
                description: 'Business Payment to Shoprite Checkers',
                reference: 'SHP0904',
                authId: '778034',
                amount: -23000.0,
                fees: -1.0,
                balanceAfter: 571993.0,
                type: 'debit'
            },
            {
                postDate: '2025-09-04',
                transactionDate: '2025-09-04',
                description: 'EFT Received Nedbank',
                reference: 'NED0904',
                authId: '778035',
                amount: 96000.0,
                balanceAfter: 667993.0,
                type: 'credit'
            },
            // 5 Sep
            {
                postDate: '2025-09-05',
                transactionDate: '2025-09-05',
                description: 'Immediate Payment PPC Cement',
                reference: 'IMM0905',
                authId: '778036',
                amount: -17000.0,
                fees: -6.0,
                balanceAfter: 650987.0,
                type: 'debit'
            },
            {
                postDate: '2025-09-05',
                transactionDate: '2025-09-05',
                description: 'PayShapReceived Investec',
                reference: '*****989012** **',
                authId: '778037',
                amount: 29000.0,
                balanceAfter: 679987.0,
                type: 'credit'
            },
            // 6 Sep
            {
                postDate: '2025-09-06',
                transactionDate: '2025-09-06',
                description: 'EFT Payment MultiChoice',
                reference: 'MCR0906',
                authId: '778038',
                amount: -11000.0,
                balanceAfter: 668987.0,
                type: 'debit'
            },
            {
                postDate: '2025-09-06',
                transactionDate: '2025-09-06',
                description: 'Immediate Payment Grindrod',
                reference: 'IMM0906',
                authId: '778039',
                amount: -13000.0,
                fees: -6.0,
                balanceAfter: 655981.0,
                type: 'debit'
            },
            // 7 Sep
            {
                postDate: '2025-09-07',
                transactionDate: '2025-09-07',
                description: 'PayShapReceived Sanlam',
                reference: '*****990123** **',
                authId: '778040',
                amount: 18000.0,
                balanceAfter: 673981.0,
                type: 'credit'
            },
            {
                postDate: '2025-09-07',
                transactionDate: '2025-09-07',
                description: 'EFT Received Liberty',
                reference: 'LIB0907',
                authId: '778041',
                amount: 64000.0,
                balanceAfter: 737981.0,
                type: 'credit'
            },
            // 8 Sep
            {
                postDate: '2025-09-08',
                transactionDate: '2025-09-08',
                description: 'Immediate Payment AfriSam',
                reference: 'IMM0908',
                authId: '778042',
                amount: -19000.0,
                fees: -6.0,
                balanceAfter: 718975.0,
                type: 'debit'
            },
            // 9 Sep
            {
                postDate: '2025-09-09',
                transactionDate: '2025-09-09',
                description: 'Payment to SARS (PAYE)',
                reference: 'SARS0909',
                authId: '778043',
                amount: -220000.0,
                balanceAfter: 498975.0,
                type: 'debit'
            },
            {
                postDate: '2025-09-09',
                transactionDate: '2025-09-09',
                description: 'PayShapReceived Old Mutual',
                reference: '*****001234** **',
                authId: '778044',
                amount: 45000.0,
                balanceAfter: 543975.0,
                type: 'credit'
            },
            // 10 Sep
            {
                postDate: '2025-09-10',
                transactionDate: '2025-09-10',
                description: 'Business Payment to DHL',
                reference: 'DHL0910',
                authId: '778045',
                amount: -14000.0,
                fees: -1.0,
                balanceAfter: 529974.0,
                type: 'debit'
            },
            {
                postDate: '2025-09-10',
                transactionDate: '2025-09-10',
                description: 'EFT Received Capitec',
                reference: 'CAP0910',
                authId: '778046',
                amount: 22000.0,
                balanceAfter: 551974.0,
                type: 'credit'
            },
            // 11 Sep
            {
                postDate: '2025-09-11',
                transactionDate: '2025-09-11',
                description: 'Immediate Payment RCL Foods',
                reference: 'IMM0911',
                authId: '778047',
                amount: -27000.0,
                fees: -6.0,
                balanceAfter: 524967.0,
                type: 'debit'
            },
            {
                postDate: '2025-09-11',
                transactionDate: '2025-09-11',
                description: 'PayShapReceived Momentum',
                reference: '*****012345** **',
                authId: '778048',
                amount: 15000.0,
                balanceAfter: 539967.0,
                type: 'credit'
            },
            // 12 Sep
            {
                postDate: '2025-09-12',
                transactionDate: '2025-09-12',
                description: 'EFT Payment Vodacom',
                reference: 'VOD0912',
                authId: '778049',
                amount: -13000.0,
                balanceAfter: 526967.0,
                type: 'debit'
            },
            {
                postDate: '2025-09-12',
                transactionDate: '2025-09-12',
                description: 'EFT Received Gauteng Province',
                reference: 'GP0912',
                authId: '778050',
                amount: 220000.0,
                balanceAfter: 746967.0,
                type: 'credit'
            },
            // 13 Sep
            {
                postDate: '2025-09-13',
                transactionDate: '2025-09-13',
                description: 'Immediate Payment Sasol',
                reference: 'IMM0913',
                authId: '778051',
                amount: -21000.0,
                fees: -6.0,
                balanceAfter: 725961.0,
                type: 'debit'
            },
            {
                postDate: '2025-09-13',
                transactionDate: '2025-09-13',
                description: 'PayShapReceived Discovery',
                reference: '*****023456** **',
                authId: '778052',
                amount: 13000.0,
                balanceAfter: 738961.0,
                type: 'credit'
            },
            // 14 Sep
            {
                postDate: '2025-09-14',
                transactionDate: '2025-09-14',
                description: 'Business Payment to Engen',
                reference: 'ENG0914',
                authId: '778053',
                amount: -16000.0,
                fees: -1.0,
                balanceAfter: 722960.0,
                type: 'debit'
            },
            {
                postDate: '2025-09-14',
                transactionDate: '2025-09-14',
                description: 'EFT Received Standard Bank',
                reference: 'STD0914',
                authId: '778054',
                amount: 38000.0,
                balanceAfter: 760960.0,
                type: 'credit'
            },
            // 15 Sep
            {
                postDate: '2025-09-15',
                transactionDate: '2025-09-15',
                description: 'Immediate Payment Bidvest',
                reference: 'IMM0915',
                authId: '778055',
                amount: -29000.0,
                fees: -6.0,
                balanceAfter: 731954.0,
                type: 'debit'
            },
            {
                postDate: '2025-09-15',
                transactionDate: '2025-09-15',
                description: 'PayShapReceived Sanlam',
                reference: '*****034567** **',
                authId: '778056',
                amount: 17000.0,
                balanceAfter: 748954.0,
                type: 'credit'
            },
            // 16 Sep
            {
                postDate: '2025-09-16',
                transactionDate: '2025-09-16',
                description: 'EFT Received ABSA',
                reference: 'ABS0916',
                authId: '778057',
                amount: 145000.0,
                balanceAfter: 893954.0,
                type: 'credit'
            },
            {
                postDate: '2025-09-16',
                transactionDate: '2025-09-16',
                description: 'Immediate Payment Afrox',
                reference: 'IMM0916',
                authId: '778058',
                amount: -18000.0,
                fees: -6.0,
                balanceAfter: 875948.0,
                type: 'debit'
            },
            // 17 Sep – final adjustment to hit closing balance 642418.67
            // Current balance 875948, we need to reduce to 642418.67, so a debit of 233529.33
            {
                postDate: '2025-09-17',
                transactionDate: '2025-09-17',
                description: 'Transfer to Investment Account',
                reference: 'TRF0917',
                authId: '778059',
                amount: -233529.33,
                balanceAfter: 642418.67,
                type: 'debit'
            }
        ]
    },
    {
        account: {
            accountNumber: '1054814708',
            accountType: 'Capitec Business Account',
            businessName: 'FIRE-IT PTY LTD',
            statementDate: '2026-02-22',
            statementNumber: '00011',
            page: 1,
            totalPages: 1
        },
        balances: {
            openingBalance: 642418.67,
            closingBalance: 392418.67
        },
        address: {
            line1: '36 REGENCY DRIVE',
            line2: 'ROUTE 21 BUSINESS PARK',
            line3: 'CENTURION',
            province: 'GAUTENG',
            postalCode: '0178'
        },
        bankDetails: {
            branchCode: '450105',
            deviceCode: '9998',
            branch: 'Relationship Suite',
            telephone: phoneNumber,
            businessRegNo: '2012/173035/07',
            vatNo: '4680173723',
            interestRate: '22.1000%'
        },
        fees: {
            feeTotal: -212.0,
            vatTotal: -31.8,
            vatRate: '15.00%'
        },
        transactions: [
            {
                postDate: '2025-09-18',
                transactionDate: '2025-09-18',
                description: 'PayShapReceived Mzanzi Logistics 247',
                reference: '*****801234** **',
                authId: '777001',
                amount: 85000.0,
                balanceAfter: 727418.67,
                type: 'credit'
            },
            // 19 Sep
            {
                postDate: '2025-09-19',
                transactionDate: '2025-09-19',
                description: 'EFT Received Gauteng Health Dept',
                reference: 'GHD0919',
                authId: '777002',
                amount: 120000.0,
                balanceAfter: 847418.67,
                type: 'credit'
            },
            {
                postDate: '2025-09-19',
                transactionDate: '2025-09-19',
                description: 'Immediate Payment Orion Security',
                reference: 'IMM0919',
                authId: '777003',
                amount: -32000.0,
                fees: -6.0,
                balanceAfter: 815412.67,
                type: 'debit'
            },
            // 20 Sep
            {
                postDate: '2025-09-20',
                transactionDate: '2025-09-20',
                description: 'PayShapReceived BlueTech Solutions',
                reference: '*****812345** **',
                authId: '777004',
                amount: 28000.0,
                balanceAfter: 843412.67,
                type: 'credit'
            },
            {
                postDate: '2025-09-20',
                transactionDate: '2025-09-20',
                description: 'Business Payment to TechSource SA',
                reference: 'CBT0920',
                authId: '777005',
                amount: -18700.0,
                fees: -1.0,
                balanceAfter: 824711.67,
                type: 'debit'
            },
            // 21 Sep
            {
                postDate: '2025-09-21',
                transactionDate: '2025-09-21',
                description: 'EFT Received Transnet',
                reference: 'TRA0921',
                authId: '777006',
                amount: 95000.0,
                balanceAfter: 919711.67,
                type: 'credit'
            },
            {
                postDate: '2025-09-21',
                transactionDate: '2025-09-21',
                description: 'Payment to Bidvest',
                reference: 'BID0921',
                authId: '777007',
                amount: -38000.0,
                balanceAfter: 881711.67,
                type: 'debit'
            },
            // 22 Sep
            {
                postDate: '2025-09-22',
                transactionDate: '2025-09-22',
                description: 'Immediate Payment Dimension Data',
                reference: 'IMM0922',
                authId: '777008',
                amount: -45000.0,
                fees: -6.0,
                balanceAfter: 836705.67,
                type: 'debit'
            },
            {
                postDate: '2025-09-22',
                transactionDate: '2025-09-22',
                description: 'PayShapReceived Sasol',
                reference: '*****823456** **',
                authId: '777009',
                amount: 33000.0,
                balanceAfter: 869705.67,
                type: 'credit'
            },
            // 23 Sep
            {
                postDate: '2025-09-23',
                transactionDate: '2025-09-23',
                description: 'EFT Payment Microsoft SA',
                reference: 'MSFT0923',
                authId: '777010',
                amount: -22000.0,
                balanceAfter: 847705.67,
                type: 'debit'
            },
            {
                postDate: '2025-09-23',
                transactionDate: '2025-09-23',
                description: 'PayShapReceived RCL Foods',
                reference: '*****834567** **',
                authId: '777011',
                amount: 18000.0,
                balanceAfter: 865705.67,
                type: 'credit'
            },
            // 24 Sep
            {
                postDate: '2025-09-24',
                transactionDate: '2025-09-24',
                description: 'Business Payment to Imperial Logistics',
                reference: 'IMP0924',
                authId: '777012',
                amount: -12500.0,
                fees: -1.0,
                balanceAfter: 853204.67,
                type: 'debit'
            },
            // 25 Sep
            {
                postDate: '2025-09-25',
                transactionDate: '2025-09-25',
                description: 'Immediate Payment Tsebo Solutions',
                reference: 'IMM0925',
                authId: '777013',
                amount: -22000.0,
                fees: -6.0,
                balanceAfter: 831198.67,
                type: 'debit'
            },
            // 26 Sep
            {
                postDate: '2025-09-26',
                transactionDate: '2025-09-26',
                description: 'EFT Received ABSA',
                reference: 'ABS0926',
                authId: '777014',
                amount: 140000.0,
                balanceAfter: 971198.67,
                type: 'credit'
            },
            {
                postDate: '2025-09-26',
                transactionDate: '2025-09-26',
                description: 'Immediate Payment Afrox',
                reference: 'IMM0926',
                authId: '777015',
                amount: -28000.0,
                fees: -6.0,
                balanceAfter: 943192.67,
                type: 'debit'
            },
            // 27 Sep
            {
                postDate: '2025-09-27',
                transactionDate: '2025-09-27',
                description: 'PayShapReceived Aveng',
                reference: '*****845678** **',
                authId: '777016',
                amount: 24000.0,
                balanceAfter: 967192.67,
                type: 'credit'
            },
            {
                postDate: '2025-09-27',
                transactionDate: '2025-09-27',
                description: 'Payment to Eskom',
                reference: 'ESK0927',
                authId: '777017',
                amount: -15000.0,
                balanceAfter: 952192.67,
                type: 'debit'
            },
            // 28 Sep
            {
                postDate: '2025-09-28',
                transactionDate: '2025-09-28',
                description: 'EFT Received Standard Bank',
                reference: 'STD0928',
                authId: '777018',
                amount: 90000.0,
                balanceAfter: 1042192.67,
                type: 'credit'
            },
            {
                postDate: '2025-09-28',
                transactionDate: '2025-09-28',
                description: 'Immediate Payment Grindrod',
                reference: 'IMM0928',
                authId: '777019',
                amount: -19000.0,
                fees: -6.0,
                balanceAfter: 1023186.67,
                type: 'debit'
            },
            // 29 Sep
            {
                postDate: '2025-09-29',
                transactionDate: '2025-09-29',
                description: 'PayShapReceived Old Mutual',
                reference: '*****856789** **',
                authId: '777020',
                amount: 16000.0,
                balanceAfter: 1039186.67,
                type: 'credit'
            },
            {
                postDate: '2025-09-29',
                transactionDate: '2025-09-29',
                description: 'Business Payment to Engen',
                reference: 'ENG0929',
                authId: '777021',
                amount: -32000.0,
                fees: -1.0,
                balanceAfter: 1007185.67,
                type: 'debit'
            },
            // 30 Sep – month-end fees and interest
            {
                postDate: '2025-09-30',
                transactionDate: '2025-09-30',
                description: '',
                reference: 'Monthly Service Fee',
                authId: '777022',
                amount: -100.0,
                balanceAfter: 1007085.67,
                type: 'debit'
            },
            {
                postDate: '2025-09-30',
                transactionDate: '2025-09-30',
                description: '',
                reference: 'Notification Fee',
                authId: '777023',
                amount: -7.0,
                balanceAfter: 1007078.67,
                type: 'debit'
            },
            {
                postDate: '2025-09-30',
                transactionDate: '2025-09-30',
                description: 'Interest Earned Business Account',
                reference: 'INT093025',
                authId: '777024',
                amount: 15921.33,
                balanceAfter: 1023000.0,
                type: 'credit'
            },

            // ==================== OCTOBER (1–18) ====================
            // 1 Oct – salary & rent
            {
                postDate: '2025-10-01',
                transactionDate: '2025-10-01',
                description: 'Salary Payments Batch XERO',
                reference: 'SALARIES1001',
                authId: '777025',
                amount: -600000.0,
                balanceAfter: 423000.0,
                type: 'debit'
            },
            {
                postDate: '2025-10-01',
                transactionDate: '2025-10-01',
                description: 'Office Rental Payment',
                reference: 'MLC Group Rent',
                authId: '777026',
                amount: -45000.0,
                balanceAfter: 378000.0,
                type: 'debit'
            },
            // 2 Oct – purchase of first small car
            {
                postDate: '2025-10-02',
                transactionDate: '2025-10-02',
                description: 'Vehicle Purchase – McCarthy Toyota (Corolla)',
                reference: 'CAR1002A',
                authId: '777027',
                amount: -145000.0,
                fees: -1.0,
                balanceAfter: 232999.0,
                type: 'debit'
            },
            {
                postDate: '2025-10-02',
                transactionDate: '2025-10-02',
                description: 'Immediate Payment WBHO',
                reference: 'IMM1002',
                authId: '777028',
                amount: -22000.0,
                fees: -6.0,
                balanceAfter: 210993.0,
                type: 'debit'
            },
            // 3 Oct
            {
                postDate: '2025-10-03',
                transactionDate: '2025-10-03',
                description: 'PayShapReceived Discovery',
                reference: '*****867890** **',
                authId: '777029',
                amount: 45000.0,
                balanceAfter: 255993.0,
                type: 'credit'
            },
            {
                postDate: '2025-10-03',
                transactionDate: '2025-10-03',
                description: 'Payment to Telkom',
                reference: 'TEL1003',
                authId: '777030',
                amount: -12000.0,
                balanceAfter: 243993.0,
                type: 'debit'
            },
            // 4 Oct
            {
                postDate: '2025-10-04',
                transactionDate: '2025-10-04',
                description: 'Immediate Payment Basil Read',
                reference: 'IMM1004',
                authId: '777031',
                amount: -13000.0,
                fees: -6.0,
                balanceAfter: 230987.0,
                type: 'debit'
            },
            {
                postDate: '2025-10-04',
                transactionDate: '2025-10-04',
                description: 'PayShapReceived Momentum',
                reference: '*****878901** **',
                authId: '777032',
                amount: 22000.0,
                balanceAfter: 252987.0,
                type: 'credit'
            },
            // 5 Oct
            {
                postDate: '2025-10-05',
                transactionDate: '2025-10-05',
                description: 'EFT Payment City Power',
                reference: 'CPW1005',
                authId: '777033',
                amount: -11000.0,
                balanceAfter: 241987.0,
                type: 'debit'
            },
            {
                postDate: '2025-10-05',
                transactionDate: '2025-10-05',
                description: 'Immediate Payment PPC Cement',
                reference: 'IMM1005',
                authId: '777034',
                amount: -10000.0,
                fees: -6.0,
                balanceAfter: 231981.0,
                type: 'debit'
            },
            // 6 Oct – second car purchase
            {
                postDate: '2025-10-06',
                transactionDate: '2025-10-06',
                description: 'Vehicle Purchase – Suzuki Auto (Swift)',
                reference: 'CAR1006B',
                authId: '777035',
                amount: -155000.0,
                fees: -1.0,
                balanceAfter: 76980.0,
                type: 'debit'
            },
            // 7 Oct – need cash to cover, but we have some credits later
            {
                postDate: '2025-10-07',
                transactionDate: '2025-10-07',
                description: 'Immediate Payment Grindrod',
                reference: 'IMM1007',
                authId: '777036',
                amount: -19000.0,
                fees: -6.0,
                balanceAfter: 57974.0,
                type: 'debit'
            },
            {
                postDate: '2025-10-07',
                transactionDate: '2025-10-07',
                description: 'EFT Received Standard Bank',
                reference: 'STD1007',
                authId: '777037',
                amount: 100000.0,
                balanceAfter: 157974.0,
                type: 'credit'
            },
            // 8 Oct
            {
                postDate: '2025-10-08',
                transactionDate: '2025-10-08',
                description: 'Business Payment to DHL',
                reference: 'DHL1008',
                authId: '777038',
                amount: -12000.0,
                fees: -1.0,
                balanceAfter: 145973.0,
                type: 'debit'
            },
            {
                postDate: '2025-10-08',
                transactionDate: '2025-10-08',
                description: 'PayShapReceived Sanlam',
                reference: '*****889012** **',
                authId: '777039',
                amount: 15000.0,
                balanceAfter: 160973.0,
                type: 'credit'
            },
            // 9 Oct – SARS payment
            {
                postDate: '2025-10-09',
                transactionDate: '2025-10-09',
                description: 'Payment to SARS (PAYE)',
                reference: 'SARS1009',
                authId: '777040',
                amount: -95000.0,
                balanceAfter: 65973.0,
                type: 'debit'
            },
            // 10 Oct
            {
                postDate: '2025-10-10',
                transactionDate: '2025-10-10',
                description: 'Immediate Payment AfriSam',
                reference: 'IMM1010',
                authId: '777041',
                amount: -22000.0,
                fees: -6.0,
                balanceAfter: 43967.0,
                type: 'debit'
            },
            {
                postDate: '2025-10-10',
                transactionDate: '2025-10-10',
                description: 'PayShapReceived Old Mutual',
                reference: '*****890123** **',
                authId: '777042',
                amount: 12000.0,
                balanceAfter: 55967.0,
                type: 'credit'
            },
            // 11 Oct
            {
                postDate: '2025-10-11',
                transactionDate: '2025-10-11',
                description: 'EFT Payment MultiChoice',
                reference: 'MCR1011',
                authId: '777043',
                amount: -9000.0,
                balanceAfter: 46967.0,
                type: 'debit'
            },
            {
                postDate: '2025-10-11',
                transactionDate: '2025-10-11',
                description: 'EFT Received Gauteng Province',
                reference: 'GP1011',
                authId: '777044',
                amount: 80000.0,
                balanceAfter: 126967.0,
                type: 'credit'
            },
            // 13 Oct (skip weekend)
            {
                postDate: '2025-10-13',
                transactionDate: '2025-10-13',
                description: 'Immediate Payment RCL Foods',
                reference: 'IMM1013',
                authId: '777045',
                amount: -36000.0,
                fees: -6.0,
                balanceAfter: 90961.0,
                type: 'debit'
            },
            {
                postDate: '2025-10-13',
                transactionDate: '2025-10-13',
                description: 'PayShapReceived Momentum',
                reference: '*****901234** **',
                authId: '777046',
                amount: 21000.0,
                balanceAfter: 111961.0,
                type: 'credit'
            },
            // 14 Oct
            {
                postDate: '2025-10-14',
                transactionDate: '2025-10-14',
                description: 'Business Payment to Engen',
                reference: 'ENG1014',
                authId: '777047',
                amount: -15000.0,
                fees: -1.0,
                balanceAfter: 96960.0,
                type: 'debit'
            },
            {
                postDate: '2025-10-14',
                transactionDate: '2025-10-14',
                description: 'EFT Received Standard Bank',
                reference: 'STD1014',
                authId: '777048',
                amount: 33000.0,
                balanceAfter: 129960.0,
                type: 'credit'
            },
            // 15 Oct
            {
                postDate: '2025-10-15',
                transactionDate: '2025-10-15',
                description: 'Immediate Payment Sasol',
                reference: 'IMM1015',
                authId: '777049',
                amount: -19000.0,
                fees: -6.0,
                balanceAfter: 110954.0,
                type: 'debit'
            },
            {
                postDate: '2025-10-15',
                transactionDate: '2025-10-15',
                description: 'PayShapReceived Discovery',
                reference: '*****912345** **',
                authId: '777050',
                amount: 15000.0,
                balanceAfter: 125954.0,
                type: 'credit'
            },
            // 16 Oct
            {
                postDate: '2025-10-16',
                transactionDate: '2025-10-16',
                description: 'EFT Payment Vodacom',
                reference: 'VOD1016',
                authId: '777051',
                amount: -14000.0,
                balanceAfter: 111954.0,
                type: 'debit'
            },
            {
                postDate: '2025-10-16',
                transactionDate: '2025-10-16',
                description: 'EFT Received ABSA',
                reference: 'ABS1016',
                authId: '777052',
                amount: 88000.0,
                balanceAfter: 199954.0,
                type: 'credit'
            },
            // 17 Oct
            {
                postDate: '2025-10-17',
                transactionDate: '2025-10-17',
                description: 'Immediate Payment Bidvest',
                reference: 'IMM1017',
                authId: '777053',
                amount: -25000.0,
                fees: -6.0,
                balanceAfter: 174948.0,
                type: 'debit'
            },
            {
                postDate: '2025-10-17',
                transactionDate: '2025-10-17',
                description: 'PayShapReceived Sanlam',
                reference: '*****923456** **',
                authId: '777054',
                amount: 17000.0,
                balanceAfter: 191948.0,
                type: 'credit'
            },
            {
                postDate: '2025-10-18',
                transactionDate: '2025-10-18',
                description: 'EFT Received Legend Barber',
                reference: 'LBB1022',
                authId: '777055',
                amount: 200470.67,
                balanceAfter: 392418.67,
                type: 'credit'
            }
        ]
    },
    {
        account: {
            accountNumber: '1054814708',
            accountType: 'Capitec Business Account',
            businessName: 'FIRE-IT PTY LTD',
            statementDate: '2026-02-22',
            statementNumber: '00012',
            page: 1,
            totalPages: 1
        },
        balances: {
            openingBalance: 392418.67,
            closingBalance: 442418.67
        },
        address: {
            line1: '36 REGENCY DRIVE',
            line2: 'ROUTE 21 BUSINESS PARK',
            line3: 'CENTURION',
            province: 'GAUTENG',
            postalCode: '0178'
        },
        bankDetails: {
            branchCode: '450105',
            deviceCode: '9998',
            branch: 'Relationship Suite',
            telephone: phoneNumber,
            businessRegNo: '2012/173035/07',
            vatNo: '4680173723',
            interestRate: '22.1000%'
        },
        fees: {
            feeTotal: -197.0,
            vatTotal: -29.55,
            vatRate: '15.00%'
        },
        transactions: [
            // ==================== OCTOBER (19–31) ====================
            // 19 Oct
            {
                postDate: '2025-10-19',
                transactionDate: '2025-10-19',
                description: 'PayShapReceived Mzanzi Logistics 247',
                reference: '*****301234** **',
                authId: '774001',
                amount: 120000.0,
                balanceAfter: 512418.67,
                type: 'credit'
            },
            // 20 Oct
            {
                postDate: '2025-10-20',
                transactionDate: '2025-10-20',
                description: 'EFT Received Gauteng Education Dept IT Upgrade',
                reference: 'EFT10201',
                authId: '774002',
                amount: 350000.0,
                balanceAfter: 862418.67,
                type: 'credit'
            },
            {
                postDate: '2025-10-20',
                transactionDate: '2025-10-20',
                description: 'Immediate Payment Orion Security Contractors',
                reference: 'IMM1020A',
                authId: '774003',
                amount: -28000.0,
                fees: -6.0,
                balanceAfter: 834412.67,
                type: 'debit'
            },
            // 21 Oct
            {
                postDate: '2025-10-21',
                transactionDate: '2025-10-21',
                description: 'PayShapReceived BlueTech Solutions',
                reference: '*****312345** **',
                authId: '774004',
                amount: 85000.0,
                balanceAfter: 919412.67,
                type: 'credit'
            },
            {
                postDate: '2025-10-21',
                transactionDate: '2025-10-21',
                description: 'Business Payment to TechSource SA',
                reference: 'CBT1021',
                authId: '774005',
                amount: -22300.0,
                fees: -1.0,
                balanceAfter: 897111.67,
                type: 'debit'
            },
            // 22 Oct
            {
                postDate: '2025-10-22',
                transactionDate: '2025-10-22',
                description: 'EFT Received Transnet Freight',
                reference: 'TRA1022',
                authId: '774006',
                amount: 195000.0,
                balanceAfter: 1092111.67,
                type: 'credit'
            },
            {
                postDate: '2025-10-22',
                transactionDate: '2025-10-22',
                description: 'Payment to Bidvest',
                reference: 'BID1022',
                authId: '774007',
                amount: -44500.0,
                balanceAfter: 1047611.67,
                type: 'debit'
            },
            // 23 Oct
            {
                postDate: '2025-10-23',
                transactionDate: '2025-10-23',
                description: 'Immediate Payment Dimension Data',
                reference: 'IMM1023',
                authId: '774008',
                amount: -63000.0,
                fees: -6.0,
                balanceAfter: 984605.67,
                type: 'debit'
            },
            {
                postDate: '2025-10-23',
                transactionDate: '2025-10-23',
                description: 'PayShapReceived Sasol',
                reference: '*****323456** **',
                authId: '774009',
                amount: 52000.0,
                balanceAfter: 1036605.67,
                type: 'credit'
            },
            // 24 Oct
            {
                postDate: '2025-10-24',
                transactionDate: '2025-10-24',
                description: 'EFT Payment Microsoft SA',
                reference: 'MSFT1024',
                authId: '774010',
                amount: -35000.0,
                balanceAfter: 1001605.67,
                type: 'debit'
            },
            {
                postDate: '2025-10-24',
                transactionDate: '2025-10-24',
                description: 'PayShapReceived RCL Foods',
                reference: '*****334567** **',
                authId: '774011',
                amount: 29000.0,
                balanceAfter: 1030605.67,
                type: 'credit'
            },
            // 25 Oct
            {
                postDate: '2025-10-25',
                transactionDate: '2025-10-25',
                description: 'Business Payment to Imperial Logistics',
                reference: 'IMP1025',
                authId: '774012',
                amount: -18700.0,
                fees: -1.0,
                balanceAfter: 1011904.67,
                type: 'debit'
            },
            // 27 Oct (skip weekend)
            {
                postDate: '2025-10-27',
                transactionDate: '2025-10-27',
                description: 'EFT Received ABSA',
                reference: 'ABS1027',
                authId: '774013',
                amount: 225000.0,
                balanceAfter: 1236904.67,
                type: 'credit'
            },
            {
                postDate: '2025-10-27',
                transactionDate: '2025-10-27',
                description: 'Immediate Payment Tsebo Solutions',
                reference: 'IMM1027',
                authId: '774014',
                amount: -41000.0,
                fees: -6.0,
                balanceAfter: 1195898.67,
                type: 'debit'
            },
            // 28 Oct
            {
                postDate: '2025-10-28',
                transactionDate: '2025-10-28',
                description: 'PayShapReceived Aveng',
                reference: '*****345678** **',
                authId: '774015',
                amount: 37000.0,
                balanceAfter: 1232898.67,
                type: 'credit'
            },
            {
                postDate: '2025-10-28',
                transactionDate: '2025-10-28',
                description: 'Payment to Eskom',
                reference: 'ESK1028',
                authId: '774016',
                amount: -21000.0,
                balanceAfter: 1211898.67,
                type: 'debit'
            },
            // 29 Oct
            {
                postDate: '2025-10-29',
                transactionDate: '2025-10-29',
                description: 'EFT Received Standard Bank',
                reference: 'STD1029',
                authId: '774017',
                amount: 140000.0,
                balanceAfter: 1351898.67,
                type: 'credit'
            },
            {
                postDate: '2025-10-29',
                transactionDate: '2025-10-29',
                description: 'Immediate Payment Grindrod',
                reference: 'IMM1029',
                authId: '774018',
                amount: -26000.0,
                fees: -6.0,
                balanceAfter: 1325892.67,
                type: 'debit'
            },
            // 30 Oct
            {
                postDate: '2025-10-30',
                transactionDate: '2025-10-30',
                description: 'PayShapReceived Old Mutual',
                reference: '*****356789** **',
                authId: '774019',
                amount: 83000.0,
                balanceAfter: 1408892.67,
                type: 'credit'
            },
            {
                postDate: '2025-10-30',
                transactionDate: '2025-10-30',
                description: 'Business Payment to Engen',
                reference: 'ENG1030',
                authId: '774020',
                amount: -32500.0,
                fees: -1.0,
                balanceAfter: 1376391.67,
                type: 'debit'
            },
            // 31 Oct – month-end fees and interest
            {
                postDate: '2025-10-31',
                transactionDate: '2025-10-31',
                description: '',
                reference: 'Monthly Service Fee',
                authId: '774021',
                amount: -100.0,
                balanceAfter: 1376291.67,
                type: 'debit'
            },
            {
                postDate: '2025-10-31',
                transactionDate: '2025-10-31',
                description: '',
                reference: 'Notification Fee',
                authId: '774022',
                amount: -7.0,
                balanceAfter: 1376284.67,
                type: 'debit'
            },
            {
                postDate: '2025-10-31',
                transactionDate: '2025-10-31',
                description: 'Interest Earned Business Account',
                reference: 'INT103125',
                authId: '774023',
                amount: 14715.33,
                balanceAfter: 1391000.0,
                type: 'credit'
            },

            // ==================== NOVEMBER (1–19) ====================
            // 1 Nov – salary & rent
            {
                postDate: '2025-11-01',
                transactionDate: '2025-11-01',
                description: 'Salary Payments Batch XERO',
                reference: 'SALARIES1101',
                authId: '774024',
                amount: -600000.0,
                balanceAfter: 791000.0,
                type: 'debit'
            },
            {
                postDate: '2025-11-01',
                transactionDate: '2025-11-01',
                description: 'Office Rental Payment',
                reference: 'MLC Group Rent',
                authId: '774025',
                amount: -45000.0,
                balanceAfter: 746000.0,
                type: 'debit'
            },
            // 2 Nov
            {
                postDate: '2025-11-02',
                transactionDate: '2025-11-02',
                description: 'EFT Received FNB',
                reference: 'FNB1102',
                authId: '774026',
                amount: 180000.0,
                balanceAfter: 926000.0,
                type: 'credit'
            },
            {
                postDate: '2025-11-02',
                transactionDate: '2025-11-02',
                description: 'Immediate Payment WBHO',
                reference: 'IMM1102',
                authId: '774027',
                amount: -52000.0,
                fees: -6.0,
                balanceAfter: 873994.0,
                type: 'debit'
            },
            // 3 Nov
            {
                postDate: '2025-11-03',
                transactionDate: '2025-11-03',
                description: 'PayShapReceived Discovery',
                reference: '*****367890** **',
                authId: '774028',
                amount: 47000.0,
                balanceAfter: 920994.0,
                type: 'credit'
            },
            {
                postDate: '2025-11-03',
                transactionDate: '2025-11-03',
                description: 'Payment to Telkom',
                reference: 'TEL1103',
                authId: '774029',
                amount: -19000.0,
                balanceAfter: 901994.0,
                type: 'debit'
            },
            // 4 Nov
            {
                postDate: '2025-11-04',
                transactionDate: '2025-11-04',
                description: 'Business Payment to Shoprite Checkers',
                reference: 'SHP1104',
                authId: '774030',
                amount: -24500.0,
                fees: -1.0,
                balanceAfter: 877493.0,
                type: 'debit'
            },
            {
                postDate: '2025-11-04',
                transactionDate: '2025-11-04',
                description: 'EFT Received Nedbank',
                reference: 'NED1104',
                authId: '774031',
                amount: 93000.0,
                balanceAfter: 970493.0,
                type: 'credit'
            },
            // 5 Nov
            {
                postDate: '2025-11-05',
                transactionDate: '2025-11-05',
                description: 'Immediate Payment Afrox',
                reference: 'IMM1105',
                authId: '774032',
                amount: -15500.0,
                fees: -6.0,
                balanceAfter: 954987.0,
                type: 'debit'
            },
            {
                postDate: '2025-11-05',
                transactionDate: '2025-11-05',
                description: 'PayShapReceived Momentum',
                reference: '*****378901** **',
                authId: '774033',
                amount: 28000.0,
                balanceAfter: 982987.0,
                type: 'credit'
            },
            // 6 Nov
            {
                postDate: '2025-11-06',
                transactionDate: '2025-11-06',
                description: 'EFT Payment City Power',
                reference: 'CPW1106',
                authId: '774034',
                amount: -13000.0,
                balanceAfter: 969987.0,
                type: 'debit'
            },
            {
                postDate: '2025-11-06',
                transactionDate: '2025-11-06',
                description: 'PayShapReceived Investec',
                reference: '*****389012** **',
                authId: '774035',
                amount: 34000.0,
                balanceAfter: 1003987.0,
                type: 'credit'
            },
            // 7 Nov
            {
                postDate: '2025-11-07',
                transactionDate: '2025-11-07',
                description: 'Immediate Payment Basil Read',
                reference: 'IMM1107',
                authId: '774036',
                amount: -37000.0,
                fees: -6.0,
                balanceAfter: 966981.0,
                type: 'debit'
            },
            {
                postDate: '2025-11-07',
                transactionDate: '2025-11-07',
                description: 'EFT Received Liberty',
                reference: 'LIB1107',
                authId: '774037',
                amount: 58000.0,
                balanceAfter: 1024981.0,
                type: 'credit'
            },
            // 10 Nov (after weekend)
            {
                postDate: '2025-11-10',
                transactionDate: '2025-11-10',
                description: 'Payment to SARS (PAYE)',
                reference: 'SARS1110',
                authId: '774038',
                amount: -215000.0,
                balanceAfter: 809981.0,
                type: 'debit'
            },
            {
                postDate: '2025-11-10',
                transactionDate: '2025-11-10',
                description: 'PayShapReceived Sanlam',
                reference: '*****390123** **',
                authId: '774039',
                amount: 66000.0,
                balanceAfter: 875981.0,
                type: 'credit'
            },
            // 11 Nov
            {
                postDate: '2025-11-11',
                transactionDate: '2025-11-11',
                description: 'Business Payment to DHL',
                reference: 'DHL1111',
                authId: '774040',
                amount: -14500.0,
                fees: -1.0,
                balanceAfter: 861480.0,
                type: 'debit'
            },
            {
                postDate: '2025-11-11',
                transactionDate: '2025-11-11',
                description: 'EFT Received Capitec',
                reference: 'CAP1111',
                authId: '774041',
                amount: 22000.0,
                balanceAfter: 883480.0,
                type: 'credit'
            },
            // 12 Nov
            {
                postDate: '2025-11-12',
                transactionDate: '2025-11-12',
                description: 'Immediate Payment PPC Cement',
                reference: 'IMM1112',
                authId: '774042',
                amount: -28000.0,
                fees: -6.0,
                balanceAfter: 855474.0,
                type: 'debit'
            },
            {
                postDate: '2025-11-12',
                transactionDate: '2025-11-12',
                description: 'PayShapReceived Old Mutual',
                reference: '*****401234** **',
                authId: '774043',
                amount: 15000.0,
                balanceAfter: 870474.0,
                type: 'credit'
            },
            // 13 Nov
            {
                postDate: '2025-11-13',
                transactionDate: '2025-11-13',
                description: 'EFT Payment MultiChoice',
                reference: 'MCR1113',
                authId: '774044',
                amount: -11000.0,
                balanceAfter: 859474.0,
                type: 'debit'
            },
            {
                postDate: '2025-11-13',
                transactionDate: '2025-11-13',
                description: 'EFT Received Gauteng Province',
                reference: 'GP1113',
                authId: '774045',
                amount: 320000.0,
                balanceAfter: 1179474.0,
                type: 'credit'
            },
            // 14 Nov
            {
                postDate: '2025-11-14',
                transactionDate: '2025-11-14',
                description: 'Immediate Payment AfriSam',
                reference: 'IMM1114',
                authId: '774046',
                amount: -44000.0,
                fees: -6.0,
                balanceAfter: 1135468.0,
                type: 'debit'
            },
            {
                postDate: '2025-11-14',
                transactionDate: '2025-11-14',
                description: 'PayShapReceived RCL Foods',
                reference: '*****412345** **',
                authId: '774047',
                amount: 27000.0,
                balanceAfter: 1162468.0,
                type: 'credit'
            },
            // 17 Nov
            {
                postDate: '2025-11-17',
                transactionDate: '2025-11-17',
                description: 'Business Payment to Engen',
                reference: 'ENG1117',
                authId: '774048',
                amount: -19000.0,
                fees: -1.0,
                balanceAfter: 1143467.0,
                type: 'debit'
            },
            {
                postDate: '2025-11-17',
                transactionDate: '2025-11-17',
                description: 'EFT Received Standard Bank',
                reference: 'STD1117',
                authId: '774049',
                amount: 42000.0,
                balanceAfter: 1185467.0,
                type: 'credit'
            },
            // 18 Nov
            {
                postDate: '2025-11-18',
                transactionDate: '2025-11-18',
                description: 'Immediate Payment Grindrod',
                reference: 'IMM1118',
                authId: '774050',
                amount: -23000.0,
                fees: -6.0,
                balanceAfter: 1162461.0,
                type: 'debit'
            },
            {
                postDate: '2025-11-18',
                transactionDate: '2025-11-18',
                description: 'PayShapReceived Momentum',
                reference: '*****423456** **',
                authId: '774051',
                amount: 19000.0,
                balanceAfter: 1181461.0,
                type: 'credit'
            },
            // 19 Nov – final transaction to adjust to exact closing balance
            {
                postDate: '2025-11-19',
                transactionDate: '2025-11-19',
                description: 'Transfer to Business Reserve Account',
                reference: 'TRF1119',
                authId: '774052',
                amount: -739042.33,
                balanceAfter: 442418.67,
                type: 'debit'
            }
        ]
    },
    {
        account: {
            accountNumber: '1054814708',
            accountType: 'Capitec Business Account',
            businessName: 'FIRE-IT PTY LTD',
            statementDate: '2026-02-22',
            statementNumber: '00013',
            page: 1,
            totalPages: 1
        },
        balances: {
            openingBalance: 442418.67,
            closingBalance: 617418.67
        },
        address: {
            line1: '36 REGENCY DRIVE',
            line2: 'ROUTE 21 BUSINESS PARK',
            line3: 'CENTURION',
            province: 'GAUTENG',
            postalCode: '0178'
        },
        bankDetails: {
            branchCode: '450105',
            deviceCode: '9998',
            branch: 'Relationship Suite',
            telephone: phoneNumber,
            businessRegNo: '2012/173035/07',
            vatNo: '4680173723',
            interestRate: '22.1000%'
        },
        fees: {
            feeTotal: -78.0,
            vatTotal: -11.7,
            vatRate: '15.00%'
        },
        transactions: [
            // ---------- November (11 transactions) ----------
            {
                postDate: '2025-11-20',
                transactionDate: '2025-11-20',
                description: 'PayShapReceived Shine The Way Solutions',
                reference: '*****006012** **',
                authId: '771001',
                amount: 8500.0,
                balanceAfter: 450918.67,
                type: 'credit'
            },
            {
                postDate: '2025-11-21',
                transactionDate: '2025-11-21',
                description: 'EFT Received M.A.G Firewall Upgrade',
                reference: 'EFT983421',
                authId: '771002',
                amount: 68500.0,
                balanceAfter: 519418.67,
                type: 'credit'
            },
            {
                postDate: '2025-11-22',
                transactionDate: '2025-11-22',
                description: 'Immediate Payment Orion Security Contractors',
                reference: 'IMMPAY1122',
                authId: '771003',
                amount: -25000.0,
                fees: -6.0,
                balanceAfter: 494412.67,
                type: 'debit'
            },
            {
                postDate: '2025-11-24',
                transactionDate: '2025-11-24',
                description: 'PayShapReceived Urban Tech Installers',
                reference: '*****004881** **',
                authId: '771004',
                amount: 12450.0,
                balanceAfter: 506862.67,
                type: 'credit'
            },
            {
                postDate: '2025-11-25',
                transactionDate: '2025-11-25',
                description: 'Business Payment to TechSource SA',
                reference: 'CBT1125',
                authId: '771005',
                amount: -18450.0,
                fees: -1.0,
                balanceAfter: 488411.67,
                type: 'debit'
            },
            {
                postDate: '2025-11-27',
                transactionDate: '2025-11-27',
                description: 'EFT Received Platinum Mining Ltd Security Audit',
                reference: 'EFT983500',
                authId: '771006',
                amount: 110000.0,
                balanceAfter: 598411.67,
                type: 'credit'
            },
            {
                postDate: '2025-11-28',
                transactionDate: '2025-11-28',
                description: 'Dell SA Online Workstations',
                reference: 'DLL775210',
                authId: '771007',
                amount: -49850.0,
                balanceAfter: 548561.67,
                type: 'debit'
            },
            {
                postDate: '2025-11-29',
                transactionDate: '2025-11-29',
                description: 'PayShapReceived Bright Path Consulting',
                reference: '*****008990** **',
                authId: '771008',
                amount: 9700.0,
                balanceAfter: 558261.67,
                type: 'credit'
            },
            {
                postDate: '2025-11-30',
                transactionDate: '2025-11-30',
                description: '',
                reference: 'Monthly Service Fee',
                authId: '771009',
                amount: -50.0,
                balanceAfter: 558211.67,
                type: 'debit'
            },
            {
                postDate: '2025-11-30',
                transactionDate: '2025-11-30',
                description: '',
                reference: 'Notification Fee',
                authId: '771010',
                amount: -7.0, // adjusted to make feeTotal -78.0
                balanceAfter: 558204.67,
                type: 'debit'
            },
            {
                postDate: '2025-11-30',
                transactionDate: '2025-11-30',
                description: 'Office Rental Payment – MLC Group',
                reference: 'RENT1130',
                authId: '771011',
                amount: -45000.0,
                balanceAfter: 513204.67,
                type: 'debit'
            },

            // ---------- December (19 transactions) ----------
            // 1 December – Salary day with buffer
            {
                postDate: '2025-12-01',
                transactionDate: '2025-12-01',
                description: 'PayShapReceived Motor Accident Group',
                reference: '*****012345** **',
                authId: '771012',
                amount: 200000.0,
                balanceAfter: 713204.67,
                type: 'credit'
            },
            {
                postDate: '2025-12-01',
                transactionDate: '2025-12-01',
                description: 'PayShapReceived BlueTech Solutions',
                reference: '*****067890** **',
                authId: '771013',
                amount: 200000.0,
                balanceAfter: 913204.67,
                type: 'credit'
            },
            {
                postDate: '2025-12-01',
                transactionDate: '2025-12-01',
                description: 'Salary Payments Batch XERO',
                reference: 'SALARIES1201',
                authId: '771014',
                amount: -600000.0,
                balanceAfter: 313204.67,
                type: 'debit'
            },
            // 2 December
            {
                postDate: '2025-12-02',
                transactionDate: '2025-12-02',
                description: 'EFT Received Smart Retail Group POS Integration',
                reference: 'EFT983611',
                authId: '771015',
                amount: 74000.0,
                balanceAfter: 387204.67,
                type: 'credit'
            },
            // 4 December
            {
                postDate: '2025-12-04',
                transactionDate: '2025-12-04',
                description: 'Immediate Payment Motor Accident Group Software Support',
                reference: 'IMMPAY1204',
                authId: '771016',
                amount: -85000.0,
                fees: -6.0,
                balanceAfter: 302198.67,
                type: 'debit'
            },
            // 5 December
            {
                postDate: '2025-12-05',
                transactionDate: '2025-12-05',
                description: 'PayShapReceived SolarTech Africa',
                reference: '*****003321** **',
                authId: '771017',
                amount: 15400.0,
                balanceAfter: 317598.67,
                type: 'credit'
            },
            // 9 December – increased by 0.70 to fix final balance
            {
                postDate: '2025-12-09',
                transactionDate: '2025-12-09',
                description: 'PayShapReceived Gauteng Supplies',
                reference: '*****045678** **',
                authId: '771018',
                amount: 164174.7, // adjusted to get exact closing balance
                balanceAfter: 481773.37,
                type: 'credit'
            },
            // 10 December
            {
                postDate: '2025-12-10',
                transactionDate: '2025-12-10',
                description: 'Transfer to Nedbank Savings Reserve Allocation',
                reference: 'INTTRF1210',
                authId: '771019',
                amount: -120000.0,
                fees: -1.0,
                balanceAfter: 361772.37,
                type: 'debit'
            },
            // 14 December
            {
                postDate: '2025-12-14',
                transactionDate: '2025-12-14',
                description: 'EFT Received Gauteng Education Dept IT Upgrade',
                reference: 'EFT984120',
                authId: '771020',
                amount: 165000.0,
                balanceAfter: 526772.37,
                type: 'credit'
            },
            // 15 December – SARS refund
            {
                postDate: '2025-12-15',
                transactionDate: '2025-12-15',
                description: 'SARS VAT Refund',
                reference: 'SARS1215',
                authId: '771021',
                amount: 21200.0,
                balanceAfter: 547972.37,
                type: 'credit'
            },
            // 16 December – Eskom payment
            {
                postDate: '2025-12-16',
                transactionDate: '2025-12-16',
                description: 'Payment to Eskom',
                reference: 'ESKOM1216',
                authId: '771022',
                amount: -12500.0,
                balanceAfter: 535472.37,
                type: 'debit'
            },
            // 17 December – City of Cape Town
            {
                postDate: '2025-12-17',
                transactionDate: '2025-12-17',
                description: 'Payment to City of Cape Town',
                reference: 'COCT1217',
                authId: '771023',
                amount: -8700.0,
                balanceAfter: 526772.37,
                type: 'debit'
            },
            // 18 December – AWS
            {
                postDate: '2025-12-18',
                transactionDate: '2025-12-18',
                description: 'Amazon Web Services EMEA Subscription',
                reference: 'AWSDEC25',
                authId: '771024',
                amount: -14490.0,
                balanceAfter: 512282.37,
                type: 'debit'
            },
            // 19 December – Vodacom payment
            {
                postDate: '2025-12-19',
                transactionDate: '2025-12-19',
                description: 'EFT Received Vodacom Payment',
                reference: 'VODA1219',
                authId: '771025',
                amount: 25000.0,
                balanceAfter: 537282.37,
                type: 'credit'
            },
            // 20 December – multiple transactions
            {
                postDate: '2025-12-20',
                transactionDate: '2025-12-20',
                description: 'Takealot MacBook Pro Purchase',
                reference: 'TAKE1220',
                authId: '771026',
                amount: -25000.0,
                balanceAfter: 512282.37,
                type: 'debit'
            },
            {
                postDate: '2025-12-20',
                transactionDate: '2025-12-20',
                description: 'Interest Earned Business Account',
                reference: 'INT122025',
                authId: '771027',
                amount: 10143.3,
                balanceAfter: 522425.67,
                type: 'credit'
            },
            {
                postDate: '2025-12-20',
                transactionDate: '2025-12-20',
                description: 'Immediate Payment Contractor Data Cabling',
                reference: 'IMMPAY1220',
                authId: '771028',
                amount: -10000.0,
                fees: -6.0,
                balanceAfter: 512419.67,
                type: 'debit'
            },
            {
                postDate: '2025-12-20',
                transactionDate: '2025-12-20',
                description: 'EFT Received FinTrust Bank Penetration Testing',
                reference: 'EFT984002',
                authId: '771029',
                amount: 110000.0,
                balanceAfter: 622419.67,
                type: 'credit'
            },
            {
                postDate: '2025-12-20',
                transactionDate: '2025-12-20',
                description: 'Business Payment to Equipment Logistics SA',
                reference: 'CBT1220',
                authId: '771030',
                amount: -5000.0,
                fees: -1.0,
                balanceAfter: 617418.67,
                type: 'debit'
            }
        ]
    },
    {
        account: {
            accountNumber: '1054814708',
            accountType: 'Capitec Business Account',
            businessName: 'FIRE-IT PTY LTD',
            statementDate: '2026-02-22',
            statementNumber: '00014',
            page: 1,
            totalPages: 1
        },
        balances: {
            openingBalance: 617418.67,
            closingBalance: 706999.34
        },
        address: {
            line1: '36 REGENCY DRIVE',
            line2: 'ROUTE 21 BUSINESS PARK',
            line3: 'CENTURION',
            province: 'GAUTENG',
            postalCode: '0178'
        },
        bankDetails: {
            branchCode: '450105',
            deviceCode: '9998',
            branch: 'Relationship Suite',
            telephone: phoneNumber,
            businessRegNo: '2012/173035/07',
            vatNo: '4680173723',
            interestRate: '22.1000%'
        },
        fees: {
            feeTotal: -165.0,
            vatTotal: -24.75,
            vatRate: '15.00%'
        },
        transactions: [
            // ==================== DECEMBER ====================
            // 21 Dec
            {
                postDate: '2025-12-21',
                transactionDate: '2025-12-21',
                description: 'EFT Received AfriHost Web Services',
                reference: 'AFH1221',
                authId: '772001',
                amount: 75000.0,
                balanceAfter: 692418.67,
                type: 'credit'
            },
            {
                postDate: '2025-12-21',
                transactionDate: '2025-12-21',
                description: 'Payment to Office National Stationery',
                reference: 'ONS1221',
                authId: '772002',
                amount: -3500.0,
                balanceAfter: 688918.67,
                type: 'debit'
            },
            {
                postDate: '2025-12-21',
                transactionDate: '2025-12-21',
                description: 'Immediate Payment Catering Services SA',
                reference: 'IMM1221A',
                authId: '772003',
                amount: -12000.0,
                fees: -6.0,
                balanceAfter: 676912.67,
                type: 'debit'
            },
            // 22 Dec
            {
                postDate: '2025-12-22',
                transactionDate: '2025-12-22',
                description: 'PayShapReceived Moyo Tech Solutions',
                reference: '*****023456** **',
                authId: '772004',
                amount: 42500.0,
                balanceAfter: 719412.67,
                type: 'credit'
            },
            {
                postDate: '2025-12-22',
                transactionDate: '2025-12-22',
                description: 'EFT Payment Incredible Connection',
                reference: 'INC1222',
                authId: '772005',
                amount: -28000.0,
                balanceAfter: 691412.67,
                type: 'debit'
            },
            // 23 Dec
            {
                postDate: '2025-12-23',
                transactionDate: '2025-12-23',
                description: 'Business Payment The Courier Guy',
                reference: 'TCG1223',
                authId: '772006',
                amount: -2800.0,
                fees: -1.0,
                balanceAfter: 688611.67,
                type: 'debit'
            },
            {
                postDate: '2025-12-23',
                transactionDate: '2025-12-23',
                description: 'PayShapReceived Lulaway Recruitment',
                reference: '*****034567** **',
                authId: '772007',
                amount: 18200.0,
                balanceAfter: 706811.67,
                type: 'credit'
            },
            // 24 Dec
            {
                postDate: '2025-12-24',
                transactionDate: '2025-12-24',
                description: 'EFT Received SAB KickStart',
                reference: 'SAB1224',
                authId: '772008',
                amount: 35000.0,
                balanceAfter: 741811.67,
                type: 'credit'
            },
            {
                postDate: '2025-12-24',
                transactionDate: '2025-12-24',
                description: 'Payment to Makro Business',
                reference: 'MAK1224',
                authId: '772009',
                amount: -15000.0,
                balanceAfter: 726811.67,
                type: 'debit'
            },
            // 28 Dec
            {
                postDate: '2025-12-28',
                transactionDate: '2025-12-28',
                description: 'EFT Received Gauteng Province',
                reference: 'GP1228',
                authId: '772010',
                amount: 250000.0,
                balanceAfter: 976811.67,
                type: 'credit'
            },
            {
                postDate: '2025-12-28',
                transactionDate: '2025-12-28',
                description: 'Immediate Payment DSV Logistics',
                reference: 'IMM1228',
                authId: '772011',
                amount: -45000.0,
                fees: -6.0,
                balanceAfter: 931805.67,
                type: 'debit'
            },
            // 29 Dec
            {
                postDate: '2025-12-29',
                transactionDate: '2025-12-29',
                description: 'Payment to Siemens SA',
                reference: 'SIE1229',
                authId: '772012',
                amount: -32000.0,
                balanceAfter: 899805.67,
                type: 'debit'
            },
            {
                postDate: '2025-12-29',
                transactionDate: '2025-12-29',
                description: 'PayShapReceived SovTech',
                reference: '*****045678** **',
                authId: '772013',
                amount: 22500.0,
                balanceAfter: 922305.67,
                type: 'credit'
            },
            // 30 Dec
            {
                postDate: '2025-12-30',
                transactionDate: '2025-12-30',
                description: 'EFT Payment MTN Business',
                reference: 'MTN1230',
                authId: '772014',
                amount: -12500.0,
                balanceAfter: 909805.67,
                type: 'debit'
            },
            {
                postDate: '2025-12-30',
                transactionDate: '2025-12-30',
                description: 'PayShapReceived Sanlam',
                reference: '*****056789** **',
                authId: '772015',
                amount: 15000.0,
                balanceAfter: 924805.67,
                type: 'credit'
            },
            // 31 Dec
            {
                postDate: '2025-12-31',
                transactionDate: '2025-12-31',
                description: '',
                reference: 'Monthly Service Fee',
                authId: '772016',
                amount: -100.0,
                balanceAfter: 924705.67,
                type: 'debit'
            },
            {
                postDate: '2025-12-31',
                transactionDate: '2025-12-31',
                description: '',
                reference: 'Notification Fee',
                authId: '772017',
                amount: -7.0,
                balanceAfter: 924698.67,
                type: 'debit'
            },
            {
                postDate: '2025-12-31',
                transactionDate: '2025-12-31',
                description: 'PayShapReceived DarkPools Ltd',
                reference: 'INT123125',
                authId: '772018',
                amount: 12345.67,
                balanceAfter: 937044.34,
                type: 'credit'
            },
            {
                postDate: '2025-12-31',
                transactionDate: '2025-12-31',
                description: 'Immediate Payment Saldanha Steel',
                reference: 'IMM1231A',
                authId: '772019',
                amount: -65000.0,
                fees: -6.0,
                balanceAfter: 872038.34,
                type: 'debit'
            },
            {
                postDate: '2025-12-31',
                transactionDate: '2025-12-31',
                description: 'EFT Received Transnet',
                reference: 'TRA1231',
                authId: '772020',
                amount: 180000.0,
                balanceAfter: 1052038.34,
                type: 'credit'
            },

            // ==================== JANUARY ====================
            // 1 Jan
            {
                postDate: '2026-01-01',
                transactionDate: '2026-01-01',
                description: 'Salary Payments Batch XERO',
                reference: 'SALARIES0101',
                authId: '772021',
                amount: -600000.0,
                balanceAfter: 452038.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-01',
                transactionDate: '2026-01-01',
                description: 'Office Rental Payment – MLC Group',
                reference: 'RENT0101',
                authId: '772022',
                amount: -45000.0,
                balanceAfter: 407038.34,
                type: 'debit'
            },
            // 2 Jan
            {
                postDate: '2026-01-02',
                transactionDate: '2026-01-02',
                description: 'EFT Received First National Bank',
                reference: 'FNB0102',
                authId: '772023',
                amount: 85000.0,
                balanceAfter: 492038.34,
                type: 'credit'
            },
            {
                postDate: '2026-01-02',
                transactionDate: '2026-01-02',
                description: 'Immediate Payment Waste Management Services',
                reference: 'IMM0102A',
                authId: '772024',
                amount: -18000.0,
                fees: -6.0,
                balanceAfter: 474032.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-02',
                transactionDate: '2026-01-02',
                description: 'PayShapReceived PwC SA',
                reference: '*****067890** **',
                authId: '772025',
                amount: 62500.0,
                balanceAfter: 536532.34,
                type: 'credit'
            },
            // 5 Jan
            {
                postDate: '2026-01-05',
                transactionDate: '2026-01-05',
                description: 'EFT Payment Microsoft SA',
                reference: 'MSFT0105',
                authId: '772026',
                amount: -22000.0,
                balanceAfter: 514532.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-05',
                transactionDate: '2026-01-05',
                description: 'PayShapReceived Old Mutual',
                reference: '*****078901** **',
                authId: '772027',
                amount: 30000.0,
                balanceAfter: 544532.34,
                type: 'credit'
            },
            {
                postDate: '2026-01-05',
                transactionDate: '2026-01-05',
                description: 'Payment to Barloworld Equipment',
                reference: 'BAR0105',
                authId: '772028',
                amount: -41000.0,
                fees: -1.0,
                balanceAfter: 503531.34,
                type: 'debit'
            },
            // 6 Jan
            {
                postDate: '2026-01-06',
                transactionDate: '2026-01-06',
                description: 'EFT Received Vodacom',
                reference: 'VOD0106',
                authId: '772029',
                amount: 95000.0,
                balanceAfter: 598531.34,
                type: 'credit'
            },
            {
                postDate: '2026-01-06',
                transactionDate: '2026-01-06',
                description: 'Immediate Payment Clicks Pharmacy',
                reference: 'IMM0106',
                authId: '772030',
                amount: -5600.0,
                fees: -6.0,
                balanceAfter: 592925.34,
                type: 'debit'
            },
            // 7 Jan
            {
                postDate: '2026-01-07',
                transactionDate: '2026-01-07',
                description: 'EFT Payment Telkom SA',
                reference: 'TEL0107',
                authId: '772031',
                amount: -8700.0,
                balanceAfter: 584225.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-07',
                transactionDate: '2026-01-07',
                description: 'PayShapReceived Nedbank',
                reference: '*****089012** **',
                authId: '772032',
                amount: 27300.0,
                balanceAfter: 611525.34,
                type: 'credit'
            },
            // 8 Jan
            {
                postDate: '2026-01-08',
                transactionDate: '2026-01-08',
                description: 'EFT Received Multichoice',
                reference: 'MCR0108',
                authId: '772033',
                amount: 12000.0,
                balanceAfter: 623525.34,
                type: 'credit'
            },
            {
                postDate: '2026-01-08',
                transactionDate: '2026-01-08',
                description: 'Payment to Afrox',
                reference: 'AFX0108',
                authId: '772034',
                amount: -3200.0,
                balanceAfter: 620325.34,
                type: 'debit'
            },
            // 9 Jan
            {
                postDate: '2026-01-09',
                transactionDate: '2026-01-09',
                description: 'Immediate Payment FedEx SA',
                reference: 'IMM0109',
                authId: '772035',
                amount: -14000.0,
                fees: -6.0,
                balanceAfter: 606319.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-09',
                transactionDate: '2026-01-09',
                description: 'PayShapReceived Santam',
                reference: '*****090123** **',
                authId: '772036',
                amount: 8900.0,
                balanceAfter: 615219.34,
                type: 'credit'
            },
            // 12 Jan
            {
                postDate: '2026-01-12',
                transactionDate: '2026-01-12',
                description: 'EFT Payment SARS VAT',
                reference: 'SARS0112',
                authId: '772037',
                amount: -110000.0,
                balanceAfter: 505219.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-12',
                transactionDate: '2026-01-12',
                description: 'EFT Received Gauteng Education Dept',
                reference: 'GED0112',
                authId: '772038',
                amount: 200000.0,
                balanceAfter: 705219.34,
                type: 'credit'
            },
            // 13 Jan
            {
                postDate: '2026-01-13',
                transactionDate: '2026-01-13',
                description: 'Payment to Bidvest',
                reference: 'BID0113',
                authId: '772039',
                amount: -33000.0,
                fees: -1.0,
                balanceAfter: 672218.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-13',
                transactionDate: '2026-01-13',
                description: 'PayShapReceived FNB',
                reference: '*****101234** **',
                authId: '772040',
                amount: 42000.0,
                balanceAfter: 714218.34,
                type: 'credit'
            },
            // 14 Jan
            {
                postDate: '2026-01-14',
                transactionDate: '2026-01-14',
                description: 'EFT Received ABSA',
                reference: 'ABS0114',
                authId: '772041',
                amount: 18500.0,
                balanceAfter: 732718.34,
                type: 'credit'
            },
            {
                postDate: '2026-01-14',
                transactionDate: '2026-01-14',
                description: 'Immediate Payment Rentokil',
                reference: 'IMM0114',
                authId: '772042',
                amount: -7500.0,
                fees: -6.0,
                balanceAfter: 725212.34,
                type: 'debit'
            },
            // 15 Jan
            {
                postDate: '2026-01-15',
                transactionDate: '2026-01-15',
                description: 'EFT Payment Imperial Logistics',
                reference: 'IMP0115',
                authId: '772043',
                amount: -27000.0,
                balanceAfter: 698212.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-15',
                transactionDate: '2026-01-15',
                description: 'PayShapReceived Capitec Bank',
                reference: '*****112345** **',
                authId: '772044',
                amount: 2300.0,
                balanceAfter: 700512.34,
                type: 'credit'
            },
            // 16 Jan
            {
                postDate: '2026-01-16',
                transactionDate: '2026-01-16',
                description: 'Payment to Spar',
                reference: 'SPA0116',
                authId: '772045',
                amount: -4500.0,
                balanceAfter: 696012.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-16',
                transactionDate: '2026-01-16',
                description: 'EFT Received Standard Bank',
                reference: 'STD0116',
                authId: '772046',
                amount: 34000.0,
                balanceAfter: 730012.34,
                type: 'credit'
            },
            // 19 Jan
            {
                postDate: '2026-01-19',
                transactionDate: '2026-01-19',
                description: 'Immediate Payment DHL SA',
                reference: 'IMM0119',
                authId: '772047',
                amount: -11000.0,
                fees: -6.0,
                balanceAfter: 719006.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-19',
                transactionDate: '2026-01-19',
                description: 'PayShapReceived Momentum',
                reference: '*****123456** **',
                authId: '772048',
                amount: 25000.0,
                balanceAfter: 744006.34,
                type: 'credit'
            },
            // 20 Jan
            {
                postDate: '2026-01-20',
                transactionDate: '2026-01-20',
                description: 'EFT Payment SAB',
                reference: 'SAB0120',
                authId: '772049',
                amount: -62000.0,
                balanceAfter: 682006.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-20',
                transactionDate: '2026-01-20',
                description: 'EFT Received Mazars',
                reference: 'MAZ0120',
                authId: '772050',
                amount: 41500.0,
                balanceAfter: 723506.34,
                type: 'credit'
            },
            {
                postDate: '2026-01-20',
                transactionDate: '2026-01-20',
                description: 'Immediate Payment AfriSam',
                reference: 'IMM0120',
                authId: '772051',
                amount: -23000.0,
                fees: -6.0,
                balanceAfter: 700500.34,
                type: 'debit'
            },
            // 21 Jan
            {
                postDate: '2026-01-21',
                transactionDate: '2026-01-21',
                description: "PayShapReceived Nando's",
                reference: '*****134567** **',
                authId: '772052',
                amount: 15000.0,
                balanceAfter: 715500.34,
                type: 'credit'
            },
            {
                postDate: '2026-01-21',
                transactionDate: '2026-01-21',
                description: 'Payment to City Lodge',
                reference: 'CLO0121',
                authId: '772053',
                amount: -8500.0,
                fees: -1.0,
                balanceAfter: 706999.34,
                type: 'debit'
            }
        ]
    },
    {
        account: {
            accountNumber: '1054814708',
            accountType: 'Capitec Business Account',
            businessName: 'FIRE-IT PTY LTD',
            statementDate: '2026-03-05', // updated
            statementNumber: '00016', // updated
            page: 1,
            totalPages: 1
        },
        balances: {
            openingBalance: 706999.34, // unchanged (original opening)
            closingBalance: 2094999.93 // new closing
        },
        address: {
            line1: '36 REGENCY DRIVE',
            line2: 'ROUTE 21 BUSINESS PARK',
            line3: 'CENTURION',
            province: 'GAUTENG',
            postalCode: '0178'
        },
        bankDetails: {
            branchCode: '450105',
            deviceCode: '9998',
            branch: 'Relationship Suite',
            telephone: '0113020300',
            businessRegNo: '2012/173035/07',
            vatNo: '4680173723',
            interestRate: '22.1000%'
        },
        fees: {
            feeTotal: -339.0, // original -212 + new fees -127 = -339
            vatTotal: -50.85, // 15% of 339
            vatRate: '15.00%'
        },
        transactions: [
            // ==================== JANUARY (22–31) ====================
            {
                postDate: '2026-01-22',
                transactionDate: '2026-01-22',
                description: 'EFT Received City of Cape Town',
                reference: 'CCT0122',
                authId: '773001',
                amount: 280000.0,
                balanceAfter: 986999.34,
                type: 'credit'
            },
            {
                postDate: '2026-01-22',
                transactionDate: '2026-01-22',
                description: 'Immediate Payment Barloworld Logistics',
                reference: 'IMM0122A',
                authId: '773002',
                amount: -42000.0,
                fees: -6.0,
                balanceAfter: 944993.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-22',
                transactionDate: '2026-01-22',
                description: 'PayShapReceived Santam Insurance',
                reference: '*****145678** **',
                authId: '773003',
                amount: 35000.0,
                balanceAfter: 979993.34,
                type: 'credit'
            },
            {
                postDate: '2026-01-23',
                transactionDate: '2026-01-23',
                description: 'EFT Payment Vodacom Business',
                reference: 'VOD0123',
                authId: '773004',
                amount: -18700.0,
                balanceAfter: 961293.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-23',
                transactionDate: '2026-01-23',
                description: 'PayShapReceived AfriSam',
                reference: '*****156789** **',
                authId: '773005',
                amount: 62000.0,
                balanceAfter: 1023293.34,
                type: 'credit'
            },
            {
                postDate: '2026-01-24',
                transactionDate: '2026-01-24',
                description: 'Business Payment to Imperial Logistics',
                reference: 'IMP0124',
                authId: '773006',
                amount: -31500.0,
                fees: -1.0,
                balanceAfter: 991792.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-24',
                transactionDate: '2026-01-24',
                description: 'EFT Received Transnet Freight',
                reference: 'TRA0124',
                authId: '773007',
                amount: 145000.0,
                balanceAfter: 1136792.34,
                type: 'credit'
            },
            {
                postDate: '2026-01-26',
                transactionDate: '2026-01-26',
                description: 'Payment to Eskom',
                reference: 'ESK0126',
                authId: '773008',
                amount: -28000.0,
                balanceAfter: 1108792.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-26',
                transactionDate: '2026-01-26',
                description: 'PayShapReceived Sasol',
                reference: '*****167890** **',
                authId: '773009',
                amount: 87500.0,
                balanceAfter: 1196292.34,
                type: 'credit'
            },
            {
                postDate: '2026-01-27',
                transactionDate: '2026-01-27',
                description: 'Immediate Payment Bidvest Security',
                reference: 'IMM0127',
                authId: '773010',
                amount: -23000.0,
                fees: -6.0,
                balanceAfter: 1173286.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-28',
                transactionDate: '2026-01-28',
                description: 'EFT Received Gauteng Health Dept',
                reference: 'GHD0128',
                authId: '773011',
                amount: 390000.0,
                balanceAfter: 1563286.34,
                type: 'credit'
            },
            {
                postDate: '2026-01-28',
                transactionDate: '2026-01-28',
                description: 'Payment to SARS (PAYE)',
                reference: 'SARS0128',
                authId: '773012',
                amount: -215000.0,
                balanceAfter: 1348286.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-29',
                transactionDate: '2026-01-29',
                description: 'PayShapReceived Murray & Roberts',
                reference: '*****178901** **',
                authId: '773013',
                amount: 110000.0,
                balanceAfter: 1458286.34,
                type: 'credit'
            },
            {
                postDate: '2026-01-30',
                transactionDate: '2026-01-30',
                description: 'Bank Charges',
                reference: 'Monthly Service Fee',
                authId: '773014',
                amount: -100.0,
                balanceAfter: 1458186.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-30',
                transactionDate: '2026-01-30',
                description: 'Bank Charges',
                reference: 'Notification Fee',
                authId: '773015',
                amount: -7.0,
                balanceAfter: 1458179.34,
                type: 'debit'
            },
            {
                postDate: '2026-01-31',
                transactionDate: '2026-01-31',
                description: 'Interest Earned Business Account',
                reference: 'INT013126',
                authId: '773016',
                amount: 15220.66,
                balanceAfter: 1473400.0,
                type: 'credit'
            },

            // ==================== FEBRUARY ====================
            // 1 Feb – salary & rent
            {
                postDate: '2026-02-01',
                transactionDate: '2026-02-01',
                description: 'Salary Payments Batch XERO',
                reference: 'SALARIES0201',
                authId: '773017',
                amount: -600000.0,
                balanceAfter: 873400.0,
                type: 'debit'
            },
            {
                postDate: '2026-02-01',
                transactionDate: '2026-02-01',
                description: 'Office Rental Payment – MLC Group',
                reference: 'RENT0201',
                authId: '773018',
                amount: -45000.0,
                balanceAfter: 828400.0,
                type: 'debit'
            },
            // 2 Feb
            {
                postDate: '2026-02-02',
                transactionDate: '2026-02-02',
                description: 'EFT Received ABSA',
                reference: 'ABS0202',
                authId: '773019',
                amount: 320000.0,
                balanceAfter: 1148400.0,
                type: 'credit'
            },
            {
                postDate: '2026-02-02',
                transactionDate: '2026-02-02',
                description: 'Immediate Payment Dimension Data',
                reference: 'IMM0202A',
                authId: '773020',
                amount: -85000.0,
                fees: -6.0,
                balanceAfter: 1063394.0,
                type: 'debit'
            },
            {
                postDate: '2026-02-02',
                transactionDate: '2026-02-02',
                description: 'PayShapReceived WBHO',
                reference: '*****189012** **',
                authId: '773021',
                amount: 95000.0,
                balanceAfter: 1158394.0,
                type: 'credit'
            },
            // 3 Feb
            {
                postDate: '2026-02-03',
                transactionDate: '2026-02-03',
                description: 'EFT Payment MTN',
                reference: 'MTN0203',
                authId: '773022',
                amount: -32500.0,
                balanceAfter: 1125894.0,
                type: 'debit'
            },
            {
                postDate: '2026-02-03',
                transactionDate: '2026-02-03',
                description: 'PayShapReceived RCL Foods',
                reference: '*****190123** **',
                authId: '773023',
                amount: 43000.0,
                balanceAfter: 1168894.0,
                type: 'credit'
            },
            // 4 Feb
            {
                postDate: '2026-02-04',
                transactionDate: '2026-02-04',
                description: 'Business Payment to Shoprite Checkers',
                reference: 'SHP0204',
                authId: '773024',
                amount: -22000.0,
                fees: -1.0,
                balanceAfter: 1146893.0,
                type: 'debit'
            },
            {
                postDate: '2026-02-04',
                transactionDate: '2026-02-04',
                description: 'EFT Received Standard Bank',
                reference: 'STD0204',
                authId: '773025',
                amount: 67000.0,
                balanceAfter: 1213893.0,
                type: 'credit'
            },
            // 5 Feb
            {
                postDate: '2026-02-05',
                transactionDate: '2026-02-05',
                description: 'Immediate Payment Tsebo Solutions',
                reference: 'IMM0205',
                authId: '773026',
                amount: -38000.0,
                fees: -6.0,
                balanceAfter: 1175887.0,
                type: 'debit'
            },
            {
                postDate: '2026-02-05',
                transactionDate: '2026-02-05',
                description: 'PayShapReceived Investec',
                reference: '*****201234** **',
                authId: '773027',
                amount: 52000.0,
                balanceAfter: 1227887.0,
                type: 'credit'
            },
            // 6 Feb
            {
                postDate: '2026-02-06',
                transactionDate: '2026-02-06',
                description: 'EFT Payment City Power',
                reference: 'CPW0206',
                authId: '773028',
                amount: -17000.0,
                balanceAfter: 1210887.0,
                type: 'debit'
            },
            {
                postDate: '2026-02-06',
                transactionDate: '2026-02-06',
                description: 'PayShapReceived Aveng',
                reference: '*****212345** **',
                authId: '773029',
                amount: 29000.0,
                balanceAfter: 1239887.0,
                type: 'credit'
            },
            // 9 Feb
            {
                postDate: '2026-02-09',
                transactionDate: '2026-02-09',
                description: 'EFT Received Discovery',
                reference: 'DIS0209',
                authId: '773030',
                amount: 150000.0,
                balanceAfter: 1389887.0,
                type: 'credit'
            },
            {
                postDate: '2026-02-09',
                transactionDate: '2026-02-09',
                description: 'Immediate Payment Basil Read',
                reference: 'IMM0209',
                authId: '773031',
                amount: -63000.0,
                fees: -6.0,
                balanceAfter: 1326881.0,
                type: 'debit'
            },
            // 10 Feb
            {
                postDate: '2026-02-10',
                transactionDate: '2026-02-10',
                description: 'Payment to Telkom',
                reference: 'TEL0210',
                authId: '773032',
                amount: -29000.0,
                balanceAfter: 1297881.0,
                type: 'debit'
            },
            {
                postDate: '2026-02-10',
                transactionDate: '2026-02-10',
                description: 'PayShapReceived PPC Cement',
                reference: '*****223456** **',
                authId: '773033',
                amount: 47000.0,
                balanceAfter: 1344881.0,
                type: 'credit'
            },
            // 11 Feb
            {
                postDate: '2026-02-11',
                transactionDate: '2026-02-11',
                description: 'EFT Payment SARS VAT',
                reference: 'SARS0211',
                authId: '773034',
                amount: -295000.0,
                balanceAfter: 1049881.0,
                type: 'debit'
            },
            {
                postDate: '2026-02-11',
                transactionDate: '2026-02-11',
                description: 'PayShapReceived Sanlam',
                reference: '*****234567** **',
                authId: '773035',
                amount: 62000.0,
                balanceAfter: 1111881.0,
                type: 'credit'
            },
            // 12 Feb
            {
                postDate: '2026-02-12',
                transactionDate: '2026-02-12',
                description: 'Immediate Payment Grindrod',
                reference: 'IMM0212',
                authId: '773036',
                amount: -34000.0,
                fees: -6.0,
                balanceAfter: 1077875.0,
                type: 'debit'
            },
            {
                postDate: '2026-02-12',
                transactionDate: '2026-02-12',
                description: 'EFT Received Liberty',
                reference: 'LIB0212',
                authId: '773037',
                amount: 88000.0,
                balanceAfter: 1165875.0,
                type: 'credit'
            },
            // 13 Feb
            {
                postDate: '2026-02-13',
                transactionDate: '2026-02-13',
                description: 'Payment to MultiChoice',
                reference: 'MCR0213',
                authId: '773038',
                amount: -12000.0,
                balanceAfter: 1153875.0,
                type: 'debit'
            },
            {
                postDate: '2026-02-13',
                transactionDate: '2026-02-13',
                description: 'PayShapReceived Old Mutual',
                reference: '*****245678** **',
                authId: '773039',
                amount: 19000.0,
                balanceAfter: 1172875.0,
                type: 'credit'
            },
            // 16 Feb
            {
                postDate: '2026-02-16',
                transactionDate: '2026-02-16',
                description: 'EFT Received Nedbank',
                reference: 'NED0216',
                authId: '773040',
                amount: 410000.0,
                balanceAfter: 1582875.0,
                type: 'credit'
            },
            {
                postDate: '2026-02-16',
                transactionDate: '2026-02-16',
                description: 'Immediate Payment Afrox',
                reference: 'IMM0216',
                authId: '773041',
                amount: -19000.0,
                fees: -6.0,
                balanceAfter: 1563870.0,
                type: 'debit'
            },
            // 17 Feb
            {
                postDate: '2026-02-17',
                transactionDate: '2026-02-17',
                description: 'Business Payment to Engen',
                reference: 'ENG0217',
                authId: '773042',
                amount: -46000.0,
                fees: -1.0,
                balanceAfter: 1517869.0,
                type: 'debit'
            },
            {
                postDate: '2026-02-17',
                transactionDate: '2026-02-17',
                description: 'PayShapReceived Capitec',
                reference: '*****256789** **',
                authId: '773043',
                amount: 12000.0,
                balanceAfter: 1529869.0,
                type: 'credit'
            },
            // 18 Feb
            {
                postDate: '2026-02-18',
                transactionDate: '2026-02-18',
                description: 'EFT Payment DHL',
                reference: 'DHL0218',
                authId: '773044',
                amount: -21000.0,
                balanceAfter: 1508869.0,
                type: 'debit'
            },
            {
                postDate: '2026-02-18',
                transactionDate: '2026-02-18',
                description: 'PayShapReceived Momentum',
                reference: '*****267890** **',
                authId: '773045',
                amount: 43000.0,
                balanceAfter: 1551869.0,
                type: 'credit'
            },
            // 19 Feb
            {
                postDate: '2026-02-19',
                transactionDate: '2026-02-19',
                description: 'Immediate Payment Grindrod',
                reference: 'IMM0219',
                authId: '773046',
                amount: -28000.0,
                fees: -6.0,
                balanceAfter: 1523863.0,
                type: 'debit'
            },
            {
                postDate: '2026-02-19',
                transactionDate: '2026-02-19',
                description: 'EFT Received FNB',
                reference: 'FNB0219',
                authId: '773047',
                amount: 150000.0,
                balanceAfter: 1673863.0,
                type: 'credit'
            },
            // 20 Feb
            {
                postDate: '2026-02-20',
                transactionDate: '2026-02-20',
                description: 'Payment to Amazon Web Services',
                reference: 'AWS0220',
                authId: '773048',
                amount: -33000.0,
                balanceAfter: 1640863.0,
                type: 'debit'
            },
            {
                postDate: '2026-02-20',
                transactionDate: '2026-02-20',
                description: 'PayShapReceived Discovery',
                reference: '*****278901** **',
                authId: '773049',
                amount: 28000.0,
                balanceAfter: 1668863.0,
                type: 'credit'
            },
            // 21 Feb
            {
                postDate: '2026-02-21',
                transactionDate: '2026-02-21',
                description: 'EFT Payment Sasol',
                reference: 'SAS0221',
                authId: '773050',
                amount: -44000.0,
                balanceAfter: 1624863.0,
                type: 'debit'
            },
            {
                postDate: '2026-02-21',
                transactionDate: '2026-02-21',
                description: 'PayShapReceived Investec',
                reference: '*****289012** **',
                authId: '773051',
                amount: 59000.0,
                balanceAfter: 1683863.0,
                type: 'credit'
            },
            // 22 Feb
            {
                postDate: '2026-02-22',
                transactionDate: '2026-02-22',
                description: 'Interest Earned Business Account',
                reference: 'INT022226',
                authId: '773052',
                amount: 21431.42,
                balanceAfter: 1705294.42,
                type: 'credit'
            },
            {
                postDate: '2026-02-22',
                transactionDate: '2026-02-22',
                description: 'Bank Charges',
                reference: 'Monthly Service Fee',
                authId: '773053',
                amount: -100.0,
                balanceAfter: 1705194.42,
                type: 'debit'
            },
            {
                postDate: '2026-02-22',
                transactionDate: '2026-02-22',
                description: 'Bank Charges',
                reference: 'Notification Fee',
                authId: '773054',
                amount: -7.0,
                balanceAfter: 1705187.42,
                type: 'debit'
            },
            {
                postDate: '2026-02-22',
                transactionDate: '2026-02-22',
                description: 'EFT Payment Incredible Solutions',
                reference: 'INCS0222',
                authId: '773055',
                amount: -697893.0,
                fees: -1.0,
                balanceAfter: 1007294.42,
                type: 'debit'
            },
            // ==================== NEW TRANSACTIONS: 23 FEB – 5 MAR ====================
            // 23 Feb
            {
                postDate: '2026-02-23',
                transactionDate: '2026-02-23',
                description: 'EFT Received Transnet Freight',
                reference: 'TRA0223',
                authId: '774001',
                amount: 250000.0,
                balanceAfter: 1257294.42,
                type: 'credit'
            },
            {
                postDate: '2026-02-23',
                transactionDate: '2026-02-23',
                description: 'PayShapReceived Sasol',
                reference: '*****301234** **',
                authId: '774002',
                amount: 180000.0,
                balanceAfter: 1437294.42,
                type: 'credit'
            },
            {
                postDate: '2026-02-23',
                transactionDate: '2026-02-23',
                description: 'Immediate Payment Grindrod',
                reference: 'IMM0223',
                authId: '774003',
                amount: -45000.0,
                fees: -6.0,
                balanceAfter: 1392288.42,
                type: 'debit'
            },
            // 24 Feb
            {
                postDate: '2026-02-24',
                transactionDate: '2026-02-24',
                description: 'EFT Received ABSA',
                reference: 'ABS0224',
                authId: '774004',
                amount: 190000.0,
                balanceAfter: 1582288.42,
                type: 'credit'
            },
            {
                postDate: '2026-02-24',
                transactionDate: '2026-02-24',
                description: 'PayShapReceived Old Mutual',
                reference: '*****312345** **',
                authId: '774005',
                amount: 135000.0,
                balanceAfter: 1717288.42,
                type: 'credit'
            },
            // 25 Feb
            {
                postDate: '2026-02-25',
                transactionDate: '2026-02-25',
                description: 'EFT Received Standard Bank',
                reference: 'STD0225',
                authId: '774006',
                amount: 220000.0,
                balanceAfter: 1937288.42,
                type: 'credit'
            },
            {
                postDate: '2026-02-25',
                transactionDate: '2026-02-25',
                description: 'Business Payment to Bidvest',
                reference: 'BID0225',
                authId: '774007',
                amount: -38000.0,
                fees: -1.0,
                balanceAfter: 1899287.42,
                type: 'debit'
            },
            // 26 Feb
            {
                postDate: '2026-02-26',
                transactionDate: '2026-02-26',
                description: 'PayShapReceived Discovery',
                reference: '*****323456** **',
                authId: '774008',
                amount: 125000.0,
                balanceAfter: 2024287.42,
                type: 'credit'
            },
            {
                postDate: '2026-02-26',
                transactionDate: '2026-02-26',
                description: 'EFT Payment Telkom',
                reference: 'TEL0226',
                authId: '774009',
                amount: -18000.0,
                balanceAfter: 2006287.42,
                type: 'debit'
            },
            // 27 Feb
            {
                postDate: '2026-02-27',
                transactionDate: '2026-02-27',
                description: 'EFT Received Gauteng Province',
                reference: 'GP0227',
                authId: '774010',
                amount: 240000.0,
                balanceAfter: 2246287.42,
                type: 'credit'
            },
            {
                postDate: '2026-02-27',
                transactionDate: '2026-02-27',
                description: 'Immediate Payment Afrox',
                reference: 'IMM0227',
                authId: '774011',
                amount: -27000.0,
                fees: -6.0,
                balanceAfter: 2219281.42,
                type: 'debit'
            },
            // 28 Feb
            {
                postDate: '2026-02-28',
                transactionDate: '2026-02-28',
                description: 'Bank Charges',
                reference: 'Monthly Service Fee',
                authId: '774012',
                amount: -100.0,
                balanceAfter: 2219181.42,
                type: 'debit'
            },
            {
                postDate: '2026-02-28',
                transactionDate: '2026-02-28',
                description: 'Bank Charges',
                reference: 'Notification Fee',
                authId: '774013',
                amount: -7.0,
                balanceAfter: 2219174.42,
                type: 'debit'
            },
            // 1 Mar – salary & rent
            {
                postDate: '2026-03-01',
                transactionDate: '2026-03-01',
                description: 'Salary Payments Batch XERO',
                reference: 'SALARIES0301',
                authId: '774014',
                amount: -600000.0,
                balanceAfter: 1619174.42,
                type: 'debit'
            },
            {
                postDate: '2026-03-01',
                transactionDate: '2026-03-01',
                description: 'Office Rental Payment – MLC Group',
                reference: 'RENT0301',
                authId: '774015',
                amount: -45000.0,
                balanceAfter: 1574174.42,
                type: 'debit'
            },
            // 2 Mar
            {
                postDate: '2026-03-02',
                transactionDate: '2026-03-02',
                description: 'EFT Received FNB',
                reference: 'FNB0302',
                authId: '774016',
                amount: 300000.0,
                balanceAfter: 1874174.42,
                type: 'credit'
            },
            {
                postDate: '2026-03-02',
                transactionDate: '2026-03-02',
                description: 'PayShapReceived Momentum',
                reference: '*****334567** **',
                authId: '774017',
                amount: 165000.0,
                balanceAfter: 2039174.42,
                type: 'credit'
            },
            // 3 Mar
            {
                postDate: '2026-03-03',
                transactionDate: '2026-03-03',
                description: 'EFT Received Nedbank',
                reference: 'NED0303',
                authId: '774018',
                amount: 210000.0,
                balanceAfter: 2249174.42,
                type: 'credit'
            },
            {
                postDate: '2026-03-03',
                transactionDate: '2026-03-03',
                description: 'Immediate Payment Basil Read',
                reference: 'IMM0303',
                authId: '774019',
                amount: -49000.0,
                fees: -6.0,
                balanceAfter: 2200168.42,
                type: 'debit'
            },
            // 4 Mar
            {
                postDate: '2026-03-04',
                transactionDate: '2026-03-04',
                description: 'PayShapReceived Sanlam',
                reference: '*****345678** **',
                authId: '774020',
                amount: 140000.0,
                balanceAfter: 2340168.42,
                type: 'credit'
            },
            {
                postDate: '2026-03-04',
                transactionDate: '2026-03-04',
                description: 'Business Payment to Engen',
                reference: 'ENG0304',
                authId: '774021',
                amount: -38000.0,
                fees: -1.0,
                balanceAfter: 2302167.42,
                type: 'debit'
            },
            // 5 Mar – final payment for services/products
            {
                postDate: '2026-03-05',
                transactionDate: '2026-03-05',
                description: 'Payment to MultiChoice Africa',
                reference: 'MCA0305',
                authId: '774022',
                amount: -207167.49,
                balanceAfter: 2094999.93,
                type: 'debit'
            }
        ]
    }
];
