// @ts-ignore
import fontkit from 'fontkit';
import { PDFDocument, PDFFont, rgb, StandardFonts, degrees } from '@pdfme/pdf-lib';
import fs from 'fs';
import { mkdirp } from 'mkdirp';
import { COLORS } from '../standard/constants';
import { FNBBankStatementType, Transaction } from './sample';
import path from 'path';
import { text } from 'body-parser';

function formatDate(date: Date | string | number, format: 'short' | 'medium' | 'long'): string {
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

export async function generateFNBBankPDF(data: FNBBankStatementType, stmt_number = 8, outputPath?: string) {
    const topOffset = 130;
    const lineGap = 12;
    const fontSize = 8;

    // Page padding constants
    const PAGE_BOTTOM_PADDING = 150;
    const TRANSACTION_START_Y_FIRST_PAGE = 405;
    const TRANSACTION_START_Y_ADDITIONAL_PAGES = 675;

    mkdirp.sync('./files/fnb');
    const existingPdfBytes = fs.readFileSync('./files/fnb/input.pdf');
    const formPdfUint8Array = new Uint8Array(existingPdfBytes);
    const pdfDoc = await PDFDocument.load(formPdfUint8Array);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    pdfDoc.registerFontkit(fontkit);

    // Constants for pagination
    const TRANSACTIONS_PER_PAGE_FIRST = Math.floor((TRANSACTION_START_Y_FIRST_PAGE - PAGE_BOTTOM_PADDING) / 10);
    const TRANSACTIONS_PER_PAGE_ADDITIONAL = Math.floor((TRANSACTION_START_Y_ADDITIONAL_PAGES - PAGE_BOTTOM_PADDING) / 10);
    const totalTransactions = data.transactions.length;
    const remainingTransactions = totalTransactions - TRANSACTIONS_PER_PAGE_FIRST;
    const additionalPagesNeeded = Math.ceil(remainingTransactions / TRANSACTIONS_PER_PAGE_ADDITIONAL);
    const totalPagesNeeded = additionalPagesNeeded + 1;

    const { height, width } = firstPage.getSize();
    const { height: secondPageHeight, width: secondPageWidth } = firstPage.getSize();
    const fontBytes = fs.readFileSync(path.resolve('./files/fonts/Arial-Regular.ttf'));
    const fontBoldBytes = fs.readFileSync(path.resolve('./files/fonts/Arial-Bold.ttf'));
    const font: PDFFont = await pdfDoc.embedFont(new Uint8Array(fontBytes));
    const fontBold: PDFFont = await pdfDoc.embedFont(new Uint8Array(fontBoldBytes));
    const startY = height - topOffset;
    const gap = lineGap;

    const account_details_row: Array<[string]> = [
        [data?.statement_info?.customer_name],
        [data?.statement_info?.customer_address?.street_number],
        [data?.statement_info?.customer_address?.street_name],
        [data?.statement_info?.customer_address?.location],
        [data?.statement_info?.customer_address?.postal_code]
    ];
    account_details_row.forEach(([label], idx) => {
        const y = startY - 10.9 * idx - 2;
        firstPage.drawText(label, { x: 61, y, size: fontSize + 1, font, color: COLORS.blackColor });
    });
    firstPage.drawText(formatDate(data?.statement_info?.statement_date, 'medium'), {
        x: 262.5,
        y: startY - 40,
        size: fontSize - 2.5,
        font: font,
        color: COLORS.blackColor
    });

    const account_text = `${data?.statement_info?.account_type} : ${data?.statement_info?.account_number}`;
    const valueWidth = fontBold.widthOfTextAtSize(account_text, 7.8);
    firstPage.drawText(account_text, {
        x: width - 13.3 - valueWidth,
        y: startY - 145,
        size: 7.8,
        font: fontBold,
        color: COLORS.blackColor
    });
    firstPage.drawText(stmt_number?.toString(), {
        x: width - 18,
        y: startY - 159,
        size: 7.8,
        color: COLORS.blackColor
    });
    const stmt_period_text = `${data?.statement_info?.statement_period}`;
    const stmt_period_width = font.widthOfTextAtSize(stmt_period_text, 7.8);
    firstPage.drawText(stmt_period_text, {
        x: width - 13 - stmt_period_width,
        y: startY - 168,
        size: 7.8,
        font,
        color: COLORS.blackColor
    });

    const stmt_date_text = formatDate(data?.statement_info?.statement_date, 'long');
    const stmt_date_width = fontBold.widthOfTextAtSize(stmt_date_text, 7.8);
    firstPage.drawText(stmt_date_text, {
        x: width - 13.2 - stmt_date_width,
        y: startY - 177.1,
        size: 7.8,
        font: fontBold,
        color: COLORS.blackColor
    });

    const account_balances_row: Array<[string, any]> = [
        [data?.balances?.opening_balance?.amount + '' + data?.balances?.opening_balance?.action, data?.balances?.opening_balance?.action],
        [data?.balances?.closing_balance?.amount + '' + data?.balances?.closing_balance?.action, data?.balances?.closing_balance?.action],
        [data?.balances?.vat_inclusive?.amount + '' + data?.balances?.vat_inclusive?.action, data?.balances?.vat_inclusive?.action],
        [data?.balances?.total_vat_zar?.amount + '' + data?.balances?.total_vat_zar?.action, data?.balances?.total_vat_zar?.action]
    ];
    account_balances_row.forEach(([label, action], idx) => {
        const y = startY - 9 * idx - 203;
        const value_width = font.widthOfTextAtSize(label, 7.8);
        firstPage.drawText(label, {
            x: width - (action ? 375.4 : 385.3) - value_width,
            y,
            size: fontSize,
            font,
            color: COLORS.blackColor
        });
    });

    const bank_charges_row: Array<[string, any]> = [
        [data?.bank_charges?.service_fees?.amount + '' + data?.bank_charges?.service_fees?.action, data?.bank_charges?.service_fees?.action],
        [
            data?.bank_charges?.cash_deposit_fees?.amount + '' + data?.bank_charges?.cash_deposit_fees?.action,
            data?.bank_charges?.cash_deposit_fees?.action
        ],
        [
            data?.bank_charges?.cash_handling_fees?.amount + '' + data?.bank_charges?.cash_handling_fees?.action,
            data?.bank_charges?.cash_handling_fees?.action
        ],
        [data?.bank_charges?.other_fees?.amount + '' + data?.bank_charges?.other_fees?.action, data?.bank_charges?.other_fees?.action]
    ];
    bank_charges_row.forEach(([label, action], idx) => {
        const y = startY - 9 * idx - 203;
        const value_width = font.widthOfTextAtSize(label, 7.8);
        firstPage.drawText(label, {
            x: width - (action ? 167 : 177.5) - value_width,
            y,
            size: fontSize,
            font,
            color: COLORS.blackColor
        });
    });

    const interest_row: Array<[string]> = [[data?.interest_rates?.credit_rate], [data?.interest_rates?.debit_rate]];
    interest_row.forEach(([label], idx) => {
        const y = startY - 9 * idx - 202;
        const value_width = font.widthOfTextAtSize(label, 7.8);
        firstPage.drawText(label, {
            x: width - 15 - value_width,
            y,
            size: fontSize,
            font,
            color: COLORS.blackColor
        });
    });
    renderStamp(firstPage, font, fontBold, data, true);
    // Handle pagination for transactions
    if (totalPagesNeeded === 1) {
        // Single page - render all transactions on first page
        await renderTable(
            firstPage,
            data.transactions,
            font,
            fontBold,
            pdfDoc,
            TRANSACTION_START_Y_FIRST_PAGE,
            data,
            true,
            1,
            1,
            PAGE_BOTTOM_PADDING,
            true
        );
    } else {
        // Multiple pages needed
        // Render first page with first batch of transactions
        const firstPageTransactions = data.transactions.slice(0, TRANSACTIONS_PER_PAGE_FIRST);
        await renderTable(
            firstPage,
            firstPageTransactions,
            font,
            fontBold,
            pdfDoc,
            TRANSACTION_START_Y_FIRST_PAGE,
            data,
            totalPagesNeeded === 1,
            1,
            totalPagesNeeded,
            PAGE_BOTTOM_PADDING,
            true
        );

        // Add additional pages for overflow transactions
        for (let pageIndex = 1; pageIndex < totalPagesNeeded; pageIndex++) {
            const isLastPage = pageIndex === totalPagesNeeded - 1;
            const startIndex = TRANSACTIONS_PER_PAGE_FIRST + (pageIndex - 1) * TRANSACTIONS_PER_PAGE_ADDITIONAL;
            const endIndex = startIndex + TRANSACTIONS_PER_PAGE_ADDITIONAL;
            const pageTransactions = data.transactions.slice(startIndex, endIndex);

            // Create a new blank page
            pdfDoc.addPage();
            const additionalPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];

            // Render transactions on the additional page
            await renderTable(
                additionalPage,
                pageTransactions,
                font,
                fontBold,
                pdfDoc,
                TRANSACTION_START_Y_ADDITIONAL_PAGES,
                data,
                isLastPage,
                pageIndex + 1,
                totalPagesNeeded,
                PAGE_BOTTOM_PADDING,
                false
            );
        }
    }

    const pdfBytes = await pdfDoc.save();
    const finalOutputPath = outputPath || './files/fnb/output.pdf';
    fs.writeFileSync(finalOutputPath, pdfBytes);
    return finalOutputPath;
}

