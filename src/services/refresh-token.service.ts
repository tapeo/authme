import { appConfig, UserModel } from "..";
import { RefreshToken } from "../types/refresh-token";
import { User } from "../types/user";

export class RefreshTokenService {

  public static post = async (
    userId: string,
    refreshToken: string
  ): Promise<RefreshToken | null> => {
    const data = {
      expires_at: new Date(Date.now() + appConfig.jwt.cookie_refresh_token_max_age),
      encrypted_jwt: refreshToken,
    };

    await UserModel.findByIdAndUpdate(
      userId,
      { $push: { refresh_tokens: data } },
      { new: true, useFindAndModify: false }
    );

    const user: User | null = await UserModel.findById(userId);

    if (!user) {
      return null;
    }

    const validTokens = user.refresh_tokens.filter(
      (token) => token.expires_at >= new Date()
    );

    if (validTokens.length < user.refresh_tokens.length) {
      await UserModel.findByIdAndUpdate(
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
    const user: User | null = await UserModel.findById(userId);

    if (!user) {
      return [];
    }

    return user.refresh_tokens ?? [];
  };

  public static delete = async (
    userId: string,
    encryptedRefreshToken: string
  ): Promise<User | null> => {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { refresh_tokens: { encrypted_jwt: encryptedRefreshToken } } },
      { new: true, useFindAndModify: false }
    );

    return user;
  };
}
