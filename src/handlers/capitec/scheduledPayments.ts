import { PDFDocument, PDFFont, rgb, StandardFonts } from '@pdfme/pdf-lib';
import fs from 'fs';
import { mkdirp } from 'mkdirp';
import { COLORS } from '../standard/constants';
import { CapitecBankStatement } from './sample';

function formatNumberToCurrency(num: number): string {
    // Handle negative numbers
    const isNegative = num < 0;
    const absoluteNum = Math.abs(num);

    // Format with space as thousand separator and dot as decimal
    const parts = absoluteNum.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const decimalPart = parts[1];

    return `${isNegative ? '-' : ''}R${integerPart}.${decimalPart}`;
}

export async function generateScheduledPaymentsPDF(data: CapitecBankStatement) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { height, width } = page.getSize();
    const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 8;
    const gap = 12;
    const startY = height - 50;

    let currentY = startY;

    // Scheduled Payments header
    page.drawText('Scheduled Payments', { x: 34.5, y: currentY, size: fontSize, font: fontBold, color: COLORS.darkColor });
    currentY -= gap;

    // Card Subscriptions header
    page.drawText('Card Subscriptions', { x: 34.5, y: currentY, size: fontSize, font: fontBold, color: COLORS.darkColor });
    currentY -= gap;

    // Descriptions
    let descY = currentY;
    for (let idx = 0; idx < data.scheduled_payments.card_subscriptions.length; idx++) {
        page.drawText(data.scheduled_payments.card_subscriptions[idx].description, {
            x: 34.5,
            y: descY - gap * idx,
            size: fontSize,
            font,
            color: COLORS.darkColor
        });
    }

    // Amounts
    let amountY = descY - gap * data.scheduled_payments.card_subscriptions.length;
    for (let idx = 0; idx < data.scheduled_payments.card_subscriptions.length; idx++) {
        const amount = formatNumberToCurrency(data.scheduled_payments.card_subscriptions[idx].amount);
        const amountWidth = fontBold.widthOfTextAtSize(amount, fontSize);
        const amountX = width - 50 - amountWidth;
        page.drawText(amount, { x: amountX, y: amountY - gap * idx, size: fontSize, font: fontBold, color: COLORS.darkColor });
    }

    // Dates
    let dateY = amountY - gap * data.scheduled_payments.card_subscriptions.length;
    for (let idx = 0; idx < data.scheduled_payments.card_subscriptions.length; idx++) {
        const date = data.scheduled_payments.card_subscriptions[idx].date;
        const dateWidth = font.widthOfTextAtSize(date, fontSize);
        const dateX = width - 50 - dateWidth;
        page.drawText(date, { x: dateX, y: dateY - gap * idx, size: fontSize, font, color: COLORS.darkColor });
    }

    currentY = dateY - gap * data.scheduled_payments.card_subscriptions.length;

    // Debit Orders header
    page.drawText('Debit Orders', { x: 34.5, y: currentY, size: fontSize, font: fontBold, color: COLORS.darkColor });
    currentY -= gap;

    // Descriptions
    descY = currentY;
    for (let idx = 0; idx < data.scheduled_payments.debit_orders.length; idx++) {
        page.drawText(data.scheduled_payments.debit_orders[idx].description, {
            x: 34.5,
            y: descY - gap * idx,
            size: fontSize,
            font,
            color: COLORS.darkColor
        });
    }

    // Amounts
    amountY = descY - gap * data.scheduled_payments.debit_orders.length;
    for (let idx = 0; idx < data.scheduled_payments.debit_orders.length; idx++) {
        const amount = formatNumberToCurrency(data.scheduled_payments.debit_orders[idx].amount);
        const amountWidth = fontBold.widthOfTextAtSize(amount, fontSize);
        const amountX = width - 50 - amountWidth;
        page.drawText(amount, { x: amountX, y: amountY - gap * idx, size: fontSize, font: fontBold, color: COLORS.darkColor });
    }

    // Dates
    dateY = amountY - gap * data.scheduled_payments.debit_orders.length;
    for (let idx = 0; idx < data.scheduled_payments.debit_orders.length; idx++) {
        const date = data.scheduled_payments.debit_orders[idx].date;
        const dateWidth = font.widthOfTextAtSize(date, fontSize);
        const dateX = width - 50 - dateWidth;
        page.drawText(date, { x: dateX, y: dateY - gap * idx, size: fontSize, font, color: COLORS.darkColor });
    }

    mkdirp.sync('./files/capitec');
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('./files/capitec/scheduled_payments.pdf', pdfBytes);
}
