const sendEmail = require("./sendEmail");

const sendVerificationEmail = async ({ name, email, origin, token }) => {
  const verifyEmail = `${origin}/user/reset-password?token=${token}&email=${email}`;

  const message = `<p> Please reset password by clicking on the following link: <a href="${verifyEmail}">Reset Password</a> </p> `;

  return sendEmail({
    to: email,
    subject: "Reset Password",
    html: ` <h4>Hello, ${name}</h4> 
    ${message} `,
  });
};

module.exports = sendVerificationEmail;
