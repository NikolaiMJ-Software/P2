import express from 'express';
import path from 'path';
import sqlite3 from 'sqlite3';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

//routes:
import user_router from './routes/routes_user.js';
import reserve_router from './routes/routes_reserve.js';
import shop_dashboard_router from './routes/routes_shop_dashboard.js';
import mail_update_router from './routes/routes_mail_update.js';
import admin_router from './routes/routes_admin.js';

// Get the filename and directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__dirname);

const app = express();
const port = 3360;

//enable json support
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//remove acces for, database
app.use('/databases', (req, res)=>{
    res.statusMessage(403).send('Get Good Bozo');
});

//feature which allows there to be saved a local login
app.use(session({
    secret: '123', //the totaly secret key for users
    resave: false,
    saveUninitialized: false,
    cookie: {secure: false}
}));
//identifies the local login, and makes it public for all parts of the server
app.use((req, res, next) => {
    if (req.session && req.session.user) {
        // Makes it accessible in ALL routes via req.user
        req.user = req.session.user;
    } else {
        req.user = null;
    }
    next();
});
//checks if user is logged in or not
app.get('/user_logged_in', (req, res) => {
    if (!req.user) {
        return res.json({ logged_in: false });
    } else {
        if (req.user.admin_user) req.user.shop_id = null;
        res.json({logged_in: true, email: req.user.email, name: req.user.name, shop_id: req.user.shop_id || null, admin_user: req.user.admin_user || null});
    }
});


// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, '../'))); // Serve from parent folder

//Connecting to sqlite database
const dbPath = path.join(__dirname, '../databases/click_and_collect.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Serve main.html when accessing the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/main.html'));
});

//path to searchpage
app.get('/searchpage', (req, res) => {
    const city = req.query.city; // Get city from query
    
    db.all(`SELECT * FROM cities WHERE city = ?`, [city], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!rows[0]){
            res.status(404).json({ error: 'City not found' });
            return;
        }
        console.log(`\nCity requested: ${city}`); 
        console.log("User:", req.user?.email);
        console.log("Admin:", req.user?.admin_user);
        res.sendFile(path.join(__dirname, '../HTML/searchPage.html'));
    })
});

//path to productpage
app.get('/productpage', (req, res) => {
    const product = req.query.id; // Get product id from query    
    console.log(`\nProduct requested: ${product}`); 
    console.log("User:", req.user?.email);
    res.sendFile(path.join(__dirname, '../HTML/product_page.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/cart.html'))
})

// path to the shop page
app.get('/productlist', (req, res) => {
    const shop = req.query.shop_id; // Get product id from query    
    console.log(`\nShop requested: ${shop}`); 
    console.log("User:", req.user?.email);
    console.log("Admin:", req.user?.admin_user);
    res.sendFile(path.join(__dirname, '../HTML/shop_page.html'));
});


//path to singup and login pages
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/login.html'));
});
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/signup.html'));
});
app.get('/new_store', (req, res) => {
    res.sendFile(path.join(__dirname, '../HTML/new_shop.html'));
});
//signup/login userability
app.use('/', user_router);

//API to get all the cities, pictures and coordinates 
app.get('/cities', (req, res) => {
    db.all(`SELECT * FROM cities ORDER BY id ASC`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// API to get API_key from server
app.get('/api_key', (req, res) => {
    db.all(`SELECT * FROM private ORDER BY id ASC`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

//api to identify the product
app.get('/product', (req, res) => {
    const product_id = req.query.id;
    if (!product_id) {
        res.status(400).json({ error: "Product ID is required" });
        return;
    }

    db.all(`SELECT * FROM Products WHERE id = ?`, [product_id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (rows.length === 0) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        res.json(rows[0]); // Returns first matching product
    });
});
// return products sharing the same parent_id
app.get('/allVariants', (req, res) => {
    const parentId = Number(req.query.parent_id);

    db.all(
        `SELECT id, product_name, img1_path FROM products WHERE parent_id = ? OR id = ?`,
        [parentId, parentId],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json(rows);
            }
        }
    );
});

app.get('/shop', (req, res) => {
    const shopId = req.query.id;

    if (shopId) {
        // Fetch a specific shop by ID
        db.get(`SELECT id, shop_name, latitude, longitude, img_path FROM shops WHERE id = ?`, [shopId], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!row) {
                return res.status(404).json({ error: "Shop not found" });
            }
            res.json(row); // Return one shop object
        });
    } else {
        // Fetch all shops
        db.all(`SELECT * FROM shops`, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows); // Return all shops
        });
    }
});

//api that orders products in decending order
app.get('/products', (req, res) => {
    db.all(`SELECT * FROM products ORDER BY id ASC`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// GET all comments for a product
app.get('/comments', (req, res) => {
    const product_id = req.query.product_id;
    const shop_id = req.query.shop_id;

    let query = '';
    let param = '';

    if (product_id) {
        query = 'SELECT name, comment, rating, timestamp FROM comments WHERE product_id = ? ORDER BY timestamp DESC';
        param = product_id;
    } else if (shop_id) {
        query = 'SELECT name, comment, rating, timestamp FROM comments WHERE shop_id = ? ORDER BY timestamp DESC';
        param = shop_id;
    } else {
        return res.status(400).json({ error: 'Missing product_id or shop_id' });
    }

    db.all(query, [param], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});


// POST a new comment
app.put('/comment', (req, res) => {
    const { product_id, shop_id, name, comment, rating } = req.body;
    const timestamp = Date.now();

    if ((!product_id && !shop_id) || !name || !comment) {
        return res.status(400).json({ error: 'Missing product_id or shop_id, name, or comment' });
    }

    let queryField = product_id ? 'product_id' : 'shop_id';
    let queryValue = product_id || shop_id;

    db.get(
        `SELECT id FROM comments WHERE ${queryField} = ? AND name = ?`,
        [queryValue, name],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (!row) {
                db.run(
                    `INSERT INTO comments (${queryField}, name, comment, rating, timestamp) VALUES (?, ?, ?, ?, ?)`,
                    [queryValue, name, comment, rating, timestamp],
                    function (err) {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ success: true, updated: false });
                    }
                );
            } else {
                db.run(
                    `UPDATE comments SET comment = ?, rating = ?, timestamp = ? WHERE id = ?`,
                    [comment, rating, timestamp, row.id],
                    function (err) {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ success: true, updated: true });
                    }
                );
            }
        }
    );
});

//get average from the rating
app.get('/rating', (req, res) => {
    const product_id = req.query.product_id;
    const shop_id = req.query.shop_id;

    if (!product_id && !shop_id) {
        return res.status(400).json({ error: 'Missing product_id or shop_id' });
    }
    let query = '';
    let param = '';


    if (product_id) {
        query = `SELECT AVG(rating) as avg_rating, COUNT(rating) as total FROM comments WHERE product_id = ? AND rating IS NOT NULL`;
        param = product_id;
    } else {
        query = `SELECT AVG(rating) as avg_rating, COUNT(rating) as total FROM comments WHERE shop_id = ? AND rating IS NOT NULL`;
        param = shop_id;
    }

    db.get(query, [param], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            average: row.avg_rating ? Number(row.avg_rating).toFixed(1) : null,
            count: row.total
        });
    });
});


app.use('/', reserve_router);

app.use('/', shop_dashboard_router);

app.use('/', mail_update_router);

app.use('/', admin_router);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


