import { Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import { getLessonPlainContent } from "./lesson-blocks";
import { buildLessonQuizReview, LessonQuizReviewError, type ReviewQuestion } from "./lesson-quiz-review";
import { requestEssayReview } from "./lesson-quiz-review-ai";

export type ReviewedChapterQuiz = {
  readonly id: string;
  readonly lessonId: string | null;
  readonly passingScore: number;
  readonly questions: readonly ReviewQuestion[];
};

export type ReviewedSubmissionInput = {
  readonly userId: string;
  readonly quiz: ReviewedChapterQuiz;
  readonly answers: Record<string, string | number | boolean | null>;
  readonly timeSpentSec?: number;
  readonly essayImageUrl?: string | null;
  readonly imageBase64?: string | null;
};

export type ReviewedSubmissionResult =
  | {
      readonly ok: true;
      readonly data: {
        readonly submissionId: string;
        readonly score: number;
        readonly correctCount: number;
        readonly gradedQuestionCount: number;
        readonly totalQuestions: number;
        readonly gradeLetter: string;
        readonly passed: boolean;
        readonly essayQuestionCount: number;
      };
    }
  | { readonly ok: false; readonly status: 409 | 400 | 502; readonly message: string };

export async function submitReviewedChapterQuiz(
  input: ReviewedSubmissionInput
): Promise<ReviewedSubmissionResult> {
  if (input.quiz.lessonId === null) {
    return { ok: false, status: 409, message: "This lesson quiz is not linked to a lesson yet." };
  }

  // Validate image requirement: if any essay question requires an image, the image must be provided.
  const imageRequiredQuestions = input.quiz.questions.filter(
    (q) => q.type === "ESSAY" && (q as ReviewQuestion & { requiresImage?: boolean }).requiresImage
  );
  if (imageRequiredQuestions.length > 0 && !input.imageBase64) {
    return {
      ok: false,
      status: 400,
      message: "This quiz requires an image upload for the essay question. Please attach an image and resubmit.",
    };
  }

  const canonicalKey = canonicalAttemptKey(input.userId, input.quiz.id);
  const existingSubmission = await findCanonicalSubmission(canonicalKey);
  if (existingSubmission) return existingResult(existingSubmission, input.quiz);

  const lesson = await prisma.lesson.findUnique({
    where: { id: input.quiz.lessonId },
    select: { content: true },
  });
  if (!lesson?.content) {
    return { ok: false, status: 409, message: "Generate the lesson before reviewing its quiz." };
  }

  try {
    const essayReview = await requestEssayReview({
      lessonContent: getLessonPlainContent(lesson.content),
      questions: input.quiz.questions,
      answers: input.answers,
      imageBase64: input.imageBase64 ?? undefined,
    });
    const review = buildLessonQuizReview({
      questions: input.quiz.questions,
      answers: input.answers,
      essayReview,
    });
    const gradeLetter = gradeLetterFor(review.score);
    const submission = await prisma.examSubmission.create({
      data: {
        userId: input.userId,
        quizId: input.quiz.id,
        score: review.score,
        correctCount: review.correctCount,
        totalQuestions: review.totalQuestions,
        timeSpentSec: Math.max(0, Math.floor(input.timeSpentSec ?? 0)),
        gradeLetter,
        userAnswers: input.answers,
        // Store a note that image was provided (full base64 is too large for DB storage)
        essayImageUrl: input.imageBase64 ? `base64:image_provided` : (input.essayImageUrl ?? null),
        aiFeedback: review.aggregateFeedback,
        review,
        canonicalAttemptKey: canonicalKey,
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
        passed: review.score >= input.quiz.passingScore,
        essayQuestionCount: input.quiz.questions.filter((question) => question.type === "ESSAY").length,
      },
    };
  } catch (reviewError) {
    if (reviewError instanceof Prisma.PrismaClientKnownRequestError && reviewError.code === "P2002") {
      const winningSubmission = await findCanonicalSubmission(canonicalKey);
      if (winningSubmission) return existingResult(winningSubmission, input.quiz);
      return {
        ok: false,
        status: 409,
        message: "This quiz attempt was already submitted. Reopen the saved result and try again.",
      };
    }
    if (reviewError instanceof LessonQuizReviewError || reviewError instanceof Error) {
      return {
        ok: false,
        status: 502,
        message: "Quiz review is temporarily unavailable. Your answers were not submitted; please retry.",
      };
    }
    throw reviewError;
  }
}

type CanonicalSubmission = {
  readonly id: string;
  readonly score: number;
  readonly correctCount: number;
  readonly totalQuestions: number;
  readonly gradeLetter: string;
};

async function findCanonicalSubmission(canonicalAttemptKey: string): Promise<CanonicalSubmission | null> {
  return prisma.examSubmission.findUnique({
    where: { canonicalAttemptKey },
    select: {
      id: true,
      score: true,
      correctCount: true,
      totalQuestions: true,
      gradeLetter: true,
    },
  });
}

function existingResult(
  submission: CanonicalSubmission,
  quiz: ReviewedChapterQuiz
): ReviewedSubmissionResult {
  return {
    ok: true,
    data: {
      submissionId: submission.id,
      score: submission.score,
      correctCount: submission.correctCount,
      gradedQuestionCount: submission.totalQuestions,
      totalQuestions: submission.totalQuestions,
      gradeLetter: submission.gradeLetter,
      passed: submission.score >= quiz.passingScore,
      essayQuestionCount: quiz.questions.filter((question) => question.type === "ESSAY").length,
    },
  };
}

function canonicalAttemptKey(userId: string, quizId: string): string {
  return `${userId}:${quizId}`;
}

function gradeLetterFor(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
