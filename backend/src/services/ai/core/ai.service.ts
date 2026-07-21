import {
  generateText,
  type LanguageModel,
} from "ai";
import { zodToJsonSchema } from "zod-to-json-schema";
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
    });
    return response.text;
  }

  /**
   * Generates a structured JSON object conforming to a Zod schema.
   *
   * Uses a plain `generateText` call (no `response_format` constraint) because
   * this provider returns an empty response for any request that includes
   * `response_format`. The schema is injected into the system prompt and the
   * response is parsed, field-name-normalized, and Zod-validated manually.
   */
  static async structuredObject<T>(prompt: string, schema: any, model: LanguageModel = getDefaultModel(), system?: string) {
    const jsonSchema = zodToJsonSchema(schema, { $refStrategy: "none" });
    // Strip noisy JSON Schema meta fields; the model only needs the structure
    const { $schema: _s, definitions: _d, ...cleanSchema } = jsonSchema as any;

    const systemWithSchema = [
      system ?? "You are a helpful assistant.",
      "\n\nCRITICAL: Respond with ONLY a raw JSON object. No markdown, no code blocks, no explanation.",
      "Output ONLY the JSON, starting with { and ending with }.",
      "CRITICAL: The JSON keys MUST be exactly as specified in the schema. Do NOT translate the JSON keys to other languages. Only translate the values.",
      "Your response MUST match this JSON schema:\n" + JSON.stringify(cleanSchema, null, 2),
    ].join("\n");

    const response = await generateText({
      model,
      system: systemWithSchema,
      prompt,
    });

    const parsed = extractAndParseJson(response.text);
    const normalized = normalizeModelResponse(parsed);

    const validationResult = schema.safeParse(normalized);
    if (!validationResult.success) {
      console.error(
        "[AiService] Schema validation failed:",
        JSON.stringify(validationResult.error.issues, null, 2)
      );
      console.error("[AiService] Raw parsed output:", JSON.stringify(parsed, null, 2));
      console.error("[AiService] Normalized output:", JSON.stringify(normalized, null, 2));
      throw new Error(
        `Structured generation failed schema validation: ${validationResult.error.message}`
      );
    }

    return validationResult.data as T;
  }

  /**
   * Continues a conversation given an array of messages.
   */
  static async chat(messages: any[], model: LanguageModel = getDefaultModel(), system?: string) {
    const response = await generateText({
      model,
      system,
      messages,
    });
    return response.text;
  }
}

/**
 * Extracts a JSON object from a text response that may contain markdown
 * code fences or other surrounding text.
 */
function extractAndParseJson(text: string): unknown {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim());
    }
    // Try extracting the first { ... } block
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("Could not extract JSON from model response");
  }
}

/**
 * Recursively normalizes field names from a model response.
 * Models served via OpenAI-compatible proxies often return snake_case or verbose
 * field names (e.g. `module_title`, `lesson_title`, `course_title`) that don't
 * match the camelCase Zod schema. This function remaps the most common aliases.
 */
const KEY_ALIASES: Record<string, string> = {
  // Top-level course fields — long snake_case form
  course_title: "courseTitle",
  course_description: "courseDescription",
  course_category: "courseCategory",
  course_level: "courseLevel",
  difficulty_level: "courseLevel",
  // Short-form (what claude-sonnet returns)
  description: "courseDescription",
  category: "courseCategory",
  level: "courseLevel",
  // Extra fields that don't belong in the schema — mapped to a dummy key
  // so Zod's strip() silently ignores them
  target_audience: "_ignored",
  targetAudience: "_ignored",
  learning_objectives: "_ignored",
  learningObjectives: "_ignored",
  estimatedDuration: "_ignored",
  prerequisites: "_ignored",
  assessmentStrategy: "_ignored",
  resources: "_ignored",

  // Module fields — long form
  module_title: "title",
  moduleTitle: "title",
  module_description: "description",
  moduleDescription: "description",
  module_number: "_ignored",
  moduleNumber: "_ignored",

  // Lesson fields — long form
  lesson_title: "title",
  lessonTitle: "title",
  lesson_number: "_ignored",
  lessonNumber: "_ignored",
  lesson_summary: "_ignored",
  lessonSummary: "_ignored",
  topics: "_ignored",
  duration: "_ignored",
  moduleDuration: "_ignored",

  // Quiz question fields returned by OpenAI-compatible providers
  question: "prompt",
  correct_answer: "correctAnswer",
  correct_answer_index: "correctAnswer",
  correctAnswerIndex: "correctAnswer",
  requires_image: "requiresImage",
  quiz_title: "_ignored",
  quizTitle: "_ignored"
};

const LOWERCASE_ALIASES = Object.fromEntries(
  Object.entries(KEY_ALIASES).map(([k, v]) => [k.toLowerCase(), v])
);

function normalizeModelResponse(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeModelResponse);
  }
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(obj)) {
      const normalized = normalizeModelResponse(val);
      const mapped = LOWERCASE_ALIASES[key.toLowerCase()] ?? KEY_ALIASES[key] ?? key;
      // Capitalize enum values for courseLevel (model may return lowercase)
      if (mapped === "courseLevel" && typeof normalized === "string") {
        result[mapped] = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
      } else if (mapped === "type" && normalized === "multiple_choice") {
        result[mapped] = "MULTIPLE_CHOICE";
      } else if (mapped === "type" && normalized === "essay") {
        result[mapped] = "ESSAY";
      } else {
        result[mapped] = normalized;
      }
    }

    // Inject missing required top-level fields if this looks like the root course object
    if (result.courseTitle || result.modules) {
      if (!result.courseCategory) {
        result.courseCategory = "Uncategorized";
      }
      if (!result.courseLevel || !["Beginner", "Intermediate", "Advanced"].includes(result.courseLevel as string)) {
        result.courseLevel = "Beginner";
      }
      if (Array.isArray(result.modules)) {
        for (const mod of result.modules) {
          if (typeof mod === "object" && mod !== null) {
            if (!mod.description) {
              mod.description = (mod.title as string) || "No description provided.";
            }
          }
        }
      }
    }

    return result;
  }
  return value;
}
