import { t } from "elysia";

export const CreateLessonBody = t.Object({
  moduleId: t.String(),
  title: t.String(),
  content: t.Optional(t.String()),
  videoUrl: t.Optional(t.String()),
  orderIndex: t.Optional(t.Number({ minimum: 0 })),
});

export const UpdateLessonBody = t.Object({
  title: t.Optional(t.String()),
  content: t.Optional(t.Nullable(t.String())),
  videoUrl: t.Optional(t.Nullable(t.String())),
  orderIndex: t.Optional(t.Number({ minimum: 0 })),
});

export const LessonParams = t.Object({
  id: t.String(),
});

export const LessonListQuery = t.Object({
  skip: t.Optional(t.Numeric({ minimum: 0 })),
  take: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  moduleId: t.Optional(t.String()),
});

// --- Types ---

export type CreateLessonBody = typeof CreateLessonBody.static;
export type UpdateLessonBody = typeof UpdateLessonBody.static;
export type LessonParams = typeof LessonParams.static;
export type LessonListQuery = typeof LessonListQuery.static;
