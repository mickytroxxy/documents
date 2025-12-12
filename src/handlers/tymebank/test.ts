const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function createTymeBankStatement() {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Add a page
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

    // Page dimensions
    const { width, height } = page.getSize();
    const margin = 50;

    // Draw TymeBank header
    page.drawText('TymeBank', {
        x: margin,
        y: height - margin,
        size: 24,
        font: helveticaBold,
        color: rgb(0, 0, 0.5) // Dark blue color
    });

    page.drawText('Monthly business account statement', {
        x: margin,
        y: height - margin - 25,
        size: 12,
        font: helveticaOblique,
        color: rgb(0, 0, 0)
    });

    page.drawText('Make a statement that counts.', {
        x: margin,
        y: height - margin - 40,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5)
    });

    // Draw horizontal line
    page.drawLine({
        start: { x: margin, y: height - margin - 50 },
        end: { x: width - margin, y: height - margin - 50 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
    });

    // Account holder name
    const customerY = height - margin - 70;
    page.drawText('REBECCA KHAMBULA', {
        x: margin,
        y: customerY,
        size: 14,
        font: helveticaBold,
        color: rgb(0, 0, 0)
    });

    // Account info table
    const infoStartY = customerY - 40;

    // Draw info table borders
    const infoWidth = width - 2 * margin;
    const infoHeight = 80;

    page.drawRectangle({
        x: margin,
        y: infoStartY - infoHeight,
        width: infoWidth,
        height: infoHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1
    });

    // Vertical lines for info table
    page.drawLine({
        start: { x: margin + 200, y: infoStartY },
        end: { x: margin + 200, y: infoStartY - infoHeight },
        thickness: 1,
        color: rgb(0, 0, 0)
    });

    page.drawLine({
        start: { x: margin + 400, y: infoStartY },
        end: { x: margin + 400, y: infoStartY - infoHeight },
        thickness: 1,
        color: rgb(0, 0, 0)
    });

    // Horizontal lines for info table
    page.drawLine({
        start: { x: margin, y: infoStartY - 40 },
        end: { x: width - margin, y: infoStartY - 40 },
        thickness: 1,
        color: rgb(0, 0, 0)
    });

    // Info table headers
    page.drawText('Name', {
        x: margin + 10,
        y: infoStartY - 20,
        size: 10,
        font: helveticaBold
    });

    page.drawText('Number / Tax invoice number:', {
        x: margin + 210,
        y: infoStartY - 20,
        size: 10,
        font: helveticaBold
    });

    page.drawText('Period:', {
        x: margin + 10,
        y: infoStartY - 60,
        size: 10,
        font: helveticaBold
    });

    page.drawText('Date:', {
        x: margin + 210,
        y: infoStartY - 60,
        size: 10,
        font: helveticaBold
    });

    page.drawText('Account Num.:', {
        x: margin + 10,
        y: infoStartY - 100,
        size: 10,
        font: helveticaBold
    });

    page.drawText('Branch Code:', {
        x: margin + 210,
        y: infoStartY - 100,
        size: 10,
        font: helveticaBold
    });

    page.drawText('Customer VAT Registration Number:', {
        x: margin + 410,
        y: infoStartY - 100,
        size: 10,
        font: helveticaBold
    });

    // Info table values
    page.drawText('REBECCA KHAMBULA', {
        x: margin + 10,
        y: infoStartY - 35,
        size: 10,
        font: helveticaFont
    });

    page.drawText('002', {
        x: margin + 410,
        y: infoStartY - 35,
        size: 10,
        font: helveticaFont
    });

    page.drawText('01 Oct 2025 - 31 Oct 2025', {
        x: margin + 10,
        y: infoStartY - 75,
        size: 10,
        font: helveticaFont
    });

    page.drawText('02 Nov 2025', {
        x: margin + 410,
        y: infoStartY - 75,
        size: 10,
        font: helveticaFont
    });

    page.drawText('51128758637', {
        x: margin + 10,
        y: infoStartY - 115,
        size: 10,
        font: helveticaFont
    });

    page.drawText('678910', {
        x: margin + 410,
        y: infoStartY - 115,
        size: 10,
        font: helveticaFont
    });

    page.drawText('Not Provided', {
        x: margin + 610,
        y: infoStartY - 115,
        size: 10,
        font: helveticaFont
    });

    // Account type section
    const accountTypeY = infoStartY - infoHeight - 30;
    page.drawText('EveryDay account 51128758637', {
        x: margin,
        y: accountTypeY,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0.5)
    });

    // Transaction table
    const tableStartY = accountTypeY - 30;
    const tableWidth = width - 2 * margin;
    const rowHeight = 20;
    const colWidths = [60, 230, 40, 60, 60, 60]; // Column widths

    // Draw table headers
    const headers = ['Date', 'Description', 'Fees', 'Money Out', 'Money In', 'Balance'];
    let currentX = margin;

    // Draw header background
    page.drawRectangle({
        x: margin,
        y: tableStartY - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.9, 0.9, 0.95)
    });

    headers.forEach((header, i) => {
        page.drawText(header, {
            x: currentX + 5,
            y: tableStartY - 15,
            size: 10,
            font: helveticaBold
        });
        currentX += colWidths[i];
    });

    // Draw header borders
    page.drawRectangle({
        x: margin,
        y: tableStartY - rowHeight,
        width: tableWidth,
        height: rowHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1
    });

    // Transaction data
    const transactions = [
        {
            date: '28 Oct 2025',
            description: 'Opening Balance',
            fees: '',
            moneyOut: '',
            moneyIn: '',
            balance: '0.00'
        },
        {
            date: '28 Oct 2025',
            description: 'PaySnap - Pay by Account, purchase5232',
            fees: '',
            moneyOut: '',
            moneyIn: '985.00',
            balance: '985.00'
        },
        {
            date: '28 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: '0.50',
            moneyOut: '',
            moneyIn: '',
            balance: '984.50'
        },
        {
            date: '28 Oct 2025',
            description: 'Purchase at GRACES KITCHEN 175412 JOHANNESBURG ZA 530112865501',
            fees: '',
            moneyOut: '65.00',
            moneyIn: '',
            balance: '919.50'
        },
        {
            date: '28 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: '0.50',
            moneyOut: '',
            moneyIn: '',
            balance: '919.00'
        },
        {
            date: '28 Oct 2025',
            description: 'Purchase at EMASOFENI 168003 SOWETO ZA 530112868330',
            fees: '',
            moneyOut: '96.00',
            moneyIn: '',
            balance: '823.00'
        },
        {
            date: '28 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: '0.50',
            moneyOut: '',
            moneyIn: '',
            balance: '822.50'
        },
        {
            date: '28 Oct 2025',
            description: 'Purchase at IK Zwakala Naghha Trad ELDORADOPARK ZA 530115955616',
            fees: '',
            moneyOut: '93.00',
            moneyIn: '',
            balance: '729.50'
        },
        {
            date: '28 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: '0.50',
            moneyOut: '',
            moneyIn: '',
            balance: '729.00'
        },
        {
            date: '28 Oct 2025',
            description: 'Purchase at BP DEVLAND FORECOURT JOHANNESBURG ZA 530116470154',
            fees: '',
            moneyOut: '440.00',
            moneyIn: '',
            balance: '289.00'
        },
        {
            date: '28 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: '0.50',
            moneyOut: '',
            moneyIn: '',
            balance: '288.50'
        },
        {
            date: '28 Oct 2025',
            description: 'Immediate EFT for Payment',
            fees: '',
            moneyOut: '',
            moneyIn: '7 200.00',
            balance: '7 488.50'
        },
        {
            date: '28 Oct 2025',
            description: 'Fee: Transactional SMS Notification',
            fees: '0.50',
            moneyOut: '',
            moneyIn: '',
            balance: '7 488.00'
        },
        {
            date: '28 Oct 2025',
            description: 'Purchase at KFC Eldorado Park Eldoradopark ZA 530117720270',
            fees: '',
            moneyOut: '382.70',
            moneyIn: '',
            balance: '7 105.30'
        }
    ];

    // Draw transaction rows
    let currentY = tableStartY - rowHeight;

    transactions.forEach((transaction, index) => {
        currentY -= rowHeight;

        // Alternate row background
        if (index % 2 === 0) {
            page.drawRectangle({
                x: margin,
                y: currentY,
                width: tableWidth,
                height: rowHeight,
                color: rgb(0.98, 0.98, 0.98)
            });
        }

        // Draw row borders
        page.drawRectangle({
            x: margin,
            y: currentY,
            width: tableWidth,
            height: rowHeight,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 0.5
        });

        // Draw transaction data
        let colX = margin + 5;

        // Date
        page.drawText(transaction.date, {
            x: colX,
            y: currentY + 5,
            size: 8,
            font: helveticaFont
        });
        colX += colWidths[0];

        // Description
        page.drawText(transaction.description, {
            x: colX,
            y: currentY + 5,
            size: 8,
            font: helveticaFont,
            maxWidth: colWidths[1] - 10
        });
        colX += colWidths[1];

        // Fees
        page.drawText(transaction.fees, {
            x: colX,
            y: currentY + 5,
            size: 8,
            font: helveticaFont
        });
        colX += colWidths[2];

        // Money Out
        page.drawText(transaction.moneyOut, {
            x: colX,
            y: currentY + 5,
            size: 8,
            font: helveticaFont,
            color: transaction.moneyOut ? rgb(0.8, 0, 0) : rgb(0, 0, 0)
        });
        colX += colWidths[3];

        // Money In
        page.drawText(transaction.moneyIn, {
            x: colX,
            y: currentY + 5,
            size: 8,
            font: helveticaFont,
            color: transaction.moneyIn ? rgb(0, 0.6, 0) : rgb(0, 0, 0)
        });
        colX += colWidths[4];

        // Balance
        page.drawText(transaction.balance, {
            x: colX,
            y: currentY + 5,
            size: 8,
            font: helveticaFont,
            color: rgb(0, 0, 0.5)
        });
    });

    // Draw horizontal line after table
    const tableEndY = currentY;
    page.drawLine({
        start: { x: margin, y: tableEndY - 10 },
        end: { x: width - margin, y: tableEndY - 10 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
    });

    // Footer section
    const footerY = tableEndY - 40;

    page.drawText('TymeBank is an Authorised Financial Services (FSP 49140) and Registered Credit Provider (NCRCP 10774).', {
        x: margin,
        y: footerY,
        size: 8,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4)
    });

    page.drawText('Tyme Bank Limited Reg no: 2015/23151006', {
        x: margin,
        y: footerY - 15,
        size: 8,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4)
    });

    page.drawText('30 Jellicoe Avenue, Rosebank 2196', {
        x: margin,
        y: footerY - 30,
        size: 8,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4)
    });

    page.drawText('www.tymebank.co.za', {
        x: margin,
        y: footerY - 45,
        size: 8,
        font: helveticaFont,
        color: rgb(0, 0, 0.8)
    });

    page.drawText('0860 999 119', {
        x: margin,
        y: footerY - 60,
        size: 8,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4)
    });

    // Page number
    page.drawText('Page 1 of 5', {
        x: width - margin - 50,
        y: 30,
        size: 8,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4)
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Write to file
    const outputPath = path.join(__dirname, 'tymebank-statement.pdf');
    await fs.writeFile(outputPath, pdfBytes);

    console.log(`PDF created successfully: ${outputPath}`);
    return outputPath;
}

// Run the function
createTymeBankStatement().catch(console.error);
