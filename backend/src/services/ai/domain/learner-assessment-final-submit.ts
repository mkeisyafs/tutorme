import prisma from "../../../lib/prisma";
import { answerIndex, buildLessonQuizReview, LessonQuizReviewError } from "./lesson-quiz-review";
import { requestEssayReview } from "./lesson-quiz-review-ai";
import { FinalExamGeneratorService } from "./final-exam-generator.service";
import type { AuthorizedQuiz, QuizSubmissionResult, SubmitAssessmentInput } from "./learner-assessment-contracts";

export async function submitFinalExamQuiz(
  userId: string,
  quiz: AuthorizedQuiz,
  answers: Record<string, string | number | boolean | null>,
  input: SubmitAssessmentInput
): Promise<QuizSubmissionResult> {
  if (!quiz.courseId) {
    return { ok: false, status: 409, message: "Final exam is missing course association." };
  }

  let courseMaterial: string;
  try {
    courseMaterial = await FinalExamGeneratorService.getCourseMaterialForExam(userId, quiz.courseId);
  } catch (err: any) {
    return { ok: false, status: 409, message: err.message || "Course material unavailable." };
  }

  try {
    const essayReview = await requestEssayReview({
      lessonContent: courseMaterial,
      questions: quiz.questions,
      answers,
    });
    
    const review = buildLessonQuizReview({
      questions: quiz.questions,
      answers,
      essayReview,
    });
    
    const gradeLetter = gradeLetterFor(review.score);

    const submission = await prisma.examSubmission.create({
      data: {
        userId,
        quizId: quiz.id,
        score: review.score,
        correctCount: review.correctCount,
        totalQuestions: review.totalQuestions,
        timeSpentSec: Math.max(0, Math.floor(input.timeSpentSec ?? 0)),
        gradeLetter,
        userAnswers: answers,
        essayImageUrl: input.essayImageUrl ?? null,
        aiFeedback: review.aggregateFeedback,
        review: review as any,
      },
      select: { id: true },
    });

    return {
      ok: true,
      data: {
        submissionId: submission.id,
        score: review.score,
        correctCount: review.correctCount,
        gradedQuestionCount: review.totalQuestions,
        totalQuestions: review.totalQuestions,
        gradeLetter,
        passed: review.score >= quiz.passingScore,
        essayQuestionCount: quiz.questions.filter((q) => q.type === "ESSAY").length,
      },
    };
  } catch (reviewError) {
    console.error("Final exam review error:", reviewError);
    return {
      ok: false,
      status: 502,
      message:
        reviewError instanceof LessonQuizReviewError
          ? reviewError.message
          : "The grading service encountered an unexpected error.",
    };
  }
}

function gradeLetterFor(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
