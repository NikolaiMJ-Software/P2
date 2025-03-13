const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./databases/click_and_collect.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});


db.all(`SELECT city FROM cities ORDER BY id ASC`, (err, rows) => {
    if (err) {
        console.error('Error fetching cities:', err.message);
        return;
    }


    const city_list = rows.map(row => row.city);


    console.log('List of cities:', city_list);
});

db.all(`SELECT image_path FROM cities ORDER BY id ASC`, (err, rows) => {
    if (err) {
        console.error('Error fetching cities:', err.message);
        return;
    }


    const city_image = rows.map(row => row.image_path);


    console.log('List of images:', city_image);
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database connection closed.');
    }
});