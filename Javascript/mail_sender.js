const nodemailer = require('nodemailer'); // API that allows sending of Gmails
const sqlite3 = require('sqlite3').verbose(); //API for interacting with product database

const db = new sqlite3.Database('./databases/click_and_collect.db', (err) => {
  if(err){
      console.error('Error connecting to database', err.message);
  } else{
      console.log('Connected to SQLite database.')
  }
});

//Authenticate email
const transporter = nodemailer.createTransport({
  service: 'gmail', // This only works with Gmail
  auth: {
    user: 'clickoghent@gmail.com', // Gmail that sends the email
    pass: 'cfzv uket bqei kkkw', // Unique app password for Gmail account
  },
});

// sent Gmail data
let mailOptions = {
  from: 'clickoghent@gmail.com', //should always be the same mail
  to: '', //Reciever email
  subject: '', //Header for the mail
  text: '', //Text within the mail
};

//Send email with custom data
function send_mail(receiver, subject, text) {
  //Input custom data into email dataset
  mailOptions.to = receiver;
  mailOptions.subject = subject;
  mailOptions.text = text;
  //Send email, and check for error
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

//Mail system for item reservations
function reservation_mails(buyer_email, seller_email, item_id){
  db.get(`SELECT product_name FROM products WHERE id = ?`, [item_id], (err, row) => {
    if (err) {
        console.error('Error fetching product:', err.message);
        return;
    }
    if (!row) {
      console.log('No product found with id:', item_id);
      return;
    }

  const product_name = row.product_name;


    send_mail(
      buyer_email,
      'Reservation af vare på Click&Hent',
      'Varen du har reserveret er:' + product_name
    );
    send_mail(
      seller_email,
      'En af dine varer er reserveret på Click&Hent',
      'Varen der er reserveret er:' + product_name
    );
  });
}
reservation_mails('nikolai456654@gmail.com', 'nikolai456654@gmail.com', 1);