import { generateText, generateObject, streamText, type LanguageModel, type CoreMessage } from "ai";
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
    const response = await generateObject({
      model,
      system,
      prompt,
      schema,
    });
    return response.object as T;
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
