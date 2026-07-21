import { describe, expect, test } from "bun:test";

const schemaUrl = new URL("./schema.prisma", import.meta.url);
const migrationUrl = new URL(
  "./migrations/20260721000000_add_lesson_quiz_saved_review_contracts/migration.sql",
  import.meta.url
);

const QUIZ_TYPES = {
  chapter: "CHAPTER_QUIZ",
  final: "FINAL_EXAM",
} as const;

type QuizType = (typeof QUIZ_TYPES)[keyof typeof QUIZ_TYPES];

type SubmissionFixture = {
  readonly id: string;
  readonly userId: string;
  readonly quizId: string;
  readonly quizType: QuizType;
  readonly submittedAt: string;
};

type MigratedSubmission = SubmissionFixture & {
  readonly canonicalAttemptKey: string | null;
};

function modelBlock(schema: string, modelName: string): string {
  const match = schema.match(new RegExp(`model ${modelName} \\{[\\s\\S]*?\\n\\}`));
  if (!match) {
    throw new Error(`Missing ${modelName} model`);
  }
  return match[0];
}

function isNewerSubmission(candidate: SubmissionFixture, current: SubmissionFixture): boolean {
  return (
    candidate.submittedAt > current.submittedAt ||
    (candidate.submittedAt === current.submittedAt && candidate.id > current.id)
  );
}

function migrateSubmissionFixtures(
  submissions: readonly SubmissionFixture[]
): readonly MigratedSubmission[] {
  const newestChapterSubmissionByUserQuiz = new Map<string, SubmissionFixture>();

  for (const submission of submissions) {
    if (submission.quizType !== QUIZ_TYPES.chapter) continue;

    const key = `${submission.userId}:${submission.quizId}`;
    const current = newestChapterSubmissionByUserQuiz.get(key);
    if (!current || isNewerSubmission(submission, current)) {
      newestChapterSubmissionByUserQuiz.set(key, submission);
    }
  }

  return submissions
    .filter((submission) => {
      if (submission.quizType === QUIZ_TYPES.final) return true;
      const key = `${submission.userId}:${submission.quizId}`;
      return newestChapterSubmissionByUserQuiz.get(key)?.id === submission.id;
    })
    .map((submission) => ({
      ...submission,
      canonicalAttemptKey:
        submission.quizType === QUIZ_TYPES.chapter
          ? `${submission.userId}:${submission.quizId}`
          : null,
    }));
}

describe("lesson quiz and saved review persistence contracts", () => {
  test("Given the Prisma schema When inspecting quiz and submission models Then only chapter quiz submissions can receive a canonical uniqueness key", async () => {
    const schema = await Bun.file(schemaUrl).text();
    const lesson = modelBlock(schema, "Lesson");
    const quiz = modelBlock(schema, "Quiz");
    const examSubmission = modelBlock(schema, "ExamSubmission");

    expect(lesson).toContain("quizzes");
    expect(quiz).toContain("lessonId");
    expect(quiz).toContain("lesson");
    expect(quiz).toContain("onDelete: SetNull");
    expect(examSubmission).toContain("review");
    expect(examSubmission).toContain("Json?");
    expect(examSubmission).toContain("aiFeedback");
    expect(examSubmission).toContain("canonicalAttemptKey");
    expect(examSubmission).toContain("@unique");
    expect(examSubmission).not.toContain("@@unique([userId, quizId])");
  });

  test("Given legacy rows When the generated migration runs Then only chapter duplicates collapse and final exam history remains repeatable", async () => {
    const migration = await Bun.file(migrationUrl).text();

    expect(migration).toContain("ALTER TABLE `Quiz` ADD COLUMN `lessonId`");
    expect(migration).toContain("ALTER TABLE `ExamSubmission` ADD COLUMN `review`");
    expect(migration).toContain("ALTER TABLE `ExamSubmission` ADD COLUMN `canonicalAttemptKey`");
    expect(migration).toContain("DELETE es FROM `ExamSubmission` es");
    expect(migration).toContain("q.`type` = 'CHAPTER_QUIZ'");
    expect(migration).toContain("canonicalAttemptKey` = CONCAT");
    expect(migration).toContain("CREATE UNIQUE INDEX `ExamSubmission_canonicalAttemptKey_key`");
    expect(migration).not.toContain("CREATE UNIQUE INDEX `ExamSubmission_userId_quizId_key`");
    expect(migration).toContain("COUNT(*) = 1");
    expect(migration).toContain("Quiz for Lesson:");
  });

  test("Given duplicate chapter and final exam submissions When characterizing migration data effects Then newest chapter rows become canonical and all final exam rows stay", () => {
    const migrated = migrateSubmissionFixtures([
      {
        id: "chapter-old",
        userId: "user-1",
        quizId: "chapter-quiz",
        quizType: QUIZ_TYPES.chapter,
        submittedAt: "2026-07-21T10:00:00.000Z",
      },
      {
        id: "chapter-newer-low-id",
        userId: "user-1",
        quizId: "chapter-quiz",
        quizType: QUIZ_TYPES.chapter,
        submittedAt: "2026-07-21T11:00:00.000Z",
      },
      {
        id: "chapter-newer-z",
        userId: "user-1",
        quizId: "chapter-quiz",
        quizType: QUIZ_TYPES.chapter,
        submittedAt: "2026-07-21T11:00:00.000Z",
      },
      {
        id: "final-old",
        userId: "user-1",
        quizId: "final-quiz",
        quizType: QUIZ_TYPES.final,
        submittedAt: "2026-07-21T10:00:00.000Z",
      },
      {
        id: "final-new",
        userId: "user-1",
        quizId: "final-quiz",
        quizType: QUIZ_TYPES.final,
        submittedAt: "2026-07-21T11:00:00.000Z",
      },
    ]);

    expect(migrated.map((submission) => submission.id)).toEqual([
      "chapter-newer-z",
      "final-old",
      "final-new",
    ]);
    expect(migrated[0]?.canonicalAttemptKey).toBe("user-1:chapter-quiz");
    expect(migrated[1]?.canonicalAttemptKey).toBeNull();
    expect(migrated[2]?.canonicalAttemptKey).toBeNull();
  });
});
