import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';

// Makes files work together
const router = express.Router();

// Makes a path to the current database (which can't be directly interacted with)
const db_path = path.join(process.cwd(), 'databases', 'click_and_collect.db');

// Makes a new database with data from the current database (which can be interacted with)
const db = new sqlite3.Database(db_path, (err) => {
    if (err) return console.error('Mail_update DB error:', err.message);
    console.log('Connected to SQLite database (mail_update router).');
    db.run("PRAGMA foreign_keys = ON;");
});

// Code for the password
const VALIDPASSWORD = '1234';

// Function to check request body's password
function checkPassword (req, res, next){
    const { password } = req.body;

    // If password is not valid = error, else continue with next
    if (!password || password !== VALIDPASSWORD) {
        return res.status(401).json({ message: 'Ugyldigt password' })
    }

    next();
}

// Update stock in DB, for a product
router.post('/mail_stock', checkPassword, (req, res) => {
    const { id, stock } = req.body;

    if (id === undefined || stock === undefined) {
        return res.status(400).json({ message: 'Både stock og id skal sendes' });
    }
    
    // Update only if the requested stock is positive or 0
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

// Update the amount of product bought
router.post('/mail_bought', checkPassword, (req, res) => {
    const { bought, id } = req.body;

    if (!bought || !id) {
        return res.status(400).json({ message: 'Både bought og id skal sendes' });
    }

    // Update only if the requested bought is positive or 0
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

// Update the revenue of a shop
router.post('/mail_revenue', checkPassword, (req, res) => {
    const { revenue, shop_id } = req.body;

    if (!revenue || !shop_id) {
        return res.status(400).json({ message: 'Både revenue og shop_id skal sendes' });
    }

    // Update only if the requested revenue is positive or 0
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

// Insert the requested order in the DB, and return the newest id
router.post('/mail_order', checkPassword, (req, res) => {
    const { shop_id, products, code } = req.body;

    if (!shop_id || !products || !code) {
        return res.status(400).json({ message: 'Mangler shop_id, produkter eller code' });
    }
    
    db.run(`INSERT INTO orders (shop_id, products, code) VALUES (?, ?, ?)`, [shop_id, JSON.stringify(products), code], function (err) {
        if (err) {
            return res.status(500).json({ message: "Databasefejl" });
        } else {
            // Return new id
            res.json({ message: "Ordre oprettet", id: this.lastID });
        }
    });
});

// Update the code in the requested order to null
router.post('/update_order', checkPassword, (req, res) => {
    const { id, shop_id, products, code } = req.body;

    if (!id || !shop_id || !products) {
        return res.status(400).json({ message: 'Mangler id, shop_id eller produkter' });
    }

    // If the requested order is "" set to null, else not changes
    const finalCode = code === "" ? null : code;

    db.run(`UPDATE orders SET shop_id = ?, products = ?, code = ? WHERE id = ?`, [shop_id, products, finalCode, id], function (err) {
        if (err) {
            return res.status(500).json({ message: "Databasefejl ved opdatering" });
        } else {
            res.json({ message: "Ordre opdateret", changes: this.changes });
        }
    });
});

export default router;