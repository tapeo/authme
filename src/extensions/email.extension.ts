import nodemailer from "nodemailer";

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
    const transporter = nodemailer.createTransport({
      host: "smtp.useplunk.com",
      port: 465,
      auth: {
        user: "plunk",
        pass: process.env.PLUNK_API_KEY,
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
