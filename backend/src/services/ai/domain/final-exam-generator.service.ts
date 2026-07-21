import { z } from "zod";
import prisma from "../../../lib/prisma";
import { AiService } from "../core/ai.service";
import { getDefaultModel } from "../core/ai-providers";
import { getLessonPlainContent } from "./lesson-blocks";

const FINAL_EXAM_TITLE = "Course Final Exam";
const MAX_MATERIAL_CHARS = 60_000;
const MAX_CHARS_PER_LESSON = 4_000;

const FinalExamQuestionSchema = z.object({
  questions: z
    .array(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("MULTIPLE_CHOICE"),
          prompt: z.string().min(1),
          options: z.array(z.string()),
          explanations: z.array(z.string()),
          correctAnswer: z.number().int().nonnegative(),
        }),
        z.object({
          type: z.literal("ESSAY"),
          prompt: z.string().min(1),
          requiresImage: z.boolean().optional(),
        })
      ])
    )
    .min(1),
});

type FinalExamJobState = "queued" | "generating" | "failed";

interface FinalExamJob {
  state: FinalExamJobState;
}

interface CourseMaterial {
  courseTitle: string;
  lessons: Array<{
    moduleTitle: string;
    lessonTitle: string;
    content: string;
  }>;
}

interface CourseReadiness {
  eligible: boolean;
  reason?: string;
  completedLessons: number;
  totalLessons: number;
  material?: CourseMaterial;
}

export type FinalExamGenerationState =
  | "blocked"
  | "queued"
  | "generating"
  | "ready";

export interface FinalExamGenerationStatus {
  state: FinalExamGenerationState;
  quizId?: string;
  reason?: string;
  completedLessons: number;
  totalLessons: number;
  canGenerate: boolean;
  retryable?: boolean;
}

type PersistedQuestion = {
  type: "MULTIPLE_CHOICE" | "ESSAY";
  prompt: string;
  options: string[];
  explanations: string[];
  correctAnswer: number | null;
  requiresImage: boolean;
};

/**
 * Generates one reusable course final exam only after the requesting learner has
 * completed every persisted lesson in that course. Jobs are intentionally kept
 * in memory because the existing quiz worker uses the same single-process model.
 */
export class FinalExamGeneratorService {
  private static jobs = new Map<string, FinalExamJob>();

  static async getStatus(
    userId: string,
    courseId: string
  ): Promise<FinalExamGenerationStatus> {
    const readiness = await this.getCourseReadiness(userId, courseId);
    if (!readiness.eligible) {
      return this.statusFromReadiness(readiness, "blocked", false);
    }

    const existingExam = await this.findReadyFinalExam(courseId);
    if (existingExam) {
      return {
        state: "ready",
        quizId: existingExam.id,
        completedLessons: readiness.completedLessons,
        totalLessons: readiness.totalLessons,
        canGenerate: false,
      };
    }

    const job = this.jobs.get(courseId);
    if (job?.state === "queued" || job?.state === "generating") {
      return this.statusFromReadiness(readiness, job.state, false);
    }

    if (job?.state === "failed") {
      return {
        ...this.statusFromReadiness(readiness, "blocked", true),
        reason: "Final exam generation did not finish. Try generating it again.",
        retryable: true,
      };
    }

    // All course work is complete, but the UI has not requested the background
    // generation yet. `queued` lets it show the same generation affordance while
    // `canGenerate` tells it that POST may start the job.
    return {
      ...this.statusFromReadiness(readiness, "queued", true),
      reason: "All lessons are complete. The final exam is ready to generate.",
    };
  }

