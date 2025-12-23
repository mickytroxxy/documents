import OpenAI from 'openai';
import { formStatementPrompt } from '../handlers/standard/prompts';
import { getSecretKeys } from '../helpers/api';
import { parseJSONResponse, FinancialDataResponse, GenerateDocs } from './shared';

/**
 * Generate Standard bank statement data (single statement)
 */
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
        comment
    } = data;

    const keys = await getSecretKeys();
    if (!keys?.length || !keys[0].DEEP_SEEK_API) {
        throw new Error('DeepSeek API key not found in database');
    }

    const deepseek = new OpenAI({
        apiKey: keys[0].DEEP_SEEK_API,
        baseURL: 'https://api.deepseek.com/v1'
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

    const completion = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
            {
                role: 'system',
                content: systemMessage
            },
            { role: 'user', content: userMessage }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 8192
    });

    const content = completion.choices?.[0]?.message?.content || '{}';
    let responseData = parseJSONResponse(content);

    // Recalculate balances to ensure they are correct
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
