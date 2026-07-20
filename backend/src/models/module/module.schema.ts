import { t } from "elysia";

export const CreateModuleBody = t.Object({
  courseId: t.String(),
  title: t.String(),
  description: t.Optional(t.String()),
  orderIndex: t.Optional(t.Number({ minimum: 0 })),
});

export const UpdateModuleBody = t.Object({
  title: t.Optional(t.String()),
  description: t.Optional(t.Nullable(t.String())),
  orderIndex: t.Optional(t.Number({ minimum: 0 })),
});

export const ModuleParams = t.Object({
  id: t.String(),
});

export const ModuleListQuery = t.Object({
  skip: t.Optional(t.Numeric({ minimum: 0 })),
  take: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  courseId: t.Optional(t.String()),
});

// --- Types ---

export type CreateModuleBody = typeof CreateModuleBody.static;
export type UpdateModuleBody = typeof UpdateModuleBody.static;
export type ModuleParams = typeof ModuleParams.static;
export type ModuleListQuery = typeof ModuleListQuery.static;
