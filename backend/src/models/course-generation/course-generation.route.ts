import { Elysia } from "elysia";
import { CourseGenerationController } from "./course-generation.controller";
import {
  CreateCourseGenerationBody,
  UpdateCourseGenerationBody,
  CourseGenerationParams,
  CourseGenerationListQuery,
} from "./course-generation.schema";

export const courseGenerationRoute = new Elysia({ prefix: "/course-generations" })
  .get("/", CourseGenerationController.getAll, { query: CourseGenerationListQuery })
  .get("/:id", CourseGenerationController.getById, { params: CourseGenerationParams })
  .post("/", CourseGenerationController.create, { body: CreateCourseGenerationBody })
  .patch("/:id", CourseGenerationController.update, { params: CourseGenerationParams, body: UpdateCourseGenerationBody })
  .delete("/:id", CourseGenerationController.delete, { params: CourseGenerationParams });

export default courseGenerationRoute;