function renderStamp(page: any, font: PDFFont, fontBold: PDFFont, data: FNBBankStatementType, isFirstPage: boolean = true) {
    const { width, height } = page.getSize();
    const topOffset = 130;
    const startY = height - topOffset;
    if (!isFirstPage) {
        page.drawRectangle({
            x: 209,
            y: height - 66,
            width: 180,
            height: 52,
            borderWidth: 0.6,
            borderColor: COLORS.fnbBlue,
            opacity: 1
        });
        page.drawRectangle({
            x: 211,
            y: height - 64,
            width: 176,
            height: 48,
            borderWidth: 0.6,
            borderColor: COLORS.darkColor,
            opacity: 1
        });
        page.drawText(`FNB Verified Statement`, {
            x: 214.3,
            y: startY + 108,
            size: 4.8,
            font: fontBold,
            color: COLORS.blackColor
        });
        page.drawText(`Reference Number:`, {
            x: 214.3,
            y: startY + 97,
            size: 4.8,
            font: fontBold,
            color: COLORS.blackColor
        });
        const stmt_disclaimer_lines = {
            text1: `To verify this statement, please keep the above reference number and the client's `,
            text2: `ID number/business account number hand. Visist www.fnb.co.za, select Contact `,
            text3: `Us + Tools on the menu, followed by Verify Statement and follow the on-screen `,
            text4: `instructions. The reference number is valid for a minimum of 3 months.`
        };
        page.drawText(stmt_disclaimer_lines.text1, {
            x: 213.78,
            y: startY + 86,
            size: 4.6,
            font,
            color: COLORS.darkColor
        });
        page.drawText(stmt_disclaimer_lines.text2, {
            x: 213.78,
            y: startY + 86 - 6,
            size: 4.7,
            font,
            color: COLORS.darkColor
        });
        page.drawText(stmt_disclaimer_lines.text3, {
            x: 213.78,
            y: startY + 86 - 12,
            size: 4.6,
            font,
            color: COLORS.darkColor
        });
        page.drawText(stmt_disclaimer_lines.text4, {
            x: 213.78,
            y: startY + 86 - 18,
            size: 4.6,
            font,
            color: COLORS.darkColor
        });
    }
    page.drawText(formatDate(Date.now() as any, 'short'), {
        x: 268.6,
        y: startY + 107.7,
        size: 4.5,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2)
    });
    page.drawText(data?.statement_info?.reference_number, {
        x: 265,
        y: startY + 96,
        size: 4.5,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2)
    });
}

