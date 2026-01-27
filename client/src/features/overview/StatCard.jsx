import Card from '../../components/ui/Card';

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorStyles = {
    emerald: {
      text: 'text-emerald-700 dark:text-[#34D399]',
      bgSoft: 'bg-emerald-50/80 dark:bg-[#34D399]/10',
      chip: 'bg-emerald-100/80 text-emerald-700 dark:bg-[#34D399]/20 dark:text-[#E2FFF4]',
    },
    blue: {
      text: 'text-blue-700 dark:text-[#60A5FA]',
      bgSoft: 'bg-blue-50/80 dark:bg-[#60A5FA]/10',
      chip: 'bg-blue-100/80 text-blue-700 dark:bg-[#60A5FA]/20 dark:text-[#E0F2FF]',
    },
    pink: {
      text: 'text-pink-700 dark:text-[#F472B6]',
      bgSoft: 'bg-pink-50/80 dark:bg-[#F472B6]/10',
      chip: 'bg-pink-100/80 text-pink-700 dark:bg-[#F472B6]/20 dark:text-[#FFE4F3]',
    },
  };

  const selected = colorStyles[color] || colorStyles.emerald;

  return (
    <Card className="relative overflow-hidden border border-slate-200/80 dark:border-[#2D3748]/60 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-200 cursor-pointer group bg-white/90 dark:bg-[#1A202C]/90">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full ${selected.bgSoft} blur-2xl`} />
      </div>

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-slate-500 dark:text-[#94a3b8] text-xs font-semibold uppercase tracking-[0.16em]">
            {title}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-900 dark:text-[#F8FAFC] leading-none">
              {value}
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium tracking-wide uppercase text-slate-400 dark:text-[#64748b] bg-slate-50 dark:bg-[#020617] border border-slate-200/70 dark:border-[#27335D]/60">
              Total
            </span>
          </div>
        </div>

        <div className={`p-3 rounded-xl ${selected.bgSoft} ${selected.text} shadow-sm shadow-slate-900/5 dark:shadow-black/30`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;

