import express from "express";
import mongoose from "mongoose";
import { start } from "./index";
import jwtDecodeMiddleware from "./middleware/jwt-decode";

const app = express();

app.get("/jwt", jwtDecodeMiddleware, (req, res) => {
    res.jsonTyped({
        status: "success",
        data: {
            jwt: req.jwt,
        },
    });
});

start(app as any, {
    env: process.env.ENV! as "development" | "production",
    origin: process.env.ORIGIN_LIST!.split(","),
    telegram: {
        bot_token: process.env.TELEGRAM_BOT_TOKEN!,
        chat_id: process.env.TELEGRAM_CHAT_ID!,
    },
    mongoose: {
        uri: process.env.MONGO_URI!,
        instance: mongoose,
    },
    auth: {
        use_otp: false,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET!,
        refresh_token_secret: process.env.REFRESH_TOKEN_SECRET!,
        encryption_key: process.env.ENCRYPTION_KEY!,
    },
    email: {
        name: "notionreminders.com",
        from: "info@notionreminders.com",
        provider: "plunk",
        plunk: {
            api_key: process.env.PLUNK_API_KEY!,
        },
    },
    google_auth: {
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URL!,
        error_redirect_uri: process.env.GOOGLE_ERROR_REDIRECT_URL!,
        authenticated_redirect_uri: process.env.GOOGLE_AUTHENTICATED_REDIRECT_URL!,
    },
});