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
    let normalized = normalizeModelResponse(parsed);

    // If top-level output is a raw array of modules, wrap it for EditorAssistant schema
    if (Array.isArray(normalized)) {
      const isModuleList =
        normalized.length > 0 &&
        normalized.every(
          (item) => typeof item === "object" && item !== null && ("title" in item || "lessons" in item)
        );
      if (isModuleList) {
        normalized = {
          messageToUser: "I've updated your course outline based on your request.",
          updatedModules: normalized,
        };
      }
    }

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
  const tryParse = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      // Sanitize invalid escape sequences (e.g. \S, \G, \p, \a, \x that aren't valid JSON escapes)
      const sanitized = str.replace(/\\(?:([^"\\/bfnrtu])|u(?![0-9a-fA-F]{4}))/g, (match, p1) => {
        return p1 !== undefined ? p1 : match;
      });
      return JSON.parse(sanitized);
    }
  };

  // Try direct parse first
  try {
    return tryParse(text);
  } catch {
    // Try extracting from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      try {
        return tryParse(codeBlockMatch[1].trim());
      } catch {
        // Continue to next fallback
      }
    }
    // Try extracting the first { ... } block
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return tryParse(text.slice(firstBrace, lastBrace + 1));
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
  courseSummary: "courseDescription",
  course_summary: "courseDescription",
  course_category: "courseCategory",
  course_level: "courseLevel",
  courseDifficulty: "courseLevel",
  course_difficulty: "courseLevel",
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
  lesson_description: "description",
  lessonDescription: "description",
  lesson_number: "_ignored",
  lessonNumber: "_ignored",
  lesson_summary: "_ignored",
  lessonSummary: "_ignored",
  topics: "_ignored",
  duration: "_ignored",
  moduleDuration: "_ignored",

  // Quiz question fields returned by OpenAI-compatible providers
  questionType: "type",
  question_type: "type",
  question: "prompt",
  questionText: "prompt",
  question_text: "prompt",
  choices: "options",
  correct_answer: "correctAnswer",
  correct_answer_index: "correctAnswer",
  correct_option_index: "correctAnswer",
  correctAnswerIndex: "correctAnswer",
  explanation: "explanations",
  rubric: "explanations",
  suggested_answer: "explanations",
  suggestedAnswer: "explanations",
  requires_image: "requiresImage",
  quiz_title: "_ignored",
  quizTitle: "_ignored",
  answer: "correctAnswer",
  sample_answer: "sampleAnswer",
  results: "essays",
  reviews: "essays",
  feedback: "rationale",

  // Block fields
  correct_index: "correctIndex",
  expected_output: "expectedOutput",
};

const LOWERCASE_ALIASES = Object.fromEntries(
  Object.entries(KEY_ALIASES).map(([k, v]) => [k.toLowerCase(), v])
);

