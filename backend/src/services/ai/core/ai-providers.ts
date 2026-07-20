import { createOpenAI } from "@ai-sdk/openai";

// This provider is OpenAI-compatible but expects an explicit `stream: false`
// for non-streaming Chat Completions requests. The AI SDK omits that field for
// generateText/generateObject calls, which the provider otherwise rejects with
// a misleading 200 upstream_error response. Preserve explicit streaming calls.
const openAICompatibleFetch: typeof fetch = async (input, init) => {
  if (typeof init?.body !== "string") {
    return fetch(input, init);
  }

  try {
    const body = JSON.parse(init.body) as Record<string, unknown>;
    if (body && typeof body === "object" && body.stream === undefined) {
      return fetch(input, {
        ...init,
        body: JSON.stringify({ ...body, stream: false }),
      });
    }
  } catch {
    // Forward non-JSON requests unchanged.
  }

  return fetch(input, init);
};

// Create a customized OpenAI provider that can connect to any OpenAI-compatible 
// endpoint (e.g. LM Studio, Ollama, Groq, vLLM, or official OpenAI)
const customProvider = createOpenAI({
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL,
  fetch: openAICompatibleFetch,
});

export function getDefaultModel() {
  // Use the OpenAI-compatible Chat Completions endpoint. Some compatible
  // providers expose this endpoint but do not implement the Responses API.
  return customProvider.chat(process.env.AI_DEFAULT_MODEL || "gpt-4o-mini");
}

export function getPowerfulModel() {
  return customProvider.chat(process.env.AI_POWERFUL_MODEL || "gpt-4o");
}
