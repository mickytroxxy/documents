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
    const existingPdfBytes = new Uint8Array(fs.readFileSync(inPath));
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
    const totalPagesWithSummary = totalPages + 1;

    const pageDescriptors = Array.from({ length: totalPagesWithSummary }).map((_, i) => {
        const pageNumber = i + 1;
        if (pageNumber <= totalPages) {
            const start = i === 0 ? 0 : firstPageCount + (i - 1) * otherPageCount;
            const end = i === 0 ? Math.min(firstPageCount, totalTx) : Math.min(start + otherPageCount, totalTx);
            return { pageNumber, start, end, isSummary: false };
        } else {
            return { pageNumber, start: 0, end: 0, isSummary: true };
        }
    });

    const outDir = path.dirname(outputFilePath ?? './files/statement/statement1.pdf');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const results = await Promise.all(
        pageDescriptors.map(async ({ pageNumber, start, end, isSummary }) => {
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            pdfDoc.registerFontkit(fontkit);

            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const { height, width } = firstPage.getSize();

            const fontBytes = fs.readFileSync(path.resolve('./files/fonts/Almarai-Regular.ttf'));
            const fontBoldBytes = fs.readFileSync(path.resolve('./files/fonts/Almarai-Bold.ttf'));
            const font: PDFFont = await pdfDoc.embedFont(new Uint8Array(fontBytes));
            const fontBold: PDFFont = await pdfDoc.embedFont(new Uint8Array(fontBoldBytes));

            const startY = height - topOffset;
            const gap = lineGap;

            if (isSummary) {
                const summaryStartY = height - topOffset;
                const labelSummary = 'Account number:';
                const fontSizeAccount = 9;
                const maxLabelWidthSummary = font.widthOfTextAtSize(labelSummary, fontSizeAccount);
                const valueXSummary = left + maxLabelWidthSummary + 5;
                const accountYSummary = summaryStartY;
                firstPage.drawText(labelSummary, { x: left, y: accountYSummary, size: fontSizeAccount, font, color: COLORS.bankBlue });
                firstPage.drawText(statementDetails.accountNumber, {
                    x: valueXSummary,
                    y: accountYSummary,
                    size: fontSizeAccount,
                    font: fontBold,
                    color: COLORS.bankBlue
                });

                const dateRowsSummary = [`From: ${statementDetails.statementPeriod.from}`, `To: ${statementDetails.statementPeriod.to}`];
                const fontSizeDateSummary = fontSizeAccount - 1;
                dateRowsSummary.forEach((dateLabel, idx) => {
                    const dateY = accountYSummary - (lineGap + 0.5) * idx + 47;
                    const textWidth = font.widthOfTextAtSize(dateLabel, fontSizeDateSummary);
                    const xPos = width - rightMargin - textWidth;
                    firstPage.drawText(dateLabel, { x: xPos, y: dateY, size: fontSizeDateSummary, font, color: COLORS.bankBlue });
                });

                firstPage.drawText(formatStampDate(Date.now()), {
                    x: 229.5,
                    y: height - 112,
                    size: 10,
                    font: fontBold,
                    color: COLORS.stampColor
                });

                const disclaimerText =
                    'Please verify all transactions reflected on this statement and notify any discrepancies to the bank as soon as possible.';
                const disclaimerY = summaryStartY - 50;
                firstPage.drawText(disclaimerText, {
                    x: left,
                    y: disclaimerY,
                    size: 10,
                    font: font,
                    color: COLORS.blackColor,
                    maxWidth: width - left - rightMargin,
                    lineHeight: 14
                });

                renderSummary(
                    firstPage,
                    statementDetails.summary,
                    { fontBold: fontBold, font: font },
                    {
                        y: disclaimerY - 80,
                        left,
                        width: width,
                        rightMargin
                    }
                );
            } else {
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
            }

            renderFooter(firstPage, pageNumber, totalPagesWithSummary, { font }, { left, bottom: 12, width });

            const pdfBytes = await pdfDoc.save();
            const outPath = path.resolve(`${accountFolder}/statement${pageNumber}.pdf`);
            fs.writeFileSync(outPath, pdfBytes);
            return outPath;
        })
    );

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
