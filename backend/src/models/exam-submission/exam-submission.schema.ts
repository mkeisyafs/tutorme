import { t } from "elysia";

export const CreateExamSubmissionBody = t.Object({
  userId: t.String(),
  quizId: t.String(),
  score: t.Number({ minimum: 0, maximum: 100 }),
  correctCount: t.Number({ minimum: 0 }),
  totalQuestions: t.Number({ minimum: 1 }),
  timeSpentSec: t.Number({ minimum: 0 }),
  gradeLetter: t.String(),
  userAnswers: t.Any(),
  essayImageUrl: t.Optional(t.Nullable(t.String())),
  aiFeedback: t.Optional(t.Nullable(t.String())),
});

export const UpdateExamSubmissionBody = t.Object({
  aiFeedback: t.Optional(t.Nullable(t.String())),
  essayImageUrl: t.Optional(t.Nullable(t.String())),
});

export const ExamSubmissionParams = t.Object({
  id: t.String(),
});

export const ExamSubmissionListQuery = t.Object({
  skip: t.Optional(t.Numeric({ minimum: 0 })),
  take: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  userId: t.Optional(t.String()),
  quizId: t.Optional(t.String()),
});

// --- Types ---

export type CreateExamSubmissionBody = typeof CreateExamSubmissionBody.static;
export type UpdateExamSubmissionBody = typeof UpdateExamSubmissionBody.static;
export type ExamSubmissionParams = typeof ExamSubmissionParams.static;
export type ExamSubmissionListQuery = typeof ExamSubmissionListQuery.static;
