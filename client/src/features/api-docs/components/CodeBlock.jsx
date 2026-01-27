import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const CodeBlock = ({ language = 'json', children, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-lg overflow-hidden border border-slate-200 dark:border-[#27335D] bg-[#0f172a] dark:bg-[#0B101B] shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 dark:bg-[#111725] border-b border-slate-700 dark:border-[#27335D]">
        <span className="text-xs font-mono text-slate-400 dark:text-[#94a3b8]">{title || language}</span>
        <button 
          onClick={handleCopy}
          className="text-slate-400 hover:text-white dark:hover:text-[#F8FAFC] transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-sm leading-relaxed text-slate-300 dark:text-[#94a3b8]">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
