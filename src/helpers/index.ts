export const currencyFormatter = (amount: any) => {
    const formattedAmount = parseFloat(amount)
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `ZAR ${formattedAmount}`;
};

export const generatePayslipDates = (payday: number, date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const thisMonthPayDate = new Date(year, month, payday);

    let periodStart: Date;
    let periodEnd: Date;
    let payDate: Date;

    if (payday === 1) {
        // If payday is the 1st, always get paid NEXT month
        const nextMonth = new Date(year, month + 1, 1);
        periodStart = new Date(year, month, 1);
        periodEnd = new Date(year, month + 1, 0);
        payDate = new Date(year, month + 1, 1);
    } else {
        // If payday is NOT the 1st, get paid SAME month if date has passed
        if (date >= thisMonthPayDate) {
            // Date has passed, so pay this month
            periodStart = new Date(year, month, 1);
            periodEnd = new Date(year, month + 1, 0);
            payDate = thisMonthPayDate;
        } else {
            // Date hasn't passed yet, so pay next month
            const nextMonthPayDate = new Date(year, month + 1, payday);
            periodStart = new Date(year, month, 1);
            periodEnd = new Date(year, month + 1, 0);
            payDate = nextMonthPayDate;
        }
    }

    const format = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    return {
        periodStart,
        periodEnd,
        payDate,
        formatted: {
            periodStart: format(periodStart),
            periodEnd: format(periodEnd),
            payDate: format(payDate)
        }
    };
};
export interface TaxInputs {
    grossSalary: number; // Monthly gross salary
    travelAllowance?: number; // Monthly travel allowance
    retirementContribution?: number; // Monthly pension/RA/provident
}

export interface TaxResult {
    totalDeductions: number;
    paye: number;
    uif: number;
    net: number;
}

export function calculatePAYE({ grossSalary, travelAllowance = 0, retirementContribution = 0 }: TaxInputs): TaxResult {
    // ---- Constants ----
    const UIF_RATE = 0.01;
    const UIF_CAP = 177.12;

    // SARS 2024/25 Annual Tax Brackets
    const taxBrackets = [
        { limit: 237100, rate: 0.18, base: 0 },
        { limit: 370500, rate: 0.26, base: 42678 },
        { limit: 512800, rate: 0.31, base: 77362 },
        { limit: 673000, rate: 0.36, base: 121475 },
        { limit: 857900, rate: 0.39, base: 179147 },
        { limit: 1817000, rate: 0.41, base: 251258 },
        { limit: Infinity, rate: 0.45, base: 644489 }
    ];

    // SARS Rebates 2024/25
    const primaryRebate = 17835;

    // ---- Calculate taxable income ----

    const annualSalary = grossSalary * 12;
    const annualTravel = travelAllowance * 12;

    // 80% of travel allowance is taxable
    const taxableTravel = annualTravel * 0.8;

    // Retirement contribution deduction (max 27.5% of salary OR R350k annually)
    const maxRA = Math.min(annualSalary * 0.275, 350000);
    const actualRA = Math.min(retirementContribution * 12, maxRA);

    const taxableIncome = annualSalary + taxableTravel - actualRA;

    // ---- Annual Tax Calculation ----
    let annualTax = 0;

    for (let i = 0; i < taxBrackets.length; i++) {
        const { limit, rate, base } = taxBrackets[i];
        if (taxableIncome <= limit) {
            const prevLimit = i === 0 ? 0 : taxBrackets[i - 1].limit;
            annualTax = base + (taxableIncome - prevLimit) * rate;
            break;
        }
    }

    // Apply primary rebate
    annualTax = Math.max(annualTax - primaryRebate, 0);

    // Convert to monthly PAYE
    const paye = annualTax / 12;

    // UIF calculation
    const uif = Math.min(grossSalary * UIF_RATE, UIF_CAP);

    // Net salary
    const net = grossSalary - paye - uif;
    const totalDeductions = paye + uif;
    return {
        paye: Number(paye.toFixed(2)),
        uif: Number(uif.toFixed(2)),
        net: Number(net.toFixed(2)),
        totalDeductions: Number(totalDeductions.toFixed(2))
    };
}
export function amountToWords(amount: string | number): string {
    if (amount === null || amount === undefined) return '';

    // Convert to number safely
    const num = Number(String(amount).replace(/,/g, ''));
    if (isNaN(num)) return '';

    const belowTwenty = [
        '',
        'One',
        'Two',
        'Three',
        'Four',
        'Five',
        'Six',
        'Seven',
        'Eight',
        'Nine',
        'Ten',
        'Eleven',
        'Twelve',
        'Thirteen',
        'Fourteen',
        'Fifteen',
        'Sixteen',
        'Seventeen',
        'Eighteen',
        'Nineteen'
    ];

    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const thousands = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

    const convertHundreds = (n: number): string => {
        let word = '';

        if (n > 99) {
            word += belowTwenty[Math.floor(n / 100)] + ' Hundred';
            n = n % 100;
            if (n > 0) word += ' and ';
        }

        if (n > 19) {
            word += tens[Math.floor(n / 10)];
            if (n % 10 > 0) word += '-' + belowTwenty[n % 10];
        } else if (n > 0) {
            word += belowTwenty[n];
        }

        return word;
    };

    const convert = (n: number): string => {
        if (n === 0) return 'Zero';

        let words = '';
        let group = 0;

        while (n > 0) {
            const chunk = n % 1000;
            if (chunk !== 0) {
                const chunkWords = convertHundreds(chunk);
                const unit = thousands[group];
                words = chunkWords + (unit ? ' ' + unit : '') + (words ? ' ' + words : '');
            }
            n = Math.floor(n / 1000);
            group++;
        }

        return words.trim();
    };

    // Split rands and cents
    const rands = Math.floor(Math.abs(num));
    const cents = Math.round((Math.abs(num) - rands) * 100);

    let result = '';

    if (num < 0) result += 'Minus ';

    // Convert rand part
    result += convert(rands) + ' Rand';

    // Convert cents (if present)
    if (cents > 0) {
        result += ' and ' + convert(cents) + ' Cents';
    }

    return result;
}
