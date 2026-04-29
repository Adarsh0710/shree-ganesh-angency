import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

export async function sendInvoiceEmail({ to, subject, text, pdfBuffer, filename = 'tax-invoice.pdf' }) {
  const t = getTransporter();
  if (!t) {
    return { sent: false, error: 'SMTP not configured' };
  }
  const from = process.env.EMAIL_FROM || 'noreply@local';
  try {
    await t.sendMail({
      from,
      to,
      subject: subject || 'Your Tax Invoice',
      text: text || 'Please find your invoice attached.',
      attachments: [{ filename, content: pdfBuffer }],
    });
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e.message };
  }
}
