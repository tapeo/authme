import { Response } from "express";
import { appConfig } from "..";

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
    maxAge: appConfig.jwt.cookie_access_token_max_age,
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: isProduction,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: appConfig.jwt.cookie_refresh_token_max_age,
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
