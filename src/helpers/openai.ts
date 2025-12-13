import OpenAI from 'openai';
import { StatementData } from '../handlers/standard/types';
import { formStatementPrompt, generateTymeBankPrompt } from '../handlers/standard/prompts';
import { getSecretKeys } from './api';
import { TymeBankStatement } from '../handlers/tymebank/sample';

// Helper function to extract and parse JSON from markdown code blocks
const parseJSONResponse = (content: string): any => {
    let cleanContent = content.trim();

    // Remove markdown code block markers if present
    if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    cleanContent = cleanContent.trim();

    // Try to parse JSON, with multiple fallback strategies for malformed responses
    try {
        return JSON.parse(cleanContent);
    } catch (parseError) {
        const error = parseError as Error;
        console.error('JSON parse error, attempting to fix malformed JSON:', error.message);

        // Fallback strategy 1: Extract JSON object using regex
        try {
            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (fallbackError1) {
            console.error('Regex extraction failed:', (fallbackError1 as Error).message);
        }

        // Fallback strategy 2: Try to fix common JSON issues
        try {
            // Fix trailing commas in objects
            let fixedContent = cleanContent.replace(/,\s*([}\]])/g, '$1');
            // Fix trailing commas in arrays
            fixedContent = fixedContent.replace(/,\s*]/g, ']');
            // Fix unquoted property names
            fixedContent = fixedContent.replace(/([\{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
            // Fix single quotes
            fixedContent = fixedContent.replace(/'/g, '"');

            return JSON.parse(fixedContent);
        } catch (fallbackError2) {
            console.error('JSON fixing attempt failed:', (fallbackError2 as Error).message);
        }

        // Fallback strategy 3: Try to extract key-value pairs manually
        try {
            const result: any = {};
            const lines = cleanContent.split('\n');

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('"') || trimmed.startsWith('{') || trimmed.startsWith('}') || trimmed === '') {
                    continue;
                }

                const colonIndex = trimmed.indexOf(':');
                if (colonIndex > 0) {
                    const key = trimmed
                        .substring(0, colonIndex)
                        .trim()
                        .replace(/^['"]|['"]$/g, '');
                    const value = trimmed.substring(colonIndex + 1).trim();

                    if (key && value) {
                        // Try to parse simple values
                        if (value === 'true') result[key] = true;
                        else if (value === 'false') result[key] = false;
                        else if (!isNaN(Number(value))) result[key] = Number(value);
                        else if (value.startsWith('"') && value.endsWith('"')) result[key] = value.slice(1, -1);
                        else if (value.startsWith('[') && value.endsWith(']')) {
                            try {
                                result[key] = JSON.parse(value);
                            } catch {
                                result[key] = value;
                            }
                        } else result[key] = value;
                    }
                }
            }

            if (Object.keys(result).length > 0) {
                return result;
            }
        } catch (fallbackError3) {
            console.error('Manual extraction failed:', (fallbackError3 as Error).message);
        }

        // If all strategies fail, return empty object
        console.error('All JSON parsing strategies failed, returning empty object');
        return {};
    }
};

export type BankType = 'TYMEBANK' | 'FNB' | 'NEDBANK' | 'CAPITEC' | 'STANDARD' | 'ABSA';

export interface GenerateDocs {
    accountHolder: string;
    accountNumber: string;
    includePayslip?: boolean;
    months?: number;
    openBalance: number;
    availableBalance: number;
    employeeID?: string;
    taxNumber?: string;
    payDate?: string;
    salaryAmount?: number;
    bankType?: BankType;
}

export interface FinancialDataResponse {
    status: number;
    message: string;
    data?: {
        statements: (StatementData | TymeBankStatement)[];
        rawData?: any;
    };
    error?: string;
}

export const generateStatementData = async (data: GenerateDocs): Promise<FinancialDataResponse> => {
    const { accountHolder, salaryAmount, payDate, accountNumber, months = 3, openBalance, availableBalance, bankType = 'standard' } = data;
    if (!accountHolder || !accountNumber) {
        return {
            status: 0,
            message: 'Account holder and account number are required',
            error: 'Missing required fields'
        };
    }

    try {
        // Fetch API keys from DB
        const keys = await getSecretKeys();
        if (!keys?.length || !keys[0].DEEP_SEEK_API) {
            throw new Error('DeepSeek API key not found in database');
        }

        const deepseek = new OpenAI({
            apiKey: keys[0].DEEP_SEEK_API,
            baseURL: 'https://api.deepseek.com/v1'
        });

        // Generate the appropriate prompt based on bank type
        const promptData = {
            accountHolder,
            payDate,
            accountNumber,
            months,
            salaryAmount,
            availableBalance,
            openBalance
        };

        const systemMessage =
            bankType === 'TYMEBANK'
                ? 'You are a financial data generator for TymeBank. Generate realistic South African bank statement data in valid JSON format only.'
                : 'You are a financial data generator. Generate realistic South African bank statement data in valid JSON format only.';

        // Generate AI data based on bank type
        if (bankType === 'TYMEBANK') {
            // For TymeBank, generate data for multiple months
            const statements: any[] = [];
            const today = new Date();
            let currentBalance = openBalance;

            for (let i = 0; i < months; i++) {
                // Calculate date ranges for each month - working FORWARDS from earliest to latest
                const startDate = new Date(today);
                startDate.setMonth(today.getMonth() - months + 1 + i);
                const endDate = new Date(startDate);
                endDate.setMonth(startDate.getMonth() + 1);
                endDate.setDate(0); // Last day of month

                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const startMonth = monthNames[startDate.getMonth()];
                const endMonth = monthNames[endDate.getMonth()];
                const startYear = startDate.getFullYear();
                const endYear = endDate.getFullYear();

                const statementPeriod = {
                    from: `01 ${startMonth} ${startYear}`,
                    to: `31 ${endMonth} ${endYear}`,
                    generation_date: today.toISOString().split('T')[0]
                };

                // Create prompt for this specific month with proper opening balance
                const monthlyPromptData = {
                    ...promptData,
                    statementPeriod,
                    currentMonth: i + 1,
                    totalMonths: months,
                    openingBalance: currentBalance // Use the carried-over balance
                };

                const monthlyUserMessage = generateTymeBankPrompt(monthlyPromptData);

                try {
                    const completion = await deepseek.chat.completions.create({
                        model: 'deepseek-chat',
                        messages: [
                            {
                                role: 'system',
                                content: systemMessage
                            },
                            { role: 'user', content: monthlyUserMessage }
                        ],
                        response_format: { type: 'json_object' },
                        temperature: 0.7,
                        max_tokens: 8192
                    });

                    const content = completion.choices?.[0]?.message?.content || '{}';
                    let statementData = parseJSONResponse(content);

                    // Remove opening balance transaction if AI added it
                    if (statementData.transactions && Array.isArray(statementData.transactions)) {
                        statementData.transactions = statementData.transactions.filter(
                            (tx: any) => !tx.description || !tx.description.toLowerCase().includes('opening balance')
                        );

                        // Recalculate balances after removing opening balance transaction
                        if (statementData.transactions.length > 0) {
                            let recalculatedBalance = currentBalance;
                            statementData.transactions.forEach((tx: any) => {
                                if (tx.money_in !== '-' && tx.money_in !== null) {
                                    recalculatedBalance += parseFloat(tx.money_in);
                                }
                                if (tx.money_out !== '-' && tx.money_out !== null) {
                                    recalculatedBalance -= parseFloat(tx.money_out);
                                }
                                if (tx.fees !== '-' && tx.fees !== null) {
                                    recalculatedBalance -= parseFloat(tx.fees);
                                }
                                tx.balance = recalculatedBalance;
                            });
                            statementData.closing_balance = recalculatedBalance;

                            // Add closing balance as a final transaction
                            statementData.transactions.push({
                                date: '',
                                description: 'Closing Balance',
                                fees: '',
                                money_out: '',
                                money_in: '',
                                balance: recalculatedBalance
                            });
                        }
                    }

                    // Add processed statement to array
                    if (statementData && typeof statementData === 'object' && Object.keys(statementData).length > 0) {
                        statements.push(statementData);
                        // Update current balance for next month using the closing balance
                        currentBalance = statementData.closing_balance || currentBalance;
                    }
                } catch (monthlyError) {
                    console.error(`Failed to generate statement for month ${i + 1}:`, monthlyError);
                    // Continue with next month even if one fails
                }
            }

            if (statements.length > 0) {
                return {
                    status: 1,
                    message: `Generated AI data for ${statements.length} TymeBank statements`,
                    data: {
                        statements: statements,
                        rawData: { bankType: 'TYMEBANK', accountHolder, accountNumber }
                    }
                };
            } else {
                throw new Error('Failed to generate any TymeBank statement data from AI');
            }
        } else {
            // Standard bank processing (single statement)
            const userMessage = formStatementPrompt({
                accountHolder,
                payDate,
                accountNumber,
                months,
                openBalance,
                availableBalance,
                salaryAmount
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
            const responseData = parseJSONResponse(content);

            return {
                status: 1,
                message: 'Generated AI data for standard bank statement',
                data: {
                    statements: [responseData],
                    rawData: { bankType: 'STANDARD', accountHolder, accountNumber }
                }
            };
        }
    } catch (error) {
        console.log(error);
        return {
            status: 0,
            message: 'Failed to generate financial data',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
