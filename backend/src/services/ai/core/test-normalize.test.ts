import { expect, test } from "bun:test";
import { z } from "zod";
import { normalizeModelResponse } from "./ai.service";

const QuestionSchema = z.object({
  questions: z.array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("MULTIPLE_CHOICE"),
        prompt: z.string(),
        options: z.array(z.string()),
        explanations: z.array(z.string()),
        correctAnswer: z.number(),
      }),
      z.object({
        type: z.literal("ESSAY"),
        prompt: z.string(),
        requiresImage: z.boolean().default(false),
      })
    ])
  ),
});

test("Normalizes user's raw AI quiz response payload cleanly", () => {
  const rawPayload = {
    id: "chatcmpl-79f0d35d-3da5-4792-a509-19f7a04a47e0",
    object: "chat.completion",
    created: 1784702231,
    model: "gemini-3.6-flash-high",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: JSON.stringify({
            title: "Quiz: The Future of Development with AI",
            questions: [
              {
                id: 1,
                type: "multiple_choice",
                question: "What primary paradigm shift occurs for developers in an AI-native software workflow?",
                options: [
                  "Transitioning from manual syntax writing to system architecture, prompt design, and code verification",
                  "Replacing code review processes with manual syntax writing",
                  "Focusing exclusively on low-level binary logic without system architecture",
                  "Eliminating the need for continuous integration and unit testing"
                ],
                answer: "Transitioning from manual syntax writing to system architecture, prompt design, and code verification",
                explanation: "In an AI-native workflow, developers shift from manually writing syntax to high-level architecture..."
              },
              {
                id: 4,
                type: "essay",
                question: "Explain how the developer's role changes when managing background AI coding agents...",
                rubric: "A strong response should highlight..."
              }
            ]
          })
        }
      }
    ]
  };

  const parsed = JSON.parse(rawPayload.choices[0].message.content);
  const normalized = normalizeModelResponse(parsed);

  expect(normalized).not.toBeNull();
  if (normalized) {
    const validated = QuestionSchema.safeParse(normalized);
    expect(validated.success).toBe(true);
    if (validated.success) {
      expect(validated.data.questions[0].type).toBe("MULTIPLE_CHOICE");
      expect((validated.data.questions[0] as any).correctAnswer).toBe(0);
      expect((validated.data.questions[0] as any).prompt).toBe("What primary paradigm shift occurs for developers in an AI-native software workflow?");
      expect((validated.data.questions[1] as any).type).toBe("ESSAY");
    }
  }
});

test("Normalizes raw module list or updatedModules correctly", () => {
  const EditOutlineSchema = z.object({
    messageToUser: z.string(),
    updatedModules: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        lessons: z.array(z.object({ title: z.string() }))
      })
    )
  });

  const payload = {
    messageToUser: "I have consolidated all the modules...",
    updatedModules: [
      {
        id: "212bcad7-13e7-47da-bbc0-99b76d0c6562",
        title: "Mastering Furina",
        description: "A guide",
        orderIndex: 0,
        lessons: [
          { id: "123", title: "Lesson 1", orderIndex: 0 }
        ]
      }
    ]
  };

  const normalized = normalizeModelResponse(payload);
  const validated = EditOutlineSchema.safeParse(normalized);
  expect(validated.success).toBe(true);
  if (validated.success) {
    expect(validated.data.updatedModules[0].title).toBe("Mastering Furina");
    expect(Array.isArray(validated.data.updatedModules)).toBe(true);
  }
});
