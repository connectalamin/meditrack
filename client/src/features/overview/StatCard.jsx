import Card from '../../components/ui/Card';

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
        <div>
          <p className="text-slate-500 dark:text-[#94a3b8] text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold mt-2 text-slate-900 dark:text-[#F8FAFC]">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${selected.bg} ${selected.text}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;

