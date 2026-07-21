import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Lightbulb,
  CircleAlert,
  CheckCircle2,
  Code,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Play,
  RefreshCw,
  HelpCircle,
  Award,
} from 'lucide-react';

interface ObjectiveBlock {
  type: 'objective';
  title: string;
  content: string;
}

interface ParagraphBlock {
  type: 'paragraph';
  content: string;
}

interface AnalogyBlock {
  type: 'analogy';
  title: string;
  content: string;
}

interface ExampleBlock {
  type: 'example';
  title: string;
  content: string;
}

interface WarningBlock {
  type: 'warning';
  title: string;
  items: string[];
}

interface SummaryBlock {
  type: 'summary';
  content: string;
}

interface InteractiveQuizBlock {
  type: 'interactive-quiz';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface FlashcardBlock {
  type: 'flashcard';
  front: string;
  back: string;
}

interface InteractiveRevealBlock {
  type: 'interactive-reveal';
  summary: string;
  details: string;
}

interface CodeSandboxBlock {
  type: 'code-sandbox';
  code: string;
  language: string;
  expectedOutput: string;
  instructions: string;
}

type LessonBlock =
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

interface BlockRendererProps {
  content: string;
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const highlightStyles = [
  {
    bg: 'bg-blue-100/70 dark:bg-blue-950/40',
    border: 'border-blue-400 dark:border-blue-500',
    text: 'text-blue-950 dark:text-blue-300',
  },
  {
    bg: 'bg-pink-100/70 dark:bg-pink-950/40',
    border: 'border-pink-400 dark:border-pink-500',
    text: 'text-pink-950 dark:text-pink-300',
  },
  {
    bg: 'bg-green-100/70 dark:bg-green-950/40',
    border: 'border-green-400 dark:border-green-500',
    text: 'text-green-950 dark:text-green-300',
  },
  {
    bg: 'bg-yellow-100/70 dark:bg-yellow-950/40',
    border: 'border-yellow-400 dark:border-yellow-500',
    text: 'text-yellow-950 dark:text-yellow-300',
  },
  {
    bg: 'bg-purple-100/70 dark:bg-purple-950/40',
    border: 'border-purple-400 dark:border-purple-500',
    text: 'text-purple-950 dark:text-purple-300',
  },
];

const getHighlightStyle = (children: React.ReactNode) => {
  let text = '';
  if (typeof children === 'string') {
    text = children;
  } else if (Array.isArray(children)) {
    text = children.map(c => (typeof c === 'string' ? c : '')).join('');
  } else if (children && typeof children === 'object' && 'props' in children) {
    text = String((children as any).props.children || '');
  } else {
    text = String(children || '');
  }

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % highlightStyles.length;
  return highlightStyles[index];
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ node, ...props }) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />,
          strong: ({ node, children, ...props }) => {
            const style = getHighlightStyle(children);
            return (
              <strong
                className={`font-black px-1.5 py-0.5 rounded border-b-2 transition-colors ${style.bg} ${style.border} ${style.text}`}
                {...props}
              >
                {children}
              </strong>
            );
          },
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          code: ({ node, inline, className, children, ...props }: any) => {
            return inline ? (
              <code className="bg-gray-100 dark:bg-gray-800 text-pink-500 dark:text-pink-400 px-1.5 py-0.5 rounded font-mono text-sm" {...props}>
                {children}
              </code>
            ) : (
              <pre className="bg-gray-900 text-pink-200 p-4 rounded-xl overflow-x-auto mb-4 font-mono text-sm">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
          li: ({ node, ...props }) => <li className="" {...props} />,
          a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" target="_blank" rel="noreferrer" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900 dark:text-white" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-4 mt-6 text-gray-900 dark:text-white" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-3 mt-5 text-gray-900 dark:text-white" {...props} />,
          table: ({ node, ...props }) => (
            <div className="my-4 overflow-x-auto rounded-xl border-2 border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-gray-100 dark:bg-gray-800" {...props} />,
          tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900/60" {...props} />,
          tr: ({ node, ...props }) => <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50" {...props} />,
          th: ({ node, ...props }) => <th className="px-3 py-2 text-left font-bold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 last:border-r-0" {...props} />,
          td: ({ node, ...props }) => <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 last:border-r-0" {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-pink-400 pl-4 italic my-3 text-gray-600 dark:text-gray-400" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// Simple Python simulation interpreter for code sandbox edits
function runPythonMock(code: string): string {
  const lines = code.split('\n');
  const variables: Record<string, any> = {};
  const logs: string[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    // Check variable assignment: x = value
    const assignMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
    if (assignMatch) {
      const varName = assignMatch[1];
      let varValueExpr = assignMatch[2].trim();

      // Try to parse string literal
      if (
        (varValueExpr.startsWith('"') && varValueExpr.endsWith('"')) ||
        (varValueExpr.startsWith("'") && varValueExpr.endsWith("'"))
      ) {
        variables[varName] = varValueExpr.slice(1, -1);
      } else {
        // Try to parse number or evaluate simple expression
        try {
          // Replace variable names with their values
          let expr = varValueExpr;
          for (const [k, v] of Object.entries(variables)) {
            const regex = new RegExp(`\\b${k}\\b`, 'g');
            expr = expr.replace(regex, typeof v === 'string' ? `"${v}"` : v);
          }
          const evaluated = new Function(`return ${expr}`)();
          variables[varName] = evaluated;
        } catch (e) {
          return `NameError: name '${varValueExpr}' is not defined`;
        }
      }
      continue;
    }

    // Check print statement: print(...)
    const printMatch = line.match(/^print\((.*)\)$/);
    if (printMatch) {
      let printExpr = printMatch[1].trim();

      // Handle f-string: f"..." or f'...'
      if (printExpr.startsWith('f"') || printExpr.startsWith("f'")) {
        let content = printExpr.slice(2, -1);
        const placeholderRegex = /\{(.*?)\}/g;
        let hasError = false;
        content = content.replace(placeholderRegex, (_, g1) => {
          const varName = g1.trim();
          if (varName in variables) {
            return variables[varName];
          } else {
            hasError = true;
            return varName;
          }
        });
        if (hasError) {
          return `NameError: variable name not found in f-string`;
        }
        logs.push(content);
      }
      // Handle normal string literal
      else if (
        (printExpr.startsWith('"') && printExpr.endsWith('"')) ||
        (printExpr.startsWith("'") && printExpr.endsWith("'"))
      ) {
        logs.push(printExpr.slice(1, -1));
      }
      // Handle variable or expression
      else {
        let expr = printExpr;
        for (const [k, v] of Object.entries(variables)) {
          const regex = new RegExp(`\\b${k}\\b`, 'g');
          expr = expr.replace(regex, typeof v === 'string' ? `"${v}"` : v);
        }
        try {
          const evaluated = new Function(`return ${expr}`)();
          logs.push(String(evaluated));
        } catch (e) {
          return `NameError: name '${printExpr}' is not defined`;
        }
      }
      continue;
    }
  }
  return logs.length > 0 ? logs.join('\n') : 'Ran successfully (no print output).';
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

  // Fallback to plain rendering if parsing fails
  if (!parsedContent || !Array.isArray(parsedContent.blocks)) {
    return (
      <div className="whitespace-pre-wrap leading-8 text-gray-700 dark:text-gray-200 font-semibold">
        {content}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {parsedContent.blocks.map((block, index) => {
        const key = `block-${index}`;

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
          default:
            return null;
        }
      })}
    </div>
  );
};

// 1. Learning Objective Card
const LearningObjectiveCard: React.FC<ObjectiveBlock> = ({ title, content }) => {
  return (
    <div className="p-6 rounded-3xl border-4 border-blue-300 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 shadow-[6px_6px_0px_0px_#60a5fa] dark:shadow-[6px_6px_0px_0px_rgba(30,58,138,0.6)] transform transition-transform hover:-translate-y-1">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-500 rounded-xl text-white shadow-[2px_2px_0px_0px_#1d4ed8]">
          <Award className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-['Kalam',cursive] font-bold text-blue-900 dark:text-blue-200">
          {title || 'Learning Objective'}
        </h3>
      </div>
      <div className="text-gray-700 dark:text-gray-300 font-semibold leading-relaxed pl-1">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
};

// 2. Paragraph Card
const ParagraphCard: React.FC<ParagraphBlock> = ({ content }) => {
  return (
    <div className="text-gray-700 dark:text-gray-200 font-semibold leading-8 text-[16px]">
      <MarkdownRenderer content={content} />
    </div>
  );
};

// 3. Analogy Card
const AnalogyCard: React.FC<AnalogyBlock> = ({ title, content }) => {
  return (
    <div className="p-6 rounded-3xl border-4 border-amber-300 dark:border-amber-900 bg-gradient-to-br from-amber-50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 shadow-[6px_6px_0px_0px_#fbbf24] dark:shadow-[6px_6px_0px_0px_rgba(180,83,9,0.6)] transform transition-transform hover:-translate-y-1">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-amber-500 rounded-xl text-white shadow-[2px_2px_0px_0px_#b45309]">
          <Lightbulb className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-['Kalam',cursive] font-bold text-amber-900 dark:text-amber-200">
          {title || 'Analogy to Help You Think'}
        </h4>
      </div>
      <div className="text-gray-700 dark:text-gray-300 font-semibold leading-relaxed pl-1 italic">
        <MarkdownRenderer content={`"${content}"`} />
      </div>
    </div>
  );
};

// 4. Example Card
const ExampleCard: React.FC<ExampleBlock> = ({ title, content }) => {
  return (
    <div className="p-6 md:p-8 rounded-3xl border-4 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 shadow-[6px_6px_0px_0px_#fbbf24] dark:shadow-[6px_6px_0px_0px_rgba(180,83,9,0.6)]">
      <div className="flex items-center gap-3 mb-4 border-b-2 border-amber-200 dark:border-amber-800 pb-3">
        <div className="p-2 bg-amber-500 rounded-xl text-white shadow-[2px_2px_0px_0px_#b45309]">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-xl font-['Kalam',cursive] font-bold text-amber-900 dark:text-amber-100">
          {title || 'Example / Case Study'}
        </h4>
      </div>
      <div className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed prose dark:prose-invert max-w-none">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
};

// 5. Warning Card
const WarningCard: React.FC<WarningBlock> = ({ title, items }) => {
  return (
    <div className="p-6 rounded-3xl border-4 border-rose-300 dark:border-rose-900 bg-gradient-to-br from-rose-50 to-red-50/50 dark:from-rose-950/20 dark:to-red-950/10 shadow-[6px_6px_0px_0px_#f87171] dark:shadow-[6px_6px_0px_0px_rgba(153,27,27,0.6)] transform transition-transform hover:-translate-y-1">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-rose-500 rounded-xl text-white shadow-[2px_2px_0px_0px_#991b1b]">
          <CircleAlert className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-['Kalam',cursive] font-bold text-rose-950 dark:text-rose-200">
          {title || 'Common Pitfalls'}
        </h4>
      </div>
      <ul className="list-disc list-inside space-y-2 pl-1">
        {items.map((item, idx) => (
          <li key={idx} className="text-rose-900 dark:text-rose-300 font-semibold leading-relaxed">
            <MarkdownRenderer content={item} />
          </li>
        ))}
      </ul>
    </div>
  );
};

// 6. Summary Card
const SummaryCard: React.FC<SummaryBlock> = ({ content }) => {
  return (
    <div className="p-6 rounded-3xl border-4 border-emerald-300 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10 shadow-[6px_6px_0px_0px_#34d399] dark:shadow-[6px_6px_0px_0px_rgba(6,95,70,0.6)]">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-[2px_2px_0px_0px_#065f46]">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-['Kalam',cursive] font-bold text-emerald-950 dark:text-emerald-250">
          Takeaway Summary
        </h4>
      </div>
      <div className="text-gray-700 dark:text-gray-300 font-semibold leading-relaxed pl-1">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
};

// 7. Interactive Quiz Card
const InteractiveQuizCard: React.FC<InteractiveQuizBlock> = ({
  question,
  options,
  correctIndex,
  explanation,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  return (
    <div className="p-6 md:p-8 rounded-3xl border-4 border-purple-300 dark:border-purple-800 bg-white dark:bg-gray-800 shadow-[6px_6px_0px_0px_#c084fc] dark:shadow-[6px_6px_0px_0px_rgba(88,28,135,0.6)]">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-purple-500 rounded-xl text-white shadow-[2px_2px_0px_0px_#7e22ce]">
          <HelpCircle className="w-6 h-6" />
        </div>
        <span className="font-['Kalam',cursive] font-bold text-purple-950 dark:text-purple-200 text-lg">
          Mid-lesson Quick Check
        </span>
      </div>

      <h4 className="text-[17px] font-bold text-gray-900 dark:text-gray-100 mb-6 leading-relaxed">
        {question}
      </h4>

      <div className="flex flex-col gap-3">
        {options.map((option, idx) => {
          const isSelected = selectedIdx === idx;
          const isAnswered = selectedIdx !== null;
          const isCorrect = idx === correctIndex;

          let btnClass =
            'w-full text-left p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 bg-gray-50 dark:bg-gray-900/50 font-semibold transition-all ';

          if (isAnswered) {
            if (isCorrect) {
              btnClass =
                'w-full text-left p-4 rounded-2xl border-2 border-green-500 dark:border-green-600 bg-green-50/50 dark:bg-green-950/20 text-green-900 dark:text-green-200 font-bold transition-all';
            } else if (isSelected) {
              btnClass =
                'w-full text-left p-4 rounded-2xl border-2 border-red-500 dark:border-red-600 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200 font-bold transition-all';
            } else {
              btnClass =
                'w-full text-left p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-900/20 text-gray-400 dark:text-gray-500 transition-all cursor-not-allowed';
            }
          } else {
            btnClass += 'hover:-translate-y-0.5';
          }

          return (
            <button
              key={idx}
              onClick={() => !isAnswered && setSelectedIdx(idx)}
              disabled={isAnswered}
              className={btnClass}
            >
              <div className="flex justify-between items-center gap-3">
                <span>{option}</span>
                {isAnswered && isCorrect && <span className="text-green-500 font-bold">✓ Correct</span>}
                {isAnswered && isSelected && !isCorrect && (
                  <span className="text-red-500 font-bold">✗ Incorrect</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedIdx !== null && (
        <div className="mt-6 p-5 rounded-2xl border-2 border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/10 text-gray-700 dark:text-gray-300 font-semibold leading-relaxed animate-fadeIn">
          <div className="text-purple-950 dark:text-purple-300 font-bold mb-2">Explanation:</div>
          <MarkdownRenderer content={explanation} />
        </div>
      )}
    </div>
  );
};

// 8. Flashcard (3D flipping card)
const FlashcardComponent: React.FC<FlashcardBlock> = ({ front, back }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col items-center my-4">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
        Click to flip terms
      </span>
      {/* 3D card wrapper using grid to adapt to tallest content */}
      <div
        className="w-full max-w-md cursor-pointer grid"
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
            className="[grid-area:1/1] flex flex-col justify-center items-center p-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl border-4 border-indigo-700 text-white shadow-[6px_6px_0px_0px_#4338ca] dark:shadow-[6px_6px_0px_0px_rgba(67,56,202,0.6)] min-h-[14rem]"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="absolute top-4 left-4 bg-white/20 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider">
              Question / Term
            </div>
            <div className="text-xl md:text-2xl font-bold font-['Kalam',cursive] px-4 leading-relaxed mt-6">
              <MarkdownRenderer content={front} />
            </div>
          </div>

          {/* Card Back */}
          <div
            className="[grid-area:1/1] flex flex-col justify-center items-center p-8 bg-white dark:bg-gray-800 rounded-3xl border-4 border-indigo-500 dark:border-indigo-700 text-gray-800 dark:text-white shadow-[6px_6px_0px_0px_rgba(99,102,241,0.5)] min-h-[14rem]"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="absolute top-4 left-4 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider">
              Answer / Explanation
            </div>
            <div className="text-[16px] md:text-lg font-bold text-gray-700 dark:text-gray-200 px-4 leading-relaxed mt-6">
              <MarkdownRenderer content={back} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 9. Collapsible reveal accordion block
const InteractiveRevealComponent: React.FC<InteractiveRevealBlock> = ({ summary, details }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-4 border-sky-300 dark:border-sky-850 rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-[6px_6px_0px_0px_#38bdf8] dark:shadow-[6px_6px_0px_0px_rgba(3,105,161,0.6)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-6 text-left font-bold text-gray-900 dark:text-gray-150 hover:bg-sky-50/35 dark:hover:bg-gray-900/10 transition-colors gap-3"
      >
        <span className="text-[16px]">{summary}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-sky-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-sky-500 flex-shrink-0" />
        )}
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-96 opacity-100 border-t-2 border-dashed border-sky-100 dark:border-gray-700' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 text-gray-700 dark:text-gray-300 font-semibold leading-relaxed">
          <MarkdownRenderer content={details} />
        </div>
      </div>
    </div>
  );
};

// 10. Code Sandbox playground component
const CodeSandboxComponent: React.FC<CodeSandboxBlock> = ({
  code: defaultCode,
  language,
  expectedOutput,
  instructions,
}) => {
  const [code, setCode] = useState(defaultCode);
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState(false);

  const handleRun = () => {
    setIsCompiling(true);
    setConsoleOutput('Running...\n');

    setTimeout(() => {
      let output = '';
      if (language.toLowerCase() === 'python') {
        output = runPythonMock(code);
      } else if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'js') {
        try {
          const logs: string[] = [];
          const customConsole = {
            log: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ')),
          };
          // Safely execute JS
          const runFn = new Function('console', code);
          runFn(customConsole);
          output = logs.length > 0 ? logs.join('\n') : 'Executed successfully (no console output).';
        } catch (e: any) {
          output = `Error: ${e.message}`;
        }
      } else {
        output = 'Execution simulator supports Python and JavaScript. Outputting raw default run:\n' + expectedOutput;
      }
      setConsoleOutput(output);
      setIsCompiling(false);
    }, 800);
  };

  const handleReset = () => {
    setCode(defaultCode);
    setConsoleOutput('');
  };

  return (
    <div className="rounded-3xl border-4 border-gray-300 dark:border-gray-700 overflow-hidden shadow-[6px_6px_0px_0px_#9ca3af] dark:shadow-[6px_6px_0px_0px_#374151]">
      {/* Instructions header */}
      <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/80 border-b-2 border-gray-200 dark:border-gray-700">
        <span className="text-[12px] font-bold text-pink-500 uppercase tracking-widest inline-block mb-1.5">
          Coding Playground
        </span>
        <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm leading-relaxed">
          {instructions}
        </p>
      </div>

      {/* Editor & Console */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-60 border-b-2 border-gray-200 dark:border-gray-700">
        {/* Editor Area */}
        <div className="flex flex-col bg-gray-900 border-r-2 border-gray-800 md:border-b-0 border-b-2">
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-800 text-[11px] font-bold tracking-wider text-gray-500">
            <span>EDITOR ({language.toUpperCase()})</span>
            <span className="text-[10px] text-gray-600">Editable sandbox</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full p-4 font-mono text-sm bg-gray-950 text-pink-200 outline-none resize-none min-h-48 border-none focus:ring-0"
          />
        </div>

        {/* Console Area */}
        <div className="flex flex-col bg-black text-green-400 font-mono text-xs">
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-950 text-[11px] font-bold tracking-wider text-gray-600">
            <span>CONSOLE OUTPUT</span>
            {expectedOutput && (
              <span className="text-[9px] text-gray-700">Target output: "{expectedOutput}"</span>
            )}
          </div>
          <pre className="flex-1 p-4 overflow-y-auto leading-relaxed text-left min-h-48 select-text">
            <code>{consoleOutput || 'Click "Run Code" to execute the sandbox.'}</code>
          </pre>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 flex justify-between items-center gap-4">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-2 border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-800 rounded-xl transition-transform active:translate-y-0.5"
          disabled={isCompiling}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
          Reset Example
        </button>

        <button
          onClick={handleRun}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl border-2 border-green-700 shadow-[2px_2px_0_#15803d] transition-all active:translate-y-0.5 active:shadow-none"
          disabled={isCompiling}
        >
          <Play className="w-4 h-4 fill-white text-white" />
          {isCompiling ? 'Running...' : 'Run Code'}
        </button>
      </div>
    </div>
  );
};
