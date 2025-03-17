const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

//enable json support
app.use(express.json());

//remove acces for, database
app.use('/databases', (req, res)=>{
    res.statusMessage(403).send('Get Good Bozo');
});

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

app.get('/searchpage', (req, res) => {
    const city = req.query.city; // Get city from query
    console.log(`City requested: ${city}`); 
    res.sendFile(path.join(__dirname, '../HTML/searchPage.html'));
});

//API to get all the cities and pictures
app.get('/cities', (req, res) => {
    db.all(`SELECT city, image_path FROM cities ORDER BY id ASC`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


