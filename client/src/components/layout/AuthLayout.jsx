import { Activity, Sun, Moon, ChevronLeft } from 'lucide-react';
import Button from '../ui/Button';
import LandingPage from '../../auth/LandingPage';
import AuthForms from '../../auth/AuthForms';

const AuthLayout = ({ view, setView, theme, toggleTheme }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#111725]">
      <nav className="border-b border-slate-200 dark:border-[#27335D] bg-white/80 dark:bg-[#111725]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
            <div className="h-8 w-8 rounded-lg bg-emerald-500 dark:bg-[#34D399] flex items-center justify-center shadow-sm">
              <Activity className="h-5 w-5 text-white dark:text-[#111725]" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-[#F8FAFC]">MediTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1B2430] text-slate-500 dark:text-[#94a3b8] transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {view === 'landing' && (
              <>
                <button onClick={() => setView('login')} className="text-slate-600 hover:text-emerald-600 dark:text-[#F8FAFC] dark:hover:text-[#34D399] font-medium transition-colors hidden sm:block">Login</button>
                <Button onClick={() => setView('register')}>Get Started</Button>
              </>
            )}
            {view !== 'landing' && (
              <button onClick={() => setView('landing')} className="text-slate-500 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-[#F8FAFC] flex items-center gap-1 text-sm">
                <ChevronLeft size={16} /> Back to Home
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

