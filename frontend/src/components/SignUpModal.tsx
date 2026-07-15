import React, { useEffect } from 'react';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignUpModal: React.FC<SignUpModalProps> = ({ isOpen, onClose }) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 dark:bg-gray-900/40 backdrop-blur-md transition-opacity" onClick={onClose}>
      <div className="bg-green-50/90 dark:bg-gray-800/90 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-[0_20px_50px_-12px_rgba(34,197,94,0.3)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-green-200 dark:border-gray-700 max-w-md w-full relative transform -rotate-1 hover:rotate-0 transition-transform duration-300" onClick={(e) => e.stopPropagation()}>
        
        {/* Tape detail */}
        <div className="absolute top-0 left-1/2 w-24 h-8 bg-green-400/40 dark:bg-green-500/40 -translate-x-1/2 -translate-y-4 rounded-sm transform rotate-2 backdrop-blur-md border border-green-200/50 dark:border-green-700/50"></div>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-green-600 dark:text-gray-400 hover:text-green-900 dark:hover:text-gray-100 font-bold font-['Kalam',cursive] text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-green-200/50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-green-400 dark:focus:ring-gray-500"
          aria-label="Close"
        >
          X
        </button>

        <h2 className="text-4xl font-bold mb-8 font-['Kalam',cursive] text-green-900 dark:text-green-300 text-center">Join TutorMe!</h2>
        
        <form className="space-y-5 font-['Nunito',sans-serif]" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-green-900 dark:text-gray-300 font-bold mb-2 text-sm tracking-wide uppercase">Full Name</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border border-green-300/50 dark:border-gray-600 bg-white/70 dark:bg-gray-900/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500 focus:border-transparent transition-shadow font-medium shadow-inner text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-green-900 dark:text-gray-300 font-bold mb-2 text-sm tracking-wide uppercase">Email</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 border border-green-300/50 dark:border-gray-600 bg-white/70 dark:bg-gray-900/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500 focus:border-transparent transition-shadow font-medium shadow-inner text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="student@example.com"
            />
          </div>
          <div>
            <label className="block text-green-900 dark:text-gray-300 font-bold mb-2 text-sm tracking-wide uppercase">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 border border-green-300/50 dark:border-gray-600 bg-white/70 dark:bg-gray-900/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500 focus:border-transparent transition-shadow font-medium shadow-inner text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            className="w-full mt-8 bg-green-400 hover:bg-green-500 text-green-950 font-bold py-4 px-6 rounded-xl shadow-[0_8px_20px_-6px_rgba(74,222,128,0.6)] dark:shadow-[0_8px_20px_-6px_rgba(74,222,128,0.2)] transform transition hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-green-400/50 font-['Kalam',cursive] text-2xl tracking-wide"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUpModal;
