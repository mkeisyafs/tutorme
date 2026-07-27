import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { InteractiveRevealBlock } from './types';

export const InteractiveRevealComponent: React.FC<InteractiveRevealBlock> = ({ summary, details }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  let displaySummary = summary;
  if (i18n.language === 'id' && summary === 'Key Concept Deep-Dive') {
    displaySummary = 'Pendalaman Konsep Kunci';
  }

  let displayDetails = details;
  if (i18n.language === 'id' && details.includes('Read the explanation, test your understanding with the quiz')) {
    displayDetails = 'Baca penjelasannya, uji pemahaman Anda dengan kuis, dan terapkan konsep ini dalam praktik.';
  }

  return (
    <div className="border-4 border-sky-400 dark:border-sky-700 rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-[6px_6px_0px_0px_#0284c7] dark:shadow-[6px_6px_0px_0px_rgba(3,105,161,0.6)] transform transition-transform duration-200 hover:-translate-y-0.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-5 sm:p-6 text-left font-bold text-gray-900 dark:text-gray-100 hover:bg-sky-50/50 dark:hover:bg-gray-750 transition-colors gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500 rounded-xl text-white shadow-[2px_2px_0px_0px_#0369a1]">
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
          <span className="text-base sm:text-lg font-['Kalam',cursive] leading-snug">{displaySummary}</span>
        </div>
        <span className="text-xs font-bold text-sky-600 dark:text-sky-400 px-3 py-1 bg-sky-100 dark:bg-sky-950/80 rounded-full shrink-0 border border-sky-200 dark:border-sky-800">
          {isOpen ? t('blocks.interactiveReveal.hideDetails') : t('blocks.interactiveReveal.tapToReveal')}
        </span>
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen
            ? 'max-h-[5000px] opacity-100 border-t-3 border-dashed border-sky-200 dark:border-gray-700'
            : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 text-gray-800 dark:text-gray-200 font-medium leading-relaxed bg-sky-50/30 dark:bg-gray-900/40">
          <MarkdownRenderer content={displayDetails} />
        </div>
      </div>
    </div>
  );
};
