import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { PDFDocument, StandardFonts, PDFFont, rgb } from 'pdf-lib';
import { mkdirp } from 'mkdirp';
import { sendMail, sendPOPMail } from './sendEmail';

// Helper function to format date as "30 March 2024 16:42" for SMS
const formatSmsDate = (dateInput: string | Date | number) => {
    const d = new Date(dateInput);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
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
    notificationNumber,
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
    const startY = height - topOffset * heightScale;
    const gap = lineGap * heightScale;

    const rows: Array<[string, string]> = [
        ['Beneficiary name', beneficiary],
        ['Bank name', bankName],
        ['Account number', accountNumber],
        ['Branch', branch],
        ['Payment Type', paymentType],
        ['Amount', `R${amount}`],
        ['Payment Reference', paymentReference]
    ];

    // Compute a value column X so all values align perfectly
    const maxLabelWidth = Math.max(...rows.map(([label]) => font.widthOfTextAtSize(label, fontSize)));
    const valuePadding = 75; // space between label and value columns
    const valueX = left + maxLabelWidth + valuePadding;

    rows.forEach(([label, value], idx) => {
        const y = startY - gap * idx;
        firstPage.drawText(label, { x: left, y, size: fontSize, font });
        firstPage.drawText(value, { x: valueX, y, size: fontSize, font });
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

    [
        ['Notification number', notificationNumber],
        ['Payment date', formatPaymentDate(date)]
    ].forEach(([label, value], idx) => {
        const y = startY - gap * idx + 41.5;
        firstPage.drawText(label as any, { x: left, y, size: fontSize, font });
        firstPage.drawText(value as any, { x: valueX, y, size: fontSize, font });
    });
    firstPage.drawText(
        `Please take note that ${senderName
            ?.split(' ')?.[0]
            ?.toUpperCase()} made a payment to your account. The payment details are as follows:` as any,
        {
            x: left - 2,
            y: startY + 63,
            size: fontSize,
            font
        }
    );
    // Helper function to format date as DD/MM/YYYY for stamp
    const formatStampDate = (dateInput: string | Date | number) => {
        const d = new Date(dateInput);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    firstPage.drawText(formatStampDate(Date.now()), {
        x: 191,
        y: startY + 235,
        size: 12,
        font,
        color: rgb(0.5, 0.5, 0.5)
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
export const generateLoanHtml = (senderName: string, title: string, isImmediate: boolean) => {
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
export const sendProofOfPayment = async (req: Request<{}, {}, ProofOfPayment>, res: Response) => {
    try {
        const { accountNumber, senderName, isImmediate, title, notificationType, notificationValue, beneficiary, amount, date } = req.body;
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
                if (notificationType === 'EMAIL') {
                    sendResults = await sendPOPMail({
                        to: notificationValue,
                        html: generateLoanHtml(senderName, title, isImmediate),
                        subject: isImmediate ? 'Immediate Payment Notification' : 'Payment Notification',
                        attachments: [
                            {
                                filename: `${isImmediate ? 'immediatePaymentNotification.pdf' : 'paymentNotification.pdf'}`,
                                path: attachmentPath
                            }
                        ]
                    });
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
