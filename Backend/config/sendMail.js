import nodemailer from "nodemailer"
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
    service: "Gmail",
    port: 465,
    secure: true,
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
    },
});

const sendMail = async(to, otp)=>{
    await transporter.sendMail({
        from: process.env.USER_EMAIL,
        to: to,
        subject: "Reset your Password",
        html: `<p> Your OTP for Password Reset is <b>${otp}</b>. It will expire in 5 minutes. </p>` //HTML BODY
    })
};

export default sendMail;
