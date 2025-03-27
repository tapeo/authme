import nodemailer from "nodemailer";

type Props = {
  from_email: string;
  to_email: string;
  subject: string;
  html: string;
};

const plunkSmtpConfig = {
  host: "smtp.useplunk.com",
  port: 465,
  auth: {
    user: "plunk",
    pass: process.env.PLUNK_API_KEY,
  },
};

const mailersendSmtpConfig = {
  host: "smtp.mailersend.net",
  port: 587,
  auth: {
    user: "MS_JgR7jg@ttclubmanager.com",
    pass: process.env.MAILERSEND_API_KEY,
  },
};
export class Email {
  public static send = async ({
    from_email,
    to_email,
    subject,
    html,
  }: Props) => {
    const config = plunkSmtpConfig.auth.pass
      ? plunkSmtpConfig
      : mailersendSmtpConfig;

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });

    try {
      await transporter.sendMail({
        from: from_email,
        to: to_email,
        subject: subject,
        html: html,
      });
    } catch (error: any) {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  };
}
