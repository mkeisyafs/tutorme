import { Elysia } from "elysia";
import { UserCourseController } from "./user-course.controller";
import {
  CreateUserCourseBody,
  UpdateUserCourseBody,
  UserCourseParams,
  UserCourseListQuery,
} from "./user-course.schema";

export const userCourseRoute = new Elysia({ prefix: "/enrollments" })
  .get("/", UserCourseController.getAll, { query: UserCourseListQuery })
  .get("/:id", UserCourseController.getById, { params: UserCourseParams })
  .post("/", UserCourseController.create, { body: CreateUserCourseBody })
  .patch("/:id", UserCourseController.update, { params: UserCourseParams, body: UpdateUserCourseBody })
  .delete("/:id", UserCourseController.delete, { params: UserCourseParams });

export default userCourseRoute;
