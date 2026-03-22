const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Docker container!', timestamp: new Date() });
});

app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});
