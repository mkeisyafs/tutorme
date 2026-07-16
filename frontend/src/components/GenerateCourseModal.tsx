import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, Hourglass, Square } from 'lucide-react';

interface GenerateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GenerateCourseModal: React.FC<GenerateCourseModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsGenerating(false);
      setLoadingStep(0);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isGenerating && loadingStep < 5) {
      timer = setTimeout(() => {
        setLoadingStep(prev => prev + 1);
      }, 1000); 
    } else if (isGenerating && loadingStep === 5) {
      timer = setTimeout(() => {
        onClose();
        navigate('/roadmap');
      }, 800);
    }
    return () => clearTimeout(timer);
  }, [isGenerating, loadingStep, onClose, navigate]);

  if (!isOpen) return null;

  const steps = [
    "Understanding your current skill level",
    "Identifying your learning goals",
    "Designing your learning roadmap...",
    "Estimating your study timeline",
    "Selecting the best learning resources"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 dark:bg-gray-900/40 backdrop-blur-md transition-opacity" onClick={!isGenerating ? onClose : undefined}>
      <div className={`bg-pink-50/90 dark:bg-gray-800/90 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-[8px_8px_0px_0px_rgba(236,72,153,1)] dark:shadow-[8px_8px_0px_0px_rgba(157,23,77,0.8)] border-4 border-pink-400 dark:border-pink-700 max-w-lg w-full relative transform ${isGenerating ? 'scale-105' : 'rotate-1 hover:rotate-0'} transition-all duration-300 overflow-hidden`} onClick={(e) => e.stopPropagation()}>
        
        {/* Tape detail */}
        <div className="absolute top-0 left-1/2 w-24 h-8 bg-pink-400/40 dark:bg-pink-500/40 -translate-x-1/2 -translate-y-4 rounded-sm transform -rotate-2 backdrop-blur-md border border-pink-200/50 dark:border-pink-700/50 pointer-events-none z-10"></div>
        
        {/* Close Button */}
        {!isGenerating && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-pink-600 dark:text-gray-400 hover:text-pink-900 dark:hover:text-gray-100 font-bold font-['Kalam',cursive] text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-pink-200/50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-gray-500 z-20"
            aria-label="Close"
          >
            X
          </button>
        )}

        {!isGenerating ? (
          <>
            <h2 className="text-4xl font-bold mb-8 font-['Kalam',cursive] text-pink-900 dark:text-pink-300 text-center flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 fill-pink-500 text-pink-500" />
              Magic Course
            </h2>
            
            <form className="space-y-6 font-['Nunito',sans-serif]" onSubmit={(e) => { e.preventDefault(); setIsGenerating(true); }}>
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
                className="w-full mt-8 bg-pink-400 dark:bg-pink-500 hover:bg-pink-500 dark:hover:bg-pink-600 text-white font-bold py-4 px-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(190,24,93,1)] dark:shadow-[4px_4px_0px_0px_rgba(157,23,77,1)] active:translate-y-1 active:shadow-none transform transition focus:outline-none focus:ring-4 focus:ring-pink-400/50 font-['Kalam',cursive] text-2xl tracking-wide flex justify-center items-center gap-3 border-2 border-pink-600 dark:border-pink-700"
              >
                Generate Curriculum <Sparkles className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="py-6 px-2 flex flex-col items-center">
            <h2 className="text-3xl font-bold mb-10 font-['Nunito',sans-serif] text-gray-900 dark:text-gray-100 text-center leading-tight">
              Creating your personalized course
            </h2>
            <div className="space-y-6 font-['Nunito',sans-serif] font-bold text-lg text-gray-700 dark:text-gray-300 w-full">
              {steps.map((step, idx) => {
                const isCompleted = idx < loadingStep;
                const isCurrent = idx === loadingStep;
                const isPending = idx > loadingStep;
                
                return (
                  <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${isCurrent ? 'scale-105 transform translate-x-2 text-pink-600 dark:text-pink-400 origin-left' : isCompleted ? 'opacity-80' : 'opacity-40'}`}>
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      {isCompleted && <Check className="w-6 h-6 text-green-500" strokeWidth={3} />}
                      {isCurrent && <Hourglass className="w-6 h-6 text-pink-500 animate-pulse" strokeWidth={2.5} />}
                      {isPending && <Square className="w-5 h-5 text-gray-400" strokeWidth={3} />}
                    </div>
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Fun background graphic when generating */}
            <div className="absolute -bottom-8 -right-8 opacity-20 pointer-events-none">
              <Sparkles className="w-40 h-40 fill-pink-500 text-pink-500 animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateCourseModal;
