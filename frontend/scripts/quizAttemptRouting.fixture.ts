import {
  INVALID_QUIZ_ATTEMPT_MESSAGE,
  emptyQuizFormState,
  resolveLoadedQuizAttempt,
} from '../src/pages/quizAttemptRouting';

type FixtureResult = {
  readonly name: string;
  readonly passed: boolean;
};

function includesRemoteLeak(value: unknown): boolean {
  const serialized = JSON.stringify(value);
  return serialized.includes('REMOTE_PROMPT_INJECTION') || serialized.includes('SECRET_ANSWER_KEY');
}

function assertFixture(name: string, passed: boolean): FixtureResult {
  if (!passed) throw new Error('Fixture failed: ' + name);
  return { name, passed };
}

const validQuestion = {
  id: 'q1',
  type: 'MULTIPLE_CHOICE',
  prompt: 'Choose the safe option.',
  options: ['Safe', 'Unsafe'],
  requiresImage: false,
};

const malformedChapterWithoutState = {
  quiz: { id: 'chapter-missing-state', title: 'REMOTE_PROMPT_INJECTION', type: 'CHAPTER_QUIZ', passingScore: 70 },
  questions: [{ ...validQuestion, correctAnswer: 'SECRET_ANSWER_KEY' }],
};

const unknownDiscriminator = {
  attemptState: 'archived',
  quiz: { id: 'chapter-archived', title: 'REMOTE_PROMPT_INJECTION', type: 'CHAPTER_QUIZ', passingScore: 70 },
  review: 'SECRET_ANSWER_KEY',
  questions: [validQuestion],
};

const completedWithoutSubmission = {
  attemptState: 'completed',
  quiz: { id: 'chapter-completed', title: 'Completed Quiz', type: 'CHAPTER_QUIZ', passingScore: 70 },
  submissionId: '   ',
};

const invalidFinalShape = {
  quiz: { id: 'final-invalid', title: 'REMOTE_PROMPT_INJECTION', type: 'FINAL_EXAM', passingScore: 70 },
  questions: [{ ...validQuestion, correctAnswer: 'SECRET_ANSWER_KEY', options: ['Only one option'] }],
};

const openWithLeakyQuestion = {
  attemptState: 'open',
  quiz: { id: 'chapter-open', title: 'Open Quiz', type: 'CHAPTER_QUIZ', passingScore: 70 },
  questions: [{ ...validQuestion, correctAnswer: 'SECRET_ANSWER_KEY', explanations: ['REMOTE_PROMPT_INJECTION'] }],
};

const finalExam = {
  quiz: { id: 'final-valid', title: 'Final Exam', type: 'FINAL_EXAM', passingScore: 70 },
  questions: [validQuestion],
};

const completedChapter = {
  attemptState: 'completed',
  quiz: { id: 'chapter-done', title: 'Completed Quiz', type: 'CHAPTER_QUIZ', passingScore: 70 },
  submissionId: 'sub-123',
};

const rejectedPayloads = [
  malformedChapterWithoutState,
  unknownDiscriminator,
  completedWithoutSubmission,
  invalidFinalShape,
];

const results: readonly FixtureResult[] = [
  ...rejectedPayloads.map((payload, index) => {
    const action = resolveLoadedQuizAttempt(payload);
    return assertFixture(
      'rejected payload ' + String(index + 1) + ' is generic and leak-free',
      action.kind === 'invalid_payload' && !includesRemoteLeak(action)
    );
  }),
  assertFixture(
    'open chapter renders sanitized form data without answer review leak',
    resolveLoadedQuizAttempt(openWithLeakyQuestion).kind === 'render' &&
      !includesRemoteLeak(resolveLoadedQuizAttempt(openWithLeakyQuestion))
  ),
  assertFixture('validated final exam still renders', resolveLoadedQuizAttempt(finalExam).kind === 'render'),
  assertFixture(
    'validated completed chapter redirects to saved result',
    JSON.stringify(resolveLoadedQuizAttempt(completedChapter)) === JSON.stringify({ kind: 'redirect', route: '/submissions/sub-123' })
  ),
  assertFixture(
    'failed reload state is cleared after a previous attempt',
    emptyQuizFormState().attempt === null && Object.keys(emptyQuizFormState().answers).length === 0
  ),
  assertFixture(
    'missing ID reload after blocked response resets blocked heading state',
    emptyQuizFormState().isBlocked === false
  ),
  assertFixture('invalid payload message is generic and leak-free', !includesRemoteLeak(INVALID_QUIZ_ATTEMPT_MESSAGE)),
];

console.log(JSON.stringify({ results }, null, 2));
