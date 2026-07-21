import prisma from "../../../lib/prisma";
import { AiService } from "../core/ai.service";
import { getDefaultModel } from "../core/ai-providers";
import { getLessonPlainContent } from "../domain/lesson-blocks";

export class LearningAssistantService {
  /**
   * Tutors the user based on the current lesson context.
   */
  static async chatWithTutor(lessonId: string, messages: any[]) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || !lesson.content) {
      throw new Error("Lesson content not found or not generated yet.");
    }

    const system = `You are an expert Learning Assistant dedicated to helping a student understand the current lesson.
You must:
- Answer questions using the current lesson content as your primary context.
- Explain difficult concepts clearly.
- Provide examples and analogies.
- Refuse to answer questions that are completely unrelated to the lesson content or general course topic.

CURRENT LESSON CONTENT:
${getLessonPlainContent(lesson.content)}`;

    // Note: We use the plain text chat stream here (not structured object)
    // In a real app, you would likely stream this response using \`streamText\`.
    // For this API endpoint, we'll return the full text.
    const reply = await AiService.chat(messages, getDefaultModel(), system);

    return { reply };
  }
}
