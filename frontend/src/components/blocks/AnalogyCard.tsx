import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbulb } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { AnalogyBlock } from './types';

export const AnalogyCard: React.FC<AnalogyBlock> = ({ title, content }) => {
  const { t, i18n } = useTranslation();

  const isGenericTitle = !title || /^(A helpful analogy|Analogy to Help You Think|Analogy|Analogi Pembantu|Analogi)$/i.test(title.trim());
  const displayTitle = isGenericTitle ? t('blocks.analogy.defaultTitle') : title;

  let displayContent = content;
  if (i18n.language === 'id' && content.includes('Think of ') && content.includes('like learning a route')) {
    displayContent = content.replace(
      /Think of (.*) like learning a route: the explanation gives you the map, and practice helps you remember each turn\./i,
      'Bayangkan $1 seperti mempelajari sebuah rute: penjelasan memberi Anda peta, dan latihan membantu Anda mengingat setiap belokan.'
    );
  }

  return (
    <div className="p-6 sm:p-7 rounded-3xl border-4 border-amber-400 dark:border-amber-700 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-100/40 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-900/20 shadow-[6px_6px_0px_0px_#f59e0b] dark:shadow-[6px_6px_0px_0px_rgba(180,83,9,0.6)] transform transition-transform duration-200 hover:-translate-y-1 relative">
      <div className="flex items-center gap-3 mb-4 border-b border-amber-200 dark:border-amber-800/60 pb-3">
        <div className="p-2.5 bg-amber-500 rounded-2xl text-white shadow-[2px_2px_0px_0px_#b45309] flex items-center justify-center">
          <Lightbulb className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest block font-sans">
            {t('blocks.analogy.badge')}
          </span>
          <h4 className="text-xl sm:text-2xl font-['Kalam',cursive] font-bold text-amber-950 dark:text-amber-100 leading-tight">
            {displayTitle}
          </h4>
        </div>
      </div>
      <div className="text-gray-800 dark:text-gray-200 font-semibold leading-relaxed pl-1 italic border-l-4 border-amber-400 dark:border-amber-600 pl-4 py-1">
        <MarkdownRenderer content={displayContent.startsWith('"') ? displayContent : `"${displayContent}"`} />
      </div>
    </div>
  );
};
