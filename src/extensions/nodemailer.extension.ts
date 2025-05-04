import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export interface NodemailerParams {
  senderEmail: string;
  senderName: string;
  to: string[];
  subject: string;
  html: string;
  smtpTransport: SMTPTransport;
}

export class NodemailerExtension {
  static async send(nodemailerParams: NodemailerParams) {
    const { senderEmail, senderName, to, subject, html } = nodemailerParams;

    const transporter = nodemailer.createTransport(nodemailerParams.smtpTransport);

    const result: SMTPTransport.SentMessageInfo = await transporter.sendMail({
      from: `${senderName} <${senderEmail}>`,
      sender: senderEmail,
      to: to,
      subject: subject,
      html: html,
    });

    return result;
  }
}