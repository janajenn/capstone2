import { useState, useRef, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';

const LeaveRecallModal = ({ isOpen, onClose, leaveRequest, employee }) => {
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const datePickerRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        leave_request_id: leaveRequest?.id || '',
        employee_id: employee?.employee_id || '',
        approved_leave_date: leaveRequest?.date_from || '',
        new_leave_date_from: '',
        new_leave_date_to: '',
        reason_for_change: ''
    });

    // Close date picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setIsDatePickerOpen(false);
            }
        };

        if (isDatePickerOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDatePickerOpen]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen && leaveRequest && employee) {
            setData({
                leave_request_id: leaveRequest.id,
                employee_id: employee.employee_id,
                approved_leave_date: leaveRequest.date_from,
                new_leave_date_from: '',
                new_leave_date_to: '',
                reason_for_change: ''
            });
        } else if (!isOpen) {
            reset();
        }
    }, [isOpen, leaveRequest, employee]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        post(route('employee.leave-recalls.store'), {
            onSuccess: () => {
                onClose();
                reset();
            }
        });
    };

    const handleClose = () => {
        onClose();
        reset();
    };

    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = firstDay.getDay();
        const daysInMonth = lastDay.getDate();
        
        const days = [];
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startDate; i++) {
            days.push(null);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === new Date().toDateString();
            const dateString = date.toISOString().split('T')[0];
            const isPast = date < new Date();
            
            // Check if this date is in the selected range
            let isSelected = false;
            let isInRange = false;
            
            if (data.new_leave_date_from && dateString === data.new_leave_date_from) {
                isSelected = true;
            } else if (data.new_leave_date_to && dateString === data.new_leave_date_to) {
                isSelected = true;
            } else if (data.new_leave_date_from && data.new_leave_date_to) {
                isInRange = dateString > data.new_leave_date_from && dateString < data.new_leave_date_to;
            }
            
            days.push({
                day,
                date,
                isToday,
                isSelected,
                isInRange,
                isPast
            });
        }
        
        return days;
    };

    const selectDate = (date) => {
        if (date < new Date()) return; // Don't allow past dates
        
        const dateString = date.toISOString().split('T')[0];
        
        // If no start date is selected, set it as start date
        if (!data.new_leave_date_from) {
            setData('new_leave_date_from', dateString);
        } 
        // If start date is selected but no end date, set it as end date
        else if (!data.new_leave_date_to) {
            // If selected date is before start date, swap them
            if (dateString < data.new_leave_date_from) {
                setData('new_leave_date_to', data.new_leave_date_from);
                setData('new_leave_date_from', dateString);
            } else {
                setData('new_leave_date_to', dateString);
            }
            setIsDatePickerOpen(false);
        } 
        // If both dates are selected, reset and start over
        else {
            setData('new_leave_date_from', dateString);
            setData('new_leave_date_to', '');
        }
    };

    const navigateMonth = (direction) => {
        setCurrentMonth(prev => {
            const newMonth = new Date(prev);
            newMonth.setMonth(prev.getMonth() + direction);
            return newMonth;
        });
    };

    const clearDateSelection = () => {
        setData('new_leave_date_from', '');
        setData('new_leave_date_to', '');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    {/* Background overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                        onClick={handleClose}
                    />

                    {/* Modal panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10"
                    >
                        <form onSubmit={handleSubmit}>
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                            Recall Leave Request
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            {/* Employee Info */}
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={`${employee?.firstname || ''} ${employee?.middlename || ''} ${employee?.lastname || ''}`.trim()}
                                                        readOnly
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Department</label>
                                                    <input
                                                        type="text"
                                                        value={employee?.department?.name || 'N/A'}
                                                        readOnly
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                                    <input
                                                        type="text"
                                                        value={employee?.contact_number || 'N/A'}
                                                        readOnly
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Approved Leave Date</label>
                                                    <input
                                                        type="text"
                                                        value={leaveRequest ? new Date(leaveRequest.date_from).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        }) : ''}
                                                        readOnly
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* New Leave Date Range */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    New Leave Date Range <span className="text-red-500">*</span>
                                                </label>
                                                <div className="mt-1 relative">
                                                    <input
                                                        type="text"
                                                        value={
                                                            data.new_leave_date_from && data.new_leave_date_to
                                                                ? `${new Date(data.new_leave_date_from).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })} - ${new Date(data.new_leave_date_to).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}`
                                                                : data.new_leave_date_from
                                                                ? `${new Date(data.new_leave_date_from).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })} - Select end date`
                                                                : ''
                                                        }
                                                        onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                                        readOnly
                                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                                        placeholder="Select new leave date range"
                                                    />
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    
                                                    {(errors.new_leave_date_from || errors.new_leave_date_to) && (
                                                        <p className="mt-1 text-sm text-red-600">
                                                            {errors.new_leave_date_from || errors.new_leave_date_to}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Date Picker */}
                                                {isDatePickerOpen && (
                                                    <div ref={datePickerRef} className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                                                        <div className="p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => navigateMonth(-1)}
                                                                    className="p-1 hover:bg-gray-100 rounded"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                                    </svg>
                                                                </button>
                                                                <h3 className="text-sm font-medium text-gray-900">
                                                                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                                </h3>
                                                                <div className="flex items-center space-x-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={clearDateSelection}
                                                                        className="p-1 hover:bg-gray-100 rounded text-xs text-gray-500"
                                                                        title="Clear selection"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => navigateMonth(1)}
                                                                        className="p-1 hover:bg-gray-100 rounded"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-7 gap-1 text-xs text-center text-gray-500 mb-1">
                                                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                                                    <div key={day} className="p-1">{day}</div>
                                                                ))}
                                                            </div>
                                                            <div className="grid grid-cols-7 gap-1">
                                                                {generateCalendarDays().map((dayData, index) => (
                                                                    <button
                                                                        key={index}
                                                                        type="button"
                                                                        onClick={() => dayData && selectDate(dayData.date)}
                                                                        disabled={!dayData || dayData.isPast}
                                                                        className={`p-1 text-xs rounded hover:bg-blue-100 ${
                                                                            dayData?.isSelected ? 'bg-blue-500 text-white' :
                                                                            dayData?.isInRange ? 'bg-blue-200 text-blue-800' :
                                                                            dayData?.isToday ? 'bg-blue-100 text-blue-600' :
                                                                            dayData?.isPast ? 'text-gray-300 cursor-not-allowed' :
                                                                            'text-gray-700 hover:bg-blue-50'
                                                                        }`}
                                                                    >
                                                                        {dayData?.day || ''}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Reason for Change */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Reason for Change <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    value={data.reason_for_change}
                                                    onChange={(e) => setData('reason_for_change', e.target.value)}
                                                    rows={3}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Please explain why you need to change your leave date..."
                                                />
                                                {errors.reason_for_change && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.reason_for_change}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {processing ? 'Submitting...' : 'Submit Recall Request'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
};

export default LeaveRecallModal;
