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

// The existing outline and lesson routes intentionally remain compatible with
// their current client-supplied user IDs. Final-exam eligibility is different:
// it is tied to a learner's persisted progress, so this nested route derives
// that learner from the verified JWT rather than accepting a spoofable userId.
const protectedAssessmentRoute = new Elysia()
  .use(authMiddleware.as("scoped"))
  .onBeforeHandle(({ user, set }: any) => {
    if (!user) {
      set.status = 401;
      return { message: "Unauthorized: Invalid or missing token" };
    }
  })
  .post(
    "/course/:courseId/final-exam",
    async ({ params, user }: any) => {
      return FinalExamGeneratorService.requestGeneration(user.sub, params.courseId);
    },
    {
      params: t.Object({ courseId: t.String() }),
    }
  )
  .get(
    "/course/:courseId/final-exam",
    async ({ params, user }: any) => {
      return FinalExamGeneratorService.getStatus(user.sub, params.courseId);
    },
    {
      params: t.Object({ courseId: t.String() }),
    }
  )
  .get(
    "/quiz/:quizId/attempt",
    async ({ params, user, set }: any) => {
      const result = await LearnerAssessmentService.getAttempt(user.sub, params.quizId);
      if (!result.ok) {
        set.status = result.status;
        return { message: result.message };
      }
      return result.data;
    },
    {
      params: t.Object({ quizId: t.String() }),
    }
  )
  .post(
    "/quiz/:quizId/submit",
    async ({ params, body, user, set }: any) => {
      const result = await LearnerAssessmentService.submit(user.sub, params.quizId, body);
      if (!result.ok) {
        set.status = result.status;
        return { message: result.message };
      }
      return result.data;
    },
    {
      params: t.Object({ quizId: t.String() }),
      body: t.Object({
        answers: t.Record(t.String(), t.Any()),
        timeSpentSec: t.Optional(t.Number({ minimum: 0 })),
        essayImageUrl: t.Optional(t.Nullable(t.String())),
      }),
    }
  )
  .get(
    "/submission/:submissionId",
    async ({ params, user, set }: any) => {
      const result = await LearnerAssessmentService.getSubmission(
        user.sub,
        params.submissionId
      );
      if (!result.ok) {
        set.status = result.status;
        return { message: result.message };
      }
      return result.data;
    },
    {
      params: t.Object({ submissionId: t.String() }),
    }
  );

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
          body.language
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
      }),
    }
  )

  // 2. Get Cached Outline
  .get(
    "/outline/:draftId",
    async ({ params, error }) => {
      const draft = outlineCache.get(params.draftId);
      if (!draft) return error(404, "Draft not found");
      return draft;
    }
  )

  // 3. Manual Update Cached Outline
  .patch(
    "/outline/:draftId",
    async ({ params, body, error }) => {
      const draft = outlineCache.update(params.draftId, body as any);
      if (!draft) return error(404, "Draft not found");
      return draft;
    }
  )

  // 4. Start Learning (Persist to DB)
  .post(
    "/outline/:draftId/publish",
    async ({ params, error }) => {
      try {
        const courseId = await CoursePersistenceService.publishDraft(params.draftId);
        return { courseId };
      } catch (e: any) {
        return error(400, e.message);
      }
    }
  )

  // 5. Chat with Editor Assistant (Assistant 1)
  .post(
    "/outline/:draftId/chat",
    async ({ params, body, error }) => {
      try {
        const result = await EditorAssistantService.chatWithEditor(params.draftId, body.messages);
        return result;
      } catch (e: any) {
        return error(400, e.message);
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
    async ({ params, error }) => {
      try {
        const lesson = await LessonGeneratorService.generateLessonOnDemand(params.lessonId);
        return lesson;
      } catch (e: any) {
        return error(400, e.message);
      }
    }
  )

  // 7. Check Lesson Generation Status
  .get(
    "/lesson/:lessonId/status",
    async ({ params, error }) => {
      const lesson = await prisma.lesson.findUnique({ where: { id: params.lessonId } });
      if (!lesson) return error(404, "Lesson not found");
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
    async ({ params, error }) => {
      // Find the quiz attached to this course created AFTER the lesson generation
      const lesson = await prisma.lesson.findUnique({ 
        where: { id: params.lessonId },
        include: { module: true }
      });
      if (!lesson) return error(404, "Lesson not found");
      
      const quiz = await prisma.quiz.findFirst({
        where: {
          courseId: lesson.module.courseId,
          title: `Quiz for Lesson: ${lesson.title}`,
          type: "CHAPTER_QUIZ",
          questions: { some: {} },
        }
      });

      const workerState = QuizWorkerService.getStatus(params.lessonId);
      const state = quiz
        ? "ready"
        : workerState ?? (lesson.content ? "not_started" : "blocked");
      
      return {
        state,
        isGenerated: !!quiz,
        isGenerating: workerState === "queued" || workerState === "generating",
        quizId: quiz?.id,
        reason: lesson.content
          ? undefined
          : "Generate the lesson before its quiz can be generated.",
      };
    }
  )

  // 9. Chat with Learning Assistant (Assistant 2)
  .post(
    "/lesson/:lessonId/chat",
    async ({ params, body, error }) => {
      try {
        const result = await LearningAssistantService.chatWithTutor(params.lessonId, body.messages);
        return result;
      } catch (e: any) {
        return error(400, e.message);
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
