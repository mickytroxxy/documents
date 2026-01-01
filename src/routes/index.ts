import { Router } from 'express';

import { sendEmail } from '../handlers/sendEmail';

import { sendProofOfPayment } from '../handlers/proofOfPayment';
import { secrets } from '../server';
import { generateDocs, get_banks, get_companies, get_countries } from '../handlers/method';
import { authenticate } from '../handlers/auth';

const router = Router();
router.post('/proof', sendProofOfPayment);
router.post('/sendEmail', sendEmail);

router.get('/secrets', (req, res) => {
    res.json({ success: true, BASE_URL: secrets?.BASE_URL });
});

router.post('/generateDocs', generateDocs);
router.post('/authenticate', authenticate);
router.get('/get_countries', get_countries);
router.get('/get_companies', get_companies);
router.get('/get_banks', get_banks);

export default router;
