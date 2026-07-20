import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, PlayCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import PomodoroTimer from '../components/PomodoroTimer';

type Question = {
  id: string;
  type: 'multiple-choice' | 'essay';
  prompt: string;
  options?: string[];
  correctAnswer?: number;
};

const questionBank: Question[] = [
  { 
    id: 'q1',
    type: 'multiple-choice',
    prompt: 'Which responsibility belongs to the back end of an application?', 
    options: ['Styling buttons and layouts', 'Storing data and processing requests', 'Writing page headlines', 'Choosing brand colours'], 
    correctAnswer: 1
  },
  { 
    id: 'q2',
    type: 'multiple-choice',
    prompt: 'In the restaurant analogy, what does the server side most closely represent?', 
    options: ['The dining room', 'The printed menu', 'The kitchen that prepares orders', 'The restaurant sign'], 
    correctAnswer: 2
  },
  { 
    id: 'q3',
    type: 'multiple-choice',
    prompt: 'Which component is responsible for keeping an application’s information?', 
    options: ['Database', 'Button', 'Browser tab', 'Style sheet'], 
    correctAnswer: 0
  },
  { 
    id: 'q4',
    type: 'multiple-choice',
    prompt: 'What happens first when a user asks an app to load data?', 
    options: ['The database sends a styled page', 'The front end makes a request to the server', 'The server changes the browser layout', 'The user writes a new database'], 
    correctAnswer: 1
  },
  { 
    id: 'q5',
    type: 'multiple-choice',
    prompt: 'Which is an example of front-end work rather than back-end work?', 
    options: ['Validating a request', 'Saving a profile', 'Designing a navigation menu', 'Querying a database'], 
    correctAnswer: 2
  },
  {
    id: 'q6',
    type: 'essay',
    prompt: 'In your own words, explain the difference between front-end and back-end development.',
  }
];

const EXAM_TIME = 10 * 60; // 10 minutes

