import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Send, Sparkles, Sidebar, Play, Target, CheckCircle2, Lock } from 'lucide-react';

const Roadmap = () => {
  const navigate = useNavigate();
  const [expandedModule, setExpandedModule] = useState<number | null>(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const showGuideMessage = () => {
    setToastMessage('This is the editor view. Click "Start Learning" at the top to begin the course!');
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

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
    },
    {
      id: 3,
      title: "Database",
      lessons: "6 Lesson",
      desc: "Store and manage data",
      items: [
        { name: "Relational vs NoSQL", status: "locked" },
        { name: "PostgreSQL Basics", status: "locked" },
        { name: "MongoDB", status: "locked" },
        { name: "Prisma ORM", status: "locked" },
        { name: "Database Design", status: "locked" }
      ]
    }
  ];

  return (
    <div className="h-screen w-full flex bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-['Nunito',sans-serif] overflow-hidden transition-colors duration-300 relative">
      
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

          </div>
        
        <button 
          onClick={() => navigate(-1)}
          className="mt-8 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] dark:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] transition-all active:translate-y-0.5 active:shadow-none w-full font-['Kalam',cursive] text-lg flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
      </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative bg-gray-50 dark:bg-gray-900"
      >
        <div className="max-w-4xl w-full mx-auto px-8 py-10 flex flex-col flex-1 relative z-10">
          
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl md:text-5xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide flex items-center gap-4">
              <Play className="w-10 h-10 text-pink-500 fill-pink-500 transform rotate-12" />
              ROADMAP
            </h1>
            <div className="flex gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] dark:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] transition-all active:translate-y-0.5 active:shadow-none font-['Kalam',cursive] text-lg"
              >
                Cancel
              </button>
              <button 
                onClick={() => navigate('/lesson')}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 border-2 border-green-700 shadow-[2px_2px_0px_0px_rgba(21,128,61,1)] transition-all active:translate-y-0.5 active:shadow-none flex items-center gap-2 font-['Kalam',cursive] text-lg"
              >
                Start Learning
              </button>
            </div>
          </div>

          {/* Editor Mode Banner */}
          <div className="bg-purple-100 dark:bg-purple-900/40 p-5 rounded-2xl border-4 border-purple-300 dark:border-purple-700/50 shadow-[4px_4px_0px_0px_rgba(168,85,247,1)] dark:shadow-[4px_4px_0px_0px_rgba(126,34,206,0.8)] mb-8 flex items-start sm:items-center gap-4 transform rotate-1">
            <div className="bg-purple-200 dark:bg-purple-800 p-3 rounded-full border-2 border-purple-400 dark:border-purple-600 flex-shrink-0">
              <Sparkles className="w-6 h-6 text-purple-700 dark:text-purple-300" />
            </div>
            <div>
              <h3 className="font-['Kalam',cursive] text-2xl font-bold text-purple-950 dark:text-purple-100 mb-1">Editor Mode</h3>
              <p className="font-bold text-purple-800 dark:text-purple-300 text-sm">
                Review your generated roadmap! Want to tweak the topics or add a new module? Just ask the AI Assistant on the right to customize it before you hit <strong className="text-purple-900 dark:text-purple-200">Start Learning</strong>.
              </p>
            </div>
          </div>

          {/* Main Title & Description */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-8 rounded-3xl border-4 border-yellow-200 dark:border-yellow-700/50 shadow-[8px_8px_0px_0px_rgba(253,224,71,1)] dark:shadow-[8px_8px_0px_0px_rgba(161,98,7,0.8)] relative mb-8">
            <div className="absolute -top-4 -right-4 w-12 h-6 bg-pink-400/80 dark:bg-pink-500/40 transform -rotate-12 backdrop-blur-sm shadow-sm pointer-events-none border-2 border-pink-500 dark:border-pink-600"></div>
            
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4 text-4xl font-['Kalam',cursive]">
              Back-End Developer
            </h2>
            <p className="text-gray-600 dark:text-gray-300 font-bold max-w-2xl text-lg">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.
            </p>
          </div>
            
          {/* Module List */}
          <div className="space-y-5 pb-12">
            {modules.map((module) => {
              const isExpanded = expandedModule === module.id;
              
              return (
                <div key={module.id} className="bg-white dark:bg-gray-800 border-4 border-gray-300 dark:border-gray-600 rounded-2xl shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] dark:shadow-[4px_4px_0px_0px_rgba(55,65,81,0.8)] overflow-hidden transition-all hover:border-blue-400 dark:hover:border-blue-500">
                  <div 
                    className={`p-5 flex items-center gap-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isExpanded ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                    onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                  >
                    {/* Number Circle */}
                    <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-300 dark:border-blue-700 flex items-center justify-center font-bold text-xl text-blue-700 dark:text-blue-300 flex-shrink-0 font-['Kalam',cursive] shadow-[2px_2px_0px_0px_rgba(96,165,250,1)] dark:shadow-[2px_2px_0px_0px_rgba(30,58,138,1)] transform -rotate-6">
                      0{module.id}
                    </div>
                    
                    {/* Title & Info */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold font-['Nunito',sans-serif] tracking-tight text-gray-900 dark:text-gray-100">{module.title}</h3>
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">
                        <span>{module.lessons}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></span>
                        <span>{module.desc}</span>
                      </div>
                    </div>
                    
                    {/* Toggle Icon */}
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 shadow-sm transition-colors">
                      <ChevronRight className={`w-6 h-6 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="px-5 pb-6 pt-4 pl-14 border-t-2 border-gray-200 dark:border-gray-700 border-dashed bg-white dark:bg-gray-800">
                                <ul className="space-y-5">
                          {module.items.map((item, index) => {
                            const isExam = (item as any).isExam;
                            return (
                              <li 
                                key={index} 
                                onClick={() => showGuideMessage()}
                                className={`flex items-center justify-between gap-4 font-bold cursor-pointer transition-colors group text-lg p-3 rounded-xl border-2 ${isExam ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40' : 'text-gray-700 dark:text-gray-300 border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                              >
                                <span className="flex items-center gap-3 pl-2">
                                  {isExam && <Target className="w-5 h-5 flex-shrink-0" />}
                                  {!isExam && <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 group-hover:bg-blue-400 transition-colors"></span>}
                                  {item.name}
                                </span>
                                {isExam && <span className="text-xs font-bold uppercase tracking-wider bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded-md text-red-700 dark:text-red-300">Timed</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Toast Notification */}
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <div className="bg-yellow-100 dark:bg-yellow-900/80 border-4 border-yellow-400 dark:border-yellow-600 px-6 py-4 rounded-2xl shadow-[4px_4px_0_rgba(234,179,8,1)] flex items-center gap-3 max-w-lg w-full font-bold text-yellow-900 dark:text-yellow-100 text-lg font-['Nunito',sans-serif]">
              <Sparkles className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              {toastMessage}
            </div>
          </div>
          
        </div>
      </main>

      {/* Right Sidebar - AI Assistant */}
      <aside className="w-80 bg-purple-50/50 dark:bg-gray-800/40 backdrop-blur-xl border-l-2 border-dashed border-gray-300 dark:border-gray-700 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-20 flex-shrink-0 flex flex-col h-full p-6 transition-colors duration-300">
        <h2 className="text-3xl font-['Kalam',cursive] font-bold text-purple-600 dark:text-purple-400 mb-6 flex items-center gap-3 tracking-wide transform -rotate-1">
          <Sparkles className="w-8 h-8 fill-purple-500 text-purple-500" /> 
          AI Assistant
        </h2>
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-6 pb-4 pr-2 custom-scrollbar">
          
          <div className="bg-white dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 p-4 rounded-3xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] dark:shadow-[4px_4px_0px_0px_rgba(55,65,81,0.8)] mr-4 text-md font-bold text-gray-700 dark:text-gray-300 relative">
            Hello! I'm your AI learning assistant. Ready to start your Back-End journey?
          </div>
          
          <div className="bg-pink-100 dark:bg-pink-900/40 border-4 border-pink-300 dark:border-pink-700 p-4 rounded-3xl rounded-tr-none shadow-[4px_4px_0px_0px_rgba(244,114,182,1)] dark:shadow-[4px_4px_0px_0px_rgba(190,24,93,0.8)] ml-4 text-md font-bold text-pink-900 dark:text-pink-100 self-end relative transform rotate-1">
            What is an API? I'm confused about the concept.
          </div>
          
          <div className="bg-white dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 p-4 rounded-3xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] dark:shadow-[4px_4px_0px_0px_rgba(55,65,81,0.8)] mr-4 text-md font-bold text-gray-700 dark:text-gray-300 relative">
            Think of an API as a waiter in a restaurant. You (the client) give your order to the waiter (the API), who takes it to the kitchen (the server/database), and then brings your food (the data) back to you!
          </div>

        </div>
        
        {/* Input Area */}
        <div className="mt-4 relative">
          <input 
            type="text" 
            placeholder="Ask me anything..." 
            className="w-full pl-5 pr-14 py-4 border-4 border-purple-200 dark:border-purple-800/50 rounded-full bg-white/90 dark:bg-gray-900/90 focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-900/50 font-bold text-gray-700 dark:text-gray-200 placeholder-gray-400 transition-all shadow-inner text-lg"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex">
            <button className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full shadow-[0_4px_0px_0px_rgba(126,34,206,1)] active:translate-y-1 active:shadow-none transition-all">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

    </div>
  );
};

export default Roadmap;
