import { useState, useEffect } from 'react';
import { Menu, ChevronLeft, Sun, Moon, User, ChevronDown, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import OverviewTab from '../../features/overview/OverviewTab';
import AppointmentsTab from '../../features/appointments/AppointmentsTab';
import FamilyTab from '../../features/family/FamilyTab';
import PurchaseList from '../../features/overview/PurchaseList';
import MedicationDatabaseTab from '../../features/medications/MedicationDatabaseTab';
import AnalyticsTab from '../../features/analytics/AnalyticsTab';
import ReportsTab from '../../features/reports/ReportsTab';
import SettingsTab from '../../features/settings/SettingsTab';

// User Dropdown Component
const UserDropdown = ({ user, getDisplayName, handleSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.user-dropdown')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative user-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1B2430] transition-colors touch-manipulation"
        aria-label="User menu"
      >
        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-[#27335D] flex items-center justify-center border border-emerald-500/30">
          <User className="h-4 w-4 text-emerald-600 dark:text-[#34D399]" />
        </div>
        <span className="text-sm font-medium hidden sm:block text-slate-600 dark:text-[#94a3b8]">{getDisplayName()}</span>
        <ChevronDown className={`h-4 w-4 text-slate-500 dark:text-[#94a3b8] hidden sm:block transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-200 dark:border-[#27335D]">
            <p className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC]">{getDisplayName()}</p>
            <p className="text-xs text-slate-500 dark:text-[#94a3b8] truncate">{user?.email}</p>
          </div>
          <div className="p-1">
            <button
              onClick={() => {
                setIsOpen(false);
                handleSignOut();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardLayout = ({ user, sidebarOpen, setSidebarOpen, handleSignOut, theme, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const navItems = [
    { id: 'overview', label: 'Dashboard' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'family', label: 'Family & Plans' },
    { id: 'purchase_list', label: 'Purchase List' },
    { id: 'med_database', label: 'Med Database' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'reports', label: 'Documents' },
    { id: 'settings', label: 'Settings' },
  ];

  const getDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'Guest User';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#111725]">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#0B101B] md:ml-0">
        <header className="h-14 md:h-16 border-b border-slate-200 dark:border-[#27335D] bg-white/80 dark:bg-[#111725]/80 backdrop-blur-md flex items-center justify-between px-3 md:px-6 shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1B2430] text-slate-500 dark:text-[#94a3b8] touch-manipulation"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-base md:text-lg font-semibold text-slate-800 dark:text-[#F8FAFC] capitalize truncate">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1B2430] text-slate-500 dark:text-[#94a3b8] transition-colors touch-manipulation"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-[#27335D] hidden sm:block" />
            <UserDropdown user={user} getDisplayName={getDisplayName} handleSignOut={handleSignOut} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-8 relative">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'appointments' && <AppointmentsTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'med_database' && <MedicationDatabaseTab />}
            {activeTab === 'family' && <FamilyTab />}
            {activeTab === 'purchase_list' && <PurchaseList />}
            {activeTab === 'reports' && <ReportsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

