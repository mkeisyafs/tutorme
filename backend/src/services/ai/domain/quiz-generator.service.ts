import { z } from "zod";
import prisma from "../../../lib/prisma";
import { AiService } from "../core/ai.service";
import { getDefaultModel } from "../core/ai-providers";
import { getLessonPlainContent } from "./lesson-blocks";

const QuestionSchema = z.object({
  questions: z.array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("MULTIPLE_CHOICE"),
        prompt: z.string().describe("The question text"),
        options: z.array(z.string()).describe("Options for multiple choice"),
        explanations: z.array(z.string()).describe("Explanations for why each option is correct or incorrect"),
        correctAnswer: z.number().describe("Index of the correct option (0-based)"),
      }),
      z.object({
        type: z.literal("ESSAY"),
        prompt: z.string().describe("The question text"),
        requiresImage: z.boolean().default(false).describe("If this essay question needs an image upload"),
      })
    ])
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

    const quizTitle = `Quiz for Lesson: ${lesson.title}`;
    const sameTitleLessonCount = await prisma.lesson.count({
      where: {
        title: lesson.title,
        module: { courseId: lesson.module.courseId },
      },
    });
    const canUseLegacyTitleFallback = sameTitleLessonCount === 1;

    const existingQuiz = await prisma.quiz.findFirst({
      where: {
        lessonId: lesson.id,
        type: "CHAPTER_QUIZ",
        questions: { some: {} },
      },
      select: { id: true, chapterQuizLessonKey: true },
    });
    if (existingQuiz) {
      if (existingQuiz.chapterQuizLessonKey !== lesson.id) {
        await prisma.quiz.update({
          where: { id: existingQuiz.id },
          data: { chapterQuizLessonKey: lesson.id },
        });
      }
      return existingQuiz.id;
    }

    const existingLegacyQuizzes = canUseLegacyTitleFallback
      ? await prisma.quiz.findMany({
          where: {
            courseId: lesson.module.courseId,
            lessonId: null,
            title: quizTitle,
            type: "CHAPTER_QUIZ",
            questions: { some: {} },
          },
          select: { id: true },
          take: 2,
        })
      : [];
    if (existingLegacyQuizzes.length === 1) {
      await prisma.quiz.update({
        where: { id: existingLegacyQuizzes[0].id },
        data: { lessonId: lesson.id, chapterQuizLessonKey: lesson.id },
      });
      return existingLegacyQuizzes[0].id;
    }

    const prompt = `Generate a short quiz for the following educational content. 
Include 3 multiple choice questions and 1 essay question.
Lesson Content:
${getLessonPlainContent(lesson.content)}`;

    const system = "You are an expert curriculum designer creating assessments.";

    const result = await AiService.structuredObject<z.infer<typeof QuestionSchema>>(
      prompt,
      QuestionSchema,
      getDefaultModel(),
      system
    );

    if (result.questions.length === 0) {
      throw new Error("The model did not return any quiz questions.");
    }

    // Persist to DB. Re-check inside the transaction because a retry or another
    // in-process request can finish while the model call is still running.
    const quizId = await prisma.$transaction(async (tx) => {
      const completedQuiz = await tx.quiz.findFirst({
        where: {
          lessonId: lesson.id,
          type: "CHAPTER_QUIZ",
          questions: { some: {} },
        },
        select: { id: true, chapterQuizLessonKey: true },
      });
      if (completedQuiz) {
        if (completedQuiz.chapterQuizLessonKey !== lesson.id) {
          await tx.quiz.update({
            where: { id: completedQuiz.id },
            data: { chapterQuizLessonKey: lesson.id },
          });
        }
        return completedQuiz.id;
      }

      const completedLegacyQuizzes = canUseLegacyTitleFallback
        ? await tx.quiz.findMany({
            where: {
              courseId: lesson.module.courseId,
              lessonId: null,
              title: quizTitle,
              type: "CHAPTER_QUIZ",
              questions: { some: {} },
            },
            select: { id: true },
            take: 2,
          })
        : [];
      if (completedLegacyQuizzes.length === 1) {
        await tx.quiz.update({
          where: { id: completedLegacyQuizzes[0].id },
          data: { lessonId: lesson.id, chapterQuizLessonKey: lesson.id },
        });
        return completedLegacyQuizzes[0].id;
      }

      const emptyQuizzes = await tx.quiz.findMany({
        where: {
          lessonId: lesson.id,
          type: "CHAPTER_QUIZ",
        },
        select: { id: true, chapterQuizLessonKey: true },
        take: 2,
      });
      const emptyQuiz = emptyQuizzes.length === 1 ? emptyQuizzes[0] : null;
      const legacyQuizzes = canUseLegacyTitleFallback
        ? await tx.quiz.findMany({
            where: {
              courseId: lesson.module.courseId,
              lessonId: null,
              title: quizTitle,
              type: "CHAPTER_QUIZ",
            },
            select: { id: true },
            take: 2,
          })
        : [];
      const quiz =
        (emptyQuiz?.chapterQuizLessonKey === lesson.id
          ? { id: emptyQuiz.id }
          : emptyQuiz
            ? await tx.quiz.update({
                where: { id: emptyQuiz.id },
                data: { chapterQuizLessonKey: lesson.id },
                select: { id: true },
              })
            : null) ??
        (legacyQuizzes.length === 1
          ? await tx.quiz.update({
              where: { id: legacyQuizzes[0].id },
              data: { lessonId: lesson.id, chapterQuizLessonKey: lesson.id },
              select: { id: true },
            })
          : null) ??
        (await tx.quiz.upsert({
          where: { chapterQuizLessonKey: lesson.id },
          update: { lessonId: lesson.id },
          create: {
            courseId: lesson.module.courseId,
            lessonId: lesson.id,
            chapterQuizLessonKey: lesson.id,
            title: quizTitle,
            type: "CHAPTER_QUIZ",
            passingScore: 70,
          },
          select: { id: true },
        }));

      for (const q of result.questions) {
        await tx.question.create({
          data: {
            quizId: quiz.id,
            type: q.type,
            prompt: q.prompt,
            options: "options" in q ? q.options : [],
            explanations: "explanations" in q ? q.explanations : [],
            correctAnswer: "correctAnswer" in q ? q.correctAnswer : null,
            requiresImage: "requiresImage" in q ? q.requiresImage : false,
          },
        });
      }

      return quiz.id;
    });

    console.log(`Quiz generated successfully for lesson ${lessonId}: ${quizId}`);
    return quizId;
  }
}
