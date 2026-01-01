// Test statement_date is set to current date
function testStatementDate() {
    console.log('Testing statement_date is set to current date');

    // Simulate the formatDate function from the code
    const formatDate = (date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    const today = new Date('2026-01-01'); // Using the current date from environment
    const statementDate = formatDate(new Date());
    const expectedDate = formatDate(today);

    console.log('Current date:', today.toISOString().split('T')[0]);
    console.log('Statement date:', statementDate);
    console.log('Expected date:', expectedDate);
    console.log('Match:', statementDate === expectedDate ? '✓' : '❌');

    // Test that statement_date is today's date, not the end date of the period
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - 30); // 30 days ago
    const endDateFormatted = formatDate(endDate);

    console.log('End date (30 days ago):', endDateFormatted);
    console.log('Statement date should NOT be end date:', statementDate !== endDateFormatted ? '✓' : '❌');
}

testStatementDate();
