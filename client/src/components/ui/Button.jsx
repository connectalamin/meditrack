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

export default Button;

