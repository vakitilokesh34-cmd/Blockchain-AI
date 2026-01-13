const axios = require('axios');

async function test() {
    try {
        const response = await axios.get('http://localhost:3001/api/students');

        const response2 = await axios.get('http://localhost:3001/api/logs');
        console.log('Logs Success:', response2.data);
    } catch (error) {
        if (error.response) {
            console.log('Error Status:', error.response.status);
            console.log('Error Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

test();
