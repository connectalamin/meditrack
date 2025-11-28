import { Pill, Users, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import FeatureCard from './FeatureCard';

const LandingPage = ({ setView }) => (
  <div className="flex-1">
    {/* Hero */}
    <section className="py-20 px-6 text-center relative overflow-hidden bg-slate-50 dark:bg-[#111725]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mt-6 mb-6 text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#F8FAFC] dark:to-[#94a3b8]">
          MediTrack
        </h1>
        <p className="text-xl text-slate-600 dark:text-[#94a3b8] mb-10 max-w-2xl mx-auto leading-relaxed">
          A web application for managing family health records, medication schedules, and medical documents.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={() => setView('register')} className="h-12 px-8 text-lg w-full sm:w-auto">Get Started</Button>
        </div>
      </div>
    </section>

    {/* Features Grid */}
    <section className="py-20 px-6 bg-white dark:bg-[#0B101B]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={Pill} 
            title="Medication Management" 
            desc="Maintain a database of medications with dosage information, pricing, and pack sizes. Create monthly medication plans for each family member with cost calculations."
          />
          <FeatureCard 
            icon={Users} 
            title="Family Member Profiles" 
            desc="Add and manage profiles for family members. Each profile includes health data tracking, medication plans, and document storage with filtering capabilities."
          />
          <FeatureCard 
            icon={ShieldCheck} 
            title="Document Management" 
            desc="Upload and organize medical reports and prescriptions. Documents can be assigned to specific family members and categorized for easy retrieval."
          />
        </div>
      </div>
    </section>
  </div>
);

export default LandingPage;