  static async requestGeneration(
    userId: string,
    courseId: string
  ): Promise<FinalExamGenerationStatus> {
    const currentStatus = await this.getStatus(userId, courseId);
    if (
      (currentStatus.state === "blocked" && !currentStatus.retryable) ||
      currentStatus.state === "ready" ||
      currentStatus.state === "generating"
    ) {
      return currentStatus;
    }

    const existingJob = this.jobs.get(courseId);
    if (existingJob?.state === "queued") {
      return {
        ...currentStatus,
        canGenerate: false,
      };
    }

    this.jobs.set(courseId, { state: "queued" });

    setTimeout(() => {
      void this.generateInBackground(userId, courseId);
    }, 0);

    return {
      ...currentStatus,
      canGenerate: false,
    };
  }

  private static async generateInBackground(userId: string, courseId: string) {
    this.jobs.set(courseId, { state: "generating" });

    try {
      // Re-check immediately before generation so a job cannot produce an exam
      // after the learner's completion state or course structure has changed.
      const readiness = await this.getCourseReadiness(userId, courseId);
      if (!readiness.eligible || !readiness.material) {
        throw new Error(readiness.reason || "The course is not ready for a final exam.");
      }

      await this.createFinalExam(courseId, readiness.material);
      this.jobs.delete(courseId);
    } catch (error) {
      console.error(`Failed to generate final exam for course ${courseId}:`, error);
      this.jobs.set(courseId, { state: "failed" });
    }
  }

