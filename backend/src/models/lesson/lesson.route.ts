import { Elysia } from "elysia";
import { LessonController } from "./lesson.controller";
import {
  CreateLessonBody,
  UpdateLessonBody,
  LessonParams,
  LessonListQuery,
} from "./lesson.schema";

export const lessonRoute = new Elysia({ prefix: "/lessons" })
  .get("/", LessonController.getAll, { query: LessonListQuery })
  .get("/:id", LessonController.getById, { params: LessonParams })
  .post("/", LessonController.create, { body: CreateLessonBody })
  .patch("/:id", LessonController.update, { params: LessonParams, body: UpdateLessonBody })
  .delete("/:id", LessonController.delete, { params: LessonParams });

export default lessonRoute;
