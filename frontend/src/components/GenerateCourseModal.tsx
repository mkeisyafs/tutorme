import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, ChevronDown, FileQuestion, Hourglass, ImagePlus, Square, Paperclip, FileText } from 'lucide-react';

interface GenerateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  referenceFile?: File | null;
}

const GenerateCourseModal: React.FC<GenerateCourseModalProps> = ({ isOpen, onClose, initialTopic = '', referenceFile = null }) => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [familiarity, setFamiliarity] = useState('Beginner');
  const [language, setLanguage] = useState('English');
  const [openDropdown, setOpenDropdown] = useState<'familiarity' | 'language' | null>(null);
  const [enableEssayQuestions, setEnableEssayQuestions] = useState(true);
  const [requireImageSubmission, setRequireImageSubmission] = useState(false);
  const [quizLength, setQuizLength] = useState('Random');
  const [isQuizLengthOpen, setIsQuizLengthOpen] = useState(false);
  const [courseTopic, setCourseTopic] = useState(initialTopic);
  const [modalReferenceFile, setModalReferenceFile] = useState<File | null>(referenceFile);
  const [draftId, setDraftId] = useState<string | null>(null);
  const totalSteps = modalReferenceFile ? 6 : 5;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsGenerating(false);
      setLoadingStep(0);
      setOpenDropdown(null);
      setCourseTopic(initialTopic);
      setIsQuizLengthOpen(false);
      setModalReferenceFile(referenceFile);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isGenerating && loadingStep < totalSteps) {
      timer = setTimeout(() => {
        setLoadingStep(prev => prev + 1);
      }, 1000); 
    } else if (isGenerating && loadingStep === totalSteps && draftId) {
      timer = setTimeout(() => {
        onClose();
        // Pass draftId via state to the roadmap/editor page
        navigate('/roadmap', { state: { draftId } });
      }, 800);
    }
    return () => clearTimeout(timer);
  }, [isGenerating, loadingStep, totalSteps, onClose, navigate, draftId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    localStorage.setItem('tutorme-course-quiz-settings', JSON.stringify({ enableEssayQuestions, requireImageSubmission: enableEssayQuestions && requireImageSubmission, quizLength })); 
    setIsGenerating(true); 

    try {
      // Mock user ID until auth is implemented
      const userId = "00000000-0000-0000-0000-000000000000"; 
      
      const res = await fetch("http://localhost:5000/api/generation/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          topic: courseTopic,
          familiarity,
          language
        })
      });
      
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setDraftId(data.draftId);
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      alert("Failed to generate course. Please try again.");
    }
  };

  if (!isOpen) return null;

  const steps = [
    "Understanding your current skill level",
    ...(modalReferenceFile ? [`Preparing ${modalReferenceFile.name} as your reference`] : []),
    "Identifying your learning goals",
    "Designing your learning roadmap...",
    "Estimating your study timeline",
    "Selecting the best learning resources"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 dark:bg-gray-900/40 backdrop-blur-md transition-opacity" onClick={!isGenerating ? onClose : undefined}>
      <div className={`relative max-w-2xl w-full max-h-[90vh] flex flex-col transform ${isGenerating ? 'scale-105' : 'rotate-1 hover:rotate-0'} transition-all duration-300`} onClick={(e) => e.stopPropagation()}>
        
        {/* Tape detail */}
        <div className="absolute top-0 left-1/2 w-24 h-8 bg-pink-400/40 dark:bg-pink-500/40 -translate-x-1/2 -translate-y-4 rounded-sm transform -rotate-2 backdrop-blur-md border border-pink-200/50 dark:border-pink-700/50 pointer-events-none z-20"></div>

        <div className="bg-pink-50/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-[8px_8px_0px_0px_rgba(236,72,153,1)] dark:shadow-[8px_8px_0px_0px_rgba(157,23,77,0.8)] border-4 border-pink-400 dark:border-pink-700 w-full flex flex-col relative overflow-hidden">
          
          {/* Close Button */}
          {!isGenerating && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-pink-600 dark:text-gray-400 hover:text-pink-900 dark:hover:text-gray-100 font-bold font-['Kalam',cursive] text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-pink-200/50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-gray-500 z-30"
              aria-label="Close"
            >
              X
            </button>
          )}

          <div className="p-8 md:p-10 overflow-y-auto max-h-[90vh] relative z-10">
            {!isGenerating ? (
              <>
                <h2 className="text-4xl font-bold mb-8 font-['Kalam',cursive] text-pink-900 dark:text-pink-300 text-center flex items-center justify-center gap-3 mt-2">
                  <Sparkles className="w-8 h-8 fill-pink-500 text-pink-500" />
                  Magic Course
                </h2>
            
            <form className="space-y-6 font-['Nunito',sans-serif]" onSubmit={handleSubmit}>
              <div>
                <label className="block text-pink-900 dark:text-gray-300 font-bold mb-2 text-sm tracking-wide uppercase">What course do you want to learn?</label>
                <input 
                  type="text" 
                  value={courseTopic}
                  onChange={(event) => setCourseTopic(event.target.value)}
                  className="w-full px-4 py-3 border border-pink-300/50 dark:border-gray-600 bg-white/70 dark:bg-gray-900/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500 focus:border-transparent transition-shadow font-medium shadow-inner text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder={modalReferenceFile ? 'Course based on attached reference' : 'e.g. Python for Beginners'}
                />
                {modalReferenceFile && <p className="mt-2 flex items-center gap-2 text-sm font-bold text-pink-700 dark:text-pink-300">Attached reference: {modalReferenceFile.name}</p>}
              </div>

              <div>
                <label className="block text-pink-900 dark:text-gray-300 font-bold mb-2 text-sm tracking-wide uppercase">How familiar are you with this skill?</label>
                <div className="relative">
                  <button type="button" aria-haspopup="listbox" aria-expanded={openDropdown === 'familiarity'} onClick={() => setOpenDropdown(openDropdown === 'familiarity' ? null : 'familiarity')} className={`flex w-full items-center justify-between rounded-xl border bg-white/70 px-4 py-3 text-left font-medium text-gray-800 shadow-inner transition-shadow focus:outline-none focus:ring-2 focus:ring-pink-400 dark:border-gray-600 dark:bg-gray-900/70 dark:text-gray-100 dark:focus:ring-pink-500 ${openDropdown === 'familiarity' ? 'border-pink-500' : 'border-pink-300/50'}`}>
                    {familiarity}<ChevronDown className={`h-5 w-5 text-pink-500 transition-transform ${openDropdown === 'familiarity' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'familiarity' && <div role="listbox" aria-label="Skill familiarity" className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border-2 border-pink-300 bg-white shadow-[4px_4px_0_rgba(236,72,153,.25)] dark:border-pink-700 dark:bg-gray-800">
                    {['Beginner', 'Basic', 'Intermediate', 'Expert'].map((option) => <button key={option} type="button" role="option" aria-selected={familiarity === option} onClick={() => { setFamiliarity(option); setOpenDropdown(null); }} className={`flex w-full items-center justify-between px-4 py-2.5 text-left font-medium transition-colors ${familiarity === option ? 'bg-pink-500 text-white' : 'text-gray-800 hover:bg-pink-100 dark:text-gray-100 dark:hover:bg-pink-900/40'}`}>{option}{familiarity === option && <Check className="h-4 w-4" />}</button>)}
                  </div>}
                </div>
              </div>
              <div>
                <label className="block text-pink-900 dark:text-gray-300 font-bold mb-2 text-sm tracking-wide uppercase">Language</label>
                <div className="relative">
                  <button type="button" aria-haspopup="listbox" aria-expanded={openDropdown === 'language'} onClick={() => setOpenDropdown(openDropdown === 'language' ? null : 'language')} className={`flex w-full items-center justify-between rounded-xl border bg-white/70 px-4 py-3 text-left font-medium text-gray-800 shadow-inner transition-shadow focus:outline-none focus:ring-2 focus:ring-pink-400 dark:border-gray-600 dark:bg-gray-900/70 dark:text-gray-100 dark:focus:ring-pink-500 ${openDropdown === 'language' ? 'border-pink-500' : 'border-pink-300/50'}`}>
                    {language}<ChevronDown className={`h-5 w-5 text-pink-500 transition-transform ${openDropdown === 'language' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'language' && <div role="listbox" aria-label="Course language" className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border-2 border-pink-300 bg-white shadow-[4px_4px_0_rgba(236,72,153,.25)] dark:border-pink-700 dark:bg-gray-800">
                    {['English', 'Indonesian'].map((option) => <button key={option} type="button" role="option" aria-selected={language === option} onClick={() => { setLanguage(option); setOpenDropdown(null); }} className={`flex w-full items-center justify-between px-4 py-2.5 text-left font-medium transition-colors ${language === option ? 'bg-pink-500 text-white' : 'text-gray-800 hover:bg-pink-100 dark:text-gray-100 dark:hover:bg-pink-900/40'}`}>{option}{language === option && <Check className="h-4 w-4" />}</button>)}
                  </div>}
                </div>
              </div>
              <section className="rounded-2xl border-2 border-pink-300/70 bg-white/50 p-5 dark:border-pink-700 dark:bg-gray-900/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div><h3 className="flex items-center gap-2 font-['Kalam',cursive] text-2xl font-bold text-pink-900 dark:text-pink-200"><FileQuestion className="h-6 w-6" /> Course quiz settings</h3><p className="mt-1 text-sm font-semibold text-pink-800 dark:text-pink-300">TutorMe automatically generates a fresh quiz for every lesson from these rules.</p></div>
                </div>
                <div className="mt-5 space-y-3">
                  <button type="button" aria-pressed={enableEssayQuestions} onClick={() => { setEnableEssayQuestions((enabled) => !enabled); if (enableEssayQuestions) setRequireImageSubmission(false); }} className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-colors ${enableEssayQuestions ? 'border-pink-400 bg-pink-100/70 dark:bg-pink-900/35' : 'border-gray-300 bg-white/70 dark:border-gray-600 dark:bg-gray-800/60'}`}><span><span className="block font-bold text-gray-900 dark:text-gray-100">Enable Essay Questions</span><span className="mt-0.5 block text-sm font-semibold text-gray-600 dark:text-gray-300">Include written-response questions in generated quizzes.</span></span><span className={`rounded-full px-3 py-1 text-sm font-bold ${enableEssayQuestions ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{enableEssayQuestions ? 'On' : 'Off'}</span></button>
                  <button type="button" disabled={!enableEssayQuestions} aria-pressed={requireImageSubmission} onClick={() => setRequireImageSubmission((required) => !required)} className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${requireImageSubmission ? 'border-pink-400 bg-pink-100/70 dark:bg-pink-900/35' : 'border-gray-300 bg-white/70 dark:border-gray-600 dark:bg-gray-800/60'}`}><span><span className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100"><ImagePlus className="h-5 w-5 text-pink-500" /> Require Image Submission</span><span className="mt-0.5 block text-sm font-semibold text-gray-600 dark:text-gray-300">Essay answers must include an image. Images stay unavailable when disabled.</span></span><span className={`rounded-full px-3 py-1 text-sm font-bold ${requireImageSubmission ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{requireImageSubmission ? 'Required' : 'Not required'}</span></button>
                  <div className="relative rounded-xl border-2 border-gray-300 bg-white/70 p-4 dark:border-gray-600 dark:bg-gray-800/60"><p className="font-bold text-gray-900 dark:text-gray-100">Quiz Length</p><p className="mt-0.5 text-sm font-semibold text-gray-600 dark:text-gray-300">Choose a fixed number or let TutorMe determine an appropriate length.</p><button type="button" aria-haspopup="listbox" aria-expanded={isQuizLengthOpen} onClick={() => setIsQuizLengthOpen((isOpen) => !isOpen)} className="mt-3 flex w-full items-center justify-between rounded-lg border-2 border-pink-200 bg-white px-3 py-2.5 font-bold text-gray-800 dark:border-pink-700 dark:bg-gray-900 dark:text-gray-100"><span>{quizLength}</span><ChevronDown className={`h-5 w-5 text-pink-500 transition-transform ${isQuizLengthOpen ? 'rotate-180' : ''}`} /></button>{isQuizLengthOpen && <div role="listbox" className="absolute z-40 mt-1 w-[calc(100%-2rem)] overflow-hidden rounded-lg border-2 border-pink-300 bg-white shadow-lg dark:border-pink-700 dark:bg-gray-800">{['3 questions', '5 questions', '8 questions', 'Random'].map((option) => <button key={option} type="button" role="option" aria-selected={quizLength === option} onClick={() => { setQuizLength(option); setIsQuizLengthOpen(false); }} className={`flex w-full items-center justify-between px-3 py-2.5 text-left font-bold ${quizLength === option ? 'bg-pink-500 text-white' : 'text-gray-800 hover:bg-pink-100 dark:text-gray-100 dark:hover:bg-pink-900/40'}`}>{option}{quizLength === option && <Check className="h-4 w-4" />}</button>)}</div>}</div>
                </div>
              </section>
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
      </div>
    </div>
  );
};

export default GenerateCourseModal;