const FinalExam = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME);
  const [hasStarted, setHasStarted] = useState(true);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (hasStarted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (hasStarted && timeLeft === 0) {
      submitExam();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hasStarted, timeLeft]);

  const handleSelect = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: String(optionIndex)
    }));
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: text
    }));
  };

  const submitExam = () => {
    // Calculate score
    const mcQuestions = questionBank.filter(q => q.type === 'multiple-choice');
    const correctCount = mcQuestions.filter(q => answers[q.id] === String(q.correctAnswer)).length;
    const score = Math.round((correctCount / mcQuestions.length) * 100);
    const timeSpent = EXAM_TIME - timeLeft;
    
    // Store results in localStorage to pass to analysis page
    localStorage.setItem('tutorme-exam-results', JSON.stringify({
      score,
      correctCount,
      totalQuestions: questionBank.length,
      timeSpent,
      answers
    }));
    
    navigate('/analysis');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).filter(key => answers[key]?.trim() !== '').length;
  const progressPercent = (answeredCount / questionBank.length) * 100;
  
  // Warning colors when time is running out
  const isTimeLow = timeLeft < 60;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Nunito',sans-serif] text-gray-800 dark:text-gray-100 flex flex-col relative pb-32">
      {/* Hide regular Pomodoro Timer when exam is running */}
      <style>{`.lucide-coffee, .lucide-brain { display: none; }`}</style>
      
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-b-4 border-gray-300 dark:border-gray-700 shadow-[0_4px_0px_0px_rgba(209,213,219,1)] dark:shadow-[0_4px_0px_0px_rgba(55,65,81,0.5)] pt-4 pb-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-['Kalam',cursive] font-bold text-red-600 dark:text-red-400 transform -rotate-1">Final Exam</h1>
            <div className="hidden sm:flex items-center gap-3 bg-blue-50 dark:bg-blue-900/40 px-4 py-2 rounded-xl font-bold text-md border-2 border-blue-200 dark:border-blue-800 shadow-sm transform rotate-1">
              <span className="text-blue-700 dark:text-blue-300">Progress:</span>
              <span className="text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-700">{answeredCount}/{questionBank.length}</span>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 px-6 py-2 rounded-2xl border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] transition-colors ${isTimeLow ? 'bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 animate-pulse' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}>
            <Clock className={`w-7 h-7 ${isTimeLow ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`} />
            <span className="text-3xl font-['Kalam',cursive] font-bold tracking-wider">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700 overflow-hidden translate-y-full">
          <div 
            className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300 rounded-r-full" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl w-full mx-auto mt-16 px-6">
        <div className="space-y-16">
          {(() => {
            const question = questionBank[currentQuestionIndex];
            return (
              <div key={question.id} className="bg-white dark:bg-gray-800 rounded-3xl border-4 border-gray-300 dark:border-gray-700 p-8 sm:p-10 shadow-[8px_8px_0px_0px_rgba(209,213,219,1)] dark:shadow-[8px_8px_0px_0px_rgba(75,85,99,1)] relative transition-all">
                <div className="absolute -top-6 -left-6 w-14 h-14 bg-blue-100 dark:bg-blue-900/40 rounded-full border-4 border-blue-300 dark:border-blue-700 flex items-center justify-center font-bold text-2xl text-blue-600 dark:text-blue-400 font-['Kalam',cursive] shadow-[4px_4px_0px_0px_rgba(147,197,253,1)] dark:shadow-[4px_4px_0px_0px_rgba(30,58,138,0.8)] transform -rotate-12">
                  {currentQuestionIndex + 1}
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 pl-4 leading-relaxed">{question.prompt}</h2>
                
                {question.type === 'multiple-choice' && question.options && (
                  <div className="space-y-4">
                    {question.options.map((option, oIndex) => {
                      const isSelected = answers[question.id] === String(oIndex);
                      return (
                        <label 
                          key={oIndex} 
                          className={`flex items-center gap-4 p-5 rounded-2xl border-4 cursor-pointer transition-all ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 shadow-[4px_4px_0px_0px_rgba(96,165,250,1)] dark:shadow-[4px_4px_0px_0px_rgba(30,58,138,0.8)] transform -translate-y-1' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(209,213,219,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(75,85,99,1)]'}`}
                        >
                          <div className={`w-7 h-7 rounded-full border-4 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-400' : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800'}`}>
                            {isSelected && <div className="w-2.5 h-2.5 bg-white dark:bg-gray-900 rounded-full" />}
                          </div>
                          <input 
                            type="radio" 
                            name={question.id} 
                            checked={isSelected}
                            onChange={() => handleSelect(question.id, oIndex)}
                            className="hidden"
                          />
                          <span className={`font-bold text-lg ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {question.type === 'essay' && (
                  <div className="space-y-4">
                    <textarea 
                      placeholder="Type your answer here..."
                      value={answers[question.id] || ''}
                      onChange={(e) => handleTextAnswer(question.id, e.target.value)}
                      className="w-full h-40 p-5 rounded-2xl border-4 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 font-bold text-gray-700 dark:text-gray-300 text-lg focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all shadow-inner resize-none"
                    />
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="mt-12 flex justify-between">
          <button 
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className={`px-8 py-4 rounded-2xl font-bold font-['Kalam',cursive] text-2xl border-4 transition-all flex items-center gap-3 ${currentQuestionIndex === 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-50' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(156,163,175,1)] active:translate-y-1 active:shadow-none'}`}
          >
            <ArrowLeft className="w-6 h-6" /> Previous
          </button>
          
          {currentQuestionIndex < questionBank.length - 1 ? (
            <button 
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questionBank.length - 1, prev + 1))}
              className="px-12 py-4 rounded-2xl font-bold font-['Kalam',cursive] text-3xl border-4 transition-all flex items-center gap-4 bg-blue-500 hover:bg-blue-600 text-white border-blue-700 shadow-[6px_6px_0px_0px_rgba(29,78,216,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(29,78,216,1)] active:translate-y-2 active:shadow-none"
            >
              Next
            </button>
          ) : (
            <button 
              onClick={submitExam}
              disabled={answeredCount < questionBank.length}
              className={`px-12 py-4 rounded-2xl font-bold font-['Kalam',cursive] text-3xl border-4 transition-all flex items-center gap-4 ${answeredCount < questionBank.length ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-300 dark:border-gray-700 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white border-red-700 shadow-[6px_6px_0px_0px_rgba(185,28,28,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(185,28,28,1)] active:translate-y-2 active:shadow-none'}`}
            >
              Submit Exam <CheckCircle2 className="w-8 h-8" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinalExam;
