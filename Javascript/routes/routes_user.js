import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Setup adgang til database
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db_path = path.join(process.cwd(), 'databases', 'click_and_collect.db');

const db = new sqlite3.Database(db_path, (err) => {
    if (err) return console.error('Login DB error:', err.message);
    console.log('Connected to SQLite database (user router).');
    db.run("PRAGMA foreign_keys = ON;");
});

// kalder /login med en post hvor den requester password og email fra URL
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    //hvis email og/eller password ikke er til stede send følgende besked
    if (!email || !password) {
        return res.status(400).json('Email og password er nødvendig');
    }

    db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
        //hvis server error send den følgende mail
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        //hvis email og/eller password er ugyldigt send følgende besked
        if (!user) {
            return res.status(401).send("Ugyldig email eller password");
        }

        return res.redirect('/');
    }
);
    
});

//function to signup users
router.post('/signup', (req, res)=>{
    //aquire name, email and password from the url
    const {name, email, password} = req.body;
    //if any are missing, a fail message will be printed
    if (!name || !email || !password){
        return res.status(400).send("Du skal oplyse alle informationer");
    }
    //insert the different values in the db
    db.run(
        `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
        [name, email, password],
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
            return res.redirect("/login");
        }
    );
});

export default router;