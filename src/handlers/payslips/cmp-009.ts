// generatePayslip.ts
// @ts-ignore
import fontkit from 'fontkit';
import fs from 'fs';
import path from 'path';
import { mkdirp } from 'mkdirp';
import { PDFDocument, PDFFont, rgb, StandardFonts, degrees } from '@pdfme/pdf-lib';

import { PayslipData } from '../standard/types';

const COLORS = {
    primary: rgb(0, 0, 0.5), // Navy
    secondary: rgb(0.2, 0.2, 0.6), // Light navy
    accent: rgb(1, 0.8, 0), // Gold
    background: rgb(0.95, 0.95, 0.98), // Light navy background
    text: rgb(0, 0, 0),
    positive: rgb(0, 0.5, 0), // Green
    negative: rgb(0.8, 0, 0), // Red
    border: rgb(0.4, 0.4, 0.5), // Navy border
    white: rgb(1, 1, 1),
    lightAccent: rgb(0.9, 0.9, 0.95) // Very light navy for backgrounds
};

export const generatePayslip9PDF = async (payslip: PayslipData, index: number, outputDir?: string): Promise<string> => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Background
    page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: COLORS.background
    });

    // Outer border
    page.drawRectangle({
        x: 10,
        y: 10,
        width: width - 20,
        height: height - 20,
        borderWidth: 2,
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
        color: COLORS.primary,
        borderWidth: 1,
        borderColor: COLORS.border
    });

    // Company name centered
    const companyText = payslip.employer.name?.toUpperCase() || 'COMPANY NAME';
    const companyWidth = fontBold.widthOfTextAtSize(companyText, 24);
    page.drawText(companyText, {
        x: (width - companyWidth) / 2,
        y: height - 50,
        size: 24,
        font: fontBold,
        color: COLORS.white
    });

    // Payslip title
    page.drawText('PAYSLIP', {
        x: width - 150,
        y: height - 40,
        size: 18,
        font: fontBold,
        color: COLORS.accent
    });

    // Details
    page.drawText(`PAYSLIP #: ${payslip.payslipNumber?.toUpperCase()}`, {
        x: 30,
        y: height - 90,
        size: 10,
        font,
        color: COLORS.white
    });

    page.drawText(`PAY PERIOD: ${payslip.payPeriod?.toUpperCase()}`, {
        x: 30,
        y: height - 105,
        size: 10,
        font,
        color: COLORS.white
    });

    page.drawText(`PAY DATE: ${payslip.payDate?.toUpperCase()}`, {
        x: 30,
        y: height - 120,
        size: 10,
        font,
        color: COLORS.white
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
        color: COLORS.lightAccent,
        borderWidth: 2,
        borderColor: COLORS.primary
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
        color: COLORS.lightAccent,
        borderWidth: 2,
        borderColor: COLORS.primary
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

    // Earnings table
    let tableY = sectionY - 145;

    page.drawRectangle({
        x: 20,
        y: tableY - 25,
        width: width - 40,
        height: 25,
        color: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.border
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

        page.drawRectangle({
            x: 20,
            y: y - 15,
            width: width - 40,
            height: 20,
            color: i % 2 === 0 ? COLORS.lightAccent : COLORS.white,
            borderWidth: 1,
            borderColor: COLORS.border
        });

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
        color: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.border
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

        page.drawRectangle({
            x: 20,
            y: y - 15,
            width: width - 40,
            height: 20,
            color: i % 2 === 0 ? COLORS.lightAccent : COLORS.white,
            borderWidth: 1,
            borderColor: COLORS.border
        });

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
        height: 90,
        borderWidth: 3,
        borderColor: COLORS.primary,
        color: COLORS.white
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
        color: COLORS.border
    });

    // Payment
    const lowerY = totalsY - 140;

    // Payment
    page.drawRectangle({
        x: 20,
        y: lowerY,
        width: width - 40,
        height: 110,
        color: COLORS.lightAccent,
        borderWidth: 2,
        borderColor: COLORS.primary
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
        borderWidth: 2,
        borderColor: COLORS.primary,
        color: COLORS.white
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
        color: COLORS.border
    });

    // Watermark
    page.drawText('CONFIDENTIAL', {
        x: width / 2,
        y: height / 2,
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
