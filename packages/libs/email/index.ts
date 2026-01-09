import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

// SMTP transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  service: process.env.SMTP_SERVICE,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Renders an EJS email template with provided data
 * @param templateName - Name of the template file (without .ejs extension)
 * @param data - Data to be injected into the template
 * @returns Rendered HTML string
 */
const renderEmailTemplate = async (
  templateName: string,
  data: Record<string, any>
): Promise<string> => {
  const templatePath = path.join(
    process.cwd(),
    'packages',
    'libs',
    'email',
    'templates',
    `${templateName}.ejs`
  );

  return ejs.renderFile(templatePath, data);
};

/**
 * Sends an email using Nodemailer with EJS template rendering
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param templateName - Name of the EJS template to use
 * @param data - Data to be injected into the template
 * @returns Promise<boolean> - True if email sent successfully
 */
export const sendEmail = async (
  to: string,
  subject: string,
  templateName: string,
  data: Record<string, any>
): Promise<boolean> => {
  try {
    const html = await renderEmailTemplate(templateName, data);

    await transporter.sendMail({
      from: `Eshop <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};
