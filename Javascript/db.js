const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./databases/click_and_collect.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

db.run("PRAGMA foreign_keys = ON;");



db.serialize(() => {
    //db.run(`DROP TABLE cities`),
    //db.run(`DROP TABLE products`),
    //db.run(`DROP TABLE shops`),

    db.run(`CREATE TABLE cities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city TEXT UNIQUE,
        image_path TEXT
    )`, (err) => {
        if (err) console.error("Error creating table:", err.message);
        else console.log("Table 'cities' created with UNIQUE constraint.");
    });


    db.run(`CREATE TABLE IF NOT EXISTS shops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_name TEXT,
        city_id INTEGER,
        img_path TEXT,
        FOREIGN KEY(city_id) REFERENCES cities(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_id INTEGER,
        shop_id INTEGER,
        stock INTEGER,
        price INTEGER,
        description TEXT,
        img1_path TEXT,
        img2_path TEXT,
        img3_path TEXT,
        img4_path TEXT,
        img5_path TEXT,
        specifications TEXT,
        FOREIGN KEY(city_id) REFERENCES cities(id),
        FOREIGN KEY(shop_id) REFERENCES shops(id)
    )`);
    db.run(`INSERT INTO cities (city, image_path) VALUES 
        ('Aalborg', 'Images/Aalborg/musikkenshus.jpg'), 
        ('København', 'Images/København/Lille_havfrue.jpg'), 
        ('Aarhus', 'Images/Aarhus/gamle_by.jpg'), 
        ('Odense', 'Images/Odense/H.C._Andersen_Hus.jpg'), 
        ('Esbjerg', 'Images/Esbjerg/4hvidemænd.jpg'), 
        ('Randers', 'Images/Randers/Randers_Regnskov.jpg'), 
        ('Horsens', 'Images/Horsens/Horsens_Fængsel.jpg'), 
        ('Kolding', 'Images/Kolding/Kolding_Mini_By.jpg'), 
        ('Test', 'Images/Test/test.png')`, (err) => {
            if (err) console.error('Error inserting data:', err.message);
            else console.log('Cities with image paths inserted.');
        });

        db.run(`CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            name TEXT,
            password TEXT
        )`, (err) => {
            if (err) console.error("Error creating table:", err.message);
            else console.log("Table 'cities' created with UNIQUE constraint.");
        });

        db.run(`INSERT INTO users (email, name, password) VALUES
            ('sebastianpleygames.dk@gmail.com', 'Sebastian', '123')`, (err) => {
                if (err) console.error('Error inserting data:', err.message);
                else console.log('Users inserted.');
            });
        db.run(`INSERT INTO shops (shop_name, city_id, img_path) VALUES
            ('Måneby', '1', 'Images/Aalborg/Måneby/månebylogo.jpg')`, (err) => {
                if (err) console.error('Error inserting data:', err.message);
                else console.log('Shop inserted.');
            });
        db.run(`INSERT INTO products (city_id, shop_id, stock, price, description, img1_path, img2_path, specifications) VALUES
            ('1', '1', '10', '25', 'Den er grim', '')`, (err) => {
                if (err) console.error('Error inserting data:', err.message);
                else console.log('product inserted.');
            });

});

id INTEGER PRIMARY KEY AUTOINCREMENT,
city_id INTEGER,
shop_id INTEGER,
stock INTEGER,
price INTEGER,
description TEXT,
img1_path TEXT,
img2_path TEXT,
img3_path TEXT,
img4_path TEXT,
img5_path TEXT,
specifications TEXT,


id INTEGER PRIMARY KEY AUTOINCREMENT,
shop_name TEXT,
city_id INTEGER,
img_path TEXT,

db.close();