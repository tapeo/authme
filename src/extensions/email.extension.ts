import nodemailer from "nodemailer";
import { appConfig } from "..";

type Props = {
  from_email: string;
  to_email: string;
  subject: string;
  html: string;
};

export class Email {
  public static send = async ({
    from_email,
    to_email,
    subject,
    html,
  }: Props) => {
    const plunkSmtpConfig = {
      host: "smtp.useplunk.com",
      port: 465,
      auth: {
        user: appConfig.email.plunk?.user,
        pass: appConfig.email.plunk?.pass,
      },
    };

    const mailersendSmtpConfig = {
      host: "smtp.mailersend.net",
      port: 587,
      auth: {
        user: appConfig.email.mailersend?.user,
        pass: appConfig.email.mailersend?.pass,
      },
    };

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
