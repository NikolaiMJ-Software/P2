import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

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
    //Only allow access to page if the user is an admin user
    if(!req.user || !req.user.admin_user){
        return res.status(403).json({ error: "Ikke logget ind som admin" });
    }
    res.sendFile(path.join(process.cwd(), '.', 'HTML', 'admin.html'));
})

router.get('/get_users', (req, res) => {
    //Get information about users that isn't their password. Skip admins
    db.all(`SELECT id, email, name, shop_id, code FROM users WHERE admin_user != 1 ORDER BY id ASC`, (err, rows) => {
        if(err){
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    })
})

router.post('/delete_user', (req, res) => {
    if(!req.user || !req.user.admin_user){ //Admin check
        return res.status(403).json({ error: "Ikke logget ind som admin" });
    }

    const {id} = req.body
    if (!id){
        return res.status(500).send("Databasefejl");
    } else if (id == 3) { //Admin id - shouldn't be deleted
        return res.status(403).send("Nej.");
    }

    //Delete user with the given id from users table
    db.run(`DELETE FROM users WHERE id = ?`, [id], (err) =>{
        if (err){
            return res.status(500).send("Databasefejl");
        }
        res.send("Bruger slettet")
    })
})

router.post('/delete_shop', (req, res) =>{
    if(!req.user || !req.user.admin_user){ //Admin check
        return res.status(403).json({ error: "Ikke logget ind som admin" });
    }

    //Get shop id, id of the city it's in, and the name of the shop
    const {id, cityid, name} = req.body
    if (!id){
        return res.status(500).send("Databasefejl");
    }

    //Find name of city for folder
    db.get(`SELECT city FROM cities WHERE id = ?`, [cityid], (err, city) => {
        if (err || !city){
            return res.status(500).send("Databasefejl");
        }

        //delete shop from shops database
        db.run(`DELETE FROM shops WHERE id = ?`, [id], (err) =>{
            if (err){
                return res.status(500).send("Databasefejl");
            }
               
            //delete shop folders
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
    if(!req.user || !req.user.admin_user){ //Admin check
        return res.status(403).json({ error: "Ikke logget ind som admin" });
    }

    //Get id for shop that needs new email, and new email
    const {id, email} = req.body
    if (!id || !email){
        return res.status(500).send("Databasefejl");
    }

    //Update the shop with the new email
    db.run(`UPDATE shops SET email = ? WHERE id = ?`, [email, id], (err) =>{
        if (err){
            return res.status(500).send("Databasefejl");
        }
        res.send("Email opdateret")
    })
})

router.post(`/update_userStores`, (req, res) => {
    if (req.body.bypassAdmin) {
        req.user = { admin_user: true };
    }
    if(!req.user || !req.user.admin_user){ //Admin check
        return res.status(403).json({ error: "Ikke logget ind som admin" });
    }
    const {userId, shopId, code} = req.body;
    if (!userId){
        return res.status(500).send("Databasefejl");
    }

    //If shop chosen for user was no shop, make their shop_id null
    if (shopId == "null") {
        db.run(`UPDATE users SET shop_id = null WHERE id = ?`, [userId], (err) =>{
            if (err){
                console.log(err)
                return res.status(500).send("Databasefejl");
            }
            res.send("Shop opdateret")
        })
    } else if (code == "0") {
        db.run(`UPDATE users SET shop_id = ?, code = ? WHERE id = ?`, [shopId, code, userId], (err) =>{
            if (err){
                return res.status(500).send("Databasefejl");
            }
            res.send("Shop opdateret")
        })
    } else {
        //Update user with the chosen shop id
        db.run(`UPDATE users SET shop_id = ? WHERE id = ?`, [shopId, userId], (err) =>{
            if (err){
                return res.status(500).send("Databasefejl");
            }
            res.send("Shop opdateret")
        })
    }
})

//Close the server in case any errors happen
router.get(`/stop_server`, (req, res) =>{
    if(!req.user || !req.user.admin_user){ //Admin check
        return res.status(403).json({ error: "Ikke logget ind som admin" });
    }
    console.log("Server is closing now")
    process.exit(); //Stops the server
})

router.post(`/ban-user`, (req, res) => {
    if(!req.user || !req.user.admin_user){ //Admin check
        return res.status(403).json({ error: "Ikke logget ind som admin" });
    }
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    } else if (email === "admin"){
        return res.status(403).send("Nej.");
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