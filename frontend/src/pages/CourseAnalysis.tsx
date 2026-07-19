import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Brain, CheckCircle2, ChevronRight, GraduationCap, Target, TrendingUp, XCircle, Sidebar } from 'lucide-react';

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

const CourseAnalysis = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<{ score: number; correctCount: number; totalQuestions: number; timeSpent: number; answers?: Record<string, string> } | null>(null);
  const [animate, setAnimate] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('tutorme-exam-results');
    if (stored) {
      setResults(JSON.parse(stored));
    } else {
      // Dummy data if accessed directly without taking exam
      setResults({ 
        score: 80, 
        correctCount: 4, 
        totalQuestions: 5, 
        timeSpent: 125,
        answers: { 'q1': '1', 'q2': '2', 'q3': '0', 'q4': '2', 'q5': '2' } // Q4 is intentionally wrong
      });
    }
    
    // Trigger animations after mount
    setTimeout(() => setAnimate(true), 100);
  }, []);

  if (!results) return null;

  const getGradeInfo = (score: number) => {
    if (score >= 90) return { letter: 'A', text: 'Outstanding!', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-300 dark:border-green-700' };
    if (score >= 80) return { letter: 'B', text: 'Great Job!', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700' };
    if (score >= 70) return { letter: 'C', text: 'Good Effort!', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-300 dark:border-yellow-700' };
    return { letter: 'Need Review', text: 'Keep Practicing!', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/40', border: 'border-red-300 dark:border-red-700' };
  };

  const grade = getGradeInfo(results.score);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // SVGs for the circular progress
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = animate ? circumference - (results.score / 100) * circumference : circumference;

  return (
    <div className="h-screen w-full flex bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-['Nunito',sans-serif] overflow-hidden transition-colors duration-300 relative">
      
      {/* Floating button to open left sidebar */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-6 left-6 z-30 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] dark:shadow-[4px_4px_0px_0px_rgba(55,65,81,0.8)] border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
        >
          <Sidebar className="w-6 h-6" />
        </button>
      )}

      {/* Left Sidebar */}
      {isSidebarOpen && (
        <aside className="w-72 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-r-2 border-dashed border-gray-300 dark:border-gray-700 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 flex-shrink-0 flex flex-col justify-between h-full p-6 transition-all duration-300 overflow-y-auto custom-scrollbar relative">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center mt-2">
              <div className="text-3xl font-['Kalam',cursive] font-bold text-blue-600 dark:text-blue-400 cursor-pointer transform -rotate-2">
                TutorMe
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Sidebar className="w-6 h-6" />
              </button>
            </div>
          
            {/* Course Progress Card */}
            <div className="bg-blue-100 dark:bg-blue-900/40 p-5 rounded-2xl border-4 border-blue-300 dark:border-blue-700/50 shadow-[4px_4px_0px_0px_rgba(96,165,250,1)] dark:shadow-[4px_4px_0px_0px_rgba(30,58,138,0.8)] transform -rotate-1 relative">
              <div className="absolute -top-3 -right-2 w-8 h-4 bg-yellow-400/80 dark:bg-yellow-500/40 transform rotate-12 backdrop-blur-sm shadow-sm pointer-events-none"></div>
              <span className="text-xs font-bold uppercase tracking-wider mb-2 inline-block text-blue-800 dark:text-blue-300">Your course</span>
              <h3 className="text-2xl font-bold font-['Kalam',cursive] text-blue-950 dark:text-blue-100 mb-4 leading-tight">Back-End Developer</h3>
              
              <div className="w-full bg-blue-200 dark:bg-blue-800/50 rounded-full h-2 mb-2 border border-blue-300 dark:border-blue-700">
                <div className="bg-blue-500 dark:bg-blue-400 h-full rounded-full w-[35%]"></div>
              </div>
              <div className="flex justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                <span>4/12 Lesson</span>
                <span>35%</span>
              </div>
            </div>

            {/* Chapters Navigation */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Chapters</h4>
              <ul className="space-y-2">
                <li className="font-bold text-gray-800 dark:text-gray-200 p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">1. Foundations</li>
                <li className="font-bold text-gray-500 dark:text-gray-400 p-2 opacity-60">2. Node.js & Express</li>
                <li className="font-bold text-gray-500 dark:text-gray-400 p-2 opacity-60">3. Database</li>
              </ul>
            </div>
          </div>
        
          <button 
            onClick={() => navigate('/roadmap')}
            className="mt-8 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] dark:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] transition-all active:translate-y-0.5 active:shadow-none w-full font-['Kalam',cursive] text-lg flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Roadmap
          </button>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative custom-scrollbar pb-24">
        
        {/* Top Nav inside Main */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b-2 border-gray-200 dark:border-gray-700 p-6 sticky top-0 z-50 flex items-center justify-between">
          <div className="font-['Kalam',cursive] text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Award className="w-8 h-8 text-yellow-500 transform -rotate-12" /> Course Analysis
          </div>
        </div>

        <div className="max-w-6xl w-full mx-auto mt-12 px-8 flex flex-col xl:flex-row gap-8">
          
          {/* Left Column: Exam Results */}
          <div className="xl:w-1/3 space-y-8 flex-shrink-0">
            <div className={`bg-white dark:bg-gray-800 rounded-3xl border-4 ${grade.border} p-8 shadow-sm relative overflow-hidden transition-all duration-1000 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className={`absolute -right-10 -top-10 w-40 h-40 ${grade.bg} rounded-full blur-3xl opacity-50`}></div>
              
              <h2 className="text-3xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 mb-8 text-center relative z-10">
                Exam Grade
              </h2>
              
              <div className="flex justify-center mb-8 relative z-10">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="transform -rotate-90 w-48 h-48">
                    <circle 
                      cx="96" cy="96" r={radius} 
                      stroke="currentColor" 
                      strokeWidth="12" 
                      fill="transparent"
                      className="text-gray-100 dark:text-gray-700"
                    />
                    <circle 
                      cx="96" cy="96" r={radius} 
                      stroke="currentColor" 
                      strokeWidth="12" 
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className={`${grade.color} transition-all duration-1500 ease-out`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-['Kalam',cursive] font-bold ${grade.color}`}>
                      {results.score}%
                    </span>
                    <span className="text-gray-500 font-bold text-sm uppercase tracking-wider">{grade.letter}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center mb-8 relative z-10">
                <h3 className={`text-2xl font-bold font-['Kalam',cursive] ${grade.color}`}>{grade.text}</h3>
                <p className="text-gray-600 dark:text-gray-400 font-semibold mt-1">You answered {results.correctCount} out of {results.totalQuestions} correctly.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 text-center">
                  <div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Time Taken</div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 text-lg">{formatTime(results.timeSpent)}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 text-center">
                  <div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Avg Time / Q</div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 text-lg">{formatTime(results.timeSpent / results.totalQuestions)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Review & AI Analysis */}
          <div className="flex-1 space-y-8">
            
            {/* AI Course Analysis */}
            <div className={`bg-purple-50 dark:bg-purple-900/20 rounded-3xl border-4 border-purple-200 dark:border-purple-800 p-8 shadow-[8px_8px_0px_0px_rgba(216,180,254,1)] dark:shadow-[8px_8px_0px_0px_rgba(107,33,168,0.5)] transition-all duration-1000 delay-300 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h2 className="text-3xl font-['Kalam',cursive] font-bold text-purple-900 dark:text-purple-300 mb-6 flex items-center gap-3">
                <Brain className="w-8 h-8" /> Course Overview Analysis
              </h2>
              
              <p className="text-purple-800 dark:text-purple-200 text-lg font-semibold leading-relaxed mb-8">
                Based on your quiz interactions and final exam, you have a solid grasp of high-level backend concepts. You clearly understand the client-server relationship and where databases fit into the big picture!
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/60 dark:bg-gray-800/60 p-6 rounded-2xl border-2 border-purple-200 dark:border-purple-700">
                  <h3 className="flex items-center gap-2 font-bold text-green-600 dark:text-green-400 mb-4 text-xl">
                    <CheckCircle2 className="w-6 h-6" /> Top Strengths
                  </h3>
                  <ul className="space-y-3 font-semibold text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2"><Target className="w-5 h-5 text-green-500 mt-0.5" /> Conceptualizing the Server-Side</li>
                    <li className="flex items-start gap-2"><Target className="w-5 h-5 text-green-500 mt-0.5" /> Differentiating Front-End vs Back-End</li>
                    <li className="flex items-start gap-2"><Target className="w-5 h-5 text-green-500 mt-0.5" /> Basic Database Purposes</li>
                  </ul>
                </div>
                
                <div className="bg-white/60 dark:bg-gray-800/60 p-6 rounded-2xl border-2 border-purple-200 dark:border-purple-700">
                  <h3 className="flex items-center gap-2 font-bold text-red-500 dark:text-red-400 mb-4 text-xl">
                    <XCircle className="w-6 h-6" /> Needs Review
                  </h3>
                  <ul className="space-y-3 font-semibold text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2"><Target className="w-5 h-5 text-red-400 mt-0.5" /> API Specifics (Methods, Endpoints)</li>
                    <li className="flex items-start gap-2"><Target className="w-5 h-5 text-red-400 mt-0.5" /> Security Validation Basics</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Question Breakdown Details */}
            {results.answers && (
              <div className={`bg-white dark:bg-gray-800 rounded-3xl border-4 border-gray-200 dark:border-gray-700 p-8 shadow-sm transition-all duration-1000 delay-500 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <h2 className="text-3xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-3">
                  <Target className="w-8 h-8 text-blue-500" /> Question Breakdown
                </h2>
                
                <div className="space-y-6">
                  {multipleChoiceBank.map((q, index) => {
                    const userAnswer = results.answers?.[q.id];
                    const isCorrect = userAnswer === String(q.correctAnswer);
                    const notAnswered = userAnswer === undefined;
                    
                    return (
                      <div key={q.id} className={`p-6 rounded-2xl border-2 ${isCorrect ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50'}`}>
                        <div className="flex gap-4">
                          <div className="mt-1 flex-shrink-0">
                            {isCorrect ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">
                              {index + 1}. {q.prompt}
                            </h3>
                            
                            <div className="space-y-2 text-sm font-semibold">
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Your Answer:</span>
                                <span className={isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                  {notAnswered ? 'Not answered' : q.options[parseInt(userAnswer)]}
                                </span>
                              </div>
                              
                              {!isCorrect && (
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Correct Answer:</span>
                                  <span className="text-green-700 dark:text-green-400">
                                    {q.options[q.correctAnswer]}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className={`mt-8 bg-blue-100 dark:bg-blue-900/40 p-8 rounded-3xl border-4 border-blue-300 dark:border-blue-700 shadow-[8px_8px_0px_0px_rgba(96,165,250,1)] dark:shadow-[8px_8px_0px_0px_rgba(30,58,138,0.8)] transition-all duration-1000 delay-700 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300 mb-2 text-2xl font-['Kalam',cursive]">
                    <GraduationCap className="w-8 h-8" /> You're ready to move on!
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 font-semibold text-lg max-w-lg">
                    The next module, "Node.js & Express," will turn these concepts into practical programming skills!
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/roadmap')}
                  className="w-full md:w-auto px-8 py-4 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 border-2 border-blue-700 shadow-[4px_4px_0px_0px_rgba(29,78,216,1)] transition-all active:translate-y-1 active:shadow-none text-xl font-['Kalam',cursive] tracking-wider flex justify-center items-center gap-3 whitespace-nowrap"
                >
                  Proceed to Next Module <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseAnalysis;
