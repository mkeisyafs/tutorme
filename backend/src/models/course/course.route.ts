import { Elysia } from "elysia";
import { CourseController } from "./course.controller";
import {
  CreateCourseBody,
  UpdateCourseBody,
  CourseParams,
  CourseListQuery,
} from "./course.schema";

export const courseRoute = new Elysia({ prefix: "/courses" })
  .get("/", CourseController.getAll, { query: CourseListQuery })
  .get("/:id", CourseController.getById, { params: CourseParams })
  .post("/", CourseController.create, { body: CreateCourseBody })
  .patch("/:id", CourseController.update, { params: CourseParams, body: UpdateCourseBody })
  .delete("/:id", CourseController.delete, { params: CourseParams });

export default courseRoute;
