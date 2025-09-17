import { Mongoose } from "mongoose";

export enum OAuthStateFlowType {
  login = "login",
  signup = "signup",
}

export interface IOAuthState extends Document {
  state: string;
  flow_type: OAuthStateFlowType;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export function registerOAuthStateModel(mongooseInstance: Mongoose) {
  const oauthStateSchema = new mongooseInstance!.Schema<IOAuthState>(
    {
      state: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      flow_type: {
        type: String,
        enum: OAuthStateFlowType,
        required: true,
      },
      expires_at: {
        type: Date,
        required: true,
        index: { expires: 0 }, // Document will be automatically deleted when expires
      },
    },
    {
      timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    }
  );

  const OAuthStateModel = mongooseInstance!.model<IOAuthState>(
    "OAuthState",
    oauthStateSchema
  );

  return OAuthStateModel;
}

export default registerOAuthStateModel;
