import { describe, expect, test } from "bun:test";

const serviceUrl = new URL("./user-lesson-progress.service.ts", import.meta.url);
const assessmentCompletionUrl = new URL(
  "../../services/ai/domain/learner-assessment-completion.ts",
  import.meta.url
);
const routeUrl = new URL("../generation/generation-assessment.route.ts", import.meta.url);

describe("user lesson completion race contract", () => {
  test("Given no progress row When two first completions race Then P2002 refetch converges on the winner", async () => {
    const source = await Bun.file(serviceUrl).text();
    const missCreateIndex = source.indexOf("prisma.userLessonProgress.create");
    const p2002Index = source.indexOf('createError.code === "P2002"');
    const refetchIndex = source.indexOf("const winner = await this.findProgress", p2002Index);

    expect(source).toContain("static async completeLesson");
    expect(source).toContain("persistCompletedProgress(userId, lessonId)");
    expect(missCreateIndex).toBeGreaterThan(-1);
    expect(p2002Index).toBeGreaterThan(missCreateIndex);
    expect(refetchIndex).toBeGreaterThan(p2002Index);
    expect(source).toContain("winner ? this.updateCompletedProgress(winner) : null");
  });

  test("Given in-progress or completed rows When completion repeats Then completedAt semantics are preserved", async () => {
    const source = await Bun.file(serviceUrl).text();

    expect(source).toContain('progress.status === "COMPLETED"');
    expect(source).toContain("progress.completedAt ?? new Date()");
    expect(source).toContain(': new Date();');
    expect(source).toContain('data: { status: "COMPLETED", completedAt }');
  });

  test("Given completion converges When persistence succeeds Then enrollment progress is refreshed once from the converged path", async () => {
    const source = await Bun.file(serviceUrl).text();
    const persistIndex = source.indexOf("persistCompletedProgress(userId, lessonId)");
    const refreshIndex = source.indexOf("refreshEnrollmentProgress(userId, lessonId)", persistIndex);

    expect(refreshIndex).toBeGreaterThan(persistIndex);
    expect(source).toContain("progressPercentage");
    expect(source).toContain("courseCompleted");
  });

  test("Given route and assessment guards When completion race is fixed Then HTTP surface and final/course scope stay unchanged", async () => {
    const completion = await Bun.file(assessmentCompletionUrl).text();
    const route = await Bun.file(routeUrl).text();

    expect(route).toContain('"/submission/:submissionId/return-to-course"');
    expect(route).toContain("LearnerAssessmentService.returnToCourse");
    expect(completion).toContain("submission.userId !== userId");
    expect(completion).toContain('submission.quiz.type !== "CHAPTER_QUIZ"');
    expect(completion).toContain("submission.quiz.lessonId === null");
  });
});
