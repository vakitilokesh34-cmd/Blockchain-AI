const http = require('http');

const command = process.argv[2] || "Check for overdue assignments and send reminders";
console.log(`[CLIENT] Triggering Workflow: "${command}"`);

const data = JSON.stringify({
  command: command
});

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/workflow/run',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);

  let responseBody = '';

  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(responseBody);
      console.log('Response Body:', JSON.stringify(json, null, 2));
      console.log('\n---------------------------------------------------');
      console.log('✅ Workflow executed directly via API.');
      console.log('---------------------------------------------------');
    } catch (e) {
      console.log('Response (Raw):', responseBody);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error triggering workflow:', error.message);
});

req.write(data);
req.end();
