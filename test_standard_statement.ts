declare const process: any;
import axios from 'axios';

// Default target server URL (configured to SERVER_PORT 1337 from .env)
const LOCAL_URL = process.env.PORT_URL || 'http://localhost:1337/api/generateStandardBankStatement';
const PROD_URL = 'https://documents-371330410186.europe-west1.run.app/api/generateStandardBankStatement';

// Change targetUrl to PROD_URL or LOCAL_URL as needed
const targetUrl = process.env.TEST_PROD === 'true' ? PROD_URL : LOCAL_URL;

const sampleAccountNumber = process.argv[2] || '10123456789';

async function testGenerateStandardStatement() {
    console.log(`Sending POST request to: ${targetUrl}`);
    console.log(`Payload: { accountNumber: "${sampleAccountNumber}" }`);

    try {
        const response = await axios.post(targetUrl, {
            accountNumber: sampleAccountNumber
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('\n--- Response Received (Status ' + response.status + ') ---');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.error('\n--- Request Failed ---');
        if (error.response) {
            console.error('Status Code:', error.response.status);
            console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
    }
}

testGenerateStandardStatement();
