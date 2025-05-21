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
    console.log('Connected to SQLite database (dashboard router).');
    db.run("PRAGMA foreign_keys = ON;");
});



//Multer storage and file handling
const storage = multer.diskStorage({
    //manages images, and places them in a temp folder, until new dir is found
    destination: function (req, file, cb){

        const dir = path.join(process.cwd(), '.', 'Images', 'temp');

        fs.mkdirSync(dir, {recursive: true});
        cb(null,dir);
    },
    filename: function (req, file, cb){
        cb(null, Date.now()+'-'+file.originalname);
    }
});

const upload = multer({storage: storage});


//route to get the html for dashboard
router.get('/shop_dashboard', (req, res) => {
    //check if user is logged in and have the required authorization if they have they are allowed to see the page
    if (req.user && req.user.admin_user && req.query.shop != undefined) {
        req.user.shop_id = req.query.shop;
    }

    if(!req.user || !req.user.shop_id){
        return res.status(403).json({ error: "Ikke logget ind som butik" });
    }
    //fetch the html for the dashboard
    res.sendFile(path.join(process.cwd(), '.', 'HTML', 'shop_dashboard.html'));
});

//route to gather all products for designated shop
router.get('/shop_products', (req, res)=>{
    //if user not logged in and have no shop id, acces denied
    if(!req.user || !req.user.shop_id){
        return res.status(403).json({ error: "Ikke logget ind som butik" });
    }
    //make a list of all products which is connected to the designated product id
    db.all(`SELECT * FROM products WHERE shop_id = ?`, [req.user.shop_id], (err, rows)=>{
        if (err){
            return res.status(500).json({error: err.message});
        }else{
            res.json(rows);
        }
    })
});