function renderFooter(
    page: any,
    font: PDFFont,
    fontBold: PDFFont,
    data: FNBBankStatementType,
    width: number,
    height: number,
    pageNumber: number,
    totalPages: number,
    tableWidth: number,
    borderColor: any,
    MARGIN_LEFT: number,
    MARGIN_RIGHT: number
) {
    // Add page numbering to bottom left corner on every page
    const pageNumberText = `Page ${pageNumber} of ${totalPages}`;
    page.drawText(pageNumberText, {
        x: 16.5, // Bottom left corner
        y: 56.3, // Near bottom of page
        size: 9,
        font: fontBold,
        color: COLORS.blackColor
    });
    const delivery_info = {
        text1: `Delivery Method  F1 R02`,
        text2: `NS/EM/W V/DDA AA`,
        text3: `621`,
        text4: `1418326`
    };
    page.drawText(delivery_info.text1, {
        x: 16.5, // Bottom left corner
        y: 49, // Near bottom of page
        size: 6,
        font,
        color: COLORS.blackColor
    });
    page.drawText(delivery_info.text2, {
        x: 16.5, // Bottom left corner
        y: 40, // Near bottom of page
        size: 6,
        font,
        color: COLORS.blackColor
    });
    page.drawText(delivery_info.text3, {
        x: 16.5, // Bottom left corner
        y: 33, // Near bottom of page
        size: 6,
        font,
        color: COLORS.blackColor
    });

    page.drawText(delivery_info.text4, {
        x: 16.5, // Bottom left corner
        y: 20, // Near bottom of page
        size: 6,
        font,
        color: COLORS.blackColor
    });
    page.drawRectangle({
        x: 124,
        y: 33,
        width: tableWidth - 192.7,
        height: 20,
        borderWidth: 0.5,
        borderColor: borderColor,
        opacity: 1
    });

    // Add table with headers and values inside the rectangle
    const tableX = 124;
    const tableY = 33;
    const tableWidthInside = tableWidth - 192.7;
    const footerTableHeight = 20;

    // Define columns for the table
    const headers = ['Branch Number', 'Account Number', 'Date', 'DDA AA/48/BV/KY/KY/BF/B9/C6/CK/N'];
    const values = ['621', data?.statement_info?.account_number, formatDate(Date.now() as any, 'short'), data?.statement_info?.account_type, ''];

    // Calculate column widths (distribute table width proportionally)
    const colWidths = [
        tableWidthInside * 0.1425, // Branch Number
        tableWidthInside * 0.167, // Account Number
        tableWidthInside * 0.12, // Date
        tableWidthInside * 0 // DDA AA/48/BV/KY/KY/BF/B9/C6/CK/N
    ];

    // Calculate cumulative X positions for column borders
    const colXPositions = [tableX];
    for (let i = 0; i < colWidths.length; i++) {
        colXPositions.push(colXPositions[i] + colWidths[i]);
    }

    // Draw column borders (vertical lines)
    for (let i = 1; i < colXPositions.length; i++) {
        page.drawLine({
            start: { x: colXPositions[i], y: tableY },
            end: { x: colXPositions[i], y: tableY + footerTableHeight },
            thickness: 0.5,
            color: borderColor,
            opacity: 1
        });
    }

    // Draw horizontal separator line between headers and values
    const separatorY = tableY + 10;
    page.drawLine({
        start: { x: tableX, y: separatorY },
        end: { x: tableX + tableWidthInside, y: separatorY },
        thickness: 0.5,
        color: borderColor,
        opacity: 1
    });

    // Draw headers (left-aligned in each column)
    const footerHeaderY = tableY + 13; // Position headers in top half
    const footerHeaderFontSize = 6;
    page.drawText('FN', {
        x: width - 127,
        y: footerHeaderY,
        size: 6,
        font,
        color: COLORS.darkColor
    });
    for (let i = 0; i < headers.length; i++) {
        const headerText = headers[i];
        const headerX = colXPositions[i] + 2; // Small padding from left

        page.drawText(headerText, {
            x: headerX + 2,
            y: footerHeaderY - 1,
            size: footerHeaderFontSize,
            font, // Use regular font instead of fontBold
            color: COLORS.blackColor
        });
    }

    // Draw values (left-aligned in each column)
    const valuesY = tableY + 3; // Position values in bottom half
    const valuesFontSize = 6;

    for (let i = 0; i < values.length; i++) {
        const valueText = values[i];
        const valueX = colXPositions[i] + 2; // Small padding from left

        page.drawText(valueText, {
            x: valueX + 2,
            y: valuesY,
            size: valuesFontSize,
            font,
            color: COLORS.blackColor
        });
    }
}

