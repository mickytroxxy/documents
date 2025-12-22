import { generateStandardAI } from '../ai/standard';
import { generateTymebankAI } from '../ai/tymebank';
import { generateCapitecAI } from '../ai/capitec';
import { FinancialDataResponse, GenerateDocs, BankType } from '../ai/shared';

/**
 * Entry point dispatcher for statement generation by bank type.
 */
export const generateStatementData = async (data: GenerateDocs): Promise<FinancialDataResponse> => {
    const { accountHolder, accountNumber, bankType = 'STANDARD' } = data;

    if (!accountHolder || !accountNumber) {
        return {
            status: 0,
            message: 'Account holder and account number are required',
            error: 'Missing required fields'
        };
    }

    try {
        if (bankType === 'TYMEBANK') {
            return await generateTymebankAI(data);
        } else if (bankType === 'CAPITEC') {
            return await generateCapitecAI(data);
        } else {
            return await generateStandardAI(data);
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

// Re-export shared types for downstream imports
export type { FinancialDataResponse, GenerateDocs, BankType };
