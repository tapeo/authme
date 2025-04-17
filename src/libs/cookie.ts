import { Response } from "express";
import { Config } from "../config";

export const setCookies = (
  accessToken: string,
  refreshToken: string,
  res: Response
) => {
  const isProduction = process.env.ENV === "production";

  res.cookie("access_token", accessToken, {
    httpOnly: isProduction,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: Config.cookieAccessTokenExpiresIn,
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: isProduction,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: Config.cookieRefreshTokenExpiresIn,
  });
};

export const clearCookies = (res: Response) => {
  const isProduction = process.env.ENV === "production";

  res.cookie("access_token", "", {
    httpOnly: isProduction,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    expires: new Date(0),
  });

  res.cookie("refresh_token", "", {
    httpOnly: isProduction,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    expires: new Date(0),
  });
};
