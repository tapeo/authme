export class Config {
    static oneMinuteInSeconds = 60;
    static oneHourInSeconds = Config.oneMinuteInSeconds * 60;
    static oneDayInSeconds = Config.oneHourInSeconds * 24;

    static get jwtAccessTokenExpiresIn() {
        return process.env.ENV === "development" ? "1m" : "15m";
    }

    static get jwtRefreshTokenExpiresIn() {
        return process.env.ENV === "development" ? "5m" : "30d";
    }

    static get cookieAccessTokenExpiresIn() {
        return process.env.ENV === "development" ? this.oneMinuteInSeconds : this.oneMinuteInSeconds * 15;
    }

    static get cookieRefreshTokenExpiresIn() {
        return process.env.ENV === "development" ? this.oneMinuteInSeconds * 5 : this.oneDayInSeconds * 30;
    }
}
