import prisma from "../../../lib/prisma";
import UserLessonProgressService from "../../../models/user-lesson-progress/user-lesson-progress.service";
import type { ReturnToCourseResult } from "./learner-assessment-contracts";

export async function completeChapterQuizLesson(
  userId: string,
  submissionId: string
): Promise<ReturnToCourseResult> {
  const submission = await prisma.examSubmission.findUnique({
    where: { id: submissionId },
    select: {
      userId: true,
      quiz: {
        select: {
          type: true,
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
      message: "You cannot complete a lesson from another learner's submission.",
    };
  }
  if (submission.quiz.type !== "CHAPTER_QUIZ") {
    return { ok: false, status: 409, message: "Only lesson quiz submissions can complete a lesson." };
  }
  if (submission.quiz.lessonId === null) {
    return { ok: false, status: 409, message: "This lesson quiz is not linked to a lesson yet." };
  }

  const progress = await UserLessonProgressService.completeLesson(userId, submission.quiz.lessonId);
  if (!progress) {
    return { ok: false, status: 409, message: "Unable to update lesson progress for this submission." };
  }

  return { ok: true, data: progress };
}
