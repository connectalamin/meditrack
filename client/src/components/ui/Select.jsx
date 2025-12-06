import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select...", 
  className = "",
  disabled = false,
  label = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (!isMountedRef.current) return;
      if (containerRef.current && containerRef.current.contains(event.target)) {
        return;
      }
      if (isMountedRef.current) {
        setIsOpen(false);
      }
    };

    // Use capture phase to catch events earlier
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        document.addEventListener('mousedown', handleClickOutside, true);
        document.addEventListener('touchstart', handleClickOutside, true);
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      // Only remove if still mounted
      if (isMountedRef.current) {
        try {
          document.removeEventListener('mousedown', handleClickOutside, true);
          document.removeEventListener('touchstart', handleClickOutside, true);
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Calculate max height for 5 items (approximately 40px per item)
  const maxHeight = 5 * 40; // 200px for 5 items

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-slate-500 dark:text-[#94a3b8] mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full bg-white dark:bg-[#111725] border-2 border-slate-300 dark:border-slate-500 rounded-lg px-3 py-2 pr-10 text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:ring-[#34D399] transition-all cursor-pointer hover:border-slate-400 dark:hover:border-slate-400 shadow-sm text-left ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${!selectedOption ? 'text-slate-400 dark:text-slate-500' : ''}`}
        >
          {displayText}
        </button>
        <ChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1B2430] border-2 border-slate-300 dark:border-slate-500 rounded-lg shadow-lg overflow-hidden">
          <div 
            className="overflow-y-auto"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                No options available
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-xs text-left transition-colors ${
                    value === option.value
                      ? 'bg-emerald-500 text-white dark:bg-[#34D399] dark:text-[#111725] font-medium'
                      : 'text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#27335D]'
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Select;

