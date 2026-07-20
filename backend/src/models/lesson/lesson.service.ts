import { status } from "elysia";
import prisma from "../../lib/prisma";
import type {
  CreateLessonBody,
  UpdateLessonBody,
  LessonListQuery,
} from "./lesson.schema";

abstract class LessonService {
  static async list(query: LessonListQuery) {
    const { skip = 0, take = 20, moduleId } = query;

    const where: any = {};
    if (moduleId) where.moduleId = moduleId;

    const [data, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        skip,
        take,
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          moduleId: true,
          title: true,
          videoUrl: true,
          orderIndex: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.lesson.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  static async getById(id: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          select: { id: true, title: true, courseId: true },
        },
      },
    });

    if (!lesson) return status(404, { message: "Lesson not found" });
    return lesson;
  }

  static async create(data: CreateLessonBody) {
    if (data.orderIndex === undefined) {
      const lastLesson = await prisma.lesson.findFirst({
        where: { moduleId: data.moduleId },
        orderBy: { orderIndex: "desc" },
      });
      data.orderIndex = lastLesson ? lastLesson.orderIndex + 1 : 0;
    }

    return prisma.lesson.create({ data });
  }

  static async update(id: string, data: UpdateLessonBody) {
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) return status(404, { message: "Lesson not found" });

    return prisma.lesson.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) return status(404, { message: "Lesson not found" });

    await prisma.lesson.delete({ where: { id } });
    return { message: "Lesson deleted successfully" };
  }
}

export default LessonService;
