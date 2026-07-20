import { QuizGeneratorService } from "../domain/quiz-generator.service";

export type QuizGenerationState = "queued" | "generating" | "failed";

interface QuizGenerationJob {
  state: QuizGenerationState;
}

/**
 * A simple background worker for generating quizzes asynchronously.
 * In a production environment with heavy load, this should be replaced
 * with a robust queueing system like BullMQ backed by Redis.
 */
export class QuizWorkerService {
  private static jobs = new Map<string, QuizGenerationJob>();

  /**
   * Enqueues a quiz generation task to run in the background.
   */
  static async enqueueQuizGeneration(lessonId: string) {
    const existingJob = this.jobs.get(lessonId);
    if (existingJob?.state === "queued" || existingJob?.state === "generating") {
      return;
    }

    this.jobs.set(lessonId, { state: "queued" });

    // Run asynchronously without awaiting the result here
    setTimeout(async () => {
      this.jobs.set(lessonId, { state: "generating" });

      try {
        console.log(`[QuizWorker] Starting quiz generation for lesson ${lessonId}...`);
        await QuizGeneratorService.generateQuizForLesson(lessonId);
        console.log(`[QuizWorker] Completed quiz generation for lesson ${lessonId}.`);
        this.jobs.delete(lessonId);
      } catch (error) {
        console.error(`[QuizWorker] Failed quiz generation for lesson ${lessonId}:`, error);
        this.jobs.set(lessonId, { state: "failed" });
      }
    }, 0);
  }

  static getStatus(lessonId: string): QuizGenerationState | undefined {
    return this.jobs.get(lessonId)?.state;
  }
}
