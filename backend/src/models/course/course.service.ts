import { status } from "elysia";
import prisma from "../../lib/prisma";
import type {
  CreateCourseBody,
  UpdateCourseBody,
  CourseListQuery,
} from "./course.schema";

abstract class CourseService {
  static async listLibrary(userId: string, query: CourseListQuery) {
    const { skip = 0, take = 100, search, category, level } = query;
    const where: any = { isPublic: true };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (category) where.category = category;
    if (level) where.level = level;

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          creator: { select: { fullName: true } },
          modules: { select: { _count: { select: { lessons: true } } } },
          enrollments: { where: { userId }, select: { id: true } },
          _count: { select: { enrollments: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    return {
      data: courses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        color: course.color,
        creator: course.creator.fullName,
        lessons: course.modules.reduce((totalLessons, module) => totalLessons + module._count.lessons, 0),
        learners: course._count.enrollments,
        isMine: course.creatorId === userId,
        isEnrolled: course.enrollments.length > 0,
      })),
      total,
      skip,
      take,
    };
  }

  static async listMine(userId: string) {
    const courses = await prisma.course.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { fullName: true } },
        modules: { select: { _count: { select: { lessons: true } } } },
        _count: { select: { enrollments: true } },
      },
    });

    return {
      data: courses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        color: course.color,
        creator: course.creator.fullName,
        lessons: course.modules.reduce((totalLessons, module) => totalLessons + module._count.lessons, 0),
        learners: course._count.enrollments,
        isMine: true,
        isPublic: course.isPublic,
      })),
    };
  }

  static async share(userId: string, courseId: string) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, creatorId: userId },
      select: { id: true },
    });
    if (!course) return null;

    return prisma.course.update({
      where: { id: courseId },
      data: { isPublic: true },
      select: { id: true, title: true, isPublic: true },
    });
  }

  static async reuse(userId: string, courseId: string) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, isPublic: true },
      select: { id: true },
    });
    if (!course) return null;

    const existingEnrollment = await prisma.userCourse.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    });

    if (existingEnrollment) {
      return { enrollmentId: existingEnrollment.id, alreadyEnrolled: true };
    }

    const enrollment = await prisma.userCourse.create({
      data: { userId, courseId },
      select: { id: true },
    });
    return { enrollmentId: enrollment.id, alreadyEnrolled: false };
  }

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
                content: true,
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
    return {
      ...course,
      modules: course.modules.map((module) => ({
        ...module,
        lessons: module.lessons.map(({ content, ...lesson }) => ({
          ...lesson,
          isGenerated: Boolean(content?.trim()),
        })),
      })),
    };
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
