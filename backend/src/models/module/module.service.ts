import { status } from "elysia";
import prisma from "../../lib/prisma";
import type {
  CreateModuleBody,
  UpdateModuleBody,
  ModuleListQuery,
} from "./module.schema";

abstract class ModuleService {
  static async list(query: ModuleListQuery) {
    const { skip = 0, take = 20, courseId } = query;

    const where: any = {};
    if (courseId) where.courseId = courseId;

    const [data, total] = await Promise.all([
      prisma.module.findMany({
        where,
        skip,
        take,
        orderBy: { orderIndex: "asc" },
        include: {
          _count: { select: { lessons: true } },
        },
      }),
      prisma.module.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  static async getById(id: string) {
    const mod = await prisma.module.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { orderIndex: "asc" },
        },
        course: {
          select: { id: true, title: true },
        },
      },
    });

    if (!mod) return status(404, { message: "Module not found" });
    return mod;
  }

  static async create(data: CreateModuleBody) {
    // Auto-set orderIndex if not provided
    if (data.orderIndex === undefined) {
      const lastModule = await prisma.module.findFirst({
        where: { courseId: data.courseId },
        orderBy: { orderIndex: "desc" },
      });
      data.orderIndex = lastModule ? lastModule.orderIndex + 1 : 0;
    }

    return prisma.module.create({
      data,
      include: {
        _count: { select: { lessons: true } },
      },
    });
  }

  static async update(id: string, data: UpdateModuleBody) {
    const mod = await prisma.module.findUnique({ where: { id } });
    if (!mod) return status(404, { message: "Module not found" });

    return prisma.module.update({
      where: { id },
      data,
      include: {
        _count: { select: { lessons: true } },
      },
    });
  }

  static async delete(id: string) {
    const mod = await prisma.module.findUnique({ where: { id } });
    if (!mod) return status(404, { message: "Module not found" });

    await prisma.module.delete({ where: { id } });
    return { message: "Module deleted successfully" };
  }
}

export default ModuleService;
