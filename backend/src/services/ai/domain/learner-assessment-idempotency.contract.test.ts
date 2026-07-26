import { describe, expect, test } from "bun:test";

const contractsUrl = new URL("./learner-assessment-contracts.ts", import.meta.url);
const serviceUrl = new URL("./learner-assessment.service.ts", import.meta.url);
const chapterSubmitUrl = new URL("./lesson-quiz-submission.ts", import.meta.url);
const summaryUrl = new URL("./learner-assessment-summary.ts", import.meta.url);
const completionUrl = new URL("./learner-assessment-completion.ts", import.meta.url);
const progressUrl = new URL("../../../models/user-lesson-progress/user-lesson-progress.service.ts", import.meta.url);
const routeUrl = new URL("../../../models/generation/generation-assessment.route.ts", import.meta.url);

describe("learner assessment idempotency contracts", () => {
  test("Given a completed chapter quiz When reopening an attempt Then only the canonical submission ID is exposed", async () => {
    const contracts = await Bun.file(contractsUrl).text();
    const service = await Bun.file(serviceUrl).text();

    expect(contracts).toContain('readonly attemptState: "completed"');
    expect(contracts).toContain("readonly submissionId: string");
    expect(service).toContain('attemptState: "completed"');
    expect(service).toContain("canonicalAttemptKey(userId, quiz.id)");
    expect(service).not.toContain("review:");
    expect(service).not.toContain("userAnswers");
  });

  test("Given duplicate or racing chapter submits When submitted Then canonical replay wins before AI or after P2002", async () => {
    const source = await Bun.file(chapterSubmitUrl).text();
    const lookupIndex = source.indexOf("findCanonicalSubmission(canonicalKey)");
    const aiIndex = source.indexOf("const essayReview = await requestEssayReview");

    expect(lookupIndex).toBeGreaterThan(-1);
    expect(aiIndex).toBeGreaterThan(lookupIndex);
    expect(source).toContain('reviewError.code === "P2002"');
    expect(source.match(/existingResult\(/g)?.length).toBeGreaterThanOrEqual(2);
    expect(source).toContain("canonicalAttemptKey: canonicalKey");
  });

  test("Given owned and foreign submissions When retrieving saved results Then review is parsed only after owner check", async () => {
    const source = await Bun.file(summaryUrl).text();
    const ownerGuardIndex = source.indexOf("submission.userId !== userId");
    const reviewParseIndex = source.indexOf("LessonQuizReviewSchema.safeParse");

    expect(ownerGuardIndex).toBeGreaterThan(-1);
    expect(reviewParseIndex).toBeGreaterThan(ownerGuardIndex);
    // Reviews are returned for both quiz types so final exams also show
    // per-question answers and explanations.
    expect(source).not.toContain('submission.quiz.type === "CHAPTER_QUIZ"');
    expect(source).toContain("lessonId: true");
    expect(source).toContain("review: true");
  });

  test("Given return-to-course When invoked Then ownership type and linked lesson are validated before completion", async () => {
    const completion = await Bun.file(completionUrl).text();
    const progress = await Bun.file(progressUrl).text();
    const route = await Bun.file(routeUrl).text();

    expect(route).toContain('"/submission/:submissionId/return-to-course"');
    expect(route).toContain("LearnerAssessmentService.returnToCourse");
    expect(completion).toContain("submission.userId !== userId");
    expect(completion).toContain('submission.quiz.type !== "CHAPTER_QUIZ"');
    expect(completion).toContain("submission.quiz.lessonId === null");
    expect(progress).toContain("static async completeLesson");
    expect(progress).toContain("refreshEnrollmentProgress(userId, lessonId)");
  });

  test("Given final exams When assessment contracts change Then final exam submit remains non-idempotent", async () => {
    const service = await Bun.file(serviceUrl).text();
    const finalSubmit = await Bun.file(new URL("./learner-assessment-final-submit.ts", import.meta.url)).text();

    expect(service).toContain('if (quiz.type === "CHAPTER_QUIZ")');
    expect(service).toContain("return submitFinalExamQuiz(userId, quiz, answers, input)");
    expect(finalSubmit).not.toContain("canonicalAttemptKey");
    expect(finalSubmit).toContain("prisma.examSubmission.create");
  });

  test("Given a submitted final exam When status is read Then it reports completed with the saved submission", async () => {
    const generator = await Bun.file(new URL("./final-exam-generator.service.ts", import.meta.url)).text();
    const route = await Bun.file(routeUrl).text();

    // Re-entry shows the saved score instead of the same questions again.
    expect(generator).toContain("findLatestSubmission(userId, existingExam.id)");
    expect(generator).toContain('state: submission ? "completed" : "ready"');
    expect(generator).toContain("submissionId: submission.id");

    // A retake writes a NEW quiz row so the old submission keeps its questions,
    // and status must resolve to the newest exam.
    expect(generator).toContain("static async requestRetake");
    expect(generator).toContain("if (isRetake) {");
    expect(generator).toContain("tx.quiz.create");
    expect(generator).toContain('orderBy: { createdAt: "desc" }');
    expect(route).toContain('"/course/:courseId/final-exam/retake"');
    expect(route).toContain("FinalExamGeneratorService.requestRetake");
  });
});
