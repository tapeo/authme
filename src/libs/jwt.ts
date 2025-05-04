import jwt from "jsonwebtoken";
import { appConfig } from "..";

export function verifyJWT(token: string): string | jwt.JwtPayload {
  return jwt.verify(token, appConfig.auth.access_token_secret);
}

export function jwtDecode(token: string): jwt.JwtPayload | null | string {
  return jwt.decode(token);
}

export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    {
      "x-user-id": userId,
      "x-email": email,
    },
    appConfig.auth.access_token_secret,
    {
      expiresIn: appConfig.jwt.access_token_expires_in,
    }
  );
}

export function generateRefreshToken(userId: string, email: string): string {
  return jwt.sign(
    {
      "x-user-id": userId,
      "x-email": email,
    },
    appConfig.auth.refresh_token_secret,
    { expiresIn: appConfig.jwt.refresh_token_expires_in }
  );
}

export function verifyRefreshToken(token: string): string | jwt.JwtPayload {
  return jwt.verify(token, appConfig.auth.refresh_token_secret);
}
