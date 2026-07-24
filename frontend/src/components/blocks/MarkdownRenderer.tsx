import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import type { MarkdownRendererProps } from './types';

const highlightStyles = [
  {
    bg: 'bg-blue-100/80 dark:bg-blue-900/50',
    border: 'border-blue-400 dark:border-blue-500',
    text: 'text-blue-950 dark:text-blue-200',
  },
  {
    bg: 'bg-pink-100/80 dark:bg-pink-900/50',
    border: 'border-pink-400 dark:border-pink-500',
    text: 'text-pink-950 dark:text-pink-200',
  },
  {
    bg: 'bg-emerald-100/80 dark:bg-emerald-900/50',
    border: 'border-emerald-400 dark:border-emerald-500',
    text: 'text-emerald-950 dark:text-emerald-200',
  },
  {
    bg: 'bg-amber-100/80 dark:bg-amber-900/50',
    border: 'border-amber-400 dark:border-amber-500',
    text: 'text-amber-950 dark:text-amber-200',
  },
  {
    bg: 'bg-purple-100/80 dark:bg-purple-900/50',
    border: 'border-purple-400 dark:border-purple-500',
    text: 'text-purple-950 dark:text-purple-200',
  },
];

const getHighlightStyle = (children: React.ReactNode) => {
  let text = '';
  if (typeof children === 'string') {
    text = children;
  } else if (Array.isArray(children)) {
    text = children.map((c) => (typeof c === 'string' ? c : '')).join('');
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

function isProseOrHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;

  if (/^#{1,6}\s+[A-Z0-9]/.test(trimmed)) {
    if (!trimmed.includes('=') && !trimmed.includes('(') && !trimmed.includes(';')) {
      return true;
    }
  }

  if (/^(\d+[\.\)]\s+|Step\s+\d+:|Phase\s+\d+:|Section\s+\d+:)/i.test(trimmed)) {
    return true;
  }

  if (/^[\-\*\+]\s+[A-Z]/.test(trimmed) && !trimmed.includes('=')) {
    return true;
  }

  if (
    /\b(is|are|the|a|an|of|in|to|we|you|this|that|lesson|will|understand|process|finding|number|items|group|combine|together|example|concept)\b/i.test(
      trimmed
    ) &&
    !/^\s*(print|console\.log|def|class|import|from|return|if|for|while)\b/.test(trimmed) &&
    !/^\s*[a-zA-Z_]\w*\s*[\+\-\*\/\%]?=\s*[^=].+$/.test(trimmed)
  ) {
    return true;
  }

  return false;
}

function isCodeLine(line: string, nextLine?: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  if (isProseOrHeading(line)) {
    return false;
  }

  if (/^\s*[a-zA-Z_]\w*\s*[\+\-\*\/\%]?=\s*[^=].+$/.test(trimmed)) {
    return true;
  }

  if (/^\s*(print|console\.log|exec|eval|len|range|input|type|int|str|float|list|dict|set|tuple)\s*\(/.test(trimmed)) {
    return true;
  }

  if (
    /^\s*(def|class|import|from|return|if|elif|else|for|while|try|except|finally|with|async|await|const|let|var|function)\b/.test(
      trimmed
    )
  ) {
    return true;
  }

  if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
    if (nextLine && isCodeLine(nextLine)) return true;
    if (/program|demonstrate|code|script|addition|variable|example|setup|import|function/i.test(trimmed)) {
      return true;
    }
  }

  return false;
}

const formatUnfencedCodeContent = (rawContent: string): string => {
  if (!rawContent) return '';

  let cleaned = rawContent.replace(/```[a-zA-Z0-9_-]*\s*\n?\s*```/g, '');

  const parts: string[] = [];
  const fenceRegex = /(```[a-zA-Z0-9_-]*[\s\S]*?```)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      parts.push(cleaned.slice(lastIndex, match.index));
    }
    parts.push(match[0]);
    lastIndex = fenceRegex.lastIndex;
  }
  if (lastIndex < cleaned.length) {
    parts.push(cleaned.slice(lastIndex));
  }

  const processedParts = parts.map((part) => {
    if (part.startsWith('```')) return part;

    const lines = part.split('\n');
    const resultLines: string[] = [];
    let codeBuffer: string[] = [];

    const flushBuffer = () => {
      if (codeBuffer.length > 0) {
        resultLines.push('```python');
        resultLines.push(...codeBuffer);
        resultLines.push('```');
        codeBuffer = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1];
      if (isCodeLine(line, nextLine)) {
        codeBuffer.push(line);
      } else {
        flushBuffer();
        resultLines.push(line);
      }
    }
    flushBuffer();

    return resultLines.join('\n');
  });

  return processedParts.join('');
};

