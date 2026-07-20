import { t } from "elysia";

export const QuizTypeEnum = t.Union([
  t.Literal("CHAPTER_QUIZ"),
  t.Literal("FINAL_EXAM"),
]);

export const CreateQuizBody = t.Object({
  courseId: t.String(),
  title: t.String(),
  type: t.Optional(QuizTypeEnum),
  passingScore: t.Optional(t.Number({ minimum: 0, maximum: 100, default: 70 })),
});

export const UpdateQuizBody = t.Object({
  title: t.Optional(t.String()),
  type: t.Optional(QuizTypeEnum),
  passingScore: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
});

export const QuizParams = t.Object({
  id: t.String(),
});

export const QuizListQuery = t.Object({
  skip: t.Optional(t.Numeric({ minimum: 0 })),
  take: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  courseId: t.Optional(t.String()),
  type: t.Optional(QuizTypeEnum),
});

// --- Types ---

export type CreateQuizBody = typeof CreateQuizBody.static;
export type UpdateQuizBody = typeof UpdateQuizBody.static;
export type QuizParams = typeof QuizParams.static;
export type QuizListQuery = typeof QuizListQuery.static;
