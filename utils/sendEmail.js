const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config({path : "../config/config.env"})

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service : process.env.service ,
        auth : {
            user : process.env.user,
            pass : process.env.password
        }
    })

    const mailoption = {
        from : process.env.user,
        to : options.email,
        subject : options.subject,
        text : options.message,
    }

    await transporter.sendMail(mailoption);
}

module.exports = sendEmail;