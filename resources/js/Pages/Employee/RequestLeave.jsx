import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { useForm, usePage, router } from '@inertiajs/react';
import { useMemo, useState, useRef, useEffect } from 'react';
import MultiDatePicker from '@/Components/MultiDatePicker';
import Swal from 'sweetalert2';

// Leave type priority configuration
const LEAVE_TYPE_PRIORITY = {
  'VACATION LEAVE': 1,
  'SICK LEAVE': 2,
  'FORCE LEAVE': 3,
  'SPECIAL PRIVILEGE LEAVE': 4
};

// Function to sort leave types by priority
const sortLeaveTypesByPriority = (leaveTypes) => {
  if (!leaveTypes) return [];

  return [...leaveTypes].sort((a, b) => {
    const aPriority = LEAVE_TYPE_PRIORITY[a.name.toUpperCase()] || 999;
    const bPriority = LEAVE_TYPE_PRIORITY[b.name.toUpperCase()] || 999;
    return aPriority - bPriority;
  });
};

// Function to calculate working days (excluding weekends)
const calculateWorkingDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) { // Skip weekends (0 = Sunday, 6 = Saturday)
      count++;
    }
  }

  return count;
};

const typeSpecificFields = (code) => {
  const upper = (code || '').toUpperCase();
  switch (upper) {
    case 'SL':
      return [
        {
          name: 'sick_type',
          label: 'Sick Type',
          type: 'select',
          required: true,
          options: [
            { value: 'in_hospital', label: 'In Hospital' },
            { value: 'outpatient', label: 'Outpatient' }
          ]
        },
        {
          name: 'illness',
          label: 'Illness (Optional)',
          type: 'text',
          required: false
        }
      ];
    case 'SLBW':
      return [
        {
          name: 'slbw_condition',
          label: 'SLBW Condition',
          type: 'select',
          required: true,
          options: [
            { value: 'gynecological_surgery', label: 'Gynecological Surgery' },
            { value: 'miscarriage', label: 'Miscarriage' },
            { value: 'other', label: 'Other' }
          ]
        }
      ];
    case 'STL':
      return [
        {
          name: 'study_purpose',
          label: 'Study Purpose',
          type: 'select',
          required: true,
          options: [
            { value: 'masters_completion', label: 'Master\'s Completion' },
            { value: 'board_exam', label: 'Board Exam' },
            { value: 'continuing_education', label: 'Continuing Education' },
            { value: 'other', label: 'Other' }
          ]
        }
      ];
    case 'VL':
      return [
        {
          name: 'vacation_location',
          label: 'Vacation Location',
          type: 'select',
          required: true,
          options: [
            { value: 'within_philippines', label: 'Within Philippines' },
            { value: 'abroad', label: 'Abroad' }
          ]
        }
      ];
    case 'MAT':
      return [
        { name: 'expected_delivery_date', label: 'Expected Delivery Date', type: 'date', required: true },
        { name: 'physician_name', label: 'Physician Name', type: 'text', required: true },
      ];
    default:
      return [];
  }
};

