require('dotenv').config();
const { google } = require('googleapis');

const validateCalendar = async () => {
  console.log('--- Validating Google Calendar ---');
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const keyRaw = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !keyRaw) {
    console.error('❌ Missing credentials in .env');
    return;
  }

  try {
    const privateKey = keyRaw.replace(/\\n/g, '\n');

    console.log(`Email: ${email}`);
    console.log(`Key length: ${privateKey.length}`);

    const jwtClient = new google.auth.JWT(
      email,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/calendar']
    );

    await jwtClient.authorize();
    console.log('✅ Authentication SUCCESSFUL!');
  } catch (e) {
    console.error('❌ Authentication FAILED:', e.message);
  }
};

validateCalendar();
