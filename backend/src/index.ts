import { Elysia } from "elysia";

// --- Route Imports ---
import userRoute from "./models/user/user.route";
import courseRoute from "./models/course/course.route";
import moduleRoute from "./models/module/module.route";
import lessonRoute from "./models/lesson/lesson.route";
import userCourseRoute from "./models/user-course/user-course.route";
import userLessonProgressRoute from "./models/user-lesson-progress/user-lesson-progress.route";
import courseGenerationRoute from "./models/course-generation/course-generation.route";
import quizRoute from "./models/quiz/quiz.route";
import questionRoute from "./models/question/question.route";
import examSubmissionRoute from "./models/exam-submission/exam-submission.route";
import authRoute from "./models/auth/auth.route";
import GenerationController from "./models/generation/generation.route";
import { swagger } from "@elysiajs/swagger";

const app = new Elysia()
  // Health check at root level (e.g. for external monitoring/pinging)
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))

  // Group all API routes under /api
  .group("/api", (api) =>
    api
      // Swagger OpenAPI documentation
      .use(
        swagger({
          documentation: {
            info: {
              title: "TutorMe API",
              version: "1.0.0",
            },
          },
        })
      )

      // AI Generation Routes
      .use(GenerationController)

      // Auth Routes
      .use(authRoute)

      // Model routes
      .use(userRoute)
      .use(courseRoute)
      .use(moduleRoute)
      .use(lessonRoute)
      .use(userCourseRoute)
      .use(userLessonProgressRoute)
      .use(courseGenerationRoute)
      .use(quizRoute)
      .use(questionRoute)
      .use(examSubmissionRoute)
  )

  .listen(process.env.PORT || 5000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
