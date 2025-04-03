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
    if (err) return console.error('Reserve DB error:', err.message);
    console.log('Connected to SQLite database (dashboard router).');
    db.run("PRAGMA foreign_keys = ON;");
});



//Multer storage and file handling
const storage = multer.diskStorage({
    destination: function (req, file, cb){

        const dir = path.join(process.cwd(), 'images', 'temp');

        fs.mkdirSync(dir, {recursive: true});
        cb(null,dir);
    },
    filename: function (req, file, cb){
        cb(null, Date.now()+'-'+file.originalname);
    }
});

const upload = multer({storage: storage});



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

router.post("/add_product", upload.fields([
    {name: 'img1', maxCount: 1},
    {name: 'img2', maxCount: 1},
    {name: 'img3', maxCount: 1},
    {name: 'img4', maxCount: 1},
    {name: 'img5', maxCount: 1}]), 
    async (req, res)=>{
    const {name, stock, price, discount, description, specifications} = req.body;
    const shop_id = req.user?.shop_id;

    if (!req.user || !req.user.shop_id) {
        return res.status(403).send("Ikke autoriseret");
    }


    db.get(`SELECT city_id, shop_name FROM shops WHERE id = ?`, [shop_id], (err, row) => {
        if (err){
            return res.status(500).send("Databasefejl");
        }

        if (!row) {
            return res.status(404).send("butik ikke fundet");
        }

        const city_id = row.city_id;
        const shop_name = row.shop_name;

        db.get(`SELECT city FROM cities WHERE id= ?`, [city_id], async (err, city_row)=>{
            if (err){
                return res.status(500).send("Databasefejl");
            }
            if (!city_row) {
                return res.status(404).send("butik ikke fundet");
            }

            const city_name = city_row.city;
            const targetDir = path.join('images', city_name, shop_name, name);
            const absoluteTargetDir = path.join(process.cwd(), targetDir);

            // Make directory for the product
            await fse.ensureDir(absoluteTargetDir);

            const file_paths = [1, 2, 3, 4, 5].map(n => {
                const file = req.files[`img${n}`]?.[0];
                if (file) {
                    const newPath = path.join(absoluteTargetDir, file.originalname);
                    fs.renameSync(file.path, newPath); // move the file
                    return `/${targetDir}/${file.originalname}`.replace(/\\/g, '/'); // for DB
                }
                return null;
            });
            db.run(`
                INSERT INTO products (product_name, stock, price, discount, description, specifications, shop_id, city_id,
                img1_path, img2_path, img3_path, img4_path, img5_path)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
                `,[name, stock, price, discount, description, specifications, shop_id, city_id, file_paths[0], file_paths[1], file_paths[2], file_paths[3], file_paths[4]], (err)=>{
                    if(err){
                        return res.status(500).json({error: err.message});
                    }else{
                        res.json({succes: true});
                    }
                }
            );

        });


    });


});

export default router;