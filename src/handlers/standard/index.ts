// generateStatement.ts
// @ts-ignore
import fontkit from 'fontkit';
import path from 'path';
import fs from 'fs';
import { PDFDocument, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import { COLORS, TABLE_CONFIG } from '../standard/constants';
import { StatementData } from '../standard/types';
import { renderAccountDetails } from '../standard/renderAccountDetails';
import { renderTable } from '../standard/renderTable';
import { renderSummary } from '../standard/renderSummary';

export const generateStandardBankStatement = async (outputFilePath: string, statementDetails: StatementData) => {
    const topOffset = 130;
    const lineGap = 15.3;
    const left = TABLE_CONFIG.leftMargin;
    const rightMargin = TABLE_CONFIG.rightMargin;
    const inPath = path.resolve('./files/statement.pdf');
    let existingPdfBytes = new Uint8Array(fs.readFileSync(inPath));
    const accountFolder = path.dirname(outputFilePath);
    const transactions = statementDetails.transactions;
    const totalTx = transactions.length;
    const firstPageCount = 15;
    const otherPageCount = 17;
    const NON_FIRST_PAGE_OFFSET = 60;
    let totalPages = 0;
    if (totalTx <= firstPageCount) {
        totalPages = 1;
    } else {
        totalPages = 1 + Math.ceil((totalTx - firstPageCount) / otherPageCount);
    }

    // Build page descriptors (start/end indexes)
    const pageDescriptors = Array.from({ length: totalPages }).map((_, i) => {
        if (i === 0) {
            const start = 0;
            const end = Math.min(firstPageCount, totalTx);
            return { pageNumber: 1, start, end };
        }
        const start = firstPageCount + (i - 1) * otherPageCount;
        const end = Math.min(start + otherPageCount, totalTx);
        return { pageNumber: i + 1, start, end };
    });

    // Ensure output directory exists
    const outDir = path.dirname(outputFilePath ?? './files/statement/statement1.pdf');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // For each page, create a statement PDF using the template and the correct slice of transactions
    const results = await Promise.all(
        pageDescriptors.map(async ({ pageNumber, start, end }) => {
            // Load a fresh copy of the template for this page
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            pdfDoc.registerFontkit(fontkit);

            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const { height, width } = firstPage.getSize();

            const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontBold: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const startY = height - topOffset;
            // Account details always use the original startY (no offset applied)
            const gap = lineGap;

            // Render account details: full details only on the first page.
            if (pageNumber === 1) {
                renderAccountDetails(
                    firstPage,
                    {
                        accountNumber: statementDetails.accountNumber,
                        accountHolder: statementDetails.accountHolder,
                        productName: statementDetails.productName,
                        address: statementDetails.address,
                        statementPeriod: statementDetails.statementPeriod
                    },
                    { font, fontBold },
                    {
                        startY: startY,
                        gap,
                        left,
                        width,
                        rightMargin
                    }
                );
            } else {
                // On subsequent pages only draw the account number (omit holder, product, address)
                const label = 'Account number:';
                const fontSize = 9;
                const maxLabelWidth = font.widthOfTextAtSize(label, fontSize);
                const valueX = left + maxLabelWidth + 5;
                const y = startY;
                firstPage.drawText(label, { x: left, y, size: fontSize, font, color: COLORS.bankBlue });
                firstPage.drawText(statementDetails.accountNumber, { x: valueX, y, size: fontSize, font: fontBold, color: COLORS.bankBlue });
                const dateRows = [`From: ${statementDetails.statementPeriod.from}`, `To: ${statementDetails.statementPeriod.to}`];
                const fontSizeDate = fontSize - 1;
                dateRows.forEach((label, idx) => {
                    const dateY = startY - (gap + 0.5) * idx + 47;
                    const textWidth = font.widthOfTextAtSize(label, fontSizeDate);
                    const xPos = width - rightMargin - textWidth;
                    firstPage.drawText(label, { x: xPos, y: dateY, size: fontSizeDate, font, color: COLORS.bankBlue });
                });
            }
            const transactionHeaderY = (pageNumber === 1 ? startY : startY + NON_FIRST_PAGE_OFFSET) - 110;
            const balanceLabel = 'Available Balance:';
            const balanceValue = `R${statementDetails?.summary.availableBalance}`;
            firstPage.drawText(formatStampDate(Date.now()), {
                x: 229.5,
                y: height - 112,
                size: 10,
                font: fontBold,
                color: COLORS.stampColor
            });

            if (pageNumber === 1) {
                // On the first page draw header and balance
                firstPage.drawText('Transaction details', {
                    x: left,
                    y: transactionHeaderY,
                    size: 10,
                    font: fontBold,
                    color: COLORS.bankBlue
                });
                const labelWidth = font.widthOfTextAtSize(balanceLabel, 10);
                const valueWidth = fontBold.widthOfTextAtSize(balanceValue, 10);
                const totalWidth = labelWidth + valueWidth + 5;
                const balanceX = width - rightMargin - totalWidth;
                firstPage.drawText(balanceLabel, {
                    x: balanceX,
                    y: transactionHeaderY,
                    size: 10,
                    font: font,
                    color: COLORS.bankBlue
                });
                firstPage.drawText(balanceValue, {
                    x: balanceX + labelWidth + 5,
                    y: transactionHeaderY,
                    size: 10,
                    font: fontBold,
                    color: COLORS.bankBlue
                });
            } else {
                // For other pages, draw header and also show available balance
                firstPage.drawText('Transaction details', {
                    x: left,
                    y: transactionHeaderY,
                    size: 10,
                    font: fontBold,
                    color: COLORS.bankBlue
                });
                const labelWidth = font.widthOfTextAtSize(balanceLabel, 10);
                const valueWidth = fontBold.widthOfTextAtSize(balanceValue, 10);
                const totalWidth = labelWidth + valueWidth + 5;
                const balanceX = width - rightMargin - totalWidth;
                firstPage.drawText(balanceLabel, {
                    x: balanceX,
                    y: transactionHeaderY,
                    size: 10,
                    font: font,
                    color: COLORS.bankBlue
                });
                firstPage.drawText(balanceValue, {
                    x: balanceX + labelWidth + 5,
                    y: transactionHeaderY,
                    size: 10,
                    font: fontBold,
                    color: COLORS.bankBlue
                });
            }
            const tableStartY = transactionHeaderY - 6;
            const tableLeft = left;
            const tableRight = width - rightMargin;
            const tableWidth = tableRight - tableLeft;

            const pageTx = transactions.slice(start, end);
            renderTable(
                firstPage,
                pageTx,
                { font, fontBold },
                {
                    tableLeft,
                    tableStartY,
                    tableWidth,
                    bottomPadding: 0
                }
            );
            renderFooter(firstPage, pageNumber, totalPages, { font }, { left, bottom: 12, width });
            const pdfBytes = await pdfDoc.save();
            const outPath = path.resolve(`${accountFolder}/statement${pageNumber}.pdf`);
            fs.writeFileSync(outPath, pdfBytes);
            return outPath;
        })
    );

    // Create a dedicated summary page
    const summaryPdfBytes = new Uint8Array(fs.readFileSync(inPath));
    const summaryDoc = await PDFDocument.load(summaryPdfBytes);
    summaryDoc.registerFontkit(fontkit);

    const summaryPages = summaryDoc.getPages();
    const summaryFirstPage = summaryPages[0];
    const { height: summaryHeight, width: summaryWidth } = summaryFirstPage.getSize();

    const summaryFont: PDFFont = await summaryDoc.embedFont(StandardFonts.Helvetica);
    const summaryFontBold: PDFFont = await summaryDoc.embedFont(StandardFonts.HelveticaBold);

    const summaryStartY = summaryHeight - topOffset;

    // Render account number and statement period on summary page (like pages 2+)
    const labelSummary = 'Account number:';
    const fontSizeAccount = 9;
    const maxLabelWidthSummary = summaryFont.widthOfTextAtSize(labelSummary, fontSizeAccount);
    const valueXSummary = left + maxLabelWidthSummary + 5;
    const accountYSummary = summaryStartY;
    summaryFirstPage.drawText(labelSummary, { x: left, y: accountYSummary, size: fontSizeAccount, font: summaryFont, color: COLORS.bankBlue });
    summaryFirstPage.drawText(statementDetails.accountNumber, {
        x: valueXSummary,
        y: accountYSummary,
        size: fontSizeAccount,
        font: summaryFontBold,
        color: COLORS.bankBlue
    });

    // Draw statement period on the right side
    const dateRowsSummary = [`From: ${statementDetails.statementPeriod.from}`, `To: ${statementDetails.statementPeriod.to}`];
    const fontSizeDateSummary = fontSizeAccount - 1;
    dateRowsSummary.forEach((dateLabel, idx) => {
        const dateY = accountYSummary - (lineGap + 0.5) * idx + 47;
        const textWidth = summaryFont.widthOfTextAtSize(dateLabel, fontSizeDateSummary);
        const xPos = summaryWidth - rightMargin - textWidth;
        summaryFirstPage.drawText(dateLabel, { x: xPos, y: dateY, size: fontSizeDateSummary, font: summaryFont, color: COLORS.bankBlue });
    });

    // Render stamp date
    summaryFirstPage.drawText(formatStampDate(Date.now()), {
        x: 229.5,
        y: summaryHeight - 112,
        size: 10,
        font: summaryFontBold,
        color: COLORS.stampColor
    });

    // Draw disclaimer text in gray and move it up by 60
    const disclaimerText = 'Please verify all transactions reflected on this statement and notify any discrepancies to the bank as soon as possible.';
    const disclaimerY = summaryStartY - 60;
    summaryFirstPage.drawText(disclaimerText, {
        x: left,
        y: disclaimerY,
        size: 10,
        font: summaryFont,
        color: COLORS.grayColor,
        maxWidth: summaryWidth - left - rightMargin,
        lineHeight: 14
    });

    // Render summary
    renderSummary(
        summaryFirstPage,
        statementDetails.summary,
        { fontBold: summaryFontBold, font: summaryFont },
        {
            y: disclaimerY - 80,
            left,
            width: summaryWidth,
            rightMargin
        }
    );

    // Footer on summary page
    const totalPagesWithSummary = totalPages + 1;
    renderFooter(summaryFirstPage, totalPagesWithSummary, totalPagesWithSummary, { font: summaryFont }, { left, bottom: 12, width: summaryWidth });

    // Save summary page in account folder
    const summaryBytes = await summaryDoc.save();
    const summaryPath = path.resolve(`${accountFolder}/statement${totalPagesWithSummary}.pdf`);
    fs.writeFileSync(summaryPath, summaryBytes);
    results.push(summaryPath);

    // Merge all generated per-page PDFs into a single PDF
    const mergedDoc = await PDFDocument.create();
    for (const pageFile of results) {
        const fileBytes = fs.readFileSync(pageFile);
        const srcDoc = await PDFDocument.load(new Uint8Array(fileBytes));
        const [copied] = await mergedDoc.copyPages(srcDoc, [0]);
        mergedDoc.addPage(copied);
    }

    const mergedBytes = await mergedDoc.save();
    const mergedPath = path.resolve(`${accountFolder}/bankstatement.pdf`);
    fs.writeFileSync(mergedPath, mergedBytes);

    // Delete individual statement files after merging
    for (const pageFile of results) {
        if (fs.existsSync(pageFile)) {
            fs.unlinkSync(pageFile);
            console.log(`Deleted individual statement file: ${pageFile}`);
        }
    }

    return mergedPath;
};

const formatStampDate = (dateInput: string | Date | number) => {
    const d = new Date(dateInput);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day} ${'Dec'} ${year}`;
};

const renderFooter = (
    page: PDFPage,
    pageNumber: number,
    totalPages: number,
    fonts: { font: PDFFont },
    position: { left: number; bottom: number; width: number }
) => {
    const { font } = fonts;
    const { left, bottom, width } = position;
    const footerText =
        'The Standard Bank of South Africa Limited (Reg. No. 1962/000738/06. Authorised financial service provider. VAT Reg No. 4100105461 Registered credit provider (NCRCP15).\nWe subscribe to the Code of Banking Association South Africa and, for unresolved disputes, support resolution through the Ombudsman for Banking Services';
    const pageText = `Pg ${pageNumber} of ${totalPages}`;
    page.drawText(footerText, {
        x: left,
        y: bottom + 20,
        size: 6,
        font: font,
        color: COLORS.grayColor,
        lineHeight: 7
    });
    page.drawText(pageText, {
        x: width - 60,
        y: bottom + 20,
        size: 8,
        font: font,
        color: COLORS.grayColor
    });
};
