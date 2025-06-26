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

export class MailerSendExtension {
    static async sendEmail(params: MailerSendSendEmailRequest): Promise<void> {
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
            console.log(response);
            throw new Error(`Failed to send email: ${response.statusText}`);
        }
    }
}