import { status } from "elysia";
import prisma from "../../lib/prisma";
import type { CreateUserBody, SoftDeleteUserBody, UpdateAccountSecurityBody, UpdateProfileBody, UpdateUserBody, UserListQuery } from "./user.schema";

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
        streakLastActive: true,
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

    let currentStreak = user.streakCount;
    if (user.streakCount > 0 && user.streakLastActive) {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const lastActiveStr = user.streakLastActive.toISOString().slice(0, 10);
      const diffTime = new Date(todayStr).getTime() - new Date(lastActiveStr).getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        currentStreak = 0;
        await prisma.user.update({
          where: { id },
          data: { streakCount: 0 }
        });
      }
    }

    const { _count, streakLastActive, ...profile } = user;
    return {
      ...profile,
      streakCount: currentStreak,
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
        streakLastActive: true,
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

    let currentStreak = user.streakCount;
    if (user.streakCount > 0 && user.streakLastActive) {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const lastActiveStr = user.streakLastActive.toISOString().slice(0, 10);
      const diffTime = new Date(todayStr).getTime() - new Date(lastActiveStr).getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        currentStreak = 0;
        await prisma.user.update({
          where: { id },
          data: { streakCount: 0 }
        });
      }
    }

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
      streakCount: currentStreak,
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

  static async updateStreakOnActivity(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streakCount: true, streakLastActive: true }
    });

    if (!user) return;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (!user.streakLastActive) {
      // First activity
      await prisma.user.update({
        where: { id: userId },
        data: { streakCount: 1, streakLastActive: now }
      });
      return;
    }

    const lastActiveStr = user.streakLastActive.toISOString().slice(0, 10);
    const diffTime = new Date(todayStr).getTime() - new Date(lastActiveStr).getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already studied today
      return;
    } else if (diffDays === 1) {
      // Studied yesterday, increment streak
      await prisma.user.update({
        where: { id: userId },
        data: { streakCount: user.streakCount + 1, streakLastActive: now }
      });
    } else {
      // Missed a day or more, start new streak from 1
      await prisma.user.update({
        where: { id: userId },
        data: { streakCount: 1, streakLastActive: now }
      });
    }
  }

  static async softDelete(userId: string, data: SoftDeleteUserBody) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return status(404, { message: "User not found" });

    const isPasswordValid = await Bun.password.verify(data.password, user.passwordHash);
    if (!isPasswordValid) {
      return status(400, { message: "Incorrect password" });
    }

    const scheduledDeletionAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: { scheduledDeletionAt },
    });

    return {
      message: "Account scheduled for deletion in 30 days",
      scheduledDeletionAt,
    };
  }

  static async delete(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return status(404, { message: "User not found" });

    await prisma.user.delete({ where: { id } });
    return { message: "User deleted successfully" };
  }
}

export default UserService;
