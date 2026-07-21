import { useEffect, useRef } from 'react';
import { AlertTriangle, Home, Moon, RefreshCw, Sun } from 'lucide-react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { listed } from '../constant/listed';
import { useTheme } from '../hooks/useTheme';

interface ErrorContent {
  title: string;
  description: string;
  status?: number;
}

function getErrorContent(error: unknown): ErrorContent {
  if (isRouteErrorResponse(error)) {
    if (error.status === 401 || error.status === 403) {
      return {
        title: 'This page needs permission',
        description: 'Please sign in again, then choose where you would like to continue.',
        status: error.status,
      };
    }

    if (error.status === 404) {
      return {
        title: 'That page slipped out of the notebook',
        description: 'The link may be out of date. Head back to the start page and pick up from there.',
        status: error.status,
      };
    }

    return {
      title: 'We hit a small learning bump',
      description: 'This page could not be loaded just now. Try again, or return to the start page.',
      status: error.status,
    };
  }

  return {
    title: 'We hit a small learning bump',
    description: 'Something unexpected interrupted this page. Try again, or return to the start page.',
  };
}

export default function RouteErrorBoundary() {
  const error = useRouteError();
  const { isDark, toggleTheme } = useTheme();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { title, description, status } = getErrorContent(error);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="min-h-dvh overflow-hidden bg-white font-['Nunito',sans-serif] text-gray-800 transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100">
      <header className="relative z-20 border-b-2 border-dashed border-gray-300 bg-white/90 px-5 py-4 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800/90 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            to={listed.landing}
            className="-rotate-2 font-['Kalam',cursive] text-3xl font-bold text-blue-600 transition-transform hover:rotate-0 focus-visible:rounded-md focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-500 dark:text-blue-400"
          >
            TutorMe
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Use light theme' : 'Use dark theme'}
            className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </header>

      <main
        className="relative grid min-h-[calc(100dvh-5.5rem)] place-items-center overflow-hidden px-5 py-12 sm:px-8"
        style={{
          backgroundImage: isDark
            ? 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)'
            : 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-8 hidden w-0.5 bg-red-300 dark:bg-red-900/50 sm:block" aria-hidden="true" />
        <svg className="pointer-events-none absolute right-4 top-8 h-28 w-28 -rotate-12 text-blue-400/35 dark:text-blue-300/15 sm:right-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" aria-hidden="true">
          <path d="M20 58 C 16 24, 62 14, 72 42 C 82 70, 38 87, 28 58 C 18 29, 74 22, 82 58" />
        </svg>
        <svg className="pointer-events-none absolute bottom-8 left-4 h-20 w-24 rotate-6 text-pink-400/35 dark:text-pink-300/15 sm:bottom-14 sm:left-16" viewBox="0 0 100 80" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 54 L34 20 L52 64 L72 26 L90 54" />
        </svg>

        <section role="alert" className="relative z-10 w-full max-w-2xl rounded-br-3xl border-4 border-gray-800 bg-[#fffdf7] p-6 shadow-[10px_10px_0px_0px_rgba(31,41,55,1)] transition-colors dark:border-gray-700 dark:bg-gray-800 dark:shadow-[10px_10px_0px_0px_rgba(17,24,39,1)] sm:p-10">
          <div className="absolute -top-5 left-5 -rotate-3 border-2 border-yellow-500 bg-yellow-300 px-4 py-1.5 font-['Kalam',cursive] text-lg font-bold text-yellow-950 shadow-[3px_3px_0px_0px_rgba(31,41,55,1)] dark:border-yellow-400/70 dark:bg-yellow-900/80 dark:text-yellow-200 dark:shadow-[3px_3px_0px_0px_rgba(17,24,39,1)]">
            A quick note
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-gray-800 bg-pink-300 text-gray-900 shadow-[3px_3px_0px_0px_rgba(31,41,55,1)] dark:border-gray-700 dark:bg-pink-900/80 dark:text-pink-200 dark:shadow-[3px_3px_0px_0px_rgba(17,24,39,1)]">
              <AlertTriangle className="h-8 w-8" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              {status && <p className="mb-2 font-['Kalam',cursive] text-base font-bold text-pink-700 dark:text-pink-300">Error {status}</p>}
              <h1 ref={headingRef} tabIndex={-1} className="font-['Kalam',cursive] text-4xl font-bold leading-tight text-gray-900 outline-none dark:text-gray-100 sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-xl text-lg font-semibold leading-8 text-gray-700 dark:text-gray-300">
                {description}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border-2 border-blue-700 bg-blue-500 px-5 py-2.5 font-['Kalam',cursive] text-lg font-bold text-white shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] transition-all hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-[5px_5px_0px_0px_rgba(30,58,138,1)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-500 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(30,58,138,1)] dark:border-blue-400 dark:bg-blue-600 dark:shadow-[4px_4px_0px_0px_rgba(147,197,253,0.5)] dark:hover:bg-blue-500"
            >
              <RefreshCw className="h-5 w-5" aria-hidden="true" />
              Try again
            </button>
            <Link
              to={listed.landing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border-2 border-gray-800 bg-white px-5 py-2.5 font-['Kalam',cursive] text-lg font-bold text-gray-800 shadow-[3px_3px_0px_0px_rgba(156,163,175,1)] transition-all hover:-translate-y-0.5 hover:bg-yellow-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-500 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(156,163,175,1)] dark:border-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:shadow-[3px_3px_0px_0px_rgba(75,85,99,1)] dark:hover:bg-gray-600"
            >
              <Home className="h-5 w-5" aria-hidden="true" />
              Back to start
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
