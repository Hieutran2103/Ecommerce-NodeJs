const nodemailer = require("nodemailer");

const nodemailerConfig = require("./nodemailerCondfig");

const sendEmail = async ({ to, subject, html }) => {
  let testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport(nodemailerConfig);

  return transporter.sendMail({
    from: '"Shop comfy 👻" <tthieu.dhti15a11hn@sv.uneti.edu.vn>', // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    html: html, // html body
  });
};

module.exports = sendEmail;
