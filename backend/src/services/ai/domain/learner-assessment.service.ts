import { getAuthorizedQuiz } from "./learner-assessment-auth";
import prisma from "../../../lib/prisma";
import { FinalExamGeneratorService } from "./final-exam-generator.service";
import UserService from "../../../models/user/user.service";
import { completeChapterQuizLesson } from "./learner-assessment-completion";
import {
  type AuthorizedQuiz,
  type QuizAttemptResult,
  type QuizSubmissionResult,
  type ReturnToCourseResult,
  type SubmissionSummaryResult,
  type SubmitAssessmentInput,
} from "./learner-assessment-contracts";
import { submitFinalExamQuiz } from "./learner-assessment-final-submit";
import { getSubmissionSummary } from "./learner-assessment-summary";
import { stringArray } from "./lesson-quiz-review";
import { submitReviewedChapterQuiz } from "./lesson-quiz-submission";

export type {
  QuizAttemptResult,
  QuizSubmissionResult,
  ReturnToCourseResult,
  SubmissionSummaryResult,
} from "./learner-assessment-contracts";

export class LearnerAssessmentService {
  static async getAttempt(userId: string, quizId: string): Promise<QuizAttemptResult> {
    const result = await getAuthorizedQuiz(userId, quizId);
    if (result.ok === false) return result;

    const { quiz } = result;
    if (quiz.type === "CHAPTER_QUIZ") {
      const submission = await prisma.examSubmission.findUnique({
        where: { canonicalAttemptKey: canonicalAttemptKey(userId, quiz.id) },
        select: { id: true },
      });
      if (submission) {
        return {
          ok: true,
          data: {
            attemptState: "completed",
            quiz: {
              id: quiz.id,
              title: quiz.title,
              type: quiz.type,
              passingScore: quiz.passingScore,
              courseId: quiz.courseId,
              lessonId: quiz.lessonId,
            },
            submissionId: submission.id,
          },
        };
      }
    }

    if (quiz.questions.length === 0) {
      return {
        ok: false,
        status: 409,
        message: "This quiz is still being generated. Please try again shortly.",
      };
    }

    const questions = quiz.questions.map((question) => ({
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      options: Array.from(stringArray(question.options)),
      requiresImage: question.requiresImage,
    }));
    if (quiz.type === "CHAPTER_QUIZ") {
      return {
        ok: true,
        data: {
          attemptState: "open",
          quiz: {
            id: quiz.id,
            title: quiz.title,
            type: "CHAPTER_QUIZ",
            passingScore: quiz.passingScore,
            courseId: quiz.courseId,
            lessonId: quiz.lessonId,
          },
          questions,
        },
      };
    }

    return {
      ok: true,
      data: {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          type: "FINAL_EXAM",
          passingScore: quiz.passingScore,
          courseId: quiz.courseId,
          lessonId: quiz.lessonId,
        },
        questions,
      },
    };
  }

  static async submit(
    userId: string,
    quizId: string,
    input: SubmitAssessmentInput
  ): Promise<QuizSubmissionResult> {
    const result = await getAuthorizedQuiz(userId, quizId);
    if (result.ok === false) return result;

    const { quiz } = result;
    if (quiz.questions.length === 0) {
      return {
        ok: false,
        status: 409,
        message: "This quiz is still being generated. Please try again shortly.",
      };
    }

    const answers = sanitizeAnswers(input.answers, quiz);
    if (quiz.type === "CHAPTER_QUIZ") {
      return submitReviewedChapterQuiz({
        userId,
        quiz,
        answers,
        timeSpentSec: input.timeSpentSec,
        essayImageUrl: input.essayImageUrl,
        imageBase64: input.imageBase64 ?? undefined,
      });
    }

    await UserService.updateStreakOnActivity(userId).catch(e => console.error(e));

    return submitFinalExamQuiz(userId, quiz, answers, input);
  }

  static async getSubmission(
    userId: string,
    submissionId: string
  ): Promise<SubmissionSummaryResult> {
    return getSubmissionSummary(userId, submissionId);
  }

  static async returnToCourse(
    userId: string,
    submissionId: string
  ): Promise<ReturnToCourseResult> {
    return completeChapterQuizLesson(userId, submissionId);
  }
}

function canonicalAttemptKey(userId: string, quizId: string): string {
  return `${userId}:${quizId}`;
}

function sanitizeAnswers(
  answers: Record<string, unknown>,
  quiz: AuthorizedQuiz
): Record<string, string | number | boolean | null> {
  const questionIds = new Set(quiz.questions.map((question) => question.id));
  const sanitized: Record<string, string | number | boolean | null> = {};

  for (const [questionId, answer] of Object.entries(answers)) {
    if (!questionIds.has(questionId)) continue;
    if (answer === null) {
      sanitized[questionId] = null;
    } else if (typeof answer === "string") {
      sanitized[questionId] = answer;
    } else if (typeof answer === "number") {
      sanitized[questionId] = answer;
    } else if (typeof answer === "boolean") {
      sanitized[questionId] = answer;
    }
  }

  return sanitized;
}
