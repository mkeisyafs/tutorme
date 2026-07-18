import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle2, Lock, Plus, Minus, Sidebar, ChevronLeft, ChevronRight, Sparkles, Send, X } from 'lucide-react';
import SaveToNotebookButton from '../components/SaveToNotebookButton';

const Lesson = () => {
  const navigate = useNavigate();
  const [sidebarExpandedModule, setSidebarExpandedModule] = useState<number | null>(1);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(288);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        const newWidth = e.clientX;
        if (newWidth > 200 && newWidth < 600) {
          setLeftSidebarWidth(newWidth);
        }
      } else if (isDraggingRight) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 250 && newWidth < 800) {
          setRightSidebarWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight]);

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
      <aside 
        style={{ width: `${leftSidebarWidth}px` }}
        className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-r-2 border-dashed border-gray-300 dark:border-gray-700 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 flex-shrink-0 transition-colors duration-300"
      >
        <div 
          onMouseDown={() => setIsDraggingLeft(true)}
          className={`absolute top-0 -right-2 bottom-0 w-4 cursor-col-resize hover:bg-blue-500/20 active:bg-blue-500/40 z-30 transition-colors ${isDraggingLeft ? 'bg-blue-500/40' : ''}`}
        />
        <div className="flex flex-col justify-between h-full p-6 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center mt-2">
            <div 
              className="text-3xl font-['Kalam',cursive] font-bold text-blue-600 dark:text-blue-400 cursor-pointer transform -rotate-2"
              onClick={() => navigate('/home')}
            >
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
          onClick={() => navigate('/roadmap', { replace: true })}
          className="mt-8 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] dark:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] transition-all active:translate-y-0.5 active:shadow-none w-full font-['Kalam',cursive] text-lg flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Roadmap
        </button>
        </div>
      </aside>
      )}

      {/* Main Lesson Content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative p-8 md:p-12">
        <div className="max-w-5xl w-full mx-auto flex flex-col flex-1">
          
          {/* Top Breadcrumb & Actions */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
              <span className="hover:text-blue-500 cursor-pointer" onClick={() => navigate('/roadmap', { replace: true })}>Back-End Developer</span>
              <ChevronRight className="w-4 h-4" />
              <span>Foundations</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-800 dark:text-gray-200">What is back end?</span>
            </div>
            
            <button onClick={() => navigate('/quiz')} className="px-5 py-2 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] dark:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] transition-all active:translate-y-0.5 active:shadow-none flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Take lesson quiz
            </button>
          </div>

          {/* Lesson Video Placeholder */}
          <div className="w-full aspect-video bg-gray-900 rounded-3xl border-4 border-gray-800 dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(31,41,55,1)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] mb-8 flex items-center justify-center relative overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-transparent transition-colors z-10"></div>
            <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(190,24,93,1)] transform group-hover:scale-110 transition-transform z-20">
              <Play className="w-10 h-10 text-white fill-white ml-2" />
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="font-bold">What is back end? - Introduction</div>
              <div className="font-bold text-sm bg-black/50 px-3 py-1 rounded-lg backdrop-blur-sm">10:45</div>
            </div>
          </div>

          {/* Lesson Content Area */}
          <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-3xl border-4 border-gray-300 dark:border-gray-700 shadow-[8px_8px_0px_0px_rgba(156,163,175,1)] dark:shadow-[8px_8px_0px_0px_rgba(55,65,81,0.8)] relative">
            <div className="absolute -top-4 -right-4 w-12 h-6 bg-yellow-400/80 dark:bg-yellow-500/40 transform rotate-12 backdrop-blur-sm shadow-sm pointer-events-none border-2 border-yellow-500 dark:border-yellow-600"></div>
            
            <h1 className="text-4xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 mb-6">What is Back-End?</h1>
            
            <div className="prose prose-lg dark:prose-invert max-w-none font-bold text-gray-600 dark:text-gray-300">
              <p className="mb-4">
                The back end, or the "server side", is the part of a website or software application that users don't see. It is responsible for storing and organizing data, and ensuring everything on the client side actually works. 
              </p>
              <p className="mb-4">
                Think of a restaurant. The front end is the dining room and the menu — everything the customer interacts with. The back end is the kitchen, where the food (data) is prepared, cooked, and organized before being sent out to the customer.
              </p>
              <h3 className="text-2xl font-['Kalam',cursive] text-gray-800 dark:text-gray-200 mt-8 mb-4">Key Components</h3>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li><strong>Server:</strong> The computer that receives requests from the front end.</li>
                <li><strong>Application:</strong> The logic that processes those requests.</li>
                <li><strong>Database:</strong> Where all the information is stored.</li>
              </ul>
            </div>
          </div>

          {/* Next/Prev Navigation */}
          <div className="flex justify-between items-center mt-12 pb-12">
            <button className="px-6 py-4 rounded-2xl font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 shadow-sm transition-all flex items-center gap-3 opacity-50 cursor-not-allowed">
              <ChevronLeft className="w-5 h-5" />
              Previous Lesson
            </button>
            <button onClick={() => navigate('/quiz')} className="px-8 py-4 rounded-2xl font-bold text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900 border-2 border-blue-400 dark:border-blue-700 shadow-[4px_4px_0px_0px_rgba(96,165,250,1)] dark:shadow-[2px_2px_0px_0px_rgba(30,58,138,0.8)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(96,165,250,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(30,58,138,0.8)] transition-all flex items-center gap-3 font-['Kalam',cursive] text-xl">
              Take lesson quiz
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

        </div>
      </main>

      {/* Floating Button to open AI */}
      {!isAIAssistantOpen && (
        <button 
          onClick={() => setIsAIAssistantOpen(true)}
          className="absolute bottom-8 right-8 z-30 bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-full shadow-[4px_4px_0px_0px_rgba(126,34,206,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(126,34,206,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center"
        >
          <Sparkles className="w-8 h-8 fill-purple-200 text-purple-200" />
        </button>
      )}

      {/* Right Sidebar - AI Assistant */}
      {isAIAssistantOpen && (
        <aside 
          style={{ width: `${rightSidebarWidth}px` }}
          className="relative bg-purple-50/50 dark:bg-gray-800/40 backdrop-blur-xl border-l-2 border-dashed border-gray-300 dark:border-gray-700 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-40 flex-shrink-0 transition-all duration-300 absolute right-0 top-0 bottom-0 md:relative"
        >
          <div 
            onMouseDown={() => setIsDraggingRight(true)}
            className={`absolute top-0 -left-2 bottom-0 w-4 cursor-col-resize hover:bg-purple-500/20 active:bg-purple-500/40 z-50 transition-colors ${isDraggingRight ? 'bg-purple-500/40' : ''}`}
          />
          <div className="flex flex-col h-full p-6 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-['Kalam',cursive] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-3 tracking-wide transform -rotate-1">
              <Sparkles className="w-8 h-8 fill-purple-500 text-purple-500" /> 
              AI Assistant
            </h2>
            <button 
              onClick={() => setIsAIAssistantOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-800/50 rounded-full p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-6 pb-4 pr-2 custom-scrollbar">
            <div className="bg-white dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 p-4 rounded-3xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] dark:shadow-[4px_4px_0px_0px_rgba(55,65,81,0.8)] mr-4 text-md font-bold text-gray-700 dark:text-gray-300 relative">
              Hello! I'm your AI learning assistant. Ready to start your Back-End journey?
              <SaveToNotebookButton courseTitle="Back-End Developer" content="Hello! I'm your AI learning assistant. Ready to start your Back-End journey?" />
            </div>
            
            <div className="bg-pink-100 dark:bg-pink-900/40 border-4 border-pink-300 dark:border-pink-700 p-4 rounded-3xl rounded-tr-none shadow-[4px_4px_0px_0px_rgba(244,114,182,1)] dark:shadow-[4px_4px_0px_0px_rgba(190,24,93,0.8)] ml-4 text-md font-bold text-pink-900 dark:text-pink-100 self-end relative transform rotate-1">
              What is an API? I'm confused about the concept.
            </div>
            
            <div className="bg-white dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 p-4 rounded-3xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] dark:shadow-[4px_4px_0px_0px_rgba(55,65,81,0.8)] mr-4 text-md font-bold text-gray-700 dark:text-gray-300 relative">
              Think of an API as a waiter in a restaurant. You (the client) give your order to the waiter (the API), who takes it to the kitchen (the server/database), and then brings your food (the data) back to you!
              <SaveToNotebookButton courseTitle="Back-End Developer" content="Think of an API as a waiter in a restaurant. You (the client) give your order to the waiter (the API), who takes it to the kitchen (the server/database), and then brings your food (the data) back to you!" />
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
          </div>
        </aside>
      )}

    </div>
  );
};

export default Lesson;
