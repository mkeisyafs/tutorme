import prisma from "../../../lib/prisma";
import { AiService } from "../core/ai.service";
import { webSearchTool, youtubeSearchTool } from "../core/tools/search-tools";
import { QuizWorkerService } from "../workers/quiz-worker.service";
import { getPowerfulModel } from "../core/ai-providers";

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
- Do NOT include any preamble, introduction about yourself, or meta-commentary such as "I'll create...", "Let me search...", "Here is the lesson...", etc.
- Do NOT describe what you are going to do. Just do it.
- Include clear explanations, real-world examples, and practical exercises.
- Use headings (##, ###), bullet points, code blocks, and bold/italic for readability.
- If you use the webSearch tool, incorporate the information naturally into the content without mentioning that you searched.
- If you use the youtubeSearch tool and find a video, embed the URL naturally in the content (e.g. as a Markdown link).
- Write in a friendly, encouraging tone suitable for learners.`;

    const prompt = `Write the full lesson content for "${lessonTitle}" in Markdown. Start directly with the material — no preamble.`;

    // Tools available to the AI
    const tools = {
      webSearch: webSearchTool,
      youtubeSearch: youtubeSearchTool,
    };

    const rawContent = await AiService.text(prompt, getPowerfulModel(), system, tools);

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

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        content,
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
}
