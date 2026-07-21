import { describe, expect, test } from "bun:test";

const quizGeneratorUrl = new URL("./quiz-generator.service.ts", import.meta.url);
const generationRouteUrl = new URL("../../../models/generation/generation.route.ts", import.meta.url);

const QUIZ_TYPE = "CHAPTER_QUIZ" as const;

type LessonFixture = {
  readonly id: string;
  readonly courseId: string;
  readonly title: string;
};

type QuizFixture = {
  readonly id: string;
  readonly courseId: string;
  readonly lessonId: string | null;
  readonly chapterQuizLessonKey: string | null;
  readonly title: string;
  readonly type: typeof QUIZ_TYPE;
  readonly hasQuestions: boolean;
};

function titleForLesson(lesson: LessonFixture): string {
  return `Quiz for Lesson: ${lesson.title}`;
}

function findTitleBasedQuiz(
  quizzes: readonly QuizFixture[],
  lesson: LessonFixture
): QuizFixture | undefined {
  return quizzes.find(
    (quiz) =>
      quiz.courseId === lesson.courseId &&
      quiz.title === titleForLesson(lesson) &&
      quiz.type === QUIZ_TYPE &&
      quiz.hasQuestions
  );
}

function canUseLegacyTitleFallback(
  lessons: readonly LessonFixture[],
  lesson: LessonFixture
): boolean {
  return lessons.filter(
    (candidate) => candidate.courseId === lesson.courseId && candidate.title === lesson.title
  ).length === 1;
}

function findLessonLinkedQuiz(
  lessons: readonly LessonFixture[],
  quizzes: readonly QuizFixture[],
  lesson: LessonFixture
): QuizFixture | undefined {
  const linkedQuiz = quizzes.find(
    (quiz) => quiz.lessonId === lesson.id && quiz.type === QUIZ_TYPE && quiz.hasQuestions
  );
  if (linkedQuiz) return linkedQuiz;
  if (!canUseLegacyTitleFallback(lessons, lesson)) return undefined;
  return quizzes.find(
    (quiz) =>
      quiz.courseId === lesson.courseId &&
      quiz.lessonId === null &&
      quiz.title === titleForLesson(lesson) &&
      quiz.type === QUIZ_TYPE &&
      quiz.hasQuestions
  );
}

function findExactLegacyQuiz(
  lessons: readonly LessonFixture[],
  quizzes: readonly QuizFixture[],
  lesson: LessonFixture
): QuizFixture | undefined {
  if (!canUseLegacyTitleFallback(lessons, lesson)) return undefined;
  const candidates = quizzes.filter(
    (quiz) =>
      quiz.courseId === lesson.courseId &&
      quiz.lessonId === null &&
      quiz.title === titleForLesson(lesson) &&
      quiz.type === QUIZ_TYPE
  );
  return candidates.length === 1 ? candidates[0] : undefined;
}

function createLinkedQuiz(
  quizzes: readonly QuizFixture[],
  lesson: LessonFixture
): readonly QuizFixture[] {
  if (quizzes.some((quiz) => quiz.chapterQuizLessonKey === lesson.id)) return quizzes;
  return [
    ...quizzes,
    {
      id: `quiz-${lesson.id}`,
      courseId: lesson.courseId,
      lessonId: lesson.id,
      chapterQuizLessonKey: lesson.id,
      title: titleForLesson(lesson),
      type: QUIZ_TYPE,
      hasQuestions: false,
    },
  ];
}

