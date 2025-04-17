export class Config {
    static oneMinuteMillis = 60 * 1000;
    static oneHourMillis = Config.oneMinuteMillis * 60;
    static oneDayMillis = Config.oneHourMillis * 24;

    static get jwtAccessTokenExpiresIn() {
        return process.env.ENV === "development" ? "1m" : "15m";
    }

    static get jwtRefreshTokenExpiresIn() {
        return process.env.ENV === "development" ? "5m" : "30d";
    }

    static get cookieAccessTokenMaxAge() {
        return process.env.ENV === "development" ? this.oneMinuteMillis : this.oneMinuteMillis * 15;
    }

    static get cookieRefreshTokenMaxAge() {
        return process.env.ENV === "development" ? this.oneMinuteMillis * 5 : this.oneDayMillis * 30;
    }
}
