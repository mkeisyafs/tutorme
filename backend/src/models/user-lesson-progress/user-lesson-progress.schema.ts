import { t } from "elysia";

export const LessonStatusEnum = t.Union([
  t.Literal("LOCKED"),
  t.Literal("IN_PROGRESS"),
  t.Literal("COMPLETED"),
]);

export const CreateUserLessonProgressBody = t.Object({
  userId: t.String(),
  lessonId: t.String(),
  status: t.Optional(LessonStatusEnum),
});

export const UpdateUserLessonProgressBody = t.Object({
  status: t.Optional(LessonStatusEnum),
  completedAt: t.Optional(t.Nullable(t.String({ format: "date-time" }))),
});

export const UserLessonProgressParams = t.Object({
  id: t.String(),
});

export const UserLessonProgressListQuery = t.Object({
  skip: t.Optional(t.Numeric({ minimum: 0 })),
  take: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  userId: t.Optional(t.String()),
  lessonId: t.Optional(t.String()),
  status: t.Optional(LessonStatusEnum),
});

// --- Types ---

export type CreateUserLessonProgressBody = typeof CreateUserLessonProgressBody.static;
export type UpdateUserLessonProgressBody = typeof UpdateUserLessonProgressBody.static;
export type UserLessonProgressParams = typeof UserLessonProgressParams.static;
export type UserLessonProgressListQuery = typeof UserLessonProgressListQuery.static;
