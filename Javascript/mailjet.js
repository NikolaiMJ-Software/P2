const Mailjet = require('mailjet');

const mailjet = new Mailjet({
  apiKey: '5e8ae89d0377d7b59192382e4f20e064',       // Replace with your API Key
  apiSecret: '889e420a58f6380d35228fafbc017ae5'  // Replace with your Secret Key
});
// Send an email
const sendEmail = async () => {
  try {
    const response = await mailjet.post("send").request({
      FromEmail: "ws10zl@student.aau.dk",
      FromName: "Your Name",
      Recipients: [
        {
          Email: "ws10zl@student.aau.dk",
          Name: "Recipient Name"
        }
      ],
      Subject: "Hello from Mailjet",
      'Text-part': "This is a test email from Mailjet using Node.js.",
      'Html-part': "<h3>Hello from Mailjet</h3><p>This is a test email.</p>"
    });
    console.log(response.body);
  } catch (error) {
    console.error(error);
  }
};

sendEmail();
