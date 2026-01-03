// generatePayslip.ts
// @ts-ignore
import fontkit from 'fontkit';
import fs from 'fs';
import path from 'path';
import { mkdirp } from 'mkdirp';
import { PDFDocument, PDFFont, rgb, StandardFonts, degrees } from '@pdfme/pdf-lib';

import { PayslipData } from '../standard/types';

const COLORS = {
    primary: rgb(0 / 255, 82 / 255, 156 / 255), // #00529c
    secondary: rgb(0 / 255, 51 / 255, 153 / 255), // #003399
    accent: rgb(0 / 255, 122 / 255, 255 / 255), // #007aff
    background: rgb(235 / 255, 245 / 255, 255 / 255), // #ebf5ff
    text: rgb(0, 0, 0),
    positive: rgb(0, 0.6, 0), // Green
    negative: rgb(0.8, 0, 0), // Red
    border: rgb(0.9, 0.9, 0.9), // Light gray
    white: rgb(1, 1, 1),
    lightAccent: rgb(0.95, 0.98, 1) // Very light blue for backgrounds
};

export const generatePayslip5PDF = async (payslip: PayslipData, index: number, outputDir?: string): Promise<string> => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Background is white

    // Outer border
    page.drawRectangle({
        x: 10,
        y: 10,
        width: width - 20,
        height: height - 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        color: COLORS.white
    });

    // Header
    const headerHeight = 120;
    page.drawRectangle({
        x: 15,
        y: height - headerHeight - 15,
        width: width - 30,
        height: headerHeight,
        color: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary
    });

    // Company name centered
    const companyText = payslip.employer.name?.toUpperCase() || 'COMPANY NAME';
    const companyWidth = fontBold.widthOfTextAtSize(companyText, 24);
    page.drawText(companyText, {
        x: (width - companyWidth) / 2,
        y: height - 50,
        size: 24,
        font: fontBold,
        color: COLORS.primary
    });

    // Details
    page.drawText(`PAYSLIP #: ${payslip.payslipNumber?.toUpperCase()}`, {
        x: 30,
        y: height - 90,
        size: 10,
        font,
        color: COLORS.text
    });

    page.drawText(`PAY PERIOD: ${payslip.payPeriod?.toUpperCase()}`, {
        x: 30,
        y: height - 105,
        size: 10,
        font,
        color: COLORS.text
    });

    page.drawText(`PAY DATE: ${payslip.payDate?.toUpperCase()}`, {
        x: 30,
        y: height - 120,
        size: 10,
        font,
        color: COLORS.text
    });

    // Line after header
    page.drawLine({
        start: { x: 15, y: height - headerHeight - 15 },
        end: { x: width - 15, y: height - headerHeight - 15 },
        thickness: 1,
        color: COLORS.border
    });

    // Employee and Employer sections
    const sectionY = height - 165;
    const colWidth = (width - 60) / 2;

    // Employee
    page.drawRectangle({
        x: 20,
        y: sectionY - 110,
        width: colWidth,
        height: 115,
        color: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border
    });

    page.drawText('EMPLOYEE DETAILS', {
        x: 30,
        y: sectionY - 15,
        size: 12,
        font: fontBold,
        color: COLORS.primary
    });

    const employeeLines = [
        `Name: ${payslip.employee.name}`,
        `Employee No: ${payslip.employee.employeeNumber}`,
        `ID Number: ${payslip.employee.idNumber}`,
        `Tax Reference: ${payslip.employee.taxReference}`,
        `Department: ${payslip.employee.department}`
    ];

    employeeLines.forEach((t, i) => {
        page.drawText(t, {
            x: 30,
            y: sectionY - 35 - i * 15,
            size: 9,
            font,
            color: COLORS.text
        });
    });

    // Employer
    page.drawRectangle({
        x: 40 + colWidth,
        y: sectionY - 110,
        width: colWidth,
        height: 115,
        color: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border
    });

    page.drawText('EMPLOYER DETAILS', {
        x: 50 + colWidth,
        y: sectionY - 15,
        size: 12,
        font: fontBold,
        color: COLORS.primary
    });

    const employerLines = [
        `Company: ${payslip.employer.name}`,
        `Registration: ${payslip.employer.registrationNumber}`,
        `Email: ${payslip.employer.email}`,
        `Tel: ${payslip.employer.phone}`,
        `Address: ${payslip.employer.address}`
    ];

    employerLines.forEach((t, i) => {
        page.drawText(t, {
            x: 50 + colWidth,
            y: sectionY - 35 - i * 15,
            size: 9,
            font,
            color: COLORS.text
        });
    });

    // Line after sections
    page.drawLine({
        start: { x: 20, y: sectionY - 235 },
        end: { x: width - 20, y: sectionY - 235 },
        thickness: 1,
        color: COLORS.border
    });

    // Earnings table
    let tableY = sectionY - 145;

    page.drawRectangle({
        x: 20,
        y: tableY - 25,
        width: width - 40,
        height: 25,
        color: COLORS.primary
    });

    page.drawText('EARNINGS', {
        x: 30,
        y: tableY - 15,
        size: 11,
        font: fontBold,
        color: COLORS.white
    });

    const amtHeader = 'AMOUNT (ZAR)';
    const amtHeaderWidth = fontBold.widthOfTextAtSize(amtHeader, 11);

    page.drawText(amtHeader, {
        x: width - 30 - amtHeaderWidth,
        y: tableY - 15,
        size: 11,
        font: fontBold,
        color: COLORS.white
    });

    payslip.income.forEach((row, i) => {
        const y = tableY - 25 - i * 20;

        if (i % 2 === 0) {
            page.drawRectangle({
                x: 20,
                y: y - 15,
                width: width - 40,
                height: 20,
                color: COLORS.white,
                borderWidth: 1,
                borderColor: COLORS.border
            });
        }

        page.drawText(row.description, {
            x: 30,
            y: y - 10,
            size: 10,
            font,
            color: COLORS.text
        });

        const amt = `R ${row.amount.toFixed(2)}`;
        const aw = font.widthOfTextAtSize(amt, 10);

        page.drawText(amt, {
            x: width - 30 - aw,
            y: y - 10,
            size: 10,
            font,
            color: COLORS.positive
        });
    });

    // Deductions table
    const deductionsY = tableY - 35 - payslip.income.length * 20;

    page.drawRectangle({
        x: 20,
        y: deductionsY - 25,
        width: width - 40,
        height: 25,
        color: COLORS.primary
    });

    page.drawText('DEDUCTIONS', {
        x: 30,
        y: deductionsY - 15,
        size: 11,
        font: fontBold,
        color: COLORS.white
    });

    page.drawText(amtHeader, {
        x: width - 30 - amtHeaderWidth,
        y: deductionsY - 15,
        size: 11,
        font: fontBold,
        color: COLORS.white
    });

    payslip.deductions.forEach((row, i) => {
        const y = deductionsY - 25 - i * 20;

        if (i % 2 === 0) {
            page.drawRectangle({
                x: 20,
                y: y - 15,
                width: width - 40,
                height: 20,
                color: COLORS.white,
                borderWidth: 1,
                borderColor: COLORS.border
            });
        }

        page.drawText(row.description, {
            x: 30,
            y: y - 10,
            size: 10,
            font,
            color: COLORS.text
        });

        const amt = `R ${row.amount.toFixed(2)}`;
        const aw = font.widthOfTextAtSize(amt, 10);

        page.drawText(amt, {
            x: width - 30 - aw,
            y: y - 10,
            size: 10,
            font,
            color: COLORS.negative
        });
    });

    // Totals
    const totalsY = deductionsY - 120 - payslip.deductions.length * 20;

    page.drawRectangle({
        x: 20,
        y: totalsY,
        width: width - 40,
        height: 95,
        borderWidth: 2,
        borderColor: COLORS.primary,
        color: COLORS.white,
        radius: 5
    });

    page.drawText('SUMMARY TOTALS', {
        x: 30,
        y: totalsY + 70,
        size: 12,
        font: fontBold,
        color: COLORS.primary
    });

    const totals = [
        `Gross Pay: R ${payslip.totals.grossPay.toFixed(2)}`,
        `Total Deductions: R ${payslip.totals.totalDeductions.toFixed(2)}`,
        `Net Pay: R ${payslip.totals.netPay.toFixed(2)}`
    ];

    totals.forEach((t, i) => {
        page.drawText(t, {
            x: 30,
            y: totalsY + 50 - i * 18,
            size: 10,
            font,
            color: COLORS.text
        });
    });

    page.drawText(`Net Pay In Words: ${payslip.totals.netPayInWords}`, {
        x: 30,
        y: totalsY + 5,
        size: 9,
        font,
        color: COLORS.primary
    });

    // Payment
    const lowerY = totalsY - 140;

    // Payment
    page.drawRectangle({
        x: 20,
        y: lowerY,
        width: width - 40,
        height: 110,
        color: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border
    });

    page.drawText('PAYMENT DETAILS', {
        x: 30,
        y: lowerY + 90,
        size: 12,
        font: fontBold,
        color: COLORS.primary
    });

    const payLines = [
        `Method: ${payslip.paymentDetails.paymentMethod}`,
        `Payment Date: ${payslip.paymentDetails.paymentDate}`,
        `Bank: ${payslip.paymentDetails.bankName}`,
        `Account: ${payslip.paymentDetails.accountNumber}`,
        `Reference: ${payslip.paymentDetails.reference}`
    ];

    payLines.forEach((t, i) => {
        page.drawText(t, {
            x: 30,
            y: lowerY + 70 - i * 15,
            size: 9,
            font,
            color: COLORS.text
        });
    });

    // Bank statement
    page.drawRectangle({
        x: 20,
        y: 40,
        width: width - 40,
        height: 70,
        borderWidth: 1,
        borderColor: COLORS.primary,
        color: COLORS.white,
        radius: 5
    });

    page.drawText('LINKED BANK STATEMENT ENTRY', {
        x: 30,
        y: 95,
        size: 11,
        font: fontBold,
        color: COLORS.primary
    });

    const stmt = payslip.linkedToStatement;

    page.drawText(`Account: ${stmt.statementAccount}  |  Date: ${stmt.transactionDate}  |  Deposit: R ${stmt.depositAmount.toFixed(2)}`, {
        x: 30,
        y: 75,
        size: 9,
        font,
        color: COLORS.text
    });

    page.drawText(`Description: ${stmt.transactionDescription}`, {
        x: 30,
        y: 58,
        size: 9,
        font,
        color: COLORS.primary
    });

    // Watermark
    page.drawText('CONFIDENTIAL', {
        x: width * 0.25,
        y: height * 0.2,
        size: 60,
        font: fontBold,
        color: rgb(0.9, 0.9, 0.9),
        rotate: degrees(45)
    });

    // Save
    const pdfBytes = await pdfDoc.save();

    const dir = outputDir || path.join('generated', 'payslips');
    await mkdirp(dir);

    const filePath = path.join(dir, `${payslip.payslipNumber || 'Payslip'}-${index + 1}.pdf`);

    fs.writeFileSync(filePath, pdfBytes);

    return filePath;
};
