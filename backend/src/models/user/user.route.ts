import { Elysia } from "elysia";
import { UserController } from "./user.controller";
import {
  CreateUserBody,
  UpdateAccountSecurityBody,
  UpdateProfileBody,
  UpdateUserBody,
  UserParams,
  UserListQuery,
} from "./user.schema";
import { requireAuth } from "../../middleware/auth";

const profileRoute = new Elysia()
  .use(requireAuth)
  .get("/me", UserController.getProfile)
  .patch("/me", UserController.updateProfile, { body: UpdateProfileBody })
  .patch("/me/security", UserController.updateAccountSecurity, { body: UpdateAccountSecurityBody });

export const userRoute = new Elysia({ prefix: "/users" })
  .use(profileRoute)
  .get("/", UserController.getAll, { query: UserListQuery })
  .get("/:id", UserController.getById, { params: UserParams })
  .post("/", UserController.create, { body: CreateUserBody })
  .patch("/:id", UserController.update, { params: UserParams, body: UpdateUserBody })
  .delete("/:id", UserController.delete, { params: UserParams });

export default userRoute;
