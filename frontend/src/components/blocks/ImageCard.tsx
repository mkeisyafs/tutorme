import React from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize2 } from 'lucide-react';
import type { ImageBlock } from './types';

export const ImageCard: React.FC<ImageBlock> = ({ url, caption, altText }) => {
  const { t } = useTranslation();
  const [status, setStatus] = React.useState<'loading' | 'loaded' | 'error'>('loading');
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  if (status === 'error') {
    return null;
  }

  return (
    <figure className="my-4 first:mt-0 last:mb-0 p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900 shadow-md relative">
      <span
        aria-hidden="true"
        className="absolute -top-3 left-8 px-6 py-1 rotate-[-2deg] bg-indigo-200/80 dark:bg-indigo-800/70 border border-indigo-300/70 dark:border-indigo-700 text-[10px] font-bold uppercase tracking-widest text-indigo-800 dark:text-indigo-200"
      >
        {t('blocks.image.badge')}
      </span>

      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={t('blocks.image.expand')}
        className="group relative block w-full mt-3 overflow-hidden rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400"
      >
        {status === 'loading' && (
          <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-xl min-h-40" />
        )}
        <img
          src={url}
          alt={altText || caption}
          loading="lazy"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`w-full max-h-72 sm:max-h-96 rounded-xl object-contain transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0 min-h-40'}`}
        />
        <span className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
          <Maximize2 className="w-4 h-4" />
        </span>
      </button>

      {caption && (
        <figcaption className="mt-3 font-mono text-sm text-gray-600 dark:text-gray-300 text-center">
          {caption}
        </figcaption>
      )}

      <dialog
        ref={dialogRef}
        onClick={() => dialogRef.current?.close()}
        className="backdrop:bg-black/70 bg-transparent p-0 max-w-[95vw] max-h-[95vh] m-auto"
      >
        <img src={url} alt={altText || caption} className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl" />
        <p className="mt-2 font-mono text-sm text-white text-center">{caption}</p>
      </dialog>
    </figure>
  );
};
