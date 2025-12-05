import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

const TimePicker = ({ value, onChange, placeholder = "Select time", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isAM, setIsAM] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      const hour24 = parseInt(h) || 0;
      const minute = parseInt(m) || 0;
      
      // Convert 24-hour to 12-hour format
      if (hour24 === 0) {
        setSelectedHour(12);
        setIsAM(true);
      } else if (hour24 === 12) {
        setSelectedHour(12);
        setIsAM(false);
      } else if (hour24 > 12) {
        setSelectedHour(hour24 - 12);
        setIsAM(false);
      } else {
        setSelectedHour(hour24);
        setIsAM(true);
      }
      setSelectedMinute(minute);
    } else {
      setSelectedHour(12);
      setSelectedMinute(0);
      setIsAM(true);
    }
  }, [value]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    if (/^\d{0,2}:\d{0,2}$/.test(inputValue) || inputValue === '') {
      onChange(inputValue);
    }
  };

  const updateTime = (hour12, minute, am) => {
    // Convert 12-hour to 24-hour format
    let hour24;
    if (hour12 === 12) {
      hour24 = am ? 0 : 12;
    } else {
      hour24 = am ? hour12 : hour12 + 12;
    }
    const timeString = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange(timeString);
  };

  const handleHourChange = (hour) => {
    setSelectedHour(hour);
    updateTime(hour, selectedMinute, isAM);
  };

  const handleMinuteChange = (minute) => {
    setSelectedMinute(minute);
    updateTime(selectedHour, minute, isAM);
  };

  const handleAMPMChange = (am) => {
    setIsAM(am);
    updateTime(selectedHour, selectedMinute, am);
  };

  const handleConfirm = () => {
    updateTime(selectedHour, selectedMinute);
    setIsOpen(false);
  };

  const displayValue = value || '';

  // Generate hour and minute options (12-hour format)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <Clock className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-[#94a3b8] pointer-events-none z-10" />
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full bg-white dark:bg-[#1B2430] border-2 border-slate-500 dark:border-slate-500 rounded-lg pl-8 pr-2 py-2 text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:ring-[#34D399] transition-all cursor-pointer"
        />
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-white dark:bg-[#1B2430] border-2 border-slate-300 dark:border-[#27335D] rounded-xl shadow-2xl p-6 min-w-[320px] max-w-[400px] w-full pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Digital Clock Display */}
              <div className="mb-6">
                <div className="text-center mb-2">
                  <div className="text-xs font-medium text-slate-500 dark:text-[#94a3b8] mb-2">
                    Select Time
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-5xl font-bold text-slate-900 dark:text-[#F8FAFC] tabular-nums">
                      {selectedHour.toString().padStart(2, '0')}
                    </div>
                    <div className="text-5xl font-bold text-emerald-500 dark:text-[#34D399]">
                      :
                    </div>
                    <div className="text-5xl font-bold text-slate-900 dark:text-[#F8FAFC] tabular-nums">
                      {selectedMinute.toString().padStart(2, '0')}
                    </div>
                    <div className="ml-2 flex flex-col gap-1">
                      <button
                        onClick={() => handleAMPMChange(true)}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                          isAM
                            ? 'bg-emerald-500 text-white dark:bg-[#34D399] dark:text-[#111725]'
                            : 'bg-slate-100 text-slate-600 dark:bg-[#27335D] dark:text-[#94a3b8] hover:bg-slate-200 dark:hover:bg-[#344275]'
                        }`}
                      >
                        AM
                      </button>
                      <button
                        onClick={() => handleAMPMChange(false)}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                          !isAM
                            ? 'bg-emerald-500 text-white dark:bg-[#34D399] dark:text-[#111725]'
                            : 'bg-slate-100 text-slate-600 dark:bg-[#27335D] dark:text-[#94a3b8] hover:bg-slate-200 dark:hover:bg-[#344275]'
                        }`}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Selectors */}
              <div className="flex gap-4 mb-6">
                {/* Hours */}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-500 dark:text-[#94a3b8] mb-2 text-center">
                    Hours
                  </div>
                  <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-[#27335D] rounded-lg border border-slate-200 dark:border-[#27335D]">
                    {hours.map((hour) => {
                      const isSelected = selectedHour === hour;
                      return (
                        <div
                          key={hour}
                          onClick={() => handleHourChange(hour)}
                          className={`px-4 py-2.5 text-center cursor-pointer transition-colors border-b border-slate-100 dark:border-[#27335D] last:border-b-0 ${
                            isSelected
                              ? 'bg-emerald-500 text-white dark:bg-[#34D399] dark:text-[#111725] font-semibold'
                              : 'hover:bg-slate-100 dark:hover:bg-[#27335D] text-slate-700 dark:text-[#F8FAFC]'
                          }`}
                        >
                          {hour.toString().padStart(2, '0')}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Minutes */}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-500 dark:text-[#94a3b8] mb-2 text-center">
                    Minutes
                  </div>
                  <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-[#27335D] rounded-lg border border-slate-200 dark:border-[#27335D]">
                    {minutes.map((minute) => {
                      const isSelected = selectedMinute === minute;
                      return (
                        <div
                          key={minute}
                          onClick={() => handleMinuteChange(minute)}
                          className={`px-4 py-2.5 text-center cursor-pointer transition-colors border-b border-slate-100 dark:border-[#27335D] last:border-b-0 ${
                            isSelected
                              ? 'bg-emerald-500 text-white dark:bg-[#34D399] dark:text-[#111725] font-semibold'
                              : 'hover:bg-slate-100 dark:hover:bg-[#27335D] text-slate-700 dark:text-[#F8FAFC]'
                          }`}
                        >
                          {minute.toString().padStart(2, '0')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-[#27335D]">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TimePicker;
