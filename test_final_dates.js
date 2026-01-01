// Test final corrected date calculation logic
function testFinalDateCalculation() {
    const today = new Date('2026-01-01'); // Using the current date from environment
    const months = 3;

    console.log('Testing FINAL FNB date calculation logic');
    console.log('Current date:', today.toISOString().split('T')[0]);
    console.log('Generating dates for', months, 'months (30-day periods backward)');
    console.log('');

    for (let i = 0; i < months; i++) {
        // Calculate 30-day periods backwards from today
        const daysPerPeriod = 30;
        const startDate = new Date(today);
        const endDate = new Date(today);

        // Calculate start date (current date minus (i+1)*30 days)
        startDate.setDate(today.getDate() - (i + 1) * daysPerPeriod);

        // Calculate end date (current date minus i*30 days)
        endDate.setDate(today.getDate() - i * daysPerPeriod);

        // Ensure start date doesn't go before the beginning of the 90-day period
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(today.getDate() - 90);
        if (startDate < ninetyDaysAgo) {
            startDate.setTime(ninetyDaysAgo.getTime());
        }

        // Ensure end date doesn't exceed today
        if (endDate > today) {
            endDate.setTime(today.getTime());
        }

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const startMonth = monthNames[startDate.getMonth()];
        const endMonth = monthNames[endDate.getMonth()];
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();

        const startDay = startDate.getDate().toString().padStart(2, '0');
        const endDay = endDate.getDate().toString().padStart(2, '0');

        const statementPeriod = {
            from: `${startDay} ${startMonth} ${startYear}`,
            to: `${endDay} ${endMonth} ${endYear}`,
            generation_date: today.toISOString().split('T')[0]
        };

        console.log(`Month ${i + 1}:`);
        console.log(`  Start: ${statementPeriod.from}`);
        console.log(`  End: ${statementPeriod.to}`);
        console.log(`  Generation date: ${statementPeriod.generation_date}`);

        // Verify no future dates
        const startDateObj = new Date(startYear, startDate.getMonth(), startDate.getDate());
        const endDateObj = new Date(endYear, endDate.getMonth(), endDate.getDate());

        if (startDateObj > today) {
            console.error(`  ❌ ERROR: Start date is in the future!`);
        } else {
            console.log(`  ✓ Start date is valid`);
        }

        if (endDateObj > today) {
            console.error(`  ❌ ERROR: End date is in the future!`);
        } else {
            console.log(`  ✓ End date is valid`);
        }

        // Verify dates are in correct order
        if (startDateObj > endDateObj) {
            console.error(`  ❌ ERROR: Start date is after end date!`);
        } else {
            console.log(`  ✓ Dates are in correct chronological order`);
        }

        // Verify it's a 30-day period (approximately)
        const daysDiff = Math.abs(endDateObj - startDateObj) / (1000 * 60 * 60 * 24);
        console.log(`  Days in period: ${Math.round(daysDiff)} (expected ~30)`);

        console.log('');
    }

    // Test NaN handling
    console.log('Testing NaN handling:');
    const testValues = [
        { value: '1000', expected: 1000 },
        { value: 1000, expected: 1000 },
        { value: 'invalid', expected: 0 },
        { value: null, expected: 0 },
        { value: undefined, expected: 0 }
    ];

    testValues.forEach((test) => {
        const result = typeof test.value === 'string' ? parseFloat(test.value) : typeof test.value === 'number' ? test.value : 0;
        const isValid = !isNaN(result) ? result : 0;
        console.log(`  Input: ${test.value} -> Output: ${isValid} (Expected: ${test.expected}) ${isValid === test.expected ? '✓' : '❌'}`);
    });
}

testFinalDateCalculation();
