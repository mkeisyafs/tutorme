import prisma from "../../../lib/prisma";
import { AiService } from "../core/ai.service";
import { performWebSearch, performYoutubeSearch } from "../core/tools/search-tools";
import { QuizWorkerService } from "../workers/quiz-worker.service";
import { getPowerfulModel } from "../core/ai-providers";
import { createLessonBlocksSchema, type LessonBlocks } from "./lesson-blocks";

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
      // A previous server restart or transient worker failure should not leave a
      // generated lesson permanently without its background quiz.
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
- Do NOT include any preamble, introduction about yourself, or meta-commentary such as "I'll create...", "Let me search...", "Here is the lesson...", etc.
- Do NOT describe what you are going to do. Just do it.
- Include clear explanations, real-world examples, and practical exercises.
- Use headings (##, ###), bullet points, and bold/italic for readability.
- CRITICAL CODE FORMATTING: ALL code examples, scripts, function definitions, variable configurations, and code snippets MUST BE WRAPPED in triple-backtick fenced code blocks with language specifiers (e.g. \`\`\`python\n...\n\`\`\` or \`\`\`javascript\n...\n\`\`\`). NEVER output multiline code or python functions as raw unformatted prose without code fences!
- PRESERVE ALL NEWLINES AND INDENTATION inside code blocks.
- Include one complete fenced Python or JavaScript example that prints observable output.
- If you use the webSearch tool, incorporate the information naturally into the content without mentioning that you searched.
- If you use the youtubeSearch tool and find a video, embed the URL naturally in the content (e.g. as a Markdown link).
- Write in a friendly, encouraging tone suitable for learners.`;

    // Perform searches directly to gather context since tools cause the proxy to crash
    const [webSearchResult, youtubeSearchResult] = await Promise.all([
      performWebSearch(`${courseTitle} ${lessonTitle}`),
      performYoutubeSearch(`${courseTitle} ${lessonTitle}`)
    ]);

    const contextSection = `
Here is some up-to-date context from the web to help you write the lesson:
${webSearchResult.results}

${youtubeSearchResult.videoUrl ? `Here is a relevant YouTube video URL you MUST embed in the lesson naturally: ${youtubeSearchResult.videoUrl}` : ""}
`;

    const prompt = `Write the full lesson content for "${lessonTitle}" in Markdown. Start directly with the material — no preamble.
${contextSection}`;

    // We omit `tools` here because the current AI provider (HaluAI) crashes
    // with a "socket hang up" when the `tools` array is sent in the request.
    const rawContent = await AiService.text(prompt, getPowerfulModel(), system);

    // Strip any AI preamble that appears before the actual lesson content.
    // If the model starts with meta-commentary (e.g. "I'll create..." or
    // "Here is the lesson...") followed by the real content starting with a
    // Markdown heading, drop everything before the first heading.
    const firstHeadingIndex = rawContent.search(/^#{1,6}\s/m);
    const content = firstHeadingIndex > 0
      ? rawContent.slice(firstHeadingIndex)
      : rawContent;
    
    // Video is optional. If the model includes one, accept normal YouTube watch
    // links with or without www plus short youtu.be links, then strip Markdown
    // punctuation without turning a missing video into an error.
    const youtubeMatch = content.match(
      /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^\s<>{}\[\]]+|youtu\.be\/[A-Za-z0-9_-]+(?:\?[^\s<>{}\[\]]+)*)/i
    );
    const videoUrl = youtubeMatch?.[0]?.replace(/[.,!?)\]]+$/, "") ?? null;

    const structuredContent = await this.convertMarkdownToBlocks(lessonTitle, content);

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

    // 4. Asynchronously trigger Quiz Generation in the background
    // We do NOT await this. It runs in the background.
    QuizWorkerService.enqueueQuizGeneration(lessonId).catch(err => {
      console.error(`Failed to enqueue quiz for lesson ${lessonId}:`, err);
    });

    return updatedLesson;
  }

  private static async convertMarkdownToBlocks(lessonTitle: string, markdownContent: string) {
    const prompt = `Convert the following lesson markdown content for the lesson titled "${lessonTitle}" into structured blocks.
    
Lesson Markdown Content:
${markdownContent}`;

    const system = `You are an expert curriculum developer. Your task is to convert a Markdown lesson into a structured JSON format containing a list of interactive and instructional blocks.

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

CRITICAL REPETITION & PLACEMENT GUIDELINES:
- REPEATED BLOCK USAGE ALLOWED & ENCOURAGED: You are NOT limited to using each block type only once. You can and SHOULD use ANY block type MULTIPLE TIMES throughout the lesson whenever helpful for the learner!
  * Multiple "paragraph" blocks for distinct concepts and sections.
  * Multiple "analogy" blocks to explain different complex or abstract topics.
  * Multiple "example" blocks to demonstrate different code patterns or step-by-step walkthroughs.
  * Multiple "warning" blocks for different common pitfalls or edge cases.
  * Multiple "flashcard" blocks for distinct key terms, definitions, or key takeaways.
  * Multiple "interactive-quiz" blocks for quick self-assessment after different topic sections.
  * Multiple "interactive-reveal" blocks for expanding on different deep-dive details.
  * Multiple "code-sandbox" blocks for practicing different executable snippets in a coding lesson.
- PRESERVE ALL CODE FENCES AND NEWLINES: Every code snippet, script, function definition, or configuration variable in the text MUST retain its fenced code block format (\`\`\`python\n...\n\`\`\` or \`\`\`javascript\n...\n\`\`\`) with exact linebreaks and indentation preserved. NEVER collapse multiline code blocks into flat single-line strings.
- DO NOT stack or group interactive/callout blocks at the bottom of the lesson!
- Interleave interactive and instructional blocks naturally INLINE throughout the lesson flow right next to the relevant concepts being explained.
- Structure of the lesson:
  1. Start with an "objective" block at the top.
  2. Explain concepts in paragraph blocks, freely inserting analogies, examples, warnings, flashcards, interactive reveals, quizzes, and code sandboxes as many times as needed wherever they fit best in the learning flow.
  3. Conclude with a "summary" block at the very end.
- Divide long markdown text into multiple smaller "paragraph" blocks so interactive elements can be inserted between them.
- Include at least one of every required block type (objective, paragraph, analogy, example, warning, summary, interactive-quiz, flashcard, interactive-reveal). Include "code-sandbox" ONLY if the source markdown contains executable Python or JavaScript code.
- Ensure the output is strictly valid JSON conforming to the schema. Do not output anything else.`;

    try {
      const parsedBlocks = await AiService.structuredObject<LessonBlocks>(
        prompt,
        createLessonBlocksSchema(markdownContent),
        getPowerfulModel(),
        system
      );
      return JSON.stringify(parsedBlocks);
    } catch (error) {
      console.error("Failed to convert markdown to structured blocks, falling back to repaired lesson blocks", error);
      const repairedBlocks = this.buildInterleavedRepairedBlocks(lessonTitle, markdownContent);
      return JSON.stringify(repairedBlocks);
    }
  }

  private static buildInterleavedRepairedBlocks(lessonTitle: string, markdownContent: string): LessonBlocks {
    const rawParagraphs = markdownContent
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    const hasCode = /```(python|py|javascript|js)/i.test(markdownContent);

    const blocks: LessonBlocks["blocks"] = [
      {
        type: "objective",
        title: "Learning Objectives",
        content: `Master the key concepts and practical applications of ${lessonTitle}.`,
      },
    ];

    if (rawParagraphs.length === 0) {
      blocks.push({ type: "paragraph", content: markdownContent });
    } else {
      const totalP = rawParagraphs.length;
      rawParagraphs.forEach((p, idx) => {
        blocks.push({ type: "paragraph", content: p });

        if (idx === 0) {
          blocks.push({
            type: "analogy",
            title: "A helpful analogy",
            content: `Think of ${lessonTitle} like learning a route: the explanation gives you the map, and practice helps you remember each turn.`,
          });
        } else if (idx === Math.floor(totalP * 0.3)) {
          blocks.push({
            type: "example",
            title: "Worked example",
            content: "Apply the main idea step by step, then compare your result with the explanation above.",
          });
        } else if (idx === Math.floor(totalP * 0.5)) {
          blocks.push({
            type: "warning",
            title: "Common pitfall",
            items: ["Do not skip the explanation before attempting the practice."],
          });
          blocks.push({
            type: "flashcard",
            front: `What is the core takeaway of ${lessonTitle}?`,
            back: "Review the key explanation and connect it to the practical examples in this lesson.",
          });
        } else if (idx === Math.floor(totalP * 0.7)) {
          blocks.push({
            type: "interactive-reveal",
            summary: "Key Concept Deep-Dive",
            details: "Read the explanation, test your understanding with the quiz, and apply the concept in practice.",
          });
          blocks.push({
            type: "interactive-quiz",
            question: `What is the main objective of ${lessonTitle}?`,
            options: ["Understand and apply the core principles", "Memorize definitions without practice", "Skip the lesson examples"],
            correctIndex: 0,
            explanation: "Applying the core principles with active practice ensures long-term understanding.",
          });
        }
      });
    }

    if (hasCode) {
      blocks.push({
        type: "code-sandbox",
        code: "const lesson = 'practice';\nconsole.log(`Keep going: ${lesson}`);",
        language: "javascript",
        expectedOutput: "Keep going: practice",
        instructions: "Run the sandbox, then edit the code snippet to test your understanding.",
      });
    }

    blocks.push({
      type: "summary",
      content: "Review the key idea, connect it to the examples, and practice it in your own learning.",
    });

    return {
      title: lessonTitle,
      blocks,
    };
  }
}
