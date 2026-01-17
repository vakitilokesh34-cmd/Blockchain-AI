require('dotenv').config();

console.log('--- Env Var Debug ---');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Present' : 'Missing');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Present' : 'Missing');
console.log('GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? 'Present' : 'Missing');
console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'Present' : 'Missing');

if (process.env.GOOGLE_PRIVATE_KEY) {
  console.log('Private Key First 20 chars:', process.env.GOOGLE_PRIVATE_KEY.substring(0, 20));
  console.log('Private Key includes literal \\n:', process.env.GOOGLE_PRIVATE_KEY.includes('\\n'));
  console.log('Private Key includes real newline:', process.env.GOOGLE_PRIVATE_KEY.includes('\n'));
}
