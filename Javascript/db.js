import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// 👇 Convert import.meta.url to __filename and __dirname equivalents
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        latitude REAL,
        longitude REAL,
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
    parent_id INTEGER,
    FOREIGN KEY(shop_id) REFERENCES shops(id),
    FOREIGN KEY(city_id) REFERENCES cities(id),
    FOREIGN KEY(parent_id) REFERENCES products(id)
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
            password TEXT,
            shop_id INTEGER,
            FOREIGN KEY(shop_id) REFERENCES shops(id)
        )`, (err) => {
            if (err) console.error("Error creating table:", err.message);
            else console.log("Table 'users' created.");
        });


        db.run(`INSERT INTO shops (shop_name, city_id, img_path, email, latitude, longitude) VALUES
            ('Måneby', '1', 'Images/Aalborg/Måneby/månebylogo.jpg', 'nikolai456654@gmail.com', 57.04543062584897, 9.898746177297006),
            ('jerrys vare', '1', 'Images/Aalborg/jerrys_vare/jerry_logo.png', 'nikolai456654@gmail.com', 57.04875183105469,9.921673774719238)`, (err) => {
                if (err) console.error('Error inserting data:', err.message);
                else console.log('Shop inserted.');
            });
            db.run(`INSERT INTO users (email, name, password, shop_id) VALUES
                ('sspg.dk@gmail.com', 'Sebastian', '123', 2)`, (err) => {
                    if (err) console.error('Error inserting data:', err.message);
                    else console.log('Users inserted.');
                });
        db.run(`INSERT INTO products (city_id, shop_id, product_name, stock, price, description, img1_path, img2_path, img3_path, img4_path, specifications, discount, parent_id) 
            VALUES
            (1, 1, 'den grimme maskine (hvid)', 10, 25, 'Den er grim', 'Images/Aalborg/Måneby/Sage_Joracle_Jet_espressomaskine/dv_web_D18000128322083.png', 'Images/Aalborg/Måneby/Sage_Joracle_Jet_espressomaskine/dv_web_D18000128321829.png',
            'Images/Aalborg/Måneby/Sage_Joracle_Jet_espressomaskine/dv_web_D18000128321826.png', 'Images/Aalborg/Måneby/Sage_Joracle_Jet_espressomaskine/dv_web_D18000128321831.png', 'Den er faktisk virkelig grim', 30, NULL),
                (1, 1, 'den grimme maskine (sort)', 6, 25, 'Den er grim', 'Images/Aalborg/Måneby/Sage_Joracle_Jet_espressomaskine/variant_1/dv_web_D18000128322066.png', 'Images/Aalborg/Måneby/Sage_Joracle_Jet_espressomaskine/variant_1/dv_web_D18000128321832.png',
                'Images/Aalborg/Måneby/Sage_Joracle_Jet_espressomaskine/variant_1/dv_web_D18000128321830.png', '', 'Den er faktisk virkelig grim', 30, 1),
        
            
            (1, 2, 'Eiffeltårnet', 1, 1000900, 'Du skal selv hente den', 'Images/Aalborg/jerrys_vare/Eiffeltårnet/Eiffel1.jpg', 'Images/Aalborg/jerrys_vare/Eiffeltårnet/Eiffel2.webp',
            'Images/Aalborg/jerrys_vare/Eiffeltårnet/Eiffel3.jpg', 'Images/Aalborg/jerrys_vare/Eiffeltårnet/Eiffel4.webp', 'Den er virkelig høj, og lavet af franskmænd', 0, NULL),
            
            (1, 1, 'Samsung Galaxy S25 Ultra 5G smartphone (Titanium Black)', 100, 9499, 'Denne Samsung Galaxy S25 Ultra 5G smarphone er fyldt med banebrydende teknologier og AI, hvilket vil løfte din mobil-oplevelse. Den har en 6,9" Dynamic AMOLED 2x-skærm, en Snapdragon Elite 8-processor og et 200MP hovedkamera',
            'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/titanium_black1.png', 'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/titanium_black2.png', 'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/titanium_black3.png',
            'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/titanium_black4.png', '6.9" QHD+ Dynamic AMOLED-skærm, 200+50+50+10 MP kamerasystem 5.000mAh batteri, trådløs opladning', 0, NULL),

                (1, 1, 'Samsung Galaxy S25 Ultra 5G smartphone (Titanium Blue)', 43, 9499, 'Denne Samsung Galaxy S25 Ultra 5G smarphone er fyldt med banebrydende teknologier og AI, hvilket vil løfte din mobil-oplevelse. Den har en 6,9" Dynamic AMOLED 2x-skærm, en Snapdragon Elite 8-processor og et 200MP hovedkamera',
                'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/variant_titanium_blue/titanium_blue1.png', 'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/variant_titanium_blue/titanium_blue2.png', 'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/variant_titanium_blue/titanium_blue3.png',
                'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/titanium_black4.png', '6.9" QHD+ Dynamic AMOLED-skærm, 200+50+50+10 MP kamerasystem 5.000mAh batteri, trådløs opladning', 0, 4),
            
                (1, 1, 'Samsung Galaxy S25 Ultra 5G smartphone (Titanium Gray)', 23, 9499, 'Denne Samsung Galaxy S25 Ultra 5G smarphone er fyldt med banebrydende teknologier og AI, hvilket vil løfte din mobil-oplevelse. Den har en 6,9" Dynamic AMOLED 2x-skærm, en Snapdragon Elite 8-processor og et 200MP hovedkamera',
                'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/variant_titanium_gray/titanium_gray1.png', 'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/variant_titanium_gray/titanium_gray2.png', 'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/variant_titanium_gray/titanium_gray3.png',
                'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/titanium_black4.png', '6.9" QHD+ Dynamic AMOLED-skærm, 200+50+50+10 MP kamerasystem 5.000mAh batteri, trådløs opladning', 0, 4),
                
                (1, 1, 'Samsung Galaxy S25 Ultra 5G smartphone (Titanium Gray)', 93, 9499, 'Denne Samsung Galaxy S25 Ultra 5G smarphone er fyldt med banebrydende teknologier og AI, hvilket vil løfte din mobil-oplevelse. Den har en 6,9" Dynamic AMOLED 2x-skærm, en Snapdragon Elite 8-processor og et 200MP hovedkamera',
                'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/variant_titanium_silver/titanium_silver1.png', 'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/variant_titanium_silver/titanium_silver2.png', 'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/variant_titanium_silver/titanium_silver3.png',
                'Images/Aalborg/Måneby/Samsung_Galaxy_S25_Ultra_5G_smartphone_(Titanium Black)/titanium_black4.png', '6.9" QHD+ Dynamic AMOLED-skærm, 200+50+50+10 MP kamerasystem 5.000mAh batteri, trådløs opladning', 0, 4)`, (err) => {
                if (err) console.error('Error inserting data:', err.message);
                else console.log('product inserted.');
            });
        db.run(`CREATE INDEX idx_shops_city ON shops(city_id);`);
        db.run(`CREATE INDEX idx_products_shop ON products(shop_id);`);
});

db.close();