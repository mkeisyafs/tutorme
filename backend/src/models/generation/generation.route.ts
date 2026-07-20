import { Elysia, t } from "elysia";
import { CourseGeneratorService } from "../../services/ai/domain/course-generator.service";
import { CoursePersistenceService } from "../../services/ai/domain/course-persistence.service";
import { LessonGeneratorService } from "../../services/ai/domain/lesson-generator.service";
import { EditorAssistantService } from "../../services/ai/assistants/editor-assistant.service";
import { LearningAssistantService } from "../../services/ai/assistants/learning-assistant.service";
import { outlineCache } from "../../services/ai/domain/outline-cache.service";
import prisma from "../../lib/prisma";

export const generationController = new Elysia({ prefix: "/generation" })

  // 1. Generate Course Outline (Temporary)
  .post(
    "/outline",
    async ({ body }) => {
      const draftId = await CourseGeneratorService.generateOutline(
        body.userId,
        body.topic,
        body.familiarity,
        body.language
      );
      return { draftId };
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
      return { 
        isGenerated: !!lesson.content,
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
        }
      });
      
      return { isGenerated: !!quiz, quizId: quiz?.id };
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
  );

export default generationController;
