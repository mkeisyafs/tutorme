import React, { useState } from 'react';
import { HelpCircle, Check, X, Sparkles } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { InteractiveQuizBlock } from './types';

export const InteractiveQuizCard: React.FC<InteractiveQuizBlock> = ({
  question,
  options,
  correctIndex,
  explanation,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  return (
    <div className="p-6 sm:p-8 rounded-3xl border-4 border-purple-400 dark:border-purple-700 bg-white dark:bg-gray-800/90 shadow-[6px_6px_0px_0px_#a855f7] dark:shadow-[6px_6px_0px_0px_rgba(126,34,206,0.6)] relative overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-5 border-b border-purple-100 dark:border-purple-900/60 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600 rounded-2xl text-white shadow-[2px_2px_0px_0px_#6b21a8]">
            <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest block font-sans">
              Test Your Knowledge
            </span>
            <span className="font-['Kalam',cursive] font-bold text-purple-950 dark:text-purple-100 text-xl sm:text-2xl leading-tight block">
              Quick Concept Check
            </span>
          </div>
        </div>
        {selectedIdx !== null && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold font-['Kalam',cursive] border-2 ${
              selectedIdx === correctIndex
                ? 'bg-green-100 text-green-800 border-green-400 dark:bg-green-950 dark:text-green-200 dark:border-green-700'
                : 'bg-red-100 text-red-800 border-red-400 dark:bg-red-950 dark:text-red-200 dark:border-red-700'
            }`}
          >
            {selectedIdx === correctIndex ? '✓ Correct!' : '✗ Try again'}
          </span>
        )}
      </div>

      <h4 className="text-[17px] sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 leading-relaxed">
        {question}
      </h4>

      <div className="flex flex-col gap-3.5">
        {options.map((option, idx) => {
          const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
          const letter = optionLetters[idx] || String(idx + 1);
          const isSelected = selectedIdx === idx;
          const isAnswered = selectedIdx !== null;
          const isCorrect = idx === correctIndex;

          let btnClass =
            'w-full text-left p-4 rounded-2xl border-3 transition-all flex items-center justify-between gap-4 font-semibold text-sm sm:text-base ';
          let letterBg = 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

          if (isAnswered) {
            if (isCorrect) {
              btnClass +=
                'border-green-500 bg-green-50/80 dark:bg-green-950/30 text-green-950 dark:text-green-100 shadow-[3px_3px_0px_0px_#22c55e] dark:shadow-[3px_3px_0px_0px_rgba(34,197,94,0.6)] font-bold';
              letterBg = 'bg-green-500 text-white';
            } else if (isSelected) {
              btnClass +=
                'border-red-500 bg-red-50/80 dark:bg-red-950/30 text-red-950 dark:text-red-100 shadow-[3px_3px_0px_0px_#ef4444] dark:shadow-[3px_3px_0px_0px_rgba(239,68,68,0.6)] font-bold';
              letterBg = 'bg-red-500 text-white';
            } else {
              btnClass +=
                'border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 text-gray-400 dark:text-gray-500 opacity-60 cursor-not-allowed';
            }
          } else {
            btnClass +=
              'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-gray-800 dark:text-gray-200 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#c084fc] dark:hover:shadow-[3px_3px_0px_0px_rgba(192,132,252,0.4)]';
          }

          return (
            <button
              key={idx}
              onClick={() => !isAnswered && setSelectedIdx(idx)}
              disabled={isAnswered}
              className={btnClass}
            >
              <div className="flex items-center gap-3.5 flex-1">
                <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-bold font-mono flex items-center justify-center shrink-0 text-sm ${letterBg}`}>
                  {letter}
                </span>
                <span>{option}</span>
              </div>
              {isAnswered && isCorrect && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold text-xs sm:text-sm shrink-0">
                  <Check className="w-5 h-5" /> Correct
                </span>
              )}
              {isAnswered && isSelected && !isCorrect && (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm shrink-0">
                  <X className="w-5 h-5" /> Incorrect
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedIdx !== null && (
        <div className="mt-6 p-5 rounded-2xl border-3 border-purple-300 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/20 text-gray-800 dark:text-gray-200 font-medium leading-relaxed animate-fadeIn shadow-[3px_3px_0px_0px_#d8b4fe] dark:shadow-[3px_3px_0px_0px_rgba(107,33,168,0.5)]">
          <div className="text-purple-950 dark:text-purple-200 font-['Kalam',cursive] text-lg font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Explanation
          </div>
          <MarkdownRenderer content={explanation} />
        </div>
      )}
    </div>
  );
};
