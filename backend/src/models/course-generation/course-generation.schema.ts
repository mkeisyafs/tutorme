import { t } from "elysia";

export const GenerationStatusEnum = t.Union([
  t.Literal("PENDING"),
  t.Literal("PROCESSING"),
  t.Literal("COMPLETED"),
  t.Literal("FAILED"),
]);

export const CreateCourseGenerationBody = t.Object({
  userId: t.String(),
  promptTopic: t.String(),
  familiarity: t.String(),
  enableEssayQuestions: t.Optional(t.Boolean({ default: true })),
  requireImageSubmission: t.Optional(t.Boolean({ default: false })),
});

export const UpdateCourseGenerationBody = t.Object({
  status: t.Optional(GenerationStatusEnum),
  resultCourseId: t.Optional(t.Nullable(t.String())),
  errorMessage: t.Optional(t.Nullable(t.String())),
});

export const CourseGenerationParams = t.Object({
  id: t.String(),
});

export const CourseGenerationListQuery = t.Object({
  skip: t.Optional(t.Numeric({ minimum: 0 })),
  take: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  userId: t.Optional(t.String()),
  status: t.Optional(GenerationStatusEnum),
});

// --- Types ---

export type CreateCourseGenerationBody = typeof CreateCourseGenerationBody.static;
export type UpdateCourseGenerationBody = typeof UpdateCourseGenerationBody.static;
export type CourseGenerationParams = typeof CourseGenerationParams.static;
export type CourseGenerationListQuery = typeof CourseGenerationListQuery.static;
