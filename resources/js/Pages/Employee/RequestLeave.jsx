import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { useForm, usePage, router } from '@inertiajs/react';
import { useMemo, useState, useRef, useEffect } from 'react';

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
          className={`w-full border border-gray-300 rounded-lg p-3 cursor-pointer bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            error ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500' : ''
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
        <span className={`text-lg font-bold ${
          isDisabled ? 'text-gray-500' : 
          isLowBalance ? 'text-amber-600' : 'text-green-600'
        }`}>
          {balance} days
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isDisabled ? 'bg-gray-400' :
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

export default function RequestLeave() {
  const { props } = usePage();
  const { leaveTypes, flash, existingRequests, leaveCredits, leaveBalances, errors,auth  } = props;

  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);

  // Get employee gender from auth or props
  const employeeGender = auth?.user?.employee?.gender || props.employeeGender;

  const sortedLeaveTypes = useMemo(() => 
    sortLeaveTypesByPriority(leaveTypes), 
    [leaveTypes]
  );

  const selectedType = useMemo(() => leaveTypes?.find((lt) => lt.id === selectedTypeId) || null, [leaveTypes, selectedTypeId]);
  const specificFields = useMemo(() => typeSpecificFields(selectedType?.code), [selectedType]);

  const { data, setData, post, processing, reset } = useForm({
      leave_type_id: '',
      date_from: '',
      date_to: '',
      reason: '',
      attachment: null,
      details: '',
  });

  // Calculate working days
  const workingDays = useMemo(() => {
      return calculateWorkingDays(data.date_from, data.date_to);
  }, [data.date_from, data.date_to]);

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

  const submit = (e) => {
      e.preventDefault();

      // Validate fixed leave balance
      if (balanceInfo && balanceInfo.exceedsLimit) {
          alert(`Cannot submit leave request. You only have ${balanceInfo.availableBalance} days available for ${balanceInfo.leaveTypeName}. Please adjust your dates.`);
          return;
      }

      // Validate sick leave document requirement
      if (selectedType?.code.toUpperCase() === 'SL' && isDocumentRequired && !data.attachment) {
          alert('A medical certificate is required for sick leaves exceeding 5 days.');
          return;
      }

      // Collect all dynamic field values
      const details = specificFields.map((f) => ({
          field_name: f.name,
          field_value: data[f.name] || '',
      }));

      // Create FormData manually
      const formData = new FormData();
      formData.append('leave_type_id', data.leave_type_id);
      formData.append('date_from', data.date_from);
      formData.append('date_to', data.date_to);
      formData.append('reason', data.reason);
      formData.append('details', JSON.stringify(details));
      formData.append('working_days', workingDays.toString());

      if (data.attachment) {
          formData.append('attachment', data.attachment);
      }

      // Submit using Inertia's router
      router.post('/employee/leave', formData, {
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

  return (
      <EmployeeLayout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Request a Leave</h1>
              <p className="text-gray-600 mb-8">Select a leave type and fill out the required information</p>

              {flash?.success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-800">{flash.success}</span>
                      </div>
                  </div>
              )}

              {/* Leave Type Cards Grid */}
<div className="mb-8">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Leave Type</h2>
    {employeeGender && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
                <strong>Note:</strong> Some leave types are restricted based on your gender ({employeeGender}).
                Restricted types are shown but cannot be selected.
            </p>
        </div>
    )}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
</div>

              {/* Dynamic Form */}
              {selectedType && (
                  <form onSubmit={submit} className="mt-8 space-y-6" encType="multipart/form-data">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <h2 className="text-xl font-semibold text-gray-900 mb-6">
                              Leave Request Details - {selectedType.name}
                          </h2>

                          {errors.leave_type_id && <div className="text-xs text-rose-600">{errors.leave_type_id}</div>}
                          <input type="hidden" name="leave_type_id" value={data.leave_type_id} />

                          {/* Fixed Leave Balance Warning */}
                          {showBalanceWarning && (
                              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                                  <div className="flex items-start">
                                      <div className="flex-shrink-0">
                                          <svg className="h-5 w-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                      </div>
                                      <div className="ml-3">
                                          <h3 className="text-sm font-medium text-rose-800">
                                              Leave Balance Exceeded
                                          </h3>
                                          <div className="mt-1 text-sm text-rose-700">
                                              <p>
                                                  You are requesting <strong>{balanceInfo?.requestedDays} days</strong> of {balanceInfo?.leaveTypeName}, 
                                                  but you only have <strong>{balanceInfo?.availableBalance} days</strong> available.
                                              </p>
                                              <p className="mt-1 font-semibold">
                                                  Please change the duration. You can only avail up to {balanceInfo?.availableBalance} days for this leave type.
                                              </p>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}

                          {/* Date Selection Notice */}
                          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start">
                                  <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                  <div className="text-sm text-blue-800">
                                      <strong>Date Selection Rules:</strong>
                                      <ul className="mt-1 list-disc list-inside">
                                          <li>
                                              {selectedType.code.toUpperCase() === 'SL'
                                                  ? 'Sick Leave: Past and future dates are allowed'
                                                  : `${selectedType.name}: Only current and future dates are allowed`
                                              }
                                          </li>
                                          {selectedType.code.toUpperCase() === 'SL' && (
                                              <li>Medical certificate is {workingDays > 5 ? 'required' : 'optional'} for {workingDays} days</li>
                                          )}
                                      </ul>
                                  </div>
                              </div>
                          </div>

                          {/* Balance Information Display */}
                          {balanceInfo && data.date_from && data.date_to && (
                              <div className={`mb-6 p-4 border rounded-lg ${
                                  balanceInfo.exceedsLimit 
                                      ? 'bg-rose-50 border-rose-200' 
                                      : 'bg-blue-50 border-blue-200'
                              }`}>
                                  <div className="text-sm">
                                      <div className="font-semibold text-gray-900 mb-3">Leave Balance Information</div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                              <span className="font-medium text-gray-700">Leave Type:</span> {balanceInfo.leaveTypeName}
                                          </div>
                                          <div>
                                              <span className="font-medium text-gray-700">Available Balance:</span> {balanceInfo.availableBalance} days
                                              {balanceInfo.isFixedLeave && balanceInfo.availableBalance === 0 && (
                                                  <span className="ml-2 text-rose-600 font-medium">(No balance available)</span>
                                              )}
                                          </div>
                                          <div>
                                              <span className="font-medium text-gray-700">Requested Duration:</span> {balanceInfo.requestedDays} working days
                                          </div>
                                          
                                          {balanceInfo.exceedsLimit ? (
                                              <div className="md:col-span-2 mt-2 p-3 bg-rose-100 border border-rose-200 rounded text-rose-800">
                                                  <div className="font-medium">❌ Request Exceeds Available Balance</div>
                                                  <div className="mt-1">
                                                      You cannot request more days than your available balance for fixed leave types.
                                                  </div>
                                              </div>
                                          ) : balanceInfo.isFixedLeave ? (
                                              <div className="md:col-span-2 mt-2 p-3 bg-green-100 border border-green-200 rounded text-green-800">
                                                  <div className="font-medium">✅ Balance Sufficient</div>
                                                  <div className="mt-1">
                                                      Your request is within your available balance.
                                                  </div>
                                              </div>
                                          ) : balanceInfo.isInsufficient ? (
                                              <div className="md:col-span-2 mt-2 p-3 bg-amber-100 border border-amber-200 rounded text-amber-800">
                                                  <div className="font-medium">⚠️ Partial Leave Notice</div>
                                                  <div className="mt-1">
                                                      {(balanceInfo.leaveTypeCode === 'SL' || balanceInfo.leaveTypeCode === 'VL') ? (
                                                          <div>
                                                              <div>Your request will be automatically split between paid and unpaid days:</div>
                                                              <div className="mt-2 space-y-1">
                                                                  <div className="flex justify-between">
                                                                      <span>Days with pay:</span>
                                                                      <span className="font-semibold text-green-700">{balanceInfo.availableBalance} days</span>
                                                                  </div>
                                                                  <div className="flex justify-between">
                                                                      <span>Days without pay:</span>
                                                                      <span className="font-semibold text-orange-700">{balanceInfo.requestedDays - balanceInfo.availableBalance} days</span>
                                                                  </div>
                                                              </div>
                                                          </div>
                                                      ) : (
                                                          <div>Your request will be automatically split between paid and unpaid days.</div>
                                                      )}
                                                  </div>
                                              </div>
                                          ) : (
                                              <div className="md:col-span-2 mt-2 p-3 bg-green-100 border border-green-200 rounded text-green-800">
                                                  <div className="font-medium">✅ Full Pay Leave</div>
                                                  <div className="mt-1">
                                                      Your leave will be fully paid.
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          )}

                          {/* Form Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <DateInput
                                  label="Date From"
                                  value={data.date_from}
                                  onChange={(value) => setData('date_from', value)}
                                  disabledDates={existingRequests || []}
                                  error={errors.date_from}
                                  helperText={existingRequests && existingRequests.length > 0 ? "Conflicting dates are disabled" : ""}
                                  allowPastDates={allowPastDates}
                              />

                              <DateInput
                                  label="Date To"
                                  value={data.date_to}
                                  onChange={(value) => setData('date_to', value)}
                                  disabledDates={existingRequests || []}
                                  error={errors.date_to}
                                  helperText="Must be after or equal to start date"
                                  allowPastDates={allowPastDates}
                              />
                          </div>

                          <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                              <textarea
                                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  rows="4"
                                  value={data.reason}
                                  onChange={(e) => setData('reason', e.target.value)}
                                  placeholder="Please provide a detailed reason for your leave request..."
                              />
                              {errors.reason && <div className="text-xs text-rose-600 mt-1">{errors.reason}</div>}
                          </div>

                          {specificFields.length > 0 && (
                              <div className="mb-6">
                                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {specificFields.map((f) => (
                                          <div key={f.name}>
                                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                                  {f.label}
                                                  {f.required && <span className="text-rose-500 ml-1">*</span>}
                                              </label>
                                              {f.type === 'select' ? (
                                                  <select
                                                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                                                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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

                          <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Attachment {isDocumentRequired && <span className="text-rose-500">*</span>}
                              </label>
                              <div className="flex items-center justify-center w-full">
                                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                          <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                          </svg>
                                          <p className="mb-2 text-sm text-gray-500">
                                              <span className="font-semibold">Click to upload</span> or drag and drop
                                          </p>
                                          <p className="text-xs text-gray-500">JPEG, PNG, PDF, DOC (Max. 10MB)</p>
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
                              {isDocumentRequired ? (
                                  <div className="mt-2 text-sm text-rose-600 flex items-center">
                                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                      </svg>
                                      Medical certificate is required for sick leaves exceeding 5 days
                                  </div>
                              ) : selectedType?.code.toUpperCase() === 'SL' && workingDays > 0 ? (
                                  <div className="mt-2 text-sm text-gray-500">
                                      Medical certificate is optional for sick leaves of 1-5 days
                                  </div>
                              ) : errors.attachment ? (
                                  <div className="mt-2 text-sm text-rose-600">{errors.attachment}</div>
                              ) : (
                                  <div className="mt-2 text-sm text-gray-500">
                                      Supporting document - Optional
                                  </div>
                              )}
                          </div>

                          {/* Submit Button */}
                          <div className="flex justify-end pt-4 border-t border-gray-200">
                              <button
                                  type="submit"
                                  disabled={processing || (balanceInfo && balanceInfo.exceedsLimit)}
                                  className={`
                                      px-6 py-3 rounded-lg font-medium text-white transition-all duration-200
                                      ${processing || (balanceInfo && balanceInfo.exceedsLimit)
                                          ? 'bg-gray-400 cursor-not-allowed'
                                          : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md'
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
                  </form>
              )}
          </div>
      </EmployeeLayout>
  );
}


