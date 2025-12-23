import OpenAI from 'openai';
import { generateTymeBankPrompt } from '../handlers/standard/prompts';
import { getSecretKeys } from '../helpers/api';
import { parseJSONResponse, FinancialDataResponse, GenerateDocs } from './shared';
import { TymeBankStatement } from '../handlers/tymebank/sample';

/**
 * Generate TymeBank statement data (multi-month sequence)
 */
export const generateTymebankAI = async (data: GenerateDocs): Promise<FinancialDataResponse> => {
    const {
        accountHolder,
        salaryAmount,
        payDate,
        accountNumber,
        months = 3,
        openBalance,
        availableBalance,
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

    const systemMessage =
        'You are a financial data generator for TymeBank. Generate realistic South African bank statement data in valid JSON format only.';

    const statements: any[] = [];
    const today = new Date();
    let currentBalance = openBalance;

    for (let i = 0; i < months; i++) {
        // Calculate 30-day periods backwards from today
        const daysPerPeriod = 30;
        const totalDays = months * daysPerPeriod;
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - totalDays + i * daysPerPeriod);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + daysPerPeriod - 1);

        // For the last period, ensure it ends on today
        if (i === months - 1) {
            endDate.setTime(today.getTime());
        }

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const startMonth = monthNames[startDate.getMonth()];
        const endMonth = monthNames[endDate.getMonth()];
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();

        const startDay = startDate.getDate().toString().padStart(2, '0');
        const endDay = endDate.getDate().toString().padStart(2, '0');

        const statementPeriod = {
            from: `${startDay} ${startMonth} ${startYear}`,
            to: `${endDay} ${endMonth} ${endYear}`,
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
            companyName,
            isLastMonth: i === months - 1,
            comment
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
                    const adjustedTransactions: any[] = [];
                    statementData.transactions.forEach((tx: any) => {
                        const moneyIn = tx.money_in !== '-' && tx.money_in !== null ? parseFloat(tx.money_in) : 0;
                        const moneyOut = tx.money_out !== '-' && tx.money_out !== null ? parseFloat(tx.money_out) : 0;
                        const fees = tx.fees !== '-' && tx.fees !== null ? parseFloat(tx.fees) : 0;

                        // Prevent balance from going negative by adding top-up if needed
                        const totalDebit = moneyOut + fees;
                        const availableAfterIn = recalculatedBalance + moneyIn;
                        if (availableAfterIn < totalDebit) {
                            const needed = Math.ceil((totalDebit - availableAfterIn) * 100) / 100; // Round up to 2 decimals
                            const descriptions = ['EFT from Client', 'Freelance Payment', 'Side Business Income', 'Refund Received', 'Gift Money'];
                            const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
                            const topUp: any = {
                                date: tx.date,
                                description: randomDesc,
                                fees: '-',
                                money_in: needed.toFixed(2),
                                money_out: '-',
                                balance: (recalculatedBalance + needed).toFixed(2)
                            };
                            adjustedTransactions.push(topUp);
                            recalculatedBalance += needed;
                        }

                        recalculatedBalance += moneyIn;
                        recalculatedBalance -= moneyOut;
                        recalculatedBalance -= fees;
                        tx.balance = recalculatedBalance.toFixed(2);
                        adjustedTransactions.push(tx);
                    });
                    statementData.transactions = adjustedTransactions;
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
