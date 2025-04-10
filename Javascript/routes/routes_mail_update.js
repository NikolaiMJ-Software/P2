import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import fse from 'fs-extra';

//Makes files work together
const router = express.Router();

//Makes a path to the current database (which can't be directly interacted with)
const db_path = path.join(process.cwd(), 'databases', 'click_and_collect.db');

//Makes a new database with data from the current database (which can be interacted with)
const db = new sqlite3.Database(db_path, (err) => {
    if (err) return console.error('Mail_update DB error:', err.message);
    console.log('Connected to SQLite database (Mail_update router).');
    db.run("PRAGMA foreign_keys = ON;");
});


const VALIDPASSWORD = '1234';

function checkPassword (req, res, next){
    const { password } = req.body;

    if (!password || password !== VALIDPASSWORD) {
        return res.status(401).json({ message: 'Ugyldigt password' })
    }

    next();
}

router.post('/mail_stock', checkPassword, (req, res) => {
    const { id, stock } = req.body;

    if (id === undefined || stock === undefined) {
        return res.status(400).json({ message: 'Både stock og id skal sendes' });
    }
    if(stock >= 0){
        db.run(`UPDATE products SET stock = ? WHERE id = ?`, [stock, id], function (err) {
            if (err){
                return res.status(500).send("Databasefejl");
            }else{
                res.send("Stock updated");
            }
        });
    }
});

router.post('/mail_bought', checkPassword, (req, res) => {
    const { bought, id } = req.body;

    if (!bought || !id) {
        return res.status(400).json({ message: 'Både bought og id skal sendes' });
    }

    /* Lounce quest*/
    if (bought >= 0){
        db.run(`UPDATE products SET bought = ? WHERE id = ?`, [bought, id], function (err) {
            if (err){
                return res.status(500).send("Databasefejl");
            }else{
                res.send("Bought updated");
            }
        });
    }
});

router.post('/mail_revenue', checkPassword, (req, res) => {
    const { revenue, shop_id } = req.body;

    if (!revenue || !shop_id) {
        return res.status(400).json({ message: 'Både revenue og shop_id skal sendes' });
    }

    /* Lounce quest*/
    if (revenue >= 0){
        db.run(`UPDATE shops SET revenue = ? WHERE id = ?`, [revenue, shop_id], function (err) {
            if (err){
                return res.status(500).send("Databasefejl");
            }else{
                res.send("Revenue updated");
            }
        });
    }
});

export default router;