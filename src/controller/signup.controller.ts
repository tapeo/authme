import bcrypt from "bcrypt";
import crypto from "crypto";
import { Request, Response } from "express";
import { MongoServerError } from "mongodb";
import { MailerSendExtension } from "../extensions/mailersend.extension";
import { Telegram } from "../extensions/telegram.extension";
import { appConfig, OtpModel, PlunkExtension } from "../index";
import { setCookies } from "../libs/cookie";
import { encrypt } from "../libs/crypto";
import { generateAccessToken, generateRefreshToken } from "../libs/jwt";
import { OtpPurpose } from "../models/otp.model";
import { RefreshTokenService } from "../services/refresh-token.service";
import { UserService } from "../services/user.service";
import { User } from "../types/user";

export class SignupController {
  private static expiresAt = 10 * 60 * 1000;

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
      });
    }

    await OtpModel.deleteMany({
      email: sanitizedEmail,
      purpose: OtpPurpose.EMAIL_VERIFICATION,
      is_used: false,
    });

    const otp = this.generateOTP();

    const expires_at = new Date(Date.now() + this.expiresAt);

    await OtpModel.create({
      email: sanitizedEmail,
      otp,
      purpose: OtpPurpose.EMAIL_VERIFICATION,
      expires_at,
    });

    const subject = "Email Verification";
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Welcome to ${appConfig?.email?.name}!</p>
        
        <p>Your verification code is: <strong>${otp}</strong></p>
        
        <p>This code will expire in 10 minutes.</p>
        
        <p>Best regards,<br>${appConfig?.email?.name} Team</p>

        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          You received this email because you signed up for ${appConfig?.email?.name}. 
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `;

    try {
      if (appConfig?.email?.provider === "plunk") {
        await PlunkExtension.sendTransactional({
          from: appConfig?.email?.from,
          to: sanitizedEmail,
          subject: subject,
          apiKey: appConfig?.email?.plunk!.api_key,
          body: body,
        });
      } else {
        await MailerSendExtension.sendEmail({
          from: {
            email: appConfig?.email?.from,
            name: appConfig?.email?.name,
          },
          to: [
            {
              email: sanitizedEmail,
            },
          ],
          subject: subject,
          html: body,
          apiKey: appConfig?.email?.mailersend!.api_key,
        });
      }
    } catch {
      res
        .status(500)
        .jsonTyped({ status: "error", message: "Error in sending email" });
      return;
    }

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
      });
    }

    const otpDoc = await OtpModel.findOne({
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
      });
    }

    return await this.createUserAccount(sanitizedEmail, password, req, res);
  };

  public static signupAnonymousHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const randomEmail = `anon_${crypto
      .randomBytes(8)
      .toString("hex")}@anonymous.local`;
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const passwordEncrypted = await bcrypt.hash(randomPassword, 10);

    const user = await UserService.post(randomEmail, passwordEncrypted, true);

    if (!user) {
      return res.status(400).jsonTyped({
        status: "error",
        message: "Failed to create anonymous user, user not found",
      });
    }

    const accessToken = generateAccessToken(user._id!, randomEmail);
    const refreshToken = generateRefreshToken(user._id!, randomEmail);
    const encryptedRefreshToken = encrypt(refreshToken);

    const posted = await RefreshTokenService.post(
      user._id!,
      encryptedRefreshToken
    );
    if (!posted) {
      res
        .status(401)
        .json({ message: "Unauthorized, no refresh tokens can be posted" });
      return;
    }

    setCookies(accessToken, refreshToken, res);

    await Telegram.send({
      text: `New anonymous user registered on ${req.headers.host}`,
    });

    return res.status(200).jsonTyped({
      status: "success",
      message: "Anonymous registration successful",
      data: {
        id: user._id!,
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  };

  private static createUserAccount = async (
    email: string,
    password: string,
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const passwordEncrypted = await bcrypt.hash(password, 10);
      const sanitizedEmail = email.trim().toLowerCase();

      let user: User | null = null;
      let isAnonymous = false;

      const idUser = req.jwt?.user_id;
      if (idUser) {
        user = await UserService.getById(idUser);
        isAnonymous = user?.is_anonymous ?? false;
      }

      if (user?.is_anonymous === true) {
        user = await UserService.patch(user._id!, {
          email: sanitizedEmail,
          password: passwordEncrypted,
          is_anonymous: false,
        });
      } else {
        user = await UserService.post(
          sanitizedEmail,
          passwordEncrypted,
          false,
        );
      }

      if (!user) {
        return res.status(400).jsonTyped({
          status: "error",
          message: "Failed to create user, user not found",
        });
      }

      await Telegram.send({
        text: `New user registered: ${sanitizedEmail} on ${req.headers.host} ${isAnonymous ? " (anonymous)" : ""}`,
      });

      return res.status(200).jsonTyped({
        status: "success",
        message: "Registration successful, now you can login",
        data: {
          id: user._id!,
          merged_anonymous: isAnonymous,
        },
      });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        return res.status(400).jsonTyped({
          status: "error",
          message: "Email already in use",
        });
      } else {
        return res.status(500).jsonTyped({
          status: "error",
          message: "Failed to create user",
          data: error,
        });
      }
    }
  };

  private static generateOTP = (length: number = 6): string => {
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, "0");
  };
}
