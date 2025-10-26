// components/weDatePicker.jsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MultiDatePicker = ({ 
  selectedDates = [], 
  onDatesChange, 
  disabledDates = [],
  allowWeekends = false,
  allowHolidays = true,
  minDate,
  maxDate,
  className = '',
  placeholder = "Select dates...",
  allowPastDates = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoverDate, setHoverDate] = useState(null);
  const dropdownRef = useRef(null);
  
  const { props } = usePage();
  
  const holidays = useMemo(() => {
    const holidaysData = props.holidays || [];
    const normalizedHolidays = holidaysData.map(holiday => {
      const date = new Date(holiday.date);
      const normalizedDate = formatDate(date);
      return {
        ...holiday,
        normalizedDate: normalizedDate
      };
    });
    return normalizedHolidays;
  }, [props.holidays]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // FIX: Add preventDefault to month navigation
  const handlePreviousMonth = (e) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Prevent event bubbling
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = (e) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Prevent event bubbling
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isDateDisabled = (date) => {
    const dateStr = formatDate(date);
    
    const isInDisabledRange = disabledDates.some(disabledDate => {
      const start = new Date(disabledDate.start);
      const end = new Date(disabledDate.end);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      
      return date >= start && date <= end;
    });

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isHoliday = holidays.some(holiday => holiday.normalizedDate === dateStr);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isBeforeMin = minDate ? date < new Date(minDate) : (!allowPastDates && date < today);
    
    const isAfterMax = maxDate && date > new Date(maxDate);

    const disabled = isInDisabledRange || 
           (!allowWeekends && isWeekend) || 
           (!allowHolidays && isHoliday) ||
           isBeforeMin || 
           isAfterMax;

    return disabled;
  };

  const toggleDate = (date) => {
    const dateStr = formatDate(date);
    const newDates = selectedDates.includes(dateStr)
      ? selectedDates.filter(d => d !== dateStr)
      : [...selectedDates, dateStr].sort();
    
    onDatesChange(newDates);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }

    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

  const getHolidayInfo = (date) => {
    const dateStr = formatDate(date);
    return holidays.find(holiday => holiday.normalizedDate === dateStr);
  };

  const displayText = selectedDates.length > 0 
    ? `${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} selected`
    : placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg p-3 cursor-pointer bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          value={displayText}
          onClick={() => setIsOpen(!isOpen)}
          readOnly
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg 
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              {/* FIXED: Added type="button" and preventDefault */}
              <button
                type="button" // Important: Prevents form submission
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-semibold text-gray-900 text-sm">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              {/* FIXED: Added type="button" and preventDefault */}
              <button
                type="button" // Important: Prevents form submission
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-3">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center font-medium">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const isDisabled = isDateDisabled(day.date);
                const dateStr = formatDate(day.date);
                const isSelected = selectedDates.includes(dateStr);
                const isToday = day.date.toDateString() === new Date().toDateString();
                const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
                const holidayInfo = getHolidayInfo(day.date);
                const isHoliday = !!holidayInfo;

                return (
                  <button
                    key={index}
                    type="button" // FIX: Add type="button" to prevent form submission
                    onClick={() => !isDisabled && toggleDate(day.date)}
                    disabled={isDisabled}
                    onMouseEnter={() => !isDisabled && setHoverDate(day.date)}
                    onMouseLeave={() => setHoverDate(null)}
                    className={`
                      h-8 w-8 text-sm rounded-lg flex items-center justify-center transition-all relative
                      ${isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-blue-100 cursor-pointer'
                      }
                      ${isSelected 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                        : ''
                      }
                      ${isToday && !isSelected && !isDisabled
                        ? 'bg-blue-100 text-blue-600 font-semibold' 
                        : ''
                      }
                      ${!day.isCurrentMonth 
                        ? 'text-gray-300' 
                        : isWeekend && !allowWeekends && !isDisabled
                        ? 'text-gray-400'
                        : isHoliday && !allowHolidays && !isDisabled
                        ? 'text-rose-400'
                        : 'text-gray-700'
                      }
                    `}
                    title={holidayInfo ? `${holidayInfo.name} (${holidayInfo.type})` : ''}
                  >
                    {day.date.getDate()}
                    
                    {isWeekend && !isSelected && !isDisabled && (
                      <div className="absolute bottom-1 w-1 h-1 rounded-full bg-gray-400"></div>
                    )}
                    
                    {isHoliday && !isSelected && !isDisabled && (
                      <div className="absolute bottom-1 w-1 h-1 rounded-full bg-rose-400"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 mb-3 text-xs">
              {!allowWeekends && (
                <div className="flex items-center">
                  {/* Weekend indicator */}
                </div>
              )}
              {!allowHolidays && (
                <div className="flex items-center">
                  {/* Holiday indicator */}
                </div>
              )}
              {allowPastDates && (
                <div className="flex items-center text-green-600">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Past dates allowed</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>{selectedDates.length} dates selected</span>
              <button
                type="button" // FIX: Add type="button"
                onClick={() => {
                  onDatesChange([]);
                  setIsOpen(false);
                }}
                className="text-rose-600 hover:text-rose-700 font-medium"
              >
                Clear all
              </button>
            </div>
            
            {selectedDates.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                <div className="font-medium mb-1">Selected:</div>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {selectedDates.slice(0, 6).map(date => (
                    <span 
                      key={date} 
                      className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                    >
                      {new Date(date).toLocaleDateString()}
                    </span>
                  ))}
                  {selectedDates.length > 6 && (
                    <span className="text-gray-400">+{selectedDates.length - 6} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiDatePicker;