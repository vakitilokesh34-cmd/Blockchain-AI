require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_WHATSAPP_FROM;

console.log('--- Twilio Diagnostic Tool ---');
console.log('SID:', accountSid);
console.log('From:', fromPhone);

const client = new twilio(accountSid, authToken);

async function testTwilio() {
  // Try sending to one of the numbers in the DB
  const testNumber = '+918688677175'; // Evan Wright's number

  console.log(`\nAttempting to send message to ${testNumber}...`);

  try {
    const message = await client.messages.create({
      body: 'Twilio Diagnostic Test: This is a test message from your Smart University system.',
      from: fromPhone,
      to: `whatsapp:${testNumber}`
    });

    console.log('✅ SUCCESS!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
  } catch (error) {
    console.error('❌ FAILED');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);

    if (error.code === 63038) {
      console.log('\n💡 DIAGNOSIS: DAILY LIMIT EXCEEDED');
      console.log('Your Twilio trial/sandbox account has a limit of 50 messages per day.');
    } else if (error.code === 21608) {
      console.log('\n💡 DIAGNOSIS: SANDBOX NOT JOINED');
      console.log('The recipient number has not joined your Twilio sandbox.');
    } else if (error.code === 20003) {
      console.log('\n💡 DIAGNOSIS: INVALID CREDENTIALS');
      console.log('The SID or Auth Token is incorrect.');
    }
  }
}

testTwilio();
