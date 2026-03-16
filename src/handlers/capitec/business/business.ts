import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { BankStatement } from './business_sample';

export const generateNewHtml = async (data: BankStatement) => {
    const formatCurrency = (value: number) => {
        const sign = value < 0 ? '-' : '+';
        const abs = Math.abs(value).toLocaleString('en-ZA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${sign}${abs}`;
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-GB');
    };

    const formatDateShort = (iso: string) => {
        const d = new Date(iso);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd}/${mm}/${yy}`;
    };

    let logoDataUrl = '';
    try {
        const logoPath = path.resolve(process.cwd(), 'src/handlers/capitec/capitec-logo.png');
        const buf = fs.readFileSync(logoPath);
        logoDataUrl = 'data:image/png;base64,' + buf.toString('base64');
    } catch {}

    let almaraiBoldData = '';
    try {
        const fontPath = path.resolve(process.cwd(), 'files/fonts/Almarai-Bold.ttf');
        const fbuf = fs.readFileSync(fontPath);
        almaraiBoldData = fbuf.toString('base64');
    } catch {}

    const ROW_HEIGHT = 22;
    const HEADER_HEIGHT = 260;
    const FOOTER_HEIGHT = 160;
    const PAGE_CONTENT_HEIGHT = 1120;

    // Calculate rows per page from page content height.
    // Page 1 has extra content (summary table), so it gets fewer rows.
    // The deduction is spread across pages to ensure all transactions are shown.
    const rowsPerPageRaw = Math.floor((PAGE_CONTENT_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT) / ROW_HEIGHT);
    const getRowsPerPage = (pageNo: number) => {
        const baseRows = rowsPerPageRaw;
        // Page 1 has the summary table taking extra space - deduct 8 rows
        if (pageNo === 1) {
            return Math.max(1, baseRows - 8);
        }
        return baseRows + 5;
    };

    // Compute fee totals and VAT for rendering in the statement footer rows
    const feeTotalValue = data.transactions.reduce((s, t) => s + (t.fees || 0), 0);
    const VAT_RATE = 0.15;
    const vatTotalValue = Math.round(feeTotalValue * VAT_RATE * 100) / 100;
    const headerHtml = (pageNo: number) => `
        <div class="top-header">
            <div class="stamp">
                <strong style="font-size:20px;font-weight:bold;color:#7d7e80;">
                    Capitec Bank
                </strong><br/>
                ${formatDate(data.account.statementDate)}<br/>
                Branch: ${data.bankDetails?.branchCode ?? ''}<br/>
                Device: ${data.bankDetails?.deviceCode ?? ''}<br/>
                Tel: ${data.bankDetails?.telephone ?? ''}
            </div>
            <div class="logo">
                <img src="${logoDataUrl}" alt="Capitec Bank" style="height:42px;"/>
            </div>
        </div>

        ${pageNo === 1 ? `<div class="statement-title">Business Account Statement</div>` : `<div class="statement-title" style="color:#fff;">Business Account Statement</div>`}

        <div class="info-row">
            ${
                pageNo === 1
                    ? `<div class="address">
                    ${data.account.businessName}<br/>
                    ${data.address?.line1 ?? ''}<br/>
                    ${data.address?.line2 ?? ''}<br/>
                    ${data.address?.line3 ?? ''}<br/>
                    ${data.address?.province ?? ''}<br/>
                    ${data.address?.postalCode ?? ''}
                </div>`
                    : '<div></div>'
            }

            <table class="account-box">
                <tr><td class="account-label">Date</td><td>${formatDate(data.account.statementDate)}</td></tr>
                ${pageNo === 1 ? `<tr><td class="account-label">Account type</td><td>${data.account.accountType}</td></tr>` : ''}
                <tr><td class="account-label">Account No.</td><td>${data.account.accountNumber}</td></tr>
                ${
                    pageNo === 1
                        ? `<tr><td class="account-label">Branch</td><td>${data.bankDetails?.branch ?? ''}</td></tr>
                <tr><td class="account-label">Telephone No.</td><td>${data.bankDetails?.telephone ?? ''}</td></tr>
                <tr><td class="account-label">Business Reg No.</td><td>${data.bankDetails?.businessRegNo ?? ''}</td></tr>
                <tr><td class="account-label">Client VAT No.</td><td></td></tr>`
                        : ''
                }
                <tr>
                    <td class="account-label">Statement No.</td>
                    <td>
                        ${data.account.statementNumber}
                        <span style="float:right;">Page: ${pageNo}</span>
                    </td>
                </tr>
            </table>
        </div>
    `;

    const summaryTableHtml = () => `
        <div style="margin-top:10px;">
            <table style="width:100%; border-collapse:collapse; font-size:8.5px;">
                <tr>
                    <th style="border:1px solid #b7c2cc; background:#e9f3ff; padding:6px;">
                        No Limit (No Lim) Rate
                    </th>
                    <th style="border:1px solid #b7c2cc; background:#e9f3ff; padding:6px;">
                        Overdraft Excess (Exc) Rate
                    </th>
                    <th style="border:1px solid #b7c2cc; background:#e9f3ff; padding:6px;">
                        Overdraft Expiry (Exp) Interest Rate
                    </th>
                </tr>
                <tr>
                    <td style="border:1px solid #b7c2cc; text-align:center; padding:6px;">
                        22.1000%
                    </td>
                    <td style="border:1px solid #b7c2cc;"></td>
                    <td style="border:1px solid #b7c2cc;"></td>
                </tr>
            </table>

            <div style="border:1px solid #b7c2cc; border-top:none; padding:6px; font-size:8.5px;">
                The Prime Lending rate has decreased from 10.75% to 10.50% with effect from 01/08/2025.
                Contact your nearest Business Centre or Customer Care Centre for details.
            </div>
        </div>
    `;

    const footerHtml = (pageNo: number) => `
        <div class="page-footer">

            <div style="text-align:right; font-weight:600; margin-bottom:8px;font-size:9px;">
                Statements are accepted as correct unless objection is lodged within 30 days.
            </div>

            <div style="text-align:right;">
                <strong style="font-size:9px;font-weight:600;">24hr Business Banking Client Care Centre</strong>
                0860 30 92 50 E BusinessBanking@capitecbank.co.za
            </div>

            <div style="text-align:right;">
                5 Neutron Road, Techno Park, Stellenbosch, 7600
                PO Box 12451, Die Boord, Stellenbosch, 7613
                <span style="color:#d71920;">capitecbank.co.za</span>
            </div>

            <div style="text-align:right; font-size:8.5px; margin-top:12px;margin-right:81px;">
                Capitec Bank is an authorised financial services provider (FSP 46669) and registered credit provider (NCRCP13) Capitec Bank Limited Reg. No.: 1980/003695/06
            </div>

            <div style="display:flex; justify-content:space-between; font-size:8.5px; margin-top:4px; align-items:right;">
                <div></div>
                <div><span style="margin-right:54px;">VAT Reg. No.: 4680173723</span> Page: ${pageNo}</div>
            </div>

        </div>
    `;

    const tableHead = `
        <table class="table">
            <thead>
                <tr>
                    <th>Post<br/>Date</th>
                    <th>Trans.<br/>Date</th>
                    <th>Description</th>
                    <th>Reference</th>
                    <th>Fees</th>
                    <th>Amount</th>
                    <th>Balance</th>
                </tr>
            </thead>
            <tbody>
    `;

    const tableFoot = `
            </tbody>
        </table>
    `;

    const allRows: string[] = [
        `
            <tr>
                <td></td>
                <td></td>
                <td>Balance brought forward</td>
                <td></td>
                <td></td>
                <td></td>
                <td class="balance credit">${formatCurrency(data.balances.openingBalance)}</td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td>Interest Rate @ 0.000</td>
                <td></td>
                <td></td>
                <td></td>
                <td class="balance credit"></td>
            </tr>
        `,
        ...data.transactions.map(
            (t) => `<tr>
                <td style="width:40px;">${formatDateShort(t.postDate)}</td>
                <td style="width:40px;">${formatDateShort(t.transactionDate)}</td>
                <td>${t.reference ?? ''}</td>
                <td>${t.description ?? ''}</td>
                <td class="balance credit">${t.fees ? formatCurrency(t.fees) : ''}</td>
                <td class="amount ${t.type === 'credit' ? 'credit' : 'debit'}">${formatCurrency(t.amount)}</td>
                <td class="balance ${t.balanceAfter >= 0 ? 'credit' : 'debit'}">${formatCurrency(t.balanceAfter)}</td>
            </tr>`
        ),
        `
            <tr>
                <td></td>
                <td></td>
                <td></td>
                <td class='hind-mid'>Fee Total:</td>
                <td class='hind-mid balance credit'>${formatCurrency(feeTotalValue)}</td>
                <td></td>
                <td class="balance credit"></td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td></td>
                <td class='hind-mid'>VAT @ 15.00% VAT Total:</td>
                <td class='hind-mid balance credit'>${formatCurrency(vatTotalValue)}</td>
                <td></td>
                <td class="balance credit"></td>
            </tr>
        `
    ];

    const pages: string[] = [];
    let pageNo = 1;
    let i = 0;

    while (i < allRows.length) {
        const rowsPerPage = getRowsPerPage(pageNo);
        // Ensure we don't try to read beyond the array length
        const remainingRows = allRows.length - i;
        const rowsToRender = Math.min(rowsPerPage, remainingRows);
        const chunk = allRows.slice(i, i + rowsToRender).join('');
        const isLastPage = i + rowsToRender >= allRows.length;

        pages.push(`
            <section class="page">
                ${headerHtml(pageNo)}
                ${tableHead}
                ${chunk}
                ${tableFoot}

                ${isLastPage ? `<table class="vat-table" style="width:100%; border-collapse:collapse;"><tr><td style="text-align:right;">All fees charged are inclusive of VAT.</td></tr></table>` : ''}

                ${pageNo === 1 ? summaryTableHtml() : ''}

                ${footerHtml(pageNo)}
            </section>
        `);

        i += rowsToRender;
        pageNo++;
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8"/>
    <style>
            /* Embedded Hind font (from html.ts) */
            @font-face {
                font-family:"PCUJVO+HindVadodara-Regular";
                src:url("data:application/octet-stream;base64,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") format("woff");
            }

            html, body {
                margin: 0;
                padding: 0;
                font-family: "PCUJVO+HindVadodara-Regular", Helvetica, Arial, sans-serif;
                font-size: 11px;
                color: #000;
            }

            /* Almarai Bold embedded from local files (if available) */
            ${almaraiBoldData ? `@font-face { font-family: 'Almarai-Bold'; src: url("data:font/ttf;base64,${almaraiBoldData}") format('truetype'); font-weight: bold; font-style: normal; }` : '/* Almarai-Bold not found on disk */'}

            .stamp strong { font-family: 'Almarai-Bold', "PCUJVO+HindVadodara-Regular", Helvetica, Arial, sans-serif; font-weight: bold; }

            /* Hind Medium/Bold font-face (remote URLs from Google Fonts) */
            @font-face {
                font-family: 'Hind-Medium';
                font-style: normal;
                font-weight: 500;
                font-display: swap;
                src: url('https://fonts.gstatic.com/s/hind/v18/5aU19_a8oxmIfJpbIRs.ttf') format('truetype');
            }
            @font-face {
                font-family: 'Hind-Bold';
                font-style: normal;
                font-weight: 700;
                font-display: swap;
                src: url('https://fonts.gstatic.com/s/hind/v18/5aU19_a8oxmIfNJdIRs.ttf') format('truetype');
            }

            /* Utility classes for Hind variants (definitions only) */
            .hind-bold { font-family: 'Hind-Bold', "PCUJVO+HindVadodara-Regular", Helvetica, Arial, sans-serif; font-weight: 700; }
            .hind-mid  { font-family: 'Hind-Medium', "PCUJVO+HindVadodara-Regular", Helvetica, Arial, sans-serif; font-weight: 700; }

        .page {
            position: relative;
            min-height: 297mm;
            padding: 0mm 12mm;
            box-sizing: border-box;
            page-break-after: always;
        }

        .page:last-child { page-break-after: auto; }

        .top-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 2mm;
        }

        .stamp {
            background: #fff;
            border: 1.8px solid #68696b;
            padding: 8px;
            text-align: center;
            font-size: 11px;
            margin-left: 41mm;
            color: #7d7e80;
            line-height: 1.2;
        }

        .logo { margin-top: 25px; margin-right: -5px; }

        .statement-title {
            margin-top: 70px;
            font-size: 16px;
            font-weight: bold;
            margin-left: 20px;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            margin-left: 20px;
        }

        .address {
            width: 50%;
            line-height: 1.3;
            font-weight: 500;
            font-size: 14px;
        }

        .account-box {
            width: 45%;
            border-collapse: collapse;
            border: 1px solid #b7c2cc;
            margin-top: -110px;
        }

        .account-box td { padding: 7px 8px; }

        .account-label {
            background: #e9f3ff;
            border: 1px solid #b7c2cc;
            width: 40%;
            font-family: 'Hind-Medium', "PCUJVO+HindVadodara-Regular", Helvetica, Arial, sans-serif; font-weight: 700;
        }

        .table {
            margin-top: 13px;
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            border: 1px solid #b7c2cc;
        }

        .table th {
            background: #e9f3ff;
            border: 1px solid #b7c2cc;
            padding: 2px 6px;
            text-align: center;
            vertical-align: top;
            line-height: 1.3;
            font-family: 'Hind-Medium', "PCUJVO+HindVadodara-Regular", Helvetica, Arial, sans-serif; font-weight: 700;
        }

        /* header bottom divider to separate from rows */
        .table thead tr th {
            border-bottom: 1px solid #b7c2cc;
        }

        .table td {
            border: 1px solid #b7c2cc;
            border-top: none;
            border-bottom: none;
            padding: 2px;
            vertical-align: top;
        }

        /* Do not force a bottom border on the main table — allow the closing row to provide it */

        .table tbody tr:nth-child(even) {
            background: #e9f3ff;
        }
        .table tbody tr {
             border: none;
        }

        /* VAT/closing row table should visually match transaction rows */
        .vat-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0px;
        }
        .vat-table td {
            background: #e9f3ff;
            padding: 2px;
            text-align: right;
            border-left: 1px solid #b7c2cc;
            border-right: 1px solid #b7c2cc;
            border-bottom: 1px solid #b7c2cc;
        }
        .table tbody tr {
             border: none;
        }
        .amount, .balance {
            text-align: right;
            font-variant-numeric: tabular-nums;
        }

        .credit, .debit { color: #000; }

        .page-footer {
            position: absolute;
            left: 12mm;
            right: 12mm;
            bottom: 6mm;
            font-size: 10px;
            line-height: 1.35;
            text-align: right;
        }
    </style>
    </head>
    <body>
        ${pages.join('')}
    </body>
    </html>
    `;
};

export const createBusinessBankStatementHandler = async (output: string, data: BankStatement) => {
    // Launch with Cloud Run-friendly flags and higher launch/connect timeout
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
        timeout: 180000,
        defaultViewport: { width: 1200, height: 800 },
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(180000);
    page.setDefaultTimeout(180000);

    // Avoid hanging on remote font/CDN requests (common cause of network idle issues)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const url = req.url();
        if (url.startsWith('data:') || url.startsWith('file:') || url.startsWith('about:')) {
            req.continue();
            return;
        }
        if (url.startsWith('http://') || url.startsWith('https://')) {
            req.abort();
            return;
        }
        req.continue();
    });

    const html = await generateNewHtml(data);

    const maxAttempts = 3;
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 180000 });
            await page.waitForSelector('body', { timeout: 120000 });
            await page.pdf({
                path: output,
                format: 'A4',
                printBackground: true,
                margin: { top: 0, bottom: 0, left: 0, right: 0 }
            });
            await browser.close();
            return;
        } catch (err: any) {
            lastError = err;
            if (attempt < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 1500));
            }
        }
    }

    await browser.close();
    throw lastError || new Error('Failed to generate PDF after retries');
};
