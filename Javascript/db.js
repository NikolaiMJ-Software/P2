const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../databases/click_and_collect.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run("PRAGMA foreign_keys = ON;");
    }
});




db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS products`);
    db.run(`DROP TABLE IF EXISTS shops`);
    db.run(`DROP TABLE IF EXISTS cities`);
    db.run(`DROP TABLE IF EXISTS users`);

    db.run(`CREATE TABLE cities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city TEXT UNIQUE,
        image_path TEXT,
        latitude REAL,
        longitude REAL

    )`, (err) => {
        if (err) console.error("Error creating table:", err.message);
        else console.log("Table 'cities' created with UNIQUE constraint.");
    });


    db.run(`CREATE TABLE IF NOT EXISTS shops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_name TEXT NOT NULL,
        city_id INTEGER,
        img_path TEXT,
        email TEXT,
        FOREIGN KEY(city_id) REFERENCES cities(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city_id INTEGER,
    shop_id INTEGER,
    product_name TEXT NOT NULL,
    stock INTEGER,
    price REAL,
    description TEXT,
    img1_path TEXT,
    img2_path TEXT,
    img3_path TEXT,
    img4_path TEXT,
    img5_path TEXT,
    specifications TEXT,
    discount REAL,
    FOREIGN KEY(shop_id) REFERENCES shops(id),
    FOREIGN KEY(city_id) REFERENCES cities(id)
    )`);

    db.run(`INSERT INTO cities (city, image_path, latitude, longitude) VALUES 
        ('Aalborg', 'Images/Aalborg/musikkenshus.jpg', 57.0499998, 9.916663),
        ('København', 'Images/København/Lille_havfrue.jpg', 55.67594, 12.56553),
        ('Aarhus', 'Images/Aarhus/gamle_by.jpg', 56.1572, 10.2107),
        ('Odense', 'Images/Odense/H.C._Andersen_Hus.jpg', 55.39594, 10.38831),
        ('Esbjerg', 'Images/Esbjerg/4hvidemænd.jpg', 55.47028, 8.45187),
        ('Randers', 'Images/Randers/Randers_Regnskov.jpg', 56.4607, 10.03639),
        ('Horsens', 'Images/Horsens/Horsens_Fængsel.jpg', 55.86066, 9.85034),
        ('Kolding', 'Images/Kolding/Kolding_Mini_By.jpg', 55.4904, 9.47216),
        ('Test', 'Images/Test/test.png', 0, 0)`, (err) => {
            if (err) console.error('Error inserting data:', err.message);
            else console.log('Cities with image paths inserted.');
        });
        

        db.run(`CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            password TEXT
        )`, (err) => {
            if (err) console.error("Error creating table:", err.message);
            else console.log("Table 'users' created.");
        });

        db.run(`INSERT INTO users (email, name, password) VALUES
            ('sebastianpleygames.dk@gmail.com', 'Sebastian', '123')`, (err) => {
                if (err) console.error('Error inserting data:', err.message);
                else console.log('Users inserted.');
            });
        db.run(`INSERT INTO shops (shop_name, city_id, img_path, email) VALUES
            ('Måneby', '1', 'Images/Aalborg/Måneby/månebylogo.jpg', 'nikolai456654@gmail.com')`, (err) => {
                if (err) console.error('Error inserting data:', err.message);
                else console.log('Shop inserted.');
            });
        db.run(`INSERT INTO products (city_id, shop_id, product_name, stock, price, description, img1_path, img2_path, img3_path, specifications, discount) VALUES
            (1, 1, 'den grimme maskine', 10, 25, 'Den er grim', 'Images/Aalborg/Måneby/Sage_Joracle_Jet_espressomaskine/dv_web_D18000128322083.png', 'Images/Aalborg/Måneby/Sage_Joracle_Jet_espressomaskine/dv_web_D18000128321829.png',
            'Images/Aalborg/Måneby/Sage_Joracle_Jet_espressomaskine/dv_web_D18000128321826.png', 'Den er faktisk virkelig grim', 30)`, (err) => {
                if (err) console.error('Error inserting data:', err.message);
                else console.log('product inserted.');
            });
        db.run(`CREATE INDEX idx_shops_city ON shops(city_id);`);
        db.run(`CREATE INDEX idx_products_shop ON products(shop_id);`);
});

db.close();