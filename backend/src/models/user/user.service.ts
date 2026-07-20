import { status } from "elysia";
import prisma from "../../lib/prisma";
import type { CreateUserBody, UpdateAccountSecurityBody, UpdateProfileBody, UpdateUserBody, UserListQuery } from "./user.schema";

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

  static async getProfile(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        streakCount: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            lessonProgress: { where: { status: "COMPLETED" } },
          },
        },
      },
    });

    if (!user) return null;

    const { _count, ...profile } = user;
    return {
      ...profile,
      coursesJoined: _count.enrollments,
      lessonsCompleted: _count.lessonProgress,
    };
  }

  static async getDashboard(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        fullName: true,
        streakCount: true,
        enrollments: {
          take: 5,
          orderBy: { lastAccessedAt: "desc" },
          select: {
            courseId: true,
            progressPercentage: true,
            isCompleted: true,
            lastAccessedAt: true,
            course: {
              select: {
                title: true,
                description: true,
                category: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    const courses = user.enrollments.map((enrollment) => ({
      id: enrollment.courseId,
      title: enrollment.course.title,
      description: enrollment.course.description,
      category: enrollment.course.category,
      color: enrollment.course.color,
      progressPercentage: enrollment.progressPercentage,
      isCompleted: enrollment.isCompleted,
      lastAccessedAt: enrollment.lastAccessedAt,
    }));

    return {
      fullName: user.fullName,
      streakCount: user.streakCount,
      continueCourse: courses.find((course) => !course.isCompleted) ?? courses[0] ?? null,
      recentCourses: courses.slice(0, 2),
    };
  }

  static async updateProfile(id: string, data: UpdateProfileBody) {
    const existingUser = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existingUser) return null;

    await prisma.user.update({
      where: { id },
      data: { fullName: data.fullName },
    });

    return this.getProfile(id);
  }

  static async updateAccountSecurity(id: string, data: UpdateAccountSecurityBody) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return status(404, { message: "User not found" });

    if (data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) return status(409, { message: "Email already exists" });
    }

    const passwordHash = data.password ? await Bun.password.hash(data.password) : undefined;

    return prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });
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
