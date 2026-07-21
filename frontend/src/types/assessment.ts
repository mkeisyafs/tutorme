export type QuizType = 'CHAPTER_QUIZ' | 'FINAL_EXAM';

export type QuizAnswer = string | number | boolean | null;

export type QuizMetadata = {
  readonly id: string;
  readonly title: string;
  readonly passingScore: number;
  readonly courseId: string;
  readonly lessonId: string | null;
};

export type ChapterQuizMetadata = QuizMetadata & {
  readonly type: 'CHAPTER_QUIZ';
};

export type FinalExamMetadata = QuizMetadata & {
  readonly type: 'FINAL_EXAM';
};

export interface FinalExamStatus {
  state: 'blocked' | 'queued' | 'generating' | 'ready';
  quizId?: string;
  reason?: string;
  completedLessons: number;
  totalLessons: number;
  canGenerate: boolean;
  retryable?: boolean;
}

export type LearnerQuestion = {
  readonly id: string;
  readonly type: 'MULTIPLE_CHOICE' | 'ESSAY';
  readonly prompt: string;
  readonly options: readonly string[];
  readonly requiresImage: boolean;
};

export type OpenChapterQuizAttempt = {
  readonly attemptState: 'open';
  readonly quiz: ChapterQuizMetadata;
  readonly questions: readonly LearnerQuestion[];
};

export type CompletedChapterQuizAttempt = {
  readonly attemptState: 'completed';
  readonly quiz: ChapterQuizMetadata;
  readonly submissionId: string;
};

export type FinalExamAttempt = {
  readonly quiz: FinalExamMetadata;
  readonly questions: readonly LearnerQuestion[];
};

export type QuizAttempt = OpenChapterQuizAttempt | CompletedChapterQuizAttempt | FinalExamAttempt;

export type ActiveQuizAttempt = OpenChapterQuizAttempt | FinalExamAttempt;

export type SubmissionResult = {
  readonly submissionId: string;
  readonly score: number;
  readonly correctCount: number;
  readonly gradedQuestionCount: number;
  readonly totalQuestions: number;
  readonly gradeLetter: string;
  readonly passed: boolean;
  readonly essayQuestionCount: number;
};

export type MultipleChoiceQuestionReview = {
  readonly type: 'MULTIPLE_CHOICE';
  readonly score: 0 | 100;
  readonly selectedAnswer: number | null;
  readonly correctAnswer: number | null;
  readonly isCorrect: boolean;
  readonly options: readonly {
    readonly index: number;
    readonly text: string;
    readonly isSelected: boolean;
    readonly isCorrect: boolean;
    readonly explanation: string;
  }[];
};

export type EssayQuestionReview = {
  readonly type: 'ESSAY';
  readonly score: number;
  readonly rationale: string;
  readonly strengths: readonly string[];
  readonly improvements: readonly string[];
};

export type LessonQuizReview = {
  readonly version: 1;
  readonly aggregateFeedback: string;
  readonly score: number;
  readonly correctCount: number;
  readonly totalQuestions: number;
  readonly questions: Readonly<Record<string, MultipleChoiceQuestionReview | EssayQuestionReview>>;
};

export type SubmissionSummary = {
  readonly submissionId: string;
  readonly score: number;
  readonly correctCount: number;
  readonly totalQuestions: number;
  readonly gradeLetter: string;
  readonly submittedAt: string;
  readonly quiz: {
    readonly id: string;
    readonly title: string;
    readonly type: QuizType;
    readonly courseId: string;
    readonly lessonId: string | null;
  };
  readonly userAnswers?: Readonly<Record<string, QuizAnswer>>;
  readonly review?: LessonQuizReview;
  readonly aiFeedback?: string;
};

export type ReturnToCourseResponse = {
  readonly courseId: string;
  readonly lessonId: string;
  readonly progressId: string;
  readonly status: 'COMPLETED';
  readonly completedAt: string;
  readonly progressPercentage: number;
  readonly courseCompleted: boolean;
};
