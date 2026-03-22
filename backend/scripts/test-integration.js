const axios = require('axios');
const fs = require('fs');
const http = require('http');
const path = require('path');
const archiver = require('archiver');
const FormData = require('form-data');

/* 
  --------------------------------------------------
  INTEGRATION TEST SCRIPT
  --------------------------------------------------
  
  This script:
  1. Starts a Mock Python Server on :5000 to simulate AI analysis
  2. Creates a dummy valid .zip file using 'archiver'
  3. Uploads the zip to your Node backend (:3000)
  4. Polls the backend status every 1s until completed
  5. Fetches and displays the final report
*/

const BACKEND_URL = 'http://localhost:3000/api';
const MOCK_PYTHON_PORT = 5000;
const ZIP_FILE_PATH = path.join(__dirname, 'test_project.zip');

// Clean up old zip
if (fs.existsSync(ZIP_FILE_PATH)) {
    fs.unlinkSync(ZIP_FILE_PATH);
}

// 1. Start Mock Python Server
const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/analyze') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            console.log('\n[MOCK PYTHON] Received analysis request:', JSON.parse(body));

            // Simulate processing time
            setTimeout(() => {
                const mockReport = {
                    score: 85,
                    aiProbability: 12,
                    strengths: ["Clear structure", "Good error handling"],
                    weaknesses: ["Missing unit tests"],
                    suggestions: ["Add jest tests", "Use environment variables more strictly"],
                    realWorldUse: "High",
                    summary: "A solid MVP implementation.",
                    securityIssues: [],
                    qualityScore: 90
                };

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ report: mockReport }));
                console.log('[MOCK PYTHON] Sent mock report back.');
            }, 2000);
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(MOCK_PYTHON_PORT, async () => {
    console.log(`\n🚀 Mock Python Analyzer running on port ${MOCK_PYTHON_PORT}`);

    try {
        // 2. Create Dummy Zip using Archiver
        console.log('📦 Creating test zip file...');
        const output = fs.createWriteStream(ZIP_FILE_PATH);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', async () => {
            console.log('✅ Zip file created.');

            // 3. Upload Project
            console.log('\n📤 Uploading project to Backend...');
            const form = new FormData();
            form.append('project', fs.createReadStream(ZIP_FILE_PATH));

            try {
                const uploadRes = await axios.post(`${BACKEND_URL}/upload`, form, {
                    headers: {
                        ...form.getHeaders()
                    }
                });

                const { projectId } = uploadRes.data;
                console.log(`✅ Upload success! Project ID: ${projectId}`);
                console.log(`   Check URL: ${BACKEND_URL}/status/${projectId}`);

                // 4. Poll Status
                console.log('\n⏳ Polling status...');
                const poll = setInterval(async () => {
                    try {
                        const statusRes = await axios.get(`${BACKEND_URL}/status/${projectId}`);

                        if (!statusRes.data || !statusRes.data.data) {
                            console.log('   Waiting for status...');
                            return;
                        }

                        const status = statusRes.data.data.status;
                        process.stdout.write(`\r   Current Status: ${status}   `);

                        if (status === 'completed' || status === 'failed') {
                            clearInterval(poll);
                            process.stdout.write('\n');

                            if (status === 'completed') {
                                // 5. Get Report
                                console.log('\n🎉 Project completed! Fetching report...');
                                const reportRes = await axios.get(`${BACKEND_URL}/report/${projectId}`);
                                console.log('\n-----------------------------------');
                                console.log('FINAL REPORT:');
                                console.log(JSON.stringify(reportRes.data.data.report, null, 2));
                                console.log('-----------------------------------');
                                console.log('\n✅ TEST PASSED SUCCESSFULLY');
                            } else {
                                console.error('\n❌ Project processing failed.');
                                // Check for error details if available
                                const failRes = await axios.get(`${BACKEND_URL}/report/${projectId}`).catch(e => e.response);
                                if (failRes && failRes.data) console.log(failRes.data);
                            }

                            // Cleanup
                            server.close();
                            // Optional: keep zip for inspection
                            process.exit(0);
                        }
                    } catch (err) {
                        console.error('\nError polling status:', err.message);
                    }
                }, 1000);

            } catch (err) {
                console.error('\n❌ Upload failed:', err.message);
                if (err.response) {
                    console.error('Response:', err.response.data);
                }
                server.close();
                process.exit(1);
            }
        });

        archive.on('error', (err) => {
            console.error('Zip creation failed:', err);
            server.close();
        });

        archive.pipe(output);
        archive.append('Hello World Project Content', { name: 'dummy.txt' });
        archive.finalize();

    } catch (err) {
        console.error('Test failed:', err);
        server.close();
    }
});
