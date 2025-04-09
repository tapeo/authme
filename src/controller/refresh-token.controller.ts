import { Request, Response } from "express";
import { setCookies } from "../libs";
import { decrypt, encrypt } from "../libs/crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../libs/jwt";
import { RefreshTokenService } from "../services/refresh-token.service";

export class RefreshTokenController {
  public static refreshTokenHandler = async (req: Request, res: Response) => {
    const refreshToken = req.body.refresh_token ?? req.cookies.refresh_token;

    let idUser;
    let email;

    try {
      const decoded = verifyRefreshToken(refreshToken);

      idUser = (decoded as any)["x-user-id"];
      email = (decoded as any)["x-email"];
    } catch {
      res.status(401).json({ message: "Unauthorized, invalid token" });
      return;
    }

    if (!idUser) {
      res.status(404).json({ message: "Unauthorized, user not found" });
      return;
    }

    const refreshTokenList = await RefreshTokenService.getByUserId(idUser);

    if (refreshTokenList.length === 0) {
      res.status(401).json({ message: "Unauthorized, no refresh tokens" });
      return;
    }

    let tokenFoundEncrypted: string | null = null;
    let tokenFoundDecrypted: string | null = null;

    for (const token of refreshTokenList) {
      const decryptedRefreshToken = decrypt(token.encrypted_jwt);

      if (decryptedRefreshToken === refreshToken) {
        tokenFoundEncrypted = token.encrypted_jwt;
        tokenFoundDecrypted = decryptedRefreshToken;
        break;
      }
    }

    if (!tokenFoundEncrypted || !tokenFoundDecrypted) {
      res.status(401).json({ message: "Unauthorized, no valid token" });
      return;
    }

    const generatedAccessToken = generateAccessToken(idUser, email);
    const generatedRefreshToken = generateRefreshToken(idUser, email);

    const encryptedRefreshToken = encrypt(generatedRefreshToken);

    const deleted = await RefreshTokenService.delete(
      idUser,
      tokenFoundEncrypted
    );

    if (!deleted) {
      res
        .status(401)
        .json({ message: "Unauthorized, no refresh tokens can be deleted" });
      return;
    }

    const posted = await RefreshTokenService.post(
      idUser,
      encryptedRefreshToken
    );

    if (!posted) {
      res
        .status(401)
        .json({ message: "Unauthorized, no refresh tokens can be posted" });
      return;
    }

    setCookies(generatedAccessToken, generatedRefreshToken, res);

    res.status(200).json({
      access_token: generatedAccessToken,
      refresh_token: generatedRefreshToken,
    });
  };
}
