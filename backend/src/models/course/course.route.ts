import { Elysia } from "elysia";
import { CourseController } from "./course.controller";
import {
  CreateCourseBody,
  UpdateCourseBody,
  CourseParams,
  CourseListQuery,
} from "./course.schema";
import { requireAuth } from "../../middleware/auth";

const libraryRoute = new Elysia()
  .use(requireAuth)
  .get("/library", CourseController.getLibrary, { query: CourseListQuery })
  .get("/mine", CourseController.getMine)
  .patch("/:id/share", CourseController.share, { params: CourseParams })
  .post("/:id/reuse", CourseController.reuse, { params: CourseParams })
  .delete("/:id", CourseController.delete, { params: CourseParams });

export const courseRoute = new Elysia({ prefix: "/courses" })
  .use(libraryRoute)
  .get("/", CourseController.getAll, { query: CourseListQuery })
  .get("/:id", CourseController.getById, { params: CourseParams })
  .post("/", CourseController.create, { body: CreateCourseBody })
  .patch("/:id", CourseController.update, { params: CourseParams, body: UpdateCourseBody });

export default courseRoute;
