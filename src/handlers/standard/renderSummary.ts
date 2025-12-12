// renderSummary.ts
import { PDFPage, PDFFont } from 'pdf-lib';
import { COLORS } from './constants';

export const renderSummary = (
    page: PDFPage,
    summary: { totalPayments: string; totalDeposits: string; availableBalance?: string },
    fonts: { fontBold: PDFFont; font: PDFFont },
    position: { y: number; left: number; width: number; rightMargin: number }
) => {
    const { fontBold, font } = fonts;
    const { y, left, width, rightMargin } = position;
    const fontSize = 9;

    // Header (moved up by 50px)
    const yOffset = 20;
    page.drawText('Statement Summary', {
        x: left,
        y: y + yOffset,
        size: 10,
        font: fontBold,
        color: COLORS.bankBlue
    });

    // Box dimensions (compact to match screenshot)
    const boxX = left;
    // reduce the box width so it renders narrower on the page
    const boxWidth = Math.min(180, width - left - rightMargin);
    const rowHeight = 28;
    const boxHeight = rowHeight * 2 + 8;
    const boxY = y - 18 - boxHeight + yOffset; // place box below header (moved up by yOffset)

    // Draw outer box border
    page.drawRectangle({
        x: boxX,
        y: boxY,
        width: boxWidth,
        height: boxHeight,
        borderColor: COLORS.whiteBorderColor,
        borderWidth: 0.5,
        color: COLORS.whiteColor
    });

    // Row Y positions
    const row1Y = boxY + boxHeight - rowHeight - 6; // Payments row
    const row2Y = boxY + boxHeight - rowHeight * 2 - 6; // Deposits row

    // Draw a slightly darker, thicker horizontal separator between the two rows (inside the box)
    const separatorY = row2Y + rowHeight + 2;
    // use a slightly darker gray and increase height so the line doesn't visually fade
    page.drawRectangle({ x: boxX + 1, y: separatorY, width: boxWidth - 2, height: 0.5, color: COLORS.whiteBorderColor });

    // Debug: print the boxWidth and separatorY so you can see these values when running the generator
    // (This will appear in the server/console output)
    // Example output: renderSummary: boxWidth=220, separatorY=610.20
    try {
        // eslint-disable-next-line no-console
        console.log(`renderSummary: boxWidth=${boxWidth}, separatorY=${separatorY}`);
    } catch (e) {
        // ignore logging errors in environments without console
    }

    // Labels (left column) and value boxes (right), vertically centered in each row
    const valueBoxWidth = 80;
    const valueBoxHeight = 18;
    const valueBoxPad = 6;
    const valueBoxX = boxX + boxWidth - valueBoxWidth - 12;

    const rowCenterY = (rY: number) => rY + rowHeight / 2;
    const textBaseline = (centerY: number) => centerY - fontSize / 2 + 4;

    // Payments row
    const paymentsCenter = rowCenterY(row1Y);
    const paymentsTextY = textBaseline(paymentsCenter);
    page.drawText('Payments', { x: boxX + 12, y: paymentsTextY, size: fontSize, font, color: COLORS.bankBlue });
    // draw value box vertically centered
    const payBoxY = paymentsCenter - valueBoxHeight / 2;
    page.drawRectangle({ x: valueBoxX, y: payBoxY, width: valueBoxWidth, height: valueBoxHeight, color: COLORS.whiteColor });
    const payText = `-R${summary.totalPayments}`;
    const payTextWidth = font.widthOfTextAtSize(payText, fontSize);
    page.drawText(payText, {
        x: valueBoxX + valueBoxWidth - payTextWidth - valueBoxPad,
        y: paymentsTextY,
        size: fontSize,
        font,
        color: COLORS.redColor
    });

    // Deposits row
    const depositsCenter = rowCenterY(row2Y);
    const depositsTextY = textBaseline(depositsCenter);
    page.drawText('Deposits', { x: boxX + 12, y: depositsTextY, size: fontSize, font, color: COLORS.bankBlue });
    const depBoxY = depositsCenter - valueBoxHeight / 2;
    page.drawRectangle({ x: valueBoxX, y: depBoxY, width: valueBoxWidth, height: valueBoxHeight, color: COLORS.whiteColor });
    const depText = `R${summary.totalDeposits}`;
    const depTextWidth = font.widthOfTextAtSize(depText, fontSize);
    page.drawText(depText, {
        x: valueBoxX + valueBoxWidth - depTextWidth - valueBoxPad,
        y: depositsTextY,
        size: fontSize,
        font,
        color: COLORS.greenColor
    });

    // Small bold note under the box
    const noteY = boxY - 16;
    page.drawText("Today's debits have not yet been paid", { x: boxX, y: noteY, size: 10, font: fontBold, color: COLORS.blackColor });
};
