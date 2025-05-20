import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import fse from 'fs-extra';
import { send_mail, reserve_wares, db_get } from './routes_reserve.js';

// Set up Multer
const upload = multer({ dest: 'uploads/' }); // or configure custom storage

//define router as a variable using express
const router = express.Router();

//define db path
const db_path = path.join(process.cwd(), 'databases', 'click_and_collect.db');

//define db variable as a variable connecting to the click and collect db
const db = new sqlite3.Database(db_path, (err) => {
    if (err) return console.error('Login DB error:', err.message);
    console.log('Connected to SQLite database (user router).');
    db.run("PRAGMA foreign_keys = ON;");
});

//Reciever function that checks if an email has an account connected to it
router.post('/email_status', (req, res) => {
    const { email } = req.body;
    //select all from the users table based on email, and see if user exists or not
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!user) {
            return res.json({ exists: false });
        } else {
            return res.json({ exists: true });
        }
    })
});

//Reciever functions to authenticate emails
router.post('/generate_key', async (req, res) => {
    let { email } = req.body;
    //check if user is banned, if so end function
    const banned = await db_get(`SELECT banned FROM users WHERE email = ?;`, [email]);
    if(banned && banned.banned) {
        return res.json({ success: "Bruger er bannet fra Click&hent" })
    }
    //create random key, and sent mail and key to auth email maker function
    const key = parseInt(Math.floor(Math.random() * 900000) + 100000)
    let success = await authentication_email_maker(email, key);
    return res.json({ success: success });
});
router.post('/authenticate_email', async (req, res) => {
    let { email, key, cart, name, password, shop_id } = req.body;
    //Check if key and email fits database entry
    let authenticated = await authenticate_email_checker(email, key);
    if(authenticated !== true){
        return res.json({ success: authenticated });
    }
    //If it doesn't have associated cart, its a signup request
    if(!cart){
        let signed_up = await signup(name, email, password, shop_id);
        return res.json({ success: signed_up });
    }
    //otherwise its a reserve request
    let cart_items = Object.values(cart);
    let reserved = await reserve_wares(cart_items, email);
    return res.json({ success: reserved });
});

//Function that makes an entry in the database for authentication if none exists, and sends corrosponding email
async function authentication_email_maker(email, key){
    try {
        const date = new Date();
        //check if new email exists in the auth table, if not insert it
        const row = await db_get(`SELECT * FROM authentication WHERE authentication.email = ?;`, [email]);
        if (!row) {
            db.run(`INSERT INTO authentication (email, key, time_stamp) VALUES (?, ?, ?)`, [email, key, date.getTime()]);
            await send_mail(
                email,
                `Email autentificering`,
                `Der er sendt en autentificerings mail til denne email, da der er forsøgt at oprette en konto eller reservere varer med denne email. 
                For at autentificere denne email, skal du indsætte følgende kode på Click&Hent: ${key}`
            );
            return true;
        } else {
            return "Email allerede i brug";
        }
      } catch (err) {
        console.error("Database error:", err);
        return "Database fejl";
      }
}

//Checks whether a authentication database entry exists
async function authenticate_email_checker(email, key){
    //checks if inserted email and key fits the values in authentication tabled, if yes delete email, else sent fail message
    const row = await db_get(`SELECT * FROM authentication WHERE authentication.email = ? AND authentication.key = ?;`, [email, key]);
    if(row){
        //Deletes the entry to clear up the database if entry was correct
        db.run(`DELETE FROM authentication WHERE email = ?;`, [email]);
        return true;
    }
    return "Ukorrekt email/nøgle til autentisering";
}

