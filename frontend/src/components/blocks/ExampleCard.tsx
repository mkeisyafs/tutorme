import React from 'react';
import { BookOpen } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { ExampleBlock } from './types';

export const ExampleCard: React.FC<ExampleBlock> = ({ title, content }) => {
  return (
    <div className="p-6 sm:p-8 rounded-3xl border-4 border-yellow-400 dark:border-yellow-700 bg-gradient-to-br from-yellow-50/90 via-amber-50/50 to-orange-50/30 dark:from-amber-950/30 dark:to-yellow-950/20 shadow-[6px_6px_0px_0px_#eab308] dark:shadow-[6px_6px_0px_0px_rgba(161,98,7,0.6)]">
      <div className="flex items-center gap-3 mb-4 border-b-2 border-yellow-200 dark:border-yellow-800/80 pb-3">
        <div className="p-2.5 bg-amber-500 rounded-2xl text-white shadow-[2px_2px_0px_0px_#b45309]">
          <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest block font-sans">
            Real-World Application
          </span>
          <h4 className="text-xl sm:text-2xl font-['Kalam',cursive] font-bold text-amber-950 dark:text-amber-100 leading-tight">
            {title || 'Example / Case Study'}
          </h4>
        </div>
      </div>
      <div className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
};
