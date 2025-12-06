import { useState, useEffect } from 'react';
import { 
  Activity, LogOut, LayoutDashboard, Calendar, Users, 
  Database, TrendingUp, FileText, Settings, ShoppingBag
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
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
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
      
      <aside className={`${sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'} bg-white dark:bg-[#111725] border-r border-slate-200 dark:border-[#27335D] transition-all duration-300 flex flex-col fixed md:relative z-40 h-full shadow-lg dark:shadow-none overflow-hidden`}>
        <div className="p-4 md:p-6 flex items-center gap-3 border-b border-slate-200 dark:border-[#27335D] shrink-0">
        <div className="h-8 w-8 rounded-lg bg-emerald-500 dark:bg-[#34D399] flex items-center justify-center shrink-0 shadow-sm">
          <Activity className="h-5 w-5 text-white dark:text-[#111725]" />
        </div>
          <span className={`font-bold text-xl tracking-tight transition-opacity duration-200 text-slate-900 dark:text-[#F8FAFC] ${!sidebarOpen && 'opacity-0 hidden md:block'}`}>MediTrack</span>
      </div>
        <nav className="flex-1 py-4 md:py-6 px-2 md:px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <button 
            key={item.id} 
              onClick={() => handleNavClick(item.id)} 
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${activeTab === item.id ? 'bg-emerald-50 text-emerald-600 dark:bg-[#34D399]/10 dark:text-[#34D399]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:bg-[#1B2430] dark:hover:text-[#F8FAFC]'}`}
          >
            <item.icon className="h-5 w-5 shrink-0" />
              <span className={`whitespace-nowrap transition-opacity duration-200 ${!sidebarOpen && 'opacity-0 hidden md:block'}`}>{item.label}</span>
          </button>
        ))}
      </nav>
        <div className="p-2 md:p-3 border-t border-slate-200 dark:border-[#27335D] shrink-0">
        <button 
          onClick={onSignOut} 
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:text-[#ef4444] dark:hover:bg-[#ef4444]/10 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${!sidebarOpen && 'opacity-0 hidden md:block'}`}>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;

