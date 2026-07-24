import React, { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, LibraryBig, Settings, LogOut, Moon, Sun, User, Menu, X } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { listed } from '../constant/listed';
import { useAuth } from '../auth/useAuth';

interface DashboardLayoutProps { children: ReactNode; }

const navItems = [
  { to: listed.home, label: 'Home', icon: Home, active: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300' },
  { to: listed.course, label: 'Courses', icon: BookOpen, active: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' },
  { to: listed.library, label: 'Library', icon: LibraryBig, active: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300' },
  { to: listed.profile, label: 'Profile', icon: User, active: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const navLinkClass = (activeClass: string, isActive: boolean, mobile = false) =>
    `flex items-center gap-3 rounded-xl font-bold transition-all ${mobile ? 'px-3 py-2.5 text-base' : 'px-4 py-3'} ${isActive ? `${activeClass} shadow-sm` : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'}`;

  const navigation = (mobile = false) => (
    <nav className={`flex ${mobile ? 'flex-col gap-2' : 'flex-col gap-4'}`}>
      {navItems.map(({ to, label, icon: Icon, active }) => (
        <NavLink key={to} to={to} onClick={() => mobile && setIsMobileMenuOpen(false)} className={({ isActive }) => navLinkClass(active, isActive, mobile)}>
          <Icon className="w-5 h-5" />
          <span className={`font-['Kalam',cursive] ${mobile ? 'text-lg' : 'text-xl'}`}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-['Nunito',sans-serif] overflow-x-hidden flex flex-col md:flex-row transition-colors duration-300">
      {/* Mobile top bar */}
      <header className="mobile-dashboard-nav sticky top-0 z-40 h-[4.5rem] bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b-2 border-dashed border-gray-300 dark:border-gray-700 px-4 py-3 items-center justify-between shadow-sm">
        <div className="text-3xl font-['Kalam',cursive] font-bold text-blue-600 dark:text-blue-400 transform -rotate-2">TutorMe</div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} aria-label="Toggle dark mode" className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
          <button onClick={() => setIsMobileMenuOpen(true)} aria-label="Open navigation menu" className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"><Menu className="w-6 h-6" /></button>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <div className="mobile-dashboard-drawer fixed inset-0 z-50 pointer-events-none md:hidden">
        <button
          aria-label="Close navigation menu"
          className={`absolute inset-0 bg-gray-900/45 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <aside
          className={`absolute top-0 right-0 h-full w-[min(18rem,84vw)] bg-white dark:bg-gray-800 p-5 flex flex-col shadow-[-12px_0_30px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between mb-8"><span className="text-3xl font-['Kalam',cursive] font-bold text-blue-600 dark:text-blue-400">Menu</span><button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close navigation menu" className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700"><X className="w-6 h-6" /></button></div>
          {navigation(true)}
          <div className="mt-auto pt-6 border-t-2 border-dashed border-gray-200 dark:border-gray-700 space-y-2">
            <NavLink to={listed.settings} onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => navLinkClass('bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200', isActive, true)}><Settings className="w-5 h-5" /><span className="font-['Kalam',cursive] text-lg">Settings</span></NavLink>
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 w-full font-['Kalam',cursive] text-lg"><LogOut className="w-5 h-5" /> Log Out</button>
          </div>
        </aside>
      </div>

      {/* Desktop sidebar */}
      <aside className="desktop-dashboard-nav w-64 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-r-2 border-dashed border-gray-300 dark:border-gray-700 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 flex-shrink-0 flex-col min-h-screen transition-colors duration-300 p-8">
        <div>
          <div className="flex justify-between items-center mb-12"><div className="text-3xl font-['Kalam',cursive] font-bold text-blue-600 dark:text-blue-400 transform -rotate-2">TutorMe</div><button onClick={toggleTheme} aria-label="Toggle dark mode" className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button></div>
          {navigation()}
        </div>
        <div className="mt-auto pt-6 border-t-2 border-dashed border-gray-200 dark:border-gray-700 space-y-2">
          <NavLink to={listed.settings} className={({ isActive }) => navLinkClass('bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200', isActive)}><Settings className="w-5 h-5" /><span className="font-['Kalam',cursive] text-xl">Settings</span></NavLink>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 w-full font-['Kalam',cursive] text-xl"><LogOut className="w-5 h-5" /> Log Out</button>
        </div>
      </aside>

      <main className="flex-grow relative flex flex-col min-h-screen md:h-screen md:overflow-y-auto transition-colors duration-300" style={{ backgroundImage: isDark ? 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)' : 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        <div className="flex flex-row flex-grow"><div className="w-8 md:w-12 border-r-[2px] border-red-300 dark:border-red-900/50 flex-shrink-0 hidden md:block pointer-events-none" /><div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 md:py-12">{children}</div></div>
      </main>
    </div>
  );
};

export default DashboardLayout;
