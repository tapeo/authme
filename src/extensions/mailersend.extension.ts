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

        if (response.status !== 202) {
            throw new Error(`Failed to send email: ${response.statusText}`);
        }

        const statusCode = response.status;
        const responseHeaders = response.headers;

        const responseText = await response.text();

        let responseData: any;

        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = responseText;
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