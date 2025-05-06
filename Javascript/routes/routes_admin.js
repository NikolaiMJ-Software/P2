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
    if (err) return console.error('Dashboard DB error:', err.message);
    console.log('Connected to SQLite database (admin router).');
    db.run("PRAGMA foreign_keys = ON;");
});

router.get('/admin', (req, res) => {
    if(!req.user || !req.user.admin_user){
        return res.status(403).json({ error: "Ikke logget ind som admin" });
    }
    res.sendFile(path.join(process.cwd(), '.', 'HTML', 'admin.html'));
})

router.get('/get_users', (req, res) => {
    db.all(`SELECT id, email, name, shop_id FROM users WHERE admin_user != 1 ORDER BY id ASC`, (err, rows) => {
        if(err){
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    })
})

router.post('/delete_user', (req, res) => {
    const {id} = req.body
    if (!id){
        return res.status(500).send("Databasefejl");
    }
    db.run(`DELETE FROM users WHERE id = ?`, [id], (err) =>{
        if (err){
            return res.status(500).send("Databasefejl");
        }
        res.send("Shop slettet")
    })
})

router.post('/delete_shop', (req, res) =>{
    const {id, cityid, name} = req.body
    if (!id){
        return res.status(500).send("Databasefejl");
    }

    //Find name of city for folder
    db.get(`SELECT city FROM cities WHERE id = ?`, [cityid], (err, city) => {
        if (err || !city){
            return res.status(500).send("Databasefejl");
        }
        //delete from database
        db.run(`DELETE FROM shops WHERE id = ?`, [id], (err) =>{
            if (err){
                return res.status(500).send("Databasefejl");
            }
               
            //delete shop folders'
            const folder_path = path.join(process.cwd(), '.', 'Images', city.city, name);
            fs.rm(folder_path, { recursive: true, force: true }, (err) => {
                if (err){
                    console.error("Kunne ikke slette shop mappe:", err);
                    return;
                }
                res.send("Shop og mappe slettet.");
            });
        })
    })
    
    
})

router.post('/edit_email', (req, res) => {
    const {id, email} = req.body
    if (!id || !email){
        return res.status(500).send("Databasefejl");
    }
    db.run(`UPDATE shops SET email = ? WHERE id = ?`, [email, id], (err) =>{
        if (err){
            return res.status(500).send("Databasefejl");
        }
        res.send("Email opdateret")
    })
})

router.post(`/update_userStores`, (req, res) => {
    const {userId, shopId} = req.body;
    if (!userId){
        return res.status(500).send("Databasefejl");
    }

    if (shopId == "null") {
        db.run(`UPDATE users SET shop_id = null WHERE id = ?`, [userId], (err) =>{
            if (err){
                console.log(err)
                return res.status(500).send("Databasefejl");
            }
            res.send("Shop opdateret")
        })
    } else{
        db.run(`UPDATE users SET shop_id = ? WHERE id = ?`, [shopId, userId], (err) =>{
            if (err){
                return res.status(500).send("Databasefejl");
            }
            res.send("Shop opdateret")
        })
    }
})

router.get(`/crash_server`, (req, res) =>{
    if(!req.user || !req.user.admin_user){
        return res.status(403).json({ error: "Ikke logget ind som admin" });
    }
    console.log("Server is closing now")
    process.exit();
})

router.post(`/ban-user`, (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const query = `SELECT id FROM users WHERE email = ?`;
    db.get(query, [email], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }

        if (row) {
            // User exists, update banned status
            const update = `UPDATE users SET banned = 1 WHERE id = ?`;
            db.run(update, [row.id], function (err) {
                if (err) {
                    console.error('Error banning user:', err.message);
                    return res.status(500).json({ error: 'Failed to ban user' });
                }
                return res.json({ message: 'User banned successfully' });
            });
        } else {
            // User does not exist, insert with banned = 1
            const insert = `INSERT INTO users (name, email, banned) VALUES ("banned",?, 1)`;
            db.run(insert, [email], function (err) {
                if (err) {
                    console.error('Error inserting user:', err.message);
                    return res.status(500).json({ error: 'Failed to create and ban user' });
                }
                return res.json({ message: 'User created and banned successfully' });
            });
        }
    });
});

export default router;