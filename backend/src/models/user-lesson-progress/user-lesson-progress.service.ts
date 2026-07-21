import { Prisma } from "@prisma/client";
import { status } from "elysia";
import prisma from "../../lib/prisma";
import UserService from "../user/user.service";
import type {
  CreateUserLessonProgressBody,
  UpdateUserLessonProgressBody,
  UserLessonProgressListQuery,
} from "./user-lesson-progress.schema";

type EnrollmentProgressSnapshot = {
  readonly courseId: string;
  readonly progressPercentage: number;
  readonly courseCompleted: boolean;
};

type CompletedLessonProgress = EnrollmentProgressSnapshot & {
  readonly progressId: string;
  readonly lessonId: string;
  readonly status: "COMPLETED";
  readonly completedAt: Date;
};

type ExistingLessonProgress = {
  readonly id: string;
  readonly status: "LOCKED" | "IN_PROGRESS" | "COMPLETED";
  readonly completedAt: Date | null;
};

type CompletedProgressRow = {
  readonly id: string;
  readonly lessonId: string;
  readonly completedAt: Date;
};

abstract class UserLessonProgressService {
  private static async refreshEnrollmentProgress(
    userId: string,
    lessonId: string
  ): Promise<EnrollmentProgressSnapshot | null> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        module: {
          select: { courseId: true },
        },
      },
    });

    if (!lesson) return null;

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

    return {
      courseId,
      progressPercentage,
      courseCompleted: totalLessons > 0 && completedLessons === totalLessons,
    };
  }

  static async completeLesson(userId: string, lessonId: string): Promise<CompletedLessonProgress | null> {
    const progress = await this.persistCompletedProgress(userId, lessonId);
    if (!progress) return null;
    const enrollment = await this.refreshEnrollmentProgress(userId, lessonId);
    if (!enrollment) return null;

    return {
      progressId: progress.id,
      lessonId: progress.lessonId,
      status: "COMPLETED",
      completedAt: progress.completedAt,
      courseId: enrollment.courseId,
      progressPercentage: enrollment.progressPercentage,
      courseCompleted: enrollment.courseCompleted,
    };
  }

  private static async persistCompletedProgress(
    userId: string,
    lessonId: string
  ): Promise<CompletedProgressRow | null> {
    const existing = await this.findProgress(userId, lessonId);
    if (existing) return this.updateCompletedProgress(existing);

    try {
      const created = await prisma.userLessonProgress.create({
        data: { userId, lessonId, status: "COMPLETED", completedAt: new Date() },
        select: { id: true, lessonId: true, completedAt: true },
      });
      if (!created.completedAt) return null;
      return {
        id: created.id,
        lessonId: created.lessonId,
        completedAt: created.completedAt,
      };
    } catch (createError) {
      if (createError instanceof Prisma.PrismaClientKnownRequestError && createError.code === "P2002") {
        const winner = await this.findProgress(userId, lessonId);
        return winner ? this.updateCompletedProgress(winner) : null;
      }
      throw createError;
    }
  }

  private static async findProgress(
    userId: string,
    lessonId: string
  ): Promise<ExistingLessonProgress | null> {
    return prisma.userLessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: { id: true, status: true, completedAt: true },
    });
  }

  private static async updateCompletedProgress(
    progress: ExistingLessonProgress
  ): Promise<CompletedProgressRow | null> {
    const completedAt = progress.status === "COMPLETED"
      ? progress.completedAt ?? new Date()
      : new Date();
    const updated = await prisma.userLessonProgress.update({
      where: { id: progress.id },
      data: { status: "COMPLETED", completedAt },
      select: { id: true, lessonId: true, completedAt: true },
    });
    if (!updated.completedAt) return null;
    return {
      id: updated.id,
      lessonId: updated.lessonId,
      completedAt: updated.completedAt,
    };
  }

  static async list(query: UserLessonProgressListQuery) {
    const { skip = 0, take = 20, userId, lessonId, status: progressStatus } = query;

    const where: Prisma.UserLessonProgressWhereInput = {};
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
      const nextStatus = data.status ?? existing.status;
      const progress = await prisma.userLessonProgress.update({
        where: { id: existing.id },
        data: {
          status: nextStatus,
          completedAt: nextStatus === "COMPLETED"
            ? existing.status === "COMPLETED"
              ? existing.completedAt ?? new Date()
              : new Date()
            : null,
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

    // Keep completion timestamps in sync with the status so a user can undo completion.
    const updateData: Prisma.UserLessonProgressUpdateInput = { ...data };
    if (data.status === "COMPLETED") {
      updateData.completedAt = data.completedAt ? new Date(data.completedAt) : new Date();
    } else if (data.status) {
      updateData.completedAt = null;
    } else if (data.completedAt !== undefined) {
      updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
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
