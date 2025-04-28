import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import fse from 'fs-extra';

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

//allows user to login, by calling the /login
router.post('/login', (req, res) => {
    //aquire email and password from the url
    const { email, password } = req.body;
    
    //if Email or password is not defined the following error message will be printed
    if (!email || !password) {
        return res.status(400).json('Email og password er nødvendig');
    }
    //find all information on a user from table users
    db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
        //if there is a server error the following message will be printed
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        //if email or password is not valid, the following error will be printed
        if (!user) {
            return res.status(401).send("Ugyldig email eller password");
        }
        //save 4 variables as session variables, which all routes has acces to
        req.session.user = {
            email: user.email,
            shop_id: user.shop_id,
            name: user.name,
            admin_user: user.admin_user
        };//saving session user as a cookie

        //redirect to main page
        return res.redirect(`/`);
    }
);
    
});

//function to signup users
router.post('/signup', (req, res)=>{
    //aquire name, email and password from the url
    const {name, email, password, shop_id} = req.body;
    //if any are missing, a fail message will be printed
    if (!name || !email || !password){
        return res.status(400).send("Du skal oplyse alle informationer");
    }
    //insert the different values in the db
    db.run(
        `INSERT INTO users (name, email, password, shop_id) VALUES (?, ?, ?, ?)`,
        [name, email, password, shop_id],
        (err) =>{
            //if any mails are already in the db, the process would be aborted
            if(err){
                if(err.message.includes('UNIQUE constraint failed')){
                    return res.status(409).send("Din email er allerede i brug");
                }
                console.error('Singup error', err.message);
                return res.status(500).send("Database error");
            }
            //redirect the page to login page
            return res.redirect("./login");
        }
    );
});

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