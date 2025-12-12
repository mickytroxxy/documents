import { generateBankStatement } from '../src/handlers/generateStatement';

(async () => {
    const res = await generateBankStatement();
    console.log('Result:', res);
})();
