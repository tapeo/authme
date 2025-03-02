import OAuthState from "@/model/oauth-state.model";

export class OAuthStateService {
  private static expireAfter: number = 10 * 60 * 1000;

  public static create = async (
    state: string,
    expiresIn: number = this.expireAfter
  ) => {
    const oauthState = await OAuthState.create({
      state,
      expires_at: new Date(Date.now() + expiresIn),
    });

    return oauthState;
  };

  public static verifyAndConsume = async (state: string): Promise<boolean> => {
    const oauthState = await OAuthState.findOne({
      state,
      expires_at: { $gt: new Date() },
    });

    if (!oauthState) {
      return false;
    }

    await OAuthState.deleteOne({ _id: oauthState._id });

    return true;
  };
}
