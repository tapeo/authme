import { config } from "dotenv";
import { dirname } from "path";

config();

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express } from "express";
import fs from "fs";
import https from "https";
import path from "path";
import { extendResponse } from "./extensions/response";
import connectDB from "./libs/mongo";

import { Model, Mongoose } from "mongoose";
import { AuthConfig, CorsConfig, DefaultConfig, EmailConfig, JwtConfig, MongoConfig, ServerConfig } from "./config";
import { GoogleController } from "./controller/google.controller";
import { LoginController } from "./controller/login.controller";
import { UserController } from "./controller/me.controller";
import { PasswordController } from "./controller/password.controller";
import { RefreshTokenController } from "./controller/refresh-token.controller";
import { SignupController } from "./controller/signup.controller";
import jwtDecodeMiddleware from "./middleware/jwt-decode";
import { updateLastAccess } from "./middleware/last-access.middleware";
import registerOAuthStateModel, {
  IOAuthState,
} from "./model/oauth-state.model";
import registerOtpModel, { IOtp } from "./model/otp.model";
import registerUserModel, { User } from "./model/user.model";

export * from "./config";
export * from "./extensions";
export * from "./libs";
export * from "./middleware";
export * from "./services";
export * from "./types";

const publicPath = path.join(dirname(__filename), "public");

export let OAuthStateModel: Model<IOAuthState>;
export let OtpModel: Model<IOtp>;
export let UserModel: Model<User>;

interface OverrideConfig {
  server?: ServerConfig;
  mongoose?: MongoConfig;
  jwt?: JwtConfig;
  auth?: AuthConfig;
  cors?: CorsConfig;
  email?: EmailConfig;
}

export let appConfig: DefaultConfig;

export async function start(app: Express, override: OverrideConfig) {
  appConfig = {
    server: override.server || {
      host: "0.0.0.0",
      port: 8080,
      https: false,
    },
    mongoose: override.mongoose || {
      instance: new Mongoose(),
    },
    jwt: override.jwt || {
      access_token_expires_in: "15m",
      refresh_token_expires_in: "90d",
      cookie_access_token_max_age: 1000 * 60 * 15,
      cookie_refresh_token_max_age: 1000 * 60 * 60 * 24 * 90,
    },
    auth: override.auth || {
      useOtp: false,
    },
    cors: override.cors || {
      allowedHeaders: [],
    },
    email: override.email || {
      name: "App Name",
      from: "app@example.com",
    },
  };

  await connectDB();

  OAuthStateModel = registerOAuthStateModel(appConfig.mongoose.instance);
  OtpModel = registerOtpModel(appConfig.mongoose.instance);
  UserModel = registerUserModel(appConfig.mongoose.instance);

  console.log(process.env.ENV);

  const origin: string[] = process.env.ORIGIN_LIST?.split(",") || [];

  const corsOptions = {
    origin: origin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Origin",
      "id_user",
      "user_id",
      ...(appConfig.cors?.allowedHeaders || []),
    ],
  };

  app.use(cors(corsOptions));

  app.use(express.json());
  app.use(cookieParser());
  app.use(express.static(publicPath));
  app.use(express.urlencoded({ extended: true }));

  // Extend Express Response
  extendResponse(app.response);

  // Setup routes
  app.post("/auth/login", LoginController.login);
  app.post("/auth/signup", appConfig.auth?.useOtp === true ? SignupController.signupWithVerificationHandler : SignupController.signupWithoutVerificationHandler);
  app.post("/auth/signup/anonymous", SignupController.signupAnonymousHandler);
  app.post(
    "/auth/signup/merge",
    jwtDecodeMiddleware,
    updateLastAccess,
    SignupController.mergeAnonymousAccountHandler
  );
  app.post(
    "/auth/send-email-verification",
    SignupController.sendEmailVerificationHandler
  );
  app.post("/auth/refresh-token", RefreshTokenController.refreshTokenHandler);
  app.post("/auth/logout", LoginController.logout);

  app.get("/auth/google", GoogleController.auth);
  app.get("/auth/google/callback", GoogleController.callback);

  app.post("/auth/password/forgot", PasswordController.forgotPasswordHandler);
  app.get(
    "/auth/password/reset/:token",
    PasswordController.tokenPasswordHandler
  );
  app.post("/auth/password/update", PasswordController.updatePasswordHandler);

  app.get("/user", jwtDecodeMiddleware, updateLastAccess, UserController.meHandler);
  app.delete("/user", jwtDecodeMiddleware, updateLastAccess, UserController.deleteMeHandler);

  app.get("/auth/reset-password.html", (req, res) => {
    res.sendFile(publicPath + "/reset-password.html");
  });

  const useHttps = appConfig?.server?.https || process.env.DEV_SERVER_HTTPS === "true";

  if (useHttps) {
    https
      .createServer(
        {
          key: fs.readFileSync("cert-key.pem"),
          cert: fs.readFileSync("cert.pem"),
        },
        app
      )
      .listen(appConfig.server.port, appConfig.server.host, () => {
        console.log(`[server]: Server is running at https://${appConfig.server.host}:${appConfig.server.port}`);
      });
  } else {
    app.listen(appConfig.server.port, appConfig.server.host, () => {
      console.log(`[server]: Server is running at http://${appConfig.server.host}:${appConfig.server.port}`);
    });
  }

  return app;
}

export default start;
