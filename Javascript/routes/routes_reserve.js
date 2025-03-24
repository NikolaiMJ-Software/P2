import express from 'express';
import sqlite3 from 'sqlite3';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

//Makes files work together
const router = express.Router();

//Sets up constants to make import functionality work
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Makes a path to the current database (which can't be directly interacted with)
const dbPath = path.join(process.cwd(), 'databases', 'click_and_collect.db');

//Makes a new database with data from the current database (which can be interacted with)
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error('Reserve DB error:', err.message);
    console.log('Connected to SQLite database (reserve router).');
    db.run("PRAGMA foreign_keys = ON;");
});


//Authenticates a email to use
const transporter = nodemailer.createTransport({
    service: 'gmail', //the domain for the email (must be gmail to work)
    auth: {
        user: 'clickoghent@gmail.com',  // Gmail for sending emails
        pass: 'cfzv uket bqei kkkw'      // App password
    }
});

// Function to send emails
function send_mail(receiver, subject, text) {
    //struct for email data
    const mailOptions = {
        from: 'clickoghent@gmail.com',
        to: receiver,
        subject: subject,
        text: text,
    };

    //Sends email and verifies if it goes through
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

//Reciever function that sends reservations mails for buyer and seller
router.post('/reserve', (req, res) => {
    //checks if buyer_email and product_id is available
    const { buyer_email, product_id } = req.body;
    if (!buyer_email || !product_id) {
        return res.status(400).json({ error: 'Missing Email or Product ID' });
    }

    //Fetches the sellers email based on the product id
    db.get(
        `SELECT products.product_name, shops.email AS seller_email FROM products 
         JOIN shops ON products.shop_id = shops.id WHERE products.id = ?`, [product_id],
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

            return res.json({ message: 'Reservation successful' });
        }
    );
});

//This is important, for god who knows what (do not remove)
export default router;