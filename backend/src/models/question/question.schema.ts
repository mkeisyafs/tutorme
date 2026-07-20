import { t } from "elysia";

export const QuestionTypeEnum = t.Union([
  t.Literal("MULTIPLE_CHOICE"),
  t.Literal("ESSAY"),
]);

export const CreateQuestionBody = t.Object({
  quizId: t.String(),
  type: QuestionTypeEnum,
  prompt: t.String(),
  options: t.Optional(t.Any()),
  explanations: t.Optional(t.Any()),
  correctAnswer: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
  requiresImage: t.Optional(t.Boolean({ default: false })),
});

export const UpdateQuestionBody = t.Object({
  type: t.Optional(QuestionTypeEnum),
  prompt: t.Optional(t.String()),
  options: t.Optional(t.Any()),
  explanations: t.Optional(t.Any()),
  correctAnswer: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
  requiresImage: t.Optional(t.Boolean()),
});

export const QuestionParams = t.Object({
  id: t.String(),
});

export const QuestionListQuery = t.Object({
  skip: t.Optional(t.Numeric({ minimum: 0 })),
  take: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  quizId: t.Optional(t.String()),
  type: t.Optional(QuestionTypeEnum),
});

// --- Types ---

export type CreateQuestionBody = typeof CreateQuestionBody.static;
export type UpdateQuestionBody = typeof UpdateQuestionBody.static;
export type QuestionParams = typeof QuestionParams.static;
export type QuestionListQuery = typeof QuestionListQuery.static;
