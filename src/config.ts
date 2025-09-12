import { Model, Mongoose } from "mongoose";
import { BaseUser } from "./dist/types/base-user";

export interface ServerConfig {
    host: string;
    port: number;
    https: boolean;
}

export interface MongoConfig {
    uri: string;
    instance: Mongoose;
    prod_db_name?: string;
    test_db_name?: string;
    directConnection?: boolean;
    user_schema?: {
        pre?: (doc: BaseUser) => Promise<void>;
        post?: (doc: BaseUser) => Promise<void>;
    };
}

export interface JwtConfig {
    access_token_expires_in: string;
    refresh_token_expires_in: string;
    cookie_access_token_max_age: number;
    cookie_refresh_token_max_age: number;
}

export interface AuthConfig {
    encryption_key: string;
    access_token_secret: string;
    refresh_token_secret: string;
    use_otp: boolean;
}

export interface CorsConfig {
    allowed_headers: string[];
}

export interface EmailConfig {
    name: string;
    from: string;
    provider: "plunk" | "mailersend";
    plunk?: {
        api_key: string;
    };
    mailersend?: {
        api_key: string;
    };
}

export interface GoogleAuthConfig {
    client_id: string;
    client_secret: string;
    redirect_uri: string;
    error_redirect_uri: string;
    authenticated_redirect_uri: string;
}

export interface StripeConfig {
    secret_key: string;
    webhook_secret: string;
}

export interface DefaultConfig {
    env: "development" | "production";
    origin: string[];
    server: ServerConfig;
    mongoose: MongoConfig;
    jwt: JwtConfig;
    auth: AuthConfig;
    cors: CorsConfig;
    email: EmailConfig;
    telegram: TelegramConfig;
    google_auth?: GoogleAuthConfig;
    google_storage?: GoogleStorageConfig;
    firebase?: FirebaseConfig;
    stripe?: StripeConfig;
    openrouter?: OpenRouterConfig;
    userModel: Model<BaseUser>;
}

export interface TelegramConfig {
    bot_token: string;
    chat_id: string;
}

export interface GoogleStorageConfig {
    project_id: string;
    bucket_name: string;
    private_key: string;
    client_email: string;
}

export interface FirebaseConfig {
    project_id: string;
    client_email: string;
    private_key: string;
}

export interface OpenRouterConfig {
    api_key: string;
}

export interface Config {
    env: "development" | "production";
    origin: string[];
    server?: ServerConfig;
    mongoose: MongoConfig;
    jwt?: JwtConfig;
    auth: AuthConfig;
    cors?: CorsConfig;
    email: EmailConfig;
    google_auth?: GoogleAuthConfig;
    google_storage?: GoogleStorageConfig;
    firebase?: FirebaseConfig;
    telegram: TelegramConfig;
    stripe?: StripeConfig;
    openrouter?: OpenRouterConfig;
    userModel: Model<BaseUser>;
}