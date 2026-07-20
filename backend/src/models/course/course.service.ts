import { status } from "elysia";
import prisma from "../../lib/prisma";
import type {
  CreateCourseBody,
  UpdateCourseBody,
  CourseListQuery,
} from "./course.schema";

abstract class CourseService {
  static async list(query: CourseListQuery) {
    const { skip = 0, take = 20, search, category, level, creatorId, isPublic } = query;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (category) where.category = category;
    if (level) where.level = level;
    if (creatorId) where.creatorId = creatorId;
    if (isPublic !== undefined) where.isPublic = isPublic;

    const [data, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
            select: { id: true, fullName: true, email: true },
          },
          _count: {
            select: { modules: true, quizzes: true, enrollments: true },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  static async getById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, fullName: true, email: true },
        },
        modules: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: {
              orderBy: { orderIndex: "asc" },
              select: {
                id: true,
                title: true,
                videoUrl: true,
                orderIndex: true,
              },
            },
          },
        },
        quizzes: {
          select: {
            id: true,
            title: true,
            type: true,
            passingScore: true,
            _count: { select: { questions: true } },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!course) return status(404, { message: "Course not found" });
    return course;
  }

  static async create(data: CreateCourseBody) {
    return prisma.course.create({
      data: data as any,
      include: {
        creator: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  static async update(id: string, data: UpdateCourseBody) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return status(404, { message: "Course not found" });

    return prisma.course.update({
      where: { id },
      data: data as any,
      include: {
        creator: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  static async delete(id: string) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return status(404, { message: "Course not found" });

    await prisma.course.delete({ where: { id } });
    return { message: "Course deleted successfully" };
  }
}

export default CourseService;
