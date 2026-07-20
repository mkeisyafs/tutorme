import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

// Basic auth middleware that parses the JWT and provides a 'user' object if valid.
// It does NOT throw an error if missing, allowing optional auth.
export const authMiddleware = new Elysia({ name: "auth-middleware" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super_secret_fallback_key",
    })
  )
  .derive(async ({ jwt, headers }) => {
    const authorization = headers.authorization;
    
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return { user: null };
    }

    const token = authorization.split(" ")[1];
    const userPayload = await jwt.verify(token);
    
    if (!userPayload) {
      return { user: null }; 
    }

    return {
      user: userPayload as { sub: string; email: string },
    };
  });

// Strict auth middleware that enforces the user must be logged in.
// Chain this before any protected routes: `.use(requireAuth)`
export const requireAuth = new Elysia({ name: "require-auth" })
  .use(authMiddleware)
  .onBeforeHandle(({ user, error }) => {
    if (!user) {
      return error(401, { message: "Unauthorized: Invalid or missing token" });
    }
  });
