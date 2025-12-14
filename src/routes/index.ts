import { Router } from 'express';

import { sendEmail } from '../handlers/sendEmail';

import { sendProofOfPayment } from '../handlers/proofOfPayment';
import { secrets } from '../server';
import { generateDocs } from '../handlers/method';
import { authenticate } from '../handlers/auth';

const router = Router();
router.post('/proof', sendProofOfPayment);
router.post('/sendEmail', sendEmail);

router.get('/secrets', (req, res) => {
    res.json({ success: true, BASE_URL: secrets?.BASE_URL });
});

router.post('/generateDocs', generateDocs);
router.post('/authenticate', authenticate);

export default router;
