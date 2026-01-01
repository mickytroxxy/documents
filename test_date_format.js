// Test the updated date format
function testDateFormat() {
    console.log('Testing updated date format');

    // Simulate the updated formatDate function
    const formatDate = (date) => {
        const d = date.getDate();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const m = monthNames[date.getMonth()];
        const y = date.getFullYear();
        return `${d} ${m} ${y}`;
    };

    const today = new Date('2026-01-01');
    const statementDate = formatDate(today);
    const expectedFormat = '1 January 2026';

    console.log('Current date:', today.toISOString().split('T')[0]);
    console.log('Statement date:', statementDate);
    console.log('Expected format:', expectedFormat);
    console.log('Match:', statementDate === expectedFormat ? '✓' : '❌');

    // Test a few more dates
    const testDates = [new Date('2026-02-15'), new Date('2026-12-31'), new Date('2025-11-03')];

    console.log('\nAdditional date tests:');
    testDates.forEach((date) => {
        const formatted = formatDate(date);
        console.log(`  ${date.toISOString().split('T')[0]} -> ${formatted}`);
    });
}

testDateFormat();
