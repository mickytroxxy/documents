import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSecretKeys } from '../helpers/api';
import { parseJSONResponse, FinancialDataResponse, GenerateDocs } from './shared';
import { TymeBankStatement } from '../handlers/tymebank/sample';
import { generateTymeBankPrompt } from '../handlers/tymebank/prompt';

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

    const systemMessage =
        'You are a financial data generator for TymeBank. Generate realistic South African bank statement data in valid JSON format only.';

    const statements: any[] = [];
    const today = new Date();
    let currentBalance = openBalance;

    for (let i = 0; i < months; i++) {
        const daysPerPeriod = 30;
        const totalDays = months * daysPerPeriod;
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - totalDays + i * daysPerPeriod);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + daysPerPeriod - 1);

        if (i === months - 1) {
            endDate.setTime(today.getTime());
        }

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const startDay = startDate.getDate().toString().padStart(2, '0');
        const endDay = endDate.getDate().toString().padStart(2, '0');

        const statementPeriod = {
            from: `${startDay} ${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`,
            to: `${endDay} ${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`,
            generation_date: today.toISOString().split('T')[0]
        };

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
            openingBalance: currentBalance,
            physicalAddress,
            companyName,
            isLastMonth: i === months - 1,
            comment
        };

        const promptText = `${systemMessage}\n\n${generateTymeBankPrompt(monthlyPromptData)}`;

        // Attach reference PDF inline if provided (same pattern as financial.ts)
        const parts: any[] = [];
        if (referencePdfBase64) {
            parts.push({
                inlineData: { mimeType: 'application/pdf', data: referencePdfBase64 }
            });
        }
        parts.push({ text: promptText });

        try {
            const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
            const content = result.response.text() || '{}';
            let statementData = parseJSONResponse(content);

            if (statementData.transactions && Array.isArray(statementData.transactions)) {
                statementData.transactions = statementData.transactions.filter(
                    (tx: any) => !tx.description || !tx.description.toLowerCase().includes('opening balance')
                );

                if (statementData.transactions.length > 0) {
                    let recalculatedBalance = currentBalance;
                    const adjustedTransactions: any[] = [];
                    statementData.transactions.forEach((tx: any) => {
                        const moneyIn = tx.money_in !== '-' && tx.money_in !== null ? parseFloat(tx.money_in) : 0;
                        const moneyOut = tx.money_out !== '-' && tx.money_out !== null ? parseFloat(tx.money_out) : 0;
                        const fees = tx.fees !== '-' && tx.fees !== null ? parseFloat(tx.fees) : 0;

                        const totalDebit = moneyOut + fees;
                        const availableAfterIn = recalculatedBalance + moneyIn;
                        if (availableAfterIn < totalDebit) {
                            const needed = Math.ceil((totalDebit - availableAfterIn) * 100) / 100;
                            const descriptions = ['EFT from Client', 'Freelance Payment', 'Side Business Income', 'Refund Received', 'Gift Money'];
                            const topUp: any = {
                                date: tx.date,
                                description: descriptions[Math.floor(Math.random() * descriptions.length)],
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
                if (!statementData.customer_address && physicalAddress) {
                    statementData.customer_address = physicalAddress;
                }
                statements.push(statementData);
                currentBalance = statementData.closing_balance || currentBalance;
            }
        } catch (monthlyError) {
            console.error(`Failed to generate statement for month ${i + 1}:`, monthlyError);
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
