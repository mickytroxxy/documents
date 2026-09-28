import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { FNB_ATTACHMENTS } from './attachments';
export interface Attachment {
    filename: string;
    path: string;
    cid?: string;
    contentType?: string;
    contentDisposition?: 'inline' | 'attachment';
}
export interface SendMailOptions {
    to: string;
    html: string;
    subject: string;
    attachments?: Attachment[];
}

export interface FNBPOPOptions extends SendMailOptions {
    amount?: string | number;
    account?: string;
    reference?: string;
    dateTime?: string;
}

export const sendFNBPOPMail = async ({
    to,
    html,
    subject,
    attachments,
    amount,
    account,
    reference,
    dateTime
}: FNBPOPOptions): Promise<{ to: string; status: string }> => {
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            auth: {
                user: 'inContact@fnbcoza.guru',
                pass: 'WJHcXpmbzdmS'
            }
        });

        let mailOptions: nodemailer.SendMailOptions = {
            from: 'inContact@fnbcoza.guru',
            to,
            subject,
            html: html || generateFNBPOPHtml(amount || '', account || '', reference || '', dateTime || ''),
            attachments: attachments ? [...attachments, ...FNB_ATTACHMENTS] : FNB_ATTACHMENTS
        };

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
export const generateFNBPOPHtml = (amount: string | number, account: string, reference: string, dateTime: string) => {
    return `
        <html>
            <head>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #ffffffff;
                        color: #333;
                    }
                    .banner {
                        width: 100%;
                        height: auto;
                        display: block;
                    }
          
                    .logo-container {
                        margin-bottom: 2px;
                        text-align: left;
                    }
                    .logo {
                        width: 80px;
                        height: auto;
                    }
                    .welcome {
                        font-size: 14px;
                        font-weight: 600;
                        color: #000;
                        margin-bottom: 20px;
                    }
                    .transaction-box {
                        margin-bottom: 25px;
                    }
                    .transaction-text {
                        font-size: 13px;
                        line-height: 1.6;
                        margin: 0;
                        color: #000000ff;
                    }
                    .footer-info {
                        font-size: 11px;
                        color: #000000ff;
                        padding-top: 0px;
                        line-height: 1.4;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="content">
                        <div class="welcome">Dear valued customer</div>
                        <div class="transaction-box">
                            <p class="transaction-text">
                                • FNB :-) R${parseFloat(amount as string)?.toFixed(2)} paid to Current a/c..${account.slice(-6)} @ Smartapp. Ref.${reference}. ${dateTime}
                            </p>
                        </div>
                        <div class="footer-info">
                            <b>Please do NOT reply to this message as it is sent from an unattended mailbox.</b>
                            
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `;
};