  private static async getCourseReadiness(
    userId: string,
    courseId: string
  ): Promise<CourseReadiness> {
    const [course, enrollment] = await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId },
        select: {
          title: true,
          modules: {
            orderBy: { orderIndex: "asc" },
            select: {
              title: true,
              lessons: {
                orderBy: { orderIndex: "asc" },
                select: { id: true, title: true, content: true },
              },
            },
          },
        },
      }),
      prisma.userCourse.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { id: true },
      }),
    ]);

    if (!course) {
      return {
        eligible: false,
        reason: "Course not found.",
        completedLessons: 0,
        totalLessons: 0,
      };
    }

    if (!enrollment) {
      return {
        eligible: false,
        reason: "You must be enrolled in this course before taking its final exam.",
        completedLessons: 0,
        totalLessons: 0,
      };
    }

    const lessons = course.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({
        ...lesson,
        moduleTitle: module.title,
      }))
    );

    if (lessons.length === 0) {
      return {
        eligible: false,
        reason: "This course has no lessons to assess yet.",
        completedLessons: 0,
        totalLessons: 0,
      };
    }

    const lessonIds = lessons.map((lesson) => lesson.id);
    const progress = await prisma.userLessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
        status: "COMPLETED",
      },
      select: { lessonId: true },
    });
    const completedLessonIds = new Set(progress.map((item) => item.lessonId));
    const completedLessons = lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length;

    if (completedLessons !== lessons.length) {
      return {
        eligible: false,
        reason: "Complete every lesson before generating the final exam.",
        completedLessons,
        totalLessons: lessons.length,
      };
    }

    const lessonsMissingContent = lessons.filter((lesson) => !lesson.content?.trim());
    if (lessonsMissingContent.length > 0) {
      return {
        eligible: false,
        reason: "All completed lessons need generated content before the final exam can be created.",
        completedLessons,
        totalLessons: lessons.length,
      };
    }

    return {
      eligible: true,
      completedLessons,
      totalLessons: lessons.length,
      material: {
        courseTitle: course.title,
        lessons: lessons.map((lesson) => ({
          moduleTitle: lesson.moduleTitle,
          lessonTitle: lesson.title,
          content: getLessonPlainContent(lesson.content),
        })),
      },
    };
  }

  private static statusFromReadiness(
    readiness: CourseReadiness,
    state: FinalExamGenerationState,
    canGenerate: boolean
  ): FinalExamGenerationStatus {
    return {
      state,
      reason: readiness.reason,
      completedLessons: readiness.completedLessons,
      totalLessons: readiness.totalLessons,
      canGenerate,
    };
  }

  private static async findReadyFinalExam(courseId: string) {
    return prisma.quiz.findFirst({
      where: {
        courseId,
        type: "FINAL_EXAM",
        questions: { some: {} },
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
  }

  private static async createFinalExam(courseId: string, material: CourseMaterial) {
    const materialForPrompt = this.formatMaterial(material);
    const prompt = `Create a comprehensive final exam for the course "${material.courseTitle}" using only the supplied course material.

Create 10 questions: 8 multiple-choice questions and 2 essay questions. Cover the major modules and lessons rather than concentrating on one topic. For multiple-choice questions, provide 4 plausible options, the zero-based correctAnswer index, and a concise explanation for each option. For essay questions, do not provide a correctAnswer.

COURSE MATERIAL:
${materialForPrompt}`;

    const result = await AiService.structuredObject<z.infer<typeof FinalExamQuestionSchema>>(
      prompt,
      FinalExamQuestionSchema,
      getDefaultModel(),
      "You are an expert assessment designer. Ground every question in the supplied course material and do not introduce facts from outside it."
    );
    const questions = this.normalizeQuestions(result);

    return prisma.$transaction(async (tx) => {
      // Another request may have completed while the model was working. Re-use
      // that exam instead of writing a second FINAL_EXAM for the same course.
      const completedExam = await tx.quiz.findFirst({
        where: {
          courseId,
          type: "FINAL_EXAM",
          questions: { some: {} },
        },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (completedExam) return completedExam.id;

      const emptyExam = await tx.quiz.findFirst({
        where: { courseId, type: "FINAL_EXAM" },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      const quiz =
        emptyExam ??
        (await tx.quiz.create({
          data: {
            courseId,
            title: FINAL_EXAM_TITLE,
            type: "FINAL_EXAM",
            passingScore: 70,
          },
          select: { id: true },
        }));

      for (const question of questions) {
        await tx.question.create({
          data: {
            quizId: quiz.id,
            type: question.type,
            prompt: question.prompt,
            options: question.options,
            explanations: question.explanations,
            correctAnswer: question.correctAnswer,
            requiresImage: question.requiresImage,
          },
        });
      }

      return quiz.id;
    });
  }

  private static formatMaterial(material: CourseMaterial) {
    let remainingChars = MAX_MATERIAL_CHARS;

    return material.lessons
      .map((lesson) => {
        if (remainingChars <= 0) {
          return `## ${lesson.moduleTitle}\n### ${lesson.lessonTitle}\n(Content omitted only because the course is unusually long.)`;
        }

        const content = lesson.content.slice(
          0,
          Math.min(MAX_CHARS_PER_LESSON, remainingChars)
        );
        remainingChars -= content.length;
        return `## ${lesson.moduleTitle}\n### ${lesson.lessonTitle}\n${content}`;
      })
      .join("\n\n");
  }

  private static normalizeQuestions(
    result: z.infer<typeof FinalExamQuestionSchema>
  ): PersistedQuestion[] {
    const questions = result.questions.flatMap((question): PersistedQuestion[] => {
      const prompt = question.prompt.trim();
      if (!prompt) return [];

      if (question.type === "ESSAY") {
        return [
          {
            type: "ESSAY",
            prompt,
            options: [],
            explanations: [],
            correctAnswer: null,
            requiresImage: question.requiresImage ?? false,
          },
        ];
      }

      const options = (question.options ?? []).map((option) => option.trim()).filter(Boolean);
      const correctAnswer = question.correctAnswer;
      if (
        options.length < 2 ||
        correctAnswer === undefined ||
        correctAnswer < 0 ||
        correctAnswer >= options.length
      ) {
        return [];
      }

      return [
        {
          type: "MULTIPLE_CHOICE",
          prompt,
          options,
          explanations: (question.explanations ?? [])
            .map((explanation) => explanation.trim())
            .filter(Boolean),
          correctAnswer,
          requiresImage: false,
        },
      ];
    });

    if (questions.length === 0) {
      throw new Error("The model did not return usable final-exam questions.");
    }

    return questions;
  }
}
