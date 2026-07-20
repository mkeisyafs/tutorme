import { status } from "elysia";
import prisma from "../../lib/prisma";
import type { CreateUserBody, UpdateUserBody, UserListQuery } from "./user.schema";

abstract class UserService {
  static async list(query: UserListQuery) {
    const { skip = 0, take = 20, search } = query;

    const where = search
      ? {
          OR: [
            { fullName: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : undefined;

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          streakCount: true,
          notificationsEnabled: true,
          pomodoroEnabled: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  static async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        streakCount: true,
        notificationsEnabled: true,
        pomodoroEnabled: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            createdCourses: true,
            enrollments: true,
          },
        },
      },
    });

    if (!user) return status(404, { message: "User not found" });
    return user;
  }

  static async create(data: CreateUserBody) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) return status(409, { message: "Email already exists" });

    return prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        streakCount: true,
        notificationsEnabled: true,
        pomodoroEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async update(id: string, data: UpdateUserBody) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return status(404, { message: "User not found" });

    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing) return status(409, { message: "Email already exists" });
    }

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        streakCount: true,
        notificationsEnabled: true,
        pomodoroEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async delete(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return status(404, { message: "User not found" });

    await prisma.user.delete({ where: { id } });
    return { message: "User deleted successfully" };
  }
}

export default UserService;
