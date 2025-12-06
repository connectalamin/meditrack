import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

const Autocomplete = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Type to search...", 
  className = "",
  disabled = false,
  label = "",
  onInputChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return options.slice(0, 50); // Show first 50 when no search
    }
    const term = searchTerm.toLowerCase();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(term) ||
      opt.searchText?.toLowerCase().includes(term)
    ).slice(0, 50); // Limit to 50 results
  }, [options, searchTerm]);

  // Find selected option for display
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (!isMountedRef.current) return;
      if (containerRef.current && containerRef.current.contains(event.target)) {
        return;
      }
      if (isMountedRef.current) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        document.addEventListener('mousedown', handleClickOutside, true);
        document.addEventListener('touchstart', handleClickOutside, true);
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
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

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
    if (onInputChange) {
      onInputChange(newValue);
    }
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || filteredOptions.length === 0) {
      if (e.key === 'Enter' && isOpen) {
        setIsOpen(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const displayValue = isOpen ? searchTerm : (selectedOption ? selectedOption.label : '');

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-slate-500 dark:text-[#94a3b8] mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 dark:text-[#64748b]">
          <Search size={16} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-white dark:bg-[#111725] border-2 border-slate-300 dark:border-slate-500 rounded-lg px-10 pr-10 py-2 text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:ring-[#34D399] transition-all placeholder-slate-400 dark:placeholder-slate-500 shadow-sm text-left ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        {value && !isOpen && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-8 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1B2430] border-2 border-slate-300 dark:border-slate-500 rounded-lg shadow-lg overflow-hidden">
          <div 
            ref={listRef}
            className="overflow-y-auto"
            style={{ maxHeight: '300px' }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                {searchTerm.trim() ? 'No matches found' : 'Start typing to search...'}
              </div>
            ) : (
              <>
                {searchTerm.trim() && (
                  <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-600">
                    {filteredOptions.length} {filteredOptions.length === 1 ? 'match' : 'matches'} found
                  </div>
                )}
                {filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full px-3 py-2.5 text-xs text-left transition-colors ${
                      value === option.value
                        ? 'bg-emerald-500 text-white dark:bg-[#34D399] dark:text-[#111725] font-medium'
                        : highlightedIndex === index
                        ? 'bg-slate-100 dark:bg-[#27335D] text-slate-900 dark:text-[#F8FAFC]'
                        : 'text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#27335D]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Autocomplete;

