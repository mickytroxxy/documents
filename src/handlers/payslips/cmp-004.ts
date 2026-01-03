// generatePayslip_sanlam.ts
// @ts-ignore
import fontkit from 'fontkit';
import fs from 'fs';
import path from 'path';
import { mkdirp } from 'mkdirp';
import { PDFDocument, PDFFont, rgb, StandardFonts } from '@pdfme/pdf-lib';
import { PayslipData } from '../standard/types';

const COLORS = {
    primary: rgb(0.08, 0.28, 0.54), // Sanlam-style blue
    border: rgb(0.78, 0.82, 0.86),
    text: rgb(0.1, 0.12, 0.16),
    muted: rgb(0.32, 0.36, 0.4)
};

const CARD_RADIUS = 8;

export const generatePayslip4PDF = async (payslip: PayslipData, index: number, outputDir?: string): Promise<string> => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    //
    // HEADER
    //
    const title = (payslip.employer.name || 'PAYSLIP').toUpperCase();
    const titleWidth = fontBold.widthOfTextAtSize(title, 18);

    page.drawText(title, {
        x: (width - titleWidth) / 2,
        y: height - 70,
        size: 18,
        font: fontBold,
        color: COLORS.primary
    });

    page.drawLine({
        start: { x: 40, y: height - 82 },
        end: { x: width - 40, y: height - 82 },
        thickness: 1.2,
        color: COLORS.border
    });

    //
    // META ROW
    //
    const metaY = height - 115;

    const metaItem = (label: string, value: string, x: number) => {
        page.drawText(label, {
            x,
            y: metaY + 18,
            size: 9,
            font: fontBold,
            color: COLORS.muted
        });

        page.drawText(value || '-', {
            x,
            y: metaY,
            size: 10,
            font,
            color: COLORS.text
        });
    };

    metaItem('Payslip No', payslip.payslipNumber || '-', 40);
    metaItem('Pay Period', payslip.payPeriod || '-', 220);
    metaItem('Pay Date', payslip.payDate || '-', 465);

    //
    // SECTION CARD FACTORY
    //
    const card = (x: number, y: number, w: number, h: number, title: string) => {
        page.drawRectangle({
            x,
            y,
            width: w,
            height: h,
            borderWidth: 1,
            borderColor: COLORS.border,
            radius: CARD_RADIUS
        });

        page.drawText(title, {
            x: x + 12,
            y: y + h - 18,
            size: 10.5,
            font: fontBold,
            color: COLORS.primary
        });

        page.drawLine({
            start: { x: x + 10, y: y + h - 24 },
            end: { x: x + w - 10, y: y + h - 24 },
            thickness: 0.8,
            color: COLORS.border
        });
    };

    //
    // EMPLOYEE + EMPLOYER CARDS
    //
    const topY = metaY - 120;
    const colW = (width - 80) / 2;

    // Employee
    card(40, topY, colW, 105, 'Employee Details');

    [
        `Name: ${payslip.employee.name}`,
        `Employee No: ${payslip.employee.employeeNumber}`,
        `ID Number: ${payslip.employee.idNumber}`,
        `Department: ${payslip.employee.department}`
    ].forEach((t, i) =>
        page.drawText(t, {
            x: 52,
            y: topY + 70 - i * 16,
            size: 9.5,
            font,
            color: COLORS.text
        })
    );

    // Employer
    card(60 + colW, topY, colW, 105, 'Employer Details');

    [
        `Company: ${payslip.employer.name}`,
        `Reg No: ${payslip.employer.registrationNumber}`,
        `Email: ${payslip.employer.email}`,
        `Tel: ${payslip.employer.phone}`
    ].forEach((t, i) =>
        page.drawText(t, {
            x: 72 + colW,
            y: topY + 70 - i * 16,
            size: 9.5,
            font,
            color: COLORS.text
        })
    );

    //
    // TABLE SECTION HEADER
    //
    const tableHeader = (label: string, y: number) => {
        page.drawText(label, {
            x: 40,
            y,
            size: 11,
            font: fontBold,
            color: COLORS.primary
        });

        page.drawLine({
            start: { x: 40, y: y - 4 },
            end: { x: width - 40, y: y - 4 },
            thickness: 0.8,
            color: COLORS.border
        });
    };

    //
    // EARNINGS
    //
    let y = topY - 35;

    tableHeader('Earnings', y);
    y -= 20;

    payslip.income.forEach((row) => {
        page.drawText(row.description, {
            x: 40,
            y,
            size: 9.5,
            font,
            color: COLORS.text
        });

        const amt = `R ${row.amount.toFixed(2)}`;
        const w = font.widthOfTextAtSize(amt, 9.5);

        page.drawText(amt, {
            x: width - 40 - w,
            y,
            size: 9.5,
            font,
            color: COLORS.text
        });

        y -= 16;
    });

    //
    // DEDUCTIONS
    //
    y -= 12;
    tableHeader('Deductions', y);
    y -= 20;

    payslip.deductions.forEach((row) => {
        page.drawText(row.description, {
            x: 40,
            y,
            size: 9.5,
            font,
            color: COLORS.text
        });

        const amt = `R ${row.amount.toFixed(2)}`;
        const w = font.widthOfTextAtSize(amt, 9.5);

        page.drawText(amt, {
            x: width - 40 - w,
            y,
            size: 9.5,
            font,
            color: COLORS.text
        });

        y -= 16;
    });

    //
    // PAY SUMMARY — FIXED LAYOUT (NO OVERLAP)
    //
    const paySummaryHeight = 95;
    const paymentDetailsHeight = 105;
    const sectionSpacing = 24;

    y -= 20;

    const paySummaryBottomY = y - paySummaryHeight;

    card(40, paySummaryBottomY, width - 80, paySummaryHeight, 'Pay Summary');

    page.drawText(`Gross Pay: R ${payslip.totals.grossPay.toFixed(2)}`, { x: 52, y: paySummaryBottomY + 60, size: 10, font, color: COLORS.text });

    page.drawText(`Total Deductions: R ${payslip.totals.totalDeductions.toFixed(2)}`, {
        x: 52,
        y: paySummaryBottomY + 42,
        size: 10,
        font,
        color: COLORS.text
    });

    const net = `Net Pay: R ${payslip.totals.netPay.toFixed(2)}`;
    const nw = fontBold.widthOfTextAtSize(net, 11);

    page.drawText(net, {
        x: width - 52 - nw,
        y: paySummaryBottomY + 48,
        size: 11,
        font: fontBold,
        color: COLORS.primary
    });

    //
    // PAYMENT DETAILS — SAFELY BELOW SUMMARY
    //
    const payY = paySummaryBottomY - sectionSpacing - paymentDetailsHeight;

    card(40, payY + 10, width - 80, paymentDetailsHeight, 'Payment Details');

    [
        `Method: ${payslip.paymentDetails.paymentMethod}`,
        `Payment Date: ${payslip.paymentDetails.paymentDate}`,
        `Bank: ${payslip.paymentDetails.bankName}`,
        `Account: ${payslip.paymentDetails.accountNumber}`,
        `Reference: ${payslip.paymentDetails.reference}`
    ].forEach((t, i) =>
        page.drawText(t, {
            x: 52,
            y: payY + 78 - i * 15,
            size: 9.5,
            font,
            color: COLORS.text
        })
    );

    //
    // SAVE
    //
    const pdfBytes = await pdfDoc.save();
    const dir = outputDir || path.join('generated', 'payslips_sanlam');
    await mkdirp(dir);

    const filePath = path.join(dir, `${payslip.payslipNumber || 'Payslip'}-${index + 1}.pdf`);

    fs.writeFileSync(filePath, pdfBytes);
    return filePath;
};
