// renderHeader.ts
import { PDFPage, PDFFont } from 'pdf-lib';
import { COLORS } from './constants';

export const renderContinuedHeader = (
    page: PDFPage,
    fonts: { fontBold: PDFFont },
    availableBalance: string,
    position: { left: number; startY: number; width: number; rightMargin: number }
) => {
    const { fontBold } = fonts;
    const { left, startY, width, rightMargin } = position;

    // Draw "Transaction details (continued)" header
    page.drawText('Transaction details (continued)', {
        x: left,
        y: startY,
        size: 10,
        font: fontBold,
        color: COLORS.bankBlue
    });

    // Draw available balance on the same line
    const balanceLabel = 'Available Balance:';
    const balanceText = availableBalance;
    const balanceLabelWidth = fontBold.widthOfTextAtSize(balanceLabel, 10);
    const balanceTextWidth = fontBold.widthOfTextAtSize(balanceText, 10);

    const totalWidth = balanceLabelWidth + balanceTextWidth + 10;
    const balanceX = width - rightMargin - totalWidth;

    page.drawText(balanceLabel, {
        x: balanceX,
        y: startY,
        size: 10,
        font: fontBold,
        color: COLORS.bankBlue
    });

    page.drawText(balanceText, {
        x: balanceX + balanceLabelWidth + 5,
        y: startY,
        size: 10,
        font: fontBold,
        color: COLORS.bankBlue
    });

    return startY - 20; // Return table start Y position
};
