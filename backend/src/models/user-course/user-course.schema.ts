import { t } from "elysia";

export const CreateUserCourseBody = t.Object({
  userId: t.String(),
  courseId: t.String(),
});

export const UpdateUserCourseBody = t.Object({
  progressPercentage: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
  isCompleted: t.Optional(t.Boolean()),
});

export const UserCourseParams = t.Object({
  id: t.String(),
});

export const UserCourseListQuery = t.Object({
  skip: t.Optional(t.Numeric({ minimum: 0 })),
  take: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  userId: t.Optional(t.String()),
  courseId: t.Optional(t.String()),
});

// --- Types ---

export type CreateUserCourseBody = typeof CreateUserCourseBody.static;
export type UpdateUserCourseBody = typeof UpdateUserCourseBody.static;
export type UserCourseParams = typeof UserCourseParams.static;
export type UserCourseListQuery = typeof UserCourseListQuery.static;
