import prisma from "../../../lib/prisma";
import { outlineCache } from "./outline-cache.service";

export class CoursePersistenceService {
  /**
   * Persists a cached draft outline to the real database.
   * This is triggered when the user clicks "Start Learning".
   */
  static async publishDraft(draftId: string): Promise<{ courseId: string, firstLessonId: string }> {
    const draft = outlineCache.get(draftId);
    
    if (!draft) {
      throw new Error("Draft not found or expired.");
    }

    let firstLessonId = "";

    const COURSE_COLORS: import("@prisma/client").CourseColor[] = ["blue", "yellow", "green", "pink", "purple"];
    const randomColor = COURSE_COLORS[Math.floor(Math.random() * COURSE_COLORS.length)];

    // Use Prisma transaction to ensure atomic saves
    const course = await prisma.$transaction(async (tx) => {
      // 1. Create the Course
      const createdCourse = await tx.course.create({
        data: {
          title: draft.courseTitle,
          description: draft.courseDescription,
          category: draft.courseCategory,
          level: draft.courseLevel,
          color: randomColor,
          creatorId: draft.userId, // The user who generated it becomes the creator/owner
          isPublic: false,
        },
      });

      // 2. Create Modules and Lessons
      for (const mod of draft.modules) {
        const createdModule = await tx.module.create({
          data: {
            courseId: createdCourse.id,
            title: mod.title,
            description: mod.description,
            orderIndex: mod.orderIndex,
          },
        });

        for (const lesson of mod.lessons) {
          const createdLesson = await tx.lesson.create({
            data: {
              moduleId: createdModule.id,
              title: lesson.title,
              orderIndex: lesson.orderIndex,
              // content and videoUrl remain null. Generated on demand later.
            },
          });
          if (!firstLessonId) {
            firstLessonId = createdLesson.id;
          }
        }
      }

      return createdCourse;
    });

    // Enqueue an enrollment for the user automatically
    await prisma.userCourse.create({
      data: {
        userId: draft.userId,
        courseId: course.id,
      }
    });

    // Persist the quiz settings to CourseGeneration so quiz generator can read them later.
    const quizSettings = draft.quizSettings ?? {
      enableEssayQuestions: true,
      requireImageSubmission: false,
      quizLength: "Random",
    };
    await prisma.courseGeneration.create({
      data: {
        userId: draft.userId,
        promptTopic: draft.topic,
        familiarity: "Beginner",
        enableEssayQuestions: quizSettings.enableEssayQuestions,
        requireImageSubmission: quizSettings.requireImageSubmission,
        quizLength: quizSettings.quizLength,
        status: "COMPLETED",
        resultCourseId: course.id,
      },
    });

    // We no longer delete the draft from cache immediately here.
    // If subsequent steps (like lesson generation) fail, the user can 
    // click "Start Learning" again to retry without getting a "Draft not found" error.
    
    return { courseId: course.id, firstLessonId };
  }
}
