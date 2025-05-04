export interface PlunkCreateCampaignRequest {
  subject: string;
  body: string;
  recipients: string[];
  style?: 'PLUNK' | 'HTML';
  apiKey: string;
}

export interface PlunkCreateCampaignResponseData {
  id: string;
  subject: string;
  body: string;
  status: string;
  delivered: string | null;
  style: 'PLUNK' | 'HTML';
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlunkCreateCampaignResponse {
  status: number;
  data: PlunkCreateCampaignResponseData | any;
}

export interface PlunkSendCampaignRequest {
  id: string;
  live?: boolean;
  delay?: number;
  apiKey: string;
}

export interface PlunkSendCampaignResponse {
  status: number;
  data: any;
}

export interface PlunkSendTransactionalEmailRequest {
  to: string | string[];
  subject: string;
  body: string;
  subscribed?: boolean;
  name?: string;
  from?: string;
  reply?: string;
  headers?: Record<string, string>;
  apiKey: string;
}

export interface PlunkContactObject {
  id: string;
  email: string;
}

export interface EmailObject {
  contact: PlunkContactObject;
  email: string;
}

export interface PlunkSendTransactionalEmailResponseData {
  success: boolean;
  emails: EmailObject[];
  timestamp: string;
}

export interface PlunkSendTransactionalEmailResponse {
  status: number;
  data: PlunkSendTransactionalEmailResponseData | any;
}

export class PlunkExtension {
  static async sendTransactional(params: PlunkSendTransactionalEmailRequest): Promise<PlunkSendTransactionalEmailResponse> {
    const response = await fetch("https://api.useplunk.com/v1/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const statusCode = response.status;
    const json = await response.json();

    return {
      status: statusCode,
      data: json,
    };
  }

  static async createCampaign(params: PlunkCreateCampaignRequest): Promise<PlunkCreateCampaignResponse> {
    const { apiKey, ...bodyParams } = params;
    const response = await fetch("https://api.useplunk.com/v1/campaigns", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyParams),
    });

    const statusCode = response.status;
    const json = await response.json();

    return {
      status: statusCode,
      data: json,
    };
  }

  static async sendCampaign(params: PlunkSendCampaignRequest): Promise<PlunkSendCampaignResponse> {
    const { apiKey, ...bodyParams } = params;
    const response = await fetch("https://api.useplunk.com/v1/campaigns/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyParams),
    });

    const statusCode = response.status;
    const json = await response.json();

    return {
      status: statusCode,
      data: json,
    };
  }
}