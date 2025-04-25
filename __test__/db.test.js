import sqlite3 from 'sqlite3';

let db;

beforeEach((done) => {

  db = new sqlite3.Database(':memory:');
  
  // Setup your schema here
  db.run(`
    CREATE TABLE cities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city TEXT UNIQUE,
        image_path TEXT,
        latitude REAL,
        longitude REAL
    )
  `, done);
});

afterEach((done) => {
  // Close the DB after each test
  db.close(done);
});

test('should insert and retrieve a user', (done) => {
  const city = 'Aalborg';
  const image_path = 'images/Aalborg/test';
  const latitude = 12.1;
  const longitude = 5;
  
  db.run('INSERT INTO cities (city, image_path, latitude, longitude) VALUES (?, ?, ?, ?)', [city, image_path, latitude, longitude], function(err) {
    expect(err).toBeNull();
    
    db.get('SELECT * FROM cities WHERE city = ?', [city], (err, row) => {
      expect(err).toBeNull();
      expect(row.city).toBe(city);
      expect(row.image_path).toBe(image_path);
      expect(row.latitude).not.toBe(longitude);
      expect(row.longitude).not.toBe(latitude);
      done();
    });
  });
});
