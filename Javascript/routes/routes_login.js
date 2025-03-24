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
    console.log('Connected to SQLite database (login router).');
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

export default router;