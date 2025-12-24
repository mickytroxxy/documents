// Test script for statement balancer
const { rebalanceStatement } = require('./src/helpers/statementBalancer');

// Mock data for testing
const mockData = {
    statementPeriod: {
        from: '01 Jan 2023',
        to: '31 Dec 2023'
    },
    transactions: [
        {
            date: '05 Jan 2023',
            mainDescription: 'SALARY DEPOSIT',
            subDescription: 'PAYMENT FROM EMPLOYER',
            deposit: '5000.00',
            payment: '',
            balance: '5000.00'
        },
        {
            date: '10 Jan 2023',
            mainDescription: 'GROCERIES',
            subDescription: 'DEBIT CARD PURCHASE FROM',
            deposit: '',
            payment: '800.00',
            balance: '4200.00'
        },
        {
            date: '15 Jan 2023',
            mainDescription: 'RENT PAYMENT',
            subDescription: 'PAYMENT TO LANDLORD',
            deposit: '',
            payment: '2000.00',
            balance: '2200.00'
        }
    ],
    summary: {
        totalDeposits: '5000.00',
        totalPayments: '2800.00',
        availableBalance: '2200.00'
    }
};

console.log('Testing statement balancer with target balance of 10000...');

const result = rebalanceStatement(mockData, 10000, 0);

console.log('Final available balance:', result.summary.availableBalance);
console.log('Target balance: 10000.00');
console.log('Difference:', Math.abs(parseFloat(result.summary.availableBalance.replace(/,/g, '')) - 10000).toFixed(2));
console.log('Total transactions:', result.transactions.length);
console.log('Success:', Math.abs(parseFloat(result.summary.availableBalance.replace(/,/g, '')) - 10000) < 0.01);
