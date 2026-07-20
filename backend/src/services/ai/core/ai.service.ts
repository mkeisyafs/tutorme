import {
  generateText,
  type LanguageModel,
  type CoreMessage,
} from "ai";
import { z } from "zod";
import { getDefaultModel } from "./ai-providers";

export class AiService {
  /**
   * Generates a plain text response.
   */
  static async text(prompt: string, model: LanguageModel = getDefaultModel(), system?: string, tools?: any) {
    const response = await generateText({
      model,
      system,
      prompt,
      tools,
      maxSteps: tools ? 5 : 1, // Allow tool calling loops if tools are provided
    });
    return response.text;
  }

  /**
   * Generates a structured JSON object conforming to a Zod schema.
   */
  static async structuredObject<T>(prompt: string, schema: any, model: LanguageModel = getDefaultModel(), system?: string) {
    const jsonSchema = JSON.stringify(z.toJSONSchema(schema));
    const structuredSystem = [
      system,
      "Return only one valid JSON object that satisfies the JSON Schema below.",
      "Do not include Markdown code fences, headings, explanations, or any text outside the JSON object.",
      `JSON Schema:\n${jsonSchema}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const response = await generateText({
      model,
      system: structuredSystem,
      prompt,
      maxOutputTokens: 4096,
    });

    const fencedJson = response.text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    const jsonText = (fencedJson?.[1] ?? response.text).trim();
    return schema.parse(JSON.parse(jsonText)) as T;
  }

  /**
   * Continues a conversation given an array of messages.
   */
  static async chat(messages: CoreMessage[], model: LanguageModel = getDefaultModel(), system?: string) {
    const response = await generateText({
      model,
      system,
      messages,
    });
    return response.text;
  }
}
