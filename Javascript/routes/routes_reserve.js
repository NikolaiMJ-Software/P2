import express from 'express';
import sqlite3 from 'sqlite3';
import nodemailer from 'nodemailer';
import path from 'path';
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
    return new Promise((resolve, reject) => {
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
                reject(error);
            } else {
                console.log('Email sent:', info.response);
                resolve(info);
            }
        });
    });
}

router.post('/reserve_wares', async (req, res) => {
    const { cart } = req.body;
    if(!req.user) {
        console.log("Log in to reserve a ware")
        return res.status(401).json({ error: "Log in to reserve a ware" });;
    }
    let user_email = req.user.email;
    let named_cart = [];
    for(let i = 0; i < cart.length; i++) {
        named_cart[i] = []
        for(let x = 0; x < cart[i].length; x++) {
            try {
                const product = await db.get("SELECT products.product_name FROM products WHERE products.id = ?",[cart[i][x]]);
                if (product) {
                    named_cart[i].push(product.product_name);
                }
            } catch (error) {
                console.error("Database error:", error);
                return res.status(500).json({ error: "Database query failed" });
            }
        }
    }
    console.log(cart);
    for(let i = 0; i < cart.length; i++) {
        try{
            const shop_mail = await db.get("SELECT shops.email FROM products JOIN shops ON products.shop_id = shops.id WHERE products.id = ?;", [cart[i][0]]);
            await send_mail(
                shop_mail.email,
                `En bruger har reserveret varer hos din butik`,
                `En bruger har fra Click&hent har reserveret følgende varer fra din butik: ${named_cart[i]}`
            );
        }
        catch (error) {
            console.error("Failed to send seller email:", error);
        }
    }
    await send_mail(
        user_email,
        `Du har reserveret varer på Click&hent`,
        `Du har reserveret følgende varer på Click&hent: ${named_cart}`
    )
    return res.json({ success: true });
});

/*
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
*/

//This is important, for god who knows what (do not remove)
export default router;