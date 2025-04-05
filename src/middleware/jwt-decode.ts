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

  const accessToken =
    req.headers.authorization?.split(" ")[1] ?? req.cookies.access_token;

  if (!accessToken) {
    console.log("[JWT] Error: Access token not found");

    clearCookies(res);

    return res.status(401).jsonTyped({
      status: "error",
      message: "Unauthorized, access token not found",
      data: {
        error: JwtError.TOKEN_NOT_FOUND,
      },
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
      console.log("[JWT] Error: User ID not found in token");

      clearCookies(res);

      return res.status(404).jsonTyped({
        status: "error",
        message: "Unauthorized, user not found",
        data: {
          error: JwtError.USER_NOT_FOUND,
        },
      });
    }

    req.headers.id_user = idUser;
    req.headers.email = email;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log("[JWT] Token expired");

      return res.status(401).jsonTyped({
        status: "error",
        message: "Unauthorized, access token expired",
        data: {
          error: JwtError.TOKEN_EXPIRED,
        },
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log("[JWT] Invalid token");

      clearCookies(res);

      return res.status(401).jsonTyped({
        status: "error",
        message: "Unauthorized, invalid access token",
        data: {
          error: JwtError.TOKEN_INVALID,
        },
      });
    } else {
      console.log("[JWT] Malformed token");

      clearCookies(res);

      return res.status(401).jsonTyped({
        status: "error",
        message: "Unauthorized, malformed access token",
        data: {
          error: JwtError.MALFORMED_TOKEN,
        },
      });
    }
  }
};

export default jwtDecodeMiddleware;
