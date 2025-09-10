import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { useForm, usePage, router } from '@inertiajs/react';
import { useMemo, useState, useRef, useEffect } from 'react';

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

// Custom Date Input Component
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
      <label className="block text-sm text-gray-600">{label}</label>
      <div className="relative">
        <input
          type="text"
          className="mt-1 w-full border rounded p-2 cursor-pointer bg-white"
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
        <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-3 border-b">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin='round' strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-medium">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin='round' strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center">{day}</div>
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
                      h-8 w-8 text-sm rounded flex items-center justify-center
                      ${isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-blue-100 cursor-pointer'
                      }
                      ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                      ${isToday && !isSelected ? 'bg-blue-100 text-blue-600' : ''}
                      ${!day.isCurrentMonth ? 'text-gray-300' : ''}
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

      {error && <div className="text-xs text-rose-600 mt-1">{error}</div>}
      {helperText && <div className="text-xs text-gray-500 mt-1">{helperText}</div>}
    </div>
  );
};

export default function RequestLeave() {
  const { props } = usePage();
  const { leaveTypes, flash, existingRequests, leaveCredits, errors } = props;

  const [selectedTypeId, setSelectedTypeId] = useState(null);
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

  // Calculate working days for sick leave validation
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

  // Calculate balance information
  const balanceInfo = useMemo(() => {
    if (!selectedType) return null;

    const code = selectedType.code.toUpperCase();

    // Only show balance for SL and VL
    if (code !== 'SL' && code !== 'VL') return null;

    const availableBalance = code === 'SL' ? (leaveCredits?.sl || 0) : (leaveCredits?.vl || 0);
    const requestedDays = workingDays;

    // Only count whole days for paid leave (floor the available balance)
    const wholeDaysAvailable = Math.floor(availableBalance);

    const isInsufficient = requestedDays > wholeDaysAvailable;
    const daysWithPay = Math.min(wholeDaysAvailable, requestedDays);
    const daysWithoutPay = Math.max(0, requestedDays - daysWithPay);

    return {
      availableBalance,
      wholeDaysAvailable,
      requestedDays,
      isInsufficient,
      daysWithPay,
      daysWithoutPay
    };
  }, [selectedType, leaveCredits, workingDays]);

  const submit = (e) => {
    e.preventDefault();

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
        router.visit('/employee/my-leave-requests', {
          data: { success: 'Leave request submitted successfully!' }
        });
      },
      onError: (errors) => {
        console.error('Validation errors:', errors);
      },
    });
  };

  const handleSelectType = (lt) => {
    setSelectedTypeId(lt.id);
    setData('leave_type_id', lt.id);
  };

  return (
    <EmployeeLayout>
      <h1 className="text-2xl font-bold">Request a Leave</h1>

      {flash?.success && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {flash.success}
        </div>
      )}

      {/* Leave Type Cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaveTypes?.map((lt) => (
          <button
            key={lt.id}
            type="button"
            onClick={() => handleSelectType(lt)}
            className={`p-4 rounded border text-left ${selectedTypeId === lt.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
          >
            <div className="text-sm text-gray-500">{lt.code}</div>
            <div className="text-lg font-semibold">{lt.name}</div>
            {lt.document_required && <div className="mt-1 text-xs text-rose-600">Document required</div>}
          </button>
        ))}
      </div>

      {/* Dynamic Form */}
      {selectedType && (
        <form onSubmit={submit} className="mt-8 space-y-4" encType="multipart/form-data">
          {errors.leave_type_id && <div className="text-xs text-rose-600">{errors.leave_type_id}</div>}
          <input type="hidden" name="leave_type_id" value={data.leave_type_id} />

          {/* Server-side validation errors */}
          {errors.balance && (
            <div className="p-4 bg-rose-100 border border-rose-200 rounded-lg">
              <div className="text-sm text-rose-700">{errors.balance}</div>
            </div>
          )}

          {/* Date Selection Notice */}
          {selectedType && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-700">
                <strong>Date Selection Rules:</strong>
                <ul className="mt-1 list-disc list-inside">
                  <li>
                    {selectedType.code.toUpperCase() === 'SL'
                      ? 'Sick Leave: Past and future dates are allowed'
                      : `${selectedType.code}: Only current and future dates are allowed`
                    }
                  </li>
                  {selectedType.code.toUpperCase() === 'SL' && (
                    <li>Medical certificate is {workingDays > 5 ? 'required' : 'optional'} for {workingDays} days</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Sick Leave Information */}
          {selectedType.code.toUpperCase() === 'SL' && data.date_from && data.date_to && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <div className="font-semibold">Sick Leave Information</div>
                <div className="mt-1">
                  Duration: <strong>{workingDays} working days</strong>
                </div>
                {isDocumentRequired ? (
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-200 rounded text-yellow-800">
                    <div className="font-medium">📋 Medical Certificate Required</div>
                    <div className="mt-1">
                      A medical certificate is mandatory for sick leaves exceeding 5 days.
                    </div>
                  </div>
                ) : workingDays > 0 ? (
                  <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded text-green-800">
                    <div className="font-medium">📄 Document Optional</div>
                    <div className="mt-1">
                      Medical certificate is optional for sick leaves of 1-5 days.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Balance Information for SL/VL */}
          {['SL', 'VL'].includes(selectedType?.code.toUpperCase()) && balanceInfo && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <div className="font-semibold">Leave Balance Information</div>
                <div className="mt-1">
                  Your current <strong>{selectedType.code}</strong> balance:
                  <strong> {balanceInfo.availableBalance} days</strong>
                  {balanceInfo.availableBalance !== balanceInfo.wholeDaysAvailable && (
                    <span className="text-sm text-gray-600 ml-1">
                      ({balanceInfo.wholeDaysAvailable} whole days available for paid leave)
                    </span>
                  )}
                </div>
                {data.date_from && data.date_to && (
                  <>
                    <div className="mt-1">
                      Requested working days: <strong>{balanceInfo.requestedDays} days</strong>
                    </div>
                    {balanceInfo.isInsufficient ? (
                      <div className="mt-2 p-2 bg-yellow-100 border border-yellow-200 rounded text-yellow-800">
                        <div className="font-medium">Partial Leave Notice</div>
                        <div className="mt-1">
                          Your request will be automatically split (only whole days count for paid leave):
                        </div>
                        <div>• Days with pay: {balanceInfo.daysWithPay} days</div>
                        <div>• Days without pay: {balanceInfo.daysWithoutPay} days</div>
                        {balanceInfo.availableBalance > balanceInfo.wholeDaysAvailable && (
                          <div className="mt-1 text-xs">
                            Note: {balanceInfo.availableBalance - balanceInfo.wholeDaysAvailable} days of fractional credits cannot be used for paid leave
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded text-green-800">
                        <div className="font-medium">Full Pay Leave</div>
                        <div className="mt-1">
                          Your leave will be fully paid: {balanceInfo.requestedDays} days with pay
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-sm text-gray-600">Reason</label>
            <textarea
              className="mt-1 w-full border rounded p-2"
              rows="3"
              value={data.reason}
              onChange={(e) => setData('reason', e.target.value)}
              placeholder="Please provide a detailed reason for your leave request"
            />
            {errors.reason && <div className="text-xs text-rose-600 mt-1">{errors.reason}</div>}
          </div>

          {specificFields.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specificFields.map((f) => (
                <div key={f.name}>
                  <label className="block text-sm text-gray-600">{f.label}</label>
                  {f.type === 'select' ? (
                    <select
                      className="mt-1 w-full border rounded p-2"
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
                      className="mt-1 w-full border rounded p-2"
                      value={data[f.name] || ''}
                      onChange={(e) => setData(f.name, e.target.value)}
                      required={f.required}
                      placeholder={f.required ? `Enter ${f.label}` : `${f.label} (Optional)`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600">
              Attachment {isDocumentRequired && <span className="text-rose-600">*</span>}
              {!isDocumentRequired && selectedType?.code.toUpperCase() === 'SL' && workingDays > 0 && (
                <span className="text-gray-500"> (Optional)</span>
              )}
            </label>
            <input
              type="file"
              className="mt-1 w-full border rounded p-2"
              onChange={(e) => setData('attachment', e.target.files[0])}
              accept="image/*,application/pdf,.doc,.docx"
              required={isDocumentRequired}
            />
            {isDocumentRequired ? (
              <div className="text-xs text-rose-600 mt-1">
                📋 Medical certificate is required for sick leaves exceeding 5 days
              </div>
            ) : selectedType?.code.toUpperCase() === 'SL' && workingDays > 0 ? (
              <div className="text-xs text-gray-500 mt-1">
                📄 Medical certificate is optional for sick leaves of 1-5 days (JPEG, PNG, PDF, DOC accepted)
              </div>
            ) : errors.attachment ? (
              <div className="text-xs text-rose-600 mt-1">{errors.attachment}</div>
            ) : (
              <div className="text-xs text-gray-500 mt-1">
                Supporting document (JPEG, PNG, PDF, DOC) - Optional
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={processing}
              className={`px-4 py-2 text-white rounded ${
                processing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {processing ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      )}
    </EmployeeLayout>
  );
}
