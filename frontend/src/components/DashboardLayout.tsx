import React, { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, LibraryBig, Settings, LogOut, Moon, Sun, User } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { listed } from '../constant/listed';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-['Nunito',sans-serif] overflow-x-hidden flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Sidebar / Topnav */}
      <aside className="w-full md:w-64 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-b-2 md:border-b-0 md:border-r-2 border-dashed border-gray-300 dark:border-gray-700 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 flex-shrink-0 flex flex-row md:flex-col justify-between md:min-h-screen sticky top-0 md:relative transition-colors duration-300">
        <div className="p-4 md:p-8 flex-grow flex md:block items-center justify-between">
          <div className="flex justify-between items-center md:mb-12">
            {/* Logo */}
            <div className="text-3xl font-['Kalam',cursive] font-bold text-blue-600 dark:text-blue-400 cursor-pointer transform -rotate-2">
              TutorMe
            </div>
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex flex-row md:flex-col gap-2 md:gap-4 justify-around md:justify-start">
            <NavLink 
              to={listed.home}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 shadow-sm transform -rotate-1' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'}`
              }
            >
              <Home className="w-5 h-5" />
              <span className="hidden md:inline font-['Kalam',cursive] text-xl">Home</span>
            </NavLink>

            <NavLink 
              to={listed.course}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 shadow-sm transform rotate-1' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'}`
              }
            >
              <BookOpen className="w-5 h-5" />
              <span className="hidden md:inline font-['Kalam',cursive] text-xl">Courses</span>
            </NavLink>

            <NavLink 
              to={listed.library}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 shadow-sm transform -rotate-1' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'}`
              }
            >
              <LibraryBig className="w-5 h-5" />
              <span className="hidden md:inline font-['Kalam',cursive] text-xl">Library</span>
            </NavLink>

            <NavLink 
              to={listed.profile}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 shadow-sm transform rotate-1' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'}`
              }
            >
              <User className="w-5 h-5" />
              <span className="hidden md:inline font-['Kalam',cursive] text-xl">Profile</span>
            </NavLink>

            <NavLink 
              to={listed.settings}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'}`
              }
            >
              <Settings className="w-5 h-5" />
              <span className="hidden md:inline font-['Kalam',cursive] text-xl">Settings</span>
            </NavLink>
          </nav>
        </div>

        {/* Logout (Desktop) */}
        <div className="p-4 md:p-8 hidden md:block mt-auto">
           <button className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 w-full transition-colors font-['Kalam',cursive] text-xl border-2 border-transparent hover:border-red-200 dark:hover:border-red-800">
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow relative flex flex-col min-h-screen md:h-screen md:overflow-y-auto transition-colors duration-300"
           style={{
             backgroundImage: isDark 
               ? 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)' 
               : 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)',
             backgroundSize: '20px 20px'
           }}>
        <div className="flex flex-row flex-grow">
          {/* Decorative notebook line */}
          <div className="w-8 md:w-12 border-r-[2px] border-red-300 dark:border-red-900/50 flex-shrink-0 hidden md:block pointer-events-none"></div>
          
          {/* Content Wrapper */}
          <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-12 py-8 md:py-12">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
