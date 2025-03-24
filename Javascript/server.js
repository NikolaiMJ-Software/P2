import express from 'express';
import path from 'path';
import nodemailer from 'nodemailer';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the filename and directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__dirname);

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
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/signup.html'));
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


//start of mail functionality
//Authenticating sender email
const transporter = nodemailer.createTransport({
    service: 'gmail', //type of email sent (dont touch)
    auth: {
        user: 'clickoghent@gmail.com',  // Gmail for sending emails
        pass: 'cfzv uket bqei kkkw'      // App password
    }
});

//reciever function for sending reservation emails to buyer and seller
app.post('/reserve', (req, res) => {
    //checks if buyer_email and product_id is available
    const { buyer_email, product_id } = req.body;
    if (!buyer_email || !product_id) {
        return res.status(400).json({ error: 'Missing Email or Product ID' });
    }

    // Check database for seller email based on product id
    db.get(
        `SELECT products.product_name, shops.email AS seller_email FROM products JOIN shops
        ON products.shop_id = shops.id WHERE products.id = ?`, [product_id],
        (err, row) => {
            if (err) {
                console.error('Error fetching product:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            if (!row) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // Send reservation emails
            send_mail(
                buyer_email,
                'Reservation af vare på Click&Hent',
                `Du har reserveret varen: ${row.product_name}`
            );
            send_mail(
                row.seller_email,
                'En af dine varer er reserveret på Click&Hent',
                `Din vare er reserveret: ${row.product_name}`
            );

            //Send reply if reservation was successful
            return res.json({ message: 'Reservation successful' });
        }
    );
});

// Function to send emails
function send_mail(receiver, subject, text) {
    //data struct for email information
    const mailOptions = {
        from: 'clickoghent@gmail.com',
        to: receiver,
        subject: subject,
        text: text,
    };

    //sending email and checking if successful
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}
//End of mail functionality

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


