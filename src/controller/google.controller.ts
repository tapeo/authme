import bcrypt from "bcrypt";
import crypto from "crypto";
import { Request, Response } from "express";
import { Telegram } from "../extensions/telegram.extension";
import { setCookies } from "../libs/cookie";
import { encrypt } from "../libs/crypto";
import { generateAccessToken, generateRefreshToken } from "../libs/jwt";
import { OAuthStateService } from "../services/oauth-state.service";
import { RefreshTokenService } from "../services/refresh-token.service";
import { UserService } from "../services/user.service";

export class GoogleController {
  private static googleClientId: string = process.env.GOOGLE_CLIENT_ID!;
  private static googleClientSecret: string = process.env.GOOGLE_CLIENT_SECRET!;
  private static googleRedirectUri: string = process.env.GOOGLE_REDIRECT_URI!;
  private static googleErrorRedirectUri: string =
    process.env.GOOGLE_ERROR_REDIRECT_URL!;
  private static googleAuthenticatedRedirectUri: string =
    process.env.GOOGLE_AUTHENTICATED_REDIRECT_URL!;

  private static googleAuthUri = "https://accounts.google.com/o/oauth2/v2/auth";
  private static googleTokenUri = "https://oauth2.googleapis.com/token";
  private static googleUserInfoUri =
    "https://www.googleapis.com/oauth2/v1/userinfo";

  public static auth = async (req: Request, res: Response) => {
    try {
      // Generate a random state for CSRF protection
      const state = crypto.randomBytes(16).toString("hex");

      await OAuthStateService.create(state);

      const authUrl = new URL(this.googleAuthUri);
      authUrl.searchParams.append("client_id", this.googleClientId);
      authUrl.searchParams.append("redirect_uri", this.googleRedirectUri);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", "email profile");
      authUrl.searchParams.append("state", state);
      authUrl.searchParams.append("access_type", "offline");
      authUrl.searchParams.append("prompt", "consent");

      res.redirect(authUrl.toString());
    } catch (error) {
      console.error("Error initiating Google auth:", error);
      res.redirect(this.googleErrorRedirectUri);
    }
  };

  public static callback = async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!state || typeof state !== "string") {
      console.error("Invalid state parameter", state);
      res.redirect(this.googleErrorRedirectUri);
      return;
    }

    const isValidState = await OAuthStateService.verifyAndConsume(state);
    if (!isValidState) {
      console.error("Invalid or expired state", state);
      res.redirect(this.googleErrorRedirectUri);
      return;
    }

    if (!code) {
      console.error("Authorization code not provided", code);
      res.redirect(this.googleErrorRedirectUri);
      return;
    }

    try {
      const tokenResponse = await fetch(this.googleTokenUri, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code: code as string,
          client_id: this.googleClientId,
          client_secret: this.googleClientSecret,
          redirect_uri: this.googleRedirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("Google token error:", errorData);
        res.redirect(this.googleErrorRedirectUri);
        return;
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      const userInfoResponse = await fetch(this.googleUserInfoUri, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userInfoResponse.ok) {
        console.error("Google user info error:", await userInfoResponse.json());
        res.redirect(this.googleErrorRedirectUri);
        return;
      }

      const userData = await userInfoResponse.json();
      const email = userData.email;
      const name = userData.name || null;
      const pictureUrl = userData.picture || null;

      if (!email) {
        res.redirect(this.googleErrorRedirectUri);
        return;
      }

      let user;

      try {
        user = await UserService.getUserByEmail(email);
      } catch (error) {
        console.error("User not found, creating new user", error);
      }

      if (!user) {
        const randomPassword = crypto.randomBytes(16).toString("hex");
        const salt = await bcrypt.genSalt(10);
        const passwordEncrypted = await bcrypt.hash(randomPassword, salt);

        user = await UserService.post(email, passwordEncrypted);

        await Telegram.send({
          text: `New user registered with Google: ${email} on ${req.headers.host}`,
        });

        if (name || pictureUrl) {
          const updateData: any = {};
          if (name) updateData.name = name;
          if (pictureUrl) updateData.picture_url = pictureUrl;

          await UserService.patch(user._id.toString(), updateData);
        }
      } else if (pictureUrl && !user.picture_url) {
        await UserService.patch(user._id.toString(), {
          picture_url: pictureUrl,
        });
      }

      const jwtAccessToken = generateAccessToken(user._id.toString(), email);
      const jwtRefreshToken = generateRefreshToken(user._id.toString(), email);

      const encryptedRefreshToken = encrypt(jwtRefreshToken);
      await RefreshTokenService.post(
        user._id.toString(),
        encryptedRefreshToken
      );

      setCookies(jwtAccessToken, jwtRefreshToken, res);

      res.redirect(this.googleAuthenticatedRedirectUri);
    } catch (error) {
      console.error("Google auth error:", error);
      res.redirect(this.googleErrorRedirectUri);
    }
  };
}