//update stock route
router.post('/update_stock', (req, res) => {
    //gets an item id and stock from front end
    const { id, stock } = req.body;
    //if user not logged in and have no shop id, acces denied
    if(!req.user || !req.user.shop_id) {
        return res.status(403).send("Ikke autoriseret");
    }
    //if stock is larger then or equal to 0 the stock will be updated in the DB using the stock and id given from front end
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

//route which deletes wares, and removes folders for given ware
router.post('/delete_ware', (req, res)=>{
    //gets item id from front end code
    const { id } = req.body;

    //if user not logged in and have no shop id, acces denied
    if(!req.user || !req.user.shop_id) {
        return res.status(403).send("Ikke autoriseret");
    }

    //finds product name and city id from the products table, using the logged in user shop id and product id given from front end
    db.get(`SELECT product_name, city_id FROM products WHERE id = ? and shop_id = ?`, [id, req.user.shop_id], (err, product)=>{
        if(err || !product){
            return res.status(500).send("Databasefejl");
        }

        //finds the city name, from the cities table using the former database searches city id
        db.get(`SELECT city FROM cities WHERE id = ?`, [product.city_id], (err, city)=>{
            if(err || !city){
                return res.status(500).send("Databasefejl");
            }

                //finds the shop name from the table shops, using the logged in users shop id
                db.get(`SELECT shop_name FROM shops WHERE id = ?`, [req.user.shop_id], (err, shop)=>{
                    if(err || !shop){
                        return res.status(500).send("Databasefejl");
                    }

                    //defining the folder path /Images/[city name]/[shop name]/[product name] using the variables from the DB searches
                    const folder_path = path.join(process.cwd(), '.', 'Images', city.city, shop.shop_name, product.product_name);

                    //delete product from the DB using product id and shop id
                    db.run(`DELETE FROM products WHERE id = ? AND shop_id = ?`, [id, req.user.shop_id], (err) => {
                        if (err){
                            return res.status(500).send("Databasefejl");
                        }
                        //deletes the folder for the specific product with its pictures
                        fs.rm(folder_path, { recursive: true, force: true }, (err) => {
                            if (err){
                                console.error("Kunne ikke slette billedmappe:", err);
                            }
                            //sent back to front end that ware is deleted
                            res.send("Varer og billeder slettet.");
                        });
                    });
            
                });
            });
        });
    });

//route to add product
router.post("/add_product", upload.fields(
    //define images sent from front end
    [{name: 'img1', maxCount: 1},
    {name: 'img2', maxCount: 1},
    {name: 'img3', maxCount: 1},
    {name: 'img4', maxCount: 1},
    {name: 'img5', maxCount: 1}]), 
    async (req, res)=>{
    //define variables from front end as well as shop id from user and paerent id value if its null or not
    const {name, stock, price, discount, description, specifications, parent_id } = req.body;
    const shop_id = req.user?.shop_id;
    const parent_id_value = parent_id ? parseInt(parent_id) : null;

    //make sure nummerical values stays nummerical values
    const parsed_price = parseFloat(price);
    const parsed_stock = parseInt(stock, 10);
    const parsed_discount = parseFloat(discount) || 0;
    
    if (isNaN(parsed_price) || parsed_price < 0) {
        return res.status(400).send("Pris skal være et gyldigt tal ≥ 0.");
    }
    if (isNaN(parsed_stock) || parsed_stock < 0) {
        return res.status(400).send("Lager skal være et gyldigt heltal ≥ 0.");
    }
    if (isNaN(parsed_discount) || parsed_discount < 0 || parsed_discount > parsed_price) {
        return res.status(400).send("Rabat skal være mellem 0 og prisen.");
    }
    

    //if user not logged in and have no shop id, acces denied
    if (!req.user || !req.user.shop_id) {
        return res.status(403).send("Ikke autoriseret");
    }

    //find city id and shop name from DB table shops using shop id
    db.get(`SELECT city_id, shop_name FROM shops WHERE id = ?`, [shop_id], (err, row) => {
        if (err){
            return res.status(500).send("Databasefejl");
        }

        if (!row) {
            return res.status(404).send("butik ikke fundet");
        }

        //define city id and shop name
        const city_id = row.city_id;
        const shop_name = row.shop_name;

        //select city name from table cities using city id
        db.get(`SELECT city FROM cities WHERE id= ?`, [city_id], async (err, city_row)=>{
            if (err){
                return res.status(500).send("Databasefejl");
            }
            if (!city_row) {
                return res.status(404).send("butik ikke fundet");
            }

            //define city name, and folder path for new product
            const city_name = city_row.city;
            const dir = path.join('.', 'Images', city_name, shop_name, name);
            const specific_dir = path.join(process.cwd(), '.', dir);

            //ensure directory exists, if it does not then create directory
            await fse.ensureDir(specific_dir);

            //define the file path for all 5 pictures, and using the map function to see if picture is uploaded
            const file_paths = [1, 2, 3, 4, 5].map(n => {
                //defines file name
                const file = req.files[`img${n}`]?.[0];
                //if file exists, add the file in the given directory
                if (file) {
                    const new_path = path.join(specific_dir, file.originalname);
                    fs.renameSync(file.path, new_path); // move the file
                    return `${dir}/${file.originalname}`.replace(/\\/g, '/'); // for DB
                }
                //if no file exists return null
                return null;
            });
            //add the new product in the database using the different paths and values defined
            db.run(`
                INSERT INTO products (product_name, stock, price, discount, description, specifications, shop_id, city_id,
                img1_path, img2_path, img3_path, img4_path, img5_path, parent_id)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                `,[name, stock, price, discount, description, specifications, shop_id, city_id, file_paths[0], file_paths[1], file_paths[2], file_paths[3], file_paths[4], parent_id_value], (err)=>{
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



//route to update already existing products
router.post("/update_product", upload.fields([
    {name: 'update-img1', maxCount: 1},
    {name: 'update-img2', maxCount: 1},
    {name: 'update-img3', maxCount: 1},
    {name: 'update-img4', maxCount: 1},
    {name: 'update-img5', maxCount: 1}]), 
    async (req, res)=>{

    //if user is not logged in, he or she is unauthorized
    if(!req.user || !req.user.shop_id) {
        return res.status(403).send("Ikke autoriseret");
    }

    //defining different variable, which came from the fron end code and user login
    const {id, "update-name": name, "update-stock": stock, "update-price": price, "update-discount": discount, "update-description": description, "update-specifications": specifications} = req.body; 
    const shop_id = req.user.shop_id;

    //make sure nummerical values stays nummerical values
    const parsed_price = parseFloat(price);
    const parsed_stock = parseInt(stock, 10);
    const parsed_discount = parseFloat(discount) || 0;
    
    if (isNaN(parsed_price) || parsed_price < 0) {
        return res.status(400).send("Pris skal være et gyldigt tal ≥ 0.");
    }
    if (isNaN(parsed_stock) || parsed_stock < 0) {
        return res.status(400).send("Lager skal være et gyldigt heltal ≥ 0.");
    }
    if (isNaN(parsed_discount) || parsed_discount < 0 || parsed_discount > parsed_price) {
        return res.status(400).send("Rabat skal være mellem 0 og prisen.");
    }

    //if values are missing, function cannot proceed
    if(!id || !name || !stock || !price){
        return res.status(400).send("Manglende felter");
    }
    //try the following:
    try{

        //await a promise where we get everything regarding a product from the product table with a specific product id and shop id
        const product = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM products WHERE id = ? AND shop_id = ?`, [id, shop_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });


        //if product cannot be found, sent an error
        if (!product) return res.status(404).send("Produkt ikke fundet.");

        //await a promise of getting a shop name and city id from the table shops using shop id
        const shop = await new Promise((resolve, reject) => {
            db.get(`SELECT shop_name, city_id FROM shops WHERE id = ?`, [shop_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        //await a promise of getting city name from the table cities using city id from former table search
        const city = await new Promise((resolve, reject) => {
            db.get(`SELECT city FROM cities WHERE id = ?`, [shop.city_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        //define variables shop name, city name and image path list
        const shop_name = shop.shop_name;
        const city_name = city.city;
        const image_paths = {};


        //Save old image paths before renaming folder
        const old_image_paths = {};
        for (let i = 1; i <= 5; i++) {
            old_image_paths[`img${i}_path`] = product[`img${i}_path`];
        }

        //Delete old images
        for (let i = 1; i <= 5; i++) {
            //define each new image if there is a new image
            const image = `update-img${i}`;
            //if there is a new image, and we have requested files do the following:
            if (req.files && req.files[image]) {
                // define the old image path, and if it isnt null do the following:
                const old_img_path = old_image_paths[`img${i}_path`];
                if (old_img_path) {
                    //define the full old image path images/[city]/[shop]/[product]/[image]
                    const full_old_path = path.join(process.cwd(), '.', old_img_path);
                    //if it exist, delete image
                    if (fs.existsSync(full_old_path)) {
                        fs.unlinkSync(full_old_path);
                    } else {
                        console.warn("Old image not found (pre-rename):", full_old_path);
                    }
                }
            }
        }

        // Rename folder if product name has changed
        if (product.product_name !== name) {
            //define old folder path
            const old_folder = path.join(process.cwd(), '.', "Images", city_name, shop_name, product.product_name);
            //define new folder path
            const new_folder = path.join(process.cwd(), '.', "Images", city_name, shop_name, name);
            //if old folder exist, rename old folder to new folder
            if (fs.existsSync(old_folder)) {
                fs.renameSync(old_folder, new_folder);
            }
        }

        // Move new uploaded images into final destination and update image paths
        for (let i = 1; i <= 5; i++) {
            //define new image
            const image = `update-img${i}`;
            //if image and files from 1-5 exist do the following:
            if (req.files && req.files[image]) {
                const file = req.files[image][0];
                const filename = file.originalname;
                const image_dir = path.join(process.cwd(), '.', "Images", city_name, shop_name, name);

                // Ensure the renamed directory exists
                fs.mkdirSync(image_dir, { recursive: true });

                const target_path = path.join(image_dir, filename);

                if (fs.existsSync(file.path)) {
                    fs.renameSync(file.path, target_path);
                } else {
                    console.warn("Temp file missing:", file.path);
                }

                // Save new image path for DB update
                image_paths[`img${i}_path`] = `./Images/${city_name}/${shop_name}/${name}/${filename}`;
            } else {
                // If image wasn't updated but folder was renamed, keep updated path
                const old_img_path = old_image_paths[`img${i}_path`];
                if (old_img_path && product.product_name !== name) {
                    const filename = path.basename(old_img_path);
                    image_paths[`img${i}_path`] = `./Images/${city_name}/${shop_name}/${name}/${filename}`;
                }
            }
        }

        //make list for inputs in the DB
        const fields = [
            `product_name = ?`,
            `stock = ?`,
            `price = ?`,
            `discount = ?`,
            `description = ?`,
            `specifications = ?`
        ];

        //make list of values to be inserted in the DB
        const values = [name, stock, price, discount, description, specifications];

        //for each image path, add it to inputs in fields and values
        for (const [image, value] of Object.entries(image_paths)) {
        fields.push(`${image} = ?`);
        values.push(value);
        }

        //push id and shop id to values
        values.push(id, shop_id);


        //define the sqlite using the fields variable
        const sql = `
        UPDATE products SET ${fields.join(", ")} WHERE id = ? AND shop_id = ?`;

        //insert everything into the DB using the sql variable and the values variable
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

//route to define parent product
router.get('/parent_products', (req, res)=>{
    //define shop id using value from logged in user
    const shop_id = req.user.shop_id;
    //find id and product id for all products in table products which has the shop id and parent id as null
    db.all('SELECT id, product_name FROM products WHERE shop_id = ? AND parent_id IS NULL', [shop_id], (err, rows)=>{
        if (err) {
            console.error("DB error:", err);
            return res.status(500).json({ error: "Database fejl" });
          }
          res.json(rows);
    });
});

//route to get shop name
router.get('/shop_name', (req, res)=>{
    //define shop is using user logged in
    const shop_id = req.user.shop_id;

    //if shop id is not defined no shop can be collected
    if (!shop_id) {
        return res.status(401).json({ error: "Ikke logget ind eller shop_id mangler" });
    }

    //find id, shop name and image path where id equals shop id
    db.get('SELECT id, shop_name, img_path FROM shops WHERE id = ?', [shop_id], (err, rows)=>{
        if (err) {
            console.error("DB error:", err);
            return res.status(500).json({ error: "Database fejl" });
          }
          res.json(rows);
    });
});

//route to update shop logo
router.post("/update_logo", upload.fields(
    //shop logo sent from front end code
    [{ name: 'update-logo', maxCount: 1 }
]), async (req, res) => {
    //define shop id and logo file
    const shop_id = req.user.shop_id;
    const logo_file = req.files['update-logo']?.[0];

    //if logo is null then sent error
    if (!logo_file) {
        return res.status(400).json({ error: "Ingen logo-fil modtaget" });
    }

    //find city id and shop name from shops table using shop id
    db.get('SELECT city_id, shop_name FROM shops WHERE id = ?', [shop_id], async (err, row) => {
        if (err) {
            console.error("DB error:", err);
            return res.status(500).json({ error: "Database fejl" });
        }

        if (!row) {
            return res.status(404).json({ error: "Shop ikke fundet" });
        }

        //try the following
        try {
            //await the promise city_name, by searching for city name in the cities table using city id from former search
            const city_name = await new Promise((resolve, reject) => {
                db.get(`SELECT city FROM cities WHERE id = ?`, [row.city_id], (err, city_row) => {
                    if (err) return reject(err);
                    if (!city_row) return reject(new Error("By ikke fundet"));
                    resolve(city_row.city);
                });
            });

            //define shop folder path
            const shop_folder = path.join('.', 'Images', city_name, row.shop_name);
            //define logo file name
            const logo_file_name = 'logo' + path.extname(logo_file.originalname);
            //define logo file path
            const image_path = path.join(shop_folder, logo_file_name);
            //define logo path for DB
            const logo_path_for_db = `Images/${city_name}/${row.shop_name}/${logo_file_name}`;

            // Remove old logo files in the shop folder
            const files = await fse.readdir(shop_folder);
            for (const file of files) {
            if (file.startsWith("logo.")) {
                await fse.remove(path.join(shop_folder, file));
                }
            }

            //ensure shop folder exists if not, then make it
            await fse.ensureDir(shop_folder);
            //add logo gile to folder
            await fse.move(logo_file.path, image_path, { overwrite: true });

            // Update DB with new image path
            db.run(`UPDATE shops SET img_path = ? WHERE id = ?`, [logo_path_for_db, shop_id], (err) => {
                if (err) {
                    console.error("Fejl ved opdatering af logo i DB:", err);
                    return res.status(500).json({ error: "Kunne ikke opdatere logo i databasen" });
                }

                return res.status(200).json({ message: "Logo opdateret" });
            });

        } catch (error) {
            console.error("Fejl:", error);
            return res.status(500).json({ error: "Intern serverfejl" });
        }
    });
});


export default router;