import { t } from "elysia";

// --- Validation Schemas ---

export const CreateUserBody = t.Object({
  email: t.String({ format: "email" }),
  passwordHash: t.String(),
  fullName: t.String(),
});

export const UpdateUserBody = t.Object({
  email: t.Optional(t.String({ format: "email" })),
  passwordHash: t.Optional(t.String()),
  fullName: t.Optional(t.String()),
  streakCount: t.Optional(t.Number({ minimum: 0 })),
  notificationsEnabled: t.Optional(t.Boolean()),
  pomodoroEnabled: t.Optional(t.Boolean()),
});

export const UpdateProfileBody = t.Object({
  fullName: t.String({ minLength: 1 }),
});

export const UpdateAccountSecurityBody = t.Object({
  email: t.String({ format: "email" }),
  password: t.Optional(t.String({ minLength: 8 })),
});

export const SoftDeleteUserBody = t.Object({
  password: t.String({ minLength: 1 }),
});

export const UserParams = t.Object({
  id: t.String(),
});

export const UserListQuery = t.Object({
  skip: t.Optional(t.Numeric({ minimum: 0 })),
  take: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  search: t.Optional(t.String()),
});

// --- Types ---

export type CreateUserBody = typeof CreateUserBody.static;
export type UpdateUserBody = typeof UpdateUserBody.static;
export type UpdateProfileBody = typeof UpdateProfileBody.static;
export type UpdateAccountSecurityBody = typeof UpdateAccountSecurityBody.static;
export type SoftDeleteUserBody = typeof SoftDeleteUserBody.static;
export type UserParams = typeof UserParams.static;
export type UserListQuery = typeof UserListQuery.static;
