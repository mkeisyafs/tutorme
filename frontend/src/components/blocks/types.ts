export interface ObjectiveBlock {
  type: 'objective';
  title: string;
  content: string;
}

export interface ParagraphBlock {
  type: 'paragraph';
  content: string;
}

export interface AnalogyBlock {
  type: 'analogy';
  title: string;
  content: string;
}

export interface ExampleBlock {
  type: 'example';
  title: string;
  content: string;
}

export interface WarningBlock {
  type: 'warning';
  title: string;
  items: string[];
}

export interface SummaryBlock {
  type: 'summary';
  content: string;
}

export interface InteractiveQuizBlock {
  type: 'interactive-quiz';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface FlashcardBlock {
  type: 'flashcard';
  front: string;
  back: string;
}

export interface InteractiveRevealBlock {
  type: 'interactive-reveal';
  summary: string;
  details: string;
}

export interface CodeSandboxBlock {
  type: 'code-sandbox';
  code: string;
  language: string;
  expectedOutput: string;
  instructions: string;
}

export type LessonBlock =
  | ObjectiveBlock
  | ParagraphBlock
  | AnalogyBlock
  | ExampleBlock
  | WarningBlock
  | SummaryBlock
  | InteractiveQuizBlock
  | FlashcardBlock
  | InteractiveRevealBlock
  | CodeSandboxBlock;

export interface BlockRendererProps {
  content: string;
}

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}
