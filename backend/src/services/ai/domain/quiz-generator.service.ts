import { z } from "zod";
import prisma from "../../../lib/prisma";
import { AiService } from "../core/ai.service";
import { getDefaultModel } from "../core/ai-providers";

const QuestionSchema = z.object({
  questions: z.array(
    z.object({
      type: z.enum(["MULTIPLE_CHOICE", "ESSAY"]),
      prompt: z.string().describe("The question text"),
      options: z.array(z.string()).optional().describe("Options for multiple choice"),
      explanations: z.array(z.string()).optional().describe("Explanations for why each option is correct or incorrect"),
      correctAnswer: z.number().optional().describe("Index of the correct option (0-based)"),
      requiresImage: z.boolean().default(false).describe("If this essay question needs an image upload"),
    })
  ),
});

export class QuizGeneratorService {
  /**
   * Generates a chapter quiz based on lesson content.
   */
  static async generateQuizForLesson(lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: true,
      }
    });

    if (!lesson || !lesson.content) {
      throw new Error("Lesson content not found to generate quiz.");
    }

    // Check if a chapter quiz already exists for this course (we'll attach it to the course)
    // Or we can create a Quiz per module/lesson. 
    // The schema says Quiz belongs to Course. We'll create a CHAPTER_QUIZ for the course based on this lesson.
    const quizTitle = `Quiz for Lesson: ${lesson.title}`;

    const prompt = `Generate a short quiz for the following educational content. 
Include 3 multiple choice questions and 1 essay question.
Lesson Content:
${lesson.content}`;

    const system = "You are an expert curriculum designer creating assessments.";

    const result = await AiService.structuredObject<z.infer<typeof QuestionSchema>>(
      prompt,
      QuestionSchema,
      getDefaultModel(),
      system
    );

    // Persist to DB
    await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          courseId: lesson.module.courseId,
          title: quizTitle,
          type: "CHAPTER_QUIZ",
          passingScore: 70,
        },
      });

      for (const q of result.questions) {
        await tx.question.create({
          data: {
            quizId: quiz.id,
            type: q.type,
            prompt: q.prompt,
            options: q.options || [],
            explanations: q.explanations || [],
            correctAnswer: q.correctAnswer ?? null,
            requiresImage: q.requiresImage,
          },
        });
      }
    });

    console.log(`Quiz generated successfully for lesson ${lessonId}`);
  }
}
