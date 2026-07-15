import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Settings as SettingsIcon, User, Bell, Shield, Moon, Sun, Trash2 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const Settings = () => {
  const { isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto md:mx-0 pb-16">
        {/* Header Area */}
        <div className="mb-12">
          <h1 className="text-5xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-4">
            <SettingsIcon className="w-10 h-10 text-gray-700 dark:text-gray-300" />
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-bold text-lg">Manage your account and preferences.</p>
        </div>

        <div className="space-y-10">
          {/* Account Profile Note */}
          <section className="bg-yellow-100 dark:bg-yellow-900/40 p-8 rounded-3xl border-4 border-yellow-300 dark:border-yellow-700/50 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] dark:shadow-[8px_8px_0px_0px_rgba(161,98,7,0.8)] transform rotate-1 relative max-w-2xl">
            <div className="absolute -top-3 -left-4 w-12 h-6 bg-blue-400/80 dark:bg-blue-500/40 transform rotate-12 backdrop-blur-sm shadow-sm pointer-events-none"></div>
            
            <h2 className="text-3xl font-['Kalam',cursive] font-bold text-yellow-900 dark:text-yellow-300 mb-6 flex items-center gap-3">
              <User className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
              Account Profile
            </h2>
            
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-yellow-900 dark:text-yellow-100/80 font-bold mb-2 text-sm tracking-wide uppercase">Full Name</label>
                <input 
                  type="text" 
                  defaultValue="Andi Student"
                  className="w-full px-4 py-3 rounded-xl border-2 border-yellow-200 dark:border-yellow-800/50 shadow-inner bg-white/90 dark:bg-gray-800/90 backdrop-blur-md focus:outline-none focus:border-yellow-400 dark:focus:border-yellow-500/50 focus:ring-4 focus:ring-yellow-300/50 dark:focus:ring-yellow-900/50 font-['Nunito',sans-serif] text-lg text-gray-800 dark:text-gray-100 font-bold transition-all"
                />
              </div>
              <div>
                <label className="block text-yellow-900 dark:text-yellow-100/80 font-bold mb-2 text-sm tracking-wide uppercase">Email Address</label>
                <input 
                  type="email" 
                  defaultValue="andi@example.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-yellow-200 dark:border-yellow-800/50 shadow-inner bg-white/90 dark:bg-gray-800/90 backdrop-blur-md focus:outline-none focus:border-yellow-400 dark:focus:border-yellow-500/50 focus:ring-4 focus:ring-yellow-300/50 dark:focus:ring-yellow-900/50 font-['Nunito',sans-serif] text-lg text-gray-800 dark:text-gray-100 font-bold transition-all"
                />
              </div>
              <button 
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-3 px-8 rounded-xl shadow-[4px_4px_0px_0px_rgba(202,138,4,0.6)] transform transition hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(202,138,4,0.6)] font-['Kalam',cursive] text-xl tracking-wide border-2 border-yellow-500"
              >
                Save Profile
              </button>
            </form>
          </section>

          {/* Preferences Note */}
          <section className="bg-blue-100 dark:bg-blue-900/40 p-8 rounded-3xl border-4 border-blue-300 dark:border-blue-700/50 shadow-[8px_8px_0px_0px_rgba(96,165,250,1)] dark:shadow-[8px_8px_0px_0px_rgba(30,58,138,0.8)] transform -rotate-1 relative max-w-2xl">
            <div className="absolute -top-4 -right-4 w-12 h-6 bg-pink-400/80 dark:bg-pink-500/40 transform -rotate-12 backdrop-blur-sm shadow-sm pointer-events-none"></div>
            
            <h2 className="text-3xl font-['Kalam',cursive] font-bold text-blue-900 dark:text-blue-300 mb-6 flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              App Preferences
            </h2>
            
            <div className="space-y-6">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-200 dark:bg-blue-800 p-2 rounded-lg">
                    {isDark ? <Moon className="w-6 h-6 text-blue-700 dark:text-blue-300" /> : <Sun className="w-6 h-6 text-blue-700" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-950 dark:text-blue-100 text-lg">Dark Mode</h3>
                    <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">Switch between light and dark themes</p>
                  </div>
                </div>
                
                <button 
                  onClick={toggleTheme}
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${isDark ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* Notifications Toggle */}
              <div className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-200 dark:bg-blue-800 p-2 rounded-lg">
                    <Bell className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-950 dark:text-blue-100 text-lg">Study Reminders</h3>
                    <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">Get notifications to keep your streak</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setNotifications(!notifications)}
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${notifications ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>
          </section>

          {/* Danger Zone Note */}
          <section className="bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border-4 border-red-200 dark:border-red-800/50 shadow-[8px_8px_0px_0px_rgba(254,202,202,1)] dark:shadow-[8px_8px_0px_0px_rgba(153,27,27,0.5)] transform rotate-2 relative max-w-2xl mt-12">
            <div className="absolute top-0 left-1/2 w-16 h-5 bg-red-400/40 dark:bg-red-500/40 -translate-x-1/2 -translate-y-2.5 transform -rotate-2 backdrop-blur-sm shadow-sm pointer-events-none"></div>
            
            <h2 className="text-3xl font-['Kalam',cursive] font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-3">
              Danger Zone
            </h2>
            <p className="text-red-800/80 dark:text-red-300/80 font-bold mb-6">
              Irreversible actions related to your account.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border-2 border-red-200 dark:border-red-800/50 gap-4">
               <div>
                  <h3 className="font-bold text-red-950 dark:text-red-200 text-lg">Delete Account</h3>
                  <p className="text-red-800 dark:text-red-400 text-sm font-medium">Permanently delete your account and all course progress.</p>
               </div>
               <button className="flex-shrink-0 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(153,27,27,0.6)] transform transition hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(153,27,27,0.6)] font-['Kalam',cursive] text-xl tracking-wide border-2 border-red-700 flex items-center gap-2">
                 <Trash2 className="w-5 h-5" /> Delete
               </button>
            </div>
          </section>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
