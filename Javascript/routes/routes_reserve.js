import express from 'express';
import sqlite3 from 'sqlite3';
import sgmail from '@sendgrid/mail';
import path from 'path';
import fs from 'fs';
const app = express();
app.use(express.json());

//Makes files work together
const router = express.Router();

//Makes a path to the current database (which can't be directly interacted with)
const db_path = path.join(process.cwd(), 'databases', 'click_and_collect.db');

//Makes a new database with data from the current database (which can be interacted with)
const db = new sqlite3.Database(db_path, (err) => {
    if (err) return console.error('Reserve DB error:', err.message);
    console.log('Connected to SQLite database (reserve router).');
    db.run("PRAGMA foreign_keys = ON;");
});
sgmail.setApiKey("Insert key here server-side");

// Function to send emails
function send_mail(receiver, subject, text) {
    //struct for email data
    const mail_data = {
        to: receiver,
        from: 'clickoghent@gmail.com',
        subject: subject,
        text: text,
    };

    //Sends email and verifies if it goes through
    return sgmail.send(mail_data)
    .then(() => {
        console.log('Email sent successfully');
    })
    .catch((error) => {
        console.error('Error sending email:', error.response.body);
        throw error;
    });
}

function db_get(query, params) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

router.post('/reserve_wares', async (req, res) => {
    const { cart } = req.body;
    let cart_items = Object.values(cart);
    let user_email = req.user.email;
    let named_cart = [];

    for(let i = 0; i < cart_items.length; i++) {
        named_cart[i] = []
        for(let x = 0; x < cart_items[i].length; x++) {
            try {
                const product = await db_get("SELECT products.product_name FROM products WHERE products.id = ?",[cart_items[i][x]]);
                named_cart[i].push(product.product_name);
            } catch (error) {
                console.error("Database error:", error);
                return res.status(500).json({ error: "Database query failed" });
            }
        }
    }
    

    for(let i = 0; i < cart_items.length; i++) {
        try{
            const shop_mail = await db_get("SELECT shops.email FROM products JOIN shops ON products.shop_id = shops.id WHERE products.id = ?;", [cart_items[i][0]]);
            const shop_string = shop_mail.email;
            await send_mail(
                shop_string,
                `En bruger har reserveret varer hos din butik`,
                `En bruger har fra Click&hent har reserveret følgende varer fra din butik: ${named_cart[i]}`
            );
        }
        catch (error) {
            console.error("Failed to send seller email:", error);
        }
    }
    const userCartItems = named_cart.flat().join(', ');
    await send_mail(
        user_email,
        `Du har reserveret varer på Click&hent`,
        `Du har reserveret følgende varer på Click&hent: ${userCartItems}`
    )
    return res.json({ success: cart_items });
});

//This is important, for god who knows what (do not remove)
export default router;