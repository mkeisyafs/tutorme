import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import Switch from '../components/Switch';
import { Settings as SettingsIcon, Bell, Shield, Moon, Sun, Trash2, Clock, KeyRound, Mail, Check, Globe } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../auth/useAuth';
import { getPasswordValidationMessage } from '../auth/passwordValidation';
import { apiRequest, getApiErrorMessage } from '../lib/api';
import DeleteAccountModal from '../components/DeleteAccountModal';
import type { AccountSecurityUser } from '../types/auth';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [pomodoroEnabled, setPomodoroEnabled] = useState(() => {
    const stored = localStorage.getItem('tutorme-pomodoro-enabled');
    return stored !== null ? stored === 'true' : true;
  });

  // Modal & Security States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const saveSecurity = async (e: FormEvent) => {
    e.preventDefault();
    const nextEmail = email.trim();
    if (!nextEmail) {
      setPasswordError(t('settings.security.emailRequired'));
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError(t('settings.security.passwordMismatch'));
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
      setPasswordError(getApiErrorMessage(requestError, t('settings.security.defaultError')));
    } finally {
      setIsSecuritySaving(false);
    }
  };

  const currentLang = i18n.language || 'en';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto md:mx-0 pb-16">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-4">
            <SettingsIcon className="w-9 h-9 sm:w-10 sm:h-10 text-gray-700 dark:text-gray-300" /> {t('settings.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-bold text-base sm:text-lg">{t('settings.subtitle')}</p>
        </div>

        <div className="space-y-10">
          
          {/* Account Security Section */}
          <section className="bg-green-100 dark:bg-green-900/40 p-5 sm:p-8 rounded-3xl border-4 border-green-400 dark:border-green-700/50 shadow-[8px_8px_0px_0px_rgba(74,222,128,1)] dark:shadow-[8px_8px_0px_0px_rgba(21,128,61,0.8)] transform rotate-1 relative">
            <h2 className="text-2xl sm:text-3xl font-['Kalam',cursive] font-bold text-green-900 dark:text-green-300 mb-6 flex items-center gap-3">
              <KeyRound className="w-7 h-7 sm:w-8 sm:h-8" /> {t('settings.security.title')}
            </h2>
            <form onSubmit={saveSecurity} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-green-900 dark:text-green-100 font-bold mb-2 text-sm uppercase tracking-wider flex items-center gap-2"><Mail className="w-4 h-4" /> {t('settings.security.email')}</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => { setEmail(e.target.value); setPasswordError(''); setIsSecuritySaved(false); }}
                    required 
                    className="w-full px-4 py-3 rounded-xl border-4 border-green-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-bold focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-200 dark:focus:ring-green-900/50 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-green-900 dark:text-green-100 font-bold mb-2 text-sm uppercase tracking-wider">{t('settings.security.newPassword')}</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(''); setIsSecuritySaved(false); }} 
                    placeholder={t('settings.security.passwordPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border-4 border-green-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-bold focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-200 dark:focus:ring-green-900/50 transition-all placeholder-gray-400" 
                  />
                </div>
                <div>
                  <label className="block text-green-900 dark:text-green-100 font-bold mb-2 text-sm uppercase tracking-wider">{t('settings.security.confirmPassword')}</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); setIsSecuritySaved(false); }} 
                    placeholder={t('settings.security.confirmPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border-4 border-green-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-bold focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-200 dark:focus:ring-green-900/50 transition-all placeholder-gray-400" 
                  />
                </div>
              </div>
              
              {passwordError && <p className="text-red-600 dark:text-red-400 font-bold text-sm bg-red-100 dark:bg-red-900/30 p-3 rounded-xl border-2 border-red-300">{passwordError}</p>}
              
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button disabled={isSecuritySaving} type="submit" className="w-full sm:w-auto bg-green-500 hover:bg-green-600 disabled:cursor-wait disabled:opacity-70 text-white font-bold py-3 px-8 rounded-xl font-['Kalam',cursive] text-xl border-4 border-green-700 shadow-[4px_4px_0_#15803d] hover:translate-y-0.5 hover:shadow-[2px_2px_0_#15803d] active:translate-y-1 active:shadow-none transition-all">
                  {isSecuritySaving ? t('settings.security.updatingBtn') : t('settings.security.updateBtn')}
                </button>
                {isSecuritySaved && (
                  <p className="text-sm font-bold text-green-800 dark:text-green-200 bg-green-200 dark:bg-green-800/50 p-3 rounded-xl border-2 border-green-400 flex items-center gap-2">
                    <Check className="w-4 h-4" /> {t('settings.security.savedSuccess')}
                  </p>
                )}
              </div>
            </form>
          </section>

          {/* App Preferences Section */}
          <section className="bg-blue-100 dark:bg-blue-900/40 p-5 sm:p-8 rounded-3xl border-4 border-blue-400 dark:border-blue-700/50 shadow-[8px_8px_0px_0px_rgba(96,165,250,1)] dark:shadow-[8px_8px_0px_0px_rgba(30,58,138,0.8)] transform -rotate-1 relative">
            <h2 className="text-2xl sm:text-3xl font-['Kalam',cursive] font-bold text-blue-900 dark:text-blue-300 mb-6 flex items-center gap-3">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8" /> {t('settings.preferences.title')}
            </h2>
            <div className="space-y-4">

              {/* Language Switcher Card */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-white/70 dark:bg-gray-800/70 p-4 sm:p-5 rounded-2xl border-4 border-blue-200 dark:border-blue-800/50 shadow-sm gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="bg-blue-200 dark:bg-blue-800 p-3 rounded-xl border-2 border-blue-300 dark:border-blue-700 shrink-0">
                    <Globe className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-blue-950 dark:text-blue-100 text-base sm:text-lg">{t('settings.preferences.language.title')}</h3>
                    <p className="text-blue-800 dark:text-blue-300 text-xs sm:text-sm font-semibold">{t('settings.preferences.language.subtitle')}</p>
                  </div>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => changeLanguage('en')}
                    className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-bold font-['Kalam',cursive] text-base sm:text-lg border-2 transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                      currentLang.startsWith('en')
                        ? 'bg-blue-600 text-white border-blue-800 shadow-[2px_2px_0_#1e3a8a]'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span>🇺🇸</span> {t('settings.preferences.language.english')}
                  </button>
                  <button
                    type="button"
                    onClick={() => changeLanguage('id')}
                    className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-bold font-['Kalam',cursive] text-base sm:text-lg border-2 transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                      currentLang.startsWith('id')
                        ? 'bg-blue-600 text-white border-blue-800 shadow-[2px_2px_0_#1e3a8a]'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span>🇮🇩</span> {t('settings.preferences.language.indonesian')}
                  </button>
                </div>
              </div>

              {/* Dark Mode Switch */}
              <div onClick={toggleTheme} className="flex items-center justify-between bg-white/70 dark:bg-gray-800/70 p-4 sm:p-5 rounded-2xl border-4 border-blue-200 dark:border-blue-800/50 shadow-sm cursor-pointer gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-200 dark:bg-blue-800 p-3 rounded-xl border-2 border-blue-300 dark:border-blue-700 shrink-0">
                    {isDark ? <Moon className="w-6 h-6 text-blue-700 dark:text-blue-300" /> : <Sun className="w-6 h-6 text-blue-700" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-950 dark:text-blue-100 text-base sm:text-lg">{t('settings.preferences.darkMode.title')}</h3>
                    <p className="text-blue-800 dark:text-blue-300 text-xs sm:text-sm font-semibold">{t('settings.preferences.darkMode.subtitle')}</p>
                  </div>
                </div>
                <Switch 
                  checked={isDark} 
                  onChange={() => toggleTheme()} 
                  color="blue"
                  label={t('settings.preferences.darkMode.title')}
                />
              </div>

              {/* Study Reminders */}
              <div onClick={() => setNotifications(!notifications)} className="flex items-center justify-between bg-white/70 dark:bg-gray-800/70 p-4 sm:p-5 rounded-2xl border-4 border-blue-200 dark:border-blue-800/50 shadow-sm cursor-pointer gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-200 dark:bg-blue-800 p-3 rounded-xl border-2 border-blue-300 dark:border-blue-700 shrink-0">
                    <Bell className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-950 dark:text-blue-100 text-base sm:text-lg">{t('settings.preferences.studyReminders.title')}</h3>
                    <p className="text-blue-800 dark:text-blue-300 text-xs sm:text-sm font-semibold">{t('settings.preferences.studyReminders.subtitle')}</p>
                  </div>
                </div>
                <Switch 
                  checked={notifications} 
                  onChange={(checked) => setNotifications(checked)} 
                  color="blue"
                  label={t('settings.preferences.studyReminders.title')}
                />
              </div>

              {/* Pomodoro Timer */}
              <div onClick={togglePomodoro} className="flex items-center justify-between bg-white/70 dark:bg-gray-800/70 p-4 sm:p-5 rounded-2xl border-4 border-blue-200 dark:border-blue-800/50 shadow-sm cursor-pointer gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-200 dark:bg-blue-800 p-3 rounded-xl border-2 border-blue-300 dark:border-blue-700 shrink-0">
                    <Clock className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-950 dark:text-blue-100 text-base sm:text-lg">{t('settings.preferences.pomodoroTimer.title')}</h3>
                    <p className="text-blue-800 dark:text-blue-300 text-xs sm:text-sm font-semibold">{t('settings.preferences.pomodoroTimer.subtitle')}</p>
                  </div>
                </div>
                <Switch 
                  checked={pomodoroEnabled} 
                  onChange={() => togglePomodoro()} 
                  color="blue"
                  label={t('settings.preferences.pomodoroTimer.title')}
                />
              </div>
            </div>
          </section>

          {/* Danger Zone Section */}
          <section className="bg-red-50 dark:bg-red-900/20 p-5 sm:p-8 rounded-3xl border-4 border-red-300 dark:border-red-800/50 shadow-[8px_8px_0px_0px_rgba(252,165,165,1)] dark:shadow-[8px_8px_0px_0px_rgba(153,27,27,0.5)] transform rotate-1 relative">
            <h2 className="text-2xl sm:text-3xl font-['Kalam',cursive] font-bold text-red-700 dark:text-red-400 mb-2">{t('settings.dangerZone.title')}</h2>
            <p className="text-red-800/80 dark:text-red-300/80 font-bold mb-6 text-sm sm:text-base">{t('settings.dangerZone.subtitle')}</p>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/70 dark:bg-gray-800/70 p-5 rounded-2xl border-4 border-red-200 dark:border-red-800/50 gap-4 shadow-sm">
              <div>
                <h3 className="font-bold text-red-950 dark:text-red-200 text-base sm:text-lg">{t('settings.dangerZone.deleteAccount')}</h3>
                <p className="text-red-800 dark:text-red-400 text-xs sm:text-sm font-semibold">{t('settings.dangerZone.deleteDescription')}</p>
              </div>
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex-shrink-0 w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl font-['Kalam',cursive] text-lg sm:text-xl border-4 border-red-700 shadow-[4px_4px_0_#b91c1c] hover:translate-y-0.5 hover:shadow-[2px_2px_0_#b91c1c] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" /> {t('settings.dangerZone.deleteBtn')}
              </button>
            </div>
          </section>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </DashboardLayout>
  );
};

export default Settings;
