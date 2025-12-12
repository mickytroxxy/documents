import { PDFDocument, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import { mkdirp } from 'mkdirp';
import { TymeBankStatement } from './sample';
import { COLORS, TABLE_CONFIG } from '../standard/constants';

export async function generateTymeBankPDF(data: TymeBankStatement, outputFilePath: string) {
    const topOffset = 130;
    const lineGap = 16.7;
    const left = 30;
    const rightMargin = 30;
    const fontSize = 7.5;

    mkdirp.sync('./files/tymebank');

    // Load the first page template
    const firstPageBytes = fs.readFileSync('./files/tymebank/input.pdf');
    const firstPageUint8Array = new Uint8Array(firstPageBytes);
    const firstPageDoc = await PDFDocument.load(firstPageUint8Array);

    // Load the second page template (for additional pages)
    const secondPageBytes = fs.readFileSync('./files/tymebank/input2.pdf');
    const secondPageUint8Array = new Uint8Array(secondPageBytes);
    const secondPageDoc = await PDFDocument.load(secondPageUint8Array);

    // Create a new PDF document to hold all pages
    const finalPdfDoc = await PDFDocument.create();

    const font: PDFFont = await finalPdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold: PDFFont = await finalPdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Get page templates
    const firstPageTemplate = firstPageDoc.getPages()[0];
    const secondPageTemplate = secondPageDoc.getPages()[0];

    // Calculate page dimensions
    const { height: firstPageHeight } = firstPageTemplate.getSize();
    const { height: secondPageHeight } = secondPageTemplate.getSize();

    // Fixed: Use consistent Y positions
    const firstPageTableStartY = firstPageHeight - topOffset - 270; // Table start position for first page
    const secondPageTableStartY = secondPageHeight - 59; // Table start position for other pages
    const minY = 200; // Minimum Y before hitting stamps/footer

    const availableHeightFirstPage = firstPageTableStartY - minY;
    const availableHeightSecondPage = secondPageTableStartY - minY;

    // Process all pages with dynamic transaction fitting
    let transactionIndex = 0;
    let totalPages = 0;

    while (transactionIndex < data.transactions.length) {
        const isFirstPage = totalPages === 0;
        const availableHeight = isFirstPage ? availableHeightFirstPage : availableHeightSecondPage;
        const tableStartY = isFirstPage ? firstPageTableStartY : secondPageTableStartY;

        // Calculate how many transactions fit on THIS page based on ACTUAL row heights
        const pageTransactions = getTransactionsForPage(data.transactions.slice(transactionIndex), availableHeight, font, fontSize);

        // Copy the appropriate template page
        const sourceDoc = isFirstPage ? firstPageDoc : secondPageDoc;
        const [copiedPage] = await finalPdfDoc.copyPages(sourceDoc, [0]);

        if (totalPages === 0) {
            finalPdfDoc.addPage(copiedPage);
        } else {
            finalPdfDoc.insertPage(totalPages, copiedPage);
        }

        const currentPage = finalPdfDoc.getPages()[totalPages];
        const { height, width } = currentPage.getSize();

        // Calculate starting position based on page type
        const openingBalanceText = `${data?.opening_balance?.toFixed()}`;
        const openingBalanceWidth = font.widthOfTextAtSize(openingBalanceText, 8.2);
        const openingBalanceX = width - rightMargin - openingBalanceWidth;
        let startY: number;
        if (isFirstPage) {
            startY = height - topOffset;

            // Draw first page specific content
            const rows: Array<[string, string]> = [
                ['Number / Tax invoice number:', data.account_details?.tax_invoice_number],
                ['Period:', `${data.statement_period.from} - ${data.statement_period.to}`],
                ['Date:', data.statement_period.generation_date],
                ['Account Num:', data.account_details?.account_number],
                ['Branch Code:', data.account_details?.branch_code],
                ['Customer VAT Registration Number: ', 'Not Provided']
            ];

            currentPage.drawText(`${data?.account_holder}`, {
                x: 17.9,
                y: startY - 61.2,
                size: 8.2,
                color: rgb(0, 0, 0)
            });

            currentPage.drawText(`${data?.account_details?.account_number}`, {
                x: 100,
                y: startY - 194,
                size: 8.7,
                font: fontBold,
                color: rgb(0, 0, 0)
            });
            currentPage.drawText(openingBalanceText, {
                x: openingBalanceX + 4,
                y: startY - 242,
                size: 8.2,
                color: rgb(0, 0, 0)
            });

            const maxLabelWidth = Math.max(...rows.map(([label]) => font.widthOfTextAtSize(label, fontSize)));
            const valueX = left + maxLabelWidth + 5;

            rows.forEach(([label, value], idx) => {
                const y = startY - lineGap * idx - 63;
                currentPage.drawText(value, {
                    x: left + 408,
                    y,
                    size: fontSize,
                    font,
                    color: COLORS.blackColor
                });
                currentPage.drawText(label, {
                    x: valueX + 153,
                    y,
                    size: fontSize,
                    font,
                    color: COLORS.blackColor
                });
            });

            startY = startY - 280; // Table starting position
        } else {
            // Second+ pages start from the calculated position
            startY = tableStartY;

            currentPage.drawText(openingBalanceText, {
                x: openingBalanceX + 4,
                y: startY + 38,
                size: 8.2,
                color: rgb(0, 0, 0)
            });
        }

        // Render table with transactions for this page
        const tableOffsetX = TABLE_CONFIG.leftMargin;

        renderTable({
            page: currentPage,
            font,
            fontBold,
            data: {
                ...data,
                transactions: pageTransactions
            },
            startX: TABLE_CONFIG.leftMargin,
            startY,
            fontSize,
            gap: lineGap,
            rightMargin,
            width,
            isLastPage: transactionIndex + pageTransactions.length >= data.transactions.length
        });

        // Add legal text only on the very last page
        if (transactionIndex + pageTransactions.length >= data.transactions.length) {
            // Calculate position after table - need to calculate based on table height
            // Estimate table height based on number of transactions
            const estimatedTableHeight = pageTransactions.length * 17; // Average row height
            let legalTextY = startY - estimatedTableHeight - 25; // Start below the table

            // Add "All fees are inclusive of VAT at 15%" text (aligned with table)
            currentPage.drawText('All fees are inclusive of VAT at 15%', {
                x: tableOffsetX - 15,
                y: legalTextY,
                size: fontSize,
                color: rgb(0, 0, 0)
            });

            // Add vertical space (reduced to 20px)
            legalTextY -= 20;

            // Add the final paragraph (aligned with table)
            const finalParagraph =
                'Please inform us should you wish to query an entry in this statement. Should we not hear from you, we will assume that you have received the statement and that it is correct. We subscribe to the Code of Banking Practice of the Banking Association of South Africa and, for unresolved disputes, support resolution through the National Financial Ombud Scheme. This document serves as a Tax Invoice for the purposes of the Value-Added Tax Act 89 of 1991. Please refer to www.tymebank.co.za for details about the TymeBank terms and conditions.';

            // Draw final paragraph with word wrapping (aligned with table)
            const paragraphLines = wrapText({
                text: finalParagraph,
                maxWidth: width - 80, // Leave margins on both sides
                font,
                fontSize
            });

            paragraphLines.forEach((line, lineIndex) => {
                currentPage.drawText(line, {
                    x: tableOffsetX - 15,
                    y: legalTextY - lineIndex * (fontSize + 2),
                    size: fontSize,
                    color: rgb(0, 0, 0)
                });
            });
        }

        // Add page number if needed
        const estimatedTotalPages = Math.ceil(data.transactions.length / 25); // Rough estimate
        if (estimatedTotalPages > 1) {
            addPageNumber(currentPage, totalPages + 1, estimatedTotalPages, width, height, font);
        }

        transactionIndex += pageTransactions.length;
        totalPages++;
    }

    // Save the final merged PDF
    const pdfBytes = await finalPdfDoc.save();
    fs.writeFileSync(outputFilePath, pdfBytes);
    return outputFilePath;
    console.log(`Generated PDF with ${totalPages} pages, ${data.transactions.length} transactions`);
}

// NEW FUNCTION: Calculate which transactions fit on a page based on actual row heights
function getTransactionsForPage(transactions: any[], availableHeight: number, font: PDFFont, fontSize: number): any[] {
    const baseRowHeight = 17;
    const tallRowHeight = 27;
    const descriptionMaxWidth = 210;

    let currentHeight = 0;
    const pageTransactions = [];

    for (const tx of transactions) {
        // Calculate row height for THIS transaction
        const descLines = wrapText({
            text: tx.description,
            maxWidth: descriptionMaxWidth,
            font,
            fontSize
        });

        const descriptionWraps = descLines.length > 1;
        const isMoneyInRow = tx.money_in !== '-';

        let rowHeight = baseRowHeight;
        if (!isMoneyInRow && descriptionWraps) {
            rowHeight = tallRowHeight;
        }

        // Check if adding this transaction would exceed available height
        if (currentHeight + rowHeight > availableHeight) {
            break; // No more space on this page
        }

        pageTransactions.push(tx);
        currentHeight += rowHeight;
    }

    return pageTransactions;
}

function renderTable(options: {
    page: any;
    font: PDFFont;
    fontBold: PDFFont;
    data: TymeBankStatement;
    startX: number;
    startY: number;
    fontSize: number;
    gap: number;
    rightMargin: number;
    width: number;
    isLastPage?: boolean;
}) {
    const { page, font, width, data, startX, startY, fontSize, fontBold } = options;

    /* -----------------------------
       Layout Variables (Editable)
    ------------------------------*/
    const tableOffsetX = startX - 13.5; // Move entire table left/right
    const baseRowHeight = 17; // Height for money-in and 1-line rows
    const tallRowHeight = 27; // Height for wrapped-description rows

    const descriptionMaxWidth = 175; // Narrower wrap width = more natural TymeBank styling

    // Column positions
    const colDateX = tableOffsetX;
    const colDescX = tableOffsetX + 65;
    const colFeesX = tableOffsetX + 330;
    const colMoneyOutX = tableOffsetX + 380;
    const colMoneyInX = tableOffsetX + 430;
    const colBalanceX = tableOffsetX + 490;

    // Column widths for right alignment
    const colFeesWidth = 40;
    const colMoneyOutWidth = 40;
    const colMoneyInWidth = 40;
    const colBalanceWidth = 50;

    // Alternating row colors
    const rowLightGray = rgb(0.91, 0.91, 0.91);
    const rowWhite = rgb(1, 1, 1);

    /* -----------------------------
       Start Rendering
    ------------------------------*/
    let currentY = startY;

    // Render all transactions including the closing balance
    data.transactions.forEach((tx, index) => {
        /* -----------------------------
           1. Wrap Description
        ------------------------------*/
        const descLines = wrapText({
            text: tx.description,
            maxWidth: descriptionMaxWidth,
            font,
            fontSize
        });

        const descriptionWraps = descLines.length > 1;

        /* -----------------------------
           2. Row Height Logic
           TymeBank Style:
           - money_in rows ALWAYS short
           - wrapped rows tall (only when NO money_in)
        ------------------------------*/
        let rowHeight = baseRowHeight;

        if (descriptionWraps) {
            rowHeight = tallRowHeight;
        }

        /* -----------------------------
           3. Background Stripe
        ------------------------------*/
        const bgColor = index % 2 === 0 ? rowLightGray : rowWhite;

        page.drawRectangle({
            x: tableOffsetX,
            y: currentY - rowHeight + 3.3,
            width: width - 38,
            height: rowHeight,
            color: bgColor
        });

        /* -----------------------------
           4. Vertical Text Centering
        ------------------------------*/
        const textLineHeight = fontSize + 1;
        const linesToRender = Math.min(descLines.length, 2);

        const totalTextHeight = linesToRender * textLineHeight;

        const textStartY = currentY - rowHeight / 2 + totalTextHeight / 2 - fontSize / 2;

        /* -----------------------------
           5. Draw DATE
        ------------------------------*/
        page.drawText(tx.date, {
            x: colDateX + 8,
            y: textStartY,
            size: fontSize
        });

        /* -----------------------------
           6. Draw DESCRIPTION
        ------------------------------*/
        page.drawText(descLines[0], {
            x: colDescX + 11,
            y: textStartY,
            size: fontSize,
            font: tx.description === 'Closing Balance' ? fontBold : font
        });

        if (linesToRender > 1) {
            page.drawText(descLines[1], {
                x: colDescX + 11,
                y: textStartY - textLineHeight,
                size: fontSize,
                font: tx.description === 'Closing Balance' ? fontBold : font
            });
        }

        /* -----------------------------
           7. FEES (right aligned)
        ------------------------------*/
        if (tx.fees !== null && typeof tx.fees === 'number') {
            const feesText = formatAmount(tx.fees);
            const feesWidth = font.widthOfTextAtSize(feesText, fontSize);
            const color = tx.description === 'Closing Balance' ? rgb(0, 0, 0) : COLORS.blackColor;
            page.drawText(feesText, {
                x: colFeesX + colFeesWidth - feesWidth - 20,
                y: textStartY,
                size: fontSize,
                color: color
            });
        } else if (tx.fees !== null) {
            const feesWidth = font.widthOfTextAtSize(tx.fees, fontSize);
            page.drawText(tx.fees, {
                x: colFeesX + colFeesWidth - feesWidth - 20,
                y: textStartY,
                size: fontSize
            });
        }

        /* -----------------------------
           8. MONEY OUT (right aligned)
        ------------------------------*/
        if (tx.money_out !== null && typeof tx.money_out === 'number') {
            const moneyOutText = formatAmount(tx.money_out);
            const moneyOutWidth = font.widthOfTextAtSize(moneyOutText, fontSize);
            const color = tx.description === 'Closing Balance' ? rgb(0, 0, 0) : COLORS.blackColor;
            page.drawText(moneyOutText, {
                x: colMoneyOutX + colMoneyOutWidth - moneyOutWidth - 2.5,
                y: textStartY,
                size: fontSize,
                color: color
            });
        } else if (tx.money_out !== null) {
            const moneyOutWidth = font.widthOfTextAtSize(tx.money_out, fontSize);
            page.drawText(tx.money_out, {
                x: colMoneyOutX + colMoneyOutWidth - moneyOutWidth - 2.5,
                y: textStartY,
                size: fontSize
            });
        }

        /* -----------------------------
           9. MONEY IN (right aligned)
        ------------------------------*/
        if (tx.money_in !== null && typeof tx.money_in === 'number') {
            const moneyInText = formatAmount(tx.money_in);
            const moneyInWidth = font.widthOfTextAtSize(moneyInText, fontSize);
            const color = tx.description === 'Closing Balance' ? rgb(0, 0, 0) : COLORS.blackColor;
            page.drawText(moneyInText, {
                x: colMoneyInX + colMoneyInWidth - moneyInWidth + 14.5,
                y: textStartY,
                size: fontSize,
                color: color
            });
        } else if (tx.money_in !== null) {
            const moneyInWidth = font.widthOfTextAtSize(tx.money_in, fontSize);
            page.drawText(tx.money_in, {
                x: colMoneyInX + colMoneyInWidth - moneyInWidth + 14.5,
                y: textStartY,
                size: fontSize
            });
        }

        /* -----------------------------
           10. BALANCE (right aligned)
        ------------------------------*/
        const balText = formatAmount(tx.balance);
        const balWidth = font.widthOfTextAtSize(balText, fontSize);
        const color = tx.description === 'Closing Balance' ? rgb(0, 0, 0) : COLORS.blackColor;
        page.drawText(balText, {
            x: colBalanceX + colBalanceWidth - balWidth + 12,
            y: textStartY,
            size: fontSize,
            color: color,
            font: tx.description === 'Closing Balance' ? fontBold : font
        });

        /* -----------------------------
           11. Move to next row
        ------------------------------*/
        currentY -= rowHeight;

        // Add bottom border to the last row (closing balance row) - ONLY on last page
        if (index === data.transactions.length - 1 && options.isLastPage) {
            page.drawLine({
                start: { x: tableOffsetX, y: currentY + 3 },
                end: { x: tableOffsetX + (width - 38), y: currentY + 3 },
                thickness: 1,
                color: rgb(0, 0, 0),
                opacity: 1
            });
        }
    });
}

// Helper function to format amounts with spaces as thousands separators
function formatAmount(amount: number): string {
    // Convert to string with 2 decimal places
    let amountStr = amount.toFixed(2);

    // Split into whole and decimal parts
    const parts = amountStr.split('.');
    let wholePart = parts[0];
    const decimalPart = parts[1];

    // Add spaces as thousands separators
    wholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    return `${wholePart}.${decimalPart}`;
}

function addPageNumber(page: any, pageNum: number, totalPages: number, width: number, height: number, font: PDFFont) {
    const pageText = `Page ${pageNum} of ${totalPages}`;
    const textWidth = font.widthOfTextAtSize(pageText, 8);

    page.drawText(pageText, {
        x: width - textWidth - 15,
        y: 17,
        size: 8,
        font: font,
        color: COLORS.blackColor
    });
}

function wrapText({ text, maxWidth, font, fontSize }: { text: string; maxWidth: number; font: PDFFont; fontSize: number }): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
}
