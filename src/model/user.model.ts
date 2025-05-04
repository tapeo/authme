import { Mongoose } from "mongoose";
import { appConfig } from "..";

export interface RefreshToken {
  expires_at: Date;
  encrypted_jwt: string;
}

export interface User {
  _id: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
  reset_password_token: string | null;
  reset_password_expires: Date | null;
  picture_url: string;
  id_stripe_customer: string;
  id_stripe_connect: string;
  refresh_tokens: RefreshToken[];
  name?: string | null;
  type?: string | null;
  is_anonymous?: boolean;
  last_access?: Date | null;
}

export function registerUserModel(mongooseInstance: Mongoose) {
  const RefreshTokenSchema = new mongooseInstance!.Schema<RefreshToken>({
    expires_at: {
      type: Date,
      required: true,
    },
    encrypted_jwt: {
      type: String,
      required: true,
    },
  });

  const UserSchema = new mongooseInstance!.Schema<User>({
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
    reset_password_token: {
      type: String,
    },
    reset_password_expires: {
      type: Date,
    },
    picture_url: {
      type: String,
      default: null,
    },
    id_stripe_customer: {
      type: String,
    },
    id_stripe_connect: {
      type: String,
    },
    refresh_tokens: [RefreshTokenSchema],
    name: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      default: null,
    },
    is_anonymous: {
      type: Boolean,
      default: false,
    },
    last_access: {
      type: Date,
      default: null,
    },
  });

  UserSchema.index({ email: 1 }, { unique: true });

  UserSchema.pre("save", async function (next) {
    if (appConfig?.mongoose?.user_schema?.pre) {
      appConfig.mongoose.user_schema.pre(this as any);
    }
    next();
  });

  UserSchema.post("save", async function (doc) {
    if (appConfig?.mongoose?.user_schema?.post) {
      appConfig.mongoose.user_schema.post(doc as any);
    }
  });

  const UserModel = mongooseInstance!.model("User", UserSchema);

  return UserModel;
}

export default registerUserModel;
