import { Router } from 'express';

import { sendEmail } from '../handlers/sendEmail';

import { sendProofOfPayment } from '../handlers/proofOfPayment';
import { secrets } from '../server';
import { generateDocs, get_banks, get_companies, get_countries } from '../handlers/method';
import { authenticate } from '../handlers/auth';
import { create_id } from '../handlers/ids';
import { generate_business_bank_statement } from '../handlers/capitec/business';

const router = Router();
router.post('/proof', sendProofOfPayment);
router.post('/sendEmail', sendEmail);

router.get('/secrets', (req, res) => {
    res.json({ success: true, BASE_URL: secrets?.BASE_URL });
});

router.post('/generateDocs', generateDocs);
router.post('/create_id', create_id);
router.post('/generateBusinessStatement', generate_business_bank_statement);
router.post('/authenticate', authenticate);
router.get('/get_countries', get_countries);
router.get('/get_companies', get_companies);
router.get('/get_banks', get_banks);

export default router;
