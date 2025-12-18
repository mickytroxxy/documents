import { generateScheduledPaymentsPDF } from '../src/handlers/capitec/scheduledPayments';
import { capitec_sample } from '../src/handlers/capitec/sample';

(async () => {
    await generateScheduledPaymentsPDF(capitec_sample);
    console.log('Scheduled Payments PDF generated');
})();
