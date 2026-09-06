import nodemailer from "nodemailer";

const sendPasswordResetEmail = async (
    email,
    fullName,
    resetUrl
) => {
    const mode = process.env.RESET_EMAIL_MODE || "log";

    // ----------------------------------------
    // Development mode
    // ----------------------------------------

    if (mode === "log") {
        console.log("");
        console.log("========================================");
        console.log("PASSWORD RESET LINK");
        console.log("========================================");
        console.log(`User: ${fullName}`);
        console.log(`Email: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log("========================================");
        console.log("");

        return;
    }

    // ----------------------------------------
    // SMTP mode
    // ----------------------------------------

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "StockWell Password Reset",
        text: `
Hello ${fullName},

We received a request to reset your StockWell password.

Use the following link to choose a new password:

${resetUrl}

This link will expire in 30 minutes.

If you did not request this password reset, you can ignore this email.
        `.trim()
    });
};

export default sendPasswordResetEmail;