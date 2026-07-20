import { status } from "elysia";
import prisma from "../../lib/prisma";
import type {
  CreateUserCourseBody,
  UpdateUserCourseBody,
  UserCourseListQuery,
} from "./user-course.schema";

abstract class UserCourseService {
  static async list(query: UserCourseListQuery) {
    const { skip = 0, take = 20, userId, courseId } = query;

    const where: any = {};
    if (userId) where.userId = userId;
    if (courseId) where.courseId = courseId;

    const [data, total] = await Promise.all([
      prisma.userCourse.findMany({
        where,
        skip,
        take,
        orderBy: { lastAccessedAt: "desc" },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              category: true,
              color: true,
              level: true,
            },
          },
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      prisma.userCourse.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  static async getById(id: string) {
    const enrollment = await prisma.userCourse.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            category: true,
            color: true,
            level: true,
          },
        },
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!enrollment) return status(404, { message: "Enrollment not found" });
    return enrollment;
  }

  static async create(data: CreateUserCourseBody) {
    // Check for duplicate enrollment
    const existing = await prisma.userCourse.findUnique({
      where: {
        userId_courseId: {
          userId: data.userId,
          courseId: data.courseId,
        },
      },
    });

    if (existing) return status(409, { message: "Already enrolled in this course" });

    return prisma.userCourse.create({
      data,
      include: {
        course: {
          select: { id: true, title: true, category: true },
        },
      },
    });
  }

  static async update(id: string, data: UpdateUserCourseBody) {
    const enrollment = await prisma.userCourse.findUnique({ where: { id } });
    if (!enrollment) return status(404, { message: "Enrollment not found" });

    return prisma.userCourse.update({
      where: { id },
      data: {
        ...data,
        lastAccessedAt: new Date(),
      },
    });
  }

  static async delete(id: string) {
    const enrollment = await prisma.userCourse.findUnique({ where: { id } });
    if (!enrollment) return status(404, { message: "Enrollment not found" });

    await prisma.userCourse.delete({ where: { id } });
    return { message: "Unenrolled successfully" };
  }
}

export default UserCourseService;
