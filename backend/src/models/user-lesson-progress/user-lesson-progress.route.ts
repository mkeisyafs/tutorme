import { Elysia } from "elysia";
import { UserLessonProgressController } from "./user-lesson-progress.controller";
import {
  CreateUserLessonProgressBody,
  UpdateUserLessonProgressBody,
  UserLessonProgressParams,
  UserLessonProgressListQuery,
} from "./user-lesson-progress.schema";

export const userLessonProgressRoute = new Elysia({ prefix: "/lesson-progress" })
  .get("/", UserLessonProgressController.getAll, { query: UserLessonProgressListQuery })
  .get("/:id", UserLessonProgressController.getById, { params: UserLessonProgressParams })
  .post("/", UserLessonProgressController.create, { body: CreateUserLessonProgressBody })
  .patch("/:id", UserLessonProgressController.update, { params: UserLessonProgressParams, body: UpdateUserLessonProgressBody })
  .delete("/:id", UserLessonProgressController.delete, { params: UserLessonProgressParams });

export default userLessonProgressRoute;
