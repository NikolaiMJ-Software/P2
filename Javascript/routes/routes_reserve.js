//The purpose of this script is to handle sending reservation emails via the SendGrid API
//This script mostly interacts with the client-side cart.js script

//Importing API's and using their definitions
import express from 'express';
import sqlite3 from 'sqlite3';
import sgmail from '@sendgrid/mail';
import path from 'path';
import fs from 'fs';
const app = express();
app.use(express.json());
const router = express.Router();

//Locates api.txt for SendGrid API key (THIS ONLY WORKS ON OFFICIAL SERVER SINCE API KEY IS PRIVATE)
let key = fs.readFileSync(path.join(process.cwd(), `api.txt`)).toString();
sgmail.setApiKey(key);

//Makes a copy of the database, with directions to the data from db_path
const db_path = path.join(process.cwd(), 'databases', 'click_and_collect.db');
const db = new sqlite3.Database(db_path, (err) => {
    if (err) return console.error('Reserve DB error:', err.message);
    console.log('Connected to SQLite database (reserve router).');
    db.run("PRAGMA foreign_keys = ON;");
});

//Function to send an email
async function send_mail(receiver, subject, text) {
    //struct for email data
    const mail_data = {
        to: receiver,
        from: 'clickoghent@gmail.com',
        subject: subject,
        text: text,
    };

    //Sends email and verifies whether it goes through
    return sgmail.send(mail_data)
    .then(() => {
        console.log('Email sent successfully');
    })
    .catch((error) => {
        console.error('Error sending email:', error.response.body);
        throw error;
    });
}

//Async version of db.get
function db_get(query, params) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

//Reciever function for sending reservation emails for an entire cart (receives signal from cart.js)
router.post('/reserve_wares', async (req, res) => {

    //Gathers and converts data to be useful
    let { cart, user_email } = req.body;
    if(!user_email) {
        user_email = req.user.email;
    }
    let cart_items = Object.values(cart);
    let named_cart = [];

    //Creates a new cart array, where names are shown instead of id's
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
    
    //Sends an email to each store (each sub-array is only products from that store)
    for(let i = 0; i < cart_items.length; i++) {
        try{
            const shop_mail = await db_get("SELECT shops.email FROM products JOIN shops ON products.shop_id = shops.id WHERE products.id = ?;", [cart_items[i][0]]);
            const shop_string = shop_mail.email;
            await send_mail(
                shop_string,
                `En bruger har reserveret varer hos din butik`,
                `Brugeren ${user_email} har fra Click&hent har reserveret følgende varer fra din butik: ${named_cart[i]}`
            );
        }
        catch (error) {
            console.error("Failed to send seller email:", error);
        }
    }

    //Generate a proper text-string for the email the user is getting
    let user_text = `Du har reserveret fra følgende butikker på Click&hent:\n`;
    for(let i = 0; i < cart_items.length; i++) {
        let shop_name = await db_get("SELECT shops.shop_name FROM products JOIN shops ON products.shop_id = shops.id WHERE products.id = ?;", [cart_items[i][0]]);
        let shop_name_string = shop_name.shop_name
        user_text += `${shop_name_string}:\n${named_cart[i]}\n`;
    }

    //Sends email to user that is reserving the wares
    await send_mail(
        user_email,
        `Du har reserveret varer på Click&hent`,
        user_text
    )
    return res.json({ success: cart_items });
});

//Exports router. functions to be available in server.js
export default router;