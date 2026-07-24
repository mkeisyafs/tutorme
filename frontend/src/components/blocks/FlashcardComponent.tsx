import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCw } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { FlashcardBlock } from './types';

export const FlashcardComponent: React.FC<FlashcardBlock> = ({ front, back }) => {
  const { t, i18n } = useTranslation();
  const [flipped, setFlipped] = useState(false);

  let displayFront = front;
  if (i18n.language === 'id' && front.includes('What is the core takeaway of ')) {
    displayFront = front.replace(/What is the core takeaway of (.*)\?/i, 'Apa poin utama dari $1?');
  }

  let displayBack = back;
  if (i18n.language === 'id' && back.includes('Review the key explanation and connect it to the practical examples')) {
    displayBack = 'Tinjau penjelasan kunci dan hubungkan dengan contoh praktis dalam pelajaran ini.';
  }

  return (
    <div className="flex flex-col items-center my-6">
      <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
        <RotateCw className="w-3.5 h-3.5 animate-pulse" /> {t('blocks.flashcard.flipNotice')}
      </div>

      <div
        className="w-full max-w-lg cursor-pointer grid select-none"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="relative w-full h-full text-center transition-transform duration-500 transform-gpu grid [grid-template-columns:1fr] [grid-template-rows:1fr]"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Card Front */}
          <div
            className="[grid-area:1/1] flex flex-col justify-between items-center p-7 sm:p-9 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-3xl border-4 border-indigo-800 text-white shadow-[8px_8px_0px_0px_#3730a3] dark:shadow-[8px_8px_0px_0px_rgba(55,48,163,0.7)] min-h-[15rem] relative overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="w-full flex justify-between items-center">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider font-mono">
                {t('blocks.flashcard.side1Badge')}
              </span>
              <span className="text-xs opacity-80 font-['Kalam',cursive]">{t('blocks.flashcard.side1Label')}</span>
            </div>
            <div className="my-auto text-xl sm:text-2xl font-bold font-['Kalam',cursive] px-4 leading-relaxed py-4">
              <MarkdownRenderer content={displayFront} />
            </div>
            <div className="text-xs opacity-75 font-medium flex items-center gap-1">
              <RotateCw className="w-3 h-3" /> {t('blocks.flashcard.tapToReveal')}
            </div>
          </div>

          {/* Card Back */}
          <div
            className="[grid-area:1/1] flex flex-col justify-between items-center p-7 sm:p-9 bg-white dark:bg-gray-800 rounded-3xl border-4 border-indigo-600 dark:border-indigo-700 text-gray-800 dark:text-gray-100 shadow-[8px_8px_0px_0px_#4f46e5] dark:shadow-[8px_8px_0px_0px_rgba(79,70,229,0.5)] min-h-[15rem] relative overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="w-full flex justify-between items-center">
              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider font-mono">
                {t('blocks.flashcard.side2Badge')}
              </span>
              <span className="text-xs text-gray-400 font-['Kalam',cursive]">{t('blocks.flashcard.side2Label')}</span>
            </div>
            <div className="my-auto text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 px-4 leading-relaxed py-4">
              <MarkdownRenderer content={displayBack} />
            </div>
            <div className="text-xs text-indigo-500 font-medium flex items-center gap-1">
              <RotateCw className="w-3 h-3" /> {t('blocks.flashcard.tapToFlipBack')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
