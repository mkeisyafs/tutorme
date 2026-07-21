import { status } from "elysia";
import prisma from "../../lib/prisma";
import UserService from "../user/user.service";
import type {
  CreateExamSubmissionBody,
  UpdateExamSubmissionBody,
  ExamSubmissionListQuery,
} from "./exam-submission.schema";

abstract class ExamSubmissionService {
  static async list(query: ExamSubmissionListQuery) {
    const { skip = 0, take = 20, userId, quizId } = query;

    const where: any = {};
    if (userId) where.userId = userId;
    if (quizId) where.quizId = quizId;

    const [data, total] = await Promise.all([
      prisma.examSubmission.findMany({
        where,
        skip,
        take,
        orderBy: { submittedAt: "desc" },
        include: {
          quiz: {
            select: { id: true, title: true, type: true, courseId: true },
          },
          user: {
            select: { id: true, fullName: true },
          },
        },
      }),
      prisma.examSubmission.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  static async getById(id: string) {
    const submission = await prisma.examSubmission.findUnique({
      where: { id },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            type: true,
            courseId: true,
            passingScore: true,
          },
        },
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!submission) return status(404, { message: "Exam submission not found" });
    return submission;
  }

  static async create(data: CreateExamSubmissionBody) {
    const submission = await prisma.examSubmission.create({
      data: data as any,
      include: {
        quiz: {
          select: { id: true, title: true, type: true },
        },
      },
    });
    if (data.userId) {
      await UserService.updateStreakOnActivity(data.userId);
    }
    return submission;
  }

  static async update(id: string, data: UpdateExamSubmissionBody) {
    const submission = await prisma.examSubmission.findUnique({ where: { id } });
    if (!submission) return status(404, { message: "Exam submission not found" });

    return prisma.examSubmission.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    const submission = await prisma.examSubmission.findUnique({ where: { id } });
    if (!submission) return status(404, { message: "Exam submission not found" });

    await prisma.examSubmission.delete({ where: { id } });
    return { message: "Exam submission deleted successfully" };
  }
}

export default ExamSubmissionService;
