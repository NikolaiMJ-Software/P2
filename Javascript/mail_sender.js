/*
document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("cart_button");
  
  if (!button) {
      console.error("Cart button not found!");
      return;
  }

  button.addEventListener("click", async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('id');

      if (!productId) {
          alert("Product ID not found!");
          return;
      }
      
      const buyerEmail = prompt("Skriv din email her:");

      if (!buyerEmail) {
          alert("Reservation annuleret. Email er nødvendig.");
          return;
      }

      try {
          const response = await fetch('/reserve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ buyer_email: buyerEmail, product_id: productId })
          });

          const data = await response.json();

          if (response.ok) {
              alert("Reservation fuldendt! tjek din email.");
          } else {
              alert("Error: " + data.error);
          }
      } catch (error) {
          console.error("Reservation fejlede:", error);
          alert("Reservation fejlede. Venligst prøv igen.");
      }
          */
  });
});







/*
const nodemailer = require('nodemailer'); // API that allows sending of Gmails
const sqlite3 = require('sqlite3').verbose(); //API for interacting with product database

const db = new sqlite3.Database('./databases/click_and_collect.db', (err) => {
  if(err){
      console.error('Error connecting to database', err.message);
  } else{
      console.log('Connected to SQLite database.')
  }
});
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id'); // Get product ID from URL

    if (!productId) {
        console.warn("No product ID found in URL. Using default ID: 1");
      //  productId = 1; // Default to product ID 1
    }
    

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

  //First get product data from database, with error handling
  db.get(`SELECT product_name FROM products WHERE id = ?`, [item_id], (err, row) => {
    if (err) {
        console.error('Error fetching product:', err.message);
        return;
    }
    if (!row) {
      console.log('No product found with id:', item_id);
      return;
    }

    //Send mail to both buyer and seller to inform of the reservation
    send_mail(
      buyer_email,
      'Reservation af vare på Click&Hent',
      'Varen du har reserveret er: ' + row.product_name
    );
    send_mail(
      seller_email,
      'En af dine varer er reserveret på Click&Hent',
      'Varen der er reserveret er: ' + row.product_name
    );
  });
}

//Work in progress for reservation through button
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
}*/