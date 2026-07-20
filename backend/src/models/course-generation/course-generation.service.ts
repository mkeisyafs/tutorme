import { status } from "elysia";
import prisma from "../../lib/prisma";
import type {
  CreateCourseGenerationBody,
  UpdateCourseGenerationBody,
  CourseGenerationListQuery,
} from "./course-generation.schema";

abstract class CourseGenerationService {
  static async list(query: CourseGenerationListQuery) {
    const { skip = 0, take = 20, userId, status: genStatus } = query;

    const where: any = {};
    if (userId) where.userId = userId;
    if (genStatus) where.status = genStatus;

    const [data, total] = await Promise.all([
      prisma.courseGeneration.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          resultCourse: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.courseGeneration.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  static async getById(id: string) {
    const generation = await prisma.courseGeneration.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
        resultCourse: {
          select: { id: true, title: true },
        },
      },
    });

    if (!generation) return status(404, { message: "Course generation not found" });
    return generation;
  }

  static async create(data: CreateCourseGenerationBody) {
    return prisma.courseGeneration.create({
      data,
    });
  }

  static async update(id: string, data: UpdateCourseGenerationBody) {
    const generation = await prisma.courseGeneration.findUnique({ where: { id } });
    if (!generation) return status(404, { message: "Course generation not found" });

    return prisma.courseGeneration.update({
      where: { id },
      data: data as any,
    });
  }

  static async delete(id: string) {
    const generation = await prisma.courseGeneration.findUnique({ where: { id } });
    if (!generation) return status(404, { message: "Course generation not found" });

    await prisma.courseGeneration.delete({ where: { id } });
    return { message: "Course generation deleted successfully" };
  }
}

export default CourseGenerationService;
