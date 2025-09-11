import { Model, Mongoose } from "mongoose";
import { appConfig } from "..";
import { RefreshToken } from "../types/refresh-token";
import { User } from "../types/user";

export function registerUserModel(mongooseInstance: Mongoose): Model<User> {
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

  const userSchema = new mongooseInstance!.Schema<User>({
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    picture_url: {
      type: String,
      default: null,
    },
    reset_password_token: {
      type: String,
    },
    reset_password_expires: {
      type: Date,
    },
    refresh_tokens: [RefreshTokenSchema],
    is_anonymous: {
      type: Boolean,
      default: false,
    },
    last_access: {
      type: Date,
      default: null,
    },
  });

  userSchema.index({ email: 1 }, { unique: true });

  userSchema.pre("save", async function (next) {
    if (appConfig?.mongoose?.user_schema?.pre) {
      appConfig.mongoose.user_schema.pre(this as any);
    }
    next();
  });

  userSchema.post("save", async function (doc) {
    if (appConfig?.mongoose?.user_schema?.post) {
      appConfig.mongoose.user_schema.post(doc as any);
    }
  });

  const UserModel: Model<User> = mongooseInstance!.model("User", userSchema);

  return UserModel;
}

export default registerUserModel;
