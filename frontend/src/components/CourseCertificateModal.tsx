import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Download, LoaderCircle, X } from 'lucide-react';
import {
  CERTIFICATE_ASPECT,
  CERTIFICATE_PIXEL_WIDTH,
  certificateFileName,
  drawCertificate,
  ensureCertificateFonts,
  jpegToPdf,
} from '../lib/certificate';

interface CourseCertificateModalProps {
  courseTitle: string;
  userName: string;
  /** ISO string or Date. Falls back to today when absent. */
  completedAt?: string | Date | null;
  onClose: () => void;
}

export const CourseCertificateModal = ({ courseTitle, userName, completedAt, onClose }: CourseCertificateModalProps) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState('');

  const data = useMemo(() => {
    const date = completedAt ? new Date(completedAt) : new Date();
    return { courseTitle, userName, completedAt: isNaN(date.getTime()) ? new Date() : date };
  }, [courseTitle, userName, completedAt]);

  // One canvas is both the preview and the PDF source, so what the learner
  // sees is byte-for-byte what gets downloaded.
  useEffect(() => {
    let cancelled = false;
    const paint = async () => {
      await ensureCertificateFonts();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (cancelled || !canvas || !ctx) return;
      canvas.width = CERTIFICATE_PIXEL_WIDTH;
      canvas.height = Math.round(CERTIFICATE_PIXEL_WIDTH / CERTIFICATE_ASPECT);
      drawCertificate(ctx, canvas.width, data);
    };
    void paint();
    return () => { cancelled = true; };
  }, [data]);

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isPreparing) return;

    setIsPreparing(true);
    setError('');
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob) throw new Error('Canvas export failed.');

      const pdf = jpegToPdf(new Uint8Array(await blob.arrayBuffer()), canvas.width, canvas.height);
      const url = URL.createObjectURL(pdf);
      const link = document.createElement('a');
      link.href = url;
      link.download = certificateFileName(courseTitle);
      link.click();
      // Revoke after the browser has picked up the download.
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setError(t('certificate.downloadFailed'));
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-3 sm:p-6 backdrop-blur-sm"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="certificate-modal-title"
    >
      <section
        onMouseDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl border-4 border-blue-400 bg-white shadow-[8px_8px_0_rgba(96,165,250,1)] dark:border-blue-700 dark:bg-gray-800 dark:shadow-[8px_8px_0_rgba(30,58,138,0.8)]"
      >
        <header className="flex items-center justify-between gap-3 border-b-2 border-blue-100 p-4 sm:p-5 dark:border-blue-900">
          <h2 id="certificate-modal-title" className="flex items-center gap-2.5 font-['Kalam',cursive] text-xl sm:text-2xl font-bold text-blue-950 dark:text-blue-100">
            <Award className="h-6 w-6 text-blue-500" />
            {t('certificate.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('certificate.close')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="bg-gray-100 p-3 sm:p-6 dark:bg-gray-900">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={t('certificate.previewAlt', { name: userName, course: courseTitle })}
            className="aspect-[1.414] w-full rounded-lg border-2 border-gray-200 bg-white shadow-lg dark:border-gray-700"
          />
        </div>

        {error && (
          <p role="alert" className="mx-4 mb-1 rounded-xl border-2 border-red-300 bg-red-50 p-3 text-center text-sm font-bold text-red-700 sm:mx-5 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </p>
        )}

        <footer className="flex flex-col gap-3 border-t-2 border-blue-100 p-4 sm:flex-row sm:justify-end sm:p-5 dark:border-blue-900">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-gray-300 bg-white px-5 py-2.5 font-['Kalam',cursive] text-lg font-bold text-gray-700 transition-all hover:bg-gray-100 active:translate-y-0.5 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            {t('certificate.close')}
          </button>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={isPreparing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-blue-700 bg-blue-500 px-6 py-2.5 font-['Kalam',cursive] text-lg font-bold text-white shadow-[3px_3px_0_#1d4ed8] transition-all hover:bg-blue-600 active:translate-y-0.5 active:shadow-none disabled:cursor-wait disabled:opacity-70"
          >
            {isPreparing ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            {t('certificate.download')}
          </button>
        </footer>
      </section>
    </div>
  );
};

export default CourseCertificateModal;
