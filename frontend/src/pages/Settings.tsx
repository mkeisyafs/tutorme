import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Settings as SettingsIcon, Bell, Shield, Moon, Sun, Trash2, Clock } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Settings = () => {
  const { isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [pomodoroEnabled, setPomodoroEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('tutorme-pomodoro-enabled');
    if (stored !== null) {
      setPomodoroEnabled(stored === 'true');
    }
  }, []);

  const togglePomodoro = () => {
    const newValue = !pomodoroEnabled;
    setPomodoroEnabled(newValue);
    localStorage.setItem('tutorme-pomodoro-enabled', String(newValue));
    window.dispatchEvent(new Event('pomodoro-settings-changed'));
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto md:mx-0 pb-16">
        <div className="mb-12">
          <h1 className="text-5xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-4"><SettingsIcon className="w-10 h-10" /> Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 font-bold text-lg">Manage your app preferences.</p>
        </div>

        <div className="space-y-10">
          <section className="bg-blue-100 dark:bg-blue-900/40 p-8 rounded-3xl border-4 border-blue-300 dark:border-blue-700/50 shadow-[8px_8px_0px_0px_rgba(96,165,250,1)] dark:shadow-[8px_8px_0px_0px_rgba(30,58,138,0.8)] transform -rotate-1 relative">
            <h2 className="text-3xl font-['Kalam',cursive] font-bold text-blue-900 dark:text-blue-300 mb-6 flex items-center gap-3"><Shield className="w-8 h-8" /> App Preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center gap-3"><div className="bg-blue-200 dark:bg-blue-800 p-2 rounded-lg">{isDark ? <Moon className="w-6 h-6 text-blue-700 dark:text-blue-300" /> : <Sun className="w-6 h-6 text-blue-700" />}</div><div><h3 className="font-bold text-blue-950 dark:text-blue-100 text-lg">Dark Mode</h3><p className="text-blue-800 dark:text-blue-300 text-sm font-medium">Switch between light and dark themes</p></div></div>
                <button onClick={toggleTheme} aria-label="Toggle dark mode" className={`w-14 h-8 rounded-full p-1 transition-colors ${isDark ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}><div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0'}`} /></button>
              </div>
              <div className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center gap-3"><div className="bg-blue-200 dark:bg-blue-800 p-2 rounded-lg"><Bell className="w-6 h-6 text-blue-700 dark:text-blue-300" /></div><div><h3 className="font-bold text-blue-950 dark:text-blue-100 text-lg">Study Reminders</h3><p className="text-blue-800 dark:text-blue-300 text-sm font-medium">Get notifications to keep your streak</p></div></div>
                <button onClick={() => setNotifications(!notifications)} aria-label="Toggle study reminders" className={`w-14 h-8 rounded-full p-1 transition-colors ${notifications ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}><div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} /></button>
              </div>
              <div className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center gap-3"><div className="bg-blue-200 dark:bg-blue-800 p-2 rounded-lg"><Clock className="w-6 h-6 text-blue-700 dark:text-blue-300" /></div><div><h3 className="font-bold text-blue-950 dark:text-blue-100 text-lg">Pomodoro Timer</h3><p className="text-blue-800 dark:text-blue-300 text-sm font-medium">Enable focus timer across your learning sessions</p></div></div>
                <button onClick={togglePomodoro} aria-label="Toggle Pomodoro Timer" className={`w-14 h-8 rounded-full p-1 transition-colors ${pomodoroEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}><div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${pomodoroEnabled ? 'translate-x-6' : 'translate-x-0'}`} /></button>
              </div>
            </div>
          </section>

          <section className="bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border-4 border-red-200 dark:border-red-800/50 shadow-[8px_8px_0px_0px_rgba(254,202,202,1)] dark:shadow-[8px_8px_0px_0px_rgba(153,27,27,0.5)] transform rotate-2 relative">
            <h2 className="text-3xl font-['Kalam',cursive] font-bold text-red-700 dark:text-red-400 mb-2">Danger Zone</h2><p className="text-red-800/80 dark:text-red-300/80 font-bold mb-6">Irreversible actions related to your account.</p>
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border-2 border-red-200 dark:border-red-800/50 gap-4"><div><h3 className="font-bold text-red-950 dark:text-red-200 text-lg">Delete Account</h3><p className="text-red-800 dark:text-red-400 text-sm font-medium">Permanently delete your account and all course progress.</p></div><button className="flex-shrink-0 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl font-['Kalam',cursive] text-xl border-2 border-red-700 flex items-center gap-2"><Trash2 className="w-5 h-5" /> Delete</button></div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
