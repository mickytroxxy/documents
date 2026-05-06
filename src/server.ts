import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import './config/logging';
import { server } from './config/config';
import upload from 'express-fileupload';
import routes from './routes';
import path from 'path';
import cors from 'cors';
import { corsHandler } from './helpers/corsHandler';
import { createData } from './helpers/api';
import { generateCapitecBankPDF } from './handlers/capitec';
import { capitec_sample } from './handlers/capitec/sample';
import { generateCapitecAI } from './ai/capitec';
import { generateFNBBankPDF } from './handlers/fnb';
import { fnb_sample_statement } from './handlers/fnb/sample';
import { createBusinessBankStatementHandler } from './handlers/capitec/business/business';
import { CapitecBankStatement } from './handlers/capitec/business/business_sample';
import { generateIdImage } from './handlers/ids';
import { psdEditorHandler } from './handlers/ids/psdEditor';
import { generateFinancialStatementFromPdf } from './handlers/capitec/business/financial';
export const app = express();
export const application = app;
export let httpServer: ReturnType<typeof http.createServer>;

app.use(upload());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Remove default cors() to use our custom handler

export let secrets = {
    BASE_URL:`https://documents-621707723909.europe-west1.run.app/api`,

    //BASE_URL: `http://localhost:${server.SERVER_PORT}/api`,
    DEEP_SEEK_API: process.env.DEEP_SEEK_API || 'sk-aee53cdb70a04ea7baa613ddc897ade0',
    GEMINI_API: process.env.GEMINI_API || ''
};

export const Main = () => {
    app.use(express.urlencoded({ extended: true }));
    const filesPath = path.join(__dirname, '..', 'files');
    app.use('/api', express.static(filesPath));

    // serve generated ID images (handlers/ids) so that front-end can retrieve them
    const idsPath = path.join(__dirname, '..', 'src', 'handlers', 'ids');
    app.use('/ids', express.static(idsPath));

    // Apply CORS handler before routes to intercept all requests
    app.use(corsHandler);

    app.use(express.json());
    app.use('/api', routes);

    httpServer = http.createServer(app);

    httpServer.listen(server.SERVER_PORT, async () => {
        console.log(`Server started on ${server.SERVER_HOSTNAME}:${server.SERVER_PORT}`);
        //generateCapitecBankPDF(capitec_sample);
        // generateCapitecAI({
        //     accountHolder: 'MISS REBECCA KHAMBULA',
        //     accountNumber: '2234969383',
        //     months: 3,
        //     salaryAmount: 35000,
        //     payDate: '25',
        //     employeeID: 'EMP001',
        //     companyName: 'Tech Solutions Ltd',

        //     availableBalance: 131.23,
        //     openBalance: -114.45,
        //     bankType: 'CAPITEC',
        //     physicalAddress: '3860 SUPERCHARGE STREET, DEVLAND, FREEDOM PARK, 1811'
        // });

        // Generate a PDF for every statement in the sample array
        // (async () => {
        //     if (Array.isArray(CapitecBankStatement) && CapitecBankStatement.length) {
        //         for (const stmt of CapitecBankStatement) {
        //             try {
        //                 const fileName = `Account Statement_${stmt.account.statementNumber}_${stmt.account.statementDate}.pdf`;
        //                 const outPath = `src/handlers/capitec/business/output/${fileName}`;
        //                 await createBusinessBankStatementHandler(outPath, stmt);
        //                 console.log('Generated statement:', outPath);
        //             } catch (err) {
        //                 console.error('Error generating statement for', stmt.account.statementNumber, err);
        //             }
        //         }
        //     } else {
        //         console.warn('No CapitecBankStatement entries found.');
        //     }
        // })();
        //generateIdImage('output.png');

        const testIdInfo = {
            first_name: 'LIZZY MAPOTLAKELA',
            last_name: 'DIANGWANE',
            id: '9410200902080',
            gender: 'F',
            dob: '20 OCT 1994',
            issuing_date: '23 JAN 2023',
            documentId: '116555883'
        };
        generateIdImage(testIdInfo, 'output.png');
        // psdEditorHandler(testIdInfo);
        
        // Note: generateFinancialStatementFromPdf is now called from the API endpoint
        // when generating business bank statements with financials: { required: true }
        //generateFinancialStatementFromPdf(path.join(__dirname, '.','input.pdf'), '1234567890', 'Empire Digitals', 'Lameck Ndhlovu')
    });
};

export const Shutdown = (callback: any) => httpServer && httpServer.close(callback);

Main();
