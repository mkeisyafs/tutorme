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
    const seenImageUrls = new Set<string>();
    for (const block of lesson.blocks) {
      // Reject hallucinated image URLs: only retrieved images may be rendered.
      if (block.type === "image") {
        if (!allowedImages.has(block.url)) {
          context.addIssue({
            code: "custom",
            path: ["blocks"],
            message: `Image block URL must come from the retrieved image list: ${block.url}`,
          });
        }
        if (seenImageUrls.has(block.url)) {
          context.addIssue({
            code: "custom",
            path: ["blocks"],
            message: `Duplicate image URL detected: ${block.url}. Each image in a lesson must be unique.`,
          });
        }
        seenImageUrls.add(block.url);
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

/**
 * ponytail: content-preserving fallback when AI block conversion fails. Only emits
 * blocks whose content comes from the actual markdown — no generic filler
 * analogies/warnings/quizzes. Upgrade path: a cheaper AI enrichment pass.
 */
export function buildRepairedLessonBlocks(
  lessonTitle: string,
  markdownContent: string,
  images: { url: string; title: string; altText: string }[] = []
): LessonBlocks {
  const isIndonesian = /\b(dan|yang|di|ini|itu|untuk|dari|dengan|kucing|pelajaran|ras|adalah|secara|beberapa|memiliki|mengapa|apa|bagaimana)\b/i.test(`${lessonTitle} ${markdownContent}`);

  // Pre-extract all multiline <details>...</details> elements
  const reveals: { placeholder: string; summary: string; details: string }[] = [];
  let processedMarkdown = markdownContent.replace(/<details>([\s\S]*?)(?:<\/details>|(?=\n#{1,6}\s)|$)/gi, (_, inner) => {
    const summaryMatch = inner.match(/<summary>([\s\S]*?)<\/summary>/i);
    const summaryText = summaryMatch ? summaryMatch[1].replace(/<[^>]+>/g, "").trim() : (isIndonesian ? "Klik untuk melihat Detail / Jawaban" : "Click to Reveal Details");
    let detailsText = inner.replace(/<summary>[\s\S]*?<\/summary>/i, "").replace(/<\/details>/gi, "").trim();
    if (!summaryText || !detailsText) return "";

    const placeholder = `___REVEAL_BLOCK_${reveals.length}___`;
    reveals.push({ placeholder, summary: summaryText, details: detailsText });
    return `\n\n${placeholder}\n\n`;
  });

  // Split by headings or double newlines to isolate logical section cards
  const rawSections = processedMarkdown
    .split(/(?=\n#{1,6}\s)/)
    .map((s) => s.trim())
    .filter(Boolean);

  const blocks: LessonBlocks["blocks"] = [
    {
      type: "objective",
      title: isIndonesian ? "Tujuan Pembelajaran" : "Learning Objectives",
      content: isIndonesian
        ? `Kuasai konsep kunci, istilah penting, dan penerapan praktis dari ${lessonTitle}.`
        : `Master the key concepts, core terms, and practical applications of ${lessonTitle}.`,
    },
  ];

  rawSections.forEach((section) => {
    const paragraphs = section.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

    paragraphs.forEach((p, idx) => {
      // 1. Placeholder match for pre-extracted multiline reveals
      const revealPlaceholderMatch = p.match(/^___REVEAL_BLOCK_(\d+)___$/);
      if (revealPlaceholderMatch) {
        const revealIdx = parseInt(revealPlaceholderMatch[1], 10);
        const r = reveals[revealIdx];
        if (r) {
          blocks.push({
            type: "interactive-reveal",
            summary: r.summary,
            details: r.details,
          });
          return;
        }
      }

      // Standalone Kunci Jawaban / Pembahasan / Solusi
      if (/^(kunci jawaban|pembahasan|jawaban soal|solusi latihan|jawaban|pembahasan soal)/i.test(p.trim())) {
        const lines = p.split("\n");
        const titleLine = lines[0].replace(/^#{1,6}\s*/, "").trim();
        const restLines = lines.slice(1).join("\n").trim();
        if (restLines) {
          blocks.push({
            type: "interactive-reveal",
            summary: titleLine || (isIndonesian ? "Lihat Jawaban & Pembahasan" : "View Answers & Solution"),
            details: restLines,
          });
          return;
        }
      }

      // 2. Fenced Code Blocks -> code-sandbox
      const codeBlockMatch = p.match(/^```(python|py|javascript|js)\n([\s\S]*?)```$/i);
      if (codeBlockMatch) {
        const language = codeBlockMatch[1].toLowerCase().startsWith("p") ? "python" : "javascript";
        blocks.push({
          type: "code-sandbox",
          code: codeBlockMatch[2].trim(),
          language,
          expectedOutput: language === "python" ? "Program executed successfully" : "Code executed successfully",
          instructions: isIndonesian ? "Jalankan kode di bawah ini untuk menguji pemahaman Anda:" : "Run the sandbox code below to test your understanding:",
        });
        return;
      }

      // 3. Per-line Flashcard extraction from bullet lists or definition lines
      const bulletLines = p.split("\n");
      const flashcardsInP: { front: string; back: string }[] = [];
      const nonFlashcardLines: string[] = [];

      bulletLines.forEach((line) => {
        const fcMatch = line.match(/^(?:\*\s*|\d+[\.\)]\s*|\-\s*)?\*\*([^*:]+)\*\*\s*[:—\-]\s*(.+)$/);
        if (fcMatch) {
          const front = fcMatch[1].trim();
          const back = fcMatch[2].trim();
          if (front.length >= 2 && front.length <= 65 && back.length >= 5) {
            flashcardsInP.push({ front, back });
            return;
          }
        }
        nonFlashcardLines.push(line);
      });

      if (flashcardsInP.length > 0) {
        flashcardsInP.forEach((card) => {
          blocks.push({ type: "flashcard", front: card.front, back: card.back });
        });
        if (nonFlashcardLines.length === 0 || nonFlashcardLines.join("").trim().length < 10) {
          return;
        }
        p = nonFlashcardLines.join("\n").trim();
      }

      // 4. Worked Example Card
      if (/(contoh nyata|contoh:|studi kasus|worked example|penyelesaian:|hasil perhitungan:)/i.test(p) && !p.startsWith("#")) {
        const cleanContent = p.replace(/^(contoh nyata|contoh|studi kasus|worked example|penyelesaian|hasil perhitungan)[:\s]*/i, "").trim();
        blocks.push({
          type: "example",
          title: isIndonesian ? "Contoh Penerapan & Pembahasan" : "Practical Example & Walkthrough",
          content: cleanContent,
        });
        return;
      }

      // 5. Warning & Note Callout Card
      if (/(perhatian|catatan:|hati-hati|warning|pitfall|miskonsepsi|ingat:)/i.test(p) && !p.startsWith("#")) {
        const cleanContent = p.replace(/^(catatan|perhatian|warning|pitfall|hati-hati|ingat)[:\s]*/i, "").trim();
        blocks.push({
          type: "warning",
          title: isIndonesian ? "Catatan Penting & Hal Perlu Diperhatikan" : "Important Note & Pitfall",
          items: [cleanContent],
        });
        return;
      }

      // 6. Analogy Card
      if (/(ibarat|analogi|bagaikan|think of|like learning)/i.test(p) && !p.startsWith("#")) {
        blocks.push({
          type: "analogy",
          title: isIndonesian ? "Analogi Konsep" : "Helpful Analogy",
          content: p,
        });
        return;
      }

      // 7. Regular Paragraph
      if (p.trim()) {
        blocks.push({ type: "paragraph", content: p });
      }

      // Spread 1-3 unique images inline in fallback
      const imageIndex = idx % 4 === 1 ? Math.floor(idx / 4) : -1;
      const image = imageIndex >= 0 && imageIndex < 3 ? images[imageIndex] : undefined;
      if (image) {
        blocks.push({
          type: "image",
          url: image.url,
          caption: image.title,
          altText: image.altText,
        });
      }
    });
  });

  // Clean summary built from main concept headings (excluding exercise, quiz, meta, and answer keys).
  const allHeadings = Array.from(markdownContent.matchAll(/^#{1,6}\s+(.+)$/gm), (m) => m[1]!.trim()).filter(Boolean);
  const filteredHeadings = allHeadings.filter((h) => {
    const lower = h.toLowerCase();
    const mainTitleLower = lessonTitle.toLowerCase();
    if (lower === mainTitleLower || lower.includes(mainTitleLower)) return false;
    return !/^(pelajaran|lesson|chapter|module|latihan|soal|kunci|pembahasan|exercise|practice|quiz|rangkuman|summary|tujuan|objective|learning|analogy|example|worked|pitfall|video|representasi|contoh|code|sandbox|operasi|tipe data|jumlah|suhu|bagian|nilai|a helpful)\b/i.test(lower);
  });
  const cleanedHeadings = Array.from(new Set(filteredHeadings.map((h) => h.replace(/^\d+[\.\)]\s*/, "").trim()))).slice(0, 7);

  let summaryContent = "";
  if (cleanedHeadings.length > 0) {
    const items = cleanedHeadings.map((h) => `- **${h}**`).join("\n");
    summaryContent = isIndonesian
      ? `**Ringkasan Pelajaran:**\n\nBeberapa poin penting yang telah dipelajari:\n${items}`
      : `**Lesson Summary:**\n\nKey takeaways covered in this lesson:\n${items}`;
  } else {
    summaryContent = isIndonesian
      ? `Rangkuman konsep kunci dan pemahaman praktis dari ${lessonTitle}.`
      : `Summary of key concepts and practical understanding for ${lessonTitle}.`;
  }

  blocks.push({
    type: "summary",
    content: summaryContent,
  });

  // Deduplicate image blocks so no two image blocks share the same URL
  const seenImageUrlsInRepaired = new Set<string>();
  const deduplicatedBlocks = blocks.filter((block) => {
    if (block.type === "image") {
      if (seenImageUrlsInRepaired.has(block.url)) {
        return false;
      }
      seenImageUrlsInRepaired.add(block.url);
    }
    return true;
  });

  return { title: lessonTitle, blocks: deduplicatedBlocks };
}

export function getLessonPlainContent(content: string | null | undefined): string {
  if (!content) return "";
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.blocks)) {
      return parsed.blocks
        .filter((block: any) => block.type !== "objective" && block.type !== "summary")
        .map((block: any) => {
          if (
            block.type === "paragraph" ||
            block.type === "analogy" ||
            block.type === "example"
          ) {
            // Strip out duplicated header lines from previous recursive runs
            return String(block.content || "")
              .replace(/^(?:###?\s*(?:Tujuan Pembelajaran|Learning Objectives|A helpful analogy|Worked example|Common pitfall|Objective|Summary)[\r\n]*)+/gi, "")
              .trim();
          } else if (block.type === "warning") {
            const items = Array.isArray(block.items) ? block.items.join("\n") : String(block.content || "");
            return `Catatan: ${items}`;
          } else if (block.type === "code-sandbox") {
            return `\`\`\`${block.language || "python"}\n${block.code}\n\`\`\``;
          } else if (block.type === "flashcard") {
            return `* **${block.front}**: ${block.back}`;
          } else if (block.type === "interactive-quiz") {
            return `1. ${block.question}\n${(block.options || []).map((o: string, idx: number) => `   * ${o}`).join("\n")}`;
          } else if (block.type === "interactive-reveal") {
            return `<details>\n<summary>${block.summary}</summary>\n\n${block.details}\n</details>`;
          } else if (block.type === "image") {
            return `![${block.altText || block.caption}](${block.url})`;
          }
          return "";
        })
        .filter(Boolean)
        .join("\n\n");
    }
  } catch (e) {
    // Not valid JSON, return as-is
  }
  return content;
}
