import { createOpenAI } from "@ai-sdk/openai";

// Create a customized OpenAI provider that can connect to any OpenAI-compatible 
// endpoint (e.g. LM Studio, Ollama, Groq, vLLM, or official OpenAI)
const customProvider = createOpenAI({
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL,
});

export function getDefaultModel() {
  return customProvider(process.env.AI_DEFAULT_MODEL || "gpt-4o-mini");
}

export function getPowerfulModel() {
  return customProvider(process.env.AI_POWERFUL_MODEL || "gpt-4o");
}
