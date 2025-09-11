import { Types } from "mongoose";
import { RefreshToken } from "./refresh-token";

export interface BaseUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  picture_url: string | null;
  reset_password_token: string | null;
  reset_password_expires: Date | null;
  refresh_tokens: RefreshToken[];
  is_anonymous?: boolean;
  last_access?: Date;
}
