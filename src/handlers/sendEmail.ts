import { Request, Response } from 'express';
import { currencyFormatter } from '../helpers';
import nodemailer from 'nodemailer';
import { UserProfile } from '../dtos/types';
import { createData } from '../helpers/api';

export const sendEmail = async (
    req: Request<{}, {}, { name: string; email: string; message: string; reason: string }>,
    res: Response
): Promise<void> => {
    const time = Date.now();
    const messageId = (time + Math.floor(Math.random() * 89999 + 10000000)).toString();
    const { name, email, message, reason } = req.body;
    await createData('web_messages', messageId, { time, messageId, name, email, message, reason });
    //sendPushNotification('ExponentPushToken[KLINnfFNXqXf1qicDwBDuP]', message);
    res.status(200).json({ message: 'success', status: 1, data: [] });
};

export const generateLoanHtml = (user: UserProfile, loanDetails: any) => {
    const { fname, email, phoneNumber } = user;
    const { loanAmount, purpose, repaymentTerm, creditScore } = loanDetails;

    // Construct the HTML
    return `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f7f7f7;
                        color: #333;
                    }
                    .container {
                        background-color: #ffffff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        max-width: 600px;
                        margin: 20px auto;
                        border: 1px solid #ddd;
                    }
                    .header {
                        font-weight: bold;
                        color: #4a7092;
                        text-align: center;
                        font-size: 24px;
                        margin-bottom: 20px;
                    }
                    .section-title {
                        font-weight: bold;
                        color: #4a7092;
                        font-size: 18px;
                        margin-top: 20px;
                        margin-bottom: 10px;
                    }
                    .section-content {
                        margin: 10px 0;
                    }
                    .cta {
                        text-align: center;
                        background-color: #e9f4fb;
                        padding: 15px;
                        border-radius: 8px;
                        margin-top: 20px;
                    }
                    .cta-button {
                        display: inline-block;
                        padding: 10px 20px;
                        background-color: #4a7092;
                        color: #fff;
                        border-radius: 5px;
                        text-decoration: none;
                        font-weight: bold;
                        margin-top: 10px;
                    }
                    .cta-button:hover {
                        background-color: #3a5874;
                    }
                    .footer {
                        margin-top: 20px;
                        font-size: 12px;
                        color: #4a7092;
                        text-align: center;
                    }
                    a{
                        color: #fff; 
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">Loan Application for ${fname}</div>

                    <div class="section-content">
                        <h2 class="section-title">Applicant Information</h2>
                        <p><strong>Name:</strong> ${fname}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Phone Number:</strong> ${phoneNumber}</p>
                    </div>

                    <div class="section-content">
                        <h2 class="section-title">Loan Request Details</h2>
                        <p><strong>Requested Amount:</strong> ${currencyFormatter(loanAmount)}</p>
                        <p><strong>Purpose of Loan:</strong> ${purpose}</p>
                        <p><strong>Repayment Term:</strong> ${repaymentTerm} months</p>
                        <p><strong>Applicant Credit Score:</strong> ${creditScore}</p>
                    </div>

                    <div class="section-content">
                        <h2 class="section-title">Supporting Information</h2>
                        <p>
                            MrDocs has vetted this application to ensure the applicant meets our initial screening criteria.
                            We have advised the applicant on credit management to support responsible borrowing. Additionally, we have
                            utilized facial recognition technology to help prevent identity theft and fraud, so you can proceed with peace of mind.
                        </p>
                    </div>

                    <div class="cta">
                        <h2>Become a MrDocs Partner</h2>
                        <p>
                            Register with MrDocs to receive documents directly on the platform. You can request additional signed documents or ask applicants to sign documents via MrDocs.
                            Working with verified identity owners helps you avoid potential financial losses and legal complications.
                        </p>
                        <a href="https://mrdocs.empiredigitals.org/" class="cta-button">Register with MrDocs</a>
                    </div>

                    <div class="footer">
                        <p>
                            This application was submitted via MrDocs by Empire Digitals.<br>
                            Please contact us for additional information if needed.<br>
                            <strong>Contact:</strong> mrdocs@empiredigitals.org | +27 10 510 2699
                        </p>
                    </div>
                </div>
            </body>
        </html>
    `;
};

interface Attachment {
    filename: string;
    path: string;
}

interface SendMailOptions {
    to: string;
    html: string;
    subject: string;
    attachments?: Attachment[];
}

export const sendMail = async ({ to, html, subject, attachments }: SendMailOptions): Promise<{ to: string; status: string }> => {
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            auth: {
                user: 'mrdocs@empiredigitals.org',
                pass: 'eVc2YpPq1KFq'
            }
        });

        let mailOptions: nodemailer.SendMailOptions = {
            from: 'mrdocs@empiredigitals.org',
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

export const sendPOPMail = async ({ to, html, subject, attachments }: SendMailOptions): Promise<{ to: string; status: string }> => {
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            auth: {
                user: 'noreply@capitecbanks.org',
                pass: 'aAQJZhQF9uAd'
            }
        });

        let mailOptions: nodemailer.SendMailOptions = {
            from: 'noreply@capitecbanks.org',
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
