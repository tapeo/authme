import axios from "axios";
import * as jwt from "jsonwebtoken";
import { appConfig } from "..";

interface TokenCache {
  token: string;
  expiresAt: number;
}

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any> | null;
}

export class FirebaseNotificationExtension {
  private readonly FCM_API_URL = "https://fcm.googleapis.com/v1/projects";
  private readonly OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
  private readonly SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

  private projectId: string;
  private clientEmail: string;
  private privateKey: string;
  private cachedToken: TokenCache | null = null;

  constructor() {
    this.projectId = appConfig.firebase!.project_id;
    this.clientEmail = appConfig.firebase!.client_email;

    this.privateKey = (appConfig.firebase!.private_key || "").replace(
      /\\n/g,
      "\n"
    );

    if (!this.projectId || !this.clientEmail || !this.privateKey) {
      throw new Error(
        "Missing required Firebase configuration in environment variables"
      );
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.token;
    }

    const payload = {
      iss: this.clientEmail,
      sub: this.clientEmail,
      aud: this.OAUTH_TOKEN_URL,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      scope: this.SCOPE,
    };

    const assertion = jwt.sign(payload, this.privateKey, {
      algorithm: "RS256",
    });

    const response = await axios.post(
      this.OAUTH_TOKEN_URL,
      new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = response.data.access_token;

    this.cachedToken = {
      token: accessToken,
      expiresAt: Date.now() + 3500 * 1000,
    };

    return accessToken;
  }

  /**
   * Send a push notification to a specific device token
   * @param token FCM device token to send notification to
   * @param payload Notification payload (title, body, data)
   * @returns Promise<boolean> Success status
   */
  async sendToToken(
    token: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      if (!token) {
        console.log(`Invalid FCM token provided`);
        return false;
      }

      const accessToken = await this.getAccessToken();

      const message = {
        message: {
          token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data || {},
        },
      };

      const response = await axios.post(
        `${this.FCM_API_URL}/${this.projectId}/messages:send`,
        message,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200) {
        return true;
      } else {
        console.error("FCM response error:", response.data);
        return false;
      }
    } catch (error) {
      console.error("Error sending notification to token:", error);
      return false;
    }
  }

  /**
   * Send a push notification to multiple device tokens
   * @param tokens Array of FCM device tokens to send notification to
   * @param payload Notification payload (title, body, data)
   * @returns Promise<Record<string, boolean>> Map of token to success status
   */
  async sendToTokens(
    tokens: string[],
    payload: NotificationPayload
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    await Promise.all(
      tokens.map(async (token) => {
        results[token] = await this.sendToToken(token, payload);
      })
    );

    return results;
  }
}
