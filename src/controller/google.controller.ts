import bcrypt from "bcrypt";
import crypto from "crypto";
import { Request, Response } from "express";
import { appConfig } from "..";
import { Telegram } from "../extensions/telegram.extension";
import { setCookies } from "../libs/cookie";
import { encrypt } from "../libs/crypto";
import { generateAccessToken, generateRefreshToken } from "../libs/jwt";
import { OAuthStateService } from "../services/oauth-state.service";
import { RefreshTokenService } from "../services/refresh-token.service";
import { UserService } from "../services/user.service";

export class GoogleController {
  private static googleAuthUri = "https://accounts.google.com/o/oauth2/v2/auth";
  private static googleTokenUri = "https://oauth2.googleapis.com/token";
  private static googleUserInfoUri =
    "https://www.googleapis.com/oauth2/v1/userinfo";

  public static authLogin = async (req: Request, res: Response) => {
    try {
      // Generate a random state for CSRF protection
      const state = crypto.randomBytes(16).toString("hex");

      await OAuthStateService.create(state, "login");

      const authUrl = new URL(this.googleAuthUri);
      authUrl.searchParams.append("client_id", appConfig.google_auth!.client_id);
      authUrl.searchParams.append("redirect_uri", appConfig.google_auth!.redirect_uri);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", "email profile");
      authUrl.searchParams.append("state", state);
      authUrl.searchParams.append("access_type", "offline");
      authUrl.searchParams.append("prompt", "consent");

      res.redirect(authUrl.toString());
    } catch (error) {
      console.error("Error initiating Google login:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      const encoded = encodeURIComponent(message);
      res.redirect(appConfig.google_auth!.login_error_redirect_uri + "?error=" + encoded);
    }
  };

  public static authSignup = async (req: Request, res: Response) => {
    try {
      // Generate a random state for CSRF protection
      const state = crypto.randomBytes(16).toString("hex");

      await OAuthStateService.create(state, "signup");

      const authUrl = new URL(this.googleAuthUri);
      authUrl.searchParams.append("client_id", appConfig.google_auth!.client_id);
      authUrl.searchParams.append("redirect_uri", appConfig.google_auth!.redirect_uri);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", "email profile");
      authUrl.searchParams.append("state", state);
      authUrl.searchParams.append("access_type", "offline");
      authUrl.searchParams.append("prompt", "consent");

      res.redirect(authUrl.toString());
    } catch (error) {
      console.error("Error initiating Google signup:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      const encoded = encodeURIComponent(message);
      res.redirect(appConfig.google_auth!.signup_error_redirect_uri + "?error=" + encoded);
    }
  };

  public static callback = async (req: Request, res: Response) => {
    const { code, state } = req.query;

    if (!state || typeof state !== "string") {
      console.error("Invalid state parameter", state);
      const message = "Invalid state parameter";
      const encoded = encodeURIComponent(message);
      res.redirect(appConfig.google_auth!.generic_error_redirect_uri + "?error=" + encoded);
      return;
    }

    const stateResult = await OAuthStateService.verifyAndConsume(state);
    if (!stateResult.isValid) {
      console.error("Invalid or expired state", state);
      const message = "Invalid or expired state";
      const encoded = encodeURIComponent(message);
      res.redirect(appConfig.google_auth!.generic_error_redirect_uri + "?error=" + encoded);
      return;
    }

    const flowType = stateResult.flowType!;

    if (!code) {
      console.error("Authorization code not provided", code);
      const message = "Authorization code not provided";
      const encoded = encodeURIComponent(message);
      res.redirect(appConfig.google_auth!.generic_error_redirect_uri + "?error=" + encoded);
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
          client_id: appConfig.google_auth!.client_id,
          client_secret: appConfig.google_auth!.client_secret,
          redirect_uri: appConfig.google_auth!.redirect_uri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("Google token error:", errorData);
        const message = "Google token error";
        const encoded = encodeURIComponent(message);
        res.redirect(appConfig.google_auth!.generic_error_redirect_uri + "?error=" + encoded);
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
        const message = "Google user info error";
        const encoded = encodeURIComponent(message);
        res.redirect(appConfig.google_auth!.generic_error_redirect_uri + "?error=" + encoded);
        return;
      }

      const userData = await userInfoResponse.json();
      const email = userData.email;
      const name = userData.name || null;
      const pictureUrl = userData.picture || null;

      if (!email) {
        const message = "Google user info error";
        const encoded = encodeURIComponent(message);
        res.redirect(appConfig.google_auth!.generic_error_redirect_uri + "?error=" + encoded);
        return;
      }

      let user = await UserService.getUserByEmail(email);

      if (flowType === "login") {
        if (!user) {
          console.error("User not found for login", email);
          const message = "User not found for login";
          const encoded = encodeURIComponent(message);
          res.redirect(appConfig.google_auth!.login_error_redirect_uri + "?error=" + encoded);
          return;
        }

        if (pictureUrl && !user.picture_url) {
          await UserService.patch(user._id!, {
            picture_url: pictureUrl,
          });
        }
      } else { // signup flow
        if (user) {
          console.error("User already exists for signup", email);
          const message = "User already exists for signup";
          const encoded = encodeURIComponent(message);
          res.redirect(appConfig.google_auth!.signup_error_redirect_uri + "?error=" + encoded);
          return;
        }

        const randomPassword = crypto.randomBytes(16).toString("hex");
        const salt = await bcrypt.genSalt(10);
        const passwordEncrypted = await bcrypt.hash(randomPassword, salt);

        user = await UserService.post(email, passwordEncrypted);

        if (!user) {
          const message = "Cannot create user";
          const encoded = encodeURIComponent(message);
          res.redirect(appConfig.google_auth!.generic_error_redirect_uri + "?error=" + encoded);
          return;
        }

        await Telegram.send({
          text: `New user registered with Google: ${email} on ${req.headers.host}`,
        });

        if (name || pictureUrl) {
          const updateData: any = {};
          if (name) updateData.name = name;
          if (pictureUrl) updateData.picture_url = pictureUrl;

          await UserService.patch(user._id!, updateData);
        }
      }

      const jwtAccessToken = generateAccessToken(user._id!, email);
      const jwtRefreshToken = generateRefreshToken(user._id!, email);

      const encryptedRefreshToken = encrypt(jwtRefreshToken);

      const refreshToken = await RefreshTokenService.post(
        user._id!,
        encryptedRefreshToken
      );

      if (!refreshToken) {
        const message = "Cannot create refresh token";
        const encoded = encodeURIComponent(message);
        res.redirect(appConfig.google_auth!.generic_error_redirect_uri + "?error=" + encoded);
        return;
      }

      setCookies(jwtAccessToken, jwtRefreshToken, res);

      res.redirect(appConfig.google_auth!.authenticated_redirect_uri);
    } catch (error) {
      console.error("Google auth error:", error);
      const message = "Google auth error";
      const encoded = encodeURIComponent(message);
      res.redirect(appConfig.google_auth!.generic_error_redirect_uri + "?error=" + encoded);
    }
  };
}
