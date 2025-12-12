import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import jwt from 'jsonwebtoken';
export interface Test {
    fname: string;
    email: string;
    password: string;
}
export type LoginTypes = {
    phoneNumber: string;
    password: string;
    organizationId: string;
    from: 'APP' | 'WEB';
};
export interface IGetUserAuthInfoRequest extends Request {
    user: any;
}

export interface UploadPDFBodyTypes {
    documentId: string;
    documentType: string;
    fileCategory: string;
    type: string;
    requestId?: string;
    userId: string;
    fname: string;
    idType: string;
    country: string;
    files?: {
        fileUrl?: UploadedFile | UploadedFile[];
    };
}
export interface signatureBodyTypes {
    accountId: string;
    type: string;
    fileCategory: string;
    files?: {
        fileUrl?: UploadedFile | UploadedFile[];
    };
}
export type paymentDetailsType = {
    transactionAmount: number;
    transactionReference: string;
    transactionType: 'DEPOSIT' | 'PAYMENT';
};
export interface VerifyUserTypes {
    documentId: string;
    accountId: string;
    companyId: string;
    paymentDetails: paymentDetailsType;
    requestedDocuments: string[];
    requestType: 'TRANSACTION' | 'DOCUMENTS' | 'VERIFICATION' | 'CREDIT_CHECK';
    timeout: number;
}
export interface WaterMarkOptions {
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
    quality: number;
    margin: number;
    width: number;
    color: {
        dark: string;
        light: string;
    };
}
export interface RequestInfo {
    requestId: string;
    res: Response;
    requestedDocuments: string[];
    accountId: string;
    requestType: 'TRANSACTION' | 'DOCUMENTS' | 'VERIFICATION' | 'CREDIT_CHECK';
}
export type AccountType = {
    accountType: 'PRIMARY' | 'SAVINGS' | 'REWARD';
    balance: number;
};
export type AgentDataType = {
    type: 'WITHDRAWAL' | 'DEPOSITS';
    percentages: number;
    active: boolean;
};
export type LocationType = {
    latitude: number;
    longitude: number;
    text?: string;
    short_name?: string;
    long_name?: string;
};
export type UserProfile = {
    avatar: string;
    canSendSms: boolean;
    faceLogin: boolean;
    code: number;
    agentData: AgentDataType[];
    geoHash: string;
    isAgent: boolean;
    date: number;
    detectorMode: boolean;
    documents: number;
    dueDate: number;
    email: string;
    fname: string;
    id: string;
    notificationToken: string;
    password: string;
    phoneNumber: string;
    plan: string;
    referredBy: string;
    signatures: number;
    token: string;
    accounts: AccountType[];
    address: LocationType;
    isVerified: boolean;
    walletStatus?: 'INACTIVE' | 'BLOCKED' | 'ACTIVE';
    gender: string;
};