//allows user to login, by calling the /login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Check for missing fields
    if (!email || !password) {
        return res.status(400).json('Email og password er nødvendig');
    }

    try {
        // Check if user is banned
        const banned = await db_get(`SELECT banned FROM users WHERE email = ?`, [email]);
        if (banned && banned.banne) {
            return res.status(400).json("Bruger er bannet fra Click&hent");
        }

        // Check if user exists and password matches
        const user = await db_get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password]);
        if (!user) {
            return res.status(401).send("Ugyldig email eller password");
        }

        // Set session variables
        req.session.user = {
            email: user.email,
            shop_id: user.shop_id,
            name: user.name,
            admin_user: user.admin_user
        };

        return res.redirect('/');
    } catch (err) {
        console.error('Login error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

//helper function to get shop email as a Promise
function getShopEmail(shop_id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT email FROM shops WHERE id = ?`, [shop_id], (err, row) => {
            if (err) return reject(err);
            resolve(row ? row.email : null);
        });
    });
}

//function to signup users
async function signup(name, email, password, shop_id) {
    //if any are missing, a fail message will be printed
    if (!name || !email || !password){
        return "Fejl med givet data, har du indskrevet navn email og password?";
    }

    //random generatet code
    const code = crypto.randomUUID();
    const codeString = JSON.stringify(code);

    try {
        //insert user into the database
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO users (name, email, password, code) VALUES (?, ?, ?, ?)`,
                [name, email, password, codeString],
                (err) => {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            return resolve("Konto med givent email findes allerede");
                        }
                        console.error('Signup error', err.message);
                        return resolve("Fejl i database");
                    }
                    resolve(true);
                }
            );
        });

        //if connecting to a shop, send validation email
        if (shop_id !== 0) {
            const shop_email = await getShopEmail(shop_id);
            if (shop_email) {
                const baseUrl = "https://cs-25-sw-2-06.p2datsw.cs.aau.dk/node0";
                const url = `${baseUrl}/confirm?shop_id=${shop_id}&code=${code}`;

                await send_mail(
                    shop_email,
                    `Bruger prøver at forbinde til din butik på Click&hent`,
                    `<!DOCTYPE html>
                    <html>
                    <body>
                        <p>Brugeren med email <strong>${email}</strong> prøver at forbinde til din butik</p>
                        <p>
                            <a href="${url}" style="color: #0066cc; text-decoration: underline;">
                                Klik her for at tillade dem adgang
                            </a>
                        </p>
                    </body>
                    </html>`,
                    true
                );
            }
        }

        return true;

    } catch (err) {
        console.error('Signup process failed:', err);
        return "Fejl under signup-processen";
    }
}

//route to logout
router.get('/logout', (req, res)=>{
    //destroy the current session variables
    req.session.destroy((err)=>{
        if(err){
            console.error("Failed to end session:", err);
            return res.status(500).send("Log ud fejl")
        }
        //clear cookies and send logged out
        res.clearCookie('connect.sid');
        res.send("Du loggede ud");
    })
});

//get cities route
router.get('/get_cities', (req, res)=>{
    //finds all city names and ids from table city
    db.all(`SELECT id, city FROM cities`, (err, rows) => {
        //if there is a server error the following message will be printed
        if (err) {
            console.error('signup error error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(rows);
    });
});

//find stores route
router.get('/get_stores', (req, res)=>{
    //gets city id from front end code
    const city_id = req.query.city_id;

    //selects all shop ids and shop names from shops table by city id
    db.all(`SELECT id, shop_name FROM shops WHERE city_id = ?`, [city_id], (err, rows)=>{
        //if there is a server error the following message will be printed
        if (err) {
            console.error('signup error error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(rows);
    })
});

//add new shop route, which uses a "logo" given from front end
router.post("/new_shop", upload.fields([{ name: 'logo', maxCount: 1 }]), async (req, res) => {
    //tries the following:
    try {
        //defines following variables from front end code
        const { butik: name, email, city_name: city_id, longitude: long, latitude: lat } = req.body;
        // check if any inputs are missing
        if (!name || !email || !city_id || !long || !lat) {
            return res.status(400).send("Alle felter skal udfyldes.");
        }
        //check if logo is missing
        const logo_file = req.files?.logo?.[0];
        if (!logo_file) {
            return res.status(400).send("Butikslogo mangler.");
        }

        // Get city name from DB
        const city_name = await new Promise((resolve, reject) => {
            db.get(`SELECT city FROM cities WHERE id = ?`, [city_id], (err, row) => {
                if (err) return reject(err);
                if (!row) return reject(new Error("By ikke fundet"));
                resolve(row.city);
            });
        });

        // Image path
        const shop_folder = path.join('.', 'Images', city_name, name);
        const logo_file_name = 'logo' + path.extname(logo_file.originalname); // e.g. logo.png
        const image_path = path.join(shop_folder, logo_file_name);

        // Path saved in DB (client uses /images/...)
        const logo_path = `./Images/${city_name}/${name}/${logo_file_name}`;

        // Create folder and move file
        await fse.ensureDir(shop_folder);
        await fse.move(logo_file.path, image_path, { overwrite: true });

        // Insert into DB
        db.run(
            `INSERT INTO shops (shop_name, city_id, img_path, email, latitude, longitude, revenue) VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [name, city_id, logo_path, email, lat, long],
            async function (err) {
                if (err) {
                    console.error("Fejl i DB:", err);

                    // Delete image if DB insert fails
                    try {
                        await fse.remove(image_path);
                        console.log("Slettede billede pga. DB-fejl.");
                    } catch (deleteErr) {
                        console.error("Kunne ikke slette billede:", deleteErr);
                    }

                    return res.status(500).send("Databasefejl ved oprettelse.");
                }

                return res.status(200).json({
                    message: "Butik oprettet",
                    shop_id: this.lastID,
                    image_path: logo_path
                });
            }
        );

    } catch (err) {
        console.error("Fejl:", err);
        return res.status(500).send(err.message || "Intern serverfejl");
    }
});


export default router;