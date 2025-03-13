const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

//enable json support
app.use(express.json());

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, '../'))); // Serve from parent folder

//Connecting to sqlite database
const db = new sqlite3.Database('./databases/click_and_collect.db', (err) => {
    if(err){
        console.error('Error connecting to database', err.message);
    } else{
        console.log('Connected to SQLite database.')
    }
});

// Serve main.html when accessing the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/main.html'));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


