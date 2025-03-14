const nodemailer = require('nodemailer'); // API that allows sending of Gmails

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
  send_mail(
    buyer_email,
    'Reservation af vare på Click&Hent',
    item_id
  );
  send_mail(
    seller_email,
    'En af dine varer er reserveret på Click&Hent',
    item_id
  );
}