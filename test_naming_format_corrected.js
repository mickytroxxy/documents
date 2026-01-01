// Test the new statement period naming format - CORRECTED
function testNamingFormat() {
    console.log('Testing new statement period naming format - CORRECTED');

    // Simulate the parsePeriodDate function - CORRECTED
    const parsePeriodDate = (dateStr) => {
        const parts = dateStr.split(' ');
        if (parts.length < 3) {
            // Handle partial date strings (like "01" from "01 November")
            const day = parts[0].padStart(2, '0');
            return `${day}_JAN`; // Default month if parsing fails
        }
        const day = parts[0].padStart(2, '0');
        const month = parts[1].toUpperCase().substring(0, 3); // Use 3-letter month abbreviation
        return `${day}_${month}`;
    };

    // Test with sample statement periods
    const testPeriods = ['02 October 2025 to 01 November 2025', '03 November 2025 to 02 December 2025', '02 December 2025 to 01 January 2026'];

    testPeriods.forEach((period) => {
        const periodParts = period.split(' to ');
        const periodFrom = parsePeriodDate(periodParts[0]);
        const periodTo = parsePeriodDate(periodParts[1]);
        const year = periodParts[1].split(' ').pop();

        const fileName = `fnb_statement_${periodFrom}_${periodTo}_${year}.pdf`;
        console.log(`Period: ${period}`);
        console.log(`Filename: ${fileName}`);
        console.log('');
    });

    // Test the expected format
    const expectedFormat = '02_OCT_01_NOV_2025';
    const testPeriod = '02 October 2025 to 01 November 2025';
    const periodParts = testPeriod.split(' to ');
    const periodFrom = parsePeriodDate(periodParts[0]);
    const periodTo = parsePeriodDate(periodParts[1]);
    const year = periodParts[1].split(' ').pop();
    const fileName = `fnb_statement_${periodFrom}_${periodTo}_${year}.pdf`;

    console.log('Expected format test:');
    console.log(`Expected: fnb_statement_${expectedFormat}.pdf`);
    console.log(`Actual: ${fileName}`);
    console.log(`Match: ${fileName === `fnb_statement_${expectedFormat}.pdf` ? '✓' : '❌'}`);
}

testNamingFormat();
