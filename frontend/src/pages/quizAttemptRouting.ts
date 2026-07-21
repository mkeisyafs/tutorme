import type {
  ActiveQuizAttempt,
  ChapterQuizMetadata,
  FinalExamMetadata,
  LearnerQuestion,
  QuizAnswer,
} from '../types/assessment';

export const INVALID_QUIZ_ATTEMPT_MESSAGE = 'We could not load this quiz attempt. Please try again shortly.';

export type LoadedQuizAttemptAction =
  | { readonly kind: 'render'; readonly attempt: ActiveQuizAttempt }
  | { readonly kind: 'redirect'; readonly route: string }
  | { readonly kind: 'invalid_payload' };

export type QuizFormState = {
  readonly attempt: ActiveQuizAttempt | null;
  readonly answers: Record<string, QuizAnswer>;
  readonly isBlocked: boolean;
};

export function emptyQuizFormState(): QuizFormState {
  return { attempt: null, answers: {}, isBlocked: false };
}

function invalidPayload(): LoadedQuizAttemptAction {
  return { kind: 'invalid_payload' };
}

type RemoteRecord = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is RemoteRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPassingScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

function parseChapterQuizMetadata(value: unknown): ChapterQuizMetadata | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.title) || value.type !== 'CHAPTER_QUIZ' || !isPassingScore(value.passingScore) || !isNonEmptyString(value.courseId)) {
    return null;
  }
  const lessonId = isNonEmptyString(value.lessonId) ? value.lessonId : null;
  return { id: value.id, title: value.title, type: 'CHAPTER_QUIZ', passingScore: value.passingScore, courseId: value.courseId, lessonId };
}

function parseFinalExamMetadata(value: unknown): FinalExamMetadata | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.title) || value.type !== 'FINAL_EXAM' || !isPassingScore(value.passingScore) || !isNonEmptyString(value.courseId)) {
    return null;
  }
  const lessonId = isNonEmptyString(value.lessonId) ? value.lessonId : null;
  return { id: value.id, title: value.title, type: 'FINAL_EXAM', passingScore: value.passingScore, courseId: value.courseId, lessonId };
}

function parseStringArray(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) return null;
  return value;
}

function parseQuestion(value: unknown): LearnerQuestion | null {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.prompt) || typeof value.requiresImage !== 'boolean') {
    return null;
  }
  const options = parseStringArray(value.options);
  if (!options) return null;

  switch (value.type) {
    case 'MULTIPLE_CHOICE':
      return options.length >= 2
        ? { id: value.id, type: 'MULTIPLE_CHOICE', prompt: value.prompt, options, requiresImage: value.requiresImage }
        : null;
    case 'ESSAY':
      return { id: value.id, type: 'ESSAY', prompt: value.prompt, options, requiresImage: value.requiresImage };
    default:
      return null;
  }
}

function parseQuestions(value: unknown): readonly LearnerQuestion[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const questions = value.map(parseQuestion);
  return questions.every((question): question is LearnerQuestion => question !== null) ? questions : null;
}

export function resolveLoadedQuizAttempt(payload: unknown): LoadedQuizAttemptAction {
  if (!isRecord(payload)) return invalidPayload();

  if (!('attemptState' in payload)) {
    const quiz = parseFinalExamMetadata(payload.quiz);
    const questions = parseQuestions(payload.questions);
    return quiz && questions ? { kind: 'render', attempt: { quiz, questions } } : invalidPayload();
  }

  switch (payload.attemptState) {
    case 'open': {
      const quiz = parseChapterQuizMetadata(payload.quiz);
      const questions = parseQuestions(payload.questions);
      return quiz && questions ? { kind: 'render', attempt: { attemptState: 'open', quiz, questions } } : invalidPayload();
    }
    case 'completed': {
      const quiz = parseChapterQuizMetadata(payload.quiz);
      const submissionId = isNonEmptyString(payload.submissionId) ? payload.submissionId.trim() : '';
      return quiz && submissionId ? { kind: 'redirect', route: '/submissions/' + encodeURIComponent(submissionId) } : invalidPayload();
    }
    default:
      return invalidPayload();
  }
}
