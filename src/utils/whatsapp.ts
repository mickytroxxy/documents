import axios from 'axios';

/**
 * Sends a WhatsApp message using the Whatchimp API
 * @param message - The text message to send
 * @param phoneNumber - The recipient's phone number
 * @returns Promise resolving to the API response
 */
export const sendWhatsAppMessage = async (message: string, phoneNumber: string): Promise<any> => {
  try {
    const apiToken = "20720|wylYTuT924sBZ6votjZGvOth9L3jYCjOP4csSTNK3730bc66";
    const phoneNumberId = "+15559645207";

    if (!apiToken) {
      throw new Error('WHATSAPP_API_TOKEN environment variable is not set');
    }

    if (!phoneNumberId) {
      throw new Error('WHATSAPP_PHONE_NUMBER_ID environment variable is not set');
    }

    const response = await axios.post(
      'https://app.whatchimp.com/api/v1/whatsapp/send',
      {
        apiToken,
        phone_number_id: phoneNumberId,
        message,
        phone_number: phoneNumber
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};