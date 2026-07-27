import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCw, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { FlashcardBlock } from './types';

export interface FlashcardComponentProps {
  cards?: FlashcardBlock[];
  front?: string;
  back?: string;
}

export const FlashcardComponent: React.FC<FlashcardComponentProps> = (props) => {
  const { t, i18n } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const cardList: FlashcardBlock[] =
    props.cards && props.cards.length > 0
      ? props.cards
      : props.front && props.back
      ? [{ type: 'flashcard', front: props.front, back: props.back }]
      : [];

  if (cardList.length === 0) return null;

  const currentCard = cardList[currentIndex] || cardList[0];
  const totalCards = cardList.length;

  let displayFront = currentCard.front;
  if (i18n.language === 'id' && displayFront.includes('What is the core takeaway of ')) {
    displayFront = displayFront.replace(/What is the core takeaway of (.*)\?/i, 'Apa poin utama dari $1?');
  }

  let displayBack = currentCard.back;
  if (i18n.language === 'id' && displayBack.includes('Review the key explanation and connect it to the practical examples')) {
    displayBack = 'Tinjau penjelasan kunci dan hubungkan dengan contoh praktis dalam pelajaran ini.';
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < totalCards - 1) {
      setFlipped(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setFlipped(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlipped(false);
    setCurrentIndex(index);
  };

  return (
    <div className="flex flex-col items-center my-6 w-full">
      {/* Header Badge */}
      <div className="flex items-center gap-2 mb-3">
        {totalCards > 1 ? (
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-100 dark:bg-indigo-950/70 px-4 py-1.5 rounded-full border border-indigo-300 dark:border-indigo-800 shadow-sm">
            <Layers className="w-3.5 h-3.5" />
            <span>{t('blocks.flashcard.deckBadge')}</span>
            <span className="opacity-40">•</span>
            <span className="font-mono text-indigo-700 dark:text-indigo-300">
              {t('blocks.flashcard.cardCounter', { current: currentIndex + 1, total: totalCards })}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            <RotateCw className="w-3.5 h-3.5 animate-pulse" /> {t('blocks.flashcard.flipNotice')}
          </div>
        )}
      </div>

      {/* Main Interactive Flip Card Container */}
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

      {/* Deck Controls (If deck has more than 1 card) */}
      {totalCards > 1 && (
        <div className="flex items-center justify-between w-full max-w-lg mt-4 px-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-200 dark:hover:bg-indigo-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('blocks.flashcard.prevCard')}</span>
          </button>

          {/* Pagination Dots */}
          <div className="flex items-center gap-1.5">
            {cardList.map((_, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                onClick={(e) => handleDotClick(i, e)}
                aria-label={`Go to card ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  i === currentIndex
                    ? 'w-6 bg-indigo-600 dark:bg-indigo-400'
                    : 'w-2.5 bg-indigo-200 dark:bg-indigo-800 hover:bg-indigo-300 dark:hover:bg-indigo-700'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === totalCards - 1}
            className="flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-200 dark:hover:bg-indigo-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <span>{t('blocks.flashcard.nextCard')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
