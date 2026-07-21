import { status } from "elysia";
import prisma from "../../lib/prisma";
import UserService from "../user/user.service";
import type {
  CreateUserLessonProgressBody,
  UpdateUserLessonProgressBody,
  UserLessonProgressListQuery,
} from "./user-lesson-progress.schema";

abstract class UserLessonProgressService {
  private static async refreshEnrollmentProgress(userId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        module: {
          select: { courseId: true },
        },
      },
    });

    if (!lesson) return;

    const courseId = lesson.module.courseId;
    const [totalLessons, completedLessons] = await Promise.all([
      prisma.lesson.count({
        where: { module: { courseId } },
      }),
      prisma.userLessonProgress.count({
        where: {
          userId,
          status: "COMPLETED",
          lesson: { module: { courseId } },
        },
      }),
    ]);

    const progressPercentage = totalLessons === 0
      ? 0
      : Math.round((completedLessons / totalLessons) * 100);

    await prisma.userCourse.updateMany({
      where: { userId, courseId },
      data: {
        progressPercentage,
        isCompleted: totalLessons > 0 && completedLessons === totalLessons,
        lastAccessedAt: new Date(),
      },
    });
  }

  static async list(query: UserLessonProgressListQuery) {
    const { skip = 0, take = 20, userId, lessonId, status: progressStatus } = query;

    const where: any = {};
    if (userId) where.userId = userId;
    if (lessonId) where.lessonId = lessonId;
    if (progressStatus) where.status = progressStatus;

    const [data, total] = await Promise.all([
      prisma.userLessonProgress.findMany({
        where,
        skip,
        take,
        include: {
          lesson: {
            select: { id: true, title: true, moduleId: true },
          },
        },
      }),
      prisma.userLessonProgress.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  static async getById(id: string) {
    const progress = await prisma.userLessonProgress.findUnique({
      where: { id },
      include: {
        lesson: {
          select: { id: true, title: true, moduleId: true },
        },
        user: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!progress) return status(404, { message: "Progress record not found" });
    return progress;
  }

  static async create(data: CreateUserLessonProgressBody) {
    // Upsert: if exists, update; otherwise create
    const existing = await prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: data.userId,
          lessonId: data.lessonId,
        },
      },
    });

    if (existing) {
      const progress = await prisma.userLessonProgress.update({
        where: { id: existing.id },
        data: {
          status: data.status || existing.status,
          completedAt: data.status === "COMPLETED" ? new Date() : existing.completedAt,
        },
      });
      await this.refreshEnrollmentProgress(data.userId, data.lessonId);
      if (data.status === "COMPLETED") {
        await UserService.updateStreakOnActivity(data.userId);
      }
      return progress;
    }

    const progress = await prisma.userLessonProgress.create({
      data: {
        userId: data.userId,
        lessonId: data.lessonId,
        status: data.status || "LOCKED",
        completedAt: data.status === "COMPLETED" ? new Date() : null,
      },
    });
    await this.refreshEnrollmentProgress(data.userId, data.lessonId);
    if (data.status === "COMPLETED") {
      await UserService.updateStreakOnActivity(data.userId);
    }
    return progress;
  }

  static async update(id: string, data: UpdateUserLessonProgressBody) {
    const progress = await prisma.userLessonProgress.findUnique({ where: { id } });
    if (!progress) return status(404, { message: "Progress record not found" });

    // Auto-set completedAt when marking as COMPLETED
    const updateData: any = { ...data };
    if (data.status === "COMPLETED" && !data.completedAt) {
      updateData.completedAt = new Date();
    }
    if (data.completedAt) {
      updateData.completedAt = new Date(data.completedAt);
    }

    const updatedProgress = await prisma.userLessonProgress.update({
      where: { id },
      data: updateData,
    });
    await this.refreshEnrollmentProgress(progress.userId, progress.lessonId);
    if (updateData.status === "COMPLETED") {
      await UserService.updateStreakOnActivity(progress.userId);
    }
    return updatedProgress;
  }

  static async delete(id: string) {
    const progress = await prisma.userLessonProgress.findUnique({ where: { id } });
    if (!progress) return status(404, { message: "Progress record not found" });

    await prisma.userLessonProgress.delete({ where: { id } });
    await this.refreshEnrollmentProgress(progress.userId, progress.lessonId);
    return { message: "Progress record deleted successfully" };
  }
}

export default UserLessonProgressService;
