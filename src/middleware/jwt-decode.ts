import { setCookies } from "@/libs/cookie";
import { decrypt, encrypt } from "@/libs/crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  REFRESH_TOKEN_SECRET,
} from "@/libs/jwt";
import { RefreshTokenService } from "@/services/refresh-token.service";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const jwtDecodeMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  const accessToken =
    req.headers.authorization?.split(" ")[1] ?? req.cookies.access_token;

  const decodedAccess = jwt.decode(accessToken) as jwt.JwtPayload;
  const currentTimestamp = Math.floor(Date.now() / 1000);

  // If access token is still valid (with 5 seconds buffer)
  if (
    decodedAccess &&
    decodedAccess.exp &&
    decodedAccess.exp > currentTimestamp + 5
  ) {
    const idUser = decodedAccess["x-user-id"];
    const email = decodedAccess["x-email"];
    if (!idUser) {
      res.status(404).json({ message: "Unauthorized, user not found" });
      return;
    }

    req.headers.id_user = idUser;
    req.headers.email = email;

    return next();
  }

  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    res.status(401).json({
      message: "Unauthorized, refresh token not found",
    });
    return;
  }

  let decoded: jwt.JwtPayload;

  try {
    decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as jwt.JwtPayload;
  } catch {
    res.status(401).json({ message: "Unauthorized, jwt malformed" });
    return;
  }

  const idUser = decoded["x-user-id"];
  const email = decoded["x-email"];

  const refreshTokenList = await RefreshTokenService.getByUserId(idUser);

  let tokenFoundEncrypted: string | null = null;

  for (const token of refreshTokenList) {
    const decryptedRefreshToken = decrypt(token.encrypted_jwt);

    if (decryptedRefreshToken === refreshToken) {
      tokenFoundEncrypted = token.encrypted_jwt;
      break;
    }
  }

  if (!tokenFoundEncrypted) {
    res.status(401).json({ message: "Unauthorized, token not found" });
    return;
  }

  const newAccessToken = generateAccessToken(idUser, email);
  const newRefreshToken = generateRefreshToken(idUser, email);
  const encryptedRefreshToken = encrypt(newRefreshToken);

  await RefreshTokenService.delete(idUser, tokenFoundEncrypted);
  await RefreshTokenService.post(idUser, encryptedRefreshToken);

  setCookies(newAccessToken, newRefreshToken, res);

  req.headers.id_user = idUser;
  req.headers.email = email;

  return next();
};

export default jwtDecodeMiddleware;
