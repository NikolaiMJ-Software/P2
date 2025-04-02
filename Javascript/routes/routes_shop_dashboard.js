import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';


//Makes files work together
const router = express.Router();

//Makes a path to the current database (which can't be directly interacted with)
const db_path = path.join(process.cwd(), 'databases', 'click_and_collect.db');

//Makes a new database with data from the current database (which can be interacted with)
const db = new sqlite3.Database(db_path, (err) => {
    if (err) return console.error('Reserve DB error:', err.message);
    console.log('Connected to SQLite database (dashboard router).');
    db.run("PRAGMA foreign_keys = ON;");
});



router.get('/shop_dashboard', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'HTML', 'shop_dashboard.html'));
});


router.get('/shop_products', (req, res)=>{
    if(!req.user || !req.user.shop_id){
        return res.status(403).json({ error: "Ikke logget ind som butik" });
    }

    db.all(`SELECT * FROM products WHERE shop_id = ?`, [req.user.shop_id], (err, rows)=>{
        if (err){
            return res.status(500).json({error: err.message});
        }else{
            res.json(rows);
        }
    })
});



router.post('/update_stock', (req, res) => {
    const { id, stock } = req.body;

    if (!req.user || !req.user.shop_id) {
        return res.status(403).send("Ikke autoriseret");
    }
    if(stock>=0){
        db.run(`UPDATE products SET stock = ? WHERE id = ? AND shop_id = ?`, [stock, id, req.user.shop_id], function (err) {
            if (err){
                return res.status(500).send("Databasefejl");
            }else{
                res.send("Stock updated");
            }
        });
    }
});


router.post('/delete_ware', (req, res)=>{
    const { id } = req.body;

    if (!req.user || !req.user.shop_id) {
        return res.status(403).send("Ikke autoriseret");
    }

    db.run(`DELETE FROM products WHERE id = ? AND shop_id = ?`, [id, req.user.shop_id], (err) => {
        if (err){
            return res.status(500).send("Databasefejl");
        }else{
            res.send("Item deleted");
        }
    });

});

router.post("/add_product", (req, res)=>{
    const {name, stock, price, discount, description, specifications} = req.body;
    const shop_id = req.user?.shop_id;

    if (!req.user || !req.user.shop_id) {
        return res.status(403).send("Ikke autoriseret");
    }


    db.get(`SELECT city_id FROM shops WHERE id = ?`, [shop_id], (err, row) => {
        if (err){
            return res.status(500).send("Databasefejl");
        }

        if (!row) {
            return res.status(404).send("butik ikke fundet");
        }

        const city_id = row.city_id

        db.run(`
            INSERT INTO products (product_name, stock, price, discount, description, specifications, shop_id, city_id)
            VALUES (?,?,?,?,?,?,?,?)
            `,[name, stock, price, discount, description, specifications, shop_id, city_id], (err)=>{
                if(err){
                    return res.status(500).json({error: err.message});
                }else{
                    res.json({succes: true});
                }
            }
        );
    });


});

export default router;