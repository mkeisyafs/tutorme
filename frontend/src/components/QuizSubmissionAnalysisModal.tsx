import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ClipboardCheck, LoaderCircle, Sparkles, Square } from 'lucide-react';
import type { ActiveQuizAttempt, LearnerQuestion } from '../types/assessment';

type QuizSubmissionAnalysisModalProps = {
  readonly isOpen: boolean;
  readonly attempt: ActiveQuizAttempt | null;
};

function hasQuestionType(questions: readonly LearnerQuestion[], type: LearnerQuestion['type']): boolean {
  return questions.some((question) => question.type === type);
}

function getSubmissionAnalysisStages(attempt: ActiveQuizAttempt | null): readonly string[] {
  const questions = attempt?.questions ?? [];
  return [
    'Saving your answers',
    ...(hasQuestionType(questions, 'MULTIPLE_CHOICE') ? ['Checking multiple-choice responses'] : []),
    ...(hasQuestionType(questions, 'ESSAY') ? ['Reviewing written responses'] : []),
    'Preparing feedback',
  ];
}

export function QuizSubmissionAnalysisModal({ isOpen, attempt }: QuizSubmissionAnalysisModalProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const dialogRef = useRef<HTMLElement | null>(null);
  const stages = useMemo(() => getSubmissionAnalysisStages(attempt), [attempt]);
  const currentStage = stages[Math.min(stageIndex, stages.length - 1)] ?? 'Preparing feedback';
  const title = attempt?.quiz.type === 'FINAL_EXAM' ? 'Analyzing your final exam' : 'Analyzing your lesson quiz';

  useEffect(() => {
    if (!isOpen) {
      setStageIndex(0);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || stageIndex >= stages.length - 1) return;
    const timer = window.setTimeout(() => {
      setStageIndex((currentStageIndex) => Math.min(currentStageIndex + 1, stages.length - 1));
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [isOpen, stageIndex, stages.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 p-4 backdrop-blur-md dark:bg-gray-900/40">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-submission-analysis-title"
        aria-describedby="quiz-submission-analysis-description quiz-submission-analysis-status"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') event.preventDefault();
        }}
        className="relative w-full max-w-xl scale-105 outline-none transition-all duration-300"
      >
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-8 w-24 -translate-x-1/2 -translate-y-4 -rotate-2 rounded-sm border border-purple-200/50 bg-purple-400/40 backdrop-blur-md dark:border-purple-700/50 dark:bg-purple-500/40" />
        <div className="relative overflow-hidden rounded-2xl border-4 border-purple-400 bg-purple-50/90 shadow-[8px_8px_0px_0px_rgba(168,85,247,1)] backdrop-blur-xl dark:border-purple-700 dark:bg-gray-800/90 dark:shadow-[8px_8px_0px_0px_rgba(107,33,168,0.8)]">
          <div className="relative p-8 md:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-purple-300 bg-white shadow-[4px_4px_0_#c084fc] dark:border-purple-700 dark:bg-gray-900 dark:shadow-[4px_4px_0_rgba(88,28,135,0.7)]">
              <ClipboardCheck className="h-9 w-9 text-purple-500" />
            </div>
            <h2 id="quiz-submission-analysis-title" className="mt-5 text-center font-['Kalam',cursive] text-3xl font-bold text-purple-950 dark:text-purple-100">
              {title}
            </h2>
            <p id="quiz-submission-analysis-description" className="mt-2 text-center font-semibold text-purple-800 dark:text-purple-200">
              TutorMe is grading this submission now. Keep this tab open; your answers stay here if it needs another try.
            </p>
            <p id="quiz-submission-analysis-status" role="status" aria-live="polite" className="mt-6 rounded-xl border-2 border-purple-200 bg-white/70 px-4 py-3 text-center font-bold text-purple-800 dark:border-purple-800 dark:bg-gray-900/70 dark:text-purple-200">
              Current step: {currentStage}
            </p>

            <div className="mt-8 space-y-5 font-['Nunito',sans-serif] text-lg font-bold text-purple-950 dark:text-purple-100">
              {stages.map((stage, index) => {
                const isComplete = index < stageIndex;
                const isCurrent = index === stageIndex;
                return (
                  <div key={stage} className={'flex items-center gap-4 transition-all duration-500 ' + (isCurrent ? 'translate-x-2 scale-105 text-purple-600 dark:text-purple-300' : isComplete ? 'opacity-80' : 'opacity-40')}>
                    {isComplete ? <CheckCircle2 className="h-7 w-7 flex-none text-green-500" /> : isCurrent ? <LoaderCircle className="h-7 w-7 flex-none animate-spin text-purple-500" /> : <Square className="h-6 w-6 flex-none text-purple-300 dark:text-purple-700" />}
                    <span>{stage}</span>
                  </div>
                );
              })}
            </div>
            <Sparkles className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 animate-pulse fill-purple-500 text-purple-500 opacity-20" />
          </div>
        </div>
      </section>
    </div>
  );
}
