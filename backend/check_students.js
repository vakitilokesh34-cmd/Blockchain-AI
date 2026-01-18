const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkStudents() {
  const { data, error } = await supabase.from('students').select('*');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('--- STUDENT PHONE NUMBERS ---');
  data.forEach(s => {
    console.log(`${s.name}: ${s.phone} (Attendance: ${s.attendance}%)`);
  });
}

checkStudents();
