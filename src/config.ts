import { Mongoose } from "mongoose";

export interface ServerConfig {
    host: string;
    port: number;
    https: boolean;
}

export interface MongoConfig {
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
    useOtp: boolean;
}

export interface CorsConfig {
    allowedHeaders: string[];
}

export interface EmailConfig {
    name: string;
    from: string;
}

export interface DefaultConfig {
    server: ServerConfig;
    mongoose: MongoConfig;
    jwt: JwtConfig;
    auth: AuthConfig;
    cors: CorsConfig;
    email: EmailConfig;
}