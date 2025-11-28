const FeatureCard = ({ icon: Icon, title, desc }) => (
  <div className="bg-slate-50 dark:bg-[#1B2430] p-8 rounded-2xl border border-slate-200 dark:border-[#27335D] hover:border-emerald-500/30 dark:hover:border-[#34D399]/30 transition-all hover:translate-y-[-4px] shadow-sm dark:shadow-none">
    <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-[#34D399]/10 dark:text-[#34D399] flex items-center justify-center mb-6">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-[#F8FAFC]">{title}</h3>
    <p className="text-slate-600 dark:text-[#94a3b8] leading-relaxed">{desc}</p>
  </div>
);

export default FeatureCard;

