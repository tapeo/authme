import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { clearCookies, setCookies } from "../libs/cookie";
import { encrypt } from "../libs/crypto";
import { generateAccessToken, generateRefreshToken } from "../libs/jwt";
import { RefreshTokenService } from "../services/refresh-token.service";
import { UserService } from "../services/user.service";

export class LoginController {
  public static login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const sanitizedEmail = email.trim().toLowerCase();

    if (!this.isValidEmail(sanitizedEmail)) {
      res.status(400).json({ message: "Invalid email" });
      return;
    }

    const user = await UserService.getUserByEmail(sanitizedEmail);

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      const accessToken = generateAccessToken(
        user._id.toString(),
        sanitizedEmail
      );
      const refreshToken = generateRefreshToken(
        user._id.toString(),
        sanitizedEmail
      );

      const encryptedRefreshToken = encrypt(refreshToken);

      const posted = await RefreshTokenService.post(
        user._id.toString(),
        encryptedRefreshToken
      );

      if (!posted) {
        res
          .status(401)
          .json({ message: "Unauthorized, no refresh tokens can be posted" });
        return;
      }

      setCookies(accessToken, refreshToken, res);

      res.json({
        message: "Login successful, tokens saved as httpOnly cookie",
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } else {
      res.status(401).json({ message: "Invalid password" });
    }
  };

  public static logout = async (req: Request, res: Response) => {
    clearCookies(res);
    res.json({ message: "Logout successful" });
  };

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
