import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface GenerateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GenerateCourseModal: React.FC<GenerateCourseModalProps> = ({ isOpen, onClose }) => {
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
      <div className="bg-pink-50/90 dark:bg-gray-800/90 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-[0_20px_50px_-12px_rgba(236,72,153,0.3)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-pink-200 dark:border-gray-700 max-w-lg w-full relative transform rotate-1 hover:rotate-0 transition-transform duration-300" onClick={(e) => e.stopPropagation()}>
        
        {/* Tape detail */}
        <div className="absolute top-0 left-1/2 w-24 h-8 bg-pink-400/40 dark:bg-pink-500/40 -translate-x-1/2 -translate-y-4 rounded-sm transform -rotate-2 backdrop-blur-md border border-pink-200/50 dark:border-pink-700/50 pointer-events-none"></div>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-pink-600 dark:text-gray-400 hover:text-pink-900 dark:hover:text-gray-100 font-bold font-['Kalam',cursive] text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-pink-200/50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-gray-500"
          aria-label="Close"
        >
          X
        </button>

        <h2 className="text-4xl font-bold mb-8 font-['Kalam',cursive] text-pink-900 dark:text-pink-300 text-center flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 fill-pink-500 text-pink-500" />
          Magic Course
        </h2>
        
        <form className="space-y-6 font-['Nunito',sans-serif]" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          <div>
            <label className="block text-pink-900 dark:text-gray-300 font-bold mb-2 text-sm tracking-wide uppercase">What course do you want to learn?</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border border-pink-300/50 dark:border-gray-600 bg-white/70 dark:bg-gray-900/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500 focus:border-transparent transition-shadow font-medium shadow-inner text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="e.g. Python for Beginners"
            />
          </div>
          <div>
            <label className="block text-pink-900 dark:text-gray-300 font-bold mb-2 text-sm tracking-wide uppercase">How familiar are you with this skill?</label>
            <div className="relative">
              <select 
                className="w-full px-4 py-3 border border-pink-300/50 dark:border-gray-600 bg-white/70 dark:bg-gray-900/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500 focus:border-transparent transition-shadow font-medium shadow-inner text-gray-800 dark:text-gray-100 appearance-none cursor-pointer"
              >
                <option value="beginner">Beginner</option>
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-pink-500 font-bold">
                ▼
              </div>
            </div>
          </div>
          <div>
            <label className="block text-pink-900 dark:text-gray-300 font-bold mb-2 text-sm tracking-wide uppercase">Language</label>
            <div className="relative">
              <select 
                className="w-full px-4 py-3 border border-pink-300/50 dark:border-gray-600 bg-white/70 dark:bg-gray-900/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500 focus:border-transparent transition-shadow font-medium shadow-inner text-gray-800 dark:text-gray-100 appearance-none cursor-pointer"
              >
                <option value="english">English</option>
                <option value="indonesian">Indonesian</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-pink-500 font-bold">
                ▼
              </div>
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full mt-8 bg-pink-400 dark:bg-pink-500 hover:bg-pink-500 dark:hover:bg-pink-600 text-white font-bold py-4 px-6 rounded-xl shadow-[0_8px_20px_-6px_rgba(236,72,153,0.6)] dark:shadow-[0_8px_20px_-6px_rgba(236,72,153,0.2)] transform transition hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-pink-400/50 font-['Kalam',cursive] text-2xl tracking-wide flex justify-center items-center gap-3 border-2 border-pink-600 dark:border-pink-700"
          >
            Generate Curriculum <Sparkles className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default GenerateCourseModal;
