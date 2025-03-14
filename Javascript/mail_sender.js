const nodemailer = require('nodemailer'); // API that allows sending of Gmails

//Authenticate email
const transporter = nodemailer.createTransport({
  service: 'gmail', // This only works with Gmail
  auth: {
    user: 'alenjethegoat@gmail.com', // Gmail that sends the email
    pass: 'scww kkaq apgx ogvj', // Unique app password from email account
  },
});

// sent Gmail data
const mailOptions = {
  from: 'alenjethegoat@gmail.com', //should always be the same mail
  to: 'alenje@hotmail.com', //Reciever email
  subject: 'Hello from Gmail SMTP!', //Header for the mail
  text: 'This is a test email.', //Text within the mail
};

//Send email, and check for errors
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});