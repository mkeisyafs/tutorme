import { CheckCircle2, CircleAlert, FileText, MessageCircle, XCircle } from 'lucide-react';
import type { LessonQuizReview, MultipleChoiceQuestionReview, QuizAnswer } from '../types/assessment';

type AssessmentReviewProps = {
  readonly review: LessonQuizReview | undefined;
  readonly userAnswers: Readonly<Record<string, QuizAnswer>> | undefined;
};

type QuestionEntry = readonly [string, LessonQuizReview['questions'][string]];

const answerText = (answer: QuizAnswer | undefined): string => {
  if (typeof answer === 'string') return answer === '' ? 'Blank response' : answer;
  if (typeof answer === 'number' || typeof answer === 'boolean') return String(answer);
  return 'Saved learner response unavailable.';
};

const optionClassName = (option: MultipleChoiceQuestionReview['options'][number]): string => {
  if (option.isSelected && option.isCorrect) {
    return 'border-green-500 bg-green-50 text-green-950 dark:border-green-500 dark:bg-green-950/30 dark:text-green-100';
  }
  if (option.isSelected) {
    return 'border-orange-400 bg-orange-50 text-orange-950 dark:border-orange-600 dark:bg-orange-950/30 dark:text-orange-100';
  }
  if (option.isCorrect) {
    return 'border-blue-400 bg-blue-50 text-blue-950 dark:border-blue-600 dark:bg-blue-950/30 dark:text-blue-100';
  }
  return 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200';
};

const OptionStatus = ({ option }: { readonly option: MultipleChoiceQuestionReview['options'][number] }) => {
  if (option.isSelected && option.isCorrect) {
    return <span className="rounded-full border border-green-300 bg-green-100 px-2 py-0.5 text-xs font-black uppercase tracking-wide text-green-800 dark:border-green-700 dark:bg-green-900/40 dark:text-green-200">Your choice and correct</span>;
  }
  if (option.isSelected) {
    return <span className="rounded-full border border-orange-300 bg-orange-100 px-2 py-0.5 text-xs font-black uppercase tracking-wide text-orange-800 dark:border-orange-700 dark:bg-orange-900/40 dark:text-orange-200">Your choice</span>;
  }
  if (option.isCorrect) {
    return <span className="rounded-full border border-blue-300 bg-blue-100 px-2 py-0.5 text-xs font-black uppercase tracking-wide text-blue-800 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-200">Correct answer</span>;
  }
  return <span className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs font-black uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">Review option</span>;
};

