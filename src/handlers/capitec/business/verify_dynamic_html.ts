import { generateTestHtml } from './test';
import { BankStatement } from './business_sample';

const mockData: BankStatement = {
    account: {
        accountNumber: 'TEST_ACC_123',
        accountType: 'TEST_TYPE',
        businessName: 'TEST_BUSINESS_NAME',
        statementDate: '2099-12-31',
        statementNumber: '99999',
        page: 1,
        totalPages: 5
    },
    balances: {
        openingBalance: 12345.67,
        closingBalance: 67890.12
    },
    address: {
        line1: 'TEST_LINE_1',
        line2: 'TEST_LINE_2',
        line3: 'TEST_LINE_3',
        province: 'TEST_PROVINCE',
        postalCode: '9999'
    },
    bankDetails: {
        branch: 'TEST_BRANCH',
        telephone: '000 000 0000',
        businessRegNo: 'TEST_REG_NO',
        vatNo: 'TEST_VAT_NO',
        interestRate: '99.99%',
        overdraftInfo: 'TEST_OD_INFO'
    },
    fees: {
        feeTotal: -100.0,
        vatTotal: -15.0,
        vatRate: '15%'
    },
    transactions: [
        {
            postDate: '2099-01-01',
            transactionDate: '2099-01-01',
            description: 'TEST_TRANSACTION_1',
            reference: 'REF_1',
            amount: 1000.0,
            balanceAfter: 13345.67,
            type: 'credit'
        },
        {
            postDate: '2099-01-02',
            transactionDate: '2099-01-02',
            description: 'TEST_TRANSACTION_2',
            reference: 'REF_2',
            amount: -500.0,
            balanceAfter: 12845.67,
            type: 'debit'
        }
    ]
};

async function verify() {
    console.log('Generating HTML with mock data...');
    const html = await generateTestHtml(mockData);

    const hardcodedStrings = [
        'FIRE-IT PTY LTD',
        '1054814708',
        '36 REGENCY DRIVE',
        'CENTURION',
        'GAUTENG',
        'Relationship Suite',
        // '011 3020300', // This format might change, usually phone is variable
        '4680173723',
        '22.1000%',
        'Client Payment: Website Development Project', // From sample
        '03/10/25', // Hardcoded date in `test.ts`
        '30/09/25' // Hardcoded date
    ];

    const missingDynamicStrings = [
        'TEST_ACC_123',
        'TEST_BUSINESS_NAME',
        'TEST_LINE_1',
        'TEST_BRANCH',
        'TEST_TRANSACTION_1'
        // '01/01/99' // Date format check (DD/MM/YY)
    ];

    let errors = 0;

    console.log('Checking for Hardcoded Strings (Should NOT be present):');
    hardcodedStrings.forEach((str) => {
        if (html.includes(str)) {
            console.error(`[FAIL] Found hardcoded string: "${str}"`);
            errors++;
        } else {
            console.log(`[PASS] Hardcoded string not found: "${str}"`);
        }
    });

    console.log('\nChecking for Dynamic Strings (SHOULD be present):');
    missingDynamicStrings.forEach((str) => {
        if (!html.includes(str)) {
            console.error(`[FAIL] Missing dynamic string: "${str}"`);
            errors++;
        } else {
            console.log(`[PASS] Found dynamic string: "${str}"`);
        }
    });

    if (errors > 0) {
        console.error(`\nverification FAILED with ${errors} errors.`);
        throw new Error('Verification Failed');
    } else {
        console.log('\nVerification PASSED!');
    }
}

verify().catch((err) => {
    console.error(err);
    throw err;
});
