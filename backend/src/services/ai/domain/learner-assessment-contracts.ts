import type { LessonQuizReview, ReviewQuestion } from "./lesson-quiz-review";

export type QuizAnswer = string | number | boolean | null;

type AttemptQuestion = ReviewQuestion & {
  readonly requiresImage: boolean;
};

export type AssessmentFailure = {
  readonly ok: false;
  readonly status: 400 | 403 | 404 | 409 | 502;
  readonly message: string;
};

export type AuthorizedQuiz = {
  readonly id: string;
  readonly courseId: string;
  readonly lessonId: string | null;
  readonly title: string;
  readonly type: "CHAPTER_QUIZ" | "FINAL_EXAM";
  readonly passingScore: number;
  readonly questions: readonly AttemptQuestion[];
};

export type AuthorizedQuizResult =
  | { readonly ok: true; readonly quiz: AuthorizedQuiz }
  | AssessmentFailure;

type AttemptQuestionData = {
  readonly id: string;
  readonly type: "MULTIPLE_CHOICE" | "ESSAY";
  readonly prompt: string;
  readonly options: readonly string[];
  readonly requiresImage: boolean;
};

export type FinalExamAttemptData = {
  readonly quiz: {
    readonly id: string;
    readonly title: string;
    readonly type: "FINAL_EXAM";
    readonly passingScore: number;
    readonly courseId: string;
    readonly lessonId: string | null;
  };
  readonly questions: readonly AttemptQuestionData[];
};

export type OpenChapterAttemptData = {
  readonly attemptState: "open";
  readonly quiz: {
    readonly id: string;
    readonly title: string;
    readonly type: "CHAPTER_QUIZ";
    readonly passingScore: number;
    readonly courseId: string;
    readonly lessonId: string | null;
  };
  readonly questions: readonly AttemptQuestionData[];
};

export type CompletedChapterAttemptData = {
  readonly attemptState: "completed";
  readonly quiz: {
    readonly id: string;
    readonly title: string;
    readonly type: "CHAPTER_QUIZ";
    readonly passingScore: number;
    readonly courseId: string;
    readonly lessonId: string | null;
  };
  readonly submissionId: string;
};

export type QuizAttemptResult =
  | {
      readonly ok: true;
      readonly data: FinalExamAttemptData | OpenChapterAttemptData | CompletedChapterAttemptData;
    }
  | AssessmentFailure;

export type QuizSubmissionResult =
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
  | AssessmentFailure;

type BaseSubmissionSummary = {
  readonly submissionId: string;
  readonly score: number;
  readonly correctCount: number;
  readonly totalQuestions: number;
  readonly gradeLetter: string;
  readonly submittedAt: Date;
};

export type ChapterQuizSubmissionSummary = BaseSubmissionSummary & {
  readonly quiz: {
    readonly id: string;
    readonly title: string;
    readonly type: "CHAPTER_QUIZ";
    readonly courseId: string;
    readonly lessonId: string | null;
  };
  readonly userAnswers: Readonly<Record<string, QuizAnswer>>;
  readonly review: LessonQuizReview;
  readonly aiFeedback?: string;
};

export type FinalExamSubmissionSummary = BaseSubmissionSummary & {
  readonly quiz: {
    readonly id: string;
    readonly title: string;
    readonly type: "FINAL_EXAM";
    readonly courseId: string;
    readonly lessonId: string | null;
  };
  readonly aiFeedback?: string;
};

export type SubmissionSummaryResult =
  | {
      readonly ok: true;
      readonly data: ChapterQuizSubmissionSummary | FinalExamSubmissionSummary;
    }
  | AssessmentFailure;

export type ReturnToCourseResult =
  | {
      readonly ok: true;
      readonly data: {
        readonly courseId: string;
        readonly lessonId: string;
        readonly progressId: string;
        readonly status: "COMPLETED";
        readonly completedAt: Date;
        readonly progressPercentage: number;
        readonly courseCompleted: boolean;
      };
    }
  | AssessmentFailure;

export type SubmitAssessmentInput = {
  readonly answers: Record<string, unknown>;
  readonly timeSpentSec?: number;
  readonly essayImageUrl?: string | null;
  readonly imageBase64?: string | null;
};
