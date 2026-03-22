const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testUpload() {
    const formData = new FormData();
    const testFilePath = path.join('C:', 'Users', 'RAM', 'OneDrive', 'Documents', 'Desktop', 'test_python_project', 'main.py');

    // We append the file. The key 'files' must match what the server expects.
    formData.append('files', fs.createReadStream(testFilePath), {
        filepath: 'main.py' // simulate relative path
    });

    try {
        console.log('Sending python project to Sandbox...');
        const response = await axios.post('http://localhost:3000/api/run', formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        console.log('Sandbox Response:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testUpload();
