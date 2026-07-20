import { Elysia } from "elysia";
import { UserController } from "./user.controller";
import {
  CreateUserBody,
  UpdateUserBody,
  UserParams,
  UserListQuery,
} from "./user.schema";

export const userRoute = new Elysia({ prefix: "/users" })
  .get("/", UserController.getAll, { query: UserListQuery })
  .get("/:id", UserController.getById, { params: UserParams })
  .post("/", UserController.create, { body: CreateUserBody })
  .patch("/:id", UserController.update, { params: UserParams, body: UpdateUserBody })
  .delete("/:id", UserController.delete, { params: UserParams });

export default userRoute;
