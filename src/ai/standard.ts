import { GoogleGenerativeAI } from '@google/generative-ai';
import { formStatementPrompt } from '../handlers/standard/prompt';
import { getSecretKeys } from '../helpers/api';
import { parseJSONResponse, FinancialDataResponse, GenerateDocs } from './shared';

export const generateStandardAI = async (data: GenerateDocs): Promise<FinancialDataResponse> => {
    const {
        accountHolder,
        payDate,
        accountNumber,
        months = 3,
        openBalance,
        availableBalance,
        salaryAmount,
        physicalAddress,
        companyName,
        comment,
        referencePdfBase64
    } = data;

    const keys = await getSecretKeys();
    if (!keys?.length || !keys[0].DEEP_SEEK_API) {
        throw new Error('Gemini API key not found in database');
    }

    const genAI = new GoogleGenerativeAI(keys[0].DEEP_SEEK_API);
    const model = genAI.getGenerativeModel({
        model: 'gemini-3.1-pro-preview',
    });

    const systemMessage = 'You are a financial data generator. Generate realistic South African bank statement data in valid JSON format only.';

    const userMessage = formStatementPrompt({
        accountHolder,
        payDate,
        accountNumber,
        months,
        openBalance,
        availableBalance,
        salaryAmount,
        physicalAddress,
        companyName,
        comment
    });

    const promptText = `${systemMessage}\n\n${userMessage}`;

    // Build parts — attach reference PDF inline if provided (same pattern as financial.ts)
    const parts: any[] = [];
    if (referencePdfBase64) {
        parts.push({
            inlineData: { mimeType: 'application/pdf', data: referencePdfBase64 }
        });
    }
    parts.push({ text: promptText });

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const content = result.response.text() || '{}';
    let responseData = parseJSONResponse(content);

    // Recalculate balances
    if (responseData.transactions && Array.isArray(responseData.transactions)) {
        let currentBalance = openBalance;
        responseData.transactions.forEach((tx: any) => {
            const deposit = parseFloat(tx.deposit?.replace(/,/g, '') || '0');
            const payment = parseFloat(tx.payment?.replace(/,/g, '') || '0');
            currentBalance += deposit;
            currentBalance -= payment;
            tx.balance = currentBalance.toFixed(2);
        });
        responseData.summary.availableBalance = currentBalance.toFixed(2);
    }

    return {
        status: 1,
        message: 'Generated AI data for standard bank statement',
        data: {
            statements: [responseData],
            rawData: { bankType: 'STANDARD', accountHolder, accountNumber }
        }
    };
};
