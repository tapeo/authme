import { Email } from "@/extensions/email.extension";
import { Telegram } from "@/extensions/telegram.extension";
import { setCookies } from "@/libs/cookie";
import { encrypt } from "@/libs/crypto";
import { generateAccessToken, generateRefreshToken } from "@/libs/jwt";
import otpModel, { OtpPurpose } from "@/model/otp.model";
import { RefreshTokenService } from "@/services/refresh-token.service";
import { UserService } from "@/services/user.service";
import bcrypt from "bcrypt";
import crypto from "crypto";
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

  public static signupAnonymousHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const randomEmail = `anon_${crypto
        .randomBytes(8)
        .toString("hex")}@anonymous.local`;
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const passwordEncrypted = await bcrypt.hash(randomPassword, 10);

      const user = await UserService.post(randomEmail, passwordEncrypted, true);

      const accessToken = generateAccessToken(user.id.toString(), randomEmail);
      const refreshToken = generateRefreshToken(
        user.id.toString(),
        randomEmail
      );
      const encryptedRefreshToken = encrypt(refreshToken);

      await RefreshTokenService.post(user.id, encryptedRefreshToken);
      setCookies(accessToken, refreshToken, res);

      await Telegram.send({
        text: `New anonymous user registered on ${req.headers.host}`,
      });

      return res.status(200).jsonTyped({
        status: "success",
        message: "Anonymous registration successful",
        data: {
          id: user.id,
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      });
    } catch (error) {
      console.error("Anonymous signup error:", error);
      return res.status(500).jsonTyped({
        status: "error",
        message: (error as Error).message,
        data: null,
      });
    }
  };

  public static mergeAnonymousAccountHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { email, password } = req.body;
      const idUser = req.headers.id_user as string;
      const jwtEmail = req.headers.email as string;

      if (!idUser || !jwtEmail) {
        return res.status(401).jsonTyped({
          status: "error",
          message: "Unauthorized",
          data: null,
        });
      }

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

      const existingUser = await UserService.getUserByEmail(sanitizedEmail);
      if (existingUser) {
        return res.status(400).jsonTyped({
          status: "error",
          message: "Email already in use",
          data: null,
        });
      }

      const anonymousUser = await UserService.getById(idUser);
      if (!anonymousUser) {
        return res.status(404).jsonTyped({
          status: "error",
          message: "User not found",
          data: null,
        });
      }

      if (!anonymousUser.is_anonymous) {
        return res.status(400).jsonTyped({
          status: "error",
          message: "Only anonymous accounts can be merged",
          data: null,
        });
      }

      if (anonymousUser.email !== jwtEmail) {
        return res.status(401).jsonTyped({
          status: "error",
          message: "You can only merge your own anonymous account",
          data: null,
        });
      }

      const passwordEncrypted = await bcrypt.hash(password, 10);

      await UserService.patch(idUser, {
        email: sanitizedEmail,
        password: passwordEncrypted,
        is_anonymous: false,
      });

      const accessToken = generateAccessToken(idUser, sanitizedEmail);
      const refreshToken = generateRefreshToken(idUser, sanitizedEmail);
      const encryptedRefreshToken = encrypt(refreshToken);

      await RefreshTokenService.post(idUser, encryptedRefreshToken);
      setCookies(accessToken, refreshToken, res);

      await Telegram.send({
        text: `Anonymous user merged to regular account: ${sanitizedEmail} on ${req.headers.host}`,
      });

      return res.status(200).jsonTyped({
        status: "success",
        message: "Account merged successfully",
        data: {
          id: idUser,
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      });
    } catch (error) {
      console.error("Account merge error:", error);
      return res.status(500).jsonTyped({
        status: "error",
        message: (error as Error).message,
        data: null,
      });
    }
  };

  private static createUserAccount = async (
    email: string,
    password: string,
    req: Request,
    res: Response,
    isAnonymous: boolean = false
  ): Promise<void> => {
    const passwordEncrypted = await bcrypt.hash(password, 10);
    const sanitizedEmail = email.trim().toLowerCase();

    try {
      const user = await UserService.post(
        sanitizedEmail,
        passwordEncrypted,
        isAnonymous
      );

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
