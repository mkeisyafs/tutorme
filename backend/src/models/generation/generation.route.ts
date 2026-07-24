import { Elysia, t } from "elysia";
import { CourseGeneratorService } from "../../services/ai/domain/course-generator.service";
import { CoursePersistenceService } from "../../services/ai/domain/course-persistence.service";
import { LessonGeneratorService } from "../../services/ai/domain/lesson-generator.service";
import { EditorAssistantService } from "../../services/ai/assistants/editor-assistant.service";
import { LearningAssistantService } from "../../services/ai/assistants/learning-assistant.service";
import { FinalExamGeneratorService } from "../../services/ai/domain/final-exam-generator.service";
import { LearnerAssessmentService } from "../../services/ai/domain/learner-assessment.service";
import { outlineCache } from "../../services/ai/domain/outline-cache.service";
import { QuizWorkerService } from "../../services/ai/workers/quiz-worker.service";
import prisma from "../../lib/prisma";
import { authMiddleware } from "../../middleware/auth";

import { protectedAssessmentRoute } from "./generation-assessment.route";

// The existing outline and lesson routes intentionally remain compatible with
// their current client-supplied user IDs. Final-exam eligibility is different:
// it is tied to a learner's persisted progress, so this nested route derives
// that learner from the verified JWT rather than accepting a spoofable userId.

export const generationController = new Elysia({ prefix: "/generation" })

  // 1. Generate Course Outline (Temporary)
  .post(
    "/outline",
    async ({ body, set }) => {
      try {
        const draftId = await CourseGeneratorService.generateOutline(
          body.userId,
          body.topic,
          body.familiarity,
          body.language,
          {
            enableEssayQuestions: body.enableEssayQuestions ?? true,
            requireImageSubmission: body.requireImageSubmission ?? false,
            quizLength: body.quizLength ?? "Random",
          }
        );
        return { draftId };
      } catch (generationError) {
        console.error(
          "[generation:outline] Failed to generate course outline:",
          generationError instanceof Error ? generationError.message : generationError
        );
        set.status = 502;
        return {
          message:
            "Course outline generation is temporarily unavailable. Check the AI provider configuration and try again.",
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        topic: t.String(),
        familiarity: t.String(),
        language: t.String(),
        enableEssayQuestions: t.Optional(t.Boolean()),
        requireImageSubmission: t.Optional(t.Boolean()),
        quizLength: t.Optional(t.String()),
      }),
    }
  )

  // 2. Get Cached Outline
  .get(
    "/outline/:draftId",
    async ({ params, set }) => {
      const draft = outlineCache.get(params.draftId);
      if (!draft) {
        set.status = 404;
        return { message: "Draft not found" };
      }
      return draft;
    }
  )

  // 3. Manual Update Cached Outline
  .patch(
    "/outline/:draftId",
    async ({ params, body, set }) => {
      const draft = outlineCache.update(params.draftId, body as any);
      if (!draft) {
        set.status = 404;
        return { message: "Draft not found" };
      }
      return draft;
    }
  )

  // 4. Start Learning (Persist to DB)
  .post(
    "/outline/:draftId/publish",
    async ({ params, set }) => {
      try {
        const result = await CoursePersistenceService.publishDraft(params.draftId);
        return result;
      } catch (e: any) {
        set.status = 400;
        return { message: e.message };
      }
    }
  )

  // 5. Chat with Editor Assistant (Assistant 1)
  .post(
    "/outline/:draftId/chat",
    async ({ params, body, set }) => {
      try {
        const result = await EditorAssistantService.chatWithEditor(params.draftId, body.messages);
        return result;
      } catch (e: any) {
        set.status = 400;
        return { message: e.message };
      }
    },
    {
      body: t.Object({
        messages: t.Array(t.Any()), // CoreMessage[]
      }),
    }
  )

  // 6. Generate Lesson on Demand
  .post(
    "/lesson/:lessonId/generate",
    async ({ params, set }) => {
      try {
        const lesson = await LessonGeneratorService.generateLessonOnDemand(params.lessonId);
        return lesson;
      } catch (e: any) {
        set.status = 400;
        return { message: e.message };
      }
    }
  )

  // 6.5. Generate Quiz on Demand
  .post(
    "/lesson/:lessonId/quiz/generate",
    async ({ params, set }) => {
      try {
        await QuizWorkerService.enqueueQuizGeneration(params.lessonId);
        return { 
          state: "queued",
          isGenerating: true,
          isGenerated: false
        };
      } catch (e: any) {
        set.status = 400;
        return { message: e.message };
      }
    }
  )

  // 7. Check Lesson Generation Status
  .get(
    "/lesson/:lessonId/status",
    async ({ params, set }) => {
      const lesson = await prisma.lesson.findUnique({ where: { id: params.lessonId } });
      if (!lesson) {
        set.status = 404;
        return { message: "Lesson not found" };
      }
      const isGenerating = LessonGeneratorService.isGenerating(params.lessonId);
      return { 
        state: lesson.content ? "ready" : isGenerating ? "generating" : "not_started",
        isGenerated: !!lesson.content,
        isGenerating,
        contentLength: lesson.content?.length || 0
      };
    }
  )

  // 8. Check Quiz Generation Status
  .get(
    "/lesson/:lessonId/quiz-status",
    async ({ params, set }) => {
      // Find the quiz attached to this course created AFTER the lesson generation
      const lesson = await prisma.lesson.findUnique({ 
        where: { id: params.lessonId },
        include: { module: true }
      });
      if (!lesson) {
        set.status = 404;
        return { message: "Lesson not found" };
      }
      
      const sameTitleLessonCount = await prisma.lesson.count({
        where: {
          title: lesson.title,
          module: { courseId: lesson.module.courseId },
        },
      });

      const candidateQuizzes = await prisma.quiz.findMany({
        where: {
          courseId: lesson.module.courseId,
          type: "CHAPTER_QUIZ",
          questions: { some: {} },
          OR: [
            { lessonId: params.lessonId },
            ...(sameTitleLessonCount === 1
              ? [{ title: `Quiz for Lesson: ${lesson.title}` }]
              : []),
          ],
        },
      });
      const quiz = candidateQuizzes.find((q) => q.lessonId === params.lessonId) ?? candidateQuizzes[0];

      let workerState = QuizWorkerService.getStatus(params.lessonId);
      // Restore background work for lessons generated before a server restart.
      if (lesson.content && !quiz && !workerState) {
        await QuizWorkerService.enqueueQuizGeneration(params.lessonId);
        workerState = QuizWorkerService.getStatus(params.lessonId);
      }
      const state = quiz
        ? "ready"
        : workerState ?? (lesson.content ? "not_started" : "blocked");
      
      return {
        state,
        isGenerated: !!quiz,
        isGenerating: workerState === "queued" || workerState === "generating",
        quizId: quiz?.id,
        reason: !lesson.content
          ? "Generate the lesson before its quiz can be generated."
          : workerState === "failed"
            ? "Quiz generation failed. Please try again later."
            : undefined,
      };
    }
  )

  // 9. Chat with Learning Assistant (Assistant 2)
  .post(
    "/lesson/:lessonId/chat",
    async ({ params, body, set }) => {
      try {
        const result = await LearningAssistantService.chatWithTutor(params.lessonId, body.messages);
        return result;
      } catch (e: any) {
        set.status = 400;
        return { message: e.message };
      }
    },
    {
      body: t.Object({
        messages: t.Array(t.Any()),
      }),
    }
  )

  .use(protectedAssessmentRoute);

export default generationController;
