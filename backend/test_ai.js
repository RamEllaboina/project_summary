const axios = require('axios');
(async () => {
    try {
        const payload = {
            projectId: 'test_123',
            language: 'JavaScript',
            metrics: { qualityScore: 80, structureScore: 75, securityScore: 90, complexity: {} },
            importantFiles: [
                { path: 'index.js', content: 'console.log("Hello"); function add(a,b) { return a+b; }' }
            ],
            readme: 'Test Project'
        };
        const res = await axios.post('http://localhost:8002/evaluate', payload);
        console.log(JSON.stringify(res.data.strengths, null, 2));
    } catch (e) {
        console.error('Error:', e.response?.data || e.message);
    }
})();
