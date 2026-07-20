import prisma from "../../../lib/prisma";
import { AiService } from "../core/ai.service";
import { webSearchTool, youtubeSearchTool } from "../core/tools/search-tools";
import { QuizWorkerService } from "../workers/quiz-worker.service";
import { getPowerfulModel } from "../core/ai-providers";

export class LessonGeneratorService {
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
    if (lesson.content) return lesson; // Already generated

    const courseTitle = lesson.module.course.title;
    const moduleTitle = lesson.module.title;
    const lessonTitle = lesson.title;

    const system = `You are an expert educator writing content for a course on "${courseTitle}". 
You are writing the content for the module "${moduleTitle}", specifically the lesson titled "${lessonTitle}".
Output high-quality, engaging educational content in Markdown format.
Include explanations, examples, and practical exercises.
Use the webSearch tool if you need up-to-date facts.
Use the youtubeSearchTool to find a relevant educational video URL if possible.`;

    const prompt = `Write the comprehensive lesson content for "${lessonTitle}".`;

    // Tools available to the AI
    const tools = {
      webSearch: webSearchTool,
      youtubeSearch: youtubeSearchTool,
    };

    const content = await AiService.text(prompt, getPowerfulModel(), system, tools);

    // In a real scenario with proper tool calling, we'd extract the video URL from the tool results.
    // For this MVP architecture, we can parse it from the response or let the tool update a local ref.
    // Assuming the AI might just embed it or we can run a separate quick extract if needed.
    // To keep it simple, we'll just save the generated text to content. 
    
    // Attempt simple extraction of a youtube URL if the AI included one in raw text
    let videoUrl = null;
    const ytIdx = content.indexOf("https://www.youtube.com/watch?v=");
    if (ytIdx !== -1) {
      const endIdx = content.indexOf(" ", ytIdx);
      videoUrl = endIdx !== -1 ? content.substring(ytIdx, endIdx) : content.substring(ytIdx);
      // clean up any trailing punctuation
      videoUrl = videoUrl.replace(/[.,!?)\]]*$/, "");
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        content,
        videoUrl,
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
