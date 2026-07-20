import { status } from "elysia";
import prisma from "../../lib/prisma";
import type {
  CreateQuizBody,
  UpdateQuizBody,
  QuizListQuery,
} from "./quiz.schema";

abstract class QuizService {
  static async list(query: QuizListQuery) {
    const { skip = 0, take = 20, courseId, type } = query;

    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { questions: true, submissions: true } },
        },
      }),
      prisma.quiz.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  static async getById(id: string) {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { createdAt: "asc" },
        },
        course: {
          select: { id: true, title: true },
        },
        _count: { select: { submissions: true } },
      },
    });

    if (!quiz) return status(404, { message: "Quiz not found" });
    return quiz;
  }

  static async create(data: CreateQuizBody) {
    return prisma.quiz.create({
      data: data as any,
      include: {
        _count: { select: { questions: true } },
      },
    });
  }

  static async update(id: string, data: UpdateQuizBody) {
    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) return status(404, { message: "Quiz not found" });

    return prisma.quiz.update({
      where: { id },
      data: data as any,
      include: {
        _count: { select: { questions: true } },
      },
    });
  }

  static async delete(id: string) {
    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) return status(404, { message: "Quiz not found" });

    await prisma.quiz.delete({ where: { id } });
    return { message: "Quiz deleted successfully" };
  }
}

export default QuizService;
