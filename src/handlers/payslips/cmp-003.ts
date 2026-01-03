// generatePayslip_new.ts
// @ts-ignore
import fontkit from 'fontkit';
import fs from 'fs';
import path from 'path';
import { mkdirp } from 'mkdirp';
import { PDFDocument, PDFFont, rgb, StandardFonts } from '@pdfme/pdf-lib';
import { PayslipData } from '../standard/types';

//
// COLOR SYSTEM — Dark-Teal Corporate Theme
//
const COLORS = {
    background: rgb(0.94, 0.97, 0.97), // soft teal-tint background
    panel: rgb(1, 1, 1), // card white
    primary: rgb(0.0, 0.32, 0.34), // dark teal
    secondary: rgb(0.22, 0.56, 0.58), // teal accent
    accent: rgb(0.85, 0.72, 0.28), // muted gold accent
    border: rgb(0.55, 0.65, 0.65), // teal-gray border
    text: rgb(0.05, 0.08, 0.1), // charcoal
    muted: rgb(0.45, 0.48, 0.52),
    positive: rgb(0.0, 0.45, 0.25),
    negative: rgb(0.75, 0.05, 0.1),
    badge: rgb(0.9, 0.96, 0.96), // soft teal badge
    lightPanel: rgb(0.88, 0.95, 0.95) // panel fill alt
};

//
// RADIUS SYSTEM
//
const CARD_RADIUS = 10;
const PANEL_RADIUS = 8;
const ROW_RADIUS = 4;

