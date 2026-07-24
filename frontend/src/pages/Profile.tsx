import { useState, useEffect, type FormEvent } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { User, BookOpen, Clock3, Flame, CalendarDays, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { apiRequest, getApiErrorMessage } from '../lib/api';
import type { ProfileData } from '../types/auth';

function formatDate(date: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(date));
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    const loadProfile = async () => {
      try {
        const response = await apiRequest<ProfileData>('/users/me');
        if (!isCurrent) return;
        setProfile(response);
        setName(response.fullName);
      } catch (requestError) {
        if (isCurrent) {
          setError(getApiErrorMessage(requestError, 'We could not load your profile. Please try again.'));
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void loadProfile();

    return () => {
      isCurrent = false;
    };
  }, []);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fullName = name.trim();
    if (!fullName) {
      setError('Full name is required.');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      const response = await apiRequest<ProfileData>('/users/me', {
        method: 'PATCH',
        body: { fullName },
      });
      setProfile(response);
      setName(response.fullName);
      setIsSaved(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'We could not save your profile. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = profile?.fullName ?? user?.fullName ?? 'Your profile';
  const email = profile?.email ?? user?.email ?? '—';
  const registeredDate = profile ? formatDate(profile.createdAt, { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto md:mx-0 pb-12 sm:pb-16">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 flex items-center gap-2.5 sm:gap-4 leading-tight">
            <User className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 shrink-0" /> My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-bold text-sm sm:text-lg">View your learning progress and account information.</p>
        </div>
        <div className="space-y-6 sm:space-y-10">
          <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-gray-200 dark:border-gray-700 shadow-[4px_4px_0px_0px_rgba(209,213,219,1)] sm:shadow-[6px_6px_0px_0px_rgba(209,213,219,1)] dark:shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] sm:dark:shadow-[6px_6px_0px_0px_rgba(75,85,99,1)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-7">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-500 border-3 sm:border-4 border-blue-700 text-white flex items-center justify-center font-['Kalam',cursive] text-2xl sm:text-3xl font-bold shadow-sm shrink-0">{displayName.trim().charAt(0).toUpperCase() || 'A'}</div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-['Kalam',cursive] font-bold text-gray-900 dark:text-gray-100 leading-tight">{displayName}</h2>
                  <p className="text-gray-600 dark:text-gray-400 font-semibold text-xs sm:text-base flex items-center gap-1.5 sm:gap-2 break-all"><Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> {email}</p>
                </div>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 w-fit shrink-0">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" /> Active learner
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                {label:'Courses joined',value:profile?.coursesJoined ?? '0',icon:BookOpen,color:'text-blue-600 bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700'},
                {label:'Lessons completed',value:profile?.lessonsCompleted ?? '0',icon:CheckCircle2,color:'text-green-600 bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700'},
                {label:'Member since',value:profile ? formatDate(profile.createdAt, { month: 'short', year: 'numeric' }) : '0',icon:Clock3,color:'text-purple-600 bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700'},
                {label:'Current streak',value:profile ? `${profile.streakCount} days` : '0',icon:Flame,color:'text-orange-600 bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700'}
              ].map(({label,value,icon:Icon,color})=>
                <div key={label} className="bg-gray-50 dark:bg-gray-900/50 p-3 sm:p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:-translate-y-0.5 sm:hover:-translate-y-1 transition-transform cursor-default shadow-sm">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl border-2 flex items-center justify-center mb-2 sm:mb-3 ${color}`}><Icon className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
                </div>
              )}
            </div>
          </section>
          
          <section className="bg-yellow-100 dark:bg-yellow-900/40 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-yellow-400 dark:border-yellow-700/50 shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] sm:shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] dark:shadow-[4px_4px_0px_0px_rgba(161,98,7,0.8)] sm:dark:shadow-[8px_8px_0px_0px_rgba(161,98,7,0.8)] transform rotate-0.5 sm:rotate-1 relative">
            <h2 className="text-2xl sm:text-3xl font-['Kalam',cursive] font-bold text-yellow-900 dark:text-yellow-300 mb-4 sm:mb-6 flex items-center gap-2.5 sm:gap-3"><User className="w-6 h-6 sm:w-8 sm:h-8 shrink-0" /> Account Profile</h2>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.7fr] gap-6 sm:gap-8 items-start">
              <form className="space-y-4 sm:space-y-6" onSubmit={saveProfile}>
                <div>
                  <label className="block text-yellow-900 dark:text-yellow-100 font-bold mb-1.5 sm:mb-2 text-xs sm:text-sm uppercase tracking-wider">Full Name</label>
                  <input type="text" value={name} onChange={(event)=>{setName(event.target.value);setIsSaved(false)}} required className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border-3 sm:border-4 border-yellow-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-bold text-sm sm:text-base focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 dark:focus:ring-yellow-900/50 transition-all" />
                </div>
                {error && <p role="alert" className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-3 rounded-xl border-2 border-red-300 dark:border-red-800 w-full sm:w-auto">{error}</p>}
                <button disabled={isLoading || isSaving} type="submit" className="bg-yellow-400 hover:bg-yellow-500 disabled:cursor-wait disabled:opacity-70 text-yellow-900 font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl font-['Kalam',cursive] text-lg sm:text-xl border-3 sm:border-4 border-yellow-600 shadow-[3px_3px_0_#ca8a04] sm:shadow-[4px_4px_0_#ca8a04] hover:translate-y-0.5 hover:shadow-[2px_2px_0_#ca8a04] active:translate-y-1 active:shadow-none transition-all w-full sm:w-auto">{isSaving ? 'Saving…' : 'Save Profile'}</button>
                {isSaved && <p className="text-xs sm:text-sm font-bold ml-0 sm:ml-4 text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 p-3 rounded-xl border-2 border-green-300 inline-block w-full sm:w-auto mt-2 sm:mt-4 text-center">Profile saved to your account!</p>}
              </form>
              <aside className="bg-white/55 dark:bg-gray-800/50 rounded-2xl border-3 sm:border-4 border-yellow-200 dark:border-yellow-800/50 p-4 sm:p-5 shadow-sm transform -rotate-0.5 sm:-rotate-1">
                <h3 className="font-['Kalam',cursive] text-xl sm:text-2xl font-bold text-yellow-900 dark:text-yellow-200 mb-3 sm:mb-4">Account information</h3>
                <dl className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                  <div className="flex gap-3">
                    <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-700 shrink-0 mt-0.5" />
                    <div>
                      <dt className="font-bold text-yellow-900 dark:text-yellow-100 uppercase tracking-wider text-[10px] sm:text-xs mb-0.5 sm:mb-1">Registered</dt>
                      <dd className="text-yellow-800 dark:text-yellow-300 font-bold text-sm sm:text-base">{registeredDate}</dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-700 shrink-0 mt-0.5" />
                    <div>
                      <dt className="font-bold text-yellow-900 dark:text-yellow-100 uppercase tracking-wider text-[10px] sm:text-xs mb-0.5 sm:mb-1">Login email</dt>
                      <dd className="text-yellow-800 dark:text-yellow-300 font-bold text-sm sm:text-base break-all">{email}</dd>
                    </div>
                  </div>
                </dl>
              </aside>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
