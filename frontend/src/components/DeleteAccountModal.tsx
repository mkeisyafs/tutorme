import React, { useEffect, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { apiRequest, getApiErrorMessage } from '../lib/api';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setPassword('');
      setError('');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError(t('settings.dangerZone.incorrectPassword'));
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await apiRequest('/users/me/soft-delete', {
        method: 'POST',
        body: { password },
      });

      onClose();
      logout();
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t('settings.dangerZone.incorrectPassword')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-white/20 dark:bg-gray-900/40 backdrop-blur-md transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-red-50/95 dark:bg-gray-800/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(239,68,68,0.4)] dark:shadow-[8px_8px_0px_0px_rgba(185,28,28,0.5)] border-4 border-red-300 dark:border-red-700/60 max-w-md w-[calc(100vw-1.5rem)] sm:w-full max-h-[90vh] overflow-y-auto relative transform rotate-1 hover:rotate-0 transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tape detail */}
        <div className="absolute top-0 left-1/2 w-24 h-7 bg-red-400/40 dark:bg-red-500/40 -translate-x-1/2 -translate-y-3 rounded-sm transform -rotate-2 backdrop-blur-md border border-red-200/50 dark:border-red-700/50"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-red-700 dark:text-gray-400 hover:text-red-950 dark:hover:text-gray-100 font-bold font-['Kalam',cursive] transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-200/50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-gray-500"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-2xl border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 shadow-inner">
            <AlertTriangle className="w-10 h-10 animate-bounce" />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold mb-3 font-['Kalam',cursive] text-red-900 dark:text-red-300 text-center">
          {t('settings.dangerZone.modalTitle')}
        </h2>

        {/* Warning Notice */}
        <div className="mb-6 p-4 rounded-xl bg-red-100/80 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 text-xs sm:text-sm font-semibold leading-relaxed">
          {t('settings.dangerZone.modalNotice')}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-['Nunito',sans-serif]">
          <div>
            <label className="block text-red-900 dark:text-red-200 font-bold mb-2 text-xs sm:text-sm uppercase tracking-wider">
              {t('settings.dangerZone.passwordLabel')}
            </label>
            <div className="relative">
              <input
                type={isPasswordVisible ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                required
                placeholder={t('settings.dangerZone.passwordPlaceholder')}
                className="w-full px-4 py-3 pr-12 rounded-xl border-4 border-red-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-bold focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-200 dark:focus:ring-red-900/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((prev) => !prev)}
                className="absolute right-0 top-0 bottom-0 px-3 flex items-center text-red-600 dark:text-gray-400 hover:text-red-900 dark:hover:text-gray-200"
                aria-label="Toggle password visibility"
              >
                {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-700 dark:text-red-300 font-bold text-xs sm:text-sm bg-red-100 dark:bg-red-900/40 p-3 rounded-xl border-2 border-red-300">
              {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold font-['Kalam',cursive] text-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              {t('settings.dangerZone.cancelBtn')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white font-bold py-3 px-4 rounded-xl font-['Kalam',cursive] text-lg border-2 border-red-800 shadow-[4px_4px_0_#991b1b] hover:translate-y-0.5 hover:shadow-[2px_2px_0_#991b1b] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isSubmitting ? t('settings.dangerZone.deletingBtn') : t('settings.dangerZone.confirmDeleteBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
