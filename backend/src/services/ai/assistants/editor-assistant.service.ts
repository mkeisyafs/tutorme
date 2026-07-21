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

Always respond with the COMPLETE, updated list of modules and lessons, along with a message explaining what you changed based on the user's latest request.`;

    const result = await AiService.structuredObject<z.infer<typeof EditOutlineSchema>>(
      // We pass the conversation history as a formatted string for the generateObject prompt
      messages.map(m => `${m.role}: ${m.content}`).join("\\n"),
      EditOutlineSchema,
      getDefaultModel(),
      system
    );

    // Map back to our Draft format, preserving order
    draft.modules = result.updatedModules.map((m, mIndex) => ({
      id: crypto.randomUUID(),
      title: m.title,
      description: m.description,
      orderIndex: mIndex,
      lessons: m.lessons.map((l, lIndex) => ({
        id: crypto.randomUUID(),
        title: l.title,
        orderIndex: lIndex,
      })),
    }));

    // Update cache
    outlineCache.update(draftId, { modules: draft.modules });

    return {
      reply: result.messageToUser,
      draft,
    };
  }
}
