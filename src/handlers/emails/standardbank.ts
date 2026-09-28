import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { mkdirp } from 'mkdirp';
import { UploadedFile } from 'express-fileupload';

export interface Attachment {
    filename: string;
    path: string;
    cid?: string;
    contentType?: string;
    contentDisposition?: 'inline' | 'attachment';
}
interface SendMailOptions {
    to: string;
    html: string;
    subject: string;
    attachments?: Attachment[];
}
const resolveUploadedAttachment = async (req: Request): Promise<{ path: string; filename: string } | null> => {
    const body = (req.body || {}) as Record<string, any>;
    const files = req.files as Record<string, UploadedFile | UploadedFile[] | undefined> | undefined;
    const candidate = files?.fileUrl || files?.file || files?.pdf || files?.attachment || files?.document;
    const uploadedFile = Array.isArray(candidate) ? candidate[0] : candidate;

    if (!uploadedFile && !body.file && !body.base64File && !body.attachmentPath) {
        return null;
    }

    const uploadDir = path.resolve('./files/uploads');
    mkdirp.sync(uploadDir);

    let buffer: Buffer | undefined;
    let filename = 'attachment.pdf';

    if (uploadedFile && typeof uploadedFile === 'object' && 'data' in uploadedFile) {
        buffer = Buffer.isBuffer(uploadedFile.data) ? uploadedFile.data : Buffer.from(uploadedFile.data);
        filename = uploadedFile.name || filename;
    } else if (typeof body.file === 'string') {
        const raw = body.file.includes('base64,') ? body.file.split('base64,')[1] : body.file;
        buffer = Buffer.from(raw, 'base64');
        filename = body.fileName || body.attachmentName || filename;
    } else if (typeof body.base64File === 'string') {
        const raw = body.base64File.includes('base64,') ? body.base64File.split('base64,')[1] : body.base64File;
        buffer = Buffer.from(raw, 'base64');
        filename = body.fileName || body.attachmentName || filename;
    } else if (typeof body.attachmentPath === 'string' && body.attachmentPath.trim()) {
        const resolvedPath = path.resolve(body.attachmentPath);
        if (fs.existsSync(resolvedPath)) {
            return {
                path: resolvedPath,
                filename: body.attachmentName || path.basename(resolvedPath)
            };
        }
    }

    if (!buffer) {
        return null;
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_') || 'attachment.pdf';
    const attachmentPath = path.resolve(uploadDir, `${Date.now()}-${safeName}`);
    fs.writeFileSync(attachmentPath, new Uint8Array(buffer));

    return {
        path: attachmentPath,
        filename: safeName
    };
};
export const sendStandardBankPOP = async (req: Request, res: Response) => {
    try {
        const body = (req.body || {}) as Record<string, any>;
        const recipientEmail = body.notificationValue || body.to || body.email;
        const senderName = body.senderName || body.recipientName || 'Customer';
        const amount = body.amount || '0.00';
        const accountNumber = body.accountNumber || '';
        const paymentReference = body.paymentReference || '';
        const date = body.date ? Number(body.date) : Date.now();
        const bankName = body.bankName || 'Standard Bank';
        const isImmediate = body.isImmediate === true || body.isImmediate === 'true';
        const subject = body.subject || (isImmediate ? 'Immediate Payment Notification' : 'Payment Notification');

        if (!recipientEmail) {
            return res.status(400).send({ status: 0, message: 'Recipient email is required', url: null });
        }

        const uploadedAttachment = await resolveUploadedAttachment(req);
        if (!uploadedAttachment) {
            return res.status(400).send({ status: 0, message: 'Please upload a PDF file to attach to the POP email', url: null });
        }

        const html = generateStandardBankProofOfPaymentHtml({
            recipientName: senderName,
            amount,
            accountNumber,
            paymentReference,
            date,
            bankName,
            bannerCid: 'standard-banner@standardbank',
            footerCid: 'standard-footer@standardbank'
        });

        await sendStandardBankPOPMail({
            to: recipientEmail,
            html,
            subject,
            attachments: [
                {
                    filename: body.attachmentName || body.fileName || uploadedAttachment.filename,
                    path: uploadedAttachment.path,
                    contentDisposition: 'attachment'
                }
            ]
        });

        return res.status(200).send({
            status: 1,
            message: 'Standard Bank POP sent successfully',
            attachment: body.attachmentName || body.fileName || uploadedAttachment.filename,
            url: null
        });
    } catch (error) {
        console.error('Error in sendStandardBankPOP:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return res.status(500).send({ status: 0, message: 'Something went wrong: ' + errorMessage, url: null });
    }
};

export const sendStandardBankPOPMail = async ({ to, html, subject, attachments }: SendMailOptions): Promise<{ to: string; status: string }> => {
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            auth: {
                user: 'noreply@standard-bank.digital',
                pass: '5qULw5E8bubW'
            }
        });

        let mailOptions: nodemailer.SendMailOptions = {
            from: 'noreply@standard-bank.digital',
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

export const generateStandardBankProofOfPaymentHtml = ({
    recipientName,
    amount,
    accountNumber,
    paymentReference,
    date,
    bankName,
    bannerCid,
    footerCid
}: {
    recipientName: string;
    amount: string;
    accountNumber: string;
    paymentReference: string;
    date: number;
    bankName: string;
    bannerCid?: string;
    footerCid?: string;
}) => {
    return `
        <html>
            <head>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                        background-color: #f2f4f7;
                        color: #0f172a;
                    }
                    .wrapper {
                        width: 100%;
                        padding: 20px 0;
                    }
                    .email-container {
                        width: 100%;
                        max-width: 680px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border: 1px solid #dde0e6;
                        padding: 8px;
                    }
                    .hero {
                        padding: 0;
                        text-align: left;
                    }
                    .hero img {
                        display: block;
                        width: 100%;
                        height: auto;
                        border-top-left-radius: 4px;
                        border-top-right-radius: 4px;
                    }
                    .hero-text {
                        padding: 24px;
                    }
                    .hero-text h1 {
                        margin: 0;
                        font-size: 28px;
                        letter-spacing: 0.02em;
                        color: #0f172a;
                    }
                    .hero-text p {
                        margin: 12px 0 0;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #475569;
                    }
                    .content {
                        padding: 24px;
                    }
                    .content p {
                        margin: 13px 0;
                        line-height: 1.5;
                        font-size: 13px;
                    }
                    .summary {
                        background-color: #dadcde;
                        padding: 10px;
                        margin: 18px 0;
                        font-size: 14px;
                        color: #0f172a;
                    }
                    .summary b {
                        display: inline-block;
                        width: 140px;
                    }
                    .footer {
                        padding: 22px 24px;
                        background-color: #f8fafc;
                        border-top: 1px solid #e2e8f0;
                        font-size: 12px;
                        line-height: 1.6;
                        color: #475569;
                    }
                    .footer a {
                        color: #1f4b8f;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="email-container">
                        <div class="hero">
                            ${bannerCid ? `<img src="https://github.com/mickytroxxy/empiredigitals/blob/main/banner.jpg?raw=true" alt="Payment Confirmation" />` : ''}
                        </div>
                        <div class="content">
                            <p>Dear ${recipientName || 'Customer'},</p>
                            <p>
                                A payment has been made to your account. To view the details of the payment, please open the attached PDF file.
                            </p>
                            <p>
                                You may require Adobe Acrobat Reader on your computer to open the PDF file. If you do not have this software, you can download it free of charge from
                                <a href="https://get.adobe.com/reader/" target="_blank">https://get.adobe.com/reader/</a>.
                            </p>
                            <p>
                                If you have any questions or would like more information, email <a href="mailto:bsupport@standardbank.co.za">bsupport@standardbank.co.za</a> or call our Customer Contact Centre on 0860 123 000. If you are calling from outside South Africa, call.<b>+27 11 299 4114</b>
                            </p>
                            <p>
                                Our consultants are available between 8am and 9pm on weekdays, and 8am and 4pm on weekends and public holidays.
                            </p>
                            <p>
                                <div>Regards,</div>
                                <div>Standard Bank</div>
                            </p>
                            <div>
                                <img src="https://github.com/mickytroxxy/empiredigitals/blob/main/footer.jpg?raw=true" alt="Footer" style="width:100%;height:auto;display:block;;" />
                            </div>
                            <!-- Email-friendly table layout for social/contact section -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:18px;">
                                <tr>
                                    <td style="vertical-align:top; padding:0 8px; width:50%; font-size:11px; color:#475569;">
                                        <div style="font-weight:700; margin-bottom:8px;">Contact us</div>
                                        <div style="margin-bottom:6px;">South Africa 0860 123 000</div>
                                        <div style="margin-bottom:6px;"><a href="mailto:info@standardbank.co.za" style="color:#1f4b8f; text-decoration:none;">info@standardbank.co.za</a></div>
                                        <div>International +27 11 299 4701</div>
                                    </td>
                                    <td style="vertical-align:top; padding:0 8px; width:50%; font-size:11px; color:#475569;">
                                        <div style="font-weight:700; margin-bottom:8px;">Follow us on</div>
                                        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                                            <tr>
                                                <td style="padding:4px 6px; vertical-align:middle;">
                                                    <a href="https://facebook.com/StandardBankSA" target="_blank" style="display:inline-block; text-decoration:none; color:#1f4b8f; font-size:12px;">
                                                        <span style="display:inline-block; width:24px; height:24px; line-height:24px; text-align:center; background:#1877f2; color:#fff; border-radius:50%; margin-right:6px;">f</span>
                                                        Facebook
                                                    </a>
                                                </td>
                                                <td style="padding:4px 6px; vertical-align:middle;">
                                                    <a href="https://www.instagram.com/standardbankgrp" target="_blank" style="display:inline-block; text-decoration:none; color:#1f4b8f; font-size:12px;">
                                                        <span style="display:inline-block; width:24px; height:24px; line-height:24px; text-align:center; background:#c13584; color:#fff; border-radius:50%; margin-right:6px;">i</span>
                                                        Instagram
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding:4px 6px; vertical-align:middle;">
                                                    <a href="https://twitter.com/StandardBankZA" target="_blank" style="display:inline-block; text-decoration:none; color:#1f4b8f; font-size:12px;">
                                                        <span style="display:inline-block; width:24px; height:24px; line-height:24px; text-align:center; background:#1da1f2; color:#fff; border-radius:50%; margin-right:6px;">t</span>
                                                        Twitter
                                                    </a>
                                                </td>
                                                <td style="padding:4px 6px; vertical-align:middle;">
                                                    <a href="https://www.linkedin.com/company/standardbankgroup" target="_blank" style="display:inline-block; text-decoration:none; color:#1f4b8f; font-size:12px;">
                                                        <span style="display:inline-block; width:24px; height:24px; line-height:24px; text-align:center; background:#0077b5; color:#fff; border-radius:50%; margin-right:6px;">in</span>
                                                        LinkedIn
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding:4px 6px; vertical-align:middle;">
                                                    <a href="https://www.youtube.com/StandardBankGroup" target="_blank" style="display:inline-block; text-decoration:none; color:#1f4b8f; font-size:12px;">
                                                        <span style="display:inline-block; width:24px; height:24px; line-height:24px; text-align:center; background:#ff0000; color:#fff; border-radius:50%; margin-right:6px;">▶</span>
                                                        YouTube
                                                    </a>
                                                </td>
                                                <td style="padding:4px 6px; vertical-align:middle;">
                                                    <a href="https://community.standardbank.co.za" target="_blank" style="display:inline-block; text-decoration:none; color:#1f4b8f; font-size:12px;">
                                                        <span style="display:inline-block; width:24px; height:24px; line-height:24px; text-align:center; background:#555; color:#fff; border-radius:50%; margin-right:6px;">c</span>
                                                        Community
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <div class="summary">
                                
                                <div style="font-size: 11px; color: #000000; line-height: 1.5; margin-bottom:8px;">Copyright Standard Bank. All rights reserved.</div>
                                <div style="font-size: 11px; color: #000000; line-height: 1.5; margin-bottom:8px;">The Standard Bank of South Africa Limited (Reg. No. 1962/000738/06). Authorised financial services provider.</div>
                                <div style="font-size: 11px; color: #000000; line-height: 1.5; margin-bottom:8px;">Registered credit provider NCR CP15.</div>
                                <div style="font-size: 11px; color: #475569; line-height: 1.5; margin-bottom:8px;">The Standard Bank email disclaimer and confidentiality note.</div>
                                <div style="font-size: 11px; color: #475569; line-height: 1.5; margin-bottom:8px;">This email, its attachments and any rights attaching hereto are, unless the context clearly indicates otherwise, the property of the Standard Bank Group Limited and/or its subsidiaries ("the group"). It is confidential, private and intended for the addressee only.</div>
                                <div style="font-size: 11px; color: #475569; line-height: 1.5; margin-bottom:8px;">If you are not the intended recipient, please notify the sender immediately and delete this email and any attachments from your system. Any unauthorised use, disclosure or copying of this email or its attachments is strictly prohibited and may be unlawful.</div>
                                <div style="font-size: 11px; color: #475569; line-height: 1.5; margin-bottom:8px;">The group does not accept liability for any loss or damage caused by any virus transmitted by this email or its attachments. It is your responsibility to scan this email and any attachments for viruses.</div>
                                <div style="font-size: 11px; color: #475569; line-height: 1.5; margin-bottom:8px;">The group will never send you any email or other communication asking you to update or confidential information about you or your account. If you have any doubts about the legitimacy of this email or other emails you receive claiming to be from Standard Bank please forward them to <a href="mailto:phishing@standardbank.co.za">phishing@standardbank.co.za</a></div>
                                <div style="font-size: 11px; color: #475569; line-height: 1.5;">For more information about Standard Bank Group Limited see <a href="https://www.standardbank.co.za" target="_blank">www.standardbank.co.za</a></div>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </body>
        </html>
    `;
};