describe("lesson-linked chapter quiz contract", () => {
  test("Given same-title lessons When using title-only lookup Then the second lesson can reuse the first lesson quiz", () => {
    const lessonB = { id: "lesson-b", courseId: "course-1", title: "Intro" };
    const titleOnlyMatch = findTitleBasedQuiz(
      [
        {
          id: "quiz-a",
          courseId: "course-1",
          lessonId: "lesson-a",
          chapterQuizLessonKey: "lesson-a",
          title: "Quiz for Lesson: Intro",
          type: QUIZ_TYPE,
          hasQuestions: true,
        },
      ],
      lessonB
    );

    expect(titleOnlyMatch?.id).toBe("quiz-a");
  });

  test("Given same-title lessons When using lesson-linked lookup Then each lesson resolves to its own quiz", () => {
    const lessons = [
      { id: "lesson-a", courseId: "course-1", title: "Intro" },
      { id: "lesson-b", courseId: "course-1", title: "Intro" },
    ] as const;
    const quizzes = [
      {
        id: "quiz-a",
        courseId: "course-1",
        lessonId: "lesson-a",
        chapterQuizLessonKey: "lesson-a",
        title: "Quiz for Lesson: Intro",
        type: QUIZ_TYPE,
        hasQuestions: true,
      },
      {
        id: "quiz-b",
        courseId: "course-1",
        lessonId: "lesson-b",
        chapterQuizLessonKey: "lesson-b",
        title: "Quiz for Lesson: Intro",
        type: QUIZ_TYPE,
        hasQuestions: true,
      },
    ] as const;

    expect(findLessonLinkedQuiz(lessons, quizzes, lessons[0])?.id).toBe("quiz-a");
    expect(findLessonLinkedQuiz(lessons, quizzes, lessons[1])?.id).toBe("quiz-b");
  });

  test("Given duplicate lesson titles and a null-lesson legacy quiz When using fallback Then the quiz is not guessed", () => {
    const lessons = [
      { id: "lesson-a", courseId: "course-1", title: "Intro" },
      { id: "lesson-b", courseId: "course-1", title: "Intro" },
    ] as const;
    const legacyQuizzes = [
      {
        id: "legacy-quiz",
        courseId: "course-1",
        lessonId: null,
        chapterQuizLessonKey: null,
        title: "Quiz for Lesson: Intro",
        type: QUIZ_TYPE,
        hasQuestions: true,
      },
    ] as const;

    expect(findLessonLinkedQuiz(lessons, legacyQuizzes, lessons[1])).toBeUndefined();
  });

  test("Given duplicate null-linked legacy quizzes When using fallback Then no arbitrary row is selected", () => {
    const lessons = [{ id: "lesson-a", courseId: "course-1", title: "Intro" }] as const;
    const legacyQuizzes = [
      {
        id: "legacy-quiz-a",
        courseId: "course-1",
        lessonId: null,
        chapterQuizLessonKey: null,
        title: "Quiz for Lesson: Intro",
        type: QUIZ_TYPE,
        hasQuestions: true,
      },
      {
        id: "legacy-quiz-b",
        courseId: "course-1",
        lessonId: null,
        chapterQuizLessonKey: null,
        title: "Quiz for Lesson: Intro",
        type: QUIZ_TYPE,
        hasQuestions: true,
      },
    ] as const;

    expect(findExactLegacyQuiz(lessons, legacyQuizzes, lessons[0])).toBeUndefined();
  });

  test("Given concurrent linked creation When the unique lesson key is applied Then one quiz record exists", () => {
    const lesson = { id: "lesson-a", courseId: "course-1", title: "Intro" };
    const afterFirstCreate = createLinkedQuiz([], lesson);
    const afterSecondCreate = createLinkedQuiz(afterFirstCreate, lesson);

    expect(afterSecondCreate).toHaveLength(1);
    expect(afterSecondCreate[0]?.chapterQuizLessonKey).toBe("lesson-a");
  });

  test("Given production files When inspected Then generation and status lookup prefer lessonId", async () => {
    const quizGenerator = await Bun.file(quizGeneratorUrl).text();
    const generationRoute = await Bun.file(generationRouteUrl).text();

    expect(quizGenerator).toContain("lessonId: lesson.id");
    expect(quizGenerator).toContain("chapterQuizLessonKey: lesson.id");
    expect(quizGenerator).toContain("upsert");
    expect(generationRoute).toContain("lessonId: params.lessonId");
    expect(generationRoute).toContain("findMany");
    expect(quizGenerator).toContain("sameTitleLessonCount === 1");
    expect(generationRoute).toContain("sameTitleLessonCount === 1");
  });
});
