import React from 'react';
import {
  LearningObjectiveCard,
  ParagraphCard,
  AnalogyCard,
  ExampleCard,
  WarningCard,
  SummaryCard,
  InteractiveQuizCard,
  FlashcardComponent,
  InteractiveRevealComponent,
  CodeSandboxComponent,
  ImageCard,
  MarkdownRenderer,
} from './blocks';
import type { BlockRendererProps, LessonBlock } from './blocks';

export { MarkdownRenderer };

type RenderGroup =
  | { type: 'single'; block: LessonBlock; key: string }
  | { type: 'flashcard-group'; blocks: Extract<LessonBlock, { type: 'flashcard' }>[]; key: string };

function groupBlocks(blocks: LessonBlock[]): RenderGroup[] {
  const groups: RenderGroup[] = [];
  let currentFlashcards: Extract<LessonBlock, { type: 'flashcard' }>[] = [];
  let groupKey = '';

  blocks.forEach((block, index) => {
    if (block.type === 'flashcard') {
      if (currentFlashcards.length === 0) {
        groupKey = `flashcard-group-${index}`;
      }
      currentFlashcards.push(block);
    } else {
      if (currentFlashcards.length > 0) {
        groups.push({ type: 'flashcard-group', blocks: currentFlashcards, key: groupKey });
        currentFlashcards = [];
      }
      groups.push({ type: 'single', block, key: `block-${index}` });
    }
  });

  if (currentFlashcards.length > 0) {
    groups.push({ type: 'flashcard-group', blocks: currentFlashcards, key: groupKey });
  }

  return groups;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ content }) => {
  let parsedContent: { title: string; blocks: LessonBlock[] } | null = null;

  try {
    const trimmed = content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      parsedContent = JSON.parse(trimmed);
    }
  } catch (error) {
    console.error('Failed to parse lesson blocks JSON, falling back to raw text', error);
  }

  if (!parsedContent || !Array.isArray(parsedContent.blocks)) {
    return (
      <div className="whitespace-pre-wrap leading-8 text-gray-700 dark:text-gray-200 font-semibold">
        {content}
      </div>
    );
  }

  const grouped = groupBlocks(parsedContent.blocks);

  return (
    <div className="flex flex-col gap-8 w-full">
      {grouped.map((group) => {
        if (group.type === 'flashcard-group') {
          return <FlashcardComponent key={group.key} cards={group.blocks} />;
        }

        const block = group.block;
        const key = group.key;

        switch (block.type) {
          case 'objective':
            return <LearningObjectiveCard key={key} {...block} />;
          case 'paragraph':
            return <ParagraphCard key={key} {...block} />;
          case 'analogy':
            return <AnalogyCard key={key} {...block} />;
          case 'example':
            return <ExampleCard key={key} {...block} />;
          case 'warning':
            return <WarningCard key={key} {...block} />;
          case 'summary':
            return <SummaryCard key={key} {...block} />;
          case 'interactive-quiz':
            return <InteractiveQuizCard key={key} {...block} />;
          case 'flashcard':
            return <FlashcardComponent key={key} {...block} />;
          case 'interactive-reveal':
            return <InteractiveRevealComponent key={key} {...block} />;
          case 'code-sandbox':
            return <CodeSandboxComponent key={key} {...block} />;
          case 'image':
            return <ImageCard key={key} {...block} />;
          default:
            return null;
        }
      })}
    </div>
  );
};
