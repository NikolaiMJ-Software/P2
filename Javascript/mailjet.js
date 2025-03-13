import { Resend } from 'resend';

const resend = new Resend('your-api-key-here'); // Replace with your API key

const sendEmail = async () => {
  try {
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use this for testing
      to: ['your-email@example.com'], // Replace with your recipient
      subject: 'Hello from Resend!',
      text: 'This is a test email sent using Resend API.',
    });

    console.log('Email sent:', response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

sendEmail();