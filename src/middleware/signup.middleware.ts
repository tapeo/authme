import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { appConfig } from "..";

const signupMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const accessTokenAuthorization = req.headers.authorization?.split(" ")[1];
    const accessTokenCookie = req.cookies?.access_token;

    const accessToken =
      accessTokenAuthorization ?? accessTokenCookie;

    const decodedAccess: jwt.Jwt = jwt.verify(
      accessToken,
      appConfig.auth.access_token_secret,
      {
        complete: true,
      }
    );

    const payload = decodedAccess.payload as jwt.JwtPayload;
    const idUser = payload["x-user-id"];
    const email = payload["x-email"];

    req.jwt = {
      user_id: idUser,
      email: email,
      payload: payload,
    };

    next();
  } catch {
    next();
  }
};

export default signupMiddleware;
