import prisma from "../../../lib/prisma";
import type { SubmissionSummaryResult } from "./learner-assessment-contracts";
import { LessonQuizReviewSchema } from "./lesson-quiz-review";

export async function getSubmissionSummary(
  userId: string,
  submissionId: string
): Promise<SubmissionSummaryResult> {
  const submission = await prisma.examSubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      userId: true,
      score: true,
      correctCount: true,
      totalQuestions: true,
      gradeLetter: true,
      submittedAt: true,
      aiFeedback: true,
      review: true,
      userAnswers: true,
      quiz: {
        select: {
          id: true,
          title: true,
          type: true,
          courseId: true,
          lessonId: true,
        },
      },
    },
  });

  if (!submission) return { ok: false, status: 404, message: "Submission not found." };
  if (submission.userId !== userId) {
    return {
      ok: false,
      status: 403,
      message: "You cannot access another learner's submission.",
    };
  }

  const review = submission.review && submission.quiz.type === "CHAPTER_QUIZ"
    ? LessonQuizReviewSchema.safeParse(submission.review)
    : null;
  if (review !== null && !review.success) {
    return { ok: false, status: 409, message: "Saved quiz review is unavailable." };
  }

  const parsedUserAnswers = submission.userAnswers != null
    ? (submission.userAnswers as Record<string, unknown>)
    : undefined;

  return {
    ok: true,
    data: {
      submissionId: submission.id,
      score: submission.score,
      correctCount: submission.correctCount,
      totalQuestions: submission.totalQuestions,
      gradeLetter: submission.gradeLetter,
      submittedAt: submission.submittedAt,
      quiz: submission.quiz,
      ...(parsedUserAnswers !== undefined ? { userAnswers: parsedUserAnswers } : {}),
      ...(review?.success ? { review: review.data } : {}),
      ...(submission.aiFeedback !== null ? { aiFeedback: submission.aiFeedback } : {}),
    } as any,
  };
}
