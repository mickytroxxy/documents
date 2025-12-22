import OpenAI from 'openai';
import { generateTymeBankPrompt } from '../handlers/standard/prompts';
import { getSecretKeys } from '../helpers/api';
import { parseJSONResponse, FinancialDataResponse, GenerateDocs } from './shared';
import { TymeBankStatement } from '../handlers/tymebank/sample';

/**
 * Generate TymeBank statement data (multi-month sequence)
 */
export const generateTymebankAI = async (data: GenerateDocs): Promise<FinancialDataResponse> => {
    const { accountHolder, salaryAmount, payDate, accountNumber, months = 3, openBalance, availableBalance, physicalAddress, companyName } = data;

    const keys = await getSecretKeys();
    if (!keys?.length || !keys[0].DEEP_SEEK_API) {
        throw new Error('DeepSeek API key not found in database');
    }

    const deepseek = new OpenAI({
        apiKey: keys[0].DEEP_SEEK_API,
        baseURL: 'https://api.deepseek.com/v1'
    });

    const systemMessage =
        'You are a financial data generator for TymeBank. Generate realistic South African bank statement data in valid JSON format only.';

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
            accountHolder,
            payDate,
            accountNumber,
            months,
            salaryAmount,
            availableBalance,
            openBalance,
            statementPeriod,
            currentMonth: i + 1,
            totalMonths: months,
            openingBalance: currentBalance, // carried-over balance
            physicalAddress,
            companyName
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

            if (statementData && typeof statementData === 'object' && Object.keys(statementData).length > 0) {
                statements.push(statementData);
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
                statements: statements as TymeBankStatement[],
                rawData: { bankType: 'TYMEBANK', accountHolder, accountNumber }
            }
        };
    } else {
        return {
            status: 0,
            message: 'Failed to generate any TymeBank statement data from AI',
            error: 'Generation failed'
        };
    }
};
