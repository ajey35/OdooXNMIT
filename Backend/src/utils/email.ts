// utils/email.ts
import nodemailer from 'nodemailer';


// Create transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',         // e.g., smtp.gmail.com
  port: Number(587), // 587
  secure: false,                        // TLS
  auth: {
    user: 'adithyasy15@gmail.com',
    pass: 'bfzf wuas fqin zshk'
  }
});

/**
 * Send OTP email
 * @param to - recipient email
 * @param otp - 6-digit OTP
 */
export const sendOTPEmail = async (to: string, otp: string) => {
  const mailOptions = {
    from: `"Your App Name" <${'adithyasy15@gmail.com'}>`,
    to,
    subject: 'Your OTP for Password Reset',
    html: `
      <p>Hello,</p>
      <p>Your OTP for password reset is: <b>${otp}</b></p>
      <p>This OTP is valid for 10 minutes.</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.response);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};