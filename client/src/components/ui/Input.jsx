const Input = ({ label, error, className = '', ...props }) => {
  // Handle margin override - if className contains mb-0, use it, otherwise default to mb-4
  const marginClass = className.includes('mb-') ? '' : 'mb-4';
  const finalClassName = `${marginClass} ${className}`.trim();
  
  return (
    <div className={finalClassName || undefined}>
      {label && <label className="block text-xs font-medium text-slate-500 dark:text-[#94a3b8] mb-1">{label}</label>}
      <input 
        className={`w-full bg-white dark:bg-[#1B2430] border-2 ${error ? 'border-red-500' : 'border-slate-500 dark:border-slate-500'} rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:ring-[#34D399] transition-all placeholder-slate-400 dark:placeholder-[#64748b] shadow-sm`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default Input;

