import { PDFDocument, PDFFont, rgb, StandardFonts } from '@pdfme/pdf-lib';
import fs from 'fs';
import { mkdirp } from 'mkdirp';
import { COLORS, TABLE_CONFIG } from '../standard/constants';
import { CapitecBankStatement } from './sample';

function formatNumberToCurrency(num: number): string {
    // Handle negative numbers
    const isNegative = num < 0;
    const absoluteNum = Math.abs(num);

    // Format with space as thousand separator and dot as decimal
    const parts = absoluteNum.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const decimalPart = parts[1];

    return `${isNegative ? '-' : ''}R${integerPart}.${decimalPart}`;
}
export async function generateCapitecBankPDF(data: CapitecBankStatement) {
    const topOffset = 130;
    const lineGap = 12;
    const fontSize = 8;

    const interestReceived = data.money_in_summary?.breakdown?.interest || 4.64; // Already a number!
    const totalFees = data.fee_summary?.total || 913.19; // Already a number!
    const totalMoneyIn = data.money_in_summary?.total || 99544.79;
    const totalMoneyOut = data.money_out_summary?.total || 99299.11;

    mkdirp.sync('./files/capitec');
    const existingPdfBytes = fs.readFileSync('./files/capitec/input.pdf');
    const formPdfUint8Array = new Uint8Array(existingPdfBytes);
    const pdfDoc = await PDFDocument.load(formPdfUint8Array);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const secondPage = pages[1];

    const { height, width } = firstPage.getSize();
    const { height: secondPageHeight, width: secondPageWidth } = firstPage.getSize();
    const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const startY = height - topOffset;
    const secondPageStartY = secondPageHeight - topOffset;
    const gap = lineGap;

    const account_details_row: Array<[string]> = [
        [data?.account_holder.name],
        [data?.account_holder?.address?.street],
        [data?.account_holder?.address?.city],
        [data?.account_holder?.address?.location],
        [data?.account_holder?.address?.postal_code]
    ];
    account_details_row.forEach(([label], idx) => {
        const y = startY - gap * idx + 31;
        firstPage.drawText(label, { x: 34.5, y, size: fontSize, font: idx === 0 ? fontBold : font, color: COLORS.darkColor });
    });
    const statement_details_row: Array<[string, string]> = [
        ['From Date:', data.statement_period?.from_date || 'N/A'],
        ['To Date:', `${data.statement_period.to_date}`],
        ['Print Date:', data.bank_details?.print_date || 'N/A']
    ];
    const balance_details_row: Array<[string, string]> = [
        ['Opening Balance:', formatNumberToCurrency(data.balances?.opening_balance || 0)],
        ['Closing Balance:', formatNumberToCurrency(data.balances?.closing_balance || 0)],
        ['Available Balance:', formatNumberToCurrency(data.balances?.available_balance || 0)]
    ];
    console.log(formatNumberToCurrency(data.balances?.opening_balance || 0));
    const maxLabelWidth = Math.max(...statement_details_row.map(([label]) => font.widthOfTextAtSize(label, fontSize)));

    statement_details_row.forEach(([label, value], idx) => {
        const y = startY - gap * idx - 106;
        firstPage.drawText(label, { x: 34.5, y, size: fontSize, font, color: COLORS.darkColor });
        const valueWidth = fontBold.widthOfTextAtSize(value, fontSize);
        const valueXRight = width - 384 - valueWidth;
        firstPage.drawText(value, { x: valueXRight, y, size: fontSize, font: fontBold, color: COLORS.darkColor });
    });
    balance_details_row.forEach(([label, value], idx) => {
        const y = startY - gap * idx - 106;
        firstPage.drawText(label, { x: 222.5, y, size: fontSize, font, color: COLORS.darkColor });
        const valueWidth = fontBold.widthOfTextAtSize(value, fontSize);
        const valueXRight = width - 195.2 - valueWidth;
        firstPage.drawText(value, { x: valueXRight, y, size: fontSize, font: fontBold, color: COLORS.darkColor });
    });

    const interestBarWidth = Math.max(8.2, (interestReceived / Math.max(interestReceived, totalFees)) * 166.2);
    const feesBarWidth = Math.max(8.2, (totalFees / Math.max(interestReceived, totalFees)) * 166.2);
    firstPage.drawRectangle({ x: 161.8, y: startY - 163, width: interestBarWidth, height: 6.1, radius: 6, color: COLORS.capitecBlue });
    firstPage.drawRectangle({ x: 161.8, y: startY - 175, width: feesBarWidth, height: 6.1, radius: 6, color: COLORS.capitecTomato });
    const summary_values: Array<[string]> = [[formatNumberToCurrency(interestReceived)], [formatNumberToCurrency(totalFees)]];
    summary_values.forEach(([value], idx) => {
        const y = startY - gap * idx - 163;
        const valueWidth = fontBold.widthOfTextAtSize(value, fontSize);
        const valueXRight = width - 197 - valueWidth;
        firstPage.drawText(value, { x: valueXRight, y, size: fontSize, font: fontBold, color: COLORS.darkColor });
    });

    const money_in_summary: Array<[number]> = [
        [data?.money_in_summary?.breakdown?.other_income],
        [data?.money_in_summary?.breakdown?.cash_deposit],
        [data?.money_in_summary?.breakdown.transfer],
        [data?.money_in_summary?.breakdown?.interest]
    ];
    money_in_summary.forEach(([value], idx) => {
        const y = startY - gap * idx - 292;
        const maxMoneyInValue = Math.max(
            data?.money_in_summary?.breakdown?.other_income || 0,
            data?.money_in_summary?.breakdown?.cash_deposit || 0,
            data?.money_in_summary?.breakdown?.transfer || 0,
            data?.money_in_summary?.breakdown?.interest || 0
        );
        const barWidth = Math.max(10, (value / (maxMoneyInValue || 1)) * 59.5);
        firstPage.drawRectangle({ x: 155.5, y, width: barWidth, height: 6.3, radius: 6, color: COLORS.capitecBlue });
        const valueWidth = fontBold.widthOfTextAtSize(formatNumberToCurrency(value) || '', fontSize);
        const valueXRight = width - 311 - valueWidth;
        firstPage.drawText(formatNumberToCurrency(value) || '', { x: valueXRight, y, size: fontSize, font: fontBold, color: COLORS.darkColor });
    });

    const money_out_summary: Array<[number]> = [
        [data?.money_out_summary?.breakdown?.digital_payments],
        [data?.money_out_summary?.breakdown?.card_payments],
        [data?.money_out_summary?.breakdown?.cash_withdrawals],
        [data?.money_out_summary?.breakdown?.send_cash],
        [data?.money_out_summary?.breakdown?.fees || 0],
        [data?.money_out_summary?.breakdown?.card_subscriptions || 0],
        [data?.money_out_summary?.breakdown?.prepaid || 0],
        [data?.money_out_summary?.breakdown?.debit_orders || 0],
        [data?.money_out_summary?.breakdown?.transfer || 0],
        [data?.money_out_summary?.breakdown?.vouchers || 0]
    ];
    money_out_summary.forEach(([value], idx) => {
        const y = startY - gap * idx - 292.3;
        const maxMoneyOutValue = Math.max(
            data?.money_out_summary?.breakdown?.digital_payments || 0,
            data?.money_out_summary?.breakdown?.cash_withdrawals || 0,
            data?.money_out_summary?.breakdown?.card_payments || 0,
            data?.money_out_summary?.breakdown?.send_cash || 0,
            data?.money_out_summary?.breakdown?.fees || 0,
            data?.money_out_summary?.breakdown?.card_subscriptions || 0,
            data?.money_out_summary?.breakdown?.prepaid || 0,
            data?.money_out_summary?.breakdown?.debit_orders || 0,
            data?.money_out_summary?.breakdown?.transfer || 0,
            data?.money_out_summary?.breakdown?.vouchers || 0
        );
        const barWidth = Math.max(10, (value / (maxMoneyOutValue || 1)) * 59.9);
        firstPage.drawRectangle({ x: 429, y, width: barWidth, height: 6.3, radius: 6, color: COLORS.capitecTomato });
        const valueWidth = fontBold.widthOfTextAtSize(formatNumberToCurrency(value) || '', fontSize);
        const valueXRight = width - 37 - valueWidth;
        firstPage.drawText(formatNumberToCurrency(value) || '', { x: valueXRight, y, size: fontSize, font: fontBold, color: COLORS.darkColor });
    });

    const spending_summary: Array<[number]> = [
        [data?.spending_summary?.breakdown?.cash_withdrawal],
        [data?.spending_summary?.breakdown?.digital_payments],
        [data?.spending_summary?.breakdown?.rent],
        [data?.spending_summary?.breakdown?.uncategorised],
        [data?.spending_summary?.breakdown?.groceries],
        [data?.spending_summary?.breakdown?.fuel],
        [data?.spending_summary?.breakdown?.online_store],
        [data?.spending_summary?.breakdown?.alcohol],
        [data?.spending_summary?.breakdown?.investments],
        [data?.spending_summary?.breakdown?.children_dependants],
        [data?.spending_summary?.breakdown?.software_games],
        [data?.spending_summary?.breakdown?.takeaways],
        [data?.spending_summary?.breakdown?.restaurants],
        [data?.spending_summary?.breakdown?.cellphone],
        [data?.spending_summary?.breakdown?.vehicle_tracking],
        [data?.spending_summary?.breakdown?.activities],
        [data?.spending_summary?.breakdown?.pharmacy],
        [data?.spending_summary?.breakdown?.other_loans_accounts],
        [data?.spending_summary?.breakdown?.betting_lottery],
        [data?.spending_summary?.breakdown?.doctors_therapists]
    ];

    spending_summary.forEach(([value], idx) => {
        const y = startY - (gap + 1.12) * idx - 86.5;
        const maxSpendingValue = Math.max(
            Math.abs(data?.spending_summary?.breakdown?.cash_withdrawal || 0),
            Math.abs(data?.spending_summary?.breakdown?.digital_payments || 0),
            Math.abs(data?.spending_summary?.breakdown?.rent || 0),
            Math.abs(data?.spending_summary?.breakdown?.uncategorised || 0),
            Math.abs(data?.spending_summary?.breakdown?.groceries || 0),
            Math.abs(data?.spending_summary?.breakdown?.fuel || 0),
            Math.abs(data?.spending_summary?.breakdown?.online_store || 0),
            Math.abs(data?.spending_summary?.breakdown?.alcohol || 0),
            Math.abs(data?.spending_summary?.breakdown?.investments || 0),
            Math.abs(data?.spending_summary?.breakdown?.children_dependants || 0),
            Math.abs(data?.spending_summary?.breakdown?.software_games || 0),
            Math.abs(data?.spending_summary?.breakdown?.takeaways || 0),
            Math.abs(data?.spending_summary?.breakdown?.restaurants || 0),
            Math.abs(data?.spending_summary?.breakdown?.cellphone || 0),
            Math.abs(data?.spending_summary?.breakdown?.vehicle_tracking || 0),
            Math.abs(data?.spending_summary?.breakdown?.activities || 0),
            Math.abs(data?.spending_summary?.breakdown?.pharmacy || 0),
            Math.abs(data?.spending_summary?.breakdown?.other_loans_accounts || 0),
            Math.abs(data?.spending_summary?.breakdown?.betting_lottery || 0),
            Math.abs(data?.spending_summary?.breakdown?.doctors_therapists || 0)
        );
        const barWidth = Math.max(10, (Math.abs(value) / (maxSpendingValue || 1)) * 318);
        secondPage.drawRectangle({ x: 161, y, width: barWidth, height: 7, radius: 6, color: COLORS.capitecBlue });
        const valueWidth = fontBold.widthOfTextAtSize(formatNumberToCurrency(value) || '', fontSize);
        const valueXRight = width - 37 - valueWidth;
        secondPage.drawText(formatNumberToCurrency(value) || '', { x: valueXRight + 1, y, size: fontSize, font: fontBold, color: COLORS.darkColor });
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('./files/capitec/output.pdf', pdfBytes);
}
