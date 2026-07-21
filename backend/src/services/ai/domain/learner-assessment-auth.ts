import prisma from "../../../lib/prisma";
import { FinalExamGeneratorService } from "./final-exam-generator.service";
import type { AuthorizedQuizResult } from "./learner-assessment-contracts";

export async function getAuthorizedQuiz(
  userId: string,
  quizId: string
): Promise<AuthorizedQuizResult> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      courseId: true,
      lessonId: true,
      title: true,
      type: true,
      passingScore: true,
      questions: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          type: true,
          prompt: true,
          options: true,
          explanations: true,
          requiresImage: true,
          correctAnswer: true,
        },
      },
    },
  });

  if (!quiz) return { ok: false, status: 404, message: "Quiz not found." };

  const enrollment = await prisma.userCourse.findUnique({
    where: { userId_courseId: { userId, courseId: quiz.courseId } },
    select: { id: true },
  });
  if (!enrollment) {
    return {
      ok: false,
      status: 403,
      message: "You must be enrolled in this course to access its quizzes.",
    };
  }

  if (quiz.type === "FINAL_EXAM") {
    const finalExamStatus = await FinalExamGeneratorService.getStatus(userId, quiz.courseId);
    if (finalExamStatus.state !== "ready" || finalExamStatus.quizId !== quiz.id) {
      return {
        ok: false,
        status: 409,
        message: finalExamStatus.reason || "Complete the course before attempting its final exam.",
      };
    }
  }

  return { ok: true, quiz };
}
