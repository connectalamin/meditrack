import Badge from './Badge';

const Endpoint = ({ method, path, title }) => {
  return (
    <div className="flex items-center gap-3 my-6 p-2 rounded-md border border-slate-100 dark:border-[#27335D] bg-slate-50/50 dark:bg-[#1B2430]">
      <Badge type={method}>{method}</Badge>
      <code className="text-sm font-mono text-slate-700 dark:text-[#F8FAFC]">{path}</code>
      {title && <span className="text-sm text-slate-500 dark:text-[#94a3b8] hidden sm:inline">— {title}</span>}
    </div>
  );
};

export default Endpoint;
