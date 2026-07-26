import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/useAuth';
import { getApiErrorMessage } from '../lib/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToSignUp }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login({ email: email.trim(), password });
      if (result?.deletionCanceled) {
        sessionStorage.setItem('tutorme_deletion_canceled', 'true');
      }
      onClose();
      navigate('/home');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t('login.errorDefault')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-white/20 dark:bg-gray-900/40 backdrop-blur-md transition-opacity" onClick={onClose}>
      <div className="bg-yellow-50/90 dark:bg-gray-800/90 backdrop-blur-xl p-5 sm:p-8 md:p-10 rounded-2xl shadow-[0_20px_50px_-12px_rgba(234,179,8,0.3)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-yellow-200 dark:border-gray-700 max-w-md w-[calc(100vw-1.5rem)] sm:w-full max-h-[90vh] overflow-y-auto relative transform rotate-1 hover:rotate-0 transition-transform duration-300" onClick={(e) => e.stopPropagation()}>
        
        {/* Tape detail */}
        <div className="absolute top-0 left-1/2 w-20 sm:w-24 h-6 sm:h-8 bg-yellow-400/40 dark:bg-yellow-500/40 -translate-x-1/2 -translate-y-3 sm:-translate-y-4 rounded-sm transform -rotate-2 backdrop-blur-md border border-yellow-200/50 dark:border-yellow-700/50"></div>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-yellow-600 dark:text-gray-400 hover:text-yellow-900 dark:hover:text-gray-100 font-bold font-['Kalam',cursive] text-xl sm:text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-yellow-200/50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-gray-500"
          aria-label={t('common.close')}
        >
          X
        </button>

        <h2 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 font-['Kalam',cursive] text-yellow-900 dark:text-yellow-300 text-center">{t('login.title')}</h2>
        
        <form className="space-y-4 sm:space-y-5 font-['Nunito',sans-serif]" onSubmit={handleSubmit}>
          <div>
            <label className="block text-yellow-900 dark:text-gray-300 font-bold mb-1.5 sm:mb-2 text-xs sm:text-sm tracking-wide uppercase">{t('login.email')}</label>
            <input 
              type="email" 
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 border border-yellow-300/50 dark:border-gray-600 bg-white/70 dark:bg-gray-900/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500 focus:border-transparent transition-shadow font-medium shadow-inner text-gray-800 dark:text-gray-100 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="student@example.com"
            />
          </div>
          <div className="relative">
            <label className="block text-yellow-900 dark:text-gray-300 font-bold mb-1.5 sm:mb-2 text-xs sm:text-sm tracking-wide uppercase">{t('login.password')}</label>
            <input 
              type={isPasswordVisible ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 pr-12 border border-yellow-300/50 dark:border-gray-600 bg-white/70 dark:bg-gray-900/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500 focus:border-transparent transition-shadow font-medium shadow-inner text-gray-800 dark:text-gray-100 text-sm sm:text-base placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              className="absolute bottom-0 right-0 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center text-yellow-700 hover:text-yellow-950 dark:text-gray-400 dark:hover:text-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              aria-label={isPasswordVisible ? t('login.hidePassword') : t('login.showPassword')}
            >
              {isPasswordVisible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
            </button>
          </div>
          {error && <p role="alert" className="rounded-xl border-2 border-red-300 bg-red-50 px-3.5 sm:px-4 py-2.5 sm:py-3 font-bold text-xs sm:text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          <button 
            disabled={isSubmitting}
            type="submit" 
            className="w-full mt-6 sm:mt-8 bg-yellow-400 hover:bg-yellow-500 disabled:cursor-wait disabled:opacity-70 text-yellow-950 font-bold py-3.5 sm:py-4 px-6 rounded-xl shadow-[0_8px_20px_-6px_rgba(234,179,8,0.6)] dark:shadow-[0_8px_20px_-6px_rgba(234,179,8,0.2)] transform transition hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-yellow-400/50 font-['Kalam',cursive] text-xl sm:text-2xl tracking-wide"
          >
            {isSubmitting ? t('login.loggingInBtn') : t('login.loginBtn')}
          </button>
          <div className="mt-4 text-center font-['Nunito',sans-serif] text-xs sm:text-sm text-yellow-900/80 dark:text-gray-300">
            {t('login.noAccount')}{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToSignUp?.();
              }}
              className="font-bold text-yellow-800 hover:text-yellow-950 dark:text-yellow-400 dark:hover:text-yellow-300 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-sm"
            >
              {t('login.signUpLink')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
