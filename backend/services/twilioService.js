const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_WHATSAPP_FROM; // e.g., 'whatsapp:+14155238886'

const client = new twilio(accountSid, authToken);

const sendWhatsAppMessage = async (to, body) => {
    try {
        const messageOptions = {
            body: body,
            from: fromPhone,
            to: `whatsapp:${to}`
        };

        if (process.env.TWILIO_STATUS_CALLBACK_URL) {
            messageOptions.statusCallback = process.env.TWILIO_STATUS_CALLBACK_URL;
        }

        const message = await client.messages.create(messageOptions);
        console.log(`WhatsApp sent to ${to}: ${message.sid}`);
        return { success: true, sid: message.sid };
    } catch (error) {
        console.error(`Failed to send WhatsApp to ${to}:`, error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendWhatsAppMessage };
