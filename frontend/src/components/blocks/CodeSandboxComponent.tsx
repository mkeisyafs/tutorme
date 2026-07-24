import React, { useState } from 'react';
import { Terminal, Code2, RefreshCw, Play } from 'lucide-react';
import { runPythonMock } from './pythonInterpreter';
import type { CodeSandboxBlock } from './types';

export const CodeSandboxComponent: React.FC<CodeSandboxBlock> = ({
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
    setConsoleOutput('Running simulator...\n');

    setTimeout(() => {
      let output = '';
      if (language.toLowerCase() === 'python') {
        output = runPythonMock(code);
      } else if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'js') {
        try {
          const logs: string[] = [];
          const customConsole = {
            log: (...args: any[]) =>
              logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ')),
          };
          const runFn = new Function('console', code);
          runFn(customConsole);
          output = logs.length > 0 ? logs.join('\n') : 'Executed successfully (no output).';
        } catch (e: any) {
          output = `Error: ${e.message}`;
        }
      } else {
        output =
          'Execution simulator supports Python and JavaScript. Default run output:\n' + expectedOutput;
      }
      setConsoleOutput(output);
      setIsCompiling(false);
    }, 600);
  };

  const handleReset = () => {
    setCode(defaultCode);
    setConsoleOutput('');
  };

  return (
    <div className="rounded-3xl border-4 border-gray-400 dark:border-gray-700 overflow-hidden shadow-[6px_6px_0px_0px_#4b5563] dark:shadow-[6px_6px_0px_0px_#1f2937] my-2">
      {/* Instructions Header */}
      <div className="p-5 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-850 dark:to-gray-900 border-b-3 border-gray-300 dark:border-gray-700 flex items-start gap-3">
        <div className="p-2 bg-pink-500 text-white rounded-xl shadow-[2px_2px_0px_0px_#be185d] shrink-0 mt-0.5">
          <Terminal className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest block font-mono">
            Interactive Playground
          </span>
          <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm sm:text-base leading-relaxed">
            {instructions}
          </p>
        </div>
      </div>

      {/* Editor & Console Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[16rem] border-b-3 border-gray-300 dark:border-gray-700">
        {/* Code Editor */}
        <div className="flex flex-col bg-gray-950 border-r-0 lg:border-r-3 border-b-3 lg:border-b-0 border-gray-800">
          <div className="flex justify-between items-center px-4 py-2 bg-gray-900 border-b border-gray-800 text-[11px] font-mono font-bold tracking-wider text-gray-400">
            <span className="flex items-center gap-1.5 text-pink-400">
              <Code2 className="w-3.5 h-3.5" /> {language.toUpperCase()} EDITOR
            </span>
            <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Editable</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full p-4 font-mono text-xs sm:text-sm bg-gray-950 text-pink-200 outline-none resize-none min-h-[13rem] border-none focus:ring-0 leading-relaxed"
          />
        </div>

        {/* Console Output */}
        <div className="flex flex-col bg-black text-green-400 font-mono text-xs">
          <div className="flex justify-between items-center px-4 py-2 bg-gray-900/90 border-b border-gray-800 text-[11px] font-bold tracking-wider text-gray-400">
            <span className="flex items-center gap-1.5 text-green-400">
              <Terminal className="w-3.5 h-3.5" /> CONSOLE OUTPUT
            </span>
            {expectedOutput && (
              <span className="text-[10px] text-gray-500 truncate max-w-[180px]">
                Target: {expectedOutput}
              </span>
            )}
          </div>
          <pre className="flex-1 p-4 overflow-y-auto leading-relaxed min-h-[13rem] select-text">
            <code>{consoleOutput || 'Click "Run Code" to execute code.'}</code>
          </pre>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-5 py-3.5 bg-gray-100 dark:bg-gray-900 flex justify-between items-center gap-4">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl transition-all shadow-[2px_2px_0px_0px_#9ca3af] dark:shadow-[2px_2px_0px_0px_#374151] active:translate-y-0.5 active:shadow-none"
          disabled={isCompiling}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
          Reset
        </button>

        <button
          onClick={handleRun}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl border-2 border-green-700 shadow-[3px_3px_0px_0px_#15803d] transition-all active:translate-y-0.5 active:shadow-none font-['Kalam',cursive] text-base"
          disabled={isCompiling}
        >
          <Play className="w-4 h-4 fill-white text-white" />
          {isCompiling ? 'Running...' : 'Run Code'}
        </button>
      </div>
    </div>
  );
};
