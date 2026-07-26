import { describe, expect, test } from "bun:test";
import { buildLessonQuizReview, type EssayReview, type ReviewQuestion } from "./lesson-quiz-review";

const learnerAssessmentUrl = new URL("./learner-assessment.service.ts", import.meta.url);
const lessonQuizSubmissionUrl = new URL("./lesson-quiz-submission.ts", import.meta.url);
const finalExamSubmissionUrl = new URL("./learner-assessment-final-submit.ts", import.meta.url);

const QUESTIONS = [
  {
    id: "mcq-1",
    type: "MULTIPLE_CHOICE",
    prompt: "Pick the runtime.",
    options: ["Node", "Bun", "Deno"],
    explanations: ["Older runtime", "Fast runtime", "Secure runtime"],
    correctAnswer: 1,
  },
  {
    id: "essay-1",
    type: "ESSAY",
    prompt: "Explain why Bun is fast.",
    options: null,
    explanations: null,
    correctAnswer: null,
  },
] as const satisfies readonly ReviewQuestion[];

const VALID_ESSAY_REVIEW = {
  aggregateFeedback: "Strong recall with room for more detail.",
  essays: [
    {
      questionId: "essay-1",
      score: 60,
      rationale: "Names the runtime but misses implementation details.",
      strengths: ["Identifies the core idea."],
      improvements: ["Explain concrete runtime mechanisms."],
    },
  ],
} as const satisfies EssayReview;

describe("lesson quiz structured review", () => {
  test("Given mixed MCQ and essay answers When reviewed Then score is the rounded mean of question percentages", () => {
    const review = buildLessonQuizReview({
      questions: QUESTIONS,
      answers: { "mcq-1": 1, "essay-1": "Bun uses native tooling." },
      essayReview: VALID_ESSAY_REVIEW,
    });

    expect(review.score).toBe(80);
    expect(review.correctCount).toBe(1);
    expect(review.totalQuestions).toBe(2);
    expect(review.questions["essay-1"]?.type).toBe("ESSAY");
  });

  test("Given an MCQ with explanations When reviewed Then every option has server-authored correctness and explanation", () => {
    const review = buildLessonQuizReview({
      questions: QUESTIONS,
      answers: { "mcq-1": 0, "essay-1": "Partial answer" },
      essayReview: VALID_ESSAY_REVIEW,
    });
    const question = review.questions["mcq-1"];

    expect(question?.type).toBe("MULTIPLE_CHOICE");
    if (question?.type !== "MULTIPLE_CHOICE") throw new Error("Expected MCQ review");
    expect(question.score).toBe(0);
    expect(question.options).toHaveLength(3);
    expect(question.options.map((option) => option.explanation)).toEqual([
      "Older runtime",
      "Fast runtime",
      "Secure runtime",
    ]);
    expect(question.options[1]?.isCorrect).toBe(true);
  });

  test("Given insufficient MCQ explanations When reviewed Then deterministic fallback explanations cover every option", () => {
    const question = { ...QUESTIONS[0], explanations: [] } satisfies ReviewQuestion;
    const review = buildLessonQuizReview({
      questions: [question],
      answers: { "mcq-1": 1 },
      essayReview: { aggregateFeedback: "Review complete.", essays: [] },
    });
    const mcq = review.questions["mcq-1"];

    expect(mcq?.type).toBe("MULTIPLE_CHOICE");
    if (mcq?.type !== "MULTIPLE_CHOICE") throw new Error("Expected MCQ review");
    expect(mcq.options.every((option) => option.explanation.length > 0)).toBe(true);
  });

  test("Given blank or gapped MCQ explanations When reviewed Then every option keeps its own index-aligned explanation", () => {
    const question = {
      ...QUESTIONS[0],
      explanations: ["", null, "Secure runtime"],
    } satisfies ReviewQuestion;
    const review = buildLessonQuizReview({
      questions: [question],
      answers: { "mcq-1": 1 },
      essayReview: { aggregateFeedback: "Review complete.", essays: [] },
    });
    const mcq = review.questions["mcq-1"];

    if (mcq?.type !== "MULTIPLE_CHOICE") throw new Error("Expected MCQ review");
    expect(mcq.options.map((option) => option.explanation)).toEqual([
      "This is not the correct answer.",
      "This is the correct answer.",
      "Secure runtime",
    ]);
  });

  test("Given malformed AI essay IDs When reviewed Then duplicate missing and unknown IDs are rejected", () => {
    expect(() =>
      buildLessonQuizReview({
        questions: QUESTIONS,
        answers: { "mcq-1": 1, "essay-1": "Answer" },
        essayReview: { ...VALID_ESSAY_REVIEW, essays: [] },
      })
    ).toThrow("Missing essay review");
    expect(() =>
      buildLessonQuizReview({
        questions: QUESTIONS,
        answers: { "mcq-1": 1, "essay-1": "Answer" },
        essayReview: {
          aggregateFeedback: "Invalid.",
          essays: [VALID_ESSAY_REVIEW.essays[0], VALID_ESSAY_REVIEW.essays[0]],
        },
      })
    ).toThrow("Duplicate essay review");
    expect(() =>
      buildLessonQuizReview({
        questions: QUESTIONS,
        answers: { "mcq-1": 1, "essay-1": "Answer" },
        essayReview: {
          aggregateFeedback: "Invalid.",
          essays: [{ ...VALID_ESSAY_REVIEW.essays[0], questionId: "unknown" }],
        },
      })
    ).toThrow("Unknown essay review");
  });

  test("Given extracted production submit flow When inspected Then facade dispatches chapter review and preserves final-exam scoring", async () => {
    const facadeSource = await Bun.file(learnerAssessmentUrl).text();
    const lessonSubmissionSource = await Bun.file(lessonQuizSubmissionUrl).text();
    const finalSubmissionSource = await Bun.file(finalExamSubmissionUrl).text();
    const reviewIndex = lessonSubmissionSource.indexOf("requestEssayReview");
    const createIndex = lessonSubmissionSource.indexOf("prisma.examSubmission.create", reviewIndex);

    expect(facadeSource).toContain('quiz.type === "CHAPTER_QUIZ"');
    expect(facadeSource).toContain("submitReviewedChapterQuiz");
    expect(facadeSource).toContain("submitFinalExamQuiz");
    expect(reviewIndex).toBeGreaterThan(-1);
    expect(createIndex).toBeGreaterThan(reviewIndex);
    expect(finalSubmissionSource).toContain("const multipleChoiceQuestions");
  });
});
