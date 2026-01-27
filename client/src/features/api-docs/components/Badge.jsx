const Badge = ({ type = 'default', children }) => {
  const styles = {
    default: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-[#27335D] dark:text-[#F8FAFC] dark:border-[#3E4C85]',
    success: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20',
    danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    info: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#34D399]/10 dark:text-[#34D399] dark:border-[#34D399]/20',
    GET: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    POST: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
    PUT: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
    DELETE: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[type] || styles.default} mx-1 align-middle`}>
      {children}
    </span>
  );
};

export default Badge;
