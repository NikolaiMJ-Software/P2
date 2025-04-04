import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import fse from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    db.get(`SELECT product_name, city_id FROM products WHERE id = ? and shop_id = ?`, [id, req.user.shop_id], (err, product)=>{
        if(err || !product){
            return res.status(500).send("Databasefejl");
        }

        db.get(`SELECT city FROM cities WHERE id = ?`, [product.city_id], (err, city)=>{
            if(err || !city){
                return res.status(500).send("Databasefejl");
            }

                db.get(`SELECT shop_name FROM shops WHERE id = ?`, [req.user.shop_id], (err, shop)=>{
                    if(err || !shop){
                        return res.status(500).send("Databasefejl");
                    }

                    const folder_path = path.join(process.cwd(), 'images', city.city, shop.shop_name, product.product_name);

                    db.run(`DELETE FROM products WHERE id = ? AND shop_id = ?`, [id, req.user.shop_id], (err) => {
                        if (err){
                            return res.status(500).send("Databasefejl");
                        }
                        fs.rm(folder_path, { recursive: true, force: true }, (err) => {
                            if (err){
                                console.error("Kunne ikke slette billedmappe:", err);
                            }

                            res.send("Varer og billeder slettet.");
                        });
                    });
            
                });
            });
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
            const dir = path.join('Images', city_name, shop_name, name);
            const specific_dir = path.join(process.cwd(), dir);

            await fse.ensureDir(specific_dir);

            const file_paths = [1, 2, 3, 4, 5].map(n => {
                const file = req.files[`img${n}`]?.[0];
                if (file) {
                    const newPath = path.join(specific_dir, file.originalname);
                    fs.renameSync(file.path, newPath); // move the file
                    return `${dir}/${file.originalname}`.replace(/\\/g, '/'); // for DB
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




router.post("/update_product", upload.fields([
    {name: 'update-img1', maxCount: 1},
    {name: 'update-img2', maxCount: 1},
    {name: 'update-img3', maxCount: 1},
    {name: 'update-img4', maxCount: 1},
    {name: 'update-img5', maxCount: 1}]), 
    async (req, res)=>{


    if (!req.user || !req.user.shop_id) {
        return res.status(403).send("Ikke autoriseret");
    }


    const {id, "update-name": name, "update-stock": stock, "update-price": price, "update-discount": discount, "update-description": description, "update-specifications": specifications} = req.body; 

    const shop_id = req.user.shop_id;

    if(!id || !name || !stock || !price){
        return res.status(400).send("Manglende felter");
    }

    try{

        const product = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM products WHERE id = ? AND shop_id = ?`, [id, shop_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });


        if (!product) return res.status(404).send("Produkt ikke fundet.");


        const shop = await new Promise((resolve, reject) => {
            db.get(`SELECT shop_name, city_id FROM shops WHERE id = ?`, [shop_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });


        const city = await new Promise((resolve, reject) => {
            db.get(`SELECT city FROM cities WHERE id = ?`, [shop.city_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        
        const shop_name = shop.shop_name;
        const city_name = city.city;
        const image_paths = {};

        
    //Rename folder if product name has changed
    if (product.product_name !== name) {
        const old_folder = path.join(process.cwd(), "images", city_name, shop_name, product.product_name);
        const new_folder = path.join(process.cwd(), "images", city_name, shop_name, name);

        if (fs.existsSync(old_folder)) {
            fs.renameSync(old_folder, new_folder);
        }

        // update image_paths to reflect new folder
        for (let i = 1; i <= 5; i++) {
            const old_path = product[`img${i}_path`];
            if (old_path) {
                const filename = path.basename(old_path);
                image_paths[`img${i}_path`] = `/images/${city_name}/${shop_name}/${name}/${filename}`;
            }
        }
    }


        for (let i = 1; i <= 5; i++){
            const image = `update-img${i}`;
            if(req.files && req.files[image]){
                const file = req.files[image][0];
                const filename = file.originalname;
                const image_dir = path.join(process.cwd(), "images", city_name, shop_name, name);

                // Ensure the directory exists
                fs.mkdirSync(image_dir, { recursive: true });

                const target_path = path.join(image_dir, filename);

                //delete old path
                const old_path = product[`img${i}_path`];
                if (old_path) {
                  const full_old_path = path.join(process.cwd(), old_path);
                  if (fs.existsSync(full_old_path)) {
                    fs.unlinkSync(full_old_path);
                  }
                }

                // Move file to final destination
                fs.renameSync(file.path, target_path);

                //save image paths
                image_paths[`img${i}_path`] = `/images/${city_name}/${shop_name}/${name}/${filename}`;
            }
        }

        const fields = [
            `product_name = ?`,
            `stock = ?`,
            `price = ?`,
            `discount = ?`,
            `description = ?`,
            `specifications = ?`
          ];

          const values = [name, stock, price, discount, description, specifications];

          for (const [image, value] of Object.entries(image_paths)) {
            fields.push(`${image} = ?`);
            values.push(value);
          }

          values.push(id, shop_id);


          const sql = `
          UPDATE products
          SET ${fields.join(", ")}
          WHERE id = ? AND shop_id = ?
        `;

        db.run(sql, values, function (err) {
            if (err) {
              console.error("DB update error:", err);
              return res.status(500).send("Fejl under opdatering af produkt.");
            }
    
            res.send("Produkt opdateret.");
          });
        } catch (err) {
          console.error("Server error:", err);
          res.status(500).send("Intern serverfejl.");
        }


});

export default router;