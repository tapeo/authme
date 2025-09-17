import { OAuthStateModel } from "..";
import { OAuthStateFlowType } from "../models/oauth-state.model";

export class OAuthStateService {
  private static expireAfter: number = 10 * 60 * 1000;

  public static create = async (
    state: string,
    flowType: OAuthStateFlowType,
    expiresIn: number = this.expireAfter
  ) => {
    const oauthState = await OAuthStateModel.create({
      state,
      flow_type: flowType,
      expires_at: new Date(Date.now() + expiresIn),
    });

    return oauthState;
  };

  public static verifyAndConsume = async (state: string): Promise<{ isValid: boolean, flowType: OAuthStateFlowType | null }> => {
    const oauthState = await OAuthStateModel.findOne({
      state,
      expires_at: { $gt: new Date() },
    });

    if (!oauthState) {
      return { isValid: false, flowType: null };
    }

    await OAuthStateModel.deleteOne({ _id: oauthState._id });

    return { isValid: true, flowType: oauthState.flow_type as OAuthStateFlowType };
  };
}
