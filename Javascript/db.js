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
        FOREIGN KEY(city_id) REFERENCES cities(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_id INTEGER,
        shop_id INTEGER,
        product_stock INTEGER,
        FOREIGN KEY(city_id) REFERENCES cities(id),
        FOREIGN KEY(shop_id) REFERENCES shops(id)
    )`);
    db.run(`INSERT INTO cities (city) VALUES ('Aalborg'), ('København'), ('Aarhus'), ('Odense'), ('Esbjerg'), ('Randers'), ('Horsens'), ('Kolding')`, (err) => {
        if (err) console.error('Error inserting data:', err.message);
        else console.log('Cities inserted.');
    });
});



db.close();