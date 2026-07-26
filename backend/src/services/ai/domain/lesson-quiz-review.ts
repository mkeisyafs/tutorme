import { z } from "zod";

export const EssayReviewSchema = z.object({
  aggregateFeedback: z.string().min(1),
  essays: z.array(
    z.object({
      questionId: z.string().min(1),
      score: z.number().min(0).max(100),
      rationale: z.string().min(1),
      strengths: z.array(z.string().min(1)),
      improvements: z.array(z.string().min(1)),
    }).strict()
  ),
}).strict();

export type EssayReview = z.infer<typeof EssayReviewSchema>;

const OptionReviewSchema = z.object({
  index: z.number().int().min(0),
  text: z.string(),
  isSelected: z.boolean(),
  isCorrect: z.boolean(),
  explanation: z.string(),
}).strict();

const MultipleChoiceReviewSchema = z.object({
  type: z.literal("MULTIPLE_CHOICE"),
  score: z.union([z.literal(0), z.literal(100)]),
  selectedAnswer: z.number().int().min(0).nullable(),
  correctAnswer: z.number().int().min(0).nullable(),
  isCorrect: z.boolean(),
  options: z.array(OptionReviewSchema),
}).strict();

const EssayQuestionReviewSchema = z.object({
  type: z.literal("ESSAY"),
  score: z.number().min(0).max(100),
  rationale: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
}).strict();

export const LessonQuizReviewSchema = z.object({
  version: z.literal(1),
  aggregateFeedback: z.string(),
  score: z.number().min(0).max(100),
  correctCount: z.number().int().min(0),
  totalQuestions: z.number().int().min(0),
  questions: z.record(
    z.string(),
    z.discriminatedUnion("type", [MultipleChoiceReviewSchema, EssayQuestionReviewSchema])
  ),
}).strict();

export type ReviewQuestion = {
  readonly id: string;
  readonly type: "MULTIPLE_CHOICE" | "ESSAY";
  readonly prompt: string;
  readonly options: unknown;
  readonly explanations: unknown;
  readonly correctAnswer: number | null;
};

export type LessonQuizReviewInput = {
  readonly questions: readonly ReviewQuestion[];
  readonly answers: Readonly<Record<string, string | number | boolean | null>>;
  readonly essayReview: EssayReview;
};

export class LessonQuizReviewError extends Error {
  constructor(readonly reason: string) {
    super(reason);
    this.name = "LessonQuizReviewError";
  }
}

export type LessonQuizReview = {
  readonly version: 1;
  readonly aggregateFeedback: string;
  readonly score: number;
  readonly correctCount: number;
  readonly totalQuestions: number;
  readonly questions: Record<string, QuestionReview>;
};

export type QuestionReview = MultipleChoiceReview | EssayQuestionReview;

export type MultipleChoiceReview = {
  readonly type: "MULTIPLE_CHOICE";
  readonly score: 0 | 100;
  readonly selectedAnswer: number | null;
  readonly correctAnswer: number | null;
  readonly isCorrect: boolean;
  readonly options: readonly OptionReview[];
};

export type OptionReview = {
  readonly index: number;
  readonly text: string;
  readonly isSelected: boolean;
  readonly isCorrect: boolean;
  readonly explanation: string;
};

export type EssayQuestionReview = {
  readonly type: "ESSAY";
  readonly score: number;
  readonly rationale: string;
  readonly strengths: readonly string[];
  readonly improvements: readonly string[];
};

export function buildLessonQuizReview(input: LessonQuizReviewInput): LessonQuizReview {
  const essayReviews = validatedEssayReviews(input.questions, input.essayReview);
  const questions: Record<string, QuestionReview> = {};
  let correctCount = 0;
  let scoreTotal = 0;

  for (const question of input.questions) {
    if (question.type === "MULTIPLE_CHOICE") {
      const review = buildMultipleChoiceReview(question, input.answers[question.id]);
      questions[question.id] = review;
      scoreTotal += review.score;
      if (review.isCorrect) correctCount += 1;
    } else {
      const review = essayReviews.get(question.id);
      if (!review) throw new LessonQuizReviewError(`Missing essay review for question ${question.id}`);
      questions[question.id] = {
        type: "ESSAY",
        score: Math.round(review.score),
        rationale: review.rationale,
        strengths: review.strengths,
        improvements: review.improvements,
      };
      scoreTotal += review.score;
    }
  }

  return {
    version: 1,
    aggregateFeedback: input.essayReview.aggregateFeedback,
    score: input.questions.length === 0 ? 0 : Math.round(scoreTotal / input.questions.length),
    correctCount,
    totalQuestions: input.questions.length,
    questions,
  };
}

function validatedEssayReviews(
  questions: readonly ReviewQuestion[],
  review: EssayReview
): ReadonlyMap<string, EssayReview["essays"][number]> {
  const essayIds = new Set(
    questions.filter((question) => question.type === "ESSAY").map((question) => question.id)
  );
  const seenIds = new Set<string>();
  const byId = new Map<string, EssayReview["essays"][number]>();

  for (const essay of review.essays) {
    if (!essayIds.has(essay.questionId)) {
      throw new LessonQuizReviewError(`Unknown essay review id ${essay.questionId}`);
    }
    if (seenIds.has(essay.questionId)) {
      throw new LessonQuizReviewError(`Duplicate essay review id ${essay.questionId}`);
    }
    seenIds.add(essay.questionId);
    byId.set(essay.questionId, essay);
  }
  for (const essayId of essayIds) {
    if (!seenIds.has(essayId)) {
      throw new LessonQuizReviewError(`Missing essay review for question ${essayId}`);
    }
  }
  return byId;
}

function buildMultipleChoiceReview(
  question: ReviewQuestion,
  answer: string | number | boolean | null | undefined
): MultipleChoiceReview {
  const options = stringArray(question.options);
  const explanations = explanationsFor(question, options);
  const selectedAnswer = answerIndex(answer);
  const isCorrect = question.correctAnswer !== null && selectedAnswer === question.correctAnswer;

  return {
    type: "MULTIPLE_CHOICE",
    score: isCorrect ? 100 : 0,
    selectedAnswer,
    correctAnswer: question.correctAnswer,
    isCorrect,
    options: options.map((option, index) => ({
      index,
      text: option,
      isSelected: selectedAnswer === index,
      isCorrect: question.correctAnswer === index,
      explanation: explanations[index] ?? fallbackExplanation(question.correctAnswer === index),
    })),
  };
}

export function stringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function answerIndex(answer: string | number | boolean | null | undefined): number | null {
  if (typeof answer === "number" && Number.isInteger(answer)) return answer;
  if (typeof answer === "string" && /^\d+$/.test(answer)) return Number(answer);
  return null;
}

function explanationsFor(question: ReviewQuestion, options: readonly string[]): readonly string[] {
  const explanations = question.explanations;
  return options.map((_option, index) => {
    const explanation = Array.isArray(explanations) ? explanations[index] : undefined;
    return typeof explanation === "string" && explanation.trim() !== ""
      ? explanation
      : fallbackExplanation(question.correctAnswer === index);
  });
}

function fallbackExplanation(isCorrect: boolean): string {
  return isCorrect
    ? "This is the correct answer."
    : "This is not the correct answer.";
}
