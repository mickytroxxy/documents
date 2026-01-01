// Test the new statement period naming format - FIXED
function testNamingFormat() {
    console.log('Testing new statement period naming format');

    // Simulate the parsePeriodDate function - FIXED
    const parsePeriodDate = (dateStr) => {
        const parts = dateStr.split(' ');
        if (parts.length < 3) {
            console.error('Invalid date format:', dateStr);
            return '00_JAN';
        }
        const day = parts[0].padStart(2, '0');
        const month = parts[1].toUpperCase();
        return `${day}_${month}`;
    };

    // Test with sample statement periods
    const testPeriods = ['02 October 2025 to 01 November 2025', '03 November 2025 to 02 December 2025', '02 December 2025 to 01 January 2026'];

    testPeriods.forEach((period) => {
        const periodFrom = parsePeriodDate(period.split(' to ')[0]);
        const periodTo = parsePeriodDate(period.split(' to ')[1].split(' ')[0]);
        const year = period.split(' ').pop();

        const fileName = `fnb_statement_${periodFrom}_${periodTo}_${year}.pdf`;
        console.log(`Period: ${period}`);
        console.log(`Filename: ${fileName}`);
        console.log('');
    });

    // Test the expected format
    const expectedFormat = '02_OCT_02_NOV_2025';
    const testPeriod = '02 October 2025 to 01 November 2025';
    const periodFrom = parsePeriodDate(testPeriod.split(' to ')[0]);
    const periodTo = parsePeriodDate(testPeriod.split(' to ')[1].split(' ')[0]);
    const year = testPeriod.split(' ').pop();
    const fileName = `fnb_statement_${periodFrom}_${periodTo}_${year}.pdf`;

    console.log('Expected format test:');
    console.log(`Expected: fnb_statement_${expectedFormat}.pdf`);
    console.log(`Actual: ${fileName}`);
    console.log(`Match: ${fileName === `fnb_statement_${expectedFormat}.pdf` ? '✓' : '❌'}`);
}

testNamingFormat();
