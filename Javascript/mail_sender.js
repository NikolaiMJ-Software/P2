const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'alenjethegoat@gmail.com',
    pass: 'Thu94qwm', // Use App Password, NOT your normal password
  },
});

const mailOptions = {
  from: 'alenjethegoat@gmail.com',
  to: 'alenje@hotmail.com',
  subject: 'Hello from Gmail SMTP!',
  text: 'This is a test email.',
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});