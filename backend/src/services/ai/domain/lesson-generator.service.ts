import prisma from "../../../lib/prisma";
import { AiService } from "../core/ai.service";
import { performImageSearch, performWebSearch, performYoutubeSearch } from "../core/tools/search-tools";
import { QuizWorkerService } from "../workers/quiz-worker.service";
import { getPowerfulModel } from "../core/ai-providers";
import { buildRepairedLessonBlocks, createLessonBlocksSchema, type LessonBlocks } from "./lesson-blocks";

export class LessonGeneratorService {
  private static generationJobs = new Map<string, Promise<any>>();

  static isGenerating(lessonId: string) {
    return this.generationJobs.has(lessonId);
  }

  /**
   * Generates content for a specific lesson on-demand.
   * 
   * Workflow:
   * 1. Retrieve lesson and module context from DB.
   * 2. Use AI (with tools) to generate markdown content and find a video.
   * 3. Update the lesson in the DB.
   * 4. Asynchronously kick off the quiz generation worker.
   */
  static async generateLessonOnDemand(lessonId: string) {
    const existingJob = this.generationJobs.get(lessonId);
    if (existingJob) return existingJob;

    const job = this.generateLesson(lessonId);
    this.generationJobs.set(lessonId, job);

    try {
      return await job;
    } finally {
      this.generationJobs.delete(lessonId);
    }
  }

