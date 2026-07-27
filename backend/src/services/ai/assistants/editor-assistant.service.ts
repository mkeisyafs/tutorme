import { AiService } from "../core/ai.service";
import { outlineCache } from "../domain/outline-cache.service";
import { z } from "zod";
import crypto from "crypto";

import { getDefaultModel } from "../core/ai-providers";

// We re-use a schema similar to the generator, but for editing
const EditOutlineSchema = z.object({
  messageToUser: z.string().describe("A conversational response explaining the changes made."),
  updatedModules: z.array(
    z.object({
      title: z.string().describe("Module title"),
      description: z.string().describe("Brief description of the module"),
      lessons: z.array(
        z.object({
          title: z.string().describe("Lesson title"),
        })
      ),
    })
  ).describe("The completely updated list of modules and lessons"),
});

export class EditorAssistantService {
  /**
   * Modifies an existing draft outline based on user chat instructions.
   */
  static async chatWithEditor(draftId: string, messages: any[]) {
    const draft = outlineCache.get(draftId);
    if (!draft) throw new Error("Draft not found.");

    // The system prompt injects the current state of the outline
    const system = `You are a Course Editor AI. Your job is to help the user refine their course outline.
You can add, remove, rename, or reorder modules and lessons.
Here is the CURRENT state of the course outline (JSON):
${JSON.stringify(draft.modules, null, 2)}

Respond with a JSON object containing:
1. "messageToUser": A clear, helpful response explaining what you changed based on the user's request.
2. "updatedModules": The complete updated list of modules and lessons. Each module must have "title", "description", and "lessons" (array of objects with "title").`;

    const formattedMessages = messages.map(m => `${m.role}: ${m.content}`).join("\n");

    const result = await AiService.structuredObject<z.infer<typeof EditOutlineSchema>>(
      formattedMessages,
      EditOutlineSchema,
      getDefaultModel(),
      system
    );

    // Map back to our Draft format, preserving order
    draft.modules = result.updatedModules.map((m: any, mIndex: number) => ({
      id: crypto.randomUUID(),
      title: m.title || `Module ${mIndex + 1}`,
      description: m.description || null,
      orderIndex: mIndex,
      lessons: Array.isArray(m.lessons)
        ? m.lessons.map((l: any, lIndex: number) => ({
            id: crypto.randomUUID(),
            title: typeof l === "string" ? l : l?.title || `Lesson ${lIndex + 1}`,
            orderIndex: lIndex,
          }))
        : [],
    }));

    // Update cache
    outlineCache.update(draftId, { modules: draft.modules });

    return {
      reply: result.messageToUser,
      draft,
    };
  }
}
