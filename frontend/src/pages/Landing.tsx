import React, { useEffect, useState } from 'react';
import { Search, ArrowRight, Moon, Sun } from 'lucide-react';
import LoginModal from '../components/LoginModal';
import SignUpModal from '../components/SignUpModal';
import { useTheme } from '../hooks/useTheme';

const Landing = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
      observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Add Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Nunito:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-['Nunito',sans-serif] overflow-x-hidden flex flex-col transition-colors duration-300">
      
      {/* Navigation Header (Outside Grid Background) */}
      <div className="bg-white dark:bg-gray-800 relative z-20 border-b-2 border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300">
        <nav className="flex justify-between items-center py-4 px-8 md:px-16 max-w-7xl mx-auto">
          <div className="text-3xl font-['Kalam',cursive] font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:scale-105 transition-transform transform -rotate-2">
            TutorMe
          </div>
          <div className="flex gap-4 md:gap-6 items-center">
            <a href="#how-it-works" className="font-bold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-['Kalam',cursive] text-lg hidden md:block">How It Works</a>
            <button onClick={toggleTheme} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors hidden sm:block">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setIsLoginOpen(true)}
              className="bg-yellow-300 dark:bg-yellow-500/20 hover:bg-yellow-400 dark:hover:bg-yellow-500/30 text-yellow-900 dark:text-yellow-300 font-bold py-2 px-4 md:px-6 rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[2px_2px_0px_0px_rgba(253,224,71,0.2)] transform -rotate-2 hover:rotate-0 transition-all font-['Kalam',cursive] text-lg border border-yellow-500 dark:border-yellow-400/50"
            >
              Log In
            </button>
            <button 
              onClick={() => setIsSignUpOpen(true)}
              className="bg-green-300 dark:bg-green-500/20 hover:bg-green-400 dark:hover:bg-green-500/30 text-green-900 dark:text-green-300 font-bold py-2 px-4 md:px-6 rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[2px_2px_0px_0px_rgba(134,239,172,0.2)] transform rotate-2 hover:rotate-0 transition-all font-['Kalam',cursive] text-lg border border-green-500 dark:border-green-400/50 hidden sm:block"
            >
              Sign Up
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content Area with Grid Paper Background */}
      <div className="flex-grow relative transition-colors duration-300"
           style={{
             backgroundImage: isDark 
               ? 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)' 
               : 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)',
             backgroundSize: '20px 20px'
           }}>
        
        {/* Decorative notebook line */}
        <div className="absolute top-0 bottom-0 left-8 md:left-12 w-0.5 bg-red-300 dark:bg-red-900/50 z-0"></div>
        
        {/* Decorative scribbles */}
        <div className="absolute top-10 right-4 md:right-32 opacity-40 dark:opacity-20 transform rotate-12 text-blue-400 z-0 pointer-events-none">
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
            <path d="M40 60 C 20 80, 80 80, 70 40 C 60 0, 10 20, 20 50 C 30 80, 90 90, 80 60 C 70 30, 20 10, 40 40" />
          </svg>
        </div>
        
        <div className="absolute top-[40%] left-2 md:left-16 opacity-30 dark:opacity-20 transform -rotate-12 text-pink-400 z-0 pointer-events-none hidden sm:block">
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 50 L35 25 L50 80 L70 30 L85 60" />
          </svg>
        </div>

        <div className="absolute bottom-[20%] right-2 md:right-20 opacity-30 dark:opacity-20 transform rotate-6 text-green-400 z-0 pointer-events-none">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
            <path d="M50 15 L60 40 L85 40 L65 55 L75 80 L50 65 L25 80 L35 55 L15 40 L40 40 Z" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <div className="absolute top-[70%] left-[25%] opacity-25 dark:opacity-15 transform -rotate-6 text-yellow-400 z-0 pointer-events-none hidden lg:block">
           <svg width="150" height="60" viewBox="0 0 150 60" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
              <path d="M10 30 Q 30 10, 50 30 T 90 30 T 130 30" />
           </svg>
        </div>

        {/* Math scribbles */}
        <div className="absolute top-[19%] left-[8%] underline transform -rotate-10 text-gray-400 dark:text-gray-600 z-0 pointer-events-none font-['Kalam',cursive] text-4xl hidden md:block">
         I want to be successful
        </div>
        
        <div className="absolute top-[60%] right-[10%] transform rotate-12 text-gray-400 dark:text-gray-600 z-0 pointer-events-none font-['Kalam',cursive] text-4xl hidden md:block">
          a² + b² = c²
        </div>

        <div className="absolute top-[15%] right-[10%] transform rotate-12 text-gray-400 dark:text-gray-600 z-0 pointer-events-none font-['Kalam',cursive] text-4xl hidden md:block">
           Hello World
        </div>
        
        <div className="absolute bottom-[10%] left-[40%] transform rotate-3 text-gray-400 dark:text-gray-600 z-0 pointer-events-none font-['Kalam',cursive] text-4xl hidden lg:block">
          ∫ f(x) dx
        </div>
        
        <div className="absolute top-[25%] right-[5%] transform -rotate-6 text-gray-400 dark:text-gray-600 z-0 pointer-events-none font-['Kalam',cursive] text-4xl hidden lg:block">
          ∑(x_i)
        </div>

        <div className="absolute top-[50%] left-[4%] transform -rotate-6 text-gray-400 dark:text-gray-600 z-0 pointer-events-none font-['Kalam',cursive] text-4xl hidden lg:block">
          How to become productive
        </div>

        {/* Physical 3D Origami Plane with Trail */}
        <div className="absolute top-[25%] right-[15%] z-0 hidden md:block">
          <div className="relative w-[100px] h-[100px]">
            {/* Trail */}
            <svg width="160" height="140" viewBox="0 0 160 140" className="absolute top-0 left-0 -z-10 opacity-40 dark:opacity-20 text-gray-400 pointer-events-none overflow-visible" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round">
              <path d="M20 80 Q -25 100, -50 125" />
            </svg>
            {/* Plane */}
            <svg width="100" height="100" viewBox="0 0 100 100" className="relative drop-shadow-xl transform rotate-12 transition-transform hover:scale-110">
              <polygon points="20,80 90,10 60,90" fill="#93C5FD" />
              <polygon points="10,60 90,10 20,80" fill="#60A5FA" />
              <polygon points="20,80 90,10 40,75" fill="#3B82F6" />
            </svg>
          </div>
        </div>

        {/* Physical 3D Origami Boat with Trail */}
        <div className="absolute bottom-[25%] left-[15%] z-0 hidden md:block">
          <div className="relative w-[120px] h-[80px]">
            {/* Trail */}
            <svg width="180" height="100" viewBox="0 0 180 100" className="absolute top-0 left-0 -z-10 opacity-40 dark:opacity-20 text-gray-400 pointer-events-none overflow-visible" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round">
              <path d="M30 70 Q -20 85, -60 70" />
            </svg>
            {/* Boat */}
            <svg width="120" height="80" viewBox="0 0 120 80" className="relative drop-shadow-xl transform -rotate-12 transition-transform hover:scale-110">
              <polygon points="60,10 90,50 60,50" fill="#F9A8D4" />
              <polygon points="60,15 35,50 60,50" fill="#F472B6" />
              <polygon points="60,50 110,50 80,75 60,75" fill="#DB2777" />
              <polygon points="10,50 60,50 60,75 40,75" fill="#BE185D" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-12 md:px-24 py-8 md:py-12">
          
          {/* Header/Hero Section */}
        <header className="mb-20 text-center relative mt-6 reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700 ease-out">
          <div className="inline-block relative">
            <h1 className="text-6xl md:text-8xl font-['Kalam',cursive] font-bold text-blue-600 dark:text-blue-400 mb-4 transform -rotate-2 drop-shadow-sm">
              TutorMe
            </h1>
            {/* Fake tape */}
            <div className="absolute -top-4 -right-8 bg-yellow-400/60 dark:bg-yellow-500/40 w-16 h-8 transform rotate-12 backdrop-blur-sm"></div>
            <div className="absolute -bottom-2 -left-4 bg-pink-400/60 dark:bg-pink-500/40 w-12 h-6 transform -rotate-6 backdrop-blur-sm"></div>
          </div>
          <p className="text-xl md:text-2xl mt-6 max-w-2xl mx-auto font-['Kalam',cursive] text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 shadow-sm transform rotate-1">
            AI-powered personal tutor. Stop passive learning, start active practice.
          </p>
          <form className="mt-10 max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4 px-4 sm:px-0" onSubmit={(e) => { e.preventDefault(); setIsSignUpOpen(true); }}>
            <div className="w-full relative flex-grow">
              <input 
                type="text"
                placeholder="What do you want to learn?"
                className="w-full pl-14 pr-6 py-4 rounded-full border-2 border-pink-100 dark:border-pink-900/50 shadow-inner bg-white/80 dark:bg-gray-800/80 backdrop-blur-md focus:outline-none focus:border-pink-300 dark:focus:border-pink-500/50 focus:ring-4 focus:ring-pink-200/50 dark:focus:ring-pink-900/50 font-['Nunito',sans-serif] text-lg text-gray-800 dark:text-gray-100 font-bold transition-all placeholder-gray-400 dark:placeholder-gray-500"
              />
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-pink-400 dark:text-pink-500 w-6 h-6 pointer-events-none z-10" />
            </div>
            <button 
              type="submit"
              className="bg-pink-400 dark:bg-pink-600 hover:bg-pink-500 dark:hover:bg-pink-500 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition hover:scale-105 font-['Kalam',cursive] text-xl tracking-wide border-2 border-pink-600 dark:border-pink-800 flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0"
            >
              Start Learning <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </header>

        {/* Problems Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-24 reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700 ease-out delay-100">
          
          {/* Sticky Note 1 */}
          <div className="bg-yellow-200 dark:bg-yellow-900/40 p-6 rounded-br-2xl shadow-[4px_4px_10px_rgba(0,0,0,0.1)] transform rotate-2 hover:rotate-0 transition duration-300 relative border border-yellow-300 dark:border-yellow-700/50">
            <div className="absolute top-0 left-1/2 w-16 h-5 bg-yellow-500/20 dark:bg-yellow-400/20 -translate-x-1/2 -translate-y-2"></div>
            <h3 className="text-2xl font-bold mb-3 font-['Kalam',cursive] text-yellow-900 dark:text-yellow-300 leading-tight">Information Overload?</h3>
            <p className="text-yellow-950 dark:text-yellow-100/80 font-medium">Too many videos, too much information at once. We break it down into bite-sized pieces.</p>
          </div>

          {/* Sticky Note 2 */}
          <div className="bg-blue-200 dark:bg-blue-900/40 p-6 rounded-br-2xl shadow-[4px_4px_10px_rgba(0,0,0,0.1)] transform -rotate-2 hover:rotate-0 transition duration-300 relative mt-4 md:mt-0 border border-blue-300 dark:border-blue-700/50">
            <div className="absolute top-0 left-1/2 w-16 h-5 bg-blue-500/20 dark:bg-blue-400/20 -translate-x-1/2 -translate-y-2"></div>
            <h3 className="text-2xl font-bold mb-3 font-['Kalam',cursive] text-blue-900 dark:text-blue-300 leading-tight">Passive Learning?</h3>
            <p className="text-blue-950 dark:text-blue-100/80 font-medium">Watching tutorials isn't enough. Our AI ensures you practice actively after every lesson.</p>
          </div>

          {/* Sticky Note 3 */}
          <div className="bg-green-200 dark:bg-green-900/40 p-6 rounded-br-2xl shadow-[4px_4px_10px_rgba(0,0,0,0.1)] transform rotate-3 hover:rotate-0 transition duration-300 relative mt-4 md:mt-0 border border-green-300 dark:border-green-700/50">
            <div className="absolute top-0 left-1/2 w-16 h-5 bg-green-500/20 dark:bg-green-400/20 -translate-x-1/2 -translate-y-2"></div>
            <h3 className="text-2xl font-bold mb-3 font-['Kalam',cursive] text-green-900 dark:text-green-300 leading-tight">Don't Know Where to Start?</h3>
            <p className="text-green-950 dark:text-green-100/80 font-medium">Just enter what you want to learn. Our AI builds a personalized roadmap for you.</p>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="bg-[#fffdf7] dark:bg-gray-800/80 p-8 md:p-10 rounded-2xl border-4 border-gray-800 dark:border-gray-700 shadow-[12px_12px_0px_0px_rgba(31,41,55,1)] dark:shadow-[12px_12px_0px_0px_rgba(17,24,39,1)] mb-24 relative reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700 ease-out delay-200 backdrop-blur-sm">
          <div className="absolute -top-6 -left-4 md:left-8 bg-purple-300 dark:bg-purple-900/80 px-6 py-2 font-['Kalam',cursive] font-bold text-2xl border-4 border-gray-800 dark:border-gray-700 transform -rotate-3 shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] dark:shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] dark:text-purple-200">
            How It Works 🚀
          </div>
          
          <div className="grid md:grid-cols-2 gap-10 mt-8">
            <div className="flex gap-5">
              <div className="bg-pink-300 dark:bg-pink-900/80 w-12 h-12 rounded-full flex items-center justify-center font-bold font-['Kalam',cursive] text-2xl border-4 border-gray-800 dark:border-gray-700 shrink-0 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] dark:text-pink-200">1</div>
              <div>
                <h4 className="font-bold text-xl mb-2 font-['Kalam',cursive] text-gray-800 dark:text-gray-200">Pick a Topic</h4>
                <p className="text-gray-700 dark:text-gray-400 font-medium">Tell us what you want to learn. Coding, Math, History—anything! We'll tailor the content to you.</p>
              </div>
            </div>
            
            <div className="flex gap-5">
              <div className="bg-blue-300 dark:bg-blue-900/80 w-12 h-12 rounded-full flex items-center justify-center font-bold font-['Kalam',cursive] text-2xl border-4 border-gray-800 dark:border-gray-700 shrink-0 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] dark:text-blue-200">2</div>
              <div>
                <h4 className="font-bold text-xl mb-2 font-['Kalam',cursive] text-gray-800 dark:text-gray-200">Get Your Roadmap</h4>
                <p className="text-gray-700 dark:text-gray-400 font-medium">AI generates a clear, step-by-step curriculum with chapters and sub-chapters so you never feel lost.</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="bg-yellow-300 dark:bg-yellow-900/80 w-12 h-12 rounded-full flex items-center justify-center font-bold font-['Kalam',cursive] text-2xl border-4 border-gray-800 dark:border-gray-700 shrink-0 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] dark:text-yellow-200">3</div>
              <div>
                <h4 className="font-bold text-xl mb-2 font-['Kalam',cursive] text-gray-800 dark:text-gray-200">Interactive Practice</h4>
                <p className="text-gray-700 dark:text-gray-400 font-medium">Learn one sub-chapter at a time, followed by quizzes and challenges to solidify your knowledge.</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="bg-green-300 dark:bg-green-900/80 w-12 h-12 rounded-full flex items-center justify-center font-bold font-['Kalam',cursive] text-2xl border-4 border-gray-800 dark:border-gray-700 shrink-0 shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] dark:shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] dark:text-green-200">4</div>
              <div>
                <h4 className="font-bold text-xl mb-2 font-['Kalam',cursive] text-gray-800 dark:text-gray-200">Final Evaluation</h4>
                <p className="text-gray-700 dark:text-gray-400 font-medium">Take a final exam and receive a detailed evaluation with personalized recommendations.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center pb-20 reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700 ease-out delay-300">
          <div className="inline-block bg-pink-200 dark:bg-pink-900/40 p-8 md:p-12 rounded-br-3xl shadow-xl transform rotate-1 relative max-w-2xl mx-auto border border-pink-300 dark:border-pink-700/50">
            <div className="absolute top-0 left-1/2 w-24 h-6 bg-pink-500/20 dark:bg-pink-400/20 -translate-x-1/2 -translate-y-3 shadow-sm"></div>
            <h2 className="text-4xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-pink-300 mb-4">Ready to stop procrastinating?</h2>
            <p className="mb-8 text-gray-800 dark:text-pink-100/80 text-lg font-medium">Join TutorMe and finally master that new skill you've been putting off.</p>
            <button 
              onClick={() => setIsSignUpOpen(true)}
              className="bg-gray-800 hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-500 text-white font-bold py-4 px-10 rounded-xl font-['Kalam',cursive] text-2xl shadow-[6px_6px_0px_0px_#fca5a5] dark:shadow-[6px_6px_0px_0px_#9d174d] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0px_0px_#fca5a5] dark:hover:shadow-[2px_2px_0px_0px_#9d174d] transition-all"
            >
              Create Your Curriculum
            </button>
          </div>
        </div>

        </div>
      </div>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} />
    </div>
  );
};

export default Landing;