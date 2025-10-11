
const express = require('express');
const app = express();
const path = require('path'); 
const port = 5000;

// loading static data mode
const menuData = require('./menu.json');

// 1. seraching frontend file
app.use(express.static(path.join(__dirname, 'public'))); 

// 2. API root
app.get('/api/menu', (req, res) => {
  res.json(menuData);
});

// server on
app.listen(port, () => {
  console.log(`Server started! View your website at http://localhost:${port}`);
  console.log('Press Ctrl+C to stop the server.');
});

// server.js (Around line 25)

// 3. Simple root route to make sure auth.html is the default entry page
app.get('/', (req, res) => {
    // We send auth.html when the user visits the root URL
    res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});