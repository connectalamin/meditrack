const ParameterTable = ({ parameters }) => {
  if (!parameters || parameters.length === 0) {
    return null;
  }

  return (
    <div className="border border-slate-200 dark:border-[#27335D] rounded-lg overflow-hidden mb-8">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-[#1B2430] border-b border-slate-200 dark:border-[#27335D]">
          <tr>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-[#F8FAFC]">Name</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-[#F8FAFC]">Type</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-[#F8FAFC]">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-[#27335D]">
          {parameters.map((param, index) => (
            <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-[#1B2430]">
              <td className="px-4 py-3 font-mono text-emerald-600 dark:text-[#34D399]">
                {param.name}
                {param.required && (
                  <span className="ml-1 text-red-500 dark:text-red-400">*</span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-500 dark:text-[#94a3b8]">
                <code className="text-xs bg-slate-100 dark:bg-[#27335D] px-1 rounded">{param.type}</code>
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-[#94a3b8]">
                {param.required && (
                  <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] mr-2">Required.</span>
                )}
                {param.description}
                {param.default && (
                  <span className="ml-2 text-slate-500 dark:text-[#94a3b8]">
                    Defaults to <code className="text-xs bg-slate-100 dark:bg-[#27335D] px-1 rounded">{param.default}</code>.
                  </span>
                )}
                {param.enum && (
                  <span className="ml-2 text-slate-500 dark:text-[#94a3b8]">
                    One of {param.enum.map((val, i) => (
                      <span key={i}>
                        <code className="text-xs bg-slate-100 dark:bg-[#27335D] px-1 rounded">{val}</code>
                        {i < param.enum.length - 1 ? ', ' : '.'}
                      </span>
                    ))}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ParameterTable;
