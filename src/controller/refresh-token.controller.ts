import { decrypt, encrypt } from "@/libs/crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "@/libs/jwt";
import { RefreshTokenService } from "@/services/refresh-token.service";
import { Request, Response } from "express";

export class RefreshTokenController {
  public static refreshTokenHandler = async (req: Request, res: Response) => {
    const refresh_token = req.body.refresh_token;

    let idUser;
    let email;

    try {
      const decoded = verifyRefreshToken(refresh_token);

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

      if (decryptedRefreshToken === refresh_token) {
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

    await RefreshTokenService.delete(idUser, tokenFoundEncrypted);
    await RefreshTokenService.post(idUser, encryptedRefreshToken);

    res.status(200).json({
      access_token: generatedAccessToken,
      refresh_token: generatedRefreshToken,
    });
  };
}
