import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { getApiErrorMessage } from '../lib/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      await login({ email: email.trim(), password });
      onClose();
      navigate('/home');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'We could not log you in. Please check your details.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 dark:bg-gray-900/40 backdrop-blur-md transition-opacity" onClick={onClose}>
      <div className="bg-yellow-50/90 dark:bg-gray-800/90 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-[0_20px_50px_-12px_rgba(234,179,8,0.3)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-yellow-200 dark:border-gray-700 max-w-md w-full relative transform rotate-1 hover:rotate-0 transition-transform duration-300" onClick={(e) => e.stopPropagation()}>
        
        {/* Tape detail */}
        <div className="absolute top-0 left-1/2 w-24 h-8 bg-yellow-400/40 dark:bg-yellow-500/40 -translate-x-1/2 -translate-y-4 rounded-sm transform -rotate-2 backdrop-blur-md border border-yellow-200/50 dark:border-yellow-700/50"></div>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-yellow-600 dark:text-gray-400 hover:text-yellow-900 dark:hover:text-gray-100 font-bold font-['Kalam',cursive] text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-yellow-200/50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-gray-500"
          aria-label="Close"
        >
          X
        </button>

        <h2 className="text-4xl font-bold mb-8 font-['Kalam',cursive] text-yellow-900 dark:text-yellow-300 text-center">Welcome Back!</h2>
        
        <form className="space-y-5 font-['Nunito',sans-serif]" onSubmit={handleSubmit}>
          <div>
            <label className="block text-yellow-900 dark:text-gray-300 font-bold mb-2 text-sm tracking-wide uppercase">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full px-4 py-3 border border-yellow-300/50 dark:border-gray-600 bg-white/70 dark:bg-gray-900/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500 focus:border-transparent transition-shadow font-medium shadow-inner text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="student@example.com"
            />
          </div>
          <div>
            <label className="block text-yellow-900 dark:text-gray-300 font-bold mb-2 text-sm tracking-wide uppercase">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full px-4 py-3 border border-yellow-300/50 dark:border-gray-600 bg-white/70 dark:bg-gray-900/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500 focus:border-transparent transition-shadow font-medium shadow-inner text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="••••••••"
            />
          </div>
          {error && <p role="alert" className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 font-bold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          <button 
            disabled={isSubmitting}
            type="submit" 
            className="w-full mt-8 bg-yellow-400 hover:bg-yellow-500 disabled:cursor-wait disabled:opacity-70 text-yellow-950 font-bold py-4 px-6 rounded-xl shadow-[0_8px_20px_-6px_rgba(234,179,8,0.6)] dark:shadow-[0_8px_20px_-6px_rgba(234,179,8,0.2)] transform transition hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-yellow-400/50 font-['Kalam',cursive] text-2xl tracking-wide"
          >
            {isSubmitting ? 'Logging In…' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
