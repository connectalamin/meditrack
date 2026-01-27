import { useState, useEffect } from 'react';
import { 
  Activity, LogOut, LayoutDashboard, Calendar, Users, 
  Database, FileText, Settings, ShoppingBag
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, onSignOut }) => {
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
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'family', label: 'Family & Plans', icon: Users },
    { id: 'purchase_list', label: 'Purchase List', icon: ShoppingBag },
    { id: 'med_database', label: 'Med Database', icon: Database },
    { id: 'reports', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (itemId) => {
    setActiveTab(itemId);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <aside
        className={`${sidebarOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'} 
        bg-white dark:bg-[#050816] border-r border-slate-200/80 dark:border-[#27335D] 
        transition-all duration-300 flex flex-col fixed md:relative z-40 h-full 
        shadow-xl shadow-slate-900/5 dark:shadow-black/40 overflow-hidden`}
      >
        {/* Brand */}
        <div className="p-4 md:p-6 flex items-center gap-3 border-b border-slate-200/80 dark:border-[#27335D] shrink-0 bg-white/80 dark:bg-[#050816]/90 backdrop-blur">
            <div className="h-10 w-10 min-h-[2.5rem] min-w-[2.5rem] rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-[#34D399] dark:to-[#2EB886] flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30 dark:shadow-[#34D399]/30">
            <Activity className="h-5 w-5 flex-shrink-0 text-white" />
          </div>
          <div className={`flex flex-col transition-opacity duration-200 ${!sidebarOpen && 'opacity-0 hidden md:flex'}`}>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-[#F8FAFC]">
              MediTrack
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-[#34D399]">
              Family Health
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 md:py-6 px-2 md:px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => handleNavClick(item.id)} 
                className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200 group min-h-[3rem]
                  ${isActive 
                    ? 'bg-emerald-50/90 text-emerald-700 dark:bg-[#34D399]/10 dark:text-[#E2FFF4]' 
                    : 'text-slate-500 hover:bg-emerald-50/60 hover:text-emerald-600 dark:text-[#94a3b8] dark:hover:bg-[#111827] dark:hover:text-[#E2FFF4]'
                  }`}
              >
                {/* Active indicator bar */}
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-emerald-500 dark:bg-[#34D399] transition-all duration-200 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
                
                <div className={`relative flex items-center justify-center h-8 w-8 min-h-[2rem] min-w-[2rem] flex-shrink-0 rounded-xl border text-sm
                  ${isActive 
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:border-[#34D399]/50 dark:bg-[#34D399]/20 dark:text-[#E2FFF4]' 
                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-emerald-600 dark:border-[#27335D] dark:bg-[#050816] dark:text-[#64748b]'
                  }`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                </div>

                <span className={`relative whitespace-nowrap transition-opacity duration-200 ${!sidebarOpen && 'opacity-0 hidden md:block'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-2 md:p-3 border-t border-slate-200/80 dark:border-[#27335D] shrink-0 bg-white/80 dark:bg-[#050816]/90 backdrop-blur">
          <button 
            onClick={onSignOut} 
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-[#f97373] dark:hover:bg-[#ef4444]/10 transition-all duration-200 group"
          >
            <div className="flex items-center justify-center h-8 w-8 min-h-[2rem] min-w-[2rem] flex-shrink-0 rounded-xl border border-red-200/70 bg-red-50/60 text-red-500 dark:border-[#ef4444]/30 dark:bg-[#ef4444]/10">
              <LogOut className="h-4 w-4 flex-shrink-0" />
            </div>
            <span className={`whitespace-nowrap transition-opacity duration-200 ${!sidebarOpen && 'opacity-0 hidden md:block'}`}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

