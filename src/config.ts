import { Mongoose } from "mongoose";

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
    user_schema?: {
        pre?: (doc: Document) => Promise<void>;
        post?: (doc: Document) => Promise<void>;
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
    plunk?: {
        user: string;
        pass: string;
    };
    mailersend?: {
        user: string;
        pass: string;
    };
}

export interface GoogleConfig {
    client_id: string;
    client_secret: string;
    redirect_uri: string;
    error_redirect_uri: string;
    authenticated_redirect_uri: string;
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
    google?: GoogleConfig;
    telegram: TelegramConfig;
}

export interface TelegramConfig {
    bot_token: string;
    chat_id: string;
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
    google?: GoogleConfig;
    telegram: TelegramConfig;
}