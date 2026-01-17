const http = require('http');

console.log("Triggering 'Low Attendance' Workflow via API...");

const data = JSON.stringify({
  command: "Find students with attendance below 75%"
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
      console.log('✅ Workflow executed.');
      console.log('Check your backend terminal (node server.js) for logs.');
      console.log('If you configured ngrok correctly, you should also see');
      console.log('Twilio Status Callback logs there soon.');
      console.log('---------------------------------------------------');
    } catch (e) {
      console.log('Response (Raw):', responseBody);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error triggering workflow:', error.message);
  console.error('Is the backend server running on port 3002?');
});

req.write(data);
req.end();
