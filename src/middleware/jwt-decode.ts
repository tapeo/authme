import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { clearCookies } from "../libs";
import { ACCESS_TOKEN_SECRET } from "../libs/jwt";

enum JwtError {
  TOKEN_EXPIRED = "token_expired",
  TOKEN_INVALID = "token_invalid",
  TOKEN_NOT_FOUND = "token_not_found",
  USER_NOT_FOUND = "user_not_found",
  MALFORMED_TOKEN = "malformed_token",
}

const jwtDecodeMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  const accessTokenAuthorization = req.headers.authorization?.split(" ")[1];
  const accessTokenCookie = req.cookies.access_token;
  const refreshTokenCookie = req.cookies.refresh_token;

  const accessToken =
    accessTokenAuthorization ?? accessTokenCookie;

  // If access token is expired (no authorization header and no access token cookie) but has refresh token, return token expired
  if (!accessToken && !!refreshTokenCookie) {
    return res.status(401).jsonTyped({
      status: "error",
      message: "Unauthorized, access token expired",
      error: JwtError.TOKEN_EXPIRED,
    });
  }

  if (!accessToken) {
    clearCookies(res);

    return res.status(401).jsonTyped({
      status: "error",
      message: "Unauthorized, access token not found",
      error: JwtError.TOKEN_NOT_FOUND,
    });
  }

  try {
    const decodedAccess: jwt.Jwt = jwt.verify(
      accessToken,
      ACCESS_TOKEN_SECRET,
      {
        complete: true,
      }
    );

    const payload = decodedAccess.payload as jwt.JwtPayload;
    const idUser = payload["x-user-id"];
    const email = payload["x-email"];

    if (!idUser) {
      clearCookies(res);

      return res.status(404).jsonTyped({
        status: "error",
        message: "Unauthorized, user not found",
        error: JwtError.USER_NOT_FOUND,
      });
    }

    req.headers.id_user = idUser;
    req.headers.user_id = idUser;
    req.headers.email = email;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).jsonTyped({
        status: "error",
        message: "Unauthorized, access token expired",
        error: JwtError.TOKEN_EXPIRED,
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      clearCookies(res);

      return res.status(401).jsonTyped({
        status: "error",
        message: "Unauthorized, invalid access token",
        error: JwtError.TOKEN_INVALID,
      });
    } else {
      clearCookies(res);

      return res.status(401).jsonTyped({
        status: "error",
        message: "Unauthorized, malformed access token",
        error: JwtError.MALFORMED_TOKEN,
      });
    }
  }
};

export default jwtDecodeMiddleware;