const DateInput = ({ label, value, onChange, minDate, disabledDates = [], error, helperText, allowPastDates = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const datePickerRef = useRef(null);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Get all dates in the current month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add days from previous month to fill first week
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }

    // Add days from next month to fill last week
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only check if date is before today if allowPastDates is false
    if (!allowPastDates && date < today) return true;

    // Check if date is in disabled dates
    return disabledDates.some(disabledDate => {
      const start = new Date(disabledDate.start);
      const end = new Date(disabledDate.end);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);

      return date >= start && date <= end;
    });
  };

  const handleDateSelect = (date) => {
    if (!isDateDisabled(date)) {
      // Format date as YYYY-MM-DD in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      onChange(formattedDate);
      setIsOpen(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="relative" ref={datePickerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          type="text"
          className={`w-full border border-gray-300 rounded-lg p-3 cursor-pointer bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${error ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500' : ''
            }`}
          value={formatDate(value)}
          onClick={() => setIsOpen(!isOpen)}
          readOnly
          placeholder="Select date"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-semibold text-gray-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-3">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center font-medium">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const isDisabled = isDateDisabled(day.date);

                // Format current day for comparison
                const year = day.date.getFullYear();
                const month = String(day.date.getMonth() + 1).padStart(2, '0');
                const dayOfMonth = String(day.date.getDate()).padStart(2, '0');
                const formattedDay = `${year}-${month}-${dayOfMonth}`;

                const isSelected = value === formattedDay;
                const isToday = day.date.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(day.date)}
                    disabled={isDisabled}
                    className={`
                      h-8 w-8 text-sm rounded-lg flex items-center justify-center transition-all
                      ${isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-blue-100 cursor-pointer'
                      }
                      ${isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        : ''
                      }
                      ${isToday && !isSelected
                        ? 'bg-blue-100 text-blue-600 font-semibold'
                        : ''
                      }
                      ${!day.isCurrentMonth
                        ? 'text-gray-300'
                        : 'text-gray-700'
                      }
                    `}
                  >
                    {day.date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-rose-600 mt-2 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      {helperText && !error && (
        <div className="text-xs text-gray-500 mt-2">{helperText}</div>
      )}
    </div>
  );
};


// Leave Type Card Component
// Leave Type Card Component
const LeaveTypeCard = ({ leaveType, isSelected, onClick, leaveCredits, leaveBalances, isDisabled }) => {
  const getLeaveBalance = (type) => {
    const code = type.code.toUpperCase();

    if (type.earnable) {
      if (code === 'SL') return leaveCredits?.sl || 0;
      if (code === 'VL') return leaveCredits?.vl || 0;
    } else {
      const balanceRecord = leaveBalances?.[type.id];
      return balanceRecord?.balance || type.default_days || 0;
    }
    return 0;
  };

  const balance = getLeaveBalance(leaveType);
  const isLowBalance = balance <= (leaveType.default_days || 5) * 0.2; // 20% threshold



  return (
    <button
      type="button"
      onClick={!isDisabled ? onClick : undefined}
      disabled={isDisabled}
      className={`
        w-full p-6 text-left transition-all duration-200 ease-in-out
        rounded-xl border-2
        ${isDisabled
          ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
          : 'bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 hover:scale-[1.01] cursor-pointer'
        }
        ${isSelected && !isDisabled
          ? 'border-blue-500 shadow-lg shadow-blue-100 transform scale-[1.02]'
          : ''
        }
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md mb-2">
            {leaveType.code}
          </span>
          <h3 className="text-lg font-semibold text-gray-900">{leaveType.name}</h3>
        </div>
        {isSelected && !isDisabled && (
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        )}
        {isDisabled && (
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        )}
      </div>

      {/* Balance Information */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">Available Balance</span>
        <span className={`text-lg font-bold ${isDisabled ? 'text-gray-500' :
            isLowBalance ? 'text-amber-600' : 'text-green-600'
          }`}>
          {balance} days
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${isDisabled ? 'bg-gray-400' :
              isLowBalance ? 'bg-amber-500' : 'bg-green-500'
            }`}
          style={{
            width: `${Math.min((balance / (leaveType.default_days || 15)) * 100, 100)}%`
          }}
        ></div>
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          {!!leaveType.document_required && (
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Document Required
            </span>
          )}
          {!!isDisabled && (
            <span className="flex items-center text-amber-600 font-medium">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Not Available
            </span>
          )}
        </div>
        {!!(!leaveType.earnable && leaveType.default_days) && (
          <span>Fixed: {leaveType.default_days} days</span>
        )}
      </div>
    </button>
  );
};

export default function RequestLeave({ prefill }) {
  const { props } = usePage();
  const { leaveTypes, flash, existingRequests, leaveCredits, leaveBalances, errors, auth } = props;

  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // NEW: Modal state
  const [isSubmitting, setIsSubmitting] = useState(false); // NEW: Submission state

  // Get employee gender from auth or props
  const employeeGender = auth?.user?.employee?.gender || props.employeeGender;

  const sortedLeaveTypes = useMemo(() =>
    sortLeaveTypesByPriority(leaveTypes),
    [leaveTypes]
  );

  // Get URL parameters for pre-filling
  const [urlParams, setUrlParams] = useState(new URLSearchParams(window.location.search));
    
  const prefillDate = urlParams.get('prefill_date');
  const prefillForAbsence = urlParams.get('prefill_for_absence');

  const selectedType = useMemo(() => leaveTypes?.find((lt) => lt.id === selectedTypeId) || null, [leaveTypes, selectedTypeId]);
  const specificFields = useMemo(() => typeSpecificFields(selectedType?.code), [selectedType]);

  const formSectionRef = useRef(null);

  // Auto-select Sick Leave and pre-fill date when component mounts for absence requests
  useEffect(() => {
      if (prefillForAbsence && prefillDate) {
          // Find Sick Leave type
          const sickLeaveType = leaveTypes?.find(lt => 
              lt.code.toUpperCase() === 'SL' || 
              lt.name.toLowerCase().includes('sick')
          );

          if (sickLeaveType && !isLeaveTypeDisabled(sickLeaveType)) {
              setSelectedTypeId(sickLeaveType.id);
              setData('leave_type_id', sickLeaveType.id);
          }

          // Pre-fill the date
          setData('date_from', prefillDate);
          setData('number_of_days', 1);
          setData('selectedDates', [prefillDate]);
          setData('date_to', prefillDate);
          
          // Auto-scroll to form section
          if (formSectionRef.current) {
              setTimeout(() => {
                  formSectionRef.current.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start'
                  });
              }, 100);
          }
      }
  }, [prefillForAbsence, prefillDate, leaveTypes]);


  // In your RequestLeave component, add this debug section temporarily:
  console.log('Holidays from backend:', props.holidays);
  console.log('Holidays data type:', typeof props.holidays);

  // const selectedType = useMemo(() => leaveTypes?.find((lt) => lt.id === selectedTypeId) || null, [leaveTypes, selectedTypeId]);
  // const specificFields = useMemo(() => typeSpecificFields(selectedType?.code), [selectedType]);

  // const formSectionRef = useRef(null);

  useEffect(() => {
    if (selectedTypeId && formSectionRef.current) {
      // Small timeout to ensure the form has rendered
      setTimeout(() => {
        formSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [selectedTypeId]);


  
    // useEffect(() => {
    //     if (prefill) {
    //         if (prefill.leave_type_id) {
    //             const leaveType = leaveTypes?.find(lt => lt.id.toString() === prefill.leave_type_id.toString());
    //             if (leaveType && !isLeaveTypeDisabled(leaveType)) {
    //                 setSelectedTypeId(leaveType.id);
    //                 setData('leave_type_id', leaveType.id);
    //             }
    //         }

    //         if (prefill.date) {
    //             setData('date_from', prefill.date);
    //             setData('number_of_days', prefill.number_of_days || 1);
    //             setData('selectedDates', [prefill.date]);
    //             setData('date_to', prefill.date);
    //         }
    //     }
    // }, [prefill, leaveTypes]);

  const { data, setData, post, processing, reset } = useForm({
    leave_type_id: '',
    date_from: '',
    selectedDates: [],
    date_to: '',
    reason: '',
    attachment: null,
    details: '',
    number_of_days: '',
  });

  // Calculate working days
  // Calculate working days based on selected dates
  // Replace your current workingDays calculation with this:
const workingDays = useMemo(() => {
  // If using specific dates
  if (data.selectedDates && data.selectedDates.length > 0) {
    return data.selectedDates.filter(date => {
      const day = new Date(date).getDay();
      return day !== 0 && day !== 6;
    }).length;
  }
  
  // If using number of days method
  if (data.number_of_days && data.date_from && data.date_to) {
    return calculateWorkingDays(data.date_from, data.date_to);
  }
  
  return 0;
}, [data.selectedDates, data.number_of_days, data.date_from, data.date_to]);

  // Check if document is required for sick leave
  const isDocumentRequired = useMemo(() => {
    if (!selectedType || selectedType.code.toUpperCase() !== 'SL') return false;
    return workingDays > 5;
  }, [selectedType, workingDays]);

  // Allow past dates only for sick leave
  const allowPastDates = selectedType?.code.toUpperCase() === 'SL';

  // Calculate balance information for all leave types
  const balanceInfo = useMemo(() => {
    if (!selectedType) return null;

    const code = selectedType.code.toUpperCase();
    const isEarnable = selectedType.earnable;

    let availableBalance = 0;
    let isFixedLeave = false;
    let maxAllowedDays = 0;

    if (isEarnable) {
      // For SL and VL (earnable leaves)
      if (code === 'SL' || code === 'VL') {
        availableBalance = code === 'SL' ? (leaveCredits?.sl || 0) : (leaveCredits?.vl || 0);
        maxAllowedDays = Math.floor(availableBalance); // Only whole days for paid leave
      }
    } else {
      // For fixed leave types (SPL, ML, PL, etc.)
      isFixedLeave = true;
      const balanceRecord = leaveBalances?.[selectedType.id];
      availableBalance = balanceRecord?.balance || 0;
      maxAllowedDays = availableBalance; // Fixed leaves use exact balance

      // If no balance record exists, use the default days from leave type
      if (!balanceRecord && selectedType.default_days) {
        availableBalance = selectedType.default_days;
        maxAllowedDays = selectedType.default_days;
      }
    }

    const requestedDays = workingDays;
    const isInsufficient = requestedDays > maxAllowedDays;
    const exceedsLimit = isFixedLeave && isInsufficient;

    return {
      availableBalance,
      maxAllowedDays,
      requestedDays,
      isInsufficient,
      exceedsLimit,
      isFixedLeave,
      leaveTypeCode: code,
      leaveTypeName: selectedType.name
    };
  }, [selectedType, leaveCredits, leaveBalances, workingDays]);

  // Show warning message when fixed leave balance is exceeded
  useEffect(() => {
    if (balanceInfo && balanceInfo.exceedsLimit && data.date_from && data.date_to) {
      setShowBalanceWarning(true);
    } else {
      setShowBalanceWarning(false);
    }
  }, [balanceInfo, data.date_from, data.date_to]);

  // In your RequestLeave component, update the form submission:
  const submit = (e) => {
    e.preventDefault();

    // Validate that we have either selected dates OR number of days with start date
    if ((!data.selectedDates || data.selectedDates.length === 0) &&
      (!data.number_of_days || !data.date_from)) {

      return;
    }

    // If using number of days method, generate the date range
    let finalSelectedDates = data.selectedDates;
    if (data.number_of_days && data.date_from && (!data.selectedDates || data.selectedDates.length === 0)) {
      finalSelectedDates = generateDateRange(data.date_from, data.number_of_days);
      setData('selectedDates', finalSelectedDates);
    }

    // Validate fixed leave balance
    if (balanceInfo && balanceInfo.exceedsLimit) {
      return;
    }

    // Validate sick leave document requirement
    if (selectedType?.code.toUpperCase() === 'SL' && isDocumentRequired && !data.attachment) {
      return;
    }

    // Validate reason field
    if (!data.reason || data.reason.trim() === '') {
      return;
    }

    // Collect all dynamic field values
    const details = specificFields.map((f) => ({
      field_name: f.name,
      field_value: data[f.name] || '',
    }));

    // Create submission data
    const submissionData = {
      leave_type_id: data.leave_type_id,
      selectedDates: finalSelectedDates,
      date_from: data.date_from,
      date_to: data.date_to,
      reason: data.reason,
      details: JSON.stringify(details),
      working_days: workingDays.toString(),
      number_of_days: data.number_of_days, // Include number of days in submission
      attachment: data.attachment,
    };

    console.log('Submitting data:', submissionData);

    router.post('/employee/leave', submissionData, {
      onSuccess: () => {
        reset();
        setSelectedTypeId(null);
        setShowBalanceWarning(false);
        router.visit('/employee/my-leave-requests', {
          data: { success: 'Leave request submitted successfully!' }
        });
      },
      onError: (errors) => {
        console.error('Validation errors:', errors);
      },
    });
  };

  // Helper function to generate date range from start date and number of days
  const generateDateRange = (startDate, numberOfDays) => {
    const dates = [];
    const start = new Date(startDate);

    for (let i = 0; i < numberOfDays; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      dates.push(formatDate(currentDate));
    }

    return dates;
  };

  // Function to check if leave type should be disabled based on gender
  const isLeaveTypeDisabled = (leaveType) => {
    if (!employeeGender) return false;

    const leaveTypeCode = leaveType.code.toUpperCase();
    const gender = employeeGender.toLowerCase();

    // Disable for male employees
    if (gender === 'male') {
      return leaveTypeCode === 'SLBW' || // Special Leave Benefits for Women
        leaveTypeCode === 'ML';    // Maternity Leave
    }

    // Disable for female employees
    if (gender === 'female') {
      return leaveTypeCode === 'PL';     // Paternity Leave
    }

    return false;
  };

  const handleSelectType = (lt) => {
    // Check if this leave type is disabled
    if (isLeaveTypeDisabled(lt)) {
      return; // Don't select disabled types
    }

    setSelectedTypeId(lt.id);
    setData('leave_type_id', lt.id);
    setShowBalanceWarning(false); // Reset warning when changing leave type
  };


  // Calculate end date based on start date and number of days
  const calculateEndDate = (startDate, numberOfDays, returnFormatted = false) => {
    if (!startDate || !numberOfDays || numberOfDays <= 0) return '';

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + numberOfDays - 1); // Subtract 1 to include start date

    if (returnFormatted) {
      return end.toLocaleDateString();
    }

    // Set the end date in the form data
    setData('date_to', formatDate(end));
    return end;
  };

  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmitClick = async (e) => {
    e.preventDefault();
  
    // Validate that we have either selected dates OR number of days with start date
    if ((!data.selectedDates || data.selectedDates.length === 0) &&
      (!data.number_of_days || !data.date_from)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please either select specific dates OR enter number of days with start date.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
  
    // Validate fixed leave balance
    if (balanceInfo && balanceInfo.exceedsLimit) {
      await Swal.fire({
        icon: 'error',
        title: 'Insufficient Leave Balance',
        html: `Cannot submit leave request. You only have <strong>${balanceInfo.availableBalance} days</strong> available for ${balanceInfo.leaveTypeName}. Please adjust your dates.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444',
      });
      return;
    }
  
    // Validate sick leave document requirement
    if (selectedType?.code.toUpperCase() === 'SL' && isDocumentRequired && !data.attachment) {
      await Swal.fire({
        icon: 'warning',
        title: 'Document Required',
        text: 'A medical certificate is required for sick leaves exceeding 5 days.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }
  
    // Validate reason field
    if (!data.reason || data.reason.trim() === '') {
      await Swal.fire({
        icon: 'info',
        title: 'Reason Required',
        text: 'Please provide a reason for your leave request.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }
  
    // If all validations pass, show confirmation modal
    setShowConfirmationModal(true);
  };

  // NEW: Function to handle actual submission
  const handleConfirmSubmit = () => {
    setIsSubmitting(true);

    // If using number of days method, generate the date range
    let finalSelectedDates = data.selectedDates;
    if (data.number_of_days && data.date_from && (!data.selectedDates || data.selectedDates.length === 0)) {
      finalSelectedDates = generateDateRange(data.date_from, data.number_of_days);
      setData('selectedDates', finalSelectedDates);
    }

    // Collect all dynamic field values
    const details = specificFields.map((f) => ({
      field_name: f.name,
      field_value: data[f.name] || '',
    }));

    // Create submission data
    const submissionData = {
      leave_type_id: data.leave_type_id,
      selectedDates: finalSelectedDates,
      date_from: data.date_from,
      date_to: data.date_to,
      reason: data.reason,
      details: JSON.stringify(details),
      working_days: workingDays.toString(),
      number_of_days: data.number_of_days,
      attachment: data.attachment,
    };

    console.log('Submitting data:', submissionData);

    router.post('/employee/leave', submissionData, {
      onSuccess: () => {
        reset();
        setSelectedTypeId(null);
        setShowBalanceWarning(false);
        setShowConfirmationModal(false);
        setIsSubmitting(false);
        // Show success message
        router.visit('/employee/my-leave-requests', {
          data: { success: 'Your leave request has been submitted for approval.' }
        });
      },
      onError: (errors) => {
        console.error('Validation errors:', errors);
        setIsSubmitting(false);
        setShowConfirmationModal(false);
      },
    });
  };

  // NEW: Function to cancel submission
  const handleCancelSubmit = () => {
    setShowConfirmationModal(false);
  };



  
  return (
    <EmployeeLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Request a Leave</h1>
          <p className="text-lg text-gray-600">Select a leave type and fill out the required information</p>
        </div>
  
        {/* Pre-fill Notice */}
        {prefillForAbsence && prefillDate && (
          <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-400 rounded-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-base font-semibold text-blue-800">
                  Leave Request for Past Absence
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  This leave request has been pre-filled for your absence on <strong className="font-semibold">{new Date(prefillDate).toLocaleDateString()}</strong>. 
                  The leave type has been set to <strong className="font-semibold">Sick Leave</strong> by default.
                </p>
              </div>
            </div>
          </div>
        )}
  
        {/* Success Message */}
        {flash?.success && (
          <div className="mb-8 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 font-medium">{flash.success}</span>
            </div>
          </div>
        )}
  
        {/* Leave Type Selection */}
        <section className="mb-10">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Leave Type</h2>
            {employeeGender && (
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm text-indigo-800">
                  <strong className="font-semibold">Note:</strong> Some leave types are restricted based on your gender ({employeeGender}).
                  Restricted types are shown but cannot be selected.
                </p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sortedLeaveTypes?.map((lt) => {
              const isDisabled = isLeaveTypeDisabled(lt);
              return (
                <LeaveTypeCard
                  key={lt.id}
                  leaveType={lt}
                  isSelected={selectedTypeId === lt.id}
                  onClick={() => handleSelectType(lt)}
                  leaveCredits={leaveCredits}
                  leaveBalances={leaveBalances}
                  isDisabled={isDisabled}
                />
              );
            })}
          </div>
        </section>
  
        {/* Dynamic Form */}
        {selectedType && (
          <form
            ref={formSectionRef}
            className="space-y-8"
            encType="multipart/form-data"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              {/* Form Header */}
              <div className="mb-8 pb-6 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Leave Request Details
                </h2>
                <p className="text-lg text-blue-600 font-medium mt-2">{selectedType.name}</p>
              </div>
  
              {errors.leave_type_id && (
                <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-400 rounded-lg">
                  <div className="text-sm text-rose-700">{errors.leave_type_id}</div>
                </div>
              )}
              <input type="hidden" name="leave_type_id" value={data.leave_type_id} />
  
              {/* Balance Warning */}
              {showBalanceWarning && (
                <div className="mb-8 p-6 bg-rose-50 border-l-4 border-rose-400 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="h-5 w-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-base font-semibold text-rose-800">
                        Leave Balance Exceeded
                      </h3>
                      <div className="mt-2 text-sm text-rose-700 space-y-1">
                        <p>
                          You are requesting <strong className="font-semibold">{balanceInfo?.requestedDays} days</strong> of {balanceInfo?.leaveTypeName},
                          but you only have <strong className="font-semibold">{balanceInfo?.availableBalance} days</strong> available.
                        </p>
                        <p className="font-semibold">
                          Please change the duration. You can only avail up to {balanceInfo?.availableBalance} days for this leave type.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
  
              {/* Date Selection Notice */}
              <div className="mb-8 p-5 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <strong className="font-semibold">Date Selection Rules:</strong>
                    <ul className="mt-2 space-y-1">
                      <li className="flex items-start">
                        <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        {selectedType.code.toUpperCase() === 'SL'
                          ? 'Sick Leave: Past and future dates are allowed'
                          : `${selectedType.name}: Only current and future dates are allowed`
                        }
                      </li>
                      {selectedType.code.toUpperCase() === 'SL' && (
                        <li className="flex items-start">
                          <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          Medical certificate is {workingDays > 5 ? 'required' : 'optional'} for {workingDays} days
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
  
              {/* Balance Information */}
{balanceInfo && data.date_from && data.date_to && (
  <div className={`mb-8 p-6 border-l-4 rounded-lg ${
    balanceInfo.exceedsLimit
      ? 'bg-rose-50 border-rose-400'
      : 'bg-blue-50 border-blue-400'
  }`}>
    <h4 className="text-lg font-semibold text-gray-900 mb-4">Leave Balance Information</h4>
    
    {/* NEW: Info Message about Leave Credit Reservation */}
    {(balanceInfo.leaveTypeCode === 'SL' || balanceInfo.leaveTypeCode === 'VL') && (
      <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-amber-800">
            <strong className="font-semibold">Note:</strong> Leave credits cannot be fully consumed. The system always reserves 1 day before starting unpaid leave calculation.
          </div>
        </div>
      </div>
    )}
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div>
          <span className="font-medium text-gray-700">Leave Type:</span>
          <span className="ml-2 text-gray-900">{balanceInfo.leaveTypeName}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Available Balance:</span>
          <span className={`ml-2 font-semibold ${
            balanceInfo.isFixedLeave && balanceInfo.availableBalance === 0 
              ? 'text-rose-600' 
              : 'text-green-600'
          }`}>
            {balanceInfo.availableBalance} days
          </span>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <span className="font-medium text-gray-700">Requested Duration:</span>
          <span className="ml-2 text-gray-900">{balanceInfo.requestedDays} working days</span>
        </div>
      </div>
      
      {/* Rest of the balance info display remains the same */}
      {balanceInfo.exceedsLimit ? (
        <div className="md:col-span-2 p-4 bg-rose-100 border border-rose-200 rounded-lg">
          <div className="font-semibold text-rose-800 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Request Exceeds Available Balance
          </div>
          <div className="mt-1 text-rose-700">
            You cannot request more days than your available balance for fixed leave types.
          </div>
        </div>
      ) : balanceInfo.isFixedLeave ? (
        <div className="md:col-span-2 p-4 bg-green-100 border border-green-200 rounded-lg">
          <div className="font-semibold text-green-800 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Balance Sufficient
          </div>
          <div className="mt-1 text-green-700">
            Your request is within your available balance.
          </div>
        </div>
      ) : balanceInfo.isInsufficient ? (
        <div className="md:col-span-2 p-4 bg-amber-100 border border-amber-200 rounded-lg">
          <div className="font-semibold text-amber-800 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Partial Leave Notice
          </div>
          <div className="mt-2 text-amber-800">
            {(balanceInfo.leaveTypeCode === 'SL' || balanceInfo.leaveTypeCode === 'VL') ? (
              <div className="space-y-2">
                <div>Your request will be automatically split between paid and unpaid days:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div className="flex items-center text-green-700">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Days with pay: <strong>{Math.max(0, Math.floor(balanceInfo.availableBalance) - 1)}</strong></span>
                  </div>
                  <div className="flex items-center text-orange-700">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Days without pay: <strong>{Math.max(0, balanceInfo.requestedDays - (Math.floor(balanceInfo.availableBalance) - 1))}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div>Your request will be automatically split between paid and unpaid days.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="md:col-span-2 p-4 bg-green-100 border border-green-200 rounded-lg">
          <div className="font-semibold text-green-800 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Full Pay Leave
          </div>
          <div className="mt-1 text-green-700">
            Your leave will be fully paid.
          </div>
        </div>
      )}
    </div>
  </div>
)}
  
              {/* Form Fields Grid */}
              <div className="space-y-8">
                {/* Date and Duration Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Number of Days Input */}
                  <div>
                    <label className="block text-base font-semibold text-gray-900 mb-3">
                      Number of Days <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
                      value={data.number_of_days || ''}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 0;
                        setData('number_of_days', days);
  
                        if (data.date_from && days > 0) {
                          calculateEndDate(data.date_from, days);
                        }
                      }}
                      placeholder="Enter number of leave days"
                    />
                    {errors.number_of_days && (
                      <div className="text-sm text-rose-600 mt-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {errors.number_of_days}
                      </div>
                    )}
                  </div>
  
                  {/* Start Date Input */}
                  <div>
                    <label className="block text-base font-semibold text-gray-900 mb-3">
                      Start Date <span className="text-rose-500">*</span>
                    </label>
                    <DateInput
                      value={data.date_from}
                      onChange={(value) => {
                        setData('date_from', value);
  
                        if (data.number_of_days && data.number_of_days > 0) {
                          calculateEndDate(value, data.number_of_days);
                        }
                      }}
                      disabledDates={existingRequests || []}
                      allowPastDates={allowPastDates}
                      minDate={allowPastDates ? null : new Date().toISOString().split('T')[0]}
                      placeholder="Select start date"
                    />
                    {errors.date_from && (
                      <div className="text-sm text-rose-600 mt-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {errors.date_from}
                      </div>
                    )}
                  </div>
                </div>
  
                {/* End Date Display */}
                {data.date_from && data.number_of_days && data.number_of_days > 0 && (
                  <div className="p-5 bg-green-50 border-l-4 border-green-400 rounded-lg">
                    <div className="text-base text-green-800">
                      <div className="font-semibold mb-3">Leave Duration Calculation:</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="font-medium">Start Date:</span>
                          <div className="text-green-700 font-semibold">{new Date(data.date_from).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="font-medium">Number of Days:</span>
                          <div className="text-green-700 font-semibold">{data.number_of_days}</div>
                        </div>
                        <div>
                          <span className="font-medium">End Date:</span>
                          <div className="text-green-700 font-bold">
                            {calculateEndDate(data.date_from, data.number_of_days, true)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
  
                {/* MultiDate Picker */}
                <div>
                  <label className="block text-base font-semibold text-gray-900 mb-3">
                    Or Select Specific Dates (Optional)
                  </label>
                  <MultiDatePicker
                    selectedDates={data.selectedDates || []}
                    onDatesChange={(dates) => {
                      setData('selectedDates', dates);
                      if (dates.length > 0) {
                        const sortedDates = dates.sort();
                        setData('date_from', sortedDates[0]);
                        setData('date_to', sortedDates[sortedDates.length - 1]);
                        const totalDays = dates.length;
                        setData('number_of_days', totalDays);
                      } else {
                        setData('date_from', '');
                        setData('date_to', '');
                        setData('number_of_days', '');
                      }
                    }}
                    disabledDates={existingRequests || []}
                    allowWeekends={selectedType?.code.toUpperCase() === 'SL'}
                    allowHolidays={selectedType?.code.toUpperCase() === 'SL'}
                    allowPastDates={allowPastDates}
                    minDate={allowPastDates ? null : new Date().toISOString().split('T')[0]}
                    placeholder="Click to select specific dates (optional)"
                    className="w-full"
                  />
  
                  {/* Selected Dates Summary */}
                  {data.selectedDates && data.selectedDates.length > 0 && (
                    <div className="mt-4 p-5 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                      <div className="text-base text-blue-800">
                        <div className="font-semibold mb-3">Selected Dates Summary:</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <span className="font-medium">Total Days:</span>
                            <div className="text-blue-700 font-semibold">{data.selectedDates.length}</div>
                          </div>
                          <div>
                            <span className="font-medium">Working Days:</span>
                            <div className="text-blue-700 font-semibold">
                              {data.selectedDates.filter(date => {
                                const day = new Date(date).getDay();
                                return day !== 0 && day !== 6;
                              }).length}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Date Range:</span>
                            <div className="text-blue-700 font-semibold">
                              {data.selectedDates.length > 0
                                ? `${new Date(data.selectedDates[0]).toLocaleDateString()} to ${new Date(data.selectedDates[data.selectedDates.length - 1]).toLocaleDateString()}`
                                : 'No dates selected'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
  
                {/* Reason Textarea */}
                <div>
                  <label className="block text-base font-semibold text-gray-900 mb-3">Reason</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
                    rows="5"
                    value={data.reason}
                    onChange={(e) => setData('reason', e.target.value)}
                    placeholder="Please provide a detailed reason for your leave request..."
                  />
                  {errors.reason && (
                    <div className="text-sm text-rose-600 mt-3">{errors.reason}</div>
                  )}
                </div>
  
                {/* Additional Information */}
                {specificFields.length > 0 && (
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {specificFields.map((f) => (
                        <div key={f.name}>
                          <label className="block text-base font-semibold text-gray-900 mb-3">
                            {f.label}
                            {f.required && <span className="text-rose-500 ml-1">*</span>}
                          </label>
                          {f.type === 'select' ? (
                            <select
                              className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
                              value={data[f.name] || ''}
                              onChange={(e) => setData(f.name, e.target.value)}
                              required={f.required}
                            >
                              <option value="">Select {f.label}</option>
                              {f.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={f.type}
                              className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
                              value={data[f.name] || ''}
                              onChange={(e) => setData(f.name, e.target.value)}
                              required={f.required}
                              placeholder={f.required ? `Enter ${f.label}` : `${f.label} (Optional)`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
  
               {/* File Upload */}
<div className="border-t border-gray-200 pt-8">
  <label className="block text-base font-semibold text-gray-900 mb-4">
    Attachment {isDocumentRequired && <span className="text-rose-500">*</span>}
  </label>
  
  {/* File Preview Section */}
  {data.attachment ? (
    <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {data.attachment.type.startsWith('image/') ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300">
                <img 
                  src={URL.createObjectURL(data.attachment)} 
                  alt="Attachment preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-200">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="ml-4">
            <h4 className="text-lg font-semibold text-gray-900">{data.attachment.name}</h4>
            <p className="text-sm text-gray-600">
              {(data.attachment.size / 1024 / 1024).toFixed(2)} MB • {data.attachment.type}
            </p>
            <p className="text-sm text-green-600 font-medium mt-1">
              ✓ File successfully uploaded
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setData('attachment', null)}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
          title="Remove file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  ) : null}

  {/* Upload Area */}
  <div className="flex items-center justify-center w-full">
    <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
      data.attachment 
        ? 'border-green-300 bg-green-50 hover:bg-green-100' 
        : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
    }`}>
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        {data.attachment ? (
          <>
            <svg className="w-12 h-12 mb-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <p className="mb-2 text-lg text-green-600 font-medium">
              File Uploaded Successfully
            </p>
            <p className="text-sm text-green-500">
              Click to change file or drag and drop a new one
            </p>
          </>
        ) : (
          <>
            <svg className="w-12 h-12 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
            </svg>
            <p className="mb-2 text-lg text-gray-500 font-medium">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-gray-500">JPEG, PNG, PDF, DOC (Max. 10MB)</p>
          </>
        )}
      </div>
      <input
        type="file"
        className="hidden"
        onChange={(e) => setData('attachment', e.target.files[0])}
        accept="image/*,application/pdf,.doc,.docx"
        required={isDocumentRequired}
      />
    </label>
  </div>

  {/* Helper Text */}
  {isDocumentRequired ? (
    <div className="mt-4 text-base text-rose-600 flex items-center">
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
      Medical certificate is required for sick leaves exceeding 5 days
    </div>
  ) : selectedType?.code.toUpperCase() === 'SL' && workingDays > 0 ? (
    <div className="mt-4 text-base text-gray-500">
      Medical certificate is optional for sick leaves of 1-5 days
    </div>
  ) : errors.attachment ? (
    <div className="mt-4 text-base text-rose-600">{errors.attachment}</div>
  ) : (
    <div className="mt-4 text-base text-gray-500">
      Supporting document - Optional
    </div>
  )}
</div>
  
                {/* Submit Button */}
                <div className="flex justify-end pt-8 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleSubmitClick}
                    disabled={processing || (balanceInfo && balanceInfo.exceedsLimit)}
                    className={`
                      px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 text-lg
                      ${processing || (balanceInfo && balanceInfo.exceedsLimit)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      }
                    `}
                  >
                    {processing
                      ? 'Submitting...'
                      : (balanceInfo && balanceInfo.exceedsLimit)
                        ? 'Adjust Duration to Submit'
                        : 'Submit Leave Request'
                    }
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
  


      {/* Confirmation Modal */}
     {/* Confirmation Modal - Appears at current scroll position */}
{showConfirmationModal && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-end justify-center p-4">
    <div className="relative my-8 p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-xl font-semibold text-gray-900">
                  Confirm Leave Request
                </h3>
                <button
                  onClick={handleCancelSubmit}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isSubmitting}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Leave Request Summary */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Leave Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Leave Type</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{selectedType?.name}</p>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Duration</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {data.selectedDates?.length || data.number_of_days} day{((data.selectedDates?.length || data.number_of_days) !== 1) ? 's' : ''}
                      {workingDays > 0 && ` (${workingDays} working days)`}
                    </p>
                  </div>

                  {/* Date Range */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">Date Range</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {data.date_from && new Date(data.date_from).toLocaleDateString()}
                      {' to '}
                      {data.date_to && new Date(data.date_to).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Reason */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">Reason</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border">
                      {data.reason}
                    </p>
                  </div>

                  {/* Additional Information */}
                  {specificFields.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-2">Additional Information</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {specificFields.map((f) => (
                          <div key={f.name} className="bg-gray-50 p-3 rounded-lg border">
                            <label className="block text-xs font-medium text-gray-500">{f.label}</label>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {data[f.name] || 'Not provided'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attachment */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">Attachment</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {data.attachment ? data.attachment.name : 'No attachment'}
                      {isDocumentRequired && !data.attachment && (
                        <span className="text-rose-600 ml-2">(Required for this leave type)</span>
                      )}
                    </p>
                  </div>

                  {balanceInfo && (
  <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
    <h4 className="text-sm font-semibold text-blue-900 mb-2">Balance Impact</h4>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-gray-600">Available Balance:</span>
        <span className="ml-2 font-semibold text-green-600">
          {balanceInfo.availableBalance} days
        </span>
      </div>
      <div>
        <span className="text-gray-600">Requested Days:</span>
        <span className="ml-2 font-semibold text-blue-600">
          {balanceInfo.requestedDays} days
        </span>
      </div>
      
      {/* NEW: Info message about 1-day reservation */}
      {(balanceInfo.leaveTypeCode === 'SL' || balanceInfo.leaveTypeCode === 'VL') && (
        <div className="col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> 1 day is always reserved from leave credits. Usable paid days: {Math.max(0, Math.floor(balanceInfo.availableBalance) - 1)}
            </p>
          </div>
        </div>
      )}
      
      {balanceInfo.isInsufficient ? (
        <div className="col-span-2 p-3 bg-amber-100 rounded border border-amber-200">
          <p className="text-sm text-amber-800 font-medium">
            This request will be split between paid and unpaid leave
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {/* UPDATED: Use new calculation with 1-day reservation */}
            <span className="flex items-center text-green-700">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Days with pay: {Math.min(Math.max(0, Math.floor(balanceInfo.availableBalance) - 1), balanceInfo.requestedDays)}
            </span>
            <span className="flex items-center text-orange-700">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Days without pay: {Math.max(0, balanceInfo.requestedDays - Math.max(0, Math.floor(balanceInfo.availableBalance) - 1))}
            </span>
          </div>
        </div>
      ) : (
        <div className="col-span-2 p-3 bg-green-100 rounded border border-green-200">
          <p className="text-sm text-green-800 font-medium flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Full Pay Leave - All days will be paid
          </p>
        </div>
      )}
    </div>
  </div>
)}
 </div>

                {/* Important Notice */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex">
                    <svg className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-amber-800">
                      Please review your leave request details carefully. Once submitted, changes may require approval from HR.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 p-6 border-t">
                <button
                  onClick={handleCancelSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Confirm & Submit Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
}


