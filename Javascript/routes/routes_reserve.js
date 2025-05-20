//The purpose of this script is to handle sending reservation emails via the SendGrid API
//This script mostly interacts with the client-side cart.js script

//Importing libraries
import express from 'express';
import sqlite3 from 'sqlite3';
import sgmail from '@sendgrid/mail';
import path from 'path';
import rateLimit from 'express-rate-limit';
const app = express();
app.use(express.json());
const router = express.Router();

//API key for SendGrid (THIS IS ONLY PRESENT ON OFFICIAL SERVER SINCE API KEY IS PRIVATE)
sgmail.setApiKey();

//Makes a copy of the database, with directions to the data from db_path
const db_path = path.join(process.cwd(), 'databases', 'click_and_collect.db');
const db = new sqlite3.Database(db_path, (err) => {
    if (err) return console.error('Reserve DB error:', err.message);
    console.log('Connected to SQLite database (reserve router).');
    db.run("PRAGMA foreign_keys = ON;");
});

//Function to send an email
export async function send_mail(receiver, subject, content, isHtml = false) {
    //struct for email data
    const mail_data = {
        to: receiver,
        from: 'clickoghent@gmail.com',
        subject: subject,
        [isHtml ? 'html' : 'text']: content
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
export function db_get(query, params) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

//Limits emails an IP can send per hour to prevent flooding
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 requests per computer
  message: { error: "For mange anmodninger, prøv igen senere" }
});

//Reciever function for sending reservation emails (receives signal from cart.js)
router.post('/reserve_wares', limiter, async (req, res) => {
    let { cart } = req.body;
    let cart_items = Object.values(cart);
    let user_email;
    if(req.user){
        user_email = req.user.email;
    } else{
        return res.json({ success: false })
    }
    let result = await reserve_wares(cart_items, user_email);
    return res.json({ success: result })
});

//Function to reserve wares and send receipts to buyer and seller
export async function reserve_wares(cart_items, user_email) {

    //Initiates overaching variable for the carts total product data
    let totalOrder = [];

    try {
        for(let i = 0; i < cart_items.length; i++) {

            //creates a new array for storing product data from 1 store, a string for the shop email, and structure for totalOrder
            const products = [];
            let shop_text = `\n`;
            totalOrder[i] = {
                product: [],
                amount: [],
                price: []
            }

            //Count the amount of products of each type
            const count = {};
            for (let j = 0; j < cart_items[i].length; j++) {
                const product_id = cart_items[i][j];
                count[product_id] = (count[product_id] || 0) + 1;
            }

            //Add relevant product information to totalOrder
            const product_ids = Object.keys(count);
            for (let j = 0; j < product_ids.length; j++) {
                const product_id = product_ids[j];
                const product = await db_get("SELECT product_name, price, discount FROM products WHERE id = ?",[product_id]);
                const amount = count[product_id];
                totalOrder[i].product.push(product.product_name);
                totalOrder[i].amount.push(amount);
                totalOrder[i].price.push(product.price - product.discount);

                //Order text to shops
                shop_text += `${product.product_name} x ${amount}, á ${product.price - product.discount}kr. pr. stk.\n`;
                
                //Insert the values in products
                products.push({
                    product_id,
                    amount,
                    price: (product.price - product.discount) 
                });
            }
            
            //Define the shop_id based on cart
            const shopObj = await db_get("SELECT shop_id FROM products WHERE id = ?", [cart_items[i][0]]);
            const shop_id = shopObj.shop_id;
            
            //Random generatet code, and products as a string
            const code = crypto.randomUUID();
            const codeString = JSON.stringify(code);
            const orderProducts = JSON.stringify(products);
            const baseUrl = "https://cs-25-sw-2-06.p2datsw.cs.aau.dk/node0";

            //Store orders
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

            //Insert the new id and code in the link, that will be sent to the store
            const orderResponse = await response.json();
            const url = `${baseUrl}/confirm?id=${orderResponse.id}&code=${code}`;

            //Sends an email to each store (each sub-array is only products from that store)
            const shop_mail = await db_get("SELECT shops.email FROM products JOIN shops ON products.shop_id = shops.id WHERE products.id = ?;", [cart_items[i][0]]);
            await send_mail(
                shop_mail.email,
                "En bruger har reserveret varer hos din butik",
                `<!DOCTYPE html>
                <html>
                <body>
                    <p>Brugeren med email <strong>${user_email}</strong> fra <strong>Click&hent</strong> har reserveret følgende varer fra din butik:</p>
                    <ul>
                        ${shop_text.split('\n').filter(l => l.trim() !== '').map(l => `<li>${l}</li>`).join('')}
                    </ul>
                    <p>
                        <a href="${url}" style="color: #0066cc; text-decoration: underline;">Klik her for at bekræfte kundens afhentning</a>
                    </p>
                </body>
                </html>`,
                true
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
                user_text += `${totalOrder[i].product[j]} x ${totalOrder[i].amount[j]}, á ${totalOrder[i].price[j]}kr. pr. stk.\n`;
            }
        }

        //Sends email to user that is reserving the wares
        await send_mail(
            user_email,
            "Du har reserveret varer på Click&hent",
            user_text
        )
        return true;
    } catch (err) {
        console.error("Fejl i ordreproces:", err);
        return false;
    }
}

//Exports router. functions to be available in server.js
export default router;