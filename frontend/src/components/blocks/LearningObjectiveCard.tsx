import React from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Target } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { ObjectiveBlock } from './types';

export const LearningObjectiveCard: React.FC<ObjectiveBlock> = ({ title, content }) => {
  const { t, i18n } = useTranslation();

  const isGenericTitle = !title || /^(Learning Objectives?|Key Goal|Objective|Tujuan Pembelajaran)$/i.test(title.trim());
  const displayTitle = isGenericTitle ? t('blocks.objective.defaultTitle') : title;

  let displayContent = content;
  if (i18n.language === 'id' && content.includes('Master the key concepts and practical applications of')) {
    displayContent = content.replace(
      /Master the key concepts and practical applications of (.*)\./i,
      'Kuasai konsep kunci dan penerapan praktis dari $1.'
    );
  }

  return (
    <div className="p-6 sm:p-7 rounded-3xl border-4 border-blue-400 dark:border-blue-700 bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-blue-100/50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-900/20 shadow-[6px_6px_0px_0px_#3b82f6] dark:shadow-[6px_6px_0px_0px_rgba(29,78,216,0.6)] transform transition-transform duration-200 hover:-translate-y-1 relative overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-4 border-b border-blue-200 dark:border-blue-800/60 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-[2px_2px_0px_0px_#1e40af] flex items-center justify-center">
            <Award className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block font-sans">
              {t('blocks.objective.badge')}
            </span>
            <h3 className="text-xl sm:text-2xl font-['Kalam',cursive] font-bold text-blue-950 dark:text-blue-100 leading-tight">
              {displayTitle}
            </h3>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-blue-200/70 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-xs font-bold rounded-full border border-blue-300 dark:border-blue-700">
          <Target className="w-3.5 h-3.5" /> {t('blocks.objective.pill')}
        </div>
      </div>
      <div className="text-gray-800 dark:text-gray-200 font-semibold leading-relaxed pl-1">
        <MarkdownRenderer content={displayContent} />
      </div>
    </div>
  );
};
