import { z } from "zod";

const REQUIRED_GENERATED_BLOCK_TYPES = [
  "objective",
  "paragraph",
  "analogy",
  "example",
  "warning",
  "summary",
  "interactive-quiz",
  "flashcard",
  "interactive-reveal",
  "code-sandbox",
] as const;
const RENDERER_EXECUTABLE_CODE_LANGUAGES = ["python", "py", "javascript", "js"] as const;
const FENCED_CODE_BLOCK_PATTERN = /```([^\n`]*)\n([\s\S]*?)```/g;

type RequiredGeneratedBlockType = (typeof REQUIRED_GENERATED_BLOCK_TYPES)[number];

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
  z.object({
    type: z.literal("image"),
    url: z.string().url(),
    caption: z.string(),
    altText: z.string().optional(),
  }),
]);

export const LessonBlocksSchema = z.object({
  title: z.string(),
  blocks: z.array(BlockSchema),
});

export type Block = z.infer<typeof BlockSchema>;
export type LessonBlocks = z.infer<typeof LessonBlocksSchema>;

function hasBlockType(blocks: readonly Block[], blockType: RequiredGeneratedBlockType): boolean {
  return blocks.some((block) => block.type === blockType);
}

function hasRendererExecutableCodeFence(markdownContent: string): boolean {
  for (const match of markdownContent.matchAll(FENCED_CODE_BLOCK_PATTERN)) {
    const language = match[1]?.trim().toLowerCase();
    const code = match[2]?.trim();

    if (language && code && RENDERER_EXECUTABLE_CODE_LANGUAGES.some((candidate) => candidate === language)) {
      return true;
    }
  }

  return false;
}

export function createLessonBlocksSchema(markdownContent: string, allowedImageUrls: readonly string[] = []) {
  const hasExecutableCode = hasRendererExecutableCodeFence(markdownContent);
  const allowedImages = new Set(allowedImageUrls);

  return LessonBlocksSchema.superRefine((lesson, context) => {
    for (const block of lesson.blocks) {
      // Reject hallucinated image URLs: only retrieved images may be rendered.
      if (block.type === "image" && !allowedImages.has(block.url)) {
        context.addIssue({
          code: "custom",
          path: ["blocks"],
          message: `Image block URL must come from the retrieved image list: ${block.url}`,
        });
      }
    }

    for (const blockType of REQUIRED_GENERATED_BLOCK_TYPES) {
      if (blockType === "code-sandbox" && !hasExecutableCode) {
        continue;
      }
      if (!hasBlockType(lesson.blocks, blockType)) {
        context.addIssue({
          code: "custom",
          path: ["blocks"],
          message: `Generated lesson blocks must include at least one ${blockType} block.`,
        });
      }
    }

    if (!hasExecutableCode && lesson.blocks.some((block) => block.type === "code-sandbox")) {
      context.addIssue({
        code: "custom",
        path: ["blocks"],
        message: "code-sandbox blocks require a fenced Python or JavaScript source example.",
      });
    }
  });
}

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
          } else if (block.type === "image") {
            return `![${block.altText || block.caption}](${block.url})`;
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
