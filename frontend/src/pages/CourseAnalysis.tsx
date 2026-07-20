import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, CheckCircle2, ChevronRight, GraduationCap, Target, XCircle, Sidebar, Clock, FileText, Lock, Plus, Minus } from 'lucide-react';

type Question = {
  id: string;
  type: 'multiple-choice' | 'essay';
  prompt: string;
  options?: string[];
  correctAnswer?: number;
};

const questionBank: Question[] = [
  { id: 'q1', type: 'multiple-choice', prompt: 'Which responsibility belongs to the back end of an application?', options: ['Styling buttons and layouts', 'Storing data and processing requests', 'Writing page headlines', 'Choosing brand colours'], correctAnswer: 1 },
  { id: 'q2', type: 'multiple-choice', prompt: 'In the restaurant analogy, what does the server side most closely represent?', options: ['The dining room', 'The printed menu', 'The kitchen that prepares orders', 'The restaurant sign'], correctAnswer: 2 },
  { id: 'q3', type: 'multiple-choice', prompt: 'Which component is responsible for keeping an application’s information?', options: ['Database', 'Button', 'Browser tab', 'Style sheet'], correctAnswer: 0 },
  { id: 'q4', type: 'multiple-choice', prompt: 'What happens first when a user asks an app to load data?', options: ['The database sends a styled page', 'The front end makes a request to the server', 'The server changes the browser layout', 'The user writes a new database'], correctAnswer: 1 },
  { id: 'q5', type: 'multiple-choice', prompt: 'Which is an example of front-end work rather than back-end work?', options: ['Validating a request', 'Saving a profile', 'Designing a navigation menu', 'Querying a database'], correctAnswer: 2 },
  { id: 'q6', type: 'essay', prompt: 'In your own words, explain the difference between front-end and back-end development.' }
];

