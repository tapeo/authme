import bcrypt from "bcrypt";
import crypto from "crypto";
import { Request, Response } from "express";
import { MailerSendExtension } from "../extensions/mailersend.extension";
import { PlunkExtension } from "../extensions/plunk.extension";
import { appConfig, BaseUserModel } from "../index";

export class PasswordController {
  public static forgotPasswordHandler = async (req: Request, res: Response) => {
    const { email } = req.body;

    const sanitizedEmail = email.trim().toLowerCase();

    const user = await BaseUserModel.findOne({ email: sanitizedEmail });
    if (!user) {
      return res
        .status(404)
        .jsonTyped({ status: "success", message: "User not found" });
    }

    const token = crypto.randomBytes(20).toString("hex");

    user.reset_password_token = token;
    user.reset_password_expires = new Date(Date.now() + 3600000);

    await user.save();

    const subject = "Password Reset Request";
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Hello,</p>
        
        <p>A password reset was requested for your account.</p>
        
        <p><a href="https://${req.headers.host}/auth/password/reset/${token}" 
              style="color: #007bff;">Click here to reset your password</a></p>
        
        <p>This link will expire in 1 hour.</p>
        
        <p>If you didn't request this password reset, please ignore this email.</p>
        
        <p>Best regards,<br>${appConfig?.email?.name} Team</p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          You received this email because a password reset was requested for your account. 
          If you didn't make this request, you can safely ignore this email.
        </p>
      </div>
    `;

    try {
      if (appConfig?.email?.provider === "plunk") {
        await PlunkExtension.sendTransactional({
          from: appConfig?.email?.from,
          to: user.email,
          subject: subject,
          apiKey: appConfig?.email?.plunk!.api_key,
          body: body,
        });
      } else {
        await MailerSendExtension.sendEmail({
          from: {
            name: appConfig?.email?.name,
            email: appConfig?.email?.from,
          },
          to: [
            {
              email: user.email,
            },
          ],
          subject: subject,
          apiKey: appConfig?.email?.mailersend!.api_key,
          html: body,
        });
      }
    } catch {
      res
        .status(500)
        .jsonTyped({ status: "error", message: "Error in sending email" });
      return;
    }

    res
      .status(200)
      .jsonTyped({ status: "success", message: "Password reset email sent" });
  };

  public static tokenPasswordHandler = async (req: Request, res: Response) => {
    try {
      const user = await BaseUserModel.findOne({
        reset_password_token: req.params.token,
        reset_password_expires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).jsonTyped({
          status: "error",
          message: "Password reset token is invalid or has expired",
        });
      }

      res.redirect(`/auth/reset-password.html?token=${req.params.token}`);
    } catch {
      res
        .status(500)
        .jsonTyped({ status: "error", message: "Error in validating token" });
    }
  };

  public static updatePasswordHandler = async (req: Request, res: Response) => {
    const { token } = req.body;

    const user = await BaseUserModel.findOne({
      reset_password_token: token,
      reset_password_expires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).jsonTyped({
        status: "error",
        message: "Password reset token is invalid or has expired",
      });
    }

    const { password, confirm_password } = req.body;

    if (password !== confirm_password) {
      return res.status(400).jsonTyped({
        status: "error",
        message: "Passwords do not match",
      });
    }

    const passwordEncrypted = await bcrypt.hash(password, 10);

    user.password = passwordEncrypted;
    user.reset_password_token = null;
    user.reset_password_expires = null;

    await user.save();

    res
      .status(200)
      .jsonTyped({ status: "success", message: "Password has been updated" });
  };
}
