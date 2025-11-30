import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import AuthLayout from './components/layout/AuthLayout';
import OfflineSyncManager from './components/layout/OfflineSyncManager';
import InstallAndStatusBanner from './components/layout/InstallAndStatusBanner';
import OAuthCallback from './auth/OAuthCallback';

const MediTrackApp = () => {
  const { user, logout, loading } = useAuth();
  const [view, setView] = useState('landing');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('meditrack_theme');
    return savedTheme || 'light';
  });

  // Check if we're on the OAuth callback route (has tokens in hash)
  const isOAuthCallback = window.location.hash && window.location.hash.includes('accessToken');

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

  // Show OAuth callback handler if on callback route
  if (isOAuthCallback) {
    return <OAuthCallback />;
  }

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} min-h-screen transition-colors duration-300`}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#111725] text-slate-900 dark:text-[#F8FAFC] font-sans selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:bg-[#34D399] dark:selection:text-[#111725]">
        <InstallAndStatusBanner />
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
    <AuthProvider>
      <OfflineSyncManager />
      <MediTrackApp />
    </AuthProvider>
  );
};

export default App;

