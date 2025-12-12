// generatePayslip.ts
// @ts-ignore
import fontkit from 'fontkit';
import path from 'path';
import fs from 'fs';
import { PDFDocument, StandardFonts, PDFFont, rgb, PDFImage } from 'pdf-lib';
import { mkdirp } from 'mkdirp';
import { PayslipData } from './standard/types';
import { payslipSample } from './standard/transactions';

const COLORS = {
    primaryBlue: rgb(0 / 255, 82 / 255, 156 / 255), // #00529c
    secondaryBlue: rgb(0 / 255, 51 / 255, 153 / 255), // #003399
    accentBlue: rgb(0 / 255, 122 / 255, 255 / 255), // #007aff
    lightBlue: rgb(235 / 255, 245 / 255, 255 / 255), // #ebf5ff
    borderGray: rgb(0.9, 0.9, 0.9),
    darkGray: rgb(0.3, 0.3, 0.3),
    red: rgb(0.8, 0, 0),
    green: rgb(0, 0.6, 0),
    white: rgb(1, 1, 1),
    black: rgb(0, 0, 0)
};

export const generatePayslipPDF = async (payslip: PayslipData, index: number, customPath?: string): Promise<string> => {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Add a page (A4 size)
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Embed fonts
    const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Draw background border (2px blue border around entire page)
    page.drawRectangle({
        x: 15,
        y: 15,
        width: width - 30,
        height: height - 30,
        borderWidth: 2,
        borderColor: COLORS.primaryBlue,
        color: COLORS.white
    });

    // Draw header with company logo area
    const headerHeight = 100;
    page.drawRectangle({
        x: 20,
        y: height - headerHeight - 20,
        width: width - 40,
        height: headerHeight,
        color: COLORS.lightBlue,
        borderWidth: 1,
        borderColor: COLORS.borderGray
    });

    // Company name and logo placeholder
    page.drawText(`${payslip.employer.name}`, {
        x: 40,
        y: height - 50,
        size: 18,
        font: fontBold,
        color: COLORS.primaryBlue
    });

    page.drawText('PAYSLIP', {
        x: width - 150,
        y: height - 50,
        size: 20,
        font: fontBold,
        color: COLORS.secondaryBlue
    });

    // Payslip details header
    page.drawText(`Payslip #: ${payslip.payslipNumber}`, {
        x: 40,
        y: height - 80,
        size: 10,
        font: font,
        color: COLORS.darkGray
    });

    page.drawText(`Pay Period: ${payslip.payPeriod}`, {
        x: 40,
        y: height - 95,
        size: 10,
        font: font,
        color: COLORS.darkGray
    });

    page.drawText(`Pay Date: ${payslip.payDate}`, {
        x: width - 195,
        y: height - 80,
        size: 10,
        font: font,
        color: COLORS.darkGray
    });

    // Employee and Employer sections side by side
    const sectionStartY = height - 140;
    const sectionWidth = (width - 60) / 2;

    // Employee Section
    page.drawRectangle({
        x: 20,
        y: sectionStartY - 100,
        width: sectionWidth,
        height: 110,
        borderWidth: 1,
        borderColor: COLORS.borderGray
    });

    page.drawText('EMPLOYEE DETAILS', {
        x: 40,
        y: sectionStartY - 5,
        size: 12,
        font: fontBold,
        color: COLORS.primaryBlue
    });

    const employeeDetails = [
        `Name: ${payslip.employee.name}`,
        `Employee: ${payslip.employee.employeeNumber}`,
        `ID Number: ${payslip.employee.idNumber}`,
        `Tax Ref: ${payslip.employee.taxReference}`,
        `Department: ${payslip.employee.department}`
    ];

    employeeDetails.forEach((detail, idx) => {
        page.drawText(detail, {
            x: 40,
            y: sectionStartY - 40 - idx * 15 + 10,
            size: 9,
            font: font,
            color: COLORS.black
        });
    });

    // Employer Section
    page.drawRectangle({
        x: 30 + sectionWidth + 10,
        y: sectionStartY - 100,
        width: sectionWidth,
        height: 110,
        borderWidth: 1,
        borderColor: COLORS.borderGray
    });

    page.drawText('EMPLOYER DETAILS', {
        x: 40 + sectionWidth + 10,
        y: sectionStartY - 5,
        size: 12,
        font: fontBold,
        color: COLORS.primaryBlue
    });

    const employerDetails = [
        `Company: ${payslip.employer.name}`,
        `Email: ${payslip.employer.email}`,
        `Tel: ${payslip.employer.phone}`,
        `Address: ${payslip.employer.address}`
    ];

    employerDetails.forEach((detail, idx) => {
        page.drawText(detail, {
            x: 40 + sectionWidth + 10,
            y: sectionStartY - 40 - idx * 15 + 10,
            size: 9,
            font: font,
            color: COLORS.black
        });
    });

    // Earnings Table
    const tableStartY = sectionStartY - 130;
    const tableHeaderY = tableStartY;

    // Earnings header
    page.drawRectangle({
        x: 30,
        y: tableHeaderY - 25,
        width: width - 60,
        height: 25,
        color: COLORS.primaryBlue
    });

    page.drawText('EARNINGS', {
        x: 40,
        y: tableHeaderY - 15,
        size: 11,
        font: fontBold,
        color: COLORS.white
    });
    const amountTOZARWidth = fontBold.widthOfTextAtSize('AMOUNT (ZAR)', 11);
    page.drawText('AMOUNT (ZAR)', {
        x: width - 40 - amountTOZARWidth,
        y: tableHeaderY - 15,
        size: 11,
        font: fontBold,
        color: COLORS.white
    });

    // Earnings rows
    payslip.income.forEach((earning, idx) => {
        const rowY = tableHeaderY - 25 - idx * 20;

        // Alternate row background
        if (idx % 2 === 0) {
            page.drawRectangle({
                x: 30,
                y: rowY - 15,
                width: width - 60,
                height: 20,
                color: COLORS.lightBlue
            });
        }

        // Description
        page.drawText(earning.description, {
            x: 40,
            y: rowY - 10,
            size: 10,
            font: font,
            color: COLORS.black
        });

        // Amount
        const amountText = `R ${earning.amount.toFixed(2)}`;
        const amountWidth = font.widthOfTextAtSize(amountText, 10);
        page.drawText(amountText, {
            x: width - 40 - amountWidth,
            y: rowY - 10,
            size: 10,
            font: font,
            color: COLORS.green
        });
    });

    // Deductions Table
    const deductionsStartY = tableStartY - 25 - payslip.income.length * 20 - 30;

    // Deductions header
    page.drawRectangle({
        x: 30,
        y: deductionsStartY - 25,
        width: width - 60,
        height: 25,
        color: COLORS.primaryBlue
    });

    page.drawText('DEDUCTIONS', {
        x: 40,
        y: deductionsStartY - 15,
        size: 11,
        font: fontBold,
        color: COLORS.white
    });

    page.drawText('AMOUNT (ZAR)', {
        x: width - 40 - amountTOZARWidth,
        y: deductionsStartY - 15,
        size: 11,
        font: fontBold,
        color: COLORS.white
    });

    // Deductions rows
    payslip.deductions.forEach((deduction, idx) => {
        const rowY = deductionsStartY - 25 - idx * 20;

        // Alternate row background
        if (idx % 2 === 0) {
            page.drawRectangle({
                x: 30,
                y: rowY - 15,
                width: width - 60,
                height: 20,
                color: COLORS.lightBlue
            });
        }

        // Description
        page.drawText(deduction.description, {
            x: 40,
            y: rowY - 10,
            size: 10,
            font: font,
            color: COLORS.black
        });

        // Amount
        const amountText = `R ${deduction.amount.toFixed(2)}`;
        const amountWidth = font.widthOfTextAtSize(amountText, 10);
        page.drawText(amountText, {
            x: width - 40 - amountWidth,
            y: rowY - 10,
            size: 10,
            font: font,
            color: COLORS.red
        });
    });

    // Totals Section
    const totalsStartY = deductionsStartY - 25 - payslip.deductions.length * 20 - 40;

    // Draw totals box
    page.drawRectangle({
        x: 30,
        y: totalsStartY - 80,
        width: width - 60,
        height: 100,
        borderWidth: 2,
        borderColor: COLORS.primaryBlue,
        color: COLORS.lightBlue
    });

    // Gross Pay
    page.drawText('Gross Pay:', {
        x: 40,
        y: totalsStartY,
        size: 11,
        font: fontBold,
        color: COLORS.darkGray
    });

    const grossText = `R ${payslip.totals.grossPay.toFixed(2)}`;
    const grossWidth = fontBold.widthOfTextAtSize(grossText, 11);
    page.drawText(grossText, {
        x: width - 40 - grossWidth,
        y: totalsStartY,
        size: 11,
        font: fontBold,
        color: COLORS.green
    });

    // Total Deductions
    page.drawText('Total Deductions:', {
        x: 40,
        y: totalsStartY - 20,
        size: 11,
        font: fontBold,
        color: COLORS.darkGray
    });

    const deductionsText = `R ${payslip.totals.totalDeductions.toFixed(2)}`;
    const deductionsWidth = fontBold.widthOfTextAtSize(deductionsText, 11);
    page.drawText(deductionsText, {
        x: width - 40 - deductionsWidth,
        y: totalsStartY - 20,
        size: 11,
        font: fontBold,
        color: COLORS.red
    });

    // Net Pay (highlighted)
    page.drawRectangle({
        x: 35,
        y: totalsStartY - 50,
        width: width - 70,
        height: 25,
        color: COLORS.primaryBlue
    });

    page.drawText('NET PAY:', {
        x: 40,
        y: totalsStartY - 40,
        size: 12,
        font: fontBold,
        color: COLORS.white
    });

    const netText = `R ${payslip.totals.netPay.toFixed(2)}`;
    const netWidth = fontBold.widthOfTextAtSize(netText, 12);
    page.drawText(netText, {
        x: width - 40 - netWidth,
        y: totalsStartY - 40,
        size: 12,
        font: fontBold,
        color: COLORS.white
    });

    // Net Pay in Words
    page.drawText('In Words:', {
        x: 40,
        y: totalsStartY - 65,
        size: 9,
        font: font,
        color: COLORS.darkGray
    });

    page.drawText(payslip.totals.netPayInWords, {
        x: 100,
        y: totalsStartY - 65,
        size: 9,
        font: font,
        color: COLORS.darkGray
    });

    // Payment Details
    const paymentStartY = totalsStartY - 120;

    page.drawRectangle({
        x: 30,
        y: paymentStartY - 90,
        width: (width - 70) / 2,
        height: 90,
        borderWidth: 1,
        borderColor: COLORS.borderGray
    });

    page.drawText('PAYMENT DETAILS', {
        x: 40,
        y: paymentStartY - 20,
        size: 11,
        font: fontBold,
        color: COLORS.primaryBlue
    });

    const paymentDetails = [
        `Method: ${payslip.paymentDetails.paymentMethod}`,
        `Date: ${payslip.paymentDetails.paymentDate}`,
        `Bank: ${payslip.paymentDetails.bankName}`,
        `Account: ${payslip.paymentDetails.accountNumber}`,
        `Reference: ${payslip.paymentDetails.reference}`
    ];

    paymentDetails.forEach((detail, idx) => {
        page.drawText(detail, {
            x: 40,
            y: paymentStartY - 35 - idx * 12,
            size: 9,
            font: font,
            color: COLORS.black
        });
    });

    // Leave Balance
    page.drawRectangle({
        x: 40 + (width - 70) / 2,
        y: paymentStartY - 75,
        width: (width - 70) / 2,
        height: 60,
        borderWidth: 1,
        borderColor: COLORS.borderGray
    });

    page.drawText('LEAVE BALANCE', {
        x: 50 + (width - 70) / 2,
        y: paymentStartY - 35,
        size: 11,
        font: fontBold,
        color: COLORS.primaryBlue
    });

    const leaveDetails = [`Annual Leave: ${payslip.leave.annualLeave.closing} days`, `Sick Leave: ${payslip.leave.sickLeave.closing} days`];

    leaveDetails.forEach((detail, idx) => {
        page.drawText(detail, {
            x: 50 + (width - 70) / 2,
            y: paymentStartY - 35 - idx * 12 - 15,
            size: 9,
            font: font,
            color: COLORS.black
        });
    });

    // Footer
    const footerY = 50;

    // Footer border
    page.drawLine({
        start: { x: 30, y: footerY + 30 },
        end: { x: width - 30, y: footerY + 30 },
        thickness: 1,
        color: COLORS.borderGray
    });

    // Footer text
    page.drawText('This is a computer-generated document. No signature required.', {
        x: width / 2 - font.widthOfTextAtSize('This is a computer-generated document. No signature required.', 8) / 2,
        y: footerY + 15,
        size: 8,
        font: font,
        color: COLORS.darkGray
    });

    page.drawText(`For queries, contact HR Department: ${payslip?.employer?.email} | Tel: ${payslip?.employer?.phone}`, {
        x:
            width / 2 -
            font.widthOfTextAtSize(`For queries, contact HR Department: ${payslip?.employer?.email} | Tel: ${payslip?.employer?.phone}`, 8) / 2,
        y: footerY,
        size: 8,
        font: font,
        color: COLORS.darkGray
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const outPath = path.resolve(customPath || `./files/payslip_${index + 1}.pdf`);
    const dir = path.dirname(outPath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outPath, pdfBytes);
    return outPath;
};

export const generatePayslipPDFs = async (payslipData?: PayslipData | PayslipData[]): Promise<string[]> => {
    try {
        mkdirp.sync('./files/payslips');
        const urls: string[] = [];

        // Use provided payslip data or fall back to sample data for backwards compatibility
        const payslipsToGenerate = payslipData ? (Array.isArray(payslipData) ? payslipData : [payslipData]) : payslipSample || [];

        // Generate PDF for each payslip
        for (let i = 0; i < payslipsToGenerate.length; i++) {
            const payslip = payslipsToGenerate[i];
            if (payslip) {
                const pdfPath = await generatePayslipPDF(payslip, i);
                urls.push(pdfPath);
                console.log(`Payslip ${i + 1} generated: ${pdfPath}`);
            }
        }

        return urls;
    } catch (error) {
        console.error('Error generating payslips:', error);
        return [];
    }
};
// (() => {
//     generatePayslipPDFs(payslipSample);
// })();
