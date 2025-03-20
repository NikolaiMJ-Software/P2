const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { reservation_mails } = require('./mail_sender')

const dbPath = path.join(__dirname, '../databases/click_and_collect.db');
const db = new sqlite3.Database(dbPath, (err) => {
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
    const shop_id = rows.map(row => row.shop_id);
    const stock = rows.map(row => row.stock);
    const price = rows.map(row => row.price);
    const description = rows.map(row => row.description);
    const img1 = rows.map(row => row.img1);
    const img2 = rows.map(row => row.img2);
    const img3 = rows.map(row => row.img3);
    const specifications = rows.map(row => row.specifications);

    
    document.getElementById('product_name').innerText = product_name;
    document.getElementById('shop_id').innerText = shop_id;
    document.getElementById('stock').innerText = stock;
    document.getElementById('price').innerText = price;
    document.getElementById('description').innerText = description;
    document.getElementById('img1').innerText = img1;
    document.getElementById('img2').innerText = img2;
    document.getElementById('img3').innerText = img3;
    document.getElementById('specifications').innerText = specifications;
    
    console.log('List of products:', product_name, price, specifications, shop_id, description);
});




db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database connection closed.');
    }
});

const button = document.getElementById("cart_button");
button.addEventListener("click", reservation);
function reservation() {
    db.get("SELECT shops.email FROM products JOIN shops ON products.shop_id = shops.id WHERE products.id = ?;", [id], (err, row) => {
        if(err) {
            console.log("Could not get email from shop");
        }
        if(row) {
            console.log("Succedded in getting shop email");
        }
        let email = prompt("Please enter your email", "Your email");
        reservation_mails(email, row.email, id);
    });
}