export const generatePayslip3PDF = async (payslip: PayslipData, index: number, outputDir?: string): Promise<string> => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Portrait
    const { width, height } = page.getSize();

    const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    //
    // BACKGROUND
    //
    page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: COLORS.background
    });

    //
    // OUTER FRAME CARD
    //
    page.drawRectangle({
        x: 10,
        y: 10,
        width: width - 20,
        height: height - 20,
        borderWidth: 1.2,
        borderColor: COLORS.primary,
        color: COLORS.panel,
        radius: CARD_RADIUS
    });

    //
    // HEADER BAR — ROUNDED
    //
    const headerHeight = 60;

    page.drawRectangle({
        x: 15,
        y: height - headerHeight - 15,
        width: width - 30,
        height: headerHeight,
        color: COLORS.primary,
        radius: CARD_RADIUS
    });

    const companyText = (payslip.employer?.name || 'PAYROLL DOCUMENT').toUpperCase();
    const companyWidth = fontBold.widthOfTextAtSize(companyText, 20);

    page.drawText(companyText, {
        x: (width - companyWidth) / 2,
        y: height - 48,
        size: 20,
        font: fontBold,
        color: COLORS.badge
    });

    //
    // META TAGS (PAYSLIP / PERIOD / DATE)
    //
    const metaY = height - headerHeight - 55;

    const drawTag = (label: string, value: string, x: number) => {
        const text = `${label} ${value}`;

        page.drawRectangle({
            x,
            y: metaY,
            width: x !== 405 ? 180 : 160,
            height: 28,
            color: COLORS.badge,
            borderColor: COLORS.border,
            borderWidth: 1,
            radius: PANEL_RADIUS
        });

        page.drawText(text, {
            x: x + 10,
            y: metaY + 9,
            size: 9,
            font,
            color: COLORS.secondary
        });
    };

    drawTag('PAYSLIP #:', payslip.payslipNumber || '-', 25);
    drawTag('', payslip.payPeriod || '-', 215);
    drawTag('PAY DATE:', payslip.payDate || '-', 405);

    //
    // CARD FUNCTION
    //
    const drawCard = (x: number, y: number, w: number, h: number) => {
        page.drawRectangle({
            x,
            y,
            width: w,
            height: h,
            color: COLORS.lightPanel,
            borderColor: COLORS.secondary,
            borderWidth: 1,
            radius: CARD_RADIUS
        });
    };

    //
    // EMPLOYEE + EMPLOYER CARDS
    //
    const cardTop = metaY - 120;
    const colWidth = (width - 70) / 2;

    // EMPLOYEE
    drawCard(25, cardTop, colWidth, 115);

    page.drawText('EMPLOYEE', {
        x: 35,
        y: cardTop + 92,
        size: 11,
        font: fontBold,
        color: COLORS.primary
    });

    [
        `Name: ${payslip.employee.name}`,
        `Employee No: ${payslip.employee.employeeNumber}`,
        `ID Number: ${payslip.employee.idNumber}`,
        `Department: ${payslip.employee.department}`
    ].forEach((t, i) =>
        page.drawText(t, {
            x: 35,
            y: cardTop + 72 - i * 16,
            size: 9,
            font,
            color: COLORS.text
        })
    );

    // EMPLOYER
    drawCard(40 + colWidth, cardTop, colWidth, 115);

    page.drawText('EMPLOYER', {
        x: 50 + colWidth,
        y: cardTop + 92,
        size: 11,
        font: fontBold,
        color: COLORS.primary
    });

    [
        `Company: ${payslip.employer.name}`,
        `Reg No: ${payslip.employer.registrationNumber}`,
        `Email: ${payslip.employer.email}`,
        `Tel: ${payslip.employer.phone}`
    ].forEach((t, i) =>
        page.drawText(t, {
            x: 50 + colWidth,
            y: cardTop + 72 - i * 16,
            size: 9,
            font,
            color: COLORS.text
        })
    );

    //
    // EARNINGS TABLE — ROUNDED HEADER BAR
    //
    let tableY = cardTop - 45;

    page.drawRectangle({
        x: 25,
        y: tableY,
        width: width - 50,
        height: 26,
        color: COLORS.primary,
        radius: PANEL_RADIUS
    });

    page.drawText('EARNINGS', {
        x: 35,
        y: tableY + 8,
        size: 10,
        font: fontBold,
        color: COLORS.badge
    });

    const amountHeader = 'AMOUNT (ZAR)';
    const ahw = fontBold.widthOfTextAtSize(amountHeader, 10);

    page.drawText(amountHeader, {
        x: width - 35 - ahw,
        y: tableY + 8,
        size: 10,
        font: fontBold,
        color: COLORS.badge
    });

    //
    // EARNINGS ROWS
    //
    payslip.income.forEach((row, i) => {
        const y = tableY - 24 - i * 22;

        // alternating teal background rows
        if (i % 2 === 0) {
            page.drawRectangle({
                x: 25,
                y,
                width: width - 50,
                height: 20,
                color: COLORS.lightPanel,
                radius: ROW_RADIUS
            });
        }

        page.drawText(row.description, {
            x: 35,
            y: y + 6,
            size: 9,
            font,
            color: COLORS.text
        });

        const amt = `R ${row.amount.toFixed(2)}`;
        const aw = font.widthOfTextAtSize(amt, 9);

        page.drawText(amt, {
            x: width - 35 - aw,
            y: y + 6,
            size: 9,
            font,
            color: COLORS.positive
        });
    });

    //
    // DEDUCTIONS TABLE
    //
    const deductionsY = tableY - 40 - payslip.income.length * 22;

    page.drawRectangle({
        x: 25,
        y: deductionsY,
        width: width - 50,
        height: 26,
        color: COLORS.primary,
        radius: PANEL_RADIUS
    });

    page.drawText('DEDUCTIONS', {
        x: 35,
        y: deductionsY + 8,
        size: 10,
        font: fontBold,
        color: COLORS.badge
    });

    page.drawText(amountHeader, {
        x: width - 35 - ahw,
        y: deductionsY + 8,
        size: 10,
        font: fontBold,
        color: COLORS.badge
    });

    payslip.deductions.forEach((row, i) => {
        const y = deductionsY - 24 - i * 22;

        if (i % 2 === 0) {
            page.drawRectangle({
                x: 25,
                y,
                width: width - 50,
                height: 20,
                color: COLORS.panel,
                radius: ROW_RADIUS
            });
        }

        page.drawText(row.description, {
            x: 35,
            y: y + 6,
            size: 9,
            font,
            color: COLORS.text
        });

        const amt = `R ${row.amount.toFixed(2)}`;
        const aw = font.widthOfTextAtSize(amt, 9);

        page.drawText(amt, {
            x: width - 35 - aw,
            y: y + 6,
            size: 9,
            font,
            color: COLORS.negative
        });
    });

    //
    // TOTALS SUMMARY — ROUNDED CARD
    //
    const totalsY = deductionsY - 120 - payslip.deductions.length * 22;

    page.drawRectangle({
        x: 25,
        y: totalsY,
        width: width - 50,
        height: 90,
        borderWidth: 2,
        borderColor: COLORS.secondary,
        color: COLORS.panel,
        radius: CARD_RADIUS
    });

    page.drawText('PAY SUMMARY', {
        x: 35,
        y: totalsY + 68,
        size: 11,
        font: fontBold,
        color: COLORS.primary
    });

    [
        `Gross Pay: R ${payslip.totals.grossPay.toFixed(2)}`,
        `Total Deductions: R ${payslip.totals.totalDeductions.toFixed(2)}`,
        `Net Pay: R ${payslip.totals.netPay.toFixed(2)}`
    ].forEach((t, i) =>
        page.drawText(t, {
            x: 35,
            y: totalsY + 50 - i * 18,
            size: 9.5,
            font,
            color: COLORS.text
        })
    );

    //
    // PAYMENT DETAILS — ROUNDED PANEL
    //
    const payY = totalsY - 125;

    page.drawRectangle({
        x: 25,
        y: payY,
        width: width - 50,
        height: 110,
        borderWidth: 1,
        borderColor: COLORS.secondary,
        color: COLORS.lightPanel,
        radius: CARD_RADIUS
    });

    page.drawText('PAYMENT DETAILS', {
        x: 35,
        y: payY + 84,
        size: 11,
        font: fontBold,
        color: COLORS.primary
    });

    [
        `Method: ${payslip.paymentDetails.paymentMethod}`,
        `Payment Date: ${payslip.paymentDetails.paymentDate}`,
        `Bank: ${payslip.paymentDetails.bankName}`,
        `Account: ${payslip.paymentDetails.accountNumber}`,
        `Reference: ${payslip.paymentDetails.reference}`
    ].forEach((t, i) =>
        page.drawText(t, {
            x: 35,
            y: payY + 64 - i * 15,
            size: 9,
            font,
            color: COLORS.text
        })
    );

    //
    // SAVE FILE
    //
    const pdfBytes = await pdfDoc.save();
    const dir = outputDir || path.join('generated', 'payslips');
    await mkdirp(dir);

    const filePath = path.join(dir, `${payslip.payslipNumber || 'Payslip'}-${index + 1}.pdf`);

    fs.writeFileSync(filePath, pdfBytes);
    return filePath;
};
