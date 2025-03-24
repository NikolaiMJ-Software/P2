import express from 'express';
import path from 'path';
import nodemailer from 'nodemailer';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

//routes:
import login_router from './routes/routes_login.js';
import reserve_router from './routes/routes_reserve.js';

// Get the filename and directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__dirname);

const app = express();
const port = 3000;

//enable json support
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//remove acces for, database
app.use('/databases', (req, res)=>{
    res.statusMessage(403).send('Get Good Bozo');
});

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, '../'))); // Serve from parent folder

//Connecting to sqlite database
const dbPath = path.join(__dirname, '../databases/click_and_collect.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Serve main.html when accessing the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/main.html'));
});

//path to searchpage
app.get('/searchpage', (req, res) => {
    const city = req.query.city; // Get city from query
    console.log(`City requested: ${city}`); 
    res.sendFile(path.join(__dirname, '../HTML/searchPage.html'));
});

//path to productpage
app.get('/productpage', (req, res) => {
    const product = req.query.id; // Get product id from query
    console.log(`Product requested: ${product}`); 
    res.sendFile(path.join(__dirname, '../HTML/product_page.html'));
});

//path to singup and login pages
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/login.html'));
});
app.use('/', login_router);

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/signup.html'));
});

//API to get all the cities, pictures and coordinates 
app.get('/cities', (req, res) => {
    db.all(`SELECT city, image_path, latitude, longitude FROM cities ORDER BY id ASC`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

//api to identify the product
app.get('/product', (req, res) => {
    const productId = req.query.id;
    if (!productId) {
        res.status(400).json({ error: "Product ID is required" });
        return;
    }

    db.all(`SELECT * FROM Products WHERE id = ?`, [productId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (rows.length === 0) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        res.json(rows[0]); // Returns first matching product
    });
});
// return products sharing the same parent_id
app.get('/allVariants', (req, res) => {
    const parentId = Number(req.query.parent_id);

    db.all(
        `SELECT id, product_name, img1_path FROM products WHERE parent_id = ? OR id = ?`,
        [parentId, parentId],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json(rows);
            }
        }
    );
});



//api that orders products in decending order
app.get('/products', (req, res) => {
    db.all(`SELECT * FROM products ORDER BY id ASC`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.use('/', reserve_router);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


