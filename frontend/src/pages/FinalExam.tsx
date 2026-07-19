import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, PlayCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import PomodoroTimer from '../components/PomodoroTimer';

const multipleChoiceBank = [
  { 
    id: 'q1',
    prompt: 'Which responsibility belongs to the back end of an application?', 
    options: ['Styling buttons and layouts', 'Storing data and processing requests', 'Writing page headlines', 'Choosing brand colours'], 
    correctAnswer: 1
  },
  { 
    id: 'q2',
    prompt: 'In the restaurant analogy, what does the server side most closely represent?', 
    options: ['The dining room', 'The printed menu', 'The kitchen that prepares orders', 'The restaurant sign'], 
    correctAnswer: 2
  },
  { 
    id: 'q3',
    prompt: 'Which component is responsible for keeping an application’s information?', 
    options: ['Database', 'Button', 'Browser tab', 'Style sheet'], 
    correctAnswer: 0
  },
  { 
    id: 'q4',
    prompt: 'What happens first when a user asks an app to load data?', 
    options: ['The database sends a styled page', 'The front end makes a request to the server', 'The server changes the browser layout', 'The user writes a new database'], 
    correctAnswer: 1
  },
  { 
    id: 'q5',
    prompt: 'Which is an example of front-end work rather than back-end work?', 
    options: ['Validating a request', 'Saving a profile', 'Designing a navigation menu', 'Querying a database'], 
    correctAnswer: 2
  }
];

const EXAM_TIME = 10 * 60; // 10 minutes

const FinalExam = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME);
  const [hasStarted, setHasStarted] = useState(false);

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

  const submitExam = () => {
    // Calculate score
    const correctCount = multipleChoiceBank.filter(q => answers[q.id] === String(q.correctAnswer)).length;
    const score = Math.round((correctCount / multipleChoiceBank.length) * 100);
    const timeSpent = EXAM_TIME - timeLeft;
    
    // Store results in localStorage to pass to analysis page
    localStorage.setItem('tutorme-exam-results', JSON.stringify({
      score,
      correctCount,
      totalQuestions: multipleChoiceBank.length,
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

  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / multipleChoiceBank.length) * 100;
  
  // Warning colors when time is running out
  const isTimeLow = timeLeft < 60;

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-3xl p-10 border-4 border-red-200 dark:border-red-900 shadow-[8px_8px_0px_0px_rgba(254,202,202,1)] dark:shadow-[8px_8px_0px_0px_rgba(153,27,27,0.5)] transform -rotate-1 relative">
          <div className="absolute -top-6 -right-6 bg-red-100 dark:bg-red-900/50 p-4 rounded-full border-4 border-red-300 dark:border-red-700 shadow-sm animate-bounce">
            <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          
          <h1 className="text-5xl font-['Kalam',cursive] font-bold text-red-600 dark:text-red-400 mb-6">Module Final Exam</h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 font-bold mb-8">
            You are about to begin the final exam for "Back-End Developer: Foundations".
          </p>
          
          <div className="space-y-4 mb-10 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3 text-lg font-bold text-gray-700 dark:text-gray-300">
              <Clock className="w-6 h-6 text-red-500" /> Time Limit: 10 Minutes
            </div>
            <div className="flex items-center gap-3 text-lg font-bold text-gray-700 dark:text-gray-300">
              <CheckCircle2 className="w-6 h-6 text-green-500" /> Questions: 5 Multiple Choice
            </div>
            <div className="flex items-center gap-3 text-lg font-bold text-gray-700 dark:text-gray-300">
              <AlertCircle className="w-6 h-6 text-yellow-500" /> Auto-submits when time runs out
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-4 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] transition-all active:translate-y-0.5 active:shadow-none text-lg flex justify-center items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" /> Cancel
            </button>
            <button 
              onClick={() => setHasStarted(true)}
              className="flex-[2] px-6 py-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 dark:bg-red-600 border-2 border-red-700 shadow-[4px_4px_0px_0px_rgba(185,28,28,1)] transition-all active:translate-y-1 active:shadow-none text-xl font-['Kalam',cursive] tracking-wider flex justify-center items-center gap-3"
            >
              <PlayCircle className="w-6 h-6" /> Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Nunito',sans-serif] text-gray-800 dark:text-gray-100 flex flex-col relative pb-24">
      {/* Hide regular Pomodoro Timer when exam is running */}
      <style>{`.lucide-coffee, .lucide-brain { display: none; }`}</style>
      
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b-2 border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-['Kalam',cursive] font-bold text-red-600 dark:text-red-400">Final Exam</h1>
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full font-bold text-sm">
              <span className="text-gray-600 dark:text-gray-300">Progress:</span>
              <span className="text-blue-600 dark:text-blue-400">{answeredCount}/{multipleChoiceBank.length}</span>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 px-5 py-2 rounded-2xl border-4 shadow-sm transition-colors ${isTimeLow ? 'bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 animate-pulse' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'}`}>
            <Clock className={`w-6 h-6 ${isTimeLow ? 'text-red-600' : 'text-gray-400'}`} />
            <span className="text-3xl font-['Kalam',cursive] font-bold tracking-wider">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-blue-500 transition-all duration-300" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl w-full mx-auto mt-12 px-6">
        <div className="space-y-12">
          {multipleChoiceBank.map((question, qIndex) => (
            <div key={question.id} className="bg-white dark:bg-gray-800 rounded-3xl border-4 border-gray-200 dark:border-gray-700 p-8 shadow-sm relative transition-all hover:border-gray-300 dark:hover:border-gray-600">
              <div className="absolute -top-5 -left-5 w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full border-4 border-red-200 dark:border-red-700 flex items-center justify-center font-bold text-xl text-red-600 dark:text-red-400 font-['Kalam',cursive] shadow-sm transform -rotate-12">
                {qIndex + 1}
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 pl-4">{question.prompt}</h2>
              
              <div className="space-y-3">
                {question.options.map((option, oIndex) => {
                  const isSelected = answers[question.id] === String(oIndex);
                  return (
                    <label 
                      key={oIndex} 
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500 shadow-sm transform scale-[1.01]' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      <input 
                        type="radio" 
                        name={question.id} 
                        checked={isSelected}
                        onChange={() => handleSelect(question.id, oIndex)}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`font-bold ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-end">
          <button 
            onClick={submitExam}
            disabled={answeredCount < multipleChoiceBank.length}
            className={`px-10 py-5 rounded-2xl font-bold font-['Kalam',cursive] text-2xl border-4 transition-all flex items-center gap-3 ${answeredCount < multipleChoiceBank.length ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white border-red-700 shadow-[4px_4px_0px_0px_rgba(185,28,28,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(185,28,28,1)] active:translate-y-2 active:shadow-none'}`}
          >
            Submit Exam <CheckCircle2 className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalExam;
