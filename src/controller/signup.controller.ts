import { Email } from "@/extensions/email.extension";
import { Telegram } from "@/extensions/telegram.extension";
import otpModel, { OtpPurpose } from "@/model/otp.model";
import { UserService } from "@/services/user.service";
import bcrypt from "bcrypt";
import { Request, Response } from "express";

export class SignupController {
  private static expiresAt = 10 * 60 * 1000;

  private static emailFrom = process.env.EMAIL_FROM!;
  private static emailSubject = process.env.EMAIL_SUBJECT!;
  private static emailName = process.env.EMAIL_NAME!;

  public static sendEmailVerificationHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { email } = req.body;

    const sanitizedEmail = email.trim().toLowerCase();

    if (!sanitizedEmail) {
      return res.status(400).jsonTyped({
        status: "error",
        message: "Email is required",
        data: null,
      });
    }

    await otpModel.deleteMany({
      email: sanitizedEmail,
      purpose: OtpPurpose.EMAIL_VERIFICATION,
      is_used: false,
    });

    const otp = this.generateOTP();

    const expires_at = new Date(Date.now() + this.expiresAt);

    await otpModel.create({
      email: sanitizedEmail,
      otp,
      purpose: OtpPurpose.EMAIL_VERIFICATION,
      expires_at,
    });

    await Email.send({
      from_email: this.emailFrom,
      to_email: sanitizedEmail,
      subject: this.emailSubject,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Welcome to ${this.emailName}!</p>
        
        <p>Your verification code is: <strong>${otp}</strong></p>
        
        <p>This code will expire in 10 minutes.</p>
        
        <p>Best regards,<br>${this.emailName} Team</p>

        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          You received this email because you signed up for ${this.emailName}. 
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
    });

    return res.status(200).jsonTyped({
      status: "success",
      message: "OTP sent successfully",
    });
  };

  public static signupWithVerificationHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { email, password, otp } = req.body;

    if (!email || !password || !otp) {
      return res.status(400).jsonTyped({
        status: "error",
        message: "Email, password and OTP are required",
        data: null,
      });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    const isValidEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    if (!isValidEmail(sanitizedEmail)) {
      return res.status(400).jsonTyped({
        status: "error",
        message: "Invalid email",
        data: null,
      });
    }

    const otpDoc = await otpModel.findOne({
      email: sanitizedEmail,
      otp,
      purpose: OtpPurpose.EMAIL_VERIFICATION,
      is_used: false,
      expires_at: { $gt: new Date() },
    });

    if (!otpDoc) {
      return res.status(400).jsonTyped({
        status: "error",
        message: "Invalid or expired OTP",
        data: null,
      });
    }

    otpDoc.is_used = true;
    await otpDoc.save();

    return await this.createUserAccount(sanitizedEmail, password, req, res);
  };

  public static signupWithoutVerificationHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).jsonTyped({
        status: "error",
        message: "Email and password are required",
        data: null,
      });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    const isValidEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    if (!isValidEmail(sanitizedEmail)) {
      return res.status(400).jsonTyped({
        status: "error",
        message: "Invalid email",
        data: null,
      });
    }

    return await this.createUserAccount(sanitizedEmail, password, req, res);
  };

  private static createUserAccount = async (
    email: string,
    password: string,
    req: Request,
    res: Response
  ): Promise<void> => {
    const passwordEncrypted = await bcrypt.hash(password, 10);

    const sanitizedEmail = email.trim().toLowerCase();

    try {
      const user = await UserService.post(sanitizedEmail, passwordEncrypted);

      await Telegram.send({
        text: `New user registered: ${sanitizedEmail} on ${req.headers.host}`,
      });

      return res.status(200).jsonTyped({
        status: "success",
        message: "Registration successful, now you can login",
        data: {
          id: user.id,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(500).jsonTyped({
        status: "error",
        message: (error as Error).message,
        data: null,
      });
    }
  };

  private static generateOTP = (length: number = 6): string => {
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, "0");
  };
}
