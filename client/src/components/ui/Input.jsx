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

export default Input;

