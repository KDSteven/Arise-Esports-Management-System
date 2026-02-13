// MINIMAL TEST SERVER - Save this as test-server.js in the server folder

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Super simple test endpoint
app.post('/api/test', (req, res) => {
  console.log('TEST RECEIVED:', req.body);
  res.json({ success: true, message: 'It works!', data: req.body });
});

app.listen(5000, () => {
  console.log('TEST SERVER running on http://127.0.0.1:5000');
  console.log('Try POST to http://127.0.0.1:5000/api/test');
});