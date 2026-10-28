import nodemailer from 'nodemailer';

export const sendEmail = async (
  to: string, 
  subject: string, 
  text: string,
  attachments?: any[]
) => {
  const transporter = nodemailer.createTransport({
    host: process.env.OUTLOOK_HOST,
    port: Number(process.env.OUTLOOK_PORT),
    secure: true,
    auth: {
      user: process.env.OUTLOOK_EMAIL,
      pass: process.env.OUTLOOK_PASSWORD,
    },
    tls: { rejectUnauthorized: true },
  });

  await transporter.sendMail({
    to,
    from: process.env.OUTLOOK_EMAIL,
    subject,
    text,
    attachments,
  });
};