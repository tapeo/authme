type Props = {
  text: string;
};

export class Telegram {
  public static send = async ({ text }: Props) => {
    const body = {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: text,
    };

    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      console.error("Failed to send message to Telegram", body, response);
      throw new Error("Failed to send message to Telegram");
    }
  };
}
