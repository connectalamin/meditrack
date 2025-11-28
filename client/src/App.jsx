import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import DashboardLayout from './components/layout/DashboardLayout';
import AuthLayout from './components/layout/AuthLayout';

const MediTrackApp = () => {
  const { user, logout, loading } = useApp();
  const [view, setView] = useState('landing');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('meditrack_theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    // Apply theme class to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('meditrack_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Update view when user changes
    if (user) {
      setView('dashboard');
    } else {
      setView('landing');
    }
  }, [user]);

  const toggleTheme = () => {
    setTheme(curr => {
      const newTheme = curr === 'dark' ? 'light' : 'dark';
      return newTheme;
    });
  };

  const handleSignOut = () => {
    logout();
    setView('landing');
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#111725]' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} min-h-screen transition-colors duration-300`}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#111725] text-slate-900 dark:text-[#F8FAFC] font-sans selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:bg-[#34D399] dark:selection:text-[#111725]">
        {user && view === 'dashboard' ? (
          <DashboardLayout 
            user={user} 
            sidebarOpen={sidebarOpen} 
            setSidebarOpen={setSidebarOpen} 
            handleSignOut={handleSignOut} 
            theme={theme} 
            toggleTheme={toggleTheme} 
          />
        ) : (
          <AuthLayout view={view} setView={setView} theme={theme} toggleTheme={toggleTheme} />
        )}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <MediTrackApp />
    </AppProvider>
  );
};

export default App;

