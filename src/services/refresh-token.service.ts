import { appConfig, BaseUserModel } from "..";
import { BaseUser } from "../types/base-user";
import { RefreshToken } from "../types/refresh-token";

export class RefreshTokenService {

  public static post = async (
    userId: string,
    refreshToken: string
  ): Promise<RefreshToken | null> => {
    const data = {
      expires_at: new Date(Date.now() + appConfig.jwt.cookie_refresh_token_max_age),
      encrypted_jwt: refreshToken,
    };

    await BaseUserModel.findByIdAndUpdate(
      userId,
      { $push: { refresh_tokens: data } },
      { new: true, useFindAndModify: false }
    );

    const user: BaseUser | null = await BaseUserModel.findById(userId);

    if (!user) {
      return null;
    }

    const validTokens = user.refresh_tokens.filter(
      (token) => token.expires_at >= new Date()
    );

    if (validTokens.length < user.refresh_tokens.length) {
      await BaseUserModel.findByIdAndUpdate(
        userId,
        { $set: { refresh_tokens: validTokens } },
        { new: true, useFindAndModify: false }
      );
    }

    return validTokens[validTokens.length - 1];
  };

  public static getByUserId = async (
    userId: string
  ): Promise<RefreshToken[]> => {
    const user: BaseUser | null = await BaseUserModel.findById(userId);

    if (!user) {
      return [];
    }

    return user.refresh_tokens ?? [];
  };

  public static delete = async (
    userId: string,
    encryptedRefreshToken: string
  ): Promise<BaseUser | null> => {
    const user = await BaseUserModel.findByIdAndUpdate(
      userId,
      { $pull: { refresh_tokens: { encrypted_jwt: encryptedRefreshToken } } },
      { new: true, useFindAndModify: false }
    );

    return user;
  };
}
