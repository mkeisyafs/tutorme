import React from 'react';
import { CircleAlert } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { WarningBlock } from './types';

export const WarningCard: React.FC<WarningBlock> = ({ title, items }) => {
  return (
    <div className="p-6 sm:p-7 rounded-3xl border-4 border-rose-400 dark:border-rose-800 bg-gradient-to-br from-rose-50/90 via-red-50/50 to-pink-50/30 dark:from-rose-950/40 dark:via-red-950/30 dark:to-pink-950/20 shadow-[6px_6px_0px_0px_#f43f5e] dark:shadow-[6px_6px_0px_0px_rgba(159,18,57,0.6)] transform transition-transform duration-200 hover:-translate-y-1">
      <div className="flex items-center gap-3 mb-4 border-b border-rose-200 dark:border-rose-800/80 pb-3">
        <div className="p-2.5 bg-rose-600 rounded-2xl text-white shadow-[2px_2px_0px_0px_#9f1239]">
          <CircleAlert className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest block font-sans">
            Watch Out
          </span>
          <h4 className="text-xl sm:text-2xl font-['Kalam',cursive] font-bold text-rose-950 dark:text-rose-100 leading-tight">
            {title || 'Common Pitfalls'}
          </h4>
        </div>
      </div>
      <ul className="space-y-3 pl-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 text-rose-950 dark:text-rose-200 font-semibold leading-relaxed">
            <span className="mt-1 flex-shrink-0 p-1 bg-rose-200 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-bold font-mono">
              {idx + 1}
            </span>
            <div className="flex-1">
              <MarkdownRenderer content={item} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
