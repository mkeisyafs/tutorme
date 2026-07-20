import { QuizGeneratorService } from "../domain/quiz-generator.service";

/**
 * A simple background worker for generating quizzes asynchronously.
 * In a production environment with heavy load, this should be replaced
 * with a robust queueing system like BullMQ backed by Redis.
 */
export class QuizWorkerService {
  /**
   * Enqueues a quiz generation task to run in the background.
   */
  static async enqueueQuizGeneration(lessonId: string) {
    // Run asynchronously without awaiting the result here
    setTimeout(async () => {
      try {
        console.log(`[QuizWorker] Starting quiz generation for lesson ${lessonId}...`);
        await QuizGeneratorService.generateQuizForLesson(lessonId);
        console.log(`[QuizWorker] Completed quiz generation for lesson ${lessonId}.`);
      } catch (error) {
        console.error(`[QuizWorker] Failed quiz generation for lesson ${lessonId}:`, error);
      }
    }, 0);
  }
}