const MultipleChoiceReviewCard = ({ questionId, review, index }: { readonly questionId: string; readonly review: MultipleChoiceQuestionReview; readonly index: number }) => {
  const selectedOption = review.options.find((option) => option.index === review.selectedAnswer);
  const correctOption = review.options.find((option) => option.index === review.correctAnswer);

  return (
    <article className="rounded-3xl border-4 border-purple-200 bg-white p-6 shadow-[6px_6px_0_#ddd6fe] dark:border-purple-800 dark:bg-gray-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Question {index + 1} · Multiple choice</p>
          <h3 className="mt-1 font-['Kalam',cursive] text-2xl font-bold text-gray-900 dark:text-white">Saved answer review</h3>
          <p className="mt-1 text-sm font-bold text-gray-500 dark:text-gray-400">Review ID: {questionId}</p>
        </div>
        <span className={'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-black uppercase tracking-wide ' + (review.isCorrect ? 'border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/40 dark:text-green-200' : 'border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-700 dark:bg-orange-900/40 dark:text-orange-200')}>
          {review.isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {review.isCorrect ? 'Correct' : 'Needs review'} · {review.score}%
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <p className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-3 font-bold text-purple-900 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-100">Learner choice: {selectedOption ? selectedOption.text : 'No answer selected'}</p>
        <p className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-3 font-bold text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100">Correct answer: {correctOption ? correctOption.text : 'Not available'}</p>
      </div>
      <div className="mt-5 space-y-3" aria-label={'Option explanations for question ' + String(index + 1)}>
        {review.options.map((option) => (
          <section key={questionId + '-' + String(option.index)} className={'rounded-2xl border-2 p-4 ' + optionClassName(option)}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <p className="font-black">Option {option.index + 1}: {option.text}</p>
              <OptionStatus option={option} />
            </div>
            <p className="mt-3 whitespace-pre-wrap font-semibold leading-relaxed">{option.explanation}</p>
          </section>
        ))}
      </div>
    </article>
  );
};

const EssayReviewCard = ({ questionId, review, learnerAnswer, index }: { readonly questionId: string; readonly review: QuestionEntry[1] & { readonly type: 'ESSAY' }; readonly learnerAnswer: QuizAnswer | undefined; readonly index: number }) => (
  <article className="rounded-3xl border-4 border-pink-200 bg-white p-6 shadow-[6px_6px_0_#fbcfe8] dark:border-pink-800 dark:bg-gray-800">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="font-bold uppercase tracking-wider text-pink-700 dark:text-pink-300">Question {index + 1} · Essay</p>
        <h3 className="mt-1 font-['Kalam',cursive] text-2xl font-bold text-gray-900 dark:text-white">AI writing review</h3>
        <p className="mt-1 text-sm font-bold text-gray-500 dark:text-gray-400">Review ID: {questionId}</p>
      </div>
      <span className="inline-flex items-center gap-2 rounded-full border border-pink-300 bg-pink-100 px-3 py-1 text-sm font-black uppercase tracking-wide text-pink-800 dark:border-pink-700 dark:bg-pink-900/40 dark:text-pink-200"><FileText className="h-4 w-4" /> AI score · {review.score}%</span>
    </div>
    <section className="mt-5 rounded-2xl border-2 border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
      <h4 className="font-['Kalam',cursive] text-xl font-bold text-gray-900 dark:text-white">Learner response</h4>
      <p className="mt-2 whitespace-pre-wrap font-semibold leading-relaxed text-gray-700 dark:text-gray-200">{answerText(learnerAnswer)}</p>
    </section>
    <section className="mt-4 rounded-2xl border-2 border-pink-200 bg-pink-50 p-4 dark:border-pink-800 dark:bg-pink-950/30">
      <h4 className="font-['Kalam',cursive] text-xl font-bold text-pink-950 dark:text-pink-100">AI rationale</h4>
      <p className="mt-2 whitespace-pre-wrap font-semibold leading-relaxed text-pink-900 dark:text-pink-200">{review.rationale}</p>
    </section>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <section className="rounded-2xl border-2 border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
        <h4 className="font-['Kalam',cursive] text-xl font-bold text-green-950 dark:text-green-100">Strengths</h4>
        <ul className="mt-2 list-disc space-y-2 pl-5 font-semibold text-green-900 dark:text-green-200">
          {review.strengths.map((strength, strengthIndex) => <li key={questionId + '-strength-' + String(strengthIndex)}>{strength}</li>)}
        </ul>
      </section>
      <section className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/30">
        <h4 className="font-['Kalam',cursive] text-xl font-bold text-orange-950 dark:text-orange-100">Improvements</h4>
        <ul className="mt-2 list-disc space-y-2 pl-5 font-semibold text-orange-900 dark:text-orange-200">
          {review.improvements.map((improvement, improvementIndex) => <li key={questionId + '-improvement-' + String(improvementIndex)}>{improvement}</li>)}
        </ul>
      </section>
    </div>
  </article>
);

export const AssessmentReview = ({ review, userAnswers }: AssessmentReviewProps) => {
  if (!review || review.version !== 1 || Object.keys(review.questions).length === 0) {
    return (
      <section className="mt-7 rounded-2xl border-2 border-orange-300 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-950/30" aria-labelledby="review-unavailable-title">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-1 h-6 w-6 flex-shrink-0 text-orange-600 dark:text-orange-300" />
          <div>
            <h2 id="review-unavailable-title" className="font-['Kalam',cursive] text-2xl font-bold text-orange-950 dark:text-orange-100">Saved answer review unavailable</h2>
            <p className="mt-1 font-semibold text-orange-900 dark:text-orange-200">The server returned the aggregate result, but the saved explanation payload was not available for this chapter quiz.</p>
          </div>
        </div>
      </section>
    );
  }

  const entries = Object.entries(review.questions);

  return (
    <section className="mt-8" aria-labelledby="answer-review-title">
      <div className="rounded-3xl border-4 border-blue-200 bg-blue-50 p-6 shadow-[6px_6px_0_#bfdbfe] dark:border-blue-800 dark:bg-blue-950/30">
        <p className="font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Complete saved review</p>
        <h2 id="answer-review-title" className="mt-1 flex items-center gap-2 font-['Kalam',cursive] text-3xl font-bold text-blue-950 dark:text-blue-100"><MessageCircle className="h-7 w-7" /> Every answer explained</h2>
        <p className="mt-2 font-semibold text-blue-900 dark:text-blue-200">TutorMe keeps server-authored feedback as plain text and labels selected answers with text, not color alone.</p>
      </div>
      <div className="mt-6 space-y-6">
        {entries.map(([questionId, questionReview], index) => questionReview.type === 'MULTIPLE_CHOICE'
          ? <MultipleChoiceReviewCard key={questionId} questionId={questionId} review={questionReview} index={index} />
          : <EssayReviewCard key={questionId} questionId={questionId} review={questionReview} learnerAnswer={userAnswers?.[questionId]} index={index} />)}
      </div>
    </section>
  );
};
