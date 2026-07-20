import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { AuthController } from "./auth.controller";

export const authRoute = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super_secret_fallback_key",
    })
  )
  .post("/register", AuthController.register, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String(),
      fullName: t.String(),
    }),
  })
  .post("/login", AuthController.login, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String(),
    }),
  });

export default authRoute;
