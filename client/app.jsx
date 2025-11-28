import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Pill, Users, FileText, Menu, X, LogOut, 
  Plus, Trash2, ChevronRight, ChevronLeft, Search,
  Calendar, Clock, ShieldCheck, HeartPulse, User,
  LayoutDashboard, Settings, FileBarChart, Sun, Moon,
  Upload, ScanLine, CheckCircle, AlertCircle, TrendingUp,
  Stethoscope, Thermometer, Droplet, Database, 
  Calculator, ShoppingBag, Share2, Link as LinkIcon, Download,
  ClipboardList, File, Check, FilePlus, ScrollText, Camera, ImageIcon,
  Chrome, MapPin, BriefcaseMedical, Edit, ChevronDown
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie
} from 'recharts';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, 
  onAuthStateChanged, signOut, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, query, 
  onSnapshot, deleteDoc, doc, serverTimestamp, orderBy, writeBatch, where, updateDoc 
} from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-[#34D399] dark:text-[#111725] dark:hover:bg-[#2EB886] active:scale-95 shadow-sm hover:shadow-md",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-[#27335D] dark:text-[#F8FAFC] dark:hover:bg-[#344275] dark:border-[#3E4C85]",
    outline: "border border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:border-[#34D399] dark:text-[#34D399] dark:hover:bg-[#34D399]/10",
    ghost: "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-[#94a3b8] dark:hover:text-[#F8FAFC] dark:hover:bg-[#1B2430]",
    destructive: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20 dark:border-red-500/20"
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white border border-slate-200 dark:bg-[#1B2430] dark:border-[#27335D] rounded-xl p-6 shadow-sm dark:shadow-none transition-colors ${className}`}>
    {children}
  </div>
);

const Input = ({ label, error, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-500 dark:text-[#94a3b8] mb-1.5">{label}</label>}
    <input 
      className={`w-full bg-white dark:bg-[#111725] border ${error ? 'border-red-500' : 'border-slate-200 dark:border-[#27335D]'} rounded-lg px-4 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:ring-[#34D399] transition-all placeholder-slate-400 dark:placeholder-[#475569]`}
      {...props}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    default: "bg-slate-100 text-slate-700 dark:bg-[#27335D] dark:text-[#F8FAFC]",
    success: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-[#34D399]/20 dark:text-[#34D399] dark:border-[#34D399]/20",
    warning: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-500 dark:border-amber-500/20",
    danger: "bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-500 dark:border-red-500/20"
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
};

// 2. Main Application Structure
export default function MediTrackApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('landing'); 
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { await signInWithCustomToken(auth, __initial_auth_token); } 
        catch (error) { console.error("Auth init error", error); }
      }
      if (mounted) setLoading(false);
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!mounted) return;
      setUser(currentUser);
      if (currentUser) setView('dashboard');
      else setView('landing');
      setLoading(false);
    });
    return () => { mounted = false; unsubscribe(); };
  }, []);

  const toggleTheme = () => setTheme(curr => curr === 'dark' ? 'light' : 'dark');

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#111725]' : 'bg-slate-50'}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
    </div>
  );

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} min-h-screen transition-colors duration-300`}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#111725] text-slate-900 dark:text-[#F8FAFC] font-sans selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:bg-[#34D399] dark:selection:text-[#111725]">
        {user && view === 'dashboard' ? (
          <DashboardLayout user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} handleSignOut={() => signOut(auth)} theme={theme} toggleTheme={toggleTheme} />
        ) : (
          <AuthLayout view={view} setView={setView} theme={theme} toggleTheme={toggleTheme} />
        )}
      </div>
    </div>
  );
}

// 3. Dashboard & Sidebar
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
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'family', label: 'Family & Plans', icon: Users },
    { id: 'med_database', label: 'Med Database', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'reports', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings & Share', icon: Settings },
  ];

  const getDisplayName = () => {
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split('@')[0];
    return 'Guest User';
  };

  const handleNavClick = (itemId) => {
    setActiveTab(itemId);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#111725]">
      {/* Mobile Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <aside className={`${sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 w-20'} bg-white dark:bg-[#111725] border-r border-slate-200 dark:border-[#27335D] transition-all duration-300 flex flex-col fixed md:relative z-40 h-full shadow-lg dark:shadow-none`}>
        <div className="p-4 md:p-6 flex items-center gap-3 border-b border-slate-200 dark:border-[#27335D]">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 dark:bg-[#34D399] flex items-center justify-center shrink-0 shadow-sm">
            <Activity className="h-5 w-5 text-white dark:text-[#111725]" />
          </div>
          <span className={`font-bold text-xl tracking-tight transition-opacity duration-200 text-slate-900 dark:text-[#F8FAFC] ${!sidebarOpen && 'opacity-0 hidden md:block'}`}>MediTrack</span>
        </div>
        <nav className="flex-1 py-4 md:py-6 px-2 md:px-3 space-y-1 overflow-y-auto">
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
        <div className="p-2 md:p-3 border-t border-slate-200 dark:border-[#27335D]">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:text-[#ef4444] dark:hover:bg-[#ef4444]/10 transition-colors">
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${!sidebarOpen && 'opacity-0 hidden md:block'}`}>Sign Out</span>
          </button>
        </div>
      </aside>

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
            <h1 className="text-base md:text-lg font-semibold text-slate-800 dark:text-[#F8FAFC] capitalize truncate">{navItems.find(i => i.id === activeTab)?.label}</h1>
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
              {activeTab === 'overview' && <OverviewTab user={user} />}
              {activeTab === 'appointments' && <AppointmentsTab user={user} />}
              {activeTab === 'analytics' && <AnalyticsTab user={user} />}
              {activeTab === 'med_database' && <MedicationDatabaseTab user={user} />}
              {activeTab === 'family' && <FamilyTab user={user} />}
              {activeTab === 'reports' && <ReportsTab user={user} />}
              {activeTab === 'settings' && <SettingsTab user={user} />}
            </div>
        </div>
      </main>
    </div>
  );
};

// --- NEW: Appointments Tab ---
const AppointmentsTab = ({ user }) => {
    const [appointments, setAppointments] = useState([]);
    const [members, setMembers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ doctor: '', specialty: '', location: '', date: '', time: '', familyMemberId: '' });

    useEffect(() => {
        if(!user) return;
        // Query only by date to avoid composite index requirement
        const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'appointments'), orderBy('date'));
        const unsubscribeApps = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => {
                if (a.date === b.date) {
                    return (a.time || '').localeCompare(b.time || '');
                }
                return 0; 
            });
            setAppointments(data);
        });

        // Fetch Family Members
        const unsubscribeMembers = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'family'), (snapshot) => {
            setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => { unsubscribeApps(); unsubscribeMembers(); };
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!formData.doctor || !formData.date) return;
        
        const memberName = members.find(m => m.id === formData.familyMemberId)?.name || 'General';

        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'appointments'), {
             ...formData,
             familyMemberName: memberName
        });
        setFormData({ doctor: '', specialty: '', location: '', date: '', time: '', familyMemberId: '' });
        setShowForm(false);
    };

    const deleteItem = async (id) => await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'appointments', id));

    const getCountdown = (dateStr) => {
        const target = new Date(dateStr);
        const now = new Date();
        now.setHours(0,0,0,0);
        target.setHours(0,0,0,0);
        const diff = target - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        if (diff < 0) return { text: "Passed", color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800" };
        if (days === 0) return { text: "Today", color: "text-red-600", bg: "bg-red-100 dark:bg-red-500/20" };
        if (days === 1) return { text: "Tomorrow", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-500/20" };
        return { text: `In ${days} days`, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-500/20" };
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Doctor Appointments</h2>
                    <p className="text-sm text-slate-500 dark:text-[#94a3b8]">Track upcoming visits and schedules</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? <X size={18} /> : <Plus size={18} />} Add Appointment
                </Button>
            </div>

            {showForm && (
                <Card>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Doctor Name" placeholder="Dr. Smith" value={formData.doctor} onChange={e => setFormData({...formData, doctor: e.target.value})} />
                            <Input label="Specialty" placeholder="Cardiologist" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} />
                            <Input label="Location" placeholder="City Hospital, Room 302" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mb-0" />
                                <Input label="Time" type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="mb-0" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Appointment For</label>
                                <select 
                                    className="w-full bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-[#F8FAFC]"
                                    value={formData.familyMemberId}
                                    onChange={(e) => setFormData({...formData, familyMemberId: e.target.value})}
                                >
                                    <option value="">Select Family Member (Optional)</option>
                                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end"><Button type="submit">Schedule Visit</Button></div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {appointments.length === 0 && !showForm && (
                    <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-[#1B2430]/50 rounded-xl border border-dashed border-slate-300 dark:border-[#27335D]">
                        <Calendar className="mx-auto h-12 w-12 text-slate-400 dark:text-[#27335D] mb-3" />
                        <p className="text-slate-500 dark:text-[#94a3b8]">No upcoming appointments.</p>
                    </div>
                )}
                {appointments.map(apt => {
                    const status = getCountdown(apt.date);
                    return (
                        <Card key={apt.id} className="relative group hover:border-emerald-500/50 transition-colors">
                            <button onClick={() => deleteItem(apt.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16} />
                            </button>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                                    <BriefcaseMedical size={24} />
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color}`}>
                                    {status.text}
                                </span>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-[#F8FAFC]">{apt.doctor}</h3>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm text-emerald-600 dark:text-[#34D399] font-medium">{apt.specialty}</p>
                                {apt.familyMemberName && apt.familyMemberName !== 'General' && (
                                    <span className="text-xs bg-slate-100 dark:bg-[#27335D] px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                        {apt.familyMemberName}
                                    </span>
                                )}
                            </div>
                            
                            <div className="space-y-2 text-sm text-slate-500 dark:text-[#94a3b8]">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} /> 
                                    <span>{new Date(apt.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} /> 
                                    <span>{apt.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} /> 
                                    <span>{apt.location}</span>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

// 4. Seeder Function with Global DB
const seedDemoData = async (user) => {
    if(!user) return;
    const batch = writeBatch(db);
    
    // 1. Global Medications Database
    const med1Ref = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'global_meds'));
    batch.set(med1Ref, { name: 'Losartan', strength: '50mg', price: 120, packSize: 15, unit: 'tablets' });
    const med2Ref = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'global_meds'));
    batch.set(med2Ref, { name: 'Metformin', strength: '500mg', price: 85, packSize: 10, unit: 'tablets' });
    const med3Ref = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'global_meds'));
    batch.set(med3Ref, { name: 'Napa Extend', strength: '665mg', price: 30, packSize: 12, unit: 'tablets' });

    // 2. Add Family Members & Their Plans
    const famRef1 = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'family'));
    batch.set(famRef1, { name: 'Sarah (Mom)', relation: 'Mother', age: '58', lastDoctorVisit: '2023-10-12' });
    // Plan for Mom
    const planRef1 = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'family', famRef1.id, 'plans'));
    batch.set(planRef1, { 
      medicationId: med1Ref.id, medicationName: 'Losartan', dosage: 1, frequency: 2, 
      price: 120, packSize: 15 
    });

    const famRef2 = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'family'));
    batch.set(famRef2, { name: 'Mike (Dad)', relation: 'Father', age: '62', lastDoctorVisit: '2023-11-05' });
    // Plan for Dad
    const planRef2 = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'family', famRef2.id, 'plans'));
    batch.set(planRef2, { 
      medicationId: med2Ref.id, medicationName: 'Metformin', dosage: 1, frequency: 3, 
      price: 85, packSize: 10 
    });

    // 3. Add Reports linked to Family Members
    const repRef1 = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'reports'));
    batch.set(repRef1, { 
        title: 'Annual Cardio Checkup', 
        date: new Date().toISOString(), 
        type: 'PDF', 
        category: 'Report',
        familyMemberId: famRef1.id, 
        familyMemberName: 'Sarah (Mom)' 
    });
    
    // 4. Add Vitals Data
    const vitalsRef1 = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'family', famRef1.id, 'health_data'));
    batch.set(vitalsRef1, { type: 'Blood Pressure', value: '120/80', unit: 'mmHg', date: '2023-10-01' });
    const vitalsRef2 = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'family', famRef1.id, 'health_data'));
    batch.set(vitalsRef2, { type: 'Blood Pressure', value: '125/82', unit: 'mmHg', date: '2023-10-15' });
    const vitalsRef3 = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'family', famRef1.id, 'health_data'));
    batch.set(vitalsRef3, { type: 'Glucose', value: '95', unit: 'mg/dL', date: '2023-10-01' });

    // 5. Add Appointments
    const aptRef1 = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'appointments'));
    // Set date to 3 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    batch.set(aptRef1, { 
        doctor: 'Dr. A. Rahim', 
        specialty: 'Dentist', 
        location: 'Square Hospital', 
        date: futureDate.toISOString().slice(0, 10), 
        time: '10:30',
        familyMemberName: 'Sarah (Mom)'
    });

    await batch.commit();
    window.location.reload(); 
};