const preprocessMath = (rawContent: string): string => {
  if (!rawContent) return '';
  let processed = rawContent.replace(/\\\(([\s\S]*?)\\\)/g, '$$1$');
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$');
  return processed;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const formattedContent = formatUnfencedCodeContent(preprocessMath(content));

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          p: ({ node, ...props }) => (
            <p className="mb-4 last:mb-0 leading-relaxed font-medium whitespace-pre-line" {...props} />
          ),
          strong: ({ node, children, ...props }) => {
            const style = getHighlightStyle(children);
            return (
              <strong
                className={`font-black px-1.5 py-0.5 rounded-md border-b-2 transition-colors ${style.bg} ${style.border} ${style.text}`}
                {...props}
              >
                {children}
              </strong>
            );
          },
          em: ({ node, ...props }) => <em className="italic font-semibold text-gray-800 dark:text-gray-200" {...props} />,
          code: ({ className, children, ...props }: any) => {
            const isBlock = String(children).includes('\n') || (className && className.includes('language-'));
            return isBlock ? (
              <code className={`${className || ''} font-mono`} {...props}>
                {children}
              </code>
            ) : (
              <code
                className={`bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-800/60 px-1.5 py-0.5 rounded-md font-mono text-xs sm:text-sm font-semibold ${className || ''}`}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }: any) => {
            const textContent = React.Children.toArray(children)
              .map((child: any) => (typeof child === 'string' ? child : child?.props?.children || ''))
              .join('')
              .trim();

            if (!textContent) return null;

            return (
              <pre
                className="bg-gray-900 dark:bg-gray-950 text-pink-200 dark:text-pink-300 p-4 sm:p-5 rounded-2xl overflow-x-auto my-4 font-mono text-xs sm:text-sm border-2 border-gray-800 shadow-[4px_4px_0px_0px_rgba(17,24,39,0.8)]"
                {...props}
              >
                {children}
              </pre>
            );
          },
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-200 font-medium" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-200 font-medium" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
          a: ({ node, ...props }) => (
            <a className="text-blue-600 dark:text-blue-400 font-semibold hover:underline" target="_blank" rel="noreferrer" {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl sm:text-3xl font-['Kalam',cursive] font-bold mb-4 mt-6 text-gray-900 dark:text-white border-b-2 border-gray-200 dark:border-gray-700 pb-2" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl sm:text-2xl font-['Kalam',cursive] font-bold mb-3 mt-5 text-gray-900 dark:text-white" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg sm:text-xl font-['Kalam',cursive] font-bold mb-3 mt-4 text-gray-900 dark:text-white" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="my-5 overflow-x-auto rounded-2xl border-3 border-gray-300 dark:border-gray-700 shadow-[4px_4px_0px_0px_rgba(156,163,175,0.6)] dark:shadow-[4px_4px_0px_0px_rgba(31,41,55,0.6)]">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-gray-100 dark:bg-gray-800/80 font-['Kalam',cursive] text-base" {...props} />,
          tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900/80" {...props} />,
          tr: ({ node, ...props }) => <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50" {...props} />,
          th: ({ node, ...props }) => <th className="px-4 py-3 text-left font-bold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 last:border-r-0" {...props} />,
          td: ({ node, ...props }) => <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium border-r border-gray-200 dark:border-gray-700 last:border-r-0" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-pink-500 pl-4 py-1.5 italic my-4 text-gray-700 dark:text-gray-300 bg-pink-50/40 dark:bg-pink-950/20 rounded-r-xl font-medium" {...props} />
          ),
          details: ({ node, ...props }) => <details className="mb-4 rounded-2xl border-2 border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50" {...props} />,
          summary: ({ node, ...props }) => <summary className="cursor-pointer font-bold text-gray-900 dark:text-gray-100 outline-none hover:text-pink-600 dark:hover:text-pink-400 font-['Kalam',cursive] text-lg" {...props} />,
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
};
