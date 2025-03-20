const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./databases/click_and_collect.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});



let id = 1;

db.all(`SELECT * FROM Products WHERE id = ?`, [id], (err, rows) => {
    if (err) {
        console.error('Error fetching products:', err.message);
        return;
    }
    const product_name = rows.map(row => row.product_name);

    console.log('List of products:', product_name);
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database connection closed.');
    }
});