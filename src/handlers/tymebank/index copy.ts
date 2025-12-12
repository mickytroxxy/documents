import { PDFDocument, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import { mkdirp } from 'mkdirp';
import { TymeBankStatement } from './sample';
import { COLORS, TABLE_CONFIG } from '../standard/constants';

export async function generateTymeBankPDF(data: TymeBankStatement) {
    const topOffset = 130;
    const lineGap = 16.7;
    const left = 30;
    const rightMargin = 30;
    const fontSize = 7.5;

    mkdirp.sync('./files/tymebank');
    const existingPdfBytes = fs.readFileSync('./files/tymebank/input.pdf');
    const formPdfUint8Array = new Uint8Array(existingPdfBytes);
    const pdfDoc = await PDFDocument.load(formPdfUint8Array);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const { height, width } = firstPage.getSize();
    const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const startY = height - topOffset;
    const gap = lineGap;

    const rows: Array<[string, string]> = [
        ['Number / Tax invoice number:', data.account_details?.tax_invoice_number],
        ['Period:', `${data.statement_period.from} - ${data.statement_period.to}`],
        ['Date:', data.statement_period.generation_date],
        ['Account Num:', data.account_details?.account_number],
        ['Branch Code:', data.account_details?.branch_code],
        ['Customer VAT Registration Number: ', 'Not Provided']
    ];
    firstPage.drawText(`${data?.account_holder}`, { x: 17.9, y: startY - 61.2, size: 8.2, color: rgb(0, 0, 0) });
    firstPage.drawText(`${data?.account_details?.account_number}`, { x: 100, y: startY - 194, size: 8.7, font: fontBold, color: rgb(0, 0, 0) });
    const openingBalanceText = `${data?.opening_balance}.00`;
    const openingBalanceWidth = font.widthOfTextAtSize(openingBalanceText, 8.2);
    const openingBalanceX = width - rightMargin - openingBalanceWidth;
    firstPage.drawText(openingBalanceText, { x: openingBalanceX + 4, y: startY - 242, size: 8.2, color: rgb(0, 0, 0) });
    const maxLabelWidth = Math.max(...rows.map(([label]) => font.widthOfTextAtSize(label, fontSize)));
    const valueX = left + maxLabelWidth + 5;

    rows.forEach(([label, value], idx) => {
        const y = startY - gap * idx - 63;
        firstPage.drawText(value, { x: left + 408, y, size: fontSize, font, color: COLORS.blackColor });
        firstPage.drawText(label, { x: valueX + 153, y, size: fontSize, font, color: COLORS.blackColor });
    });
    renderTable({
        page: firstPage,
        font,
        fontBold,
        data,
        startX: TABLE_CONFIG.leftMargin,
        startY: startY - 280,
        fontSize,
        gap,
        rightMargin,
        width
    });

    // ✅ NOW save the PDF
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('./files/tymebank/tymebank-output.pdf', pdfBytes);
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
}) {
    const { page, font, width, data, startX, startY, fontSize } = options;

    /* -----------------------------
       Layout Variables (Editable)
    ------------------------------*/
    const tableOffsetX = startX - 13.5; // Move entire table left/right
    const baseRowHeight = 17; // Height for money-in and 1-line rows
    const tallRowHeight = 27; // Height for wrapped-description rows

    const descriptionMaxWidth = 210; // Narrower wrap width = more natural TymeBank styling

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
        const isMoneyInRow = tx.money_in !== '-';

        /* -----------------------------
           2. Row Height Logic
           TymeBank Style:
           - money_in rows ALWAYS short
           - wrapped rows tall (only when NO money_in)
        ------------------------------*/
        let rowHeight = baseRowHeight;

        if (!isMoneyInRow && descriptionWraps) {
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
            size: fontSize
        });

        if (linesToRender > 1) {
            page.drawText(descLines[1], {
                x: colDescX + 11,
                y: textStartY - textLineHeight,
                size: fontSize
            });
        }

        /* -----------------------------
           7. FEES (right aligned)
        ------------------------------*/
        if (tx.fees !== null && typeof tx.fees === 'number') {
            const feesText = tx.fees.toFixed(2);
            const feesWidth = font.widthOfTextAtSize(feesText, fontSize);
            page.drawText(feesText, {
                x: colFeesX + colFeesWidth - feesWidth - 20,
                y: textStartY,
                size: fontSize
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
            const moneyOutText = tx.money_out.toFixed(2);
            const moneyOutWidth = font.widthOfTextAtSize(moneyOutText, fontSize);
            page.drawText(moneyOutText, {
                x: colMoneyOutX + colMoneyOutWidth - moneyOutWidth - 2.5,
                y: textStartY,
                size: fontSize
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
            const moneyInText = tx.money_in.toFixed(2);
            const moneyInWidth = font.widthOfTextAtSize(moneyInText, fontSize);
            page.drawText(moneyInText, {
                x: colMoneyInX + colMoneyInWidth - moneyInWidth + 14.5,
                y: textStartY,
                size: fontSize
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
        const balText = tx.balance.toFixed(2);
        const balWidth = font.widthOfTextAtSize(balText, fontSize);
        page.drawText(balText, {
            x: colBalanceX + colBalanceWidth - balWidth + 12,
            y: textStartY,
            size: fontSize
        });

        /* -----------------------------
           11. Move to next row
        ------------------------------*/
        currentY -= rowHeight;
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
