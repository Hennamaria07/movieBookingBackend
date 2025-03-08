import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Function to send the reset password email
export const sendResetEmail = async (email: string, resetToken: string) => {
  try {
    // Create a transporter object using SMTP
    const transporter = nodemailer.createTransport({
      service: "Gmail", // You can change this to your SMTP provider
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
      },
    });

    // Construct the reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Email options
    const mailOptions = {
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h3>Password Reset Request</h3>
        <p>You have requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetUrl}" target="_blank" style="color: blue; text-decoration: none;">Reset Password</a>
        <p>This link is valid for 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Password reset email sent successfully" };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send reset email");
  }
};
