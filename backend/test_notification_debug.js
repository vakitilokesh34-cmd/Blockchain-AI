require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testNotificationLogic() {
  console.log('=== Testing Notification Logic ===\n');

  // Fetch students with attendance <= 75
  const { data: students, error } = await supabase
    .from('students')
    .select('*')
    .lte('attendance', 75);

  if (error) {
    console.error('Error fetching students:', error);
    return;
  }

  console.log(`Found ${students.length} students with attendance <= 75%\n`);

  for (const student of students) {
    let messageBody = '';

    // Current logic from workflowController.js
    if (student.attendance < 65) {
      messageBody = `URGENT: Your attendance is ${student.attendance}%, which is critically low (<65%).`;
    } else if (student.attendance < 75) {
      messageBody = `Alert: Your attendance is ${student.attendance}%, which is below the 75% requirement.`;
    }

    console.log(`Student: ${student.name}`);
    console.log(`  Attendance: ${student.attendance}%`);
    console.log(`  Phone: ${student.phone || 'MISSING'}`);
    console.log(`  Message: ${messageBody || 'EMPTY - NO MESSAGE GENERATED!'}`);
    console.log(`  Would send: ${messageBody && student.phone ? 'YES' : 'NO'}\n`);
  }
}

testNotificationLogic();
