import { t } from "elysia";

export const CourseColorEnum = t.Union([
  t.Literal("blue"),
  t.Literal("yellow"),
  t.Literal("green"),
  t.Literal("pink"),
  t.Literal("purple"),
]);

export const CreateCourseBody = t.Object({
  title: t.String(),
  description: t.String(),
  category: t.String(),
  level: t.Optional(
    t.String({ default: "Beginner" })
  ),
  color: t.Optional(CourseColorEnum),
  rotation: t.Optional(t.String({ default: "rotate-1" })),
  creatorId: t.String(),
  isPublic: t.Optional(t.Boolean({ default: false })),
});

export const UpdateCourseBody = t.Object({
  title: t.Optional(t.String()),
  description: t.Optional(t.String()),
  category: t.Optional(t.String()),
  level: t.Optional(t.String()),
  color: t.Optional(CourseColorEnum),
  rotation: t.Optional(t.String()),
  isPublic: t.Optional(t.Boolean()),
  downloadsCount: t.Optional(t.Number({ minimum: 0 })),
  likesCount: t.Optional(t.Number({ minimum: 0 })),
});

export const CourseParams = t.Object({
  id: t.String(),
});

export const CourseListQuery = t.Object({
  skip: t.Optional(t.Numeric({ minimum: 0 })),
  take: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  search: t.Optional(t.String()),
  category: t.Optional(t.String()),
  level: t.Optional(t.String()),
  creatorId: t.Optional(t.String()),
  isPublic: t.Optional(t.BooleanString()),
});

// --- Types ---

export type CreateCourseBody = typeof CreateCourseBody.static;
export type UpdateCourseBody = typeof UpdateCourseBody.static;
export type CourseParams = typeof CourseParams.static;
export type CourseListQuery = typeof CourseListQuery.static;
