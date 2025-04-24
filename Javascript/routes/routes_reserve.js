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

    try {
        //Creates a new cart array, where names are shown instead of id's
        for(let i = 0; i < cart_items.length; i++) {
            const products = [];
            named_cart[i] = [];
            for(let x = 0; x < cart_items[i].length; x++) {
                const product_id = cart_items[i][x];
                const product = await db_get("SELECT products.product_name, products.price, products.discount FROM products WHERE products.id = ?",[product_id]);
                // Insert the values in products
                products.push({
                    product_id,
                    amount: 1,
                    price: (product.price - product.discount) 
                });
                named_cart[i].push(product.product_name);
            }
        
            // Define the shop_id based on cart
            const shopObj = await db_get("SELECT shop_id FROM products WHERE id = ?", [cart_items[i][0]]);
            const shop_id = shopObj.shop_id;
            
            // Random generatet code, then make code, and products as a sting
            const code = crypto.randomUUID();
            const codeString = JSON.stringify(code);
            const orderProducts = JSON.stringify(products);
            const baseUrl = "https://cs-25-sw-2-06.p2datsw.cs.aau.dk/node0";

            // Store orders
            const response = await fetch(`${baseUrl}/mail_order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password: '1234',
                    shop_id,
                    products: orderProducts,
                    code: codeString
                })
            });

            // Insert the new id and code in the link, what would be send
            const order = await response.json();
            const url = `${baseUrl}/confirm?id=${order.id}&code=${code}`;
        
            //Sends an email to each store (each sub-array is only products from that store)
            const shop_mail = await db_get("SELECT shops.email FROM products JOIN shops ON products.shop_id = shops.id WHERE products.id = ?;", [cart_items[i][0]]);
            await send_mail(
                shop_mail.email,
                `En bruger har reserveret varer hos din butik`,
                `Brugeren med email ${user_email} fra Click&hent har reserveret følgende varer fra din butik: ${named_cart[i]}\n\n
                Klik her for at bekræfte kundens afhæntning: ${url}`
            );
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
    } catch (err) {
        console.error("Fejl i ordreproces:", err);
        return res.status(500).json({ error: "Der opstod en fejl under reservationen." });
    }
});

//Exports router. functions to be available in server.js
export default router;