  private static async generateLesson(lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          }
        }
      }
    });

    if (!lesson) throw new Error("Lesson not found");
    if (lesson.content) {
      QuizWorkerService.enqueueQuizGeneration(lessonId).catch((err) => {
        console.error(`Failed to enqueue quiz for lesson ${lessonId}:`, err);
      });
      return lesson;
    }

    const courseTitle = lesson.module.course.title;
    const moduleTitle = lesson.module.title;
    const lessonTitle = lesson.title;

    const system = `You are an expert educator. Your task is to write the content for a lesson inside a course.

Course: "${courseTitle}"
Module: "${moduleTitle}"
Lesson: "${lessonTitle}"

CRITICAL RULES:
- Output ONLY the lesson content in Markdown format. Start directly with the lesson material.
- Write the lesson using the exact same language as the course title and lesson title (e.g., if titles are in Indonesian or another language, write using that language).
- Do NOT include any preamble, introduction about yourself, or meta-commentary.
- RICH INTERACTIVE LESSON STRUCTURE REQUIREMENT:
  * For every key concept, format key terms as bold bullet definitions: \x60* **[Key Term]**: [Clear 1-sentence definition]\x60 so they convert directly into interactive Flashcards!
  * Add at least 1-2 Analogi callouts starting with \x60Analogi:\x60 or \x60Ibarat:\x60 (e.g. \x60Analogi: Memahami jenis bilangan seperti mengelompokkan barang belanjaan...\x60).
  * Add at least 1-2 Worked Example callouts starting with \x60Contoh Nyata:\x60 or \x60Contoh:\x60 (e.g. \x60Contoh Nyata: Menghitung sisa apel...\x60).
  * Add at least 1-2 Warning callouts starting with \x60Catatan:\x60 or \x60Perhatian:\x60 for common pitfalls or edge cases.
  * For practice questions or exercise sections, ALWAYS place the full answer breakdown inside an expandable HTML details block:
    <details>
    <summary>Klik di sini untuk melihat Kunci Jawaban & Pembahasan</summary>

    1. **Soal 1:** ...
    2. **Soal 2:** ...
    </details>
- CRITICAL CODE FORMATTING: ALL code examples MUST BE WRAPPED in triple-backtick fenced code blocks with language specifiers (e.g. \x60\x60\x60python\n...\x60\x60\x60 or \x60\x60\x60javascript\n...\x60\x60\x60).
- ONLY include code examples if the lesson topic is directly about programming, coding, or technical computing.
- Write in a friendly, encouraging tone suitable for learners.`;

    const [webSearchResult, youtubeSearchResult, imageSearchResult] = await Promise.all([
      performWebSearch(`${courseTitle} ${lessonTitle}`),
      performYoutubeSearch(`${courseTitle} ${lessonTitle}`),
      performImageSearch(`${courseTitle} ${lessonTitle} diagram illustration`)
    ]);

    const contextSection = `
Here is some up-to-date context from the web to help you write the lesson:
${webSearchResult.results}

${youtubeSearchResult.videoUrl ? `Here is a relevant YouTube video URL you MUST embed in the lesson naturally: ${youtubeSearchResult.videoUrl}` : ""}

${imageSearchResult.images.length > 0 ? `Here are relevant images you MAY embed with Markdown image syntax ![caption](url) where a visual aid helps comprehension. Use ONLY these exact URLs, and NEVER use the same image URL more than once:
${imageSearchResult.images.map((img) => `- ${img.url} (${img.title})`).join("\n")}` : ""}
`;

    const prompt = `Write the full lesson content for "${lessonTitle}" in Markdown. Start directly with the material — no preamble.
${contextSection}`;

    const rawContent = await AiService.text(prompt, getPowerfulModel(), system);

    const firstHeadingIndex = rawContent.search(/^#{1,6}\s/m);
    const content = firstHeadingIndex > 0
      ? rawContent.slice(firstHeadingIndex)
      : rawContent;
    
    const youtubeMatch = content.match(
      /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^\s<>{}\[\]]+|youtu\.be\/[A-Za-z0-9_-]+(?:\?[^\s<>{}\[\]]+)*)/i
    );
    const videoUrl = youtubeMatch?.[0]?.replace(/[.,!?)\]]+$/, "") ?? null;

    const structuredContent = await this.convertMarkdownToBlocks(lessonTitle, content, imageSearchResult.images);

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        content: structuredContent,
        videoUrl,
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
      },
    });

    QuizWorkerService.enqueueQuizGeneration(lessonId).catch(err => {
      console.error(`Failed to enqueue quiz for lesson ${lessonId}:`, err);
    });

    return updatedLesson;
  }

  private static async convertMarkdownToBlocks(
    lessonTitle: string,
    markdownContent: string,
    images: { url: string; title: string; altText: string }[] = []
  ) {
    const imageSection = images.length > 0
      ? `\n\nAvailable images (use ONLY these exact URLs in "image" blocks, or omit image blocks entirely):\n${images.map((img) => `- ${img.url} — ${img.title}`).join("\n")}`
      : "";

    const prompt = `Convert the following lesson markdown content for the lesson titled "${lessonTitle}" into structured blocks.
    
Lesson Markdown Content:
${markdownContent}${imageSection}`;

    const system = `You are an expert curriculum developer. Your task is to convert a Markdown lesson into a structured JSON format containing a list of interactive and instructional blocks.

CRITICAL LANGUAGE RULE: You MUST write all titles, headings, questions, options, explanations, summaries, analogies, flashcards, and instructions in the EXACT SAME LANGUAGE as the source lesson markdown content (e.g., if the lesson is in Indonesian/Bahasa Indonesia, every block title, question, option, explanation, analogy, and summary MUST be in Indonesian).

Return a JSON object matching this schema:
{
  "title": string,
  "blocks": Array of blocks
}

Every block must have a "type" field. The possible block types and their properties are:

1. { "type": "objective", "title": string, "content": string }
2. { "type": "paragraph", "content": string } (Plain text containing explanation. Keep it clean without markdown headers, but bold/italic/code-inline is fine)
3. { "type": "analogy", "title": string, "content": string }
4. { "type": "example", "title": string, "content": string } (Code examples or walkthroughs)
5. { "type": "warning", "title": string, "items": string[] }
6. { "type": "summary", "content": string }
7. { "type": "interactive-quiz", "question": string, "options": string[], "correctIndex": number, "explanation": string }
8. { "type": "flashcard", "front": string, "back": string }
9. { "type": "interactive-reveal", "summary": string, "details": string }
10. { "type": "code-sandbox", "code": string, "language": string, "expectedOutput": string, "instructions": string }
11. { "type": "image", "url": string, "caption": string, "altText": string } (A web image that illustrates the nearby concept)

CRITICAL REPETITION & HIGH DENSITY GUIDELINES:
- MAXIMIZE INTERACTIVE BLOCK FREQUENCY: Do NOT output long unformatted walls of text or consecutive plain paragraphs! Break down explanations into short 1–3 sentence paragraphs and interleave interactive cards continuously throughout the lesson flow.
- REQUIRED HIGH-DENSITY BLOCK TYPES:
  * AT LEAST 3–6 "flashcard" blocks across the lesson for key terminology, formulas, core rules, or definition pairs.
  * AT LEAST 2–4 "interactive-quiz" blocks inserted inline after key concept sections to test understanding on the spot.
  * AT LEAST 2–4 "interactive-reveal" blocks for worked solutions, deep dives, answer breakdowns, or step-by-step reveals.
  * AT LEAST 2 "analogy" blocks to make abstract ideas intuitive.
  * AT LEAST 2 "example" blocks to demonstrate real-world scenarios or worked problems.
  * AT LEAST 1–2 "warning" blocks for common mistakes or misconceptions.
  * Use AT MOST 1 "image" block ONLY if a valid URL exists in "Available images". Do NOT overuse images.
  * "code-sandbox" blocks for coding/programming topics with executable code snippets.
- IMAGE RULE: "image" blocks are OPTIONAL. Use a URL ONLY if it appears verbatim in the "Available images" list or as a Markdown image in the source markdown. NEVER invent, guess, or modify an image URL. Each image block MUST use a UNIQUE URL — NEVER repeat the same image URL in a lesson. Write "caption" and "altText" in the lesson language.
- PRESERVE ALL CODE FENCES AND NEWLINES: Retain fenced code blocks (\x60\x60\x60python\n...\x60\x60\x60 or \x60\x60\x60javascript\n...\x60\x60\x60) with exact linebreaks.
- DO NOT stack or group interactive/callout blocks at the bottom of the lesson! Interleave them naturally inline next to relevant concepts.
- Structure of the lesson:
  1. Start with an "objective" block at the top.
  2. Explain concepts using short paragraph blocks interspersed with analogies, examples, warnings, flashcards, interactive reveals, quizzes, and code sandboxes.
  3. Conclude with a "summary" block at the very end.
- For "summary" blocks: Write a clean, engaging bulleted summary of core takeaways in the lesson's language.
- For any expandable content or solution key (e.g. "Jawaban", "Pembahasan", "Kunci Jawaban", or <details> HTML tags): ALWAYS convert them into "interactive-reveal" blocks where "summary" is the toggle title and "details" is the explanation. NEVER output raw <details> or <summary> HTML tags inside paragraph blocks!
- Include at least one of every required block type (objective, paragraph, analogy, example, warning, summary, interactive-quiz, flashcard, interactive-reveal). Include "code-sandbox" ONLY if the source markdown contains executable Python or JavaScript code AND the lesson is a programming topic.
- Ensure the output is strictly valid JSON conforming to the schema. Do not output anything else.`;

    const schema = createLessonBlocksSchema(markdownContent, this.collectAllowedImageUrls(markdownContent, images));
    const MAX_ATTEMPTS = 2;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const parsedBlocks = await AiService.structuredObject<LessonBlocks>(prompt, schema, getPowerfulModel(), system);
        return JSON.stringify(parsedBlocks);
      } catch (error) {
        console.error(`Structured block conversion attempt ${attempt}/${MAX_ATTEMPTS} failed`, error);
      }
    }
    console.error("Falling back to repaired lesson blocks built from the markdown content");
    return JSON.stringify(buildRepairedLessonBlocks(lessonTitle, markdownContent, images));
  }

  /** URLs the model is allowed to emit: retrieved images plus images already in the markdown. */
  private static collectAllowedImageUrls(
    markdownContent: string,
    images: { url: string }[]
  ): string[] {
    const fromMarkdown = Array.from(markdownContent.matchAll(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g), (m) => m[1]!);
    return [...images.map((img) => img.url), ...fromMarkdown];
  }

}
