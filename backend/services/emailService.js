const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Send verification email
const sendVerificationEmail = async (email, token, name) => {
    const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;

    const mailOptions = {
        from: `"Cyber Kavach" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔥 Verify Your Email - Cyber Kavach',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a, #1e293b); color: #fff; border-radius: 10px;">
                <h2 style="color: #f97316;">Welcome to Cyber Kavach, ${name}! 🔥</h2>
                <p>Thank you for signing up. Please verify your email address to activate your account.</p>
                <a href="${verificationUrl}" style="display: inline-block; margin: 20px 0; padding: 15px 30px; background: linear-gradient(135deg, #f97316, #fbbf24); color: #000; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a>
                <p style="color: #94a3b8; font-size: 14px;">Or copy this link: ${verificationUrl}</p>
                <p style="color: #64748b; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

// Send password reset email
const sendPasswordResetEmail = async (email, token, name) => {
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

    const mailOptions = {
        from: `"Cyber Kavach" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔒 Reset Your Password - Cyber Kavach',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a, #1e293b); color: #fff; border-radius: 10px;">
                <h2 style="color: #f97316;">Password Reset Request</h2>
                <p>Hi ${name},</p>
                <p>You requested to reset your password. Click the button below to reset it:</p>
                <a href="${resetUrl}" style="display: inline-block; margin: 20px 0; padding: 15px 30px; background: linear-gradient(135deg, #ef4444, #b91c1c); color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
                <p style="color: #94a3b8; font-size: 14px;">Or copy this link: ${resetUrl}</p>
                <p style="color: #fbbf24; font-size: 14px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
                <p style="color: #64748b; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

// Send invoice email
const sendInvoiceEmail = async (email, invoice) => {
    const mailOptions = {
        from: `"Cyber Kavach" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `📄 Invoice for ${invoice.plan} Plan - Cyber Kavach`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0f172a, #1e293b); color: #fff; border-radius: 10px;">
                <h2 style="color: #22c55e;">Payment Successful! ✅</h2>
                <p>Thank you for your purchase!</p>
                
                <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #f97316; margin-top: 0;">Invoice Details</h3>
                    <p><strong>Plan:</strong> ${invoice.plan}</p>
                    <p><strong>Amount:</strong> ₹${invoice.amount}</p>
                    <p><strong>Payment ID:</strong> ${invoice.paymentId}</p>
                    <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
                </div>
                
                <p style="color: #94a3b8; font-size: 14px;">You can download your invoice from your dashboard.</p>
                <p style="color: #64748b; font-size: 12px; margin-top: 30px;">Thank you for choosing Cyber Kavach! 🔥</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendInvoiceEmail
};
