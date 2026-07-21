import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, ChevronDown, FileQuestion, Hourglass, ImagePlus, Square, Minimize2 } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import Switch from './Switch';
import { useCourseGeneration } from '../context/CourseGenerationContext';

const GenerateCourseModal: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    isOpen,
    isGenerating,
    loadingStep,
    totalSteps,
    topic,
    isMinimized,
    errorMessage,
    draftId,
    initialTopic,
    referenceFile: contextReferenceFile,
    closeModal,
    minimize,
    maximize,
    reset,
    startGeneration,
    cancelGeneration,

    // Publishing
    isPublishing,
    publishStep,
    publishCourseTitle,
    isPublishMinimized,
    publishCourseId,
    publishFirstLessonId,
    minimizePublish,
    maximizePublish,
    resetPublish,
    cancelPublish
  } = useCourseGeneration();

  const [familiarity, setFamiliarity] = useState('Beginner');
  const [language, setLanguage] = useState('');
  const [openDropdown, setOpenDropdown] = useState<'familiarity' | null>(null);
  const [enableEssayQuestions, setEnableEssayQuestions] = useState(true);
  const [requireImageSubmission, setRequireImageSubmission] = useState(false);
  const [quizLength, setQuizLength] = useState('Random');
  const [isQuizLengthOpen, setIsQuizLengthOpen] = useState(false);
  const [courseTopic, setCourseTopic] = useState('');
  const [modalReferenceFile, setModalReferenceFile] = useState<File | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Sync with context initial topic and reference file when opened
  useEffect(() => {
    if (isOpen) {
      if (!hasInitialized) {
        setCourseTopic(initialTopic);
        setModalReferenceFile(contextReferenceFile);
        setOpenDropdown(null);
        setIsQuizLengthOpen(false);
        setHasInitialized(true);
      }
    } else {
      setHasInitialized(false);
    }
  }, [isOpen, hasInitialized, initialTopic, contextReferenceFile]);

  // Handle redirect when course generation succeeds
  useEffect(() => {
    if (draftId) {
      navigate(`/drafts/${encodeURIComponent(draftId)}`);
      reset();
    }
  }, [draftId, navigate, reset]);

  // Handle redirect when course publishing succeeds
  useEffect(() => {
    if (publishCourseId && publishFirstLessonId) {
      navigate(`/courses/${encodeURIComponent(publishCourseId)}/lessons/${encodeURIComponent(publishFirstLessonId)}`);
      resetPublish();
    }
  }, [publishCourseId, publishFirstLessonId, navigate, resetPublish]);

  // Lock body scroll when modal or publishing overlay is active and not minimized
  useEffect(() => {
    const shouldLock = (isOpen && !isMinimized) || (isPublishing && !isPublishMinimized);
    if (shouldLock) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isMinimized, isPublishing, isPublishMinimized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const topicName = courseTopic.trim();
    if (!topicName) {
      return;
    }

    if (!user?.id) {
      return;
    }

    // Save preferences
    localStorage.setItem(
      'tutorme-course-quiz-settings',
      JSON.stringify({
        enableEssayQuestions,
        requireImageSubmission: enableEssayQuestions && requireImageSubmission,
        quizLength
      })
    );

    await startGeneration(user.id, topicName, familiarity, language, modalReferenceFile);
  };

  // Rendering for Publishing minimized state
  if (isPublishing && isPublishMinimized) {
    const percent = Math.min(100, Math.round((publishStep / 2) * 100));

    return (
      <div
        onClick={maximizePublish}
        className="fixed bottom-6 right-6 z-50 bg-white/95 dark:bg-gray-800/95 border-2 border-pink-400 dark:border-pink-600 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center gap-4 cursor-pointer hover:-translate-y-1 hover:shadow-pink-400/20 active:translate-y-0 active:scale-95 transition-all duration-300 max-w-xs sm:max-w-sm w-76 font-['Nunito',sans-serif] select-none border-dashed"
      >
        <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-900/40 text-pink-500">
          <Hourglass className="w-5 h-5 text-pink-500 animate-spin" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs font-extrabold text-pink-500 uppercase tracking-wider">Preparing Course</p>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {publishStep + 1}/3
            </span>
          </div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{publishCourseTitle || 'Your Course'}</p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-pink-500 dark:bg-pink-400 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    );
  }

  // Rendering for Publishing full-screen overlay state
  if (isPublishing && !isPublishMinimized) {
    const steps = [
      "Saving your curriculum",
      "Generating the first lesson",
      "Finalizing course setup"
    ];

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 dark:bg-gray-900/40 backdrop-blur-md transition-opacity"
        onClick={minimizePublish}
      >
        <div
          className="relative max-w-2xl w-full flex flex-col transform scale-105 transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Tape detail */}
          <div className="absolute top-0 left-1/2 w-24 h-8 bg-pink-400/40 dark:bg-pink-500/40 -translate-x-1/2 -translate-y-4 rounded-sm transform -rotate-2 backdrop-blur-md border border-pink-200/50 dark:border-pink-700/50 pointer-events-none z-20"></div>

          <div className="bg-pink-50/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-[8px_8px_0px_0px_rgba(236,72,153,1)] dark:shadow-[8px_8px_0px_0px_rgba(157,23,77,0.8)] border-4 border-pink-400 dark:border-pink-700 w-full flex flex-col relative overflow-hidden">
            {/* Minimize Button */}
            <button
              onClick={minimizePublish}
              className="absolute top-4 right-4 text-pink-600 dark:text-gray-400 hover:text-pink-900 dark:hover:text-gray-100 font-bold transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-pink-200/50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-gray-500 z-30"
              aria-label="Minimize"
              type="button"
            >
              <Minimize2 className="w-5 h-5 text-pink-500 dark:text-gray-400" />
            </button>

            <div className="p-8 md:p-10 relative z-10 py-6 px-2 flex flex-col items-center">
              <h2 className="text-3xl font-bold mb-10 font-['Nunito',sans-serif] text-gray-900 dark:text-gray-100 text-center leading-tight">
                Preparing your course...
              </h2>
              <div className="space-y-6 font-['Nunito',sans-serif] font-bold text-lg text-gray-700 dark:text-gray-300 w-full">
                {steps.map((step, idx) => {
                  const isCompleted = idx < publishStep;
                  const isCurrent = idx === publishStep;
                  const isPending = idx > publishStep;

                  return (
                    <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${isCurrent ? 'scale-105 transform translate-x-2 text-pink-600 dark:text-pink-400 origin-left' : isCompleted ? 'opacity-80' : 'opacity-40'}`}>
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                        {isCompleted && <Check className="w-6 h-6 text-green-500" strokeWidth={3} />}
                        {isCurrent && <Hourglass className="w-6 h-6 text-pink-500 animate-spin" strokeWidth={2.5} />}
                        {isPending && <Square className="w-5 h-5 text-gray-400" strokeWidth={3} />}
                      </div>
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={cancelPublish}
                className="mt-8 px-6 py-2 rounded-xl font-bold font-['Kalam',cursive] text-lg border-2 border-red-500 bg-red-100 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 hover:bg-red-250 dark:hover:bg-red-900/40 transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_rgba(239,68,68,0.3)] active:translate-y-0.5 active:shadow-none z-10"
              >
                Cancel Publishing
              </button>

              {/* Fun background graphic when generating */}
              <div className="absolute -bottom-8 -right-8 opacity-20 pointer-events-none">
                <Sparkles className="w-40 h-40 fill-pink-500 text-pink-500 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  // Minimized state view for course generation
  if (isMinimized) {
    if (!isGenerating) return null;

    const percent = Math.min(100, Math.round((loadingStep / (totalSteps - 1)) * 100));

    return (
      <div
        onClick={maximize}
        className="fixed bottom-6 right-6 z-50 bg-white/95 dark:bg-gray-800/95 border-2 border-pink-400 dark:border-pink-600 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center gap-4 cursor-pointer hover:-translate-y-1 hover:shadow-pink-400/20 active:translate-y-0 active:scale-95 transition-all duration-300 max-w-xs sm:max-w-sm w-76 font-['Nunito',sans-serif] select-none border-dashed"
      >
        <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-900/40 text-pink-500">
          <Hourglass className="w-5 h-5 text-pink-500 animate-spin" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs font-extrabold text-pink-500 uppercase tracking-wider">Generating Course</p>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {loadingStep + 1}/{totalSteps}
            </span>
          </div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{topic || 'Personalized Course'}</p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-pink-500 dark:bg-pink-400 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    "Understanding your current skill level",
    ...(modalReferenceFile ? [`Preparing ${modalReferenceFile.name} as your reference`] : []),
    "Identifying your learning goals",
    "Designing your learning roadmap...",
    "Estimating your study timeline",
    "Selecting the best learning resources"
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 dark:bg-gray-900/40 backdrop-blur-md transition-opacity"
      onClick={!isGenerating ? closeModal : minimize}
    >
      <div
        className={`relative max-w-2xl w-full max-h-[90vh] flex flex-col transform ${isGenerating ? 'scale-105' : 'rotate-1 hover:rotate-0'} transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tape detail */}
        <div className="absolute top-0 left-1/2 w-24 h-8 bg-pink-400/40 dark:bg-pink-500/40 -translate-x-1/2 -translate-y-4 rounded-sm transform -rotate-2 backdrop-blur-md border border-pink-200/50 dark:border-pink-700/50 pointer-events-none z-20"></div>

        <div className="bg-pink-50/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-[8px_8px_0px_0px_rgba(236,72,153,1)] dark:shadow-[8px_8px_0px_0px_rgba(157,23,77,0.8)] border-4 border-pink-400 dark:border-pink-700 w-full flex flex-col relative overflow-hidden">
          {/* Close/Minimize Button */}
          {isGenerating ? (
            <button
              onClick={minimize}
              className="absolute top-4 right-4 text-pink-600 dark:text-gray-400 hover:text-pink-900 dark:hover:text-gray-100 font-bold transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-pink-200/50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-gray-500 z-30"
              aria-label="Minimize"
              type="button"
            >
              <Minimize2 className="w-5 h-5 text-pink-500 dark:text-gray-400" />
            </button>
          ) : (
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-pink-600 dark:text-gray-400 hover:text-pink-900 dark:hover:text-gray-100 font-bold font-['Kalam',cursive] text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-pink-200/50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-gray-500 z-30"
              aria-label="Close"
              type="button"
            >
              X
            </button>
          )}

          <div className={`p-8 md:p-10 ${isGenerating ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'} max-h-[90vh] relative z-10`}>
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
                      required
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
                      {openDropdown === 'familiarity' && (
                        <div role="listbox" aria-label="Skill familiarity" className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border-2 border-pink-300 bg-white shadow-[4px_4px_0_rgba(236,72,153,.25)] dark:border-pink-700 dark:bg-gray-800">
                          {['Beginner', 'Basic', 'Intermediate', 'Expert'].map((option) => (
                            <button
                              key={option}
                              type="button"
                              role="option"
                              aria-selected={familiarity === option}
                              onClick={() => { setFamiliarity(option); setOpenDropdown(null); }}
                              className={`flex w-full items-center justify-between px-4 py-2.5 text-left font-medium transition-colors ${familiarity === option ? 'bg-pink-500 text-white' : 'text-gray-800 hover:bg-pink-100 dark:text-gray-100 dark:hover:bg-pink-900/40'}`}
                            >
                              {option}
                              {familiarity === option && <Check className="h-4 w-4" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-pink-900 dark:text-gray-300 font-bold mb-2 text-sm tracking-wide uppercase">
                      Language <span className="text-xs font-normal text-pink-700 dark:text-pink-400 normal-case">(Optional - Default: English)</span>
                    </label>
                    <input
                      type="text"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      placeholder="e.g. English, Indonesian, Japanese..."
                      className="w-full px-4 py-3 border border-pink-300/50 dark:border-gray-600 bg-white/70 dark:bg-gray-900/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500 focus:border-transparent transition-shadow font-medium shadow-inner text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                  <section className="rounded-2xl border-2 border-pink-300/70 bg-white/50 p-5 dark:border-pink-700 dark:bg-gray-900/30">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="flex items-center gap-2 font-['Kalam',cursive] text-2xl font-bold text-pink-900 dark:text-pink-200"><FileQuestion className="h-6 w-6" /> Course quiz settings</h3>
                        <p className="mt-1 text-sm font-semibold text-pink-800 dark:text-pink-300">TutorMe automatically generates a fresh quiz for every lesson from these rules.</p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-3">
                      <div
                        onClick={() => {
                          const next = !enableEssayQuestions;
                          setEnableEssayQuestions(next);
                          if (!next) setRequireImageSubmission(false);
                        }}
                        className={`flex w-full items-center justify-between gap-4 rounded-xl border-2 p-4 text-left transition-colors cursor-pointer ${enableEssayQuestions ? 'border-pink-400 bg-pink-100/70 dark:bg-pink-900/35' : 'border-gray-300 bg-white/70 dark:border-gray-600 dark:bg-gray-800/60'}`}
                      >
                        <div>
                          <span className="block font-bold text-gray-900 dark:text-gray-100">Enable Essay Questions</span>
                          <span className="mt-0.5 block text-sm font-semibold text-gray-600 dark:text-gray-300">Include written-response questions in generated quizzes.</span>
                        </div>
                        <Switch
                          checked={enableEssayQuestions}
                          onChange={(checked) => {
                            setEnableEssayQuestions(checked);
                            if (!checked) setRequireImageSubmission(false);
                          }}
                          color="pink"
                          label="Enable Essay Questions"
                        />
                      </div>

                      <div
                        onClick={() => {
                          if (enableEssayQuestions) {
                            setRequireImageSubmission(!requireImageSubmission);
                          }
                        }}
                        className={`flex w-full items-center justify-between gap-4 rounded-xl border-2 p-4 text-left transition-colors ${!enableEssayQuestions ? 'cursor-not-allowed opacity-55 border-gray-300 bg-white/70 dark:border-gray-600 dark:bg-gray-800/60' : requireImageSubmission ? 'cursor-pointer border-pink-400 bg-pink-100/70 dark:bg-pink-900/35' : 'cursor-pointer border-gray-300 bg-white/70 dark:border-gray-600 dark:bg-gray-800/60'}`}
                      >
                        <div>
                          <span className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100">
                            <ImagePlus className="h-5 w-5 text-pink-500" /> Require Image Submission
                          </span>
                          <span className="mt-0.5 block text-sm font-semibold text-gray-600 dark:text-gray-300">Essay answers must include an image. Images stay unavailable when disabled.</span>
                        </div>
                        <Switch
                          checked={requireImageSubmission}
                          onChange={(checked) => setRequireImageSubmission(checked)}
                          disabled={!enableEssayQuestions}
                          color="pink"
                          label="Require Image Submission"
                        />
                      </div>
                      <div className="relative rounded-xl border-2 border-gray-300 bg-white/70 p-4 dark:border-gray-600 dark:bg-gray-800/60">
                        <p className="font-bold text-gray-900 dark:text-gray-100">Quiz Length</p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-600 dark:text-gray-300">Choose a fixed number or let TutorMe determine an appropriate length.</p>
                        <button type="button" aria-haspopup="listbox" aria-expanded={isQuizLengthOpen} onClick={() => setIsQuizLengthOpen((isOpen) => !isOpen)} className="mt-3 flex w-full items-center justify-between rounded-lg border-2 border-pink-200 bg-white px-3 py-2.5 font-bold text-gray-800 dark:border-pink-700 dark:bg-gray-900 dark:text-gray-100">
                          <span>{quizLength}</span>
                          <ChevronDown className={`h-5 w-5 text-pink-500 transition-transform ${isQuizLengthOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isQuizLengthOpen && (
                          <div role="listbox" className="absolute z-40 mt-1 w-[calc(100%-2rem)] overflow-hidden rounded-lg border-2 border-pink-300 bg-white shadow-lg dark:border-pink-700 dark:bg-gray-800">
                            {['3 questions', '5 questions', '8 questions', 'Random'].map((option) => (
                              <button
                                key={option}
                                type="button"
                                role="option"
                                aria-selected={quizLength === option}
                                onClick={() => { setQuizLength(option); setIsQuizLengthOpen(false); }}
                                className={`flex w-full items-center justify-between px-3 py-2.5 text-left font-bold ${quizLength === option ? 'bg-pink-500 text-white' : 'text-gray-800 hover:bg-pink-100 dark:text-gray-100 dark:hover:bg-pink-900/40'}`}
                              >
                                {option}
                                {quizLength === option && <Check className="h-4 w-4" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                  <button
                    type="submit"
                    disabled={!courseTopic.trim() || !user?.id}
                    className="w-full mt-8 bg-pink-400 dark:bg-pink-500 hover:bg-pink-500 dark:hover:bg-pink-600 text-white font-bold py-4 px-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(190,24,93,1)] dark:shadow-[4px_4px_0px_0px_rgba(157,23,77,1)] active:translate-y-1 active:shadow-none transform transition focus:outline-none focus:ring-4 focus:ring-pink-400/50 font-['Kalam',cursive] text-2xl tracking-wide flex justify-center items-center gap-3 border-2 border-pink-600 dark:border-pink-700"
                  >
                    Generate Curriculum <Sparkles className="w-5 h-5" />
                  </button>
                  {errorMessage && (
                    <p role="alert" className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-center font-bold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                      {errorMessage}
                    </p>
                  )}
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
                          {isCurrent && <Hourglass className="w-6 h-6 text-pink-500 animate-spin" strokeWidth={2.5} />}
                          {isPending && <Square className="w-5 h-5 text-gray-400" strokeWidth={3} />}
                        </div>
                        <span>{step}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={cancelGeneration}
                  className="mt-8 px-6 py-2 rounded-xl font-bold font-['Kalam',cursive] text-lg border-2 border-red-500 bg-red-100 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 hover:bg-red-250 dark:hover:bg-red-900/40 transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_rgba(239,68,68,0.3)] active:translate-y-0.5 active:shadow-none z-10"
                >
                  Cancel Generation
                </button>

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
