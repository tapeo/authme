export interface MailerSendFrom {
    email: string;
    name?: string;
}

export interface MailerSendRecipient {
    email: string;
    name?: string;
}

export interface MailerSendSendEmailRequest {
    from: MailerSendFrom;
    to: MailerSendRecipient[];
    subject: string;
    html: string;
    apiKey: string;
}

export interface MailerSendSendEmailResponse {
    status: number;
    headers: Headers;
    data: any;
    messageId?: string | null;
}

export class MailerSendExtension {
    static async sendEmail(params: MailerSendSendEmailRequest): Promise<MailerSendSendEmailResponse> {
        const { apiKey, ...bodyParams } = params;

        const response = await fetch("https://api.mailersend.com/v1/email", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyParams),
        });

        const statusCode = response.status;
        const responseHeaders = response.headers;
        let responseData: any;
        try {
            responseData = await response.json();
        } catch (e) {
            responseData = await response.text();
        }

        const messageId = responseHeaders.get('x-message-id');

        return {
            status: statusCode,
            headers: responseHeaders,
            data: responseData,
            messageId: messageId
        };
    }
}