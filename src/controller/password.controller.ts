import { Email } from "@/extensions/email.extension";
import { User } from "@/model/user.model";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Request, Response } from "express";

export class PasswordController {
  private static fromEmail: string = process.env.EMAIL_FROM!;
  private static subject: string = process.env.EMAIL_SUBJECT!;
  private static emailName: string = process.env.EMAIL_NAME!;

  public static forgotPasswordHandler = async (req: Request, res: Response) => {
    const { email } = req.body;

    const sanitizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      return res
        .status(404)
        .jsonTyped({ status: "success", message: "User not found" });
    }

    const token = crypto.randomBytes(20).toString("hex");

    user.reset_password_token = token;
    user.reset_password_expires = new Date(Date.now() + 3600000);

    await user.save();

    await Email.send({
      from_email: this.fromEmail,
      to_email: user.email,
      subject: this.subject,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Hello,</p>
        
        <p>A password reset was requested for your account.</p>
        
        <p><a href="https://${req.headers.host}/auth/password/reset/${token}" 
              style="color: #007bff;">Click here to reset your password</a></p>
        
        <p>This link will expire in 1 hour.</p>
        
        <p>If you didn't request this password reset, please ignore this email.</p>
        
        <p>Best regards,<br>${this.emailName} Team</p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          You received this email because a password reset was requested for your account. 
          If you didn't make this request, you can safely ignore this email.
        </p>
      </div>
    `,
    });

    res
      .status(200)
      .jsonTyped({ status: "success", message: "Password reset email sent" });
  };

  public static tokenPasswordHandler = async (req: Request, res: Response) => {
    try {
      const user = await User.findOne({
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
    try {
      const { token } = req.body;

      const user = await User.findOne({
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
    } catch {
      res.status(500).jsonTyped({
        status: "error",
        message: "Error in updating password",
      });
    }
  };
}
