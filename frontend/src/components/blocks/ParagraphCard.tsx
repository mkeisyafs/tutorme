import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { ParagraphBlock } from './types';

export const ParagraphCard: React.FC<ParagraphBlock> = ({ content }) => {
  return (
    <div className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed text-[16px] sm:text-[17px]">
      <MarkdownRenderer content={content} />
    </div>
  );
};
