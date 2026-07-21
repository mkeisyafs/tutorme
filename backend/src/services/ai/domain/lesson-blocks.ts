import { z } from "zod";

export const BlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("objective"),
    title: z.string(),
    content: z.string(),
  }),
  z.object({
    type: z.literal("paragraph"),
    content: z.string(),
  }),
  z.object({
    type: z.literal("analogy"),
    title: z.string(),
    content: z.string(),
  }),
  z.object({
    type: z.literal("example"),
    title: z.string(),
    content: z.string(),
  }),
  z.object({
    type: z.literal("warning"),
    title: z.string(),
    items: z.array(z.string()),
  }),
  z.object({
    type: z.literal("summary"),
    content: z.string(),
  }),
  z.object({
    type: z.literal("interactive-quiz"),
    question: z.string(),
    options: z.array(z.string()),
    correctIndex: z.number(),
    explanation: z.string(),
  }),
  z.object({
    type: z.literal("flashcard"),
    front: z.string(),
    back: z.string(),
  }),
  z.object({
    type: z.literal("interactive-reveal"),
    summary: z.string(),
    details: z.string(),
  }),
  z.object({
    type: z.literal("code-sandbox"),
    code: z.string(),
    language: z.string(),
    expectedOutput: z.string(),
    instructions: z.string(),
  }),
]);

export const LessonBlocksSchema = z.object({
  title: z.string(),
  blocks: z.array(BlockSchema),
});

export type Block = z.infer<typeof BlockSchema>;
export type LessonBlocks = z.infer<typeof LessonBlocksSchema>;

export function getLessonPlainContent(content: string | null | undefined): string {
  if (!content) return "";
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.blocks)) {
      return parsed.blocks
        .map((block: any) => {
          if (
            block.type === "paragraph" ||
            block.type === "objective" ||
            block.type === "analogy" ||
            block.type === "example" ||
            block.type === "summary"
          ) {
            return `${block.title ? `### ${block.title}\n` : ""}${block.content}`;
          } else if (block.type === "warning") {
            return `${block.title ? `### ${block.title}\n` : ""}${block.items.map((it: string) => `- ${it}`).join("\n")}`;
          } else if (block.type === "code-sandbox") {
            return `${block.instructions ? `${block.instructions}\n` : ""}\`\`\`${block.language || "python"}\n${block.code}\n\`\`\``;
          } else if (block.type === "flashcard") {
            return `Flashcard:\nFront: ${block.front}\nBack: ${block.back}`;
          } else if (block.type === "interactive-quiz") {
            return `Question: ${block.question}\nOptions:\n${block.options.map((o: string, idx: number) => `${idx + 1}. ${o}`).join("\n")}\nExplanation: ${block.explanation}`;
          } else if (block.type === "interactive-reveal") {
            return `Reveal:\nSummary: ${block.summary}\nDetails: ${block.details}`;
          }
          return "";
        })
        .join("\n\n");
    }
  } catch (e) {
    // Not valid JSON, return as-is
  }
  return content;
}
