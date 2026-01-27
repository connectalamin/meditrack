const Card = ({ children, className = '' }) => (
  <div className={`bg-white border border-slate-200 dark:bg-[#1B2430] dark:border-[#2D3748] rounded-xl p-6 shadow-sm dark:shadow-none transition-colors ${className}`}>
    {children}
  </div>
);

export default Card;