function renderLastPageFooter(
    page: any,
    font: PDFFont,
    fontBold: PDFFont,
    data: FNBBankStatementType,
    width: number,
    height: number,
    currentY: number,
    tableHeight: number,
    tableWidth: number,
    MARGIN_LEFT: number,
    MARGIN_RIGHT: number,
    borderColor: any,
    pageNumber: number
) {
    // Add closing balance footer only on the last page
    // Check if there's enough space for the footer
    const footerHeight = 150; // Approximate height needed for footer content
    const availableSpace = currentY - tableHeight - 220;

    if (availableSpace >= footerHeight) {
        // Enough space, render footer on this page
        const closingBalanceText = `Closing Balance`;
        const turnoverText = `Turnover for Statement Period`;

        page.drawText(closingBalanceText, {
            x: 44.5,
            y: currentY - tableHeight - 10,
            size: 7.9,
            font: fontBold,
            color: COLORS.darkColor
        });
        const value_width = fontBold.widthOfTextAtSize(data?.balances?.closing_balance?.amount + '' + data?.balances?.closing_balance?.action, 7.8);
        page.drawText(data?.balances?.closing_balance?.amount + '' + data?.balances?.closing_balance?.action, {
            x: width - 50 - value_width,
            y: currentY - tableHeight - 10,
            size: 7.9,
            font: fontBold,
            color: COLORS.blackColor
        });

        page.drawText(turnoverText, {
            x: 102.5,
            y: currentY - tableHeight - 29,
            size: 7.9,
            font: fontBold,
            color: COLORS.darkColor
        });
        page.drawRectangle({
            x: 102.5,
            y: currentY - tableHeight - 51,
            width: tableWidth - 176,
            height: 20,
            borderWidth: 0.5,
            borderColor: borderColor,
            opacity: 1
        });
        const statement_details_row: Array<[string, string, string | null]> = [
            [
                `No. Credit Transactions ${data?.turnover_summary?.credit_transactions?.count}`,
                data?.turnover_summary?.credit_transactions?.total,
                data?.turnover_summary?.credit_transactions?.action
            ],
            [
                `No. Debit Transactions ${data?.turnover_summary?.debit_transactions?.count}`,
                `${data.turnover_summary?.debit_transactions?.total}`,
                data?.turnover_summary?.debit_transactions?.action
            ]
        ];

        statement_details_row.forEach(([label, value, action], idx) => {
            // Calculate Y position for each row
            const yPosition = currentY - tableHeight - 38 - idx * 9.5;

            // Draw label (left side)
            page.drawText(label, {
                x: 104,
                y: yPosition,
                size: 7.9,
                font,
                color: COLORS.blackColor
            });

            // Calculate value position (right-aligned)
            const valueWidth = font.widthOfTextAtSize(value + action, 8);
            const valueXRight = width - (action ? 104.3 : 111) - valueWidth;

            // Draw value (right side)
            page.drawText(value + action, {
                x: valueXRight,
                y: yPosition,
                size: 8,
                font,
                color: COLORS.darkColor
            });
        });

        page.drawRectangle({
            x: MARGIN_LEFT,
            y: currentY - tableHeight - 110,
            width: tableWidth - 9,
            height: 32,
            borderWidth: 1,
            borderColor: borderColor,
            opacity: 1
        });

        const paragraphLines = {
            text1: `Please contact us within 30 days from your statement date, should you wish to query an entry on this statement (incl. card transactions done`,
            text2: `during this statement period, but not yet reflecting). Should we not hear from you, we will assume that you have received the statement and that it`,
            text3: `is correct.`
        };
        page.drawText(paragraphLines.text1, {
            x: MARGIN_LEFT + 2,
            y: currentY - tableHeight - 87,
            size: 7.85,
            color: COLORS.blackColor,
            font: fontBold
        });
        page.drawText(paragraphLines.text2, {
            x: MARGIN_LEFT + 2,
            y: currentY - tableHeight - 96,
            size: 7.85,
            color: COLORS.blackColor,
            font: fontBold
        });
        page.drawText(paragraphLines.text3, {
            x: MARGIN_LEFT + 2,
            y: currentY - tableHeight - 105.5,
            size: 7.85,
            color: COLORS.blackColor,
            font: fontBold
        });
        const disclaimerLines = {
            text1: `For more information on your Pricing Option, please contact us or visit our website.`,
            text2: `**For the latest Credit Rates on product, please go to fnb.co.za`,
            text3: `*Debit Rate is subject to the maximum annual variable interest rate allowed by the NCA which is 20.75%`,
            text4: `First National Bank - a division of FirstRand Bank Limited. Registration Number 1929/001225/06. An Authorised Financial Services and Credit Provider (NCRCP20).`,
            text5: `On 21 November 2025, the Prime Lending Rate changed to 10.25%. This may impact the rate on any of your credit facilities.`
        };
        const disclaimerStartY = currentY - tableHeight - 117;
        const disclaimerStartX = MARGIN_LEFT + 1;
        page.drawText(disclaimerLines.text1, {
            x: disclaimerStartX,
            y: disclaimerStartY,
            size: 7.7,
            color: COLORS.blackColor
        });
        page.drawText(disclaimerLines.text2, {
            x: disclaimerStartX,
            y: disclaimerStartY - 9,
            size: 7.7,
            color: COLORS.blackColor
        });
        page.drawText(disclaimerLines.text3, {
            x: disclaimerStartX,
            y: disclaimerStartY - 18,
            size: 7.68,
            color: COLORS.blackColor
        });
        page.drawText(disclaimerLines.text4, {
            x: disclaimerStartX,
            y: disclaimerStartY - 9 * 3 - 5,
            size: 7.72,
            color: COLORS.blackColor
        });
        page.drawText(disclaimerLines.text5, {
            x: disclaimerStartX,
            y: disclaimerStartY - 9 * 4 - 8.5,
            size: 7.705,
            color: COLORS.blackColor
        });
    } else {
        // Not enough space, create a new page for the footer
        console.warn(`Not enough space for footer on page ${pageNumber}, footer content would overflow`);
        // In a real implementation, you would create a new page here and render the footer there
        // For now, we'll render what fits and log the issue
    }
}

