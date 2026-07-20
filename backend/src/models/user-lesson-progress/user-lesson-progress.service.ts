import { status } from "elysia";
import prisma from "../../lib/prisma";
import type {
  CreateUserLessonProgressBody,
  UpdateUserLessonProgressBody,
  UserLessonProgressListQuery,
} from "./user-lesson-progress.schema";

abstract class UserLessonProgressService {
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
      return prisma.userLessonProgress.update({
        where: { id: existing.id },
        data: {
          status: data.status || existing.status,
          completedAt: data.status === "COMPLETED" ? new Date() : existing.completedAt,
        },
      });
    }

    return prisma.userLessonProgress.create({
      data: {
        userId: data.userId,
        lessonId: data.lessonId,
        status: data.status || "LOCKED",
      },
    });
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

    return prisma.userLessonProgress.update({
      where: { id },
      data: updateData,
    });
  }

  static async delete(id: string) {
    const progress = await prisma.userLessonProgress.findUnique({ where: { id } });
    if (!progress) return status(404, { message: "Progress record not found" });

    await prisma.userLessonProgress.delete({ where: { id } });
    return { message: "Progress record deleted successfully" };
  }
}

export default UserLessonProgressService;
