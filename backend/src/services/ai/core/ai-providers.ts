import { createOpenAI } from "@ai-sdk/openai";

// This provider requires an explicit `stream: false` on every non-streaming
// Chat Completions request. AI SDK v7 changed generateText/generateObject to
// use streaming internally (sends stream: true by default), so the old
// `stream === undefined` guard no longer works. We force stream: false on
// every request. Streaming responses (from streamText/streamObject) set up
// their own SSE parsers, so this only affects non-streaming callers.
const openAICompatibleFetch: typeof fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input.toString();
  console.debug("[ai-providers] → URL:", url);

  if (typeof init?.body !== "string") {
    return fetch(input, init);
  }

  try {
    const body = JSON.parse(init.body) as Record<string, unknown>;
    console.debug("[ai-providers] → body keys:", Object.keys(body));
    console.debug("[ai-providers] → stream:", body.stream, "model:", body.model);

    const newBody = JSON.stringify({ ...body, stream: false });
    const response = await fetch(input, { ...init, body: newBody });

    // Clone so we can read the body for debugging without consuming the real response
    const clone = response.clone();
    const rawText = await clone.text();
    console.debug("[ai-providers] ← status:", response.status);
    console.debug("[ai-providers] ← body (first 300):", rawText.substring(0, 300));

    return response;
  } catch (e) {
    console.error("[ai-providers] fetch error:", e);
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
