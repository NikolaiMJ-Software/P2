//The purpose of this script is to handle sending reservation emails via the SendGrid API
//This script mostly interacts with the client-side cart.js script

//Importing API's and using their definitions
import express from 'express';
import sqlite3 from 'sqlite3';
import sgmail from '@sendgrid/mail';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
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

// Prevent abuse or infinite loop calls on reservation email
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minut
  max: 5, // max 5 requests per IP
  message: { error: "For mange anmodninger, prøv igen senere" }
});

//Reciever function for sending reservation emails for an entire cart (receives signal from cart.js)
router.post('/reserve_wares', limiter, async (req, res) => {

    //Gathers and converts data to be useful
    let { cart, user_email } = req.body;
    if(!user_email) {
        user_email = req.user.email;
    }

    let cart_items = Object.values(cart);
    let named_cart = [];
    let totalOrder = [];

    try {
        //Creates a new cart array, where names are shown instead of id's
        for(let i = 0; i < cart_items.length; i++) {
            const products = [];
            let shop_text = `\n`;
            named_cart[i] = [];
            totalOrder[i] = {
                product: [],
                amount: [],
                price: []
            }

            // Count the amount of products
            const count = {};
            for (let j = 0; j < cart_items[i].length; j++) {
                const product_id = cart_items[i][j];
                count[product_id] = (count[product_id] || 0) + 1;
            }

            // Add relevant product information to totalOrder
            const product_ids = Object.keys(count);
            for (let j = 0; j < product_ids.length; j++) {
                const product_id = product_ids[j];
                const product = await db_get("SELECT products.product_name, products.price, products.discount FROM products WHERE products.id = ?",[product_id]);
                const amount = count[product_id];
                totalOrder[i].product.push(product.product_name);
                totalOrder[i].amount.push(amount);
                totalOrder[i].price.push(product.price - product.discount);

                // Order text to shops
                shop_text += `${product.product_name} x ${amount}\n`;
                
                // Insert the values in products
                products.push({
                    product_id,
                    amount,
                    price: (product.price - product.discount) 
                });
            }
            
            // Define the shop_id based on cart
            const shopObj = await db_get("SELECT shop_id FROM products WHERE id = ?", [cart_items[i][0]]);
            const shop_id = shopObj.shop_id;
            
            // Random generatet code, and products as a string
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
            const orderResponse = await response.json();
            const url = `${baseUrl}/confirm?id=${orderResponse.id}&code=${code}`;

            //Sends an email to each store (each sub-array is only products from that store)
            const shop_mail = await db_get("SELECT shops.email FROM products JOIN shops ON products.shop_id = shops.id WHERE products.id = ?;", [cart_items[i][0]]);
            await send_mail(
                shop_mail.email,
                `En bruger har reserveret varer hos din butik`,
                //`Brugeren med email ${user_email} fra Click&hent har reserveret følgende varer fra din butik: ${shop_text}\n\nKlik her for at bekræfte kundens afhæntning: ${url}`
                `<!DOCTYPE html>
                <html>
                <body>
                    <p>Brugeren med email <strong>${user_email}</strong> fra <strong>Click&hent</strong> har reserveret følgende varer fra din butik:</p>
                    <ul>
                        ${shop_text}
                    </ul>
                    <p>
                        <a href="${url}" style="color: #0066cc; text-decoration: underline;">
                            Klik her for at bekræfte kundens afhentning
                        </a>
                    </p>
                </body>
                </html>`,
                { contentType: 'text/html' }
            );
        }
        
        //Generate a proper text-string for the email the user is getting
        let user_text = `Du har reserveret fra følgende butikker på Click&hent:\n`;
        for(let i = 0; i < cart_items.length; i++) {
            let shop_name = await db_get("SELECT shops.shop_name FROM products JOIN shops ON products.shop_id = shops.id WHERE products.id = ?;", [cart_items[i][0]]);
            let shop_name_string = shop_name.shop_name
            user_text += `\n${shop_name_string}:\n`;
            
            // Add all product and the amount
            for (let j = 0; j < totalOrder[i].product.length; j++) {
                user_text += `${totalOrder[i].product[j]} x ${totalOrder[i].amount[j]}\n`;
            }
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