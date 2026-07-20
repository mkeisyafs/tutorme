import { status } from "elysia";
import prisma from "../../lib/prisma";
import type {
  CreateQuestionBody,
  UpdateQuestionBody,
  QuestionListQuery,
} from "./question.schema";

abstract class QuestionService {
  static async list(query: QuestionListQuery) {
    const { skip = 0, take = 20, quizId, type } = query;

    const where: any = {};
    if (quizId) where.quizId = quizId;
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "asc" },
      }),
      prisma.question.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  static async getById(id: string) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        quiz: {
          select: { id: true, title: true, courseId: true },
        },
      },
    });

    if (!question) return status(404, { message: "Question not found" });
    return question;
  }

  static async create(data: CreateQuestionBody) {
    return prisma.question.create({ data: data as any });
  }

  static async update(id: string, data: UpdateQuestionBody) {
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) return status(404, { message: "Question not found" });

    return prisma.question.update({
      where: { id },
      data: data as any,
    });
  }

  static async delete(id: string) {
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) return status(404, { message: "Question not found" });

    await prisma.question.delete({ where: { id } });
    return { message: "Question deleted successfully" };
  }
}

export default QuestionService;