export function normalizeModelResponse(value: unknown): unknown {
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
      } else if (mapped === "type" && typeof normalized === "string") {
        const lowerNorm = normalized.toLowerCase();
        if (lowerNorm === "multiple_choice" || lowerNorm === "multiple choice" || lowerNorm === "multiple-choice") {
          result[mapped] = "MULTIPLE_CHOICE";
        } else if (lowerNorm === "essay") {
          result[mapped] = "ESSAY";
        } else if (normalized === "MULTIPLE_CHOICE" || normalized === "ESSAY") {
          result[mapped] = normalized;
        } else {
          // Normalizes block types like interactive_quiz -> interactive-quiz
          result[mapped] = normalized.replace(/_/g, "-");
        }
      } else {
        result[mapped] = normalized;
      }
    }

    // Infer missing `type` for quiz question objects if missing (common with OpenAI / Gemini proxy outputs)
    if (!result.type) {
      if (Array.isArray(result.options) || result.correctAnswer !== undefined || (result as any).correctAnswerIndex !== undefined) {
        result.type = "MULTIPLE_CHOICE";
      } else if (result.prompt && typeof result.prompt === "string") {
        result.type = "ESSAY";
      }
    }

    // Post-process quiz question objects
    if (result.type === "MULTIPLE_CHOICE") {
      if (Array.isArray(result.options)) {
        result.options = result.options.map((opt) => String(opt));
      } else {
        result.options = [];
      }

      if (typeof result.correctAnswer === "string") {
        const trimmedAnswer = result.correctAnswer.trim();
        const num = parseInt(trimmedAnswer, 10);
        if (!isNaN(num) && String(num) === trimmedAnswer) {
          result.correctAnswer = num;
        } else if (Array.isArray(result.options) && result.options.length > 0) {
          const matchedIndex = result.options.findIndex(
            (opt: any) => String(opt).trim().toLowerCase() === trimmedAnswer.toLowerCase()
          );
          result.correctAnswer = matchedIndex !== -1 ? matchedIndex : 0;
        } else {
          result.correctAnswer = 0;
        }
      } else if (typeof result.correctAnswer !== "number" || isNaN(result.correctAnswer)) {
        result.correctAnswer = 0;
      }

      if (typeof result.explanations === "string") {
        const singleExp = result.explanations;
        result.explanations = (result.options as string[]).map(() => singleExp);
      } else if (!Array.isArray(result.explanations) || result.explanations.length === 0) {
        const fallbackExp = typeof result.explanation === "string"
          ? result.explanation
          : "Explanation for option.";
        result.explanations = (result.options as string[]).map(() => fallbackExp);
      }
    } else if (result.type === "ESSAY") {
      if (typeof result.requiresImage !== "boolean") {
        result.requiresImage = false;
      }
    } else if (result.type === "interactive-quiz") {
      // interactive-quiz blocks require "question" and "explanation"
      if (!result.question && typeof result.prompt === "string") {
        result.question = result.prompt;
      }
      if (!result.explanation) {
        if (typeof result.explanations === "string") {
          result.explanation = result.explanations;
        } else if (Array.isArray(result.explanations) && result.explanations.length > 0) {
          result.explanation = String(result.explanations[0]);
        }
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
      if (!result.courseDescription) {
        result.courseDescription = (result.courseTitle as string) || "A comprehensive course on this topic.";
      }
      if (Array.isArray(result.modules)) {
        for (const mod of result.modules) {
          if (typeof mod === "object" && mod !== null) {
            if (!mod.description) {
              mod.description = (mod.title as string) || "No description provided.";
            }
            if (Array.isArray(mod.lessons)) {
              mod.lessons = mod.lessons.map((lesson: any) => {
                if (typeof lesson === "string") {
                  return { title: lesson, description: lesson };
                }
                return lesson;
              });
            }
          }
        }
      }
    }

    // Handle EditorAssistant schema normalization
    if (Array.isArray(result.modules) && !result.updatedModules) {
      result.updatedModules = result.modules;
    }
    if (Array.isArray(result.updatedModules)) {
      if (!result.messageToUser) {
        result.messageToUser = (result.message as string) || (result.reply as string) || "I've updated your course outline based on your request.";
      }
      for (const mod of result.updatedModules as any[]) {
        if (typeof mod === "object" && mod !== null) {
          if (!mod.description) {
            mod.description = (mod.title as string) || "No description provided.";
          }
          if (Array.isArray(mod.lessons)) {
            mod.lessons = mod.lessons.map((lesson: any) => {
              if (typeof lesson === "string") {
                return { title: lesson };
              }
              return lesson;
            });
          }
        }
      }
    }

    // Merge separate question arrays from some OpenAI-compatible providers
    const mcqsRaw = result.multiple_choice_questions || result.multipleChoiceQuestions || result.multiple_choice || result.multipleChoice;
    const mcqs = Array.isArray(mcqsRaw) ? mcqsRaw : (mcqsRaw && typeof mcqsRaw === "object" ? [mcqsRaw] : null);

    const eqsRaw = result.essay_questions || result.essayQuestions || result.essay;
    const eqs = Array.isArray(eqsRaw) ? eqsRaw : (eqsRaw && typeof eqsRaw === "object" ? [eqsRaw] : null);

    if (mcqs || eqs) {
      if (!Array.isArray(result.questions)) {
        result.questions = [];
      }
      if (mcqs) {
        for (const q of mcqs) {
          if (typeof q === "object" && q !== null) {
             (q as any).type = "MULTIPLE_CHOICE";
             (result.questions as any[]).push(q);
          }
        }
        delete result.multiple_choice_questions;
        delete result.multipleChoiceQuestions;
        delete result.multiple_choice;
        delete result.multipleChoice;
      }
      if (eqs) {
        for (const q of eqs) {
          if (typeof q === "object" && q !== null) {
             (q as any).type = "ESSAY";
             (result.questions as any[]).push(q);
          }
        }
        delete result.essay_questions;
        delete result.essayQuestions;
        delete result.essay;
      }
    }

    // Handle hallucinated essay review format (map of questionId -> { score, rationale })
    const keys = Object.keys(result);
    if (!result.essays && !result.aggregateFeedback && keys.length > 0) {
      const isMap = keys.every(key => {
        const val = result[key];
        return typeof val === "object" && val !== null && ("score" in val || "rationale" in val);
      });
      if (isMap) {
        const essays: any[] = [];
        for (const [qId, reviewObj] of Object.entries(result)) {
          if (typeof reviewObj === "object" && reviewObj !== null) {
            essays.push({
              questionId: qId,
              ...reviewObj
            });
          }
          delete result[qId];
        }
        result.essays = essays;
      }
    }

    // Fix up hallucinated string correctAnswers in MULTIPLE_CHOICE questions
    if (Array.isArray(result.questions)) {
      for (const q of result.questions) {
        if (typeof q === "object" && q !== null && q.type === "MULTIPLE_CHOICE") {
          if (typeof q.correctAnswer === "string" && Array.isArray(q.options)) {
            const idx = q.options.findIndex((opt: unknown) => 
              typeof opt === "string" && opt.trim() === (q.correctAnswer as string).trim()
            );
            if (idx !== -1) {
              q.correctAnswer = idx;
            } else {
              const partialIdx = q.options.findIndex((opt: unknown) => 
                typeof opt === "string" && opt.toLowerCase().includes((q.correctAnswer as string).toLowerCase())
              );
              q.correctAnswer = partialIdx !== -1 ? partialIdx : 0;
            }
          }
        }
      }
    }

    // Fix up EssayReview object if it looks like one (has essays array)
    if (Array.isArray(result.essays)) {
      if (result.schemaVersion === undefined) {
        result.schemaVersion = 1;
      }
      if (!result.aggregateFeedback || typeof result.aggregateFeedback !== "string") {
        result.aggregateFeedback = "Review completed by AI.";
      }
      for (const essay of result.essays) {
        if (typeof essay === "object" && essay !== null) {
          const e = essay as Record<string, unknown>;
          if (!Array.isArray(e.strengths)) {
            e.strengths = [];
          }
          if (!Array.isArray(e.improvements)) {
            e.improvements = [];
          }
        }
      }
    }

    return result;
  }
  return value;
}
