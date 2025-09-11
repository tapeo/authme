import { RefreshToken } from "./refresh-token";

export interface User {
  _id?: string;
  email: string;
  password: string;
  picture_url: string | null;
  reset_password_token: string | null;
  reset_password_expires: Date | null;
  refresh_tokens: RefreshToken[];
  is_anonymous?: boolean;
  last_access?: Date;
  created_at?: Date;
  updated_at?: Date;
}
