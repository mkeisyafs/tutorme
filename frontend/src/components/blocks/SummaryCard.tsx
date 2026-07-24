import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { SummaryBlock } from './types';

export const SummaryCard: React.FC<SummaryBlock> = ({ content }) => {
  const { t, i18n } = useTranslation();

  let displayContent = content;
  if (i18n.language === 'id' && content.includes('Review the key idea, connect it to the examples')) {
    displayContent = 'Tinjau ide kunci, hubungkan dengan contoh, dan praktikkan dalam pembelajaran Anda sendiri.';
  }

  return (
    <div className="p-6 sm:p-7 rounded-3xl border-4 border-emerald-400 dark:border-emerald-700 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-green-50/30 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-green-950/20 shadow-[6px_6px_0px_0px_#10b981] dark:shadow-[6px_6px_0px_0px_rgba(4,120,87,0.6)]">
      <div className="flex items-center gap-3 mb-4 border-b border-emerald-200 dark:border-emerald-800/80 pb-3">
        <div className="p-2.5 bg-emerald-600 rounded-2xl text-white shadow-[2px_2px_0px_0px_#047857]">
          <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest block font-sans">
            {t('blocks.summary.badge')}
          </span>
          <h4 className="text-xl sm:text-2xl font-['Kalam',cursive] font-bold text-emerald-950 dark:text-emerald-100 leading-tight">
            {t('blocks.summary.title')}
          </h4>
        </div>
      </div>
      <div className="text-gray-800 dark:text-gray-200 font-semibold leading-relaxed pl-1">
        <MarkdownRenderer content={displayContent} />
      </div>
    </div>
  );
};
