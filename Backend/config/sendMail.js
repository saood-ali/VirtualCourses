import SibApiV3Sdk from 'sib-api-v3-sdk';
import dotenv from "dotenv";
dotenv.config();

let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendMail = async (to, otp) => {
    try {
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        
        sendSmtpEmail.subject = "Password Reset Request - VirtualCourses";
        sendSmtpEmail.htmlContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #E5E7EB; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #111111; margin: 0; font-size: 24px; letter-spacing: -0.5px;">VirtualCourses</h1>
                    <p style="color: #FFD400; font-weight: 700; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Account Security</p>
                </div>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hello,</p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">We received a request to reset the password for your VirtualCourses account. Please use the following secure One-Time Password (OTP) to proceed:</p>
                
                <div style="background-color: #F8F9FA; border: 1px solid #E5E7EB; padding: 24px; border-radius: 8px; text-align: center; margin: 32px 0;">
                    <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #111111; margin-left: 12px;">${otp}</span>
                </div>
                
                <p style="color: #4B5563; font-size: 14px; line-height: 1.5; background-color: #FEF3C7; padding: 12px 16px; border-radius: 6px; border-left: 4px solid #F59E0B;">
                    <strong>Security Notice:</strong> This OTP is valid for exactly <strong>5 minutes</strong>. For your protection, never share this code with anyone.
                </p>
                
                <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 24px;">If you did not request a password reset, no action is required and your account remains secure. You can safely ignore this email.</p>
                
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 40px 0 20px 0;" />
                
                <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">&copy; ${new Date().getFullYear()} VirtualCourses. Empowering educators and learners through AI.</p>
            </div>
        `;
        
        // Brevo requires the sender to be a verified email in your Brevo account
        sendSmtpEmail.sender = { "name": "VirtualCourses", "email": process.env.USER_EMAIL };
        sendSmtpEmail.to = [
          { "email": to, "name": "User" }
        ];

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return data;
    } catch (err) {
        console.error("Email Error:", err);
        throw err;
    }
};

export default sendMail;
