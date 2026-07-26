import prisma from "../../lib/prisma";

export class AuthController {
  static async register({ body, jwt, error }: any) {
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return error(400, { message: "Email already in use" });
    }

    // Bun natively supports bcrypt/argon2 via Bun.password
    const passwordHash = await Bun.password.hash(body.password);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        fullName: body.fullName,
      },
    });

    const token = await jwt.sign({ sub: user.id, email: user.email });

    return {
      message: "Registered successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }

  static async login({ body, jwt, error }: any) {
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return error(401, { message: "Invalid email or password" });
    }

    // Verify password against stored hash
    const isMatch = await Bun.password.verify(body.password, user.passwordHash);

    if (!isMatch) {
      return error(401, { message: "Invalid email or password" });
    }

    let deletionCanceled = false;
    if (user.scheduledDeletionAt) {
      const now = new Date();
      if (now >= new Date(user.scheduledDeletionAt)) {
        return error(401, { message: "Account has been deleted" });
      } else {
        // User logged back in within the 30-day grace period: cancel deletion request
        await prisma.user.update({
          where: { id: user.id },
          data: { scheduledDeletionAt: null },
        });
        deletionCanceled = true;
      }
    }

    const token = await jwt.sign({ sub: user.id, email: user.email });

    return {
      message: deletionCanceled ? "Account deletion request canceled. Welcome back!" : "Logged in successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      deletionCanceled,
    };
  }
}
