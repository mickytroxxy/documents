import OpenAI from 'openai';
import { StatementData } from '../handlers/standard/types';
import { TymeBankStatement } from '../handlers/tymebank/sample';

export type BankType = 'TYMEBANK' | 'FNB' | 'NEDBANK' | 'CAPITEC' | 'STANDARD' | 'ABSA';

export interface GenerateDocs {
    accountHolder: string;
    accountNumber: string;
    physicalAddress: string;
    months?: number;
    openBalance: number;
    availableBalance: number;
    employeeID?: string;
    taxNumber?: string;
    payDate?: string;
    salaryAmount?: number;
    bankType?: BankType;
    companyName: string;
    comment?: string;
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

// Helper function to extract and parse JSON from markdown code blocks
export const parseJSONResponse = (content: string): any => {
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

export type DeepSeekClient = OpenAI;
