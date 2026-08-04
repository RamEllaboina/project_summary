// Simple JavaScript file for testing
const express = require('express');
const app = express();

// TODO: Add proper error handling
app.get('/api/status', (req, res) => {
    console.log("Status check requested");
    res.json({ status: 'running', version: '1.0.0' });
});

function processData(data) {
    var result = data * 2; // Using var instead of const/let
    return result;
}

// FIXME: This should be async
function fetchUserData(userId) {
    console.log("Fetching user: " + userId);
    return { id: userId, name: "Test User" };
}

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
