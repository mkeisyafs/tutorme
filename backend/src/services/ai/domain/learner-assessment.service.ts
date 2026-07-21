import prisma from "../../../lib/prisma";
import { FinalExamGeneratorService } from "./final-exam-generator.service";
import UserService from "../../../models/user/user.service";

type AssessmentFailure = {
  ok: false;
  status: 403 | 404 | 409;
  message: string;
};

type AuthorizedQuiz = {
  id: string;
  courseId: string;
  title: string;
  type: "CHAPTER_QUIZ" | "FINAL_EXAM";
  passingScore: number;
  questions: Array<{
    id: string;
    type: "MULTIPLE_CHOICE" | "ESSAY";
    prompt: string;
    options: unknown;
    requiresImage: boolean;
    correctAnswer: number | null;
  }>;
};

type AuthorizedQuizResult =
  | { ok: true; quiz: AuthorizedQuiz }
  | AssessmentFailure;

export type QuizAttemptResult =
  | {
      ok: true;
      data: {
        quiz: {
          id: string;
          title: string;
          type: "CHAPTER_QUIZ" | "FINAL_EXAM";
          passingScore: number;
        };
        questions: Array<{
          id: string;
          type: "MULTIPLE_CHOICE" | "ESSAY";
          prompt: string;
          options: string[];
          requiresImage: boolean;
        }>;
      };
    }
  | AssessmentFailure;

export type QuizSubmissionResult =
  | {
      ok: true;
      data: {
        submissionId: string;
        score: number;
        correctCount: number;
        gradedQuestionCount: number;
        totalQuestions: number;
        gradeLetter: string;
        passed: boolean;
        essayQuestionCount: number;
      };
    }
  | AssessmentFailure;

export type SubmissionSummaryResult =
  | {
      ok: true;
      data: {
        submissionId: string;
        score: number;
        correctCount: number;
        totalQuestions: number;
        gradeLetter: string;
        submittedAt: Date;
        quiz: {
          id: string;
          title: string;
          type: "CHAPTER_QUIZ" | "FINAL_EXAM";
          courseId: string;
        };
        aiFeedback?: string;
      };
    }
  | AssessmentFailure;

/**
 * Learner-facing assessment methods. Correct answers and explanations stay in
 * this service and are never returned by the attempt or submission contracts.
 */
export class LearnerAssessmentService {
  static async getAttempt(userId: string, quizId: string): Promise<QuizAttemptResult> {
    const result = await this.getAuthorizedQuiz(userId, quizId);
    if (!result.ok) return result;

    const { quiz } = result;
    if (quiz.questions.length === 0) {
      return {
        ok: false,
        status: 409,
        message: "This quiz is still being generated. Please try again shortly.",
      };
    }

    return {
      ok: true,
      data: {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          type: quiz.type,
          passingScore: quiz.passingScore,
        },
        questions: quiz.questions.map((question) => ({
          id: question.id,
          type: question.type,
          prompt: question.prompt,
          options: this.stringOptions(question.options),
          requiresImage: question.requiresImage,
        })),
      },
    };
  }

  static async submit(
    userId: string,
    quizId: string,
    input: {
      answers: Record<string, unknown>;
      timeSpentSec?: number;
      essayImageUrl?: string | null;
    }
  ): Promise<QuizSubmissionResult> {
    const result = await this.getAuthorizedQuiz(userId, quizId);
    if (!result.ok) return result;

    const { quiz } = result;
    if (quiz.questions.length === 0) {
      return {
        ok: false,
        status: 409,
        message: "This quiz is still being generated. Please try again shortly.",
      };
    }

    const answers = this.sanitizeAnswers(input.answers, quiz.questions);
    const multipleChoiceQuestions = quiz.questions.filter(
      (question) => question.type === "MULTIPLE_CHOICE"
    );
    const correctCount = multipleChoiceQuestions.reduce((count, question) => {
      const selectedAnswer = this.answerIndex(answers[question.id]);
      return question.correctAnswer !== null && selectedAnswer === question.correctAnswer
        ? count + 1
        : count;
    }, 0);
    const gradedQuestionCount = multipleChoiceQuestions.length;
    const score =
      gradedQuestionCount === 0
        ? 0
        : Math.round((correctCount / gradedQuestionCount) * 100);
    const gradeLetter = this.gradeLetter(score);

    const submission = await prisma.examSubmission.create({
      data: {
        userId,
        quizId: quiz.id,
        score,
        correctCount,
        totalQuestions: quiz.questions.length,
        timeSpentSec: Math.max(0, Math.floor(input.timeSpentSec ?? 0)),
        gradeLetter,
        userAnswers: answers,
        essayImageUrl: input.essayImageUrl ?? null,
      },
      select: { id: true },
    });

    await UserService.updateStreakOnActivity(userId);

    return {
      ok: true,
      data: {
        submissionId: submission.id,
        score,
        correctCount,
        gradedQuestionCount,
        totalQuestions: quiz.questions.length,
        gradeLetter,
        passed: score >= quiz.passingScore,
        essayQuestionCount: quiz.questions.length - gradedQuestionCount,
      },
    };
  }

  static async getSubmission(
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
        quiz: {
          select: {
            id: true,
            title: true,
            type: true,
            courseId: true,
          },
        },
      },
    });

    if (!submission) {
      return { ok: false, status: 404, message: "Submission not found." };
    }
    if (submission.userId !== userId) {
      return {
        ok: false,
        status: 403,
        message: "You cannot access another learner's submission.",
      };
    }

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
        ...(submission.aiFeedback !== null
          ? { aiFeedback: submission.aiFeedback }
          : {}),
      },
    };
  }

  private static async getAuthorizedQuiz(
    userId: string,
    quizId: string
  ): Promise<AuthorizedQuizResult> {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        courseId: true,
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
            requiresImage: true,
            correctAnswer: true,
          },
        },
      },
    });

    if (!quiz) {
      return { ok: false, status: 404, message: "Quiz not found." };
    }

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
          message:
            finalExamStatus.reason ||
            "Complete the course before attempting its final exam.",
        };
      }
    }

    return { ok: true, quiz };
  }

  private static stringOptions(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value.filter((option): option is string => typeof option === "string");
  }

  private static sanitizeAnswers(
    answers: Record<string, unknown>,
    questions: AuthorizedQuiz["questions"]
  ) {
    const questionIds = new Set(questions.map((question) => question.id));
    const sanitized: Record<string, string | number | boolean | null> = {};

    for (const [questionId, answer] of Object.entries(answers)) {
      if (!questionIds.has(questionId)) continue;
      if (
        answer === null ||
        typeof answer === "string" ||
        typeof answer === "number" ||
        typeof answer === "boolean"
      ) {
        sanitized[questionId] = answer;
      }
    }

    return sanitized;
  }

  private static answerIndex(answer: string | number | boolean | null | undefined) {
    if (typeof answer === "number" && Number.isInteger(answer)) return answer;
    if (typeof answer === "string" && /^\d+$/.test(answer)) return Number(answer);
    return null;
  }

  private static gradeLetter(score: number) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    return "Review";
  }
}
