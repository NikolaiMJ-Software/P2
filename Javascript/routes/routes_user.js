import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const db_path = path.join(process.cwd(), 'databases', 'click_and_collect.db');

const db = new sqlite3.Database(db_path, (err) => {
    if (err) return console.error('Login DB error:', err.message);
    console.log('Connected to SQLite database (user router).');
    db.run("PRAGMA foreign_keys = ON;");
});

//allows user to login, by calling the /login
router.post('/login', (req, res) => {
    //aquire email and password from the url
    const { email, password } = req.body;
    
    //if Email or password is not defined the following error message will be printed
    if (!email || !password) {
        return res.status(400).json('Email og password er nødvendig');
    }

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

        req.session.email = user.email; //saving session mail as a cookie

        //redirect to main page
        return res.redirect(`/`);
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