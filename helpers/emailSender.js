import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = (function createTransporter() {
  try {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    }

    if (process.env.SENDER_EMAIL && process.env.SENDER_PASSWORD) {
      return nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.SENDER_EMAIL,
          pass: process.env.SENDER_PASSWORD,
        },
      });
    }

    console.warn(
      "No SMTP configuration found (SMTP_HOST or SENDER_EMAIL). Email sending will be disabled."
    );
    return {
      sendMail: async () => {
        throw new Error("No SMTP configuration");
      },
    };
  } catch (err) {
    console.warn("Failed to create transporter:", err?.message || err);
    return {
      sendMail: async () => {
        throw err;
      },
    };
  }
})();

export const sendStatusUpdateEmail = async (email, name, status, serviceId) => {
  if (!email) {
    console.warn("sendStatusUpdateEmail called without email");
    return null;
  }

  const mailOptions = {
    from: process.env.SENDER_EMAIL || process.env.SMTP_USER,
    to: email,
    subject: `Your Service #${serviceId} Status Updated`,
    html: `
      <p>Dear ${name || "Customer"},</p>
      <p>We wanted to inform you that the status of your Service <strong>#${serviceId}</strong> has been updated to:</p>
      <h3 style="color: #007bff;">${String(status).toUpperCase()}</h3>
      ${
        status === "completed"
          ? "<p>Thank you for using our services. Your Service has been completed successfully!</p>"
          : "<p>You will be notified as it progresses further.</p>"
      }
      <br/>
      <p>Regards,<br/>Your Store Team</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Status update email sent:", info?.response || info);
    return info;
  } catch (err) {
    console.warn("Error sending status update email:", err?.message || err);
    return null;
  }
};