const renderTable = async (
    page: any,
    transactions: Transaction[],
    font: PDFFont,
    fontBold: PDFFont,
    pdfDoc: PDFDocument,
    startY: number,
    data: FNBBankStatementType,
    isLastPage: boolean = false,
    pageNumber: number = 1,
    totalPages: number = 1,
    pageBottomPadding: number = 220,
    isFirstPage: boolean = true
) => {
    const { width, height } = page.getSize();
    const MARGIN_RIGHT = 13.8;
    const MARGIN_LEFT = 11.5;
    const tableBOffsetX = MARGIN_LEFT;
    const tableWidth = width - MARGIN_LEFT - MARGIN_RIGHT;

    // Add account number to top left corner for additional pages (not first page)
    if (!isFirstPage) {
        const accountNumberText = `Transactions in RAND (ZAR) : ${data?.statement_info?.account_number}`;
        page.drawText(accountNumberText, {
            x: MARGIN_LEFT, // Top left corner
            y: height - 115, // Near top of page
            size: 7.45,
            font: fontBold,
            color: COLORS.blackColor
        });
        renderStamp(page, font, fontBold, data, false);
    }
    if (isFirstPage) {
        const accountNumberText = `XSTZFN9 : ${data?.statement_info?.account_number}`;
        page.drawText(accountNumberText, {
            x: width - 28, // Top left corner
            y: 105, // Near top of page
            size: 5.5,
            font,
            color: COLORS.blackColor,
            rotate: degrees(270)
        });
    }

    // Define column positions clearly
    const colDateX = tableBOffsetX + 5; // Small padding from left border
    const colDescX = colDateX + 45; // Date column width ~40px
    const colAmountX = width - MARGIN_RIGHT - 120; // Adjust as needed
    const colBalanceX = width - MARGIN_RIGHT - 70; // Adjust as needed
    const colFeesX = width - MARGIN_RIGHT - 20; // Adjust as needed

    let currentY = startY + 13.5;
    const fontSize = 6.5;
    const lineHeight = 12;
    const rowLightGray = rgb(0.91, 0.91, 0.91);
    const rowWhite = rgb(1, 1, 1);

    // Calculate table height based on transactions
    const rowHeight = 10;
    const tableHeight = transactions.length * rowHeight;

    // Draw row backgrounds FIRST (so borders appear on top)
    for (const [idx, item] of (transactions || []).entries()) {
        const isEvenRow = idx % 2 !== 0;
        const backgroundColor = isEvenRow ? rowLightGray : rowWhite;
        const rowY = currentY - idx * rowHeight;

        // Draw row background
        page.drawRectangle({
            x: tableBOffsetX,
            y: rowY - rowHeight,
            width: tableWidth,
            height: rowHeight,
            color: backgroundColor,
            opacity: 1
        });
    }

    // Draw vertical borders (between columns)
    const borderColor = rgb(0, 0, 0);

    // Vertical border positions
    const border1X = tableBOffsetX + 25.2; // After date column
    const border2X = border1X + 383.7; // After description column
    const border3X = width - MARGIN_RIGHT - 100.7; // After amount column
    const border4X = width - MARGIN_RIGHT - 36.5; // After balance column

    for (let i = 0; i < transactions.length; i++) {
        const rowY = currentY - i * rowHeight;

        // Draw vertical borders for this row
        page.drawLine({
            start: { x: border1X, y: rowY },
            end: { x: border1X, y: rowY - rowHeight },
            thickness: 0.5,
            color: borderColor,
            opacity: 1
        });

        page.drawLine({
            start: { x: border2X, y: rowY },
            end: { x: border2X, y: rowY - rowHeight },
            thickness: 0.5,
            color: borderColor,
            opacity: 1
        });

        page.drawLine({
            start: { x: border3X, y: rowY },
            end: { x: border3X, y: rowY - rowHeight },
            thickness: 0.5,
            color: borderColor,
            opacity: 1
        });

        page.drawLine({
            start: { x: border4X, y: rowY },
            end: { x: border4X, y: rowY - rowHeight },
            thickness: 0.5,
            color: borderColor,
            opacity: 1
        });
    }

    // Draw outer border LAST (so it's on top)
    page.drawRectangle({
        x: tableBOffsetX,
        y: currentY - tableHeight,
        width: tableWidth,
        height: tableHeight,
        borderWidth: 0.5,
        borderColor: borderColor,
        opacity: 1
    });

    // Draw table headers with centered text and rectangle borders
    const headerY = currentY + 13.5 - 8; // Position headers above the table content
    const headerFontSize = 7.3;
    const headerHeight = 35;

    // Draw header row with background and borders using rectangle
    page.drawRectangle({
        x: tableBOffsetX,
        y: headerY - 5.5,
        width: tableWidth,
        height: headerHeight,
        //color: rgb(0.9, 0.9, 0.9), // Light gray background for header
        borderWidth: 0.5,
        borderColor: borderColor,
        opacity: 1
    });

    // Draw vertical borders between columns using rectangles
    // Vertical border 1 (after Date column)
    page.drawRectangle({
        x: border1X - 0.25,
        y: headerY - 5.5,
        width: 0.5,
        height: headerHeight,
        color: borderColor,
        opacity: 1
    });

    // Vertical border 2 (after Description column)
    page.drawRectangle({
        x: border2X - 0.25,
        y: headerY - 5.5,
        width: 0.5,
        height: headerHeight,
        color: borderColor,
        opacity: 1
    });

    // Vertical border 3 (after Amount column)
    page.drawRectangle({
        x: border3X - 0.25,
        y: headerY - 5.5,
        width: 0.5,
        height: headerHeight,
        color: borderColor,
        opacity: 1
    });

    // Vertical border 4 (after Balance column)
    page.drawRectangle({
        x: border4X - 0.25,
        y: headerY - 5.5,
        width: 0.5,
        height: headerHeight,
        color: borderColor,
        opacity: 1
    });

    // Calculate centered positions for header text
    const headerTextY = headerY + 5.5 / 2 - headerFontSize / 3 + 9.5;

    // Date header (centered in Date column)
    const dateHeaderText = 'Date';
    const dateHeaderWidth = fontBold.widthOfTextAtSize(dateHeaderText, headerFontSize);
    const dateColumnWidth = border1X - tableBOffsetX;
    page.drawText(dateHeaderText, {
        x: tableBOffsetX + dateColumnWidth / 2 - dateHeaderWidth / 2,
        y: headerTextY,
        size: headerFontSize,
        font: fontBold,
        color: COLORS.blackColor
    });

    // Description header (centered in Description column)
    const descHeaderText = 'Description';
    const descHeaderWidth = fontBold.widthOfTextAtSize(descHeaderText, headerFontSize);
    const descColumnWidth = border2X - border1X;
    page.drawText(descHeaderText, {
        x: border1X + descColumnWidth / 2 - descHeaderWidth / 2,
        y: headerTextY,
        size: headerFontSize,
        font: fontBold,
        color: COLORS.blackColor
    });

    // Amount header (centered in Amount column)
    const amountHeaderText = 'Amount';
    const amountHeaderWidth = fontBold.widthOfTextAtSize(amountHeaderText, headerFontSize);
    const amountColumnWidth = border3X - border2X;
    page.drawText(amountHeaderText, {
        x: border2X + amountColumnWidth / 2 - amountHeaderWidth / 2,
        y: headerTextY,
        size: headerFontSize,
        font: fontBold,
        color: COLORS.blackColor
    });

    // Balance header (centered in Balance column)
    const balanceHeaderText = 'Balance';
    const balanceHeaderWidth = fontBold.widthOfTextAtSize(balanceHeaderText, headerFontSize);
    const balanceColumnWidth = border4X - border3X;
    page.drawText(balanceHeaderText, {
        x: border3X + balanceColumnWidth / 2 - balanceHeaderWidth / 2,
        y: headerTextY,
        size: headerFontSize,
        font: fontBold,
        color: COLORS.blackColor
    });

    // Accrued Bank Charges header (centered in Accrued column, 3 lines)
    const accruedHeaderLine1 = 'Accrued';
    const accruedHeaderLine2 = 'Bank';
    const accruedHeaderLine3 = 'Charges';

    const accruedColumnWidth = tableBOffsetX + tableWidth - border4X;

    // Calculate widths and center each line
    const line1Width = fontBold.widthOfTextAtSize(accruedHeaderLine1, headerFontSize);
    const line2Width = fontBold.widthOfTextAtSize(accruedHeaderLine2, headerFontSize);
    const line3Width = fontBold.widthOfTextAtSize(accruedHeaderLine3, headerFontSize);

    // Calculate line spacing (reduce headerHeight by 2px for tighter spacing)
    const lineSpacing = (headerHeight - 2) / 3 - 1.5;

    page.drawText(accruedHeaderLine1, {
        x: border4X + accruedColumnWidth / 2 - line1Width / 2,
        y: headerTextY + lineSpacing,
        size: headerFontSize,
        font: fontBold,
        color: COLORS.blackColor
    });

    page.drawText(accruedHeaderLine2, {
        x: border4X + accruedColumnWidth / 2 - line2Width / 2,
        y: headerTextY,
        size: headerFontSize,
        font: fontBold,
        color: COLORS.blackColor
    });

    page.drawText(accruedHeaderLine3, {
        x: border4X + accruedColumnWidth / 2 - line3Width / 2,
        y: headerTextY - lineSpacing + 0.5,
        size: headerFontSize,
        font: fontBold,
        color: COLORS.blackColor
    });

    // Draw text content (on top of everything)
    for (const [idx, item] of (transactions || []).entries()) {
        const rowY = currentY - idx * rowHeight;
        const textBaselineY = rowY - rowHeight / 2 - fontSize / 3;

        // Draw Date
        page.drawText(item?.date || '', {
            x: colDateX - 4,
            y: textBaselineY,
            size: fontSize,
            font,
            color: COLORS.darkColor
        });

        // Draw Description
        page.drawText(item?.description || '', {
            x: colDescX - 24,
            y: textBaselineY,
            size: fontSize,
            font,
            color: COLORS.darkColor
        });

        // Draw Amount (right-aligned)
        const amountText = `${item?.amount}${item?.action}`;
        const amountTextWidth = font.widthOfTextAtSize(amountText, fontSize);
        page.drawText(amountText, {
            x: colAmountX - amountTextWidth + (item?.action ? 17 : 10),
            y: textBaselineY,
            size: fontSize,
            font,
            color: COLORS.darkColor
        });

        // Draw Balance (right-aligned)
        const balanceText = `${item?.balance}${item?.action}`;
        const balanceTextWidth = font.widthOfTextAtSize(balanceText, fontSize);
        page.drawText(balanceText, {
            x: colBalanceX - balanceTextWidth + (item?.action ? 31 : 24),
            y: textBaselineY,
            size: fontSize,
            font,
            color: COLORS.darkColor
        });

        // Draw Fees if exists (right-aligned)
        if (item.fees !== null && item.fees !== undefined) {
            const feesText = item.fees.toString();
            const feesTextWidth = font.widthOfTextAtSize(feesText, fontSize);
            page.drawText(feesText, {
                x: colFeesX - feesTextWidth + (item?.action ? 18 : 11),
                y: textBaselineY,
                size: fontSize,
                font,
                color: COLORS.darkColor
            });
        }
    }

    renderFooter(page, font, fontBold, data, width, height, pageNumber, totalPages, tableWidth, borderColor, MARGIN_LEFT, MARGIN_RIGHT);
    if (isLastPage) {
        renderLastPageFooter(
            page,
            font,
            fontBold,
            data,
            width,
            height,
            currentY,
            tableHeight,
            tableWidth,
            MARGIN_LEFT,
            MARGIN_RIGHT,
            borderColor,
            pageNumber
        );
    }

    // Return the new Y position after the table
    return currentY - tableHeight - 10;
};
