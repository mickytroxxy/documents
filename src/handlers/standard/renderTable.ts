// renderTable.ts
import { PDFPage, PDFFont } from 'pdf-lib';
import { COLORS, TABLE_CONFIG } from './constants';
import { Transaction } from './types';

export const renderTable = (
    page: PDFPage,
    transactions: Transaction[],
    fonts: { font: PDFFont; fontBold: PDFFont },
    position: { tableLeft: number; tableStartY: number; tableWidth: number; bottomPadding?: number }
) => {
    const { font, fontBold } = fonts;
    const { tableLeft, tableStartY, tableWidth } = position;
    const { rowHeight, headerHeight, fontSize, columnWidths } = TABLE_CONFIG;

    // Calculate last column width
    const fixedWidths = columnWidths.slice(0, -1).reduce((a, b) => a + b, 0);
    const actualColumnWidths = [...columnWidths];
    actualColumnWidths[4] = tableWidth - fixedWidths;

    const headers = ['Date', 'Description', 'Payments', 'Deposits', 'Balance'];

    // Draw header background (#0033aa)
    page.drawRectangle({
        x: tableLeft,
        y: tableStartY - headerHeight,
        width: tableWidth,
        height: headerHeight,
        color: COLORS.bankBlue
    });

    // Draw header text with PROPER vertical centering
    let x = tableLeft;
    headers.forEach((header, idx) => {
        const textWidth = fontBold.widthOfTextAtSize(header, fontSize);
        let headerX = x + 5;

        if (idx >= 2) {
            // Right align for numeric columns
            headerX = x + actualColumnWidths[idx] - textWidth - 5;
        }

        // Vertically center header text in the header row
        const headerBottomY = tableStartY - headerHeight;
        const headerY = headerBottomY + (headerHeight - fontSize) / 2;

        page.drawText(header, {
            x: headerX,
            y: headerY,
            size: fontSize,
            font: fontBold,
            color: COLORS.whiteColor
        });

        // Draw LIGHT WHITE vertical header borders
        if (idx < headers.length - 1) {
            page.drawLine({
                start: { x: x + actualColumnWidths[idx], y: tableStartY },
                end: { x: x + actualColumnWidths[idx], y: tableStartY - headerHeight },
                thickness: 0.05,
                color: COLORS.whiteBorderColor
            });
        }

        x += actualColumnWidths[idx];
    });

    // Draw top border
    page.drawLine({
        start: { x: tableLeft, y: tableStartY },
        end: { x: tableLeft + tableWidth, y: tableStartY },
        thickness: 0.5,
        color: COLORS.borderGray
    });

    // Draw bottom border of header
    page.drawLine({
        start: { x: tableLeft, y: tableStartY - headerHeight },
        end: { x: tableLeft + tableWidth, y: tableStartY - headerHeight },
        thickness: 0.5,
        color: COLORS.borderGray
    });

    // Calculate vertical positions for content rows
    // Use rowHeight to determine text positions
    const lineSpacing = 6; // Space between main and sub description

    // For each transaction row. Stop drawing if the next row's bottom would overlap
    // the `bottomPadding` area (reserved for footer). Calculate where the row bottom will be.
    const bottomPad = position.bottomPadding ?? 0;
    let rowsDrawn = 0;
    for (let rowIdx = 0; rowIdx < transactions.length; rowIdx++) {
        const transaction = transactions[rowIdx];
        const y = tableStartY - headerHeight - rowHeight * (rowIdx + 1);
        const nextRowBottom = y - rowHeight; // Where the next row would end

        // If this row's bottom (or the next row) would cross into the bottom padding area, stop drawing.
        if (y < bottomPad) break;

        // Calculate vertical positions based on rowHeight
        // Vertically center main text in the row and position sub text slightly below
        const mainTextY = y + (rowHeight - fontSize) / 2;
        const subTextY = mainTextY - lineSpacing;

        // Draw date (centered vertically in row)
        page.drawText(transaction.date, {
            x: tableLeft + 5,
            y: mainTextY + 5,
            size: fontSize,
            font: font,
            color: COLORS.blackColor
        });

        // Draw main description
        let descX = tableLeft + actualColumnWidths[0];
        page.drawText(transaction.mainDescription, {
            x: descX + 5,
            y: mainTextY + 5,
            size: fontSize,
            font: font,
            color: COLORS.blackColor
        });

        // Draw sub description if exists
        if (transaction.subDescription) {
            page.drawText(transaction.subDescription, {
                x: descX + 5,
                y: subTextY + 2,
                size: fontSize - 3,
                font: font,
                color: COLORS.blackColor
            });
        }

        // Draw payment (red, right-aligned, same Y as main text)
        if (transaction.payment) {
            const paymentX = tableLeft + actualColumnWidths[0] + actualColumnWidths[1];
            const textWidth = font.widthOfTextAtSize(transaction.payment, fontSize);
            page.drawText(transaction.payment, {
                x: paymentX + actualColumnWidths[2] - textWidth - 5,
                y: mainTextY + 5,
                size: fontSize,
                font: font,
                color: COLORS.redColor
            });
        }

        // Draw deposit (green, right-aligned, same Y as main text)
        if (transaction.deposit) {
            const depositX = tableLeft + actualColumnWidths[0] + actualColumnWidths[1] + actualColumnWidths[2];
            const textWidth = font.widthOfTextAtSize(transaction.deposit, fontSize);
            page.drawText(transaction.deposit, {
                x: depositX + actualColumnWidths[3] - textWidth - 5,
                y: mainTextY + 5,
                size: fontSize,
                font: font,
                color: COLORS.greenColor
            });
        }

        // Draw balance (bold, right-aligned, same Y as main text)
        const balanceX = tableLeft + actualColumnWidths[0] + actualColumnWidths[1] + actualColumnWidths[2] + actualColumnWidths[3];
        const balanceTextWidth = font.widthOfTextAtSize(transaction.balance, fontSize);
        page.drawText(transaction.balance, {
            x: balanceX + actualColumnWidths[4] - balanceTextWidth - 5,
            y: mainTextY + 5,
            size: fontSize,
            font: font,
            color: COLORS.blackColor
        });

        // Draw row bottom border on every row except the top header
        page.drawLine({
            start: { x: tableLeft, y },
            end: { x: tableLeft + tableWidth, y },
            thickness: 0.5,
            color: COLORS.borderGray
        });

        // Draw left and right borders for this row
        page.drawLine({
            start: { x: tableLeft, y: y + rowHeight },
            end: { x: tableLeft, y },
            thickness: 0.5,
            color: COLORS.borderGray
        });

        page.drawLine({
            start: { x: tableLeft + tableWidth, y: y + rowHeight },
            end: { x: tableLeft + tableWidth, y },
            thickness: 0.5,
            color: COLORS.borderGray
        });

        rowsDrawn++;
    }

    // Calculate the Y position of the last row bottom (for footer positioning)
    const finalYUnclamped = tableStartY - headerHeight - rowHeight * (rowsDrawn + 1);
    const finalY = finalYUnclamped;

    // No bottom border drawn — rows have their own borders

    return finalY;
};
