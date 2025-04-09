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
import connectDB, { DbOptions } from "./libs/mongo";

import { Model, Mongoose } from "mongoose";
import { GoogleController } from "./controller/google.controller";
import { LoginController } from "./controller/login.controller";
import { UserController } from "./controller/me.controller";
import { PasswordController } from "./controller/password.controller";
import { RefreshTokenController } from "./controller/refresh-token.controller";
import { SignupController } from "./controller/signup.controller";
import jwtDecodeMiddleware from "./middleware/jwt-decode";
import registerOAuthStateModel, {
  IOAuthState,
} from "./model/oauth-state.model";
import registerOtpModel, { IOtp } from "./model/otp.model";
import registerUserModel, { User } from "./model/user.model";

export * from "./extensions";
export * from "./libs";
export * from "./middleware";
export * from "./services";
export * from "./types";

const publicPath = path.join(dirname(__filename), "public");

interface StartOptions {
  host: string;
  port: number;
  mongooseInstance: Mongoose;
  https?: boolean;
  email: {
    name: string;
    from: string;
  };
  mongoose?: DbOptions;
  cors?: {
    allowedHeaders: string[];
  };
}

export let emailOptions: StartOptions["email"] = {
  name: "Your App Name",
  from: "email@example.com",
};

export let mongooseOptions: DbOptions | undefined = {
  prod_db_name: undefined,
  test_db_name: undefined,
  user_schema: undefined,
};

export let OAuthStateModel: Model<IOAuthState>;
export let OtpModel: Model<IOtp>;
export let UserModel: Model<User>;

export async function start(app: Express, options: StartOptions) {
  emailOptions = options.email;
  mongooseOptions = options.mongoose;

  await connectDB(options.mongooseInstance, mongooseOptions);

  OAuthStateModel = registerOAuthStateModel(options.mongooseInstance);
  OtpModel = registerOtpModel(options.mongooseInstance);
  UserModel = registerUserModel(options.mongooseInstance);

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
      ...(options.cors?.allowedHeaders || []),
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
  app.post("/auth/signup", SignupController.signupWithoutVerificationHandler);
  app.post("/auth/signup/anonymous", SignupController.signupAnonymousHandler);
  app.post(
    "/auth/signup/merge",
    jwtDecodeMiddleware,
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

  app.get("/user", jwtDecodeMiddleware, UserController.meHandler);
  app.delete("/user", jwtDecodeMiddleware, UserController.deleteMeHandler);

  app.get("/auth/reset-password.html", (req, res) => {
    res.sendFile(publicPath + "/reset-password.html");
  });

  const host = options?.host || "0.0.0.0";
  const port = options?.port || 8080;

  const useHttps = options?.https || process.env.DEV_SERVER_HTTPS === "true";

  if (useHttps) {
    https
      .createServer(
        {
          key: fs.readFileSync("cert-key.pem"),
          cert: fs.readFileSync("cert.pem"),
        },
        app
      )
      .listen(port, host, () => {
        console.log(`[server]: Server is running at https://${host}:${port}`);
      });
  } else {
    app.listen(port, host, () => {
      console.log(`[server]: Server is running at http://${host}:${port}`);
    });
  }

  return app;
}

export default start;
