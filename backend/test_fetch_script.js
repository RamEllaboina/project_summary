const axios = require('axios');

async function checkReport() {
    try {
        const res = await axios.get('http://localhost:3000/api/report/29f6b22f-9e9a-4235-a846-a65cd8f4d5bf');
        console.log('REPORT RECEIVED:', res.data.length ? 'Array' : Object.keys(res.data));
    } catch (err) {
        console.error('ERROR:', err.response?.data || err.message);
    }
}

checkReport();
