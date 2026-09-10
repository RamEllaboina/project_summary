const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
    const form = new FormData();
    form.append('project', fs.createReadStream(path.join(__dirname, 'package.json')));

    try {
        const res = await axios.post('http://localhost:3000/api/upload', form, {
            headers: form.getHeaders(),
            timeout: 30000
        });
        console.log('UPLOAD SUCCESS:', res.data);
    } catch (err) {
        console.error('UPLOAD FAILED', err.response?.data || err.message);
    }
}

testUpload();
