const FormData = require('form-data');
const fs = require('fs');
const http = require('http');

const form = new FormData();
form.append('files', fs.createReadStream('test-project/package.json'), 'package.json');
form.append('files', fs.createReadStream('test-project/app.js'), 'app.js');

const options = {
  hostname: 'localhost',
  port: 4001,
  path: '/api/run',
  method: 'POST',
  headers: form.getHeaders()
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

form.pipe(req);

req.on('error', (error) => {
  console.error('Error:', error);
});
