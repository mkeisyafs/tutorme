import { CheckCircle2, CircleAlert, FileText, XCircle } from 'lucide-react';
import type { LessonQuizReview, MultipleChoiceQuestionReview, QuizAnswer } from '../types/assessment';

type AssessmentReviewProps = {
  readonly review: LessonQuizReview | undefined;
  readonly userAnswers: Readonly<Record<string, QuizAnswer>> | undefined;
};

type QuestionEntry = readonly [string, LessonQuizReview['questions'][string]];

const answerText = (answer: QuizAnswer | undefined): string => {
  if (typeof answer === 'string') return answer === '' ? 'No response provided' : answer;
  if (typeof answer === 'number' || typeof answer === 'boolean') return String(answer);
  return 'No response provided';
};

const optionClassName = (option: MultipleChoiceQuestionReview['options'][number]): string => {
  if (option.isSelected && option.isCorrect) {
    return 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-950/30';
  }
  if (option.isSelected) {
    return 'border-red-300 bg-red-50/60 dark:border-red-700 dark:bg-red-950/20';
  }
  if (option.isCorrect) {
    return 'border-green-300 bg-green-50/60 dark:border-green-700 dark:bg-green-950/20';
  }
  return 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/40';
};

const OptionBadge = ({ option }: { readonly option: MultipleChoiceQuestionReview['options'][number] }) => {
  if (option.isSelected && option.isCorrect) {
    return <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"><CheckCircle2 className="h-3 w-3" /> Correct</span>;
  }
  if (option.isSelected) {
    return <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"><XCircle className="h-3 w-3" /> Your answer</span>;
  }
  if (option.isCorrect) {
    return <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"><CheckCircle2 className="h-3 w-3" /> Correct</span>;
  }
  return null;
};

const MultipleChoiceReviewCard = ({ review, index }: { readonly questionId: string; readonly review: MultipleChoiceQuestionReview; readonly index: number }) => (
  <article className="rounded-xl sm:rounded-2xl border-2 border-gray-200 bg-white p-3.5 sm:p-5 dark:border-gray-700 dark:bg-gray-800">
    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Question {index + 1} · Multiple choice</p>
      {review.isCorrect
        ? <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300"><CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Correct</span>
        : <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300"><XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Incorrect</span>
      }
    </div>
    <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-2.5">
      {review.options.map((option) => (
        <div key={String(option.index)} className={'rounded-lg sm:rounded-xl border-2 p-2.5 sm:p-3.5 transition-colors ' + optionClassName(option)}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs sm:text-base font-bold text-gray-900 dark:text-gray-100">{option.text}</p>
            <OptionBadge option={option} />
          </div>
          {option.explanation && (option.isSelected || option.isCorrect) && (
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300">{option.explanation}</p>
          )}
        </div>
      ))}
    </div>
  </article>
);

const EssayReviewCard = ({ review, learnerAnswer, index }: { readonly questionId: string; readonly review: QuestionEntry[1] & { readonly type: 'ESSAY' }; readonly learnerAnswer: QuizAnswer | undefined; readonly index: number }) => (
  <article className="rounded-xl sm:rounded-2xl border-2 border-gray-200 bg-white p-3.5 sm:p-5 dark:border-gray-700 dark:bg-gray-800">
    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Question {index + 1} · Essay</p>
      <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"><FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {review.score}%</span>
    </div>
    <div className="mt-3 sm:mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4 dark:border-gray-700 dark:bg-gray-900/40">
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Your response</p>
      <p className="mt-1.5 sm:mt-2 whitespace-pre-wrap text-xs sm:text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-200">{answerText(learnerAnswer)}</p>
    </div>
    <div className="mt-2.5 sm:mt-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3 sm:p-4 dark:border-blue-800 dark:bg-blue-950/20">
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">AI feedback</p>
      <p className="mt-1.5 sm:mt-2 whitespace-pre-wrap text-xs sm:text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-200">{review.rationale}</p>
    </div>
    {(review.strengths.length > 0 || review.improvements.length > 0) && (
      <div className="mt-2.5 sm:mt-3 grid gap-2.5 sm:gap-3 md:grid-cols-2">
        {review.strengths.length > 0 && (
          <div className="rounded-xl border border-green-200 bg-green-50/60 p-3 sm:p-4 dark:border-green-800 dark:bg-green-950/20">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Strengths</p>
            <ul className="mt-1.5 sm:mt-2 list-disc space-y-1 pl-4 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
              {review.strengths.map((s, i) => <li key={String(i)}>{s}</li>)}
            </ul>
          </div>
        )}
        {review.improvements.length > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-3 sm:p-4 dark:border-orange-800 dark:bg-orange-950/20">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Areas to improve</p>
            <ul className="mt-1.5 sm:mt-2 list-disc space-y-1 pl-4 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
              {review.improvements.map((s, i) => <li key={String(i)}>{s}</li>)}
            </ul>
          </div>
        )}
      </div>
    )}
  </article>
);

export const AssessmentReview = ({ review, userAnswers }: AssessmentReviewProps) => {
  if (!review || review.version !== 1 || Object.keys(review.questions).length === 0) {
    return (
      <section className="mt-7 rounded-2xl border-2 border-orange-300 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-950/30" aria-labelledby="review-unavailable-title">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-1 h-6 w-6 flex-shrink-0 text-orange-600 dark:text-orange-300" />
          <div>
            <h2 id="review-unavailable-title" className="font-['Kalam',cursive] text-2xl font-bold text-orange-950 dark:text-orange-100">Review unavailable</h2>
            <p className="mt-1 font-semibold text-orange-900 dark:text-orange-200">Detailed question feedback is not available for this quiz.</p>
          </div>
        </div>
      </section>
    );
  }

  const entries = Object.entries(review.questions);

  return (
    <section className="mt-8 space-y-4" aria-labelledby="answer-review-title">
      <h2 id="answer-review-title" className="font-['Kalam',cursive] text-2xl font-bold text-gray-900 dark:text-white">Question Review</h2>
      {entries.map(([questionId, questionReview], index) => questionReview.type === 'MULTIPLE_CHOICE'
        ? <MultipleChoiceReviewCard key={questionId} questionId={questionId} review={questionReview} index={index} />
        : <EssayReviewCard key={questionId} questionId={questionId} review={questionReview} learnerAnswer={userAnswers?.[questionId]} index={index} />)}
    </section>
  );
};