const CourseAnalysis = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<{ score: number; correctCount: number; totalQuestions: number; timeSpent: number; answers?: Record<string, string> } | null>(null);
  const [animate, setAnimate] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarExpandedModule, setSidebarExpandedModule] = useState<number | null>(1);

  const modules = [
    {
      id: 1,
      title: "Foundations",
      lessons: "4 Lesson",
      desc: "Start with the concept",
      items: [
        { name: "What is back end?", status: "completed" },
        { name: "History of backend", status: "completed" },
        { name: "Request & Response", status: "locked" },
        { name: "APIs", status: "locked" }
      ]
    },
    {
      id: 2,
      title: "Node.js & Express",
      lessons: "5 Lesson",
      desc: "Learn the core syntax",
      items: [
        { name: "V8 Engine", status: "locked" },
        { name: "Event Loop", status: "locked" },
        { name: "Routing", status: "locked" },
        { name: "Middleware", status: "locked" },
        { name: "Error Handling", status: "locked" }
      ]
    }
  ];

  useEffect(() => {
    const stored = localStorage.getItem('tutorme-exam-results');
    if (stored) {
      setResults(JSON.parse(stored));
    } else {
      setResults({ 
        score: 80, 
        correctCount: 4, 
        totalQuestions: 6, 
        timeSpent: 125,
        answers: { 'q1': '1', 'q2': '2', 'q3': '0', 'q4': '2', 'q5': '2', 'q6': 'The front end is what the user interacts with (UI/UX). The back end consists of the server, database, and application logic that powers the front end.' } 
      });
    }
    setTimeout(() => setAnimate(true), 100);
  }, []);

  if (!results) return null;

  const getGradeInfo = (score: number) => {
    if (score >= 90) return { letter: 'A', text: 'Outstanding!', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-400 dark:border-green-600', shadow: 'shadow-[8px_8px_0px_0px_rgba(74,222,128,1)] dark:shadow-[8px_8px_0px_0px_rgba(21,128,61,0.8)]' };
    if (score >= 80) return { letter: 'B', text: 'Great Job!', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-400 dark:border-blue-600', shadow: 'shadow-[8px_8px_0px_0px_rgba(96,165,250,1)] dark:shadow-[8px_8px_0px_0px_rgba(30,58,138,0.8)]' };
    if (score >= 70) return { letter: 'C', text: 'Good Effort!', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-400 dark:border-yellow-600', shadow: 'shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] dark:shadow-[8px_8px_0px_0px_rgba(161,98,7,0.8)]' };
    return { letter: 'Review', text: 'Keep Practicing!', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40', border: 'border-red-400 dark:border-red-600', shadow: 'shadow-[8px_8px_0px_0px_rgba(248,113,113,1)] dark:shadow-[8px_8px_0px_0px_rgba(153,27,27,0.8)]' };
  };

  const grade = getGradeInfo(results.score);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = animate ? circumference - (results.score / 100) * circumference : circumference;

  return (
    <div className="h-screen w-full flex bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-['Nunito',sans-serif] overflow-hidden transition-colors duration-300 relative">
      
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-6 left-6 z-30 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(209,213,219,1)] dark:shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] border-4 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(209,213,219,1)] active:translate-y-1 active:shadow-none"
        >
          <Sidebar className="w-6 h-6" />
        </button>
      )}

      {isSidebarOpen && (
        <aside className="w-80 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-r-4 border-dashed border-gray-300 dark:border-gray-700 shadow-sm z-20 flex-shrink-0 flex flex-col justify-between h-full p-6 transition-all duration-300 overflow-y-auto custom-scrollbar relative">
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center mt-2">
              <div className="text-4xl font-['Kalam',cursive] font-bold text-blue-600 dark:text-blue-400 cursor-pointer transform -rotate-2 hover:rotate-0 transition-transform">
                TutorMe
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Sidebar className="w-7 h-7" />
              </button>
            </div>
          
            {/* Course Progress Card */}
            <div className="bg-blue-100 dark:bg-blue-900/40 p-6 rounded-3xl border-4 border-blue-400 dark:border-blue-600 shadow-[6px_6px_0px_0px_rgba(96,165,250,1)] dark:shadow-[6px_6px_0px_0px_rgba(30,58,138,0.8)] transform -rotate-2 relative">
              <div className="absolute -top-3 -right-2 w-10 h-5 bg-yellow-400/80 dark:bg-yellow-500/40 transform rotate-12 backdrop-blur-sm border-2 border-yellow-500 pointer-events-none"></div>
              <span className="text-sm font-bold uppercase tracking-wider mb-2 inline-block text-blue-800 dark:text-blue-300">Your course</span>
              <h3 className="text-2xl font-bold font-['Kalam',cursive] text-blue-950 dark:text-blue-100 mb-6 leading-tight">Back-End Developer</h3>
              
              <div className="w-full bg-blue-200 dark:bg-blue-800/50 rounded-full h-3 mb-2 border-2 border-blue-400 dark:border-blue-700 overflow-hidden">
                <div className="bg-blue-500 dark:bg-blue-400 h-full rounded-r-full w-[35%]"></div>
              </div>
              <div className="flex justify-between text-sm font-bold text-blue-700 dark:text-blue-300">
                <span>4/12 Lesson</span>
                <span>35%</span>
              </div>
            </div>

            {/* Sidebar Course Roadmap Nav */}
            <div className="mt-4 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Course Roadmap</span>
              
              <div className="flex flex-col gap-2">
                {modules.map((module) => (
                  <div key={`sidebar-${module.id}`} className="flex flex-col gap-2">
                    <div 
                      className="flex justify-between items-center cursor-pointer group"
                      onClick={() => setSidebarExpandedModule(sidebarExpandedModule === module.id ? null : module.id)}
                    >
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-[15px]">
                        0{module.id} {module.title}
                      </h4>
                      <button className="text-gray-400 group-hover:text-blue-500">
                        {sidebarExpandedModule === module.id ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {sidebarExpandedModule === module.id && (
                      <div className="flex flex-col gap-3 pl-2 mt-1 mb-2">
                        {module.items.map((item, index) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-3 text-[14px] cursor-pointer group"
                          >
                            {item.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <span className={`font-semibold group-hover:text-blue-500 transition-colors ${item.status === 'completed' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'} ${item.name === 'What is back end?' ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        
          <button 
            onClick={() => navigate('/roadmap')}
            className="mt-8 flex items-center justify-center gap-3 px-4 py-4 rounded-2xl font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-4 border-gray-300 dark:border-gray-600 shadow-[4px_4px_0px_0px_rgba(209,213,219,1)] dark:shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(209,213,219,1)] active:translate-y-1 active:shadow-none w-full font-['Kalam',cursive] text-xl flex-shrink-0"
          >
            <ArrowLeft className="w-6 h-6" /> Back to Roadmap
          </button>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative custom-scrollbar pb-32">
        
        {/* Top Nav inside Main */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-b-4 border-gray-300 dark:border-gray-700 p-6 sticky top-0 z-50 flex items-center justify-between shadow-[0_4px_0px_0px_rgba(209,213,219,1)] dark:shadow-[0_4px_0px_0px_rgba(75,85,99,0.5)]">
          <div className="font-['Kalam',cursive] text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3 transform -rotate-1">
            <Target className="w-8 h-8 text-blue-500" /> Course Analysis
          </div>
        </div>

        <div className="max-w-5xl w-full mx-auto mt-12 px-6 flex flex-col gap-12">
          
          {/* Top Row: Grade and Stats */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Grade Hero Card */}
            <div className={`flex-1 ${grade.bg} rounded-3xl border-4 ${grade.border} p-8 ${grade.shadow} relative overflow-hidden transition-all duration-1000 transform ${animate ? 'translate-y-0 opacity-100 rotate-1' : 'translate-y-10 opacity-0'} flex flex-col sm:flex-row items-center gap-8`}>
              <div className="absolute -top-4 right-1/4 w-32 h-10 bg-yellow-400/80 transform rotate-2 backdrop-blur-sm border-2 border-yellow-500 z-10"></div>
              
              <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
                <svg className="transform -rotate-90 w-48 h-48 drop-shadow-sm">
                  <circle cx="96" cy="96" r={radius} stroke="currentColor" strokeWidth="16" fill="transparent" className="text-white/50 dark:text-gray-900/30" />
                  <circle cx="96" cy="96" r={radius} stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className={`${grade.color} transition-all duration-1500 ease-out`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-6xl font-['Kalam',cursive] font-bold ${grade.color} drop-shadow-sm`}>
                    {results.score}%
                  </span>
                  <span className={`font-bold text-lg uppercase tracking-wider ${grade.color}`}>{grade.letter} Grade</span>
                </div>
              </div>
              
              <div className="flex flex-col justify-center text-center sm:text-left z-10">
                <h2 className={`text-4xl font-['Kalam',cursive] font-bold ${grade.color} mb-3`}>{grade.text}</h2>
                <p className="text-gray-800 dark:text-gray-200 font-bold text-xl mb-6">
                  You got {results.correctCount} out of {questionBank.filter(q=>q.type === 'multiple-choice').length} multiple choice questions right.
                </p>
                
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                  <div className="bg-white/80 dark:bg-gray-800/80 p-3 px-5 rounded-2xl border-4 border-white dark:border-gray-700 shadow-sm flex items-center gap-3">
                    <Clock className={`w-6 h-6 ${grade.color}`} />
                    <div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">Time Taken</div>
                      <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{formatTime(results.timeSpent)}</div>
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-gray-800/80 p-3 px-5 rounded-2xl border-4 border-white dark:border-gray-700 shadow-sm flex items-center gap-3">
                    <Target className={`w-6 h-6 ${grade.color}`} />
                    <div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">Avg Time / Q</div>
                      <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{formatTime(results.timeSpent / results.totalQuestions)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Block */}
          <div className={`bg-purple-100 dark:bg-purple-900/40 rounded-3xl border-4 border-purple-400 dark:border-purple-600 p-8 sm:p-10 shadow-[8px_8px_0px_0px_rgba(192,132,252,1)] dark:shadow-[8px_8px_0px_0px_rgba(107,33,168,0.8)] transition-all duration-1000 delay-300 transform ${animate ? 'translate-y-0 opacity-100 -rotate-1' : 'translate-y-10 opacity-0'} relative`}>
            <div className="absolute -top-6 -left-6 w-16 h-16 bg-purple-200 dark:bg-purple-800 rounded-full border-4 border-purple-400 dark:border-purple-500 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(168,85,247,1)] dark:shadow-[4px_4px_0px_0px_rgba(107,33,168,1)] transform -rotate-12 z-10">
              <Brain className="w-8 h-8 text-purple-600 dark:text-purple-300" />
            </div>

            <h2 className="text-3xl font-['Kalam',cursive] font-bold text-purple-900 dark:text-purple-100 mb-6 pl-8">
              AI Course Insight
            </h2>
            
            <p className="text-purple-800 dark:text-purple-200 text-xl font-bold leading-relaxed mb-10 bg-white/50 dark:bg-gray-900/50 p-6 rounded-2xl border-4 border-purple-200 dark:border-purple-700/50">
              Based on your quiz interactions and final exam, you have a solid grasp of high-level backend concepts. You clearly understand the client-server relationship and where databases fit into the big picture!
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border-4 border-green-300 dark:border-green-700 shadow-[4px_4px_0px_0px_rgba(134,239,172,1)] dark:shadow-[4px_4px_0px_0px_rgba(21,128,61,0.8)] transform rotate-1 hover:rotate-0 transition-transform">
                <h3 className="flex items-center gap-3 font-bold text-green-600 dark:text-green-400 mb-6 text-2xl font-['Kalam',cursive]">
                  <CheckCircle2 className="w-8 h-8" /> Top Strengths
                </h3>
                <ul className="space-y-4 font-bold text-gray-700 dark:text-gray-300 text-lg">
                  <li className="flex items-start gap-3"><div className="w-2 h-2 bg-green-500 rounded-full mt-2.5"></div> Conceptualizing Server-Side</li>
                  <li className="flex items-start gap-3"><div className="w-2 h-2 bg-green-500 rounded-full mt-2.5"></div> Differentiating FE vs BE</li>
                  <li className="flex items-start gap-3"><div className="w-2 h-2 bg-green-500 rounded-full mt-2.5"></div> Database Purposes</li>
                </ul>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border-4 border-red-300 dark:border-red-700 shadow-[4px_4px_0px_0px_rgba(252,165,165,1)] dark:shadow-[4px_4px_0px_0px_rgba(153,27,27,0.8)] transform -rotate-1 hover:rotate-0 transition-transform">
                <h3 className="flex items-center gap-3 font-bold text-red-500 dark:text-red-400 mb-6 text-2xl font-['Kalam',cursive]">
                  <XCircle className="w-8 h-8" /> Needs Review
                </h3>
                <ul className="space-y-4 font-bold text-gray-700 dark:text-gray-300 text-lg">
                  <li className="flex items-start gap-3"><div className="w-2 h-2 bg-red-500 rounded-full mt-2.5"></div> API Specifics & Endpoints</li>
                  <li className="flex items-start gap-3"><div className="w-2 h-2 bg-red-500 rounded-full mt-2.5"></div> Security Validation Basics</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Question Breakdown Details */}
          {results.answers && (
            <div className={`space-y-8 transition-all duration-1000 delay-500 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h2 className="text-4xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 flex items-center gap-4">
                <FileText className="w-10 h-10 text-blue-500 transform rotate-12" /> Question Breakdown
              </h2>
              
              <div className="grid gap-6">
                {questionBank.map((q, index) => {
                  const userAnswer = results.answers?.[q.id];
                  
                  if (q.type === 'multiple-choice') {
                    const isCorrect = userAnswer === String(q.correctAnswer);
                    const notAnswered = userAnswer === undefined;
                    
                    return (
                      <div key={q.id} className={`p-8 rounded-3xl border-4 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 shadow-[8px_8px_0px_0px_rgba(134,239,172,1)] dark:shadow-[8px_8px_0px_0px_rgba(21,128,61,0.8)]' : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 shadow-[8px_8px_0px_0px_rgba(252,165,165,1)] dark:shadow-[8px_8px_0px_0px_rgba(153,27,27,0.8)]'} relative transform hover:-translate-y-1 transition-transform`}>
                        <div className="flex gap-6">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full border-4 flex items-center justify-center ${isCorrect ? 'bg-green-100 border-green-400 text-green-600' : 'bg-red-100 border-red-400 text-red-600'}`}>
                            {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-relaxed">
                              {index + 1}. {q.prompt}
                            </h3>
                            
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-600 space-y-3 font-bold text-lg">
                              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                                <span className="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0 uppercase text-sm mt-1">Your Answer:</span>
                                <span className={isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                  {notAnswered ? 'Not answered' : q.options?.[parseInt(userAnswer)]}
                                </span>
                              </div>
                              
                              {!isCorrect && (
                                <div className="flex flex-col sm:flex-row sm:items-start gap-2 pt-3 border-t-2 border-gray-100 dark:border-gray-700">
                                  <span className="text-gray-500 dark:text-gray-400 w-32 flex-shrink-0 uppercase text-sm mt-1">Correct Answer:</span>
                                  <span className="text-green-700 dark:text-green-400">
                                    {q.correctAnswer !== undefined && q.options?.[q.correctAnswer]}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={q.id} className="p-8 rounded-3xl border-4 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-[8px_8px_0px_0px_rgba(147,197,253,1)] dark:shadow-[8px_8px_0px_0px_rgba(30,58,138,0.8)] relative transform hover:-translate-y-1 transition-transform">
                        <div className="flex gap-6">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full border-4 bg-blue-100 border-blue-400 text-blue-600 flex items-center justify-center">
                            <Brain className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-relaxed m-0">
                                {index + 1}. {q.prompt}
                              </h3>
                              <span className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-bold px-3 py-1 rounded-full uppercase">Essay</span>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-600">
                              <span className="text-gray-500 dark:text-gray-400 block uppercase text-sm font-bold mb-3">Your Response:</span>
                              <p className="font-bold text-gray-800 dark:text-gray-200 text-lg whitespace-pre-wrap">
                                {userAnswer || <span className="text-gray-400 italic">No answer provided.</span>}
                              </p>
                            </div>
                            <div className="mt-4 p-4 bg-purple-100 dark:bg-purple-900/40 border-2 border-purple-300 dark:border-purple-600 rounded-2xl flex items-start gap-3">
                               <Brain className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
                               <p className="font-bold text-purple-900 dark:text-purple-200">
                                 <span className="uppercase text-xs block mb-1">AI Feedback</span>
                                 Great job explaining the concept! You successfully identified that the front-end handles user interfaces while the back-end manages data and server logic.
                               </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}

          {/* Next Steps Banner */}
          <div className={`mt-8 bg-gray-900 dark:bg-black p-10 rounded-3xl border-4 border-gray-700 dark:border-gray-800 shadow-[12px_12px_0px_0px_rgba(209,213,219,1)] dark:shadow-[12px_12px_0px_0px_rgba(55,65,81,1)] transition-all duration-1000 delay-700 transform ${animate ? 'translate-y-0 opacity-100 rotate-1' : 'translate-y-10 opacity-0'} relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-screen filter blur-[100px] opacity-50"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div>
                <h3 className="flex items-center justify-center md:justify-start gap-3 font-bold text-white mb-4 text-4xl font-['Kalam',cursive]">
                  <GraduationCap className="w-10 h-10 text-yellow-400" /> Course Complete!
                </h3>
                <p className="text-gray-300 font-bold text-xl max-w-xl">
                  You have successfully completed this module. Head back to the dashboard to track your overall progress or pick a new course.
                </p>
              </div>
              <button 
                onClick={() => navigate('/course')}
                className="w-full md:w-auto px-10 py-6 rounded-2xl font-bold text-blue-900 bg-yellow-400 hover:bg-yellow-300 border-4 border-yellow-600 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] active:translate-y-2 active:shadow-none text-2xl font-['Kalam',cursive] tracking-wider flex justify-center items-center gap-3 whitespace-nowrap"
              >
                Back to Dashboard <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default CourseAnalysis;
