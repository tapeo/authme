import { appConfig } from "..";

type Props = {
  model: string;
  temperature?: number;
  jsonSchema?: object;
};

export class OpenRouterExtension {
  private model: string;
  private temperature: number;
  private jsonSchema?: object;

  constructor({ model, jsonSchema, temperature }: Props) {
    this.model = model;
    this.jsonSchema = jsonSchema;
    this.temperature = temperature ?? 0.5;
  }

  public async completion(
    messages: { role: string; content: string }[]
  ): Promise<string> {
    const body: any = {
      model: this.model,
      allow_fallbacks: false,
      messages: messages,
      temperature: this.temperature,
    };

    if (this.jsonSchema) {
      body.provider = {
        require_parameters: true,
      };

      body.response_format = {
        type: "json_schema",
        json_schema: this.jsonSchema,
      };
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${appConfig.openrouter!.api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText
        } ${JSON.stringify(await response.text())}`
      );
    }

    const completion = await response.json();

    if (completion.error) {
      const error = JSON.stringify(completion);
      throw new Error(error);
    }

    if (!completion.choices?.[0]?.message?.content) {
      if (completion.choices?.[0]?.message?.reasoning) {
        return completion.choices[0].message.reasoning;
      }

      const error = JSON.stringify(completion);
      throw new Error(error);
    }

    return completion.choices[0].message.content;
  }
}
