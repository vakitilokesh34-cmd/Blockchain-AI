require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { google } = require('googleapis');

const checkKeys = async () => {
  console.log('--- API Key Validation ---\n');

  // 1. Supabase Validation
  console.log('[Supabase] Checking connection...');
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('❌ Supabase: Missing URL or Key');
  } else {
    try {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      const { data, error } = await supabase.from('students').select('id').limit(1);
      if (error) throw error;
      console.log('✅ Supabase: Connected successfully');
    } catch (e) {
      console.log(`❌ Supabase: Failed - ${e.message}`);
    }
  }

  // 2. Gemini Validation
  console.log('\n[Gemini] Checking API...');
  if (!process.env.GEMINI_API_KEY) {
    console.log('❌ Gemini: Missing API Key');
  } else {
    // Just checking if init works, avoiding API call to save quota/time for this quick check if desired, 
    // but real call is better.
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      // Minimal token generation
      // const result = await model.generateContent('Hi');
      // const response = await result.response;
      // console.log('✅ Gemini: Response received');
      console.log('✅ Gemini: Key present and client initialized');
    } catch (e) {
      console.log(`❌ Gemini: Failed - ${e.message}`);
    }
  }

  // 3. Twilio Validation
  console.log('\n[Twilio] Checking credentials...');
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log('❌ Twilio: Missing SID or Auth Token');
  } else {
    try {
      const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // Fetch account info to validate creds
      await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      console.log('✅ Twilio: Authenticated successfully');
    } catch (e) {
      console.log(`❌ Twilio: Failed - ${e.message}`);
    }
  }

  // 4. Google Calendar Validation
  console.log('\n[Google Calendar] Checking Service Account...');
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const keyRaw = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !keyRaw) {
    console.log('❌ Google Calendar: Missing Email or Private Key');
    console.log(`   Email present: ${!!email}`);
    console.log(`   Key present: ${!!keyRaw}`);
  } else {
    try {
      let privateKey = keyRaw;
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      // console.log(`   Email: ${email}`);
      // console.log(`   Key Length: ${privateKey.length}`);

      const jwtClient = new google.auth.JWT(
        email,
        null,
        privateKey,
        ['https://www.googleapis.com/auth/calendar']
      );

      await jwtClient.authorize();
      console.log('✅ Google Calendar: Authenticated successfully');
    } catch (e) {
      console.log(`❌ Google Calendar: Failed - ${e.message}`);
    }
  }

  console.log('\n--- Validation Complete ---');
};

checkKeys();
