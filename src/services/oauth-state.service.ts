import { OAuthStateModel } from "..";

export class OAuthStateService {
  private static expireAfter: number = 10 * 60 * 1000;

  public static create = async (
    state: string,
    expiresIn: number = this.expireAfter
  ) => {
    const oauthState = await OAuthStateModel.create({
      state,
      expires_at: new Date(Date.now() + expiresIn),
    });

    return oauthState;
  };

  public static verifyAndConsume = async (state: string): Promise<boolean> => {
    const oauthState = await OAuthStateModel.findOne({
      state,
      expires_at: { $gt: new Date() },
    });

    if (!oauthState) {
      return false;
    }

    await OAuthStateModel.deleteOne({ _id: oauthState._id });

    return true;
  };
}