// 5. Tabs

const OverviewTab = ({ user }) => {
  const [stats, setStats] = useState({ meds: 0, family: 0, reports: 0 });
  const [family, setFamily] = useState([]);
  const [allPlans, setAllPlans] = useState([]);

  useEffect(() => {
    if(!user) return;
    const unsubMeds = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'global_meds'), snap => setStats(s => ({...s, meds: snap.size})));
    const unsubFam = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'family'), snap => {
      const members = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStats(s => ({...s, family: snap.size}));
      setFamily(members);
    });
    const unsubRep = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'reports'), snap => setStats(s => ({...s, reports: snap.size})));
    return () => { unsubMeds(); unsubFam(); unsubRep(); }
  }, [user]);

  useEffect(() => {
    if(!user || family.length === 0) return;
    const unsubscribes = [];
    family.forEach(member => {
      const unsub = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'family', member.id, 'plans'), (snap) => {
        const plans = snap.docs.map(doc => ({ id: doc.id, memberId: member.id, memberName: member.name, ...doc.data() }));
        setAllPlans(prev => {
          const filtered = prev.filter(p => p.memberId !== member.id);
          return [...filtered, ...plans];
        });
      });
      unsubscribes.push(unsub);
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, family]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-[#F8FAFC]">Family Dashboard</h2>
          <p className="text-slate-500 dark:text-[#94a3b8] mt-1">Shared Overview & Monthly Plan</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => seedDemoData(user)} className="border-dashed">
                <Database size={16} /> Load Demo Data
            </Button>
            <div className="bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] px-4 py-2 rounded-lg text-sm text-emerald-600 dark:text-[#34D399] font-mono shadow-sm dark:shadow-none">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Database Medicines" value={stats.meds} icon={Database} color="emerald" />
        <StatCard title="Family Members" value={stats.family} icon={Users} color="blue" />
        <StatCard title="Total Reports" value={stats.reports} icon={FileText} color="pink" />
      </div>

      {/* New Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
         <Card className="border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Est. Monthly Cost</h3>
                <Calculator className="text-emerald-500" />
            </div>
            <div className="flex items-end gap-2 mb-6">
                <span className="text-4xl font-bold text-slate-900 dark:text-[#F8FAFC]">1,245</span>
                <span className="text-lg text-slate-500 dark:text-[#94a3b8] mb-1">BDT</span>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-[#94a3b8]">Sarah (Mom)</span>
                    <span className="font-medium text-slate-900 dark:text-[#F8FAFC]">480 BDT</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#27335D] h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: '40%' }} />
                </div>
                <div className="flex justify-between text-sm mt-4">
                    <span className="text-slate-500 dark:text-[#94a3b8]">Mike (Dad)</span>
                    <span className="font-medium text-slate-900 dark:text-[#F8FAFC]">765 BDT</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#27335D] h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: '60%' }} />
                </div>
            </div>
         </Card>
      </div>
    </div>
  );
};

const MedicationDatabaseTab = ({ user }) => {
    const [meds, setMeds] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', strength: '', price: '', packSize: '', unit: 'tablets' });

    useEffect(() => {
        if(!user) return;
        const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'global_meds'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMeds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    const handleEdit = (med) => {
        setFormData({
            name: med.name || '',
            strength: med.strength || '',
            price: med.price?.toString() || '',
            packSize: med.packSize?.toString() || '1',
            unit: med.unit || 'tablets'
        });
        setEditingId(med.id);
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({ name: '', strength: '', price: '', packSize: '', unit: 'tablets' });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!formData.name) return;
        
        const medicationData = {
            ...formData,
            price: formData.price ? Number(formData.price) : 0, 
            packSize: formData.packSize ? Number(formData.packSize) : 1 
        };

        try {
            if (editingId) {
                await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'global_meds', editingId), medicationData);
            } else {
                await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'global_meds'), medicationData);
            }
            resetForm();
        } catch (error) {
            console.error('Failed to save medication:', error);
        }
    };

    const deleteItem = async (id) => await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'global_meds', id));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Global Medication Database</h2>
                    <p className="text-sm text-slate-500 dark:text-[#94a3b8]">Shared list of medicines for the family</p>
                </div>
                <Button onClick={() => { resetForm(); setShowForm(true); }}>{showForm ? <X size={18} /> : <Plus size={18} />} {editingId ? 'Cancel Edit' : 'Add New'}</Button>
            </div>

            {showForm && (
                <Card>
                    {editingId && (
                        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Editing: {meds.find(m => m.id === editingId)?.name}</p>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="lg:col-span-2"><Input label="Name" placeholder="e.g. Napa" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                            <Input label="Strength" placeholder="500mg" value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})} />
                            <Input label="Price (Optional)" type="number" placeholder="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                            <Input label="Qty Per Pack" type="number" placeholder="10" value={formData.packSize} onChange={e => setFormData({...formData, packSize: e.target.value})} />
                        </div>
                        <div className="flex justify-end gap-2">
                            {editingId && (
                                <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
                            )}
                            <Button type="submit">{editingId ? 'Update' : 'Save to Database'}</Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {meds.map(med => (
                    <Card key={med.id} className="p-4 flex flex-col justify-between group hover:border-emerald-500/50 transition-colors">
                        <div>
                            <div className="flex justify-between items-start gap-2">
                                <h3 className="font-bold text-slate-900 dark:text-[#F8FAFC] flex-1 truncate">{med.name}</h3>
                                <div className="flex gap-1 shrink-0">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(med);
                                        }} 
                                        className="text-slate-400 hover:text-emerald-500 transition-colors p-1 touch-manipulation"
                                        title="Edit"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteItem(med.id);
                                        }} 
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1 touch-manipulation"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-[#94a3b8]">{med.strength}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#27335D] flex justify-between items-center text-sm">
                            <span className="text-slate-600 dark:text-[#94a3b8]">{med.packSize} {med.unit}/pack</span>
                            <span className="font-bold text-emerald-600 dark:text-[#34D399]">
                                {med.price > 0 ? `${med.price} BDT` : 'Price N/A'}
                            </span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

const FamilyTab = ({ user }) => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', relation: '', age: '' });

  useEffect(() => {
    if(!user) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'family'), (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formData.name) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'family'), formData);
    setFormData({ name: '', relation: '', age: '' });
    setShowForm(false);
  };

  const deleteItem = async (e, id) => {
      e.stopPropagation();
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'family', id));
  } 

  if (selectedMember) {
      return <FamilyMemberDetails user={user} member={selectedMember} onBack={() => setSelectedMember(null)} />;
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Family Members</h2>
                <p className="text-sm text-slate-500 dark:text-[#94a3b8]">Select a member to view their profile, plans, and reports</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
                {showForm ? <X size={18} /> : <Plus size={18} />}
                {showForm ? 'Cancel' : 'Add Member'}
            </Button>
        </div>

        {showForm && (
            <Card>
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full"><Input label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" /></div>
                    <div className="flex-1 w-full"><Input label="Relationship" value={formData.relation} onChange={e => setFormData({...formData, relation: e.target.value})} placeholder="Spouse, Child..." /></div>
                    <div className="w-24"><Input label="Age" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} placeholder="32" /></div>
                    <div className="mb-4"><Button type="submit">Add</Button></div>
                </form>
            </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map(member => (
                <div key={member.id} onClick={() => setSelectedMember(member)} className="bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] p-6 rounded-xl flex flex-col items-center text-center relative group hover:border-emerald-500/50 dark:hover:border-[#34D399]/50 transition-all shadow-sm dark:shadow-none cursor-pointer">
                    <button onClick={(e) => deleteItem(e, member.id)} className="absolute top-4 right-4 text-slate-400 dark:text-[#94a3b8] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                    </button>
                    <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-[#27335D] flex items-center justify-center mb-4 text-slate-600 dark:text-[#F8FAFC]">
                        <User size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">{member.name}</h3>
                    <p className="text-emerald-600 dark:text-[#34D399] text-sm font-medium mb-1">{member.relation}</p>
                    <Button variant="outline" className="w-full text-xs h-8 mt-4">View Profile</Button>
                </div>
            ))}
        </div>
    </div>
  );
};

// --- UPDATED: Detailed Family Member Profile ---
const FamilyMemberDetails = ({ user, member, onBack }) => {
    const [subTab, setSubTab] = useState('vitals'); // 'vitals', 'plan', 'reports'
    const [docFilter, setDocFilter] = useState('Report'); // 'Report', 'Prescription'
    const [plans, setPlans] = useState([]);
    const [globalMeds, setGlobalMeds] = useState([]);
    const [reports, setReports] = useState([]);
    const [healthData, setHealthData] = useState([]);
    const [showAddPlan, setShowAddPlan] = useState(false);
    const [showAddData, setShowAddData] = useState(false); // NEW
    const [newPlan, setNewPlan] = useState({ medId: '', dosage: '1', frequency: '1' });
    const [newData, setNewData] = useState({ type: 'Blood Pressure', value: '', date: new Date().toISOString().slice(0, 10), unit: 'mmHg' }); // NEW
    const [doctorDate, setDoctorDate] = useState(member.lastDoctorVisit || '');
    
    // Dynamic Metric Types
    const metricTypes = useMemo(() => {
        const defaultTypes = ['Blood Pressure', 'Glucose'];
        const existingTypes = healthData.map(d => d.type);
        return [...new Set([...defaultTypes, ...existingTypes])];
    }, [healthData]);

    useEffect(() => {
        if(!user) return;
        
        // Plans
        const plansSub = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'family', member.id, 'plans'), (snap) => {
            setPlans(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
        
        // Global Meds
        const medsSub = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'global_meds'), (snap) => {
            setGlobalMeds(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });

        // Reports filtered by member
        const qReports = query(collection(db, 'artifacts', appId, 'users', user.uid, 'reports'), where('familyMemberId', '==', member.id));
        const repSub = onSnapshot(qReports, (snap) => {
            setReports(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });

        // Health Data
        const qHealth = query(collection(db, 'artifacts', appId, 'users', user.uid, 'family', member.id, 'health_data'), orderBy('date', 'asc'));
        const healthSub = onSnapshot(qHealth, (snap) => {
            setHealthData(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });

        return () => { plansSub(); medsSub(); repSub(); healthSub(); };
    }, [user, member.id]);

    const handleAddPlan = async () => {
        if(!newPlan.medId) return;
        const selectedMed = globalMeds.find(m => m.id === newPlan.medId);
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'family', member.id, 'plans'), {
            medicationId: selectedMed.id,
            medicationName: selectedMed.name,
            price: selectedMed.price,
            packSize: selectedMed.packSize,
            dosage: Number(newPlan.dosage),
            frequency: Number(newPlan.frequency)
        });
        setShowAddPlan(false);
        setNewPlan({ medId: '', dosage: '1', frequency: '1' });
    };

    const handleAddData = async () => {
        if(!newData.value) return;
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'family', member.id, 'health_data'), newData);
        setShowAddData(false);
        setNewData({ ...newData, value: '' });
    };

    const updateDoctorVisit = async (date) => {
        setDoctorDate(date);
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'family', member.id), { lastDoctorVisit: date });
    }

    const calculateCost = (plan) => {
        const daily = plan.dosage * plan.frequency;
        const monthly = daily * 30;
        const packs = Math.ceil(monthly / plan.packSize);
        const cost = packs * plan.price;
        return { monthly, packs, cost };
    };

    const filteredDocs = reports.filter(r => (r.category || 'Report') === docFilter);

    // Dynamic Chart Data Generator
    const generateChartData = (type) => {
        return healthData.filter(d => d.type === type).map(d => {
            if (type === 'Blood Pressure') {
                const [sys, dia] = d.value.split('/').map(Number);
                return { date: d.date, systolic: sys, diastolic: dia };
            }
            return { date: d.date, value: Number(d.value) };
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-[#27335D] text-slate-600 dark:text-[#94a3b8]">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">{member.name}</h2>
                        <p className="text-sm text-slate-500 dark:text-[#94a3b8]">{member.relation} Profile</p>
                    </div>
                </div>
            </div>

            {/* Internal Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-[#27335D] pb-1">
                <button onClick={() => setSubTab('vitals')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${subTab === 'vitals' ? 'bg-slate-100 dark:bg-[#1B2430] text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-700'}`}>Vitals & Overview</button>
                <button onClick={() => setSubTab('plan')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${subTab === 'plan' ? 'bg-slate-100 dark:bg-[#1B2430] text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-700'}`}>Medicine Plan</button>
                <button onClick={() => setSubTab('reports')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${subTab === 'reports' ? 'bg-slate-100 dark:bg-[#1B2430] text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-700'}`}>Documents</button>
            </div>

            {/* VITALS TAB */}
            {subTab === 'vitals' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                <Stethoscope size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 dark:text-[#94a3b8]">Last Doctor Visit</p>
                                <input 
                                    type="date" 
                                    value={doctorDate} 
                                    onChange={(e) => updateDoctorVisit(e.target.value)}
                                    className="bg-transparent font-bold text-slate-900 dark:text-[#F8FAFC] focus:outline-none"
                                />
                            </div>
                        </Card>
                        <Card className="flex flex-col justify-center items-center">
                             <Button onClick={() => setShowAddData(true)} className="w-full">
                                <Plus size={16} /> Add Health Data
                             </Button>
                        </Card>
                    </div>

                    {showAddData && (
                        <Card className="border-emerald-500 border">
                            <h3 className="font-semibold mb-4">Add Health Record</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Metric Type</label>
                                    <input 
                                        list="metrics" 
                                        className="w-full bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg px-3 py-2.5 text-sm"
                                        value={newData.type}
                                        onChange={e => setNewData({...newData, type: e.target.value})}
                                        placeholder="Select or Type..."
                                    />
                                    <datalist id="metrics">
                                        <option value="Blood Pressure" />
                                        <option value="Glucose" />
                                        <option value="Cholesterol" />
                                        <option value="Hemoglobin" />
                                        <option value="Weight" />
                                    </datalist>
                                </div>
                                <div><Input label="Value" placeholder="e.g. 120/80 or 95" value={newData.value} onChange={e => setNewData({...newData, value: e.target.value})} className="mb-0" /></div>
                                <div><Input label="Unit" placeholder="e.g. mmHg" value={newData.unit} onChange={e => setNewData({...newData, unit: e.target.value})} className="mb-0" /></div>
                                <div><Input label="Date" type="date" value={newData.date} onChange={e => setNewData({...newData, date: e.target.value})} className="mb-0" /></div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" onClick={() => setShowAddData(false)}>Cancel</Button>
                                <Button onClick={handleAddData}>Save Record</Button>
                            </div>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Dynamic Charts Generation */}
                        {metricTypes.map(type => {
                            const data = generateChartData(type);
                            if(data.length === 0) return null;

                            return (
                                <Card key={type} className="min-h-[300px]">
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <Activity className="text-emerald-500" size={20} /> {type}
                                    </h3>
                                    <div className="h-[200px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {type === 'Blood Pressure' ? (
                                                <LineChart data={data}>
                                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <RechartsTooltip contentStyle={{ backgroundColor: '#1B2430', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="systolic" stroke="#ef4444" name="Systolic" />
                                                    <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" name="Diastolic" />
                                                </LineChart>
                                            ) : (
                                                <AreaChart data={data}>
                                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <RechartsTooltip contentStyle={{ backgroundColor: '#1B2430', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                                    <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                                                </AreaChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            );
                        })}
                        {healthData.length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-500">
                                No health data recorded yet. Click "Add Health Data" to start tracking vitals.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PLAN TAB */}
            {subTab === 'plan' && (
                <Card>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Monthly Medication Plan</h3>
                        <Button onClick={() => setShowAddPlan(!showAddPlan)} className="h-8 text-xs">{showAddPlan ? 'Cancel' : 'Add Medicine'}</Button>
                    </div>

                    {showAddPlan && (
                        <div className="mb-6 p-4 bg-slate-50 dark:bg-[#111725] rounded-lg border border-slate-200 dark:border-[#27335D]">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Select Medicine</label>
                                    <select 
                                        className="w-full bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-[#F8FAFC]"
                                        value={newPlan.medId}
                                        onChange={e => setNewPlan({...newPlan, medId: e.target.value})}
                                    >
                                        <option value="">Select from Database...</option>
                                        {globalMeds.map(m => <option key={m.id} value={m.id}>{m.name} ({m.strength})</option>)}
                                    </select>
                                </div>
                                <div><Input label="Dose (Qty)" type="number" value={newPlan.dosage} onChange={e => setNewPlan({...newPlan, dosage: e.target.value})} className="mb-0" /></div>
                                <div><Input label="Freq (Daily)" type="number" value={newPlan.frequency} onChange={e => setNewPlan({...newPlan, frequency: e.target.value})} className="mb-0" /></div>
                            </div>
                            <Button onClick={handleAddPlan} className="w-full mt-4">Add to Plan</Button>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 dark:text-[#94a3b8] uppercase bg-slate-50 dark:bg-[#111725]">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Medicine</th>
                                    <th className="px-4 py-3">Schedule</th>
                                    <th className="px-4 py-3">Monthly Qty</th>
                                    <th className="px-4 py-3">Packs Needed</th>
                                    <th className="px-4 py-3 rounded-r-lg text-right">Est. Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-[#27335D]">
                                {plans.map(plan => {
                                    const { monthly, packs, cost } = calculateCost(plan);
                                    return (
                                        <tr key={plan.id} className="hover:bg-slate-50 dark:hover:bg-[#27335D]/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-[#F8FAFC]">{plan.medicationName}</td>
                                            <td className="px-4 py-3 text-slate-500 dark:text-[#94a3b8]">{plan.dosage} tablet(s) x {plan.frequency}/day</td>
                                            <td className="px-4 py-3 text-slate-900 dark:text-[#F8FAFC]">{monthly}</td>
                                            <td className="px-4 py-3"><Badge variant="warning">{packs} packs</Badge></td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-[#F8FAFC]">{cost} BDT</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {plans.length === 0 && <p className="text-center text-slate-500 py-8">No medicines added to monthly plan yet.</p>}
                    </div>
                </Card>
            )}

            {/* DOCUMENTS TAB */}
            {subTab === 'reports' && (
                <div className="space-y-4">
                    <div className="flex gap-2 mb-4">
                        <button 
                            onClick={() => setDocFilter('Report')} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${docFilter === 'Report' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-medium' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1B2430]'}`}
                        >
                            <FileText size={16} /> Reports
                        </button>
                        <button 
                            onClick={() => setDocFilter('Prescription')} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${docFilter === 'Prescription' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 font-medium' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1B2430]'}`}
                        >
                            <ScrollText size={16} /> Prescriptions
                        </button>
                    </div>

                    {filteredDocs.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 dark:bg-[#1B2430]/50 rounded-xl border border-dashed border-slate-300 dark:border-[#27335D]">
                            <FileText className="mx-auto h-12 w-12 text-slate-400 dark:text-[#27335D] mb-3" />
                            <p className="text-slate-500 dark:text-[#94a3b8]">No {docFilter.toLowerCase()}s found for {member.name}.</p>
                            <p className="text-xs text-slate-400">Go to the main 'Documents' tab to upload and assign.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {filteredDocs.map(report => (
                                <div key={report.id} className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg">
                                    <div className="flex items-start gap-4 min-w-0 flex-1">
                                        {report.type === 'Scanned Image' && report.title.startsWith('Extracted') ? (
                                            <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-black overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                                                <div className="h-full w-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                                                    <ImageIcon size={20} className="text-gray-400" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${report.category === 'Prescription' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20'}`}>
                                                {report.category === 'Prescription' ? <ScrollText size={20} /> : <FileText size={20} />}
                                            </div>
                                        )}
                                        
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-medium text-slate-900 dark:text-[#F8FAFC] mb-2">{report.title}</h4>
                                            <div className="flex flex-col gap-2">
                                                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">{new Date(report.date).toLocaleDateString()}</p>
                                                <div className="flex flex-wrap gap-1.5 items-center">
                                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full whitespace-nowrap">
                                                        {report.type === 'Scanned Image' ? 'Image' : report.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- UPDATED: Reports Tab with Member Selector ---
const ReportsTab = ({ user }) => {
    const [reports, setReports] = useState([]);
    const [members, setMembers] = useState([]);
    const [title, setTitle] = useState('');
    const [selectedMember, setSelectedMember] = useState('');
    const [category, setCategory] = useState('Report'); // 'Report' | 'Prescription'
    const [mode, setMode] = useState('quick'); 
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scannedPreview, setScannedPreview] = useState(null); // NEW
  
    useEffect(() => {
      if(!user) return;
      const unsubRep = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'reports'), (snapshot) => {
        setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      const unsubMem = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'family'), (snapshot) => {
        setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => { unsubRep(); unsubMem(); };
    }, [user]);
  
    const handleUpload = async (e) => {
        e.preventDefault();
        if(!title) return;
        
        const memberName = members.find(m => m.id === selectedMember)?.name || 'Unassigned';

        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'reports'), { 
            title, 
            date: new Date().toISOString(), 
            type: mode === 'ocr' ? 'Scanned Image' : 'PDF', // Changed type
            category: category,
            familyMemberId: selectedMember || null,
            familyMemberName: memberName
        });
        setTitle('');
        setMode('quick');
        setSelectedMember('');
        setScannedPreview(null); // Reset preview
    };

    const simulateOCR = (file) => {
        if(!file) return;
        setIsScanning(true);
        setScanProgress(0);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);

        const interval = setInterval(() => {
            setScanProgress(prev => {
                if(prev >= 100) {
                    clearInterval(interval);
                    setIsScanning(false);
                    setScannedPreview(previewUrl); // Set preview
                    
                    // Auto-fill title from filename if empty
                    if (!title) {
                        const mockName = file.name.split('.')[0].replace(/-/g, ' ');
                        setTitle(mockName.charAt(0).toUpperCase() + mockName.slice(1));
                    }
                    return 100;
                }
                return prev + 20; // Faster
            });
        }, 150);
    };

    const deleteItem = async (id) => await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'reports', id));

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Health Documents</h2>
                <div className="flex bg-slate-100 dark:bg-[#1B2430] p-1 rounded-lg">
                    <button onClick={() => setMode('quick')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'quick' ? 'bg-white dark:bg-[#27335D] text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Manual Upload</button>
                    <button onClick={() => setMode('ocr')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'ocr' ? 'bg-white dark:bg-[#27335D] text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
                        <Camera size={14} /> Take Photo & Scan
                    </button>
                </div>
             </div>

             <Card>
                {mode === 'ocr' && !isScanning && !scannedPreview && (
                    <div className="mb-6 p-8 border-2 border-dashed border-slate-300 dark:border-[#27335D] rounded-xl flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-[#27335D]/20 transition-colors cursor-pointer relative">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => simulateOCR(e.target.files[0])} accept="image/*" capture="environment" />
                        <div className="h-12 w-12 bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 rounded-full flex items-center justify-center mb-3"><Camera size={24} /></div>
                        <h3 className="font-semibold text-slate-900 dark:text-[#F8FAFC]">Take Photo / Upload Image</h3>
                        <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">Capture the document clearly. AI will scan and extract details.</p>
                    </div>
                )}
                
                {mode === 'ocr' && isScanning && (
                     <div className="mb-6 p-8 bg-slate-50 dark:bg-[#111725] rounded-xl flex flex-col items-center justify-center text-center">
                         <div className="w-full max-w-xs bg-slate-200 dark:bg-[#27335D] h-2 rounded-full overflow-hidden mb-4">
                             <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                         </div>
                         <p className="text-sm font-medium text-emerald-600 animate-pulse">Enhancing & Cropping Image...</p>
                     </div>
                )}

                {mode === 'ocr' && scannedPreview && (
                    <div className="mb-6 p-4 border border-slate-200 dark:border-[#27335D] rounded-xl bg-slate-50 dark:bg-[#111725] flex gap-4 items-center animate-in fade-in">
                        <div className="h-24 w-24 bg-white dark:bg-black rounded-lg overflow-hidden border border-slate-300 dark:border-[#27335D] relative group">
                            <img src={scannedPreview} alt="Scanned" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Check className="text-white" size={20} />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-[#F8FAFC]">Scan Successful</h4>
                            <p className="text-xs text-slate-500 dark:text-[#94a3b8] mb-2">Image processed and cropped.</p>
                            <Button size="sm" variant="outline" onClick={() => setScannedPreview(null)} className="h-7 text-xs">Retake</Button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleUpload} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="sm:col-span-2">
                            <Input label="Document Title" placeholder="e.g. Lab Report Jan 2024" value={title} onChange={e => setTitle(e.target.value)} className="mb-0" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-[#94a3b8] mb-1">Doc Type</label>
                            <select 
                                className="w-full bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="Report">Medical Report</option>
                                <option value="Prescription">Prescription</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-[#94a3b8] mb-1">Assign To</label>
                            <select 
                                className="w-full bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                value={selectedMember}
                                onChange={(e) => setSelectedMember(e.target.value)}
                            >
                                <option value="">General (Unassigned)</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" className="w-full sm:w-auto" disabled={isScanning || !title}>
                            {mode === 'ocr' ? <CheckCircle size={18} /> : <Upload size={18} />}
                            {mode === 'ocr' ? 'Save Scanned Document' : 'Upload File'}
                        </Button>
                    </div>
                </form>
             </Card>

             <div className="space-y-3">
                {reports.map(report => (
                    <div key={report.id} className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${report.category === 'Prescription' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20'}`}>
                                {report.category === 'Prescription' ? <ScrollText size={20} /> : <FileText size={20} />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-slate-900 dark:text-[#F8FAFC] mb-2">{report.title}</h4>
                                <div className="flex flex-col gap-2">
                                    <p className="text-xs text-slate-500 dark:text-[#94a3b8]">{new Date(report.date).toLocaleDateString()}</p>
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-[#27335D] dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                            {report.category || 'Report'}
                                        </span>
                                        {report.familyMemberName && (
                                            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full whitespace-nowrap">
                                                {report.familyMemberName}
                                            </span>
                                        )}
                                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full whitespace-nowrap">
                                            {report.type === 'Scanned Image' ? 'Image' : report.type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 w-full shrink-0 sm:self-start">
                            <button onClick={() => deleteItem(report.id)} className="text-slate-400 dark:text-[#94a3b8] hover:text-red-500 p-2 touch-manipulation" title="Delete"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
             </div>
        </div>
    );
};

const SettingsTab = ({ user }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Settings</h2>
            
            <Card>
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 bg-emerald-100 dark:bg-[#34D399]/10 rounded-full flex items-center justify-center">
                        <Share2 className="text-emerald-600 dark:text-[#34D399]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">Share Family Dashboard</h3>
                        <p className="text-sm text-slate-500 dark:text-[#94a3b8]">Allow family members to access this dashboard.</p>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-[#111725] p-4 rounded-lg border border-slate-200 dark:border-[#27335D] flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Your Referral ID</p>
                        <p className="font-mono text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">{user.uid.slice(0,8).toUpperCase()}-{user.uid.slice(8,12)}</p>
                    </div>
                    <Button variant="outline" onClick={() => copyToClipboard(user.uid)}>
                        {copied ? <Check size={14} /> : <ClipboardList size={14} />}
                        {copied ? 'Copied' : 'Copy ID'}
                    </Button>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-[#27335D]">
                    <h4 className="font-medium text-slate-900 dark:text-[#F8FAFC]">Link Another Account</h4>
                    <div className="flex gap-2">
                        <Input placeholder="Enter Referral ID to Join" className="mb-0" />
                        <Button>Join Family</Button>
                    </div>
                    <p className="text-xs text-slate-500">Note: Joining a family will sync your dashboard view with the shared family ID.</p>
                </div>
            </Card>
        </div>
    );
};

// --- Helper for Analytics & Reports (Reused) ---
const AnalyticsTab = () => {
    // Mock Data for Analytics
    const adherenceData = [
        { name: 'Mon', completed: 4, skipped: 0 },
        { name: 'Tue', completed: 5, skipped: 0 },
        { name: 'Wed', completed: 3, skipped: 2 },
        { name: 'Thu', completed: 5, skipped: 0 },
        { name: 'Fri', completed: 5, skipped: 0 },
        { name: 'Sat', completed: 4, skipped: 1 },
        { name: 'Sun', completed: 5, skipped: 0 },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Health Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="min-h-[400px]">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-[#F8FAFC]">Family Health Score</h3>
                        <div className="text-2xl font-bold text-emerald-500">88/100</div>
                    </div>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={adherenceData}>
                                <defs>
                                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" hide />
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#1B2430', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                <Area type="monotone" dataKey="completed" stroke="#34D399" fillOpacity={1} fill="url(#colorPv)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-center text-sm text-slate-500 dark:text-[#94a3b8] mt-4">Based on medication adherence and vitals stability.</p>
                </Card>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorStyles = {
    emerald: { text: 'text-emerald-600 dark:text-[#34D399]', bg: 'bg-emerald-50 dark:bg-[#34D399]/10' },
    blue: { text: 'text-blue-600 dark:text-[#60A5FA]', bg: 'bg-blue-50 dark:bg-[#60A5FA]/10' },
    pink: { text: 'text-pink-600 dark:text-[#F472B6]', bg: 'bg-pink-50 dark:bg-[#F472B6]/10' },
  };
  const selected = colorStyles[color] || colorStyles.emerald;
  return (
    <Card className="hover:border-emerald-500/50 dark:hover:border-[#34D399]/50 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between">
        <div><p className="text-slate-500 dark:text-[#94a3b8] text-sm font-medium">{title}</p><h3 className="text-3xl font-bold mt-2 text-slate-900 dark:text-[#F8FAFC]">{value}</h3></div>
        <div className={`p-3 rounded-xl ${selected.bg} ${selected.text}`}><Icon className="h-6 w-6" /></div>
      </div>
    </Card>
  );
};

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

const LandingPage = ({ setView }) => (
    <div className="flex-1">
        {/* Hero */}
        <section className="py-20 px-6 text-center relative overflow-hidden bg-slate-50 dark:bg-[#111725]">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
             <div className="relative z-10 max-w-4xl mx-auto">
                <Badge variant="success">New: Family Health Profiles</Badge>
                <h1 className="text-5xl md:text-7xl font-bold mt-6 mb-6 text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#F8FAFC] dark:to-[#94a3b8]">
                    Your Family's Health, <br />
                    <span className="text-emerald-500 dark:text-[#34D399]">Simplified.</span>
                </h1>
                <p className="text-xl text-slate-600 dark:text-[#94a3b8] mb-10 max-w-2xl mx-auto leading-relaxed">
                    MediTrack helps you organize medications, track family records, and store health reports securely in one modern dashboard.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button onClick={() => setView('register')} className="h-12 px-8 text-lg w-full sm:w-auto">Start Tracking Free</Button>
                    <Button variant="secondary" className="h-12 px-8 text-lg w-full sm:w-auto">View Demo</Button>
                </div>
             </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-6 bg-white dark:bg-[#0B101B]">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard 
                        icon={Pill} 
                        title="Medication Tracker" 
                        desc="Never miss a dose. Track schedules, dosage, and active prescriptions for the whole family."
                    />
                    <FeatureCard 
                        icon={Users} 
                        title="Family Profiles" 
                        desc="Create dedicated profiles for every family member to keep records organized and accessible."
                    />
                    <FeatureCard 
                        icon={ShieldCheck} 
                        title="Secure Storage" 
                        desc="Your health data is encrypted and stored securely. Upload reports and prescriptions safely."
                    />
                </div>
            </div>
        </section>
    </div>
);

const FeatureCard = ({ icon: Icon, title, desc }) => (
    <div className="bg-slate-50 dark:bg-[#1B2430] p-8 rounded-2xl border border-slate-200 dark:border-[#27335D] hover:border-emerald-500/30 dark:hover:border-[#34D399]/30 transition-all hover:translate-y-[-4px] shadow-sm dark:shadow-none">
        <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-[#34D399]/10 dark:text-[#34D399] flex items-center justify-center mb-6">
            <Icon size={24} />
        </div>
        <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-[#F8FAFC]">{title}</h3>
        <p className="text-slate-600 dark:text-[#94a3b8] leading-relaxed">{desc}</p>
    </div>
);

const AuthForms = ({ view, setView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (view === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const res = await createUserWithEmailAndPassword(auth, email, password);
                if(name) await updateProfile(res.user, { displayName: name });
            }
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error(error);
            setError(error.message);
        }
    }

    return (
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50 dark:bg-[#111725]">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-[#F8FAFC] mb-2">
                        {view === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-slate-600 dark:text-[#94a3b8]">
                        {view === 'login' ? 'Enter your credentials to access your dashboard' : 'Start managing your health today'}
                    </p>
                </div>

                <Card className="shadow-2xl shadow-slate-200/50 dark:shadow-[#000000]/50">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {view === 'register' && (
                            <Input 
                                label="Full Name" 
                                type="text" 
                                placeholder="John Doe" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                required
                            />
                        )}
                        <Input 
                            label="Email Address" 
                            type="email" 
                            placeholder="name@example.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required
                        />
                        <Input 
                            label="Password" 
                            type="password" 
                            placeholder="••••••••" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required
                        />

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <Button 
                            className="w-full h-11 mt-2" 
                            type="submit" 
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : (view === 'login' ? 'Sign In' : 'Create Account')}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-[#1B2430] text-slate-500">Or continue with</span>
                        </div>
                    </div>

                    <Button variant="secondary" onClick={handleGoogleLogin} className="w-full h-11 flex items-center justify-center gap-2">
                        <Chrome size={18} /> Google
                    </Button>

                    <div className="mt-6 text-center text-sm text-slate-600 dark:text-[#94a3b8]">
                        {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button 
                            onClick={() => setView(view === 'login' ? 'register' : 'login')}
                            className="text-emerald-600 hover:underline font-medium dark:text-[#34D399]"
                        >
                            {view === 'login' ? 'Sign up' : 'Log in'}
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};