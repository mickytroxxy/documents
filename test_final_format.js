// Test the final format using the imported formatDate function

// Simulate the formatDate function from src/handlers/fnb/index.ts
function formatDate(date, format) {
    const d = typeof date === 'string' ? new Date(date) : typeof date === 'number' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

    if (format === 'short') {
        return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
    } else if (format === 'medium') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day} ${monthNames[month]} ${year}`;
    } else if (format === 'long') {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${day} ${monthNames[month]} ${year}`;
    }
    return '';
}

function testFinalFormat() {
    console.log('Testing final format using imported formatDate function');

    const today = new Date('2026-01-01');
    const statementDate = formatDate(today, 'long');
    const expectedFormat = '1 January 2026';

    console.log('Current date:', today.toISOString().split('T')[0]);
    console.log('Statement date (long format):', statementDate);
    console.log('Expected format:', expectedFormat);
    console.log('Match:', statementDate === expectedFormat ? '✓' : '❌');

    // Test all formats
    console.log('\nAll format tests:');
    console.log('Short format:', formatDate(today, 'short'));
    console.log('Medium format:', formatDate(today, 'medium'));
    console.log('Long format:', formatDate(today, 'long'));

    // Test with different dates
    const testDates = [new Date('2026-02-15'), new Date('2026-12-31'), new Date('2025-11-03')];

    console.log('\nAdditional date tests (long format):');
    testDates.forEach((date) => {
        const formatted = formatDate(date, 'long');
        console.log(`  ${date.toISOString().split('T')[0]} -> ${formatted}`);
    });
}

testFinalFormat();
