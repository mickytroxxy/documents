import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { PDFDocument, PDFFont, rgb, StandardFonts, degrees } from '@pdfme/pdf-lib';
import { mkdirp } from 'mkdirp';
import { sendFNBPOPMail, SendMailOptions } from './fnb';
import nodemailer from 'nodemailer';
export const formatPaymentDate = (dateInput: number | Date | string = new Date()) => {
    let date: Date;

    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'number' || typeof dateInput === 'string') {
        date = new Date(dateInput);
    } else {
        date = new Date();
    }

    // Fallback to current date if the provided date is invalid
    if (isNaN(date.getTime())) {
        date = new Date();
    }

    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Johannesburg',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(date);
    const day = parts.find((p) => p.type === 'day')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const hour = parts.find((p) => p.type === 'hour')?.value;
    const minute = parts.find((p) => p.type === 'minute')?.value;

    return `${day}${month} ${hour}:${minute}`;
};

// Helper function to format date as "30 March 2024 16:42" for SMS
const formatSmsDate = (dateInput: string | Date | number) => {
    const originalDate = new Date(dateInput);
    // Convert to SAST (UTC+2) to ensure correct time regardless of server location
    const d = new Date(originalDate.getTime() + 2 * 60 * 60 * 1000);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const day = d.getUTCDate();
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes}`;
};

export interface ProofOfPayment {
    amount: string;
    date: number;
    beneficiary: string;
    accountNumber: string;
    bankName: string;
    branch: string;
    paymentType: string;
    paymentReference: string;
    inputFilePath?: string; // defaults to ./proof.pdf
    outputFilePath?: string; // if not provided, overwrite inputFilePath
    notificationNumber: string;
    senderName: string;
    title: string;
    notificationType: 'EMAIL' | 'SMS';
    notificationValue: string;
    topOffset?: number; // distance from top edge where first line starts (default 150)
    lineGap?: number; // vertical gap between lines (default 20)
    fontSize?: number; // font size for all lines (default 12)
    left?: number; // x position for all lines (default 50)
    heightScale?: number; // scale factor applied to topOffset and lineGap (default 1)
    isImmediate: boolean;
    sendFnbEmail?: boolean;
}
export async function generateProof({
    amount,
    date,
    beneficiary,
    inputFilePath,
    outputFilePath,
    topOffset = 397,
    lineGap = 13.5,
    fontSize = 9,
    left = 44.5,
    heightScale = 1,
    accountNumber,
    branch,
    paymentType,
    paymentReference,
    bankName,
    isImmediate,
    senderName
}: ProofOfPayment): Promise<string> {
    const inPath = path.resolve(inputFilePath ?? './proof.pdf');

    if (!fs.existsSync(inPath)) {
        // Try alternative paths
        const alternativePaths = [
            './proof.pdf',
            '/app/proof.pdf',
            path.join(__dirname, '../proof.pdf'),
            path.join(__dirname, '../../proof.pdf'),
            path.join(process.cwd(), 'proof.pdf')
        ];

        console.log('Trying alternative paths:');
        for (const altPath of alternativePaths) {
            const resolvedPath = path.resolve(altPath);
            console.log(`  ${resolvedPath}: ${fs.existsSync(resolvedPath) ? 'EXISTS' : 'NOT FOUND'}`);
            if (fs.existsSync(resolvedPath)) {
                console.log('Using alternative path:', resolvedPath);
                return generateProof({ ...arguments[0], inputFilePath: resolvedPath });
            }
        }

        throw new Error(`Input PDF not found at: ${inPath}. Tried alternatives: ${alternativePaths.join(', ')}`);
    }
    const existingPdfBytes = new Uint8Array(fs.readFileSync(inPath));
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height } = firstPage.getSize();
    const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const startY = height - topOffset * heightScale;
    const gap = lineGap * heightScale;

    const rows: Array<[string]> = [[beneficiary?.toUpperCase()], [accountNumber], [bankName], [branch]];

    // Compute a value column X so all values align perfectly
    const maxLabelWidth = Math.max(...rows.map(([label]) => font.widthOfTextAtSize(label, fontSize)));
    const valuePadding = 75; // space between label and value columns
    const valueX = left + maxLabelWidth + valuePadding;

    rows.forEach(([value], idx) => {
        const y = startY + 92 - (gap + 2.5) * idx;
        firstPage.drawText(value, { x: valueX - 10, y, size: fontSize - 1, font: fontBold });
    });

    // Helper function to format date as DD/MM/YYYY HH:MM
    const formatPaymentDate = (dateInput: string | Date | number) => {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) throw new Error('Invalid date');

        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Africa/Johannesburg' // Force SA timezone
        }).format(d);
    };
    function formatNumberToCurrency(num: number, symbol = true): string {
        // Handle negative numbers
        const isNegative = num < 0;
        const absoluteNum = Math.abs(isFinite(num) ? num : 0);

        // Format with space as thousand separator and dot as decimal
        const parts = absoluteNum.toFixed(2).split('.');
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        const decimalPart = parts[1];

        return `${isNegative ? '-' : ''}${symbol ? 'R' : ''}${integerPart}.${decimalPart}`;
    }
    [[formatPaymentDate(date)], [`${formatNumberToCurrency(parseFloat(amount))}`], [paymentReference?.toUpperCase()]].forEach(([value], idx) => {
        const y = startY - 16 - (gap + 2.5) * idx;
        firstPage.drawText(value, { x: valueX - 10, y, size: fontSize - 1, font: fontBold });
    });
    const textBefore = 'Please note that ';
    let textAfter = ' has made an immediate payment, which is intended to reflect';
    if (!isImmediate) {
        textAfter = ` has made a payment to the beneficiary's account.`;
    }
    firstPage.drawText(textBefore, {
        x: left - 15,
        y: startY + 165,
        size: fontSize - 1,
        font
    });
    if (!isImmediate) {
        firstPage.drawRectangle({ x: left - 15, y: startY + 150, width: 200, height: 10, color: rgb(1, 1, 1) });
    }
    //firstPage.drawRectangle({ x: left - 20, y: startY - 130, width: 550, height: 70, color: rgb(1, 1, 1) });
    // Measure width of first part
    const widthBefore = font.widthOfTextAtSize(textBefore, fontSize - 1);

    // Draw beneficiary in bold
    firstPage.drawText(senderName?.toUpperCase?.(), {
        x: left - 15 + widthBefore,
        y: startY + 165,
        size: fontSize - 1,
        font: fontBold
    });

    // Measure width of beneficiary
    const widthBeneficiary = fontBold.widthOfTextAtSize(senderName?.toUpperCase?.(), fontSize - 1);

    // Draw remaining text
    firstPage.drawText(textAfter, {
        x: left - 14 + widthBefore + widthBeneficiary,
        y: startY + 165,
        size: fontSize - 1,
        font
    });
    // Helper function to format date as DD/MM/YYYY for stamp
    const formatStampDate = (dateInput: string | Date | number) => {
        const d = new Date(dateInput);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    firstPage.drawText(formatPaymentDate(date), {
        x: 265,
        y: startY + 297,
        size: 10.5,
        font,
        color: rgb(0.7, 0.7, 0.7),
        rotate: degrees(-10)
    });
    const pdfBytes = await pdfDoc.save();
    const outPath = path.resolve(outputFilePath ?? inPath);

    // Ensure directory exists
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Write file synchronously and verify it exists
    fs.writeFileSync(outPath, pdfBytes);

    // Verify file was written successfully
    if (!fs.existsSync(outPath)) {
        throw new Error(`Failed to write PDF file to: ${outPath}`);
    }

    // Verify file has content
    const stats = fs.statSync(outPath);
    if (stats.size === 0) {
        throw new Error(`PDF file is empty: ${outPath}`);
    }

    console.log(`PDF generated successfully: ${outPath} (${stats.size} bytes)`);
    return outPath;
}
export const generateCapitecPaymentConfirmationHtml = (senderName: string, title: string, isImmediate: boolean) => {
    return `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        color: #333;
                    }
                    .container {
                        margin: 0 auto;
                        background-color: #ffffff;
                        padding: 30px;
                    }
                    .main-content {
                        border-top: 2px solid #4e6066;
                        padding-top: 20px;
                    }
                    .footer-section {
                        border-top: 2px solid #4e6066;
                        padding-top: 30px;
                    }
                    .break {
                        margin-bottom: 15px;
                    }
                    .foo{
                        background-color: #ecf2f5;
                        margin-bottom: 15px;
                    }
                    .fooheader{
                        background-color: #4e6066;
                        padding: 15px;
                        color: #fff;
                        margin-top:10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="main-content">
                        <div class="break">Hello</div>
                        <div class="break">${title} ${senderName} made ${isImmediate ? 'an immediate' : 'a'} payment to your account.</div>
                        <div class="break">Please find the payment details attached.</div>
                        <div>Sincerely</div>
                        <div>Capitec</div>
                    </div>

                    <div class="footer-section">
                        <p style="font-size: 11px;">
                            This email contains official information from Capitec that is presented to you in PDF format.
                            In order to view the attachment your computer or mobile device must contain software to
                            read these files. You can download the software from www.adobe.com free of charge.
                        </p>
                        
                        <p class="break">
                        <div class="foo">
                            <div class="fooheader">
                                <div><b>Remember:</b> We will never send you a direct link asking for your personal information or your bank details.</div>
                                <div style="margin-top: 5px;">Read the Capitec Bank email disclaimer at https://www.capitecbank.co.za/email-disclaimer</div>
                            </div>

                            <div style="margin-top: 10px;padding: 10px;">
                                <p style="border-radius: 2px; padding: 7px; background-color: #fff; color: #30488fff; width:120px; text-align: center;">
                                    <a style="color: #30488fff; text-decoration: none;font-size: 11px;" href='https://www.capitecbank.co.za/contact-us/'><b>Contact us</b></a>
                                </p>
                                <p style="margin-top: 15px; font-size: 11px;">
                                    Capitec Bank is an authorised financial services provider (FSP 46669) and registered credit provider (NCRCP13)
                                    Capitec Bank Limited Reg. No.: 1980/003695/06
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `;
};
export const sendCapitecAppPOP = async (req: Request<{}, {}, ProofOfPayment>, res: Response) => {
    try {
        const {
            accountNumber,
            senderName,
            isImmediate,
            title,
            notificationType,
            notificationValue,
            beneficiary,
            amount,
            date,
            bankName,
            paymentReference,
            sendFnbEmail
        } = req.body;
        const inputFilePath = path.resolve('./files/proof.pdf');
        const notificationNumber = Math.floor(Math.random() * 899999 + 100000).toString();

        // Ensure directory exists
        mkdirp.sync('./files/' + accountNumber);
        const outputFilePath = path.resolve(
            `./files/${accountNumber}/${isImmediate ? 'immediatePaymentNotification.pdf' : 'paymentNotification.pdf'}`
        );

        console.log('Generating PDF...');
        const response = await generateProof({
            ...req.body,
            inputFilePath,
            outputFilePath,
            notificationNumber,
            paymentType: isImmediate ? 'Immediate payment' : 'Regular payment'
        });

        if (response) {
            // Verify the file exists and has content before sending email
            if (fs.existsSync(response)) {
                const stats = fs.statSync(response);
                console.log(`PDF file verified: ${response} (${stats.size} bytes)`);

                // Add a small delay to ensure file is fully written
                await new Promise((resolve) => setTimeout(resolve, 100));

                const attachmentPath = path.resolve(
                    `./files/${accountNumber}/${isImmediate ? 'immediatePaymentNotification.pdf' : 'paymentNotification.pdf'}`
                );
                let sendResults: any = false;
                console.log('Sending notification to ' + bankName + '...');
                if (notificationType === 'EMAIL') {
                    if (bankName?.toUpperCase()?.includes('First National Bank'.toUpperCase()) && sendFnbEmail) {
                        sendResults = await sendFNBPOPMail({
                            to: notificationValue,
                            html: '',
                            subject: `FNB :-) R${parseFloat(amount as string)?.toFixed(2)} paid to ${`Current a/c..${accountNumber.slice(-6)}`} @ ${`Smartapp. Ref.${paymentReference}.`}. ${formatPaymentDate(date)}`,
                            amount,
                            account: accountNumber,
                            reference: paymentReference,
                            dateTime: formatPaymentDate(date)
                        });
                    } else {
                        sendResults = await sendPOPMail({
                            to: notificationValue,
                            html: generateCapitecPaymentConfirmationHtml(senderName, title, isImmediate),
                            subject: isImmediate ? 'Immediate Payment Notification' : 'Payment Notification',
                            attachments: [
                                {
                                    filename: `${isImmediate ? 'immediatePaymentNotification.pdf' : 'paymentNotification.pdf'}`,
                                    path: attachmentPath
                                }
                            ]
                        });
                    }
                } else if (notificationType === 'SMS') {
                    sendResults = await handleSendSms(
                        notificationValue,
                        `Capitec: Payment from ${
                            senderName?.split(' ')?.[0]
                        } to account linked to ${beneficiary}. Amount: R${amount} on ${formatSmsDate(
                            date
                        )}. Ref: ${notificationNumber}. Call 0860102043`
                    );
                }
                return res.send({
                    status: 1,
                    message: 'Proof of payment generated and sent successfully',
                    url: `/${accountNumber}/${isImmediate ? 'immediatePaymentNotification.pdf' : 'paymentNotification.pdf'}`,
                    fileSize: stats.size
                });
            } else {
                console.error('PDF file not found after generation:', response);
                return res.send({ status: 0, message: 'PDF generation failed - file not found', url: null });
            }
        } else {
            return res.send({ status: 0, message: 'PDF generation failed', url: null });
        }
    } catch (error) {
        console.error('Error in sendProofOfPayment:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return res.send({ status: 0, message: 'Something went wrong: ' + errorMessage, url: null });
    }
};

export const handleSendSms = async (to: string, body: string): Promise<{ message: string; data: any; success: boolean }> => {
    return new Promise((resolve, reject) => {
        const username = 'maggroup';
        const password = 'M0t0r@cc1d3nt@#12';
        const postData = JSON.stringify({
            to: [to],
            body: body,
            from: 'M.A.G'
        });

        const options = {
            hostname: 'api.bulksms.com',
            port: 443,
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length,
                Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
            }
        };

        const request = https.request(options, (resp) => {
            let data = '';
            console.log('Response status:', resp.statusCode);
            console.log('Response headers:', resp.headers);

            resp.on('data', (chunk: Buffer) => {
                data += chunk.toString();
            });

            resp.on('end', () => {
                console.log('Response data:', data);

                if (resp.statusCode === 200 || resp.statusCode === 201) {
                    console.log(`SMS sent successfully to ${to}`);
                    resolve({ message: 'SMS sent successfully!', data: JSON.parse(data || '{}'), success: true });
                } else {
                    console.error(`SMS failed with status ${resp.statusCode}:`, data);
                    reject(new Error(`SMS failed with status ${resp.statusCode}: ${data}`));
                }
            });
        });

        request.on('error', (error) => {
            console.error('SMS request error:', error);
            reject(error);
        });

        // Write the POST data to the request
        request.write(postData);

        // End the request
        request.end();
    });
};
export const sendPOPMail = async ({ to, html, subject, attachments }: SendMailOptions): Promise<{ to: string; status: string }> => {
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            auth: {
                user: 'inContact@wefinancegroup.org',
                pass: '1hwaUJSf7gnN'
            }
        });

        let mailOptions: nodemailer.SendMailOptions = {
            from: 'inContact@wefinancegroup.org',
            to,
            subject,
            html
        };

        if (attachments && attachments.length > 0) {
            console.log('Adding attachments:', attachments);
            mailOptions = {
                ...mailOptions,
                attachments
            };
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error occurred: ' + error.message);
                reject(error);
            } else {
                console.log('Email sent: ' + info.response);
                resolve({ to, status: 'SENT' });
            }
        });
    });
};
