import { useState } from 'react';
import { 
  Activity, LogOut, LayoutDashboard, Calendar, Users, 
  Database, TrendingUp, FileText, Settings, ShoppingBag
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, onSignOut }) => {
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'family', label: 'Family & Plans', icon: Users },
    { id: 'purchase_list', label: 'Purchase List', icon: ShoppingBag },
    { id: 'med_database', label: 'Med Database', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'reports', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings & Share', icon: Settings },
  ];

  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-[#111725] border-r border-slate-200 dark:border-[#27335D] transition-all duration-300 flex flex-col fixed md:relative z-20 h-full shadow-lg dark:shadow-none`}>
      <div className="p-6 flex items-center gap-3 border-b border-slate-200 dark:border-[#27335D]">
        <div className="h-8 w-8 rounded-lg bg-emerald-500 dark:bg-[#34D399] flex items-center justify-center shrink-0 shadow-sm">
          <Activity className="h-5 w-5 text-white dark:text-[#111725]" />
        </div>
        <span className={`font-bold text-xl tracking-tight transition-opacity duration-200 text-slate-900 dark:text-[#F8FAFC] ${!sidebarOpen && 'opacity-0 hidden'}`}>MediTrack</span>
      </div>
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)} 
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${activeTab === item.id ? 'bg-emerald-50 text-emerald-600 dark:bg-[#34D399]/10 dark:text-[#34D399]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:bg-[#1B2430] dark:hover:text-[#F8FAFC]'}`}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${!sidebarOpen && 'opacity-0 hidden'}`}>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-200 dark:border-[#27335D]">
        <button 
          onClick={onSignOut} 
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:text-[#ef4444] dark:hover:bg-[#ef4444]/10 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={`whitespace-nowrap transition-opacity duration-200 ${!sidebarOpen && 'opacity-0 hidden'}`}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

