// @ts-ignore
import fontkit from 'fontkit';
import fs from 'fs';
import path from 'path';
import { mkdirp } from 'mkdirp';
import { PDFDocument, PDFFont, rgb, StandardFonts, degrees } from '@pdfme/pdf-lib';
import { PayslipData } from '../standard/types';

const COLORS = {
    ink: rgb(0, 0, 0),
    primary: rgb(0 / 255, 70 / 255, 110 / 255), // deep corporate teal-navy
    rule: rgb(0.82, 0.82, 0.82),
    positive: rgb(0, 0.55, 0),
    negative: rgb(0.75, 0, 0)
};

export const generatePayslip6PDF = async (payslip: PayslipData, index: number, outputDir?: string): Promise<string> => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    const { width, height } = page.getSize();

    const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    //
    // LEFT IDENTITY BAR
    //
    page.drawRectangle({
        x: 10,
        y: 40,
        width: 18,
        height: height - 80,
        color: COLORS.primary,
        radius: 10
    });

    //
    // HEADER — COMPANY + PERIOD
    //
    const company = (payslip.employer.name || 'COMPANY NAME').toUpperCase();
    const cw = fontBold.widthOfTextAtSize(company, 18);

    page.drawText(company, {
        x: 40,
        y: height - 60,
        size: 18,
        font: fontBold,
        color: COLORS.primary
    });

    page.drawText(`PAYSLIP`, {
        x: width - 98,
        y: height - 50,
        size: 14,
        font: fontBold,
        color: COLORS.ink
    });

    page.drawText(`PERIOD: ${payslip.payPeriod}`, {
        x: width - 261.5,
        y: height - 70,
        size: 10,
        font,
        color: COLORS.ink
    });

    //
    // TOP-RIGHT NET PAY PANEL
    //
    const netBoxY = height - 150;

    page.drawRectangle({
        x: width - 210,
        y: netBoxY + 20,
        width: 170,
        height: 50,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        color: rgb(1, 1, 1)
    });

    page.drawText('NET PAY', {
        x: width - 195,
        y: netBoxY + 55,
        size: 11,
        font: fontBold,
        color: COLORS.primary
    });

    const net = `R ${payslip.totals.netPay.toFixed(2)}`;
    const nw = fontBold.widthOfTextAtSize(net, 16);

    page.drawText(net, {
        x: width - 195,
        y: netBoxY + 28,
        size: 16,
        font: fontBold,
        color: COLORS.ink
    });

    //
    // SECTION: EMPLOYEE PROFILE
    //
    let y = height - 170;

    const drawSectionTitle = (label: string, y: number) => {
        page.drawText(label, {
            x: 40,
            y,
            size: 11,
            font: fontBold,
            color: COLORS.primary
        });

        page.drawLine({
            start: { x: 40, y: y - 8 },
            end: { x: width - 40, y: y - 8 },
            thickness: 0.8,
            color: COLORS.rule
        });
    };

    drawSectionTitle('EMPLOYEE INFORMATION', y);

    const infoLines = [
        `Name: ${payslip.employee.name}`,
        `Employee No: ${payslip.employee.employeeNumber}`,
        `ID Number: ${payslip.employee.idNumber}`,
        `Department: ${payslip.employee.department}`,
        `Tax Reference: ${payslip.employee.taxReference}`
    ];

    infoLines.forEach((t, i) => {
        page.drawText(t, {
            x: 40,
            y: y - 20 - i * 14,
            size: 9.5,
            font,
            color: COLORS.ink
        });
    });

    y -= 120;

    //
    // SECTION: EMPLOYER INFORMATION
    //
    drawSectionTitle('EMPLOYER INFORMATION', y);

    const employerLines = [
        `Company: ${payslip.employer.name}`,
        `Registration: ${payslip.employer.registrationNumber}`,
        `Email: ${payslip.employer.email}`,
        `Telephone: ${payslip.employer.phone}`,
        `Address: ${payslip.employer.address}`
    ];

    employerLines.forEach((t, i) => {
        page.drawText(t, {
            x: 40,
            y: y - 20 - i * 14,
            size: 9.5,
            font,
            color: COLORS.ink
        });
    });

    y -= 120;

    //
    // LEDGER TABLE — EARNINGS
    //
    drawSectionTitle('EARNINGS LEDGER', y);

    let ty = y - 28;

    const drawLedgerRow = (label: string, amount: number, rowY: number, color: any) => {
        page.drawLine({
            start: { x: 40, y: rowY - 8 },
            end: { x: width - 40, y: rowY - 8 },
            thickness: 0.4,
            color: COLORS.rule
        });

        page.drawText(label, {
            x: 40,
            y: rowY,
            size: 9.5,
            font,
            color: COLORS.ink
        });

        const txt = `R ${amount.toFixed(2)}`;
        const tw = font.widthOfTextAtSize(txt, 9.5);

        page.drawText(txt, {
            x: width - 40 - tw,
            y: rowY,
            size: 9.5,
            font,
            color
        });
    };

    payslip.income.forEach((row) => {
        drawLedgerRow(row.description, row.amount, ty, COLORS.positive);
        ty -= 22;
    });

    y = ty - 25;

    //
    // LEDGER TABLE — DEDUCTIONS
    //
    drawSectionTitle('DEDUCTIONS LEDGER', y);

    ty = y - 28;

    payslip.deductions.forEach((row) => {
        drawLedgerRow(row.description, row.amount, ty, COLORS.negative);
        ty -= 22;
    });

    y = ty - 25;

    //
    // SUMMARY TOTALS (clean horizontal statement)
    //
    drawSectionTitle('PAY SUMMARY', y);

    const summaryLines = [
        `Gross Pay: R ${payslip.totals.grossPay}`,
        `Total Deductions: R ${payslip.totals.totalDeductions.toFixed(2)}`,
        `Net Pay: R ${payslip.totals.netPay.toFixed(2)}`
    ];

    summaryLines.forEach((t, i) => {
        page.drawText(t, {
            x: 40,
            y: y - 20 - i * 16,
            size: 10,
            font,
            color: COLORS.ink
        });
    });

    y -= 90;

    //
    // PAYMENT DETAILS — minimal statement block
    //
    drawSectionTitle('PAYMENT DETAILS', y);

    const payLines = [
        `Method: ${payslip.paymentDetails.paymentMethod}`,
        `Payment Date: ${payslip.paymentDetails.paymentDate}`,
        `Bank: ${payslip.paymentDetails.bankName}`,
        `Account: ${payslip.paymentDetails.accountNumber}`,
        `Reference: ${payslip.paymentDetails.reference}`
    ];

    payLines.forEach((t, i) => {
        page.drawText(t, {
            x: 40,
            y: y - 20 - i * 14,
            size: 9.5,
            font,
            color: COLORS.ink
        });
    });

    //
    // LIGHT WATERMARK
    //
    page.drawText('CONFIDENTIAL', {
        x: width * 0.25,
        y: height * 0.2,
        size: 60,
        font: fontBold,
        color: rgb(0.9, 0.9, 0.9),
        rotate: degrees(45)
    });

    //
    // SAVE FILE
    //
    const pdfBytes = await pdfDoc.save();
    const dir = outputDir || path.join('generated', 'payslips');
    await mkdirp(dir);

    const filePath = path.join(dir, `${payslip.payslipNumber || 'Payslip'}-${index + 1}-v6.pdf`);

    fs.writeFileSync(filePath, pdfBytes);
    return filePath;
};
