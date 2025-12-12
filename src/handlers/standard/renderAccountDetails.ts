// renderAccountDetails.ts
import { PDFPage, PDFFont, rgb } from 'pdf-lib';
import { COLORS } from './constants';

export const renderAccountDetails = (
    page: PDFPage,
    data: {
        accountNumber: string;
        accountHolder: string;
        productName: string;
        address: string[];
        statementPeriod: { from: string; to: string };
    },
    fonts: { font: PDFFont; fontBold: PDFFont },
    position: { startY: number; gap: number; left: number; width: number; rightMargin: number }
) => {
    const { font, fontBold } = fonts;
    const { startY, gap, left, width, rightMargin } = position;
    const fontSize = 9;

    // Account details
    const rows: Array<[string, string]> = [
        ['Account number:', data.accountNumber],
        ['Account holder:', data.accountHolder],
        ['Product name:', data.productName]
    ];

    const maxLabelWidth = Math.max(...rows.map(([label]) => font.widthOfTextAtSize(label, fontSize)));
    const valueX = left + maxLabelWidth + 5;

    rows.forEach(([label, value], idx) => {
        const y = startY - gap * idx;
        page.drawText(label, { x: left, y, size: fontSize, font, color: COLORS.bankBlue });
        page.drawText(value, { x: valueX, y, size: fontSize, font: fontBold, color: COLORS.bankBlue });
    });

    // Address (right aligned)
    data.address.forEach((line, idx) => {
        const y = startY - (gap + 0.5) * idx;
        const textWidth = idx !== 0 ? fontBold.widthOfTextAtSize(line, fontSize + 1) : font.widthOfTextAtSize(line, fontSize);
        const xPos = width - rightMargin - textWidth;
        page.drawText(line, { x: xPos, y, size: idx === 0 ? fontSize : fontSize + 1, font: idx === 0 ? font : fontBold, color: COLORS.bankBlue });
    });

    // Statement period (right aligned)
    const dateRows: string[] = [`From: ${data.statementPeriod.from}`, `To: ${data.statementPeriod.to}`];

    dateRows.forEach((label, idx) => {
        const y = startY - (gap + 0.5) * idx + 47;
        const fontSizeUsed = fontSize - 1.5;
        const textWidth = font.widthOfTextAtSize(label, fontSizeUsed);
        const xPos = width - rightMargin - textWidth;
        page.drawText(label, { x: xPos, y, size: fontSizeUsed, font: font, color: COLORS.bankBlue });
    });
};
