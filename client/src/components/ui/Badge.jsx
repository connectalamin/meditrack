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

export default Badge;

