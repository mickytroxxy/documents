import puppeteer from 'puppeteer';
import { BankStatement } from './business_sample';
import { generateHtml } from './html';

(async () => {
    const dataArray: BankStatement[] = require('./business_sample').CapitecBankStatement;
    const data = dataArray[0]; // Use the first statement for testing
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const html = generateHtml(data);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
        path: '../../test-business-pagination.pdf',
        format: 'A4',
        printBackground: false,
        margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    await browser.close();
    console.log('Generated test-business-pagination.pdf with', data.transactions.length, 'transactions');
})();
