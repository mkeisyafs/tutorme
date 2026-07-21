export type QuizType = 'CHAPTER_QUIZ' | 'FINAL_EXAM';

export type QuizAnswer = string | number | boolean | null;

export interface FinalExamStatus {
  state: 'blocked' | 'queued' | 'generating' | 'ready';
  quizId?: string;
  reason?: string;
  completedLessons: number;
  totalLessons: number;
  canGenerate: boolean;
  retryable?: boolean;
}

export interface LearnerQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'ESSAY';
  prompt: string;
  options: string[];
  requiresImage: boolean;
}

export interface QuizAttempt {
  quiz: {
    id: string;
    title: string;
    type: QuizType;
    passingScore: number;
  };
  questions: LearnerQuestion[];
}

export interface SubmissionResult {
  submissionId: string;
  score: number;
  correctCount: number;
  gradedQuestionCount: number;
  totalQuestions: number;
  gradeLetter: string;
  passed: boolean;
  essayQuestionCount: number;
}

export interface SubmissionSummary {
  submissionId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  gradeLetter: string;
  submittedAt: string;
  quiz: {
    id: string;
    title: string;
    type: QuizType;
    courseId: string;
  };
  aiFeedback?: string;
}
