import { useState, type FormEvent } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Switch from '../components/Switch';
import { Settings as SettingsIcon, Bell, Shield, Moon, Sun, Trash2, Clock, KeyRound, Mail, Check } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../auth/useAuth';
import { getPasswordValidationMessage } from '../auth/passwordValidation';
import { apiRequest, getApiErrorMessage } from '../lib/api';
import type { AccountSecurityUser } from '../types/auth';

const Settings = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [pomodoroEnabled, setPomodoroEnabled] = useState(() => {
    const stored = localStorage.getItem('tutorme-pomodoro-enabled');
    return stored !== null ? stored === 'true' : true;
  });

  // Security States
  const [email, setEmail] = useState(() => user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSecuritySaved, setIsSecuritySaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isSecuritySaving, setIsSecuritySaving] = useState(false);

  const togglePomodoro = () => {
    const newValue = !pomodoroEnabled;
    setPomodoroEnabled(newValue);
    localStorage.setItem('tutorme-pomodoro-enabled', String(newValue));
    window.dispatchEvent(new Event('pomodoro-settings-changed'));
  };

  const saveSecurity = async (e: FormEvent) => {
    e.preventDefault();
    const nextEmail = email.trim();
    if (!nextEmail) {
      setPasswordError('Email address is required.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match!");
      return;
    }

    if (password) {
      const passwordValidationError = getPasswordValidationMessage(password);
      if (passwordValidationError) {
        setPasswordError(passwordValidationError);
        return;
      }
    }

    setPasswordError('');
    setIsSecuritySaving(true);
    try {
      const updatedUser = await apiRequest<AccountSecurityUser>('/users/me/security', {
        method: 'PATCH',
        body: {
          email: nextEmail,
          ...(password ? { password } : {}),
        },
      });
      updateUser(updatedUser);
      setEmail(updatedUser.email);
      setPassword('');
      setConfirmPassword('');
      setIsSecuritySaved(true);
    } catch (requestError) {
      setPasswordError(getApiErrorMessage(requestError, 'We could not update your account security. Please try again.'));
    } finally {
      setIsSecuritySaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto md:mx-0 pb-16">
        <div className="mb-12">
          <h1 className="text-5xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-4">
            <SettingsIcon className="w-10 h-10 text-gray-700 dark:text-gray-300" /> Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-bold text-lg">Manage your app preferences and account security.</p>
        </div>

        <div className="space-y-10">
          
          {/* Account Security Section */}
          <section className="bg-green-100 dark:bg-green-900/40 p-5 sm:p-8 rounded-3xl border-4 border-green-400 dark:border-green-700/50 shadow-[8px_8px_0px_0px_rgba(74,222,128,1)] dark:shadow-[8px_8px_0px_0px_rgba(21,128,61,0.8)] transform rotate-1 relative">
            <h2 className="text-3xl font-['Kalam',cursive] font-bold text-green-900 dark:text-green-300 mb-6 flex items-center gap-3">
              <KeyRound className="w-8 h-8" /> Account Security
            </h2>
            <form onSubmit={saveSecurity} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-green-900 dark:text-green-100 font-bold mb-2 text-sm uppercase tracking-wider flex items-center gap-2"><Mail className="w-4 h-4" /> Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => { setEmail(e.target.value); setPasswordError(''); setIsSecuritySaved(false); }}
                    required 
                    className="w-full px-4 py-3 rounded-xl border-4 border-green-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-bold focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-200 dark:focus:ring-green-900/50 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-green-900 dark:text-green-100 font-bold mb-2 text-sm uppercase tracking-wider">New Password</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(''); setIsSecuritySaved(false); }} 
                    placeholder="Leave blank to keep current"
                    className="w-full px-4 py-3 rounded-xl border-4 border-green-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-bold focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-200 dark:focus:ring-green-900/50 transition-all placeholder-gray-400" 
                  />
                </div>
                <div>
                  <label className="block text-green-900 dark:text-green-100 font-bold mb-2 text-sm uppercase tracking-wider">Confirm Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); setIsSecuritySaved(false); }} 
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 rounded-xl border-4 border-green-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-bold focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-200 dark:focus:ring-green-900/50 transition-all placeholder-gray-400" 
                  />
                </div>
              </div>
              
              {passwordError && <p className="text-red-600 dark:text-red-400 font-bold text-sm bg-red-100 dark:bg-red-900/30 p-3 rounded-xl border-2 border-red-300">{passwordError}</p>}
              
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button disabled={isSecuritySaving} type="submit" className="w-full sm:w-auto bg-green-500 hover:bg-green-600 disabled:cursor-wait disabled:opacity-70 text-white font-bold py-3 px-8 rounded-xl font-['Kalam',cursive] text-xl border-4 border-green-700 shadow-[4px_4px_0_#15803d] hover:translate-y-0.5 hover:shadow-[2px_2px_0_#15803d] active:translate-y-1 active:shadow-none transition-all">
                  {isSecuritySaving ? 'Updating…' : 'Update Security'}
                </button>
                {isSecuritySaved && (
                  <p className="text-sm font-bold text-green-800 dark:text-green-200 bg-green-200 dark:bg-green-800/50 p-3 rounded-xl border-2 border-green-400 flex items-center gap-2">
                    <Check className="w-4 h-4" /> Changes saved!
                  </p>
                )}
              </div>
            </form>
          </section>

          {/* App Preferences Section */}
          <section className="bg-blue-100 dark:bg-blue-900/40 p-5 sm:p-8 rounded-3xl border-4 border-blue-400 dark:border-blue-700/50 shadow-[8px_8px_0px_0px_rgba(96,165,250,1)] dark:shadow-[8px_8px_0px_0px_rgba(30,58,138,0.8)] transform -rotate-1 relative">
            <h2 className="text-3xl font-['Kalam',cursive] font-bold text-blue-900 dark:text-blue-300 mb-6 flex items-center gap-3">
              <Shield className="w-8 h-8" /> App Preferences
            </h2>
            <div className="space-y-4">
              <div onClick={toggleTheme} className="flex items-center justify-between bg-white/70 dark:bg-gray-800/70 p-4 sm:p-5 rounded-2xl border-4 border-blue-200 dark:border-blue-800/50 shadow-sm cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-200 dark:bg-blue-800 p-3 rounded-xl border-2 border-blue-300 dark:border-blue-700">
                    {isDark ? <Moon className="w-6 h-6 text-blue-700 dark:text-blue-300" /> : <Sun className="w-6 h-6 text-blue-700" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-950 dark:text-blue-100 text-lg">Dark Mode</h3>
                    <p className="text-blue-800 dark:text-blue-300 text-sm font-semibold">Switch between light and dark themes</p>
                  </div>
                </div>
                <Switch 
                  checked={isDark} 
                  onChange={() => toggleTheme()} 
                  color="blue"
                  label="Toggle dark mode"
                />
              </div>

              <div onClick={() => setNotifications(!notifications)} className="flex items-center justify-between bg-white/70 dark:bg-gray-800/70 p-4 sm:p-5 rounded-2xl border-4 border-blue-200 dark:border-blue-800/50 shadow-sm cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-200 dark:bg-blue-800 p-3 rounded-xl border-2 border-blue-300 dark:border-blue-700">
                    <Bell className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-950 dark:text-blue-100 text-lg">Study Reminders</h3>
                    <p className="text-blue-800 dark:text-blue-300 text-sm font-semibold">Get notifications to keep your streak</p>
                  </div>
                </div>
                <Switch 
                  checked={notifications} 
                  onChange={(checked) => setNotifications(checked)} 
                  color="blue"
                  label="Toggle study reminders"
                />
              </div>

              <div onClick={togglePomodoro} className="flex items-center justify-between bg-white/70 dark:bg-gray-800/70 p-4 sm:p-5 rounded-2xl border-4 border-blue-200 dark:border-blue-800/50 shadow-sm cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-200 dark:bg-blue-800 p-3 rounded-xl border-2 border-blue-300 dark:border-blue-700">
                    <Clock className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-950 dark:text-blue-100 text-lg">Pomodoro Timer</h3>
                    <p className="text-blue-800 dark:text-blue-300 text-sm font-semibold">Enable focus timer across learning sessions</p>
                  </div>
                </div>
                <Switch 
                  checked={pomodoroEnabled} 
                  onChange={() => togglePomodoro()} 
                  color="blue"
                  label="Toggle Pomodoro Timer"
                />
              </div>
            </div>
          </section>

          {/* Danger Zone Section */}
          <section className="bg-red-50 dark:bg-red-900/20 p-5 sm:p-8 rounded-3xl border-4 border-red-300 dark:border-red-800/50 shadow-[8px_8px_0px_0px_rgba(252,165,165,1)] dark:shadow-[8px_8px_0px_0px_rgba(153,27,27,0.5)] transform rotate-1 relative">
            <h2 className="text-3xl font-['Kalam',cursive] font-bold text-red-700 dark:text-red-400 mb-2">Danger Zone</h2>
            <p className="text-red-800/80 dark:text-red-300/80 font-bold mb-6">Irreversible actions related to your account.</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white/70 dark:bg-gray-800/70 p-5 rounded-2xl border-4 border-red-200 dark:border-red-800/50 gap-4 shadow-sm">
              <div>
                <h3 className="font-bold text-red-950 dark:text-red-200 text-lg">Delete Account</h3>
                <p className="text-red-800 dark:text-red-400 text-sm font-semibold">Permanently delete your account and all course progress.</p>
              </div>
              <button className="flex-shrink-0 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl font-['Kalam',cursive] text-xl border-4 border-red-700 shadow-[4px_4px_0_#b91c1c] hover:translate-y-0.5 hover:shadow-[2px_2px_0_#b91c1c] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2">
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
