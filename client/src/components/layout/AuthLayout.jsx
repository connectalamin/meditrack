import { Activity, Sun, Moon, ChevronLeft, LogIn, UserPlus } from 'lucide-react';
import Button from '../ui/Button';
import LandingPage from '../../auth/LandingPage';
import AuthForms from '../../auth/AuthForms';

const AuthLayout = ({ view, setView, theme, toggleTheme }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 dark:from-[#0B101B] dark:via-[#111725] dark:to-[#0B101B] transition-colors duration-300">
      <nav className="border-b border-slate-200/50 dark:border-[#27335D]/50 bg-white/90 dark:bg-[#111725]/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm shadow-slate-900/5 dark:shadow-black/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group transition-transform hover:scale-105" 
            onClick={() => setView('landing')}
          >
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-[#34D399] dark:to-[#2EB886] flex items-center justify-center shadow-lg shadow-emerald-500/30 dark:shadow-[#34D399]/30 group-hover:shadow-emerald-500/50 dark:group-hover:shadow-[#34D399]/50 transition-all">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-[#F8FAFC] leading-none">
                MediTrack
              </span>
              <span className="text-xs text-slate-500 dark:text-[#94a3b8] font-medium hidden sm:block">
                Health Management
              </span>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1B2430] text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-all duration-200 hover:scale-105 active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-[#27335D]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Landing Page Actions */}
            {view === 'landing' && (
              <>
                <button 
                  onClick={() => setView('login')} 
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-700 dark:text-[#F8FAFC] hover:text-emerald-600 dark:hover:text-[#34D399] font-semibold transition-all duration-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/20"
                >
                  <LogIn size={18} />
                  Login
                </button>
                <Button 
                  onClick={() => setView('register')}
                  className="flex items-center gap-2 px-5 py-2.5 h-auto"
                >
                  <UserPlus size={18} />
                  Get Started
                </Button>
              </>
            )}

            {/* Auth Forms Back Button */}
            {view !== 'landing' && (
              <button 
                onClick={() => setView('landing')} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-[#F8FAFC] font-semibold transition-all duration-200 hover:bg-slate-100 dark:hover:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] hover:border-slate-300 dark:hover:border-[#344275] group"
              >
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {view === 'landing' ? <LandingPage setView={setView} /> : <AuthForms view={view} setView={setView} />}
    </div>
  );
};

export default AuthLayout;

