import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { 
    Calendar, 
    Clock, 
    User, 
    TrendingUp, 
    AlertCircle, 
    CheckCircle, 
    XCircle,
    ChevronLeft,
    Filter,
    AlertTriangle,
    Download,
    FileText,
    Eye,
    Bell,
    Search
} from 'lucide-react';
import Swal from 'sweetalert2'; 

// Simple Select component
const Select = ({ id, value, onChange, options = [], className = '' }) => {
    return (
        <select
            id={id}
            value={value}
            onChange={onChange}
            className={`border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm w-full ${className}`}
        >
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
    const statusConfig = {
        'Present': {
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            icon: CheckCircle,
        },
        'Late': {
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-200',
            icon: Clock,
        },
        'Absent': {
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            icon: XCircle,
        },
        'Rest Day': {
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
            icon: Calendar,
        },
        'No Time Records': {
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-800',
            borderColor: 'border-gray-200',
            icon: AlertCircle,
        },
    };

    const config = statusConfig[status] || statusConfig['No Time Records'];
    const IconComponent = config.icon;

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
            <IconComponent className="w-3 h-3 mr-1" />
            {status}
        </span>
    );
};

// Correction Review Modal Component
const CorrectionReviewModal = ({ correction, onClose, onApprove, onReject }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [remarks, setRemarks] = useState('');

    const handleApprove = async () => {
        const result = await Swal.fire({
            title: 'Approve this correction?',
            text: 'This request will be marked as approved and ready for manual update.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Approve',
            confirmButtonColor: '#10B981',
            cancelButtonText: 'Cancel',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl shadow-2xl border border-gray-200'
            }
        });

        if (result.isConfirmed) {
            setIsSubmitting(true);
            await onApprove(remarks);
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        const { value: rejectionReason } = await Swal.fire({
            title: 'Reject Correction Request?',
            input: 'textarea',
            inputLabel: 'Reason for rejection',
            inputPlaceholder: 'Provide reason here...',
            inputAttributes: {
                'aria-label': 'Type your rejection reason here'
            },
            showCancelButton: true,
            confirmButtonText: 'Reject',
            confirmButtonColor: '#EF4444',
            cancelButtonText: 'Cancel',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl shadow-2xl border border-gray-200'
            },
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to provide a reason for rejection!';
                }
            }
        });

        if (rejectionReason) {
            setIsSubmitting(true);
            await onReject(rejectionReason);
            setIsSubmitting(false);
        }
    };

    const handleViewProof = () => {
        if (correction.log_data.correction_proof_image) {
            // ✅ Use the correct HR route
            const proofUrl = route('hr.attendance-corrections.view-proof', { 
                id: correction.log_data.correction_request_id 
            });
            console.log('Proof URL:', proofUrl); // Debug log
            window.open(proofUrl, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Review Correction Request</h2>
                            <p className="text-blue-100 mt-1">
                                Review attendance correction details and take action
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-blue-200 transition-colors"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Employee & Request Info */}
                        <div className="space-y-6">
                            {/* Employee Information */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <User className="w-5 h-5 mr-2" />
                                    Employee Information
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Employee Name</label>
                                        <p className="text-gray-900 font-medium">
                                            {correction.log_data.correction_employee_name}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Department</label>
                                        <p className="text-gray-900">
                                            {correction.log_data.correction_department}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Date */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Attendance Date
                                </h3>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900 mb-1">
                                        {new Date(correction.date).getDate()}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {new Date(correction.date).toLocaleDateString('en-US', {
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {correction.day_of_week}
                                    </div>
                                </div>
                            </div>

                            {/* Current Attendance Data */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                    Current Attendance Data
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Time In:</span>
                                        <span className="font-medium">{correction.log_data.time_in || 'No time in'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Time Out:</span>
                                        <span className="font-medium">{correction.log_data.time_out || 'No time out'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Hours Worked:</span>
                                        <span className="font-medium">
                                            {correction.log_data.hrs_worked_formatted}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Status:</span>
                                        <span className={`font-medium ${
                                            correction.log_data.status === 'Late' ? 'text-yellow-600' :
                                            correction.log_data.status === 'Absent' ? 'text-red-600' :
                                            'text-green-600'
                                        }`}>
                                            {correction.log_data.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Correction Details */}
                        <div className="space-y-6">
                            {/* Explanation */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <FileText className="w-5 h-5 mr-2" />
                                    Employee Explanation
                                </h3>
                                <div className="p-3 bg-white rounded-lg border border-gray-200">
                                    <p className="text-gray-900 whitespace-pre-wrap">
                                        {correction.log_data.correction_explanation}
                                    </p>
                                </div>
                            </div>

                            {/* Department Head Remarks */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                    Department Head Remarks
                                </h3>
                                <div className="p-3 bg-white rounded-lg border border-gray-200">
                                    <p className="text-gray-900">
                                        {correction.log_data.correction_remarks || 'No additional remarks provided.'}
                                    </p>
                                </div>
                            </div>

                            {/* Proof Image */}
                            {correction.log_data.correction_proof_image && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                        <Eye className="w-5 h-5 mr-2" />
                                        Proof Image
                                    </h3>
                                    <button
                                        onClick={handleViewProof}
                                        className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Proof Image
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={isSubmitting}
                            className="flex items-center px-6 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                        >
                            <XCircle className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Processing...' : 'Reject Request'}
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={isSubmitting}
                            className="flex items-center px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Processing...' : 'Approve Request'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function EmployeeAttendanceLogs({ auth, employee, attendanceLogs, summary, filters, correctionStats }) {
    const [selectedMonth, setSelectedMonth] = useState(filters.month);
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period);
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({
        start_date: filters.start_date || '',
        end_date: filters.end_date || ''
    });
    const [advancedFilters, setAdvancedFilters] = useState({
        attendance_issue: filters.attendance_issue || '',
        late_threshold: filters.late_threshold || 10,
        hours_threshold: filters.hours_threshold || 8,
    });

    // NEW STATE FOR CORRECTION REQUESTS
    const [showCorrectionRequests, setShowCorrectionRequests] = useState(false);
    const [selectedCorrection, setSelectedCorrection] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    

    // Initialize filters from props
    useEffect(() => {
        setSelectedMonth(filters.month);
        setSelectedPeriod(filters.period);
        setDateRange({
            start_date: filters.start_date || '',
            end_date: filters.end_date || ''
        });
        setAdvancedFilters({
            attendance_issue: filters.attendance_issue || '',
            late_threshold: filters.late_threshold || 10,
            hours_threshold: filters.hours_threshold || 8,
        });
    }, [filters]);

    // NEW: Filter logs to show only correction requests when toggled
    const filteredLogs = showCorrectionRequests 
        ? attendanceLogs.filter(log => 
            log.has_log && 
            log.log_data && 
            log.log_data.correction_status === 'Reviewed'
          )
        : attendanceLogs;

    // NEW: Handle correction request toggle
    const handleCorrectionRequestsToggle = () => {
        setShowCorrectionRequests(!showCorrectionRequests);
    };

    // NEW: Open correction review modal
    const handleReviewCorrection = (log) => {
        if (log.has_log && log.log_data && log.log_data.correction_status === 'Reviewed') {
            setSelectedCorrection(log);
            setIsReviewModalOpen(true);
        }
    };

    // NEW: Close correction review modal
    const handleCloseReviewModal = () => {
        setIsReviewModalOpen(false);
        setSelectedCorrection(null);
    };

    const handleFilterChange = () => {
        // Build complete params object
        const params = {};
        
        // Add month/period if they have values
        if (selectedMonth) params.month = selectedMonth;
        if (selectedPeriod) params.period = selectedPeriod;
        
        // Add date range if provided
        if (dateRange.start_date) params.start_date = dateRange.start_date;
        if (dateRange.end_date) params.end_date = dateRange.end_date;
        
        // Add advanced filters if provided
        if (advancedFilters.attendance_issue) params.attendance_issue = advancedFilters.attendance_issue;
        if (advancedFilters.late_threshold) params.late_threshold = advancedFilters.late_threshold;
        if (advancedFilters.hours_threshold) params.hours_threshold = advancedFilters.hours_threshold;
    
        console.log('🚀 Sending request with:', params);
    
        router.get(`/hr/attendance/logs/employee/${employee.employee_id}`, params, {
            preserveState: true,
            replace: true
        });
    };

    const handleDateRangeChange = (key, value) => {
        setDateRange(prev => ({ ...prev, [key]: value }));
    };

    const handleAdvancedFilterChange = (key, value) => {
        setAdvancedFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleMonthChange = (month) => {
        setSelectedMonth(month);
        // Clear date range when month changes
        setDateRange({ start_date: '', end_date: '' });
    };

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        // Clear date range when period changes
        setDateRange({ start_date: '', end_date: '' });
    };

    const clearAllFilters = () => {
        setDateRange({ start_date: '', end_date: '' });
        setAdvancedFilters({
            attendance_issue: '',
            late_threshold: 10,
            hours_threshold: 8,
        });
        setSelectedMonth(filters.available_months?.[0] || new Date().toISOString().slice(0, 7));
        setSelectedPeriod('full');
        setShowCorrectionRequests(false);
    };

    const clearDateRange = () => {
        setDateRange({ start_date: '', end_date: '' });
    };

    const clearAdvancedFilters = () => {
        setAdvancedFilters({
            attendance_issue: '',
            late_threshold: 10,
            hours_threshold: 8,
        });
    };

    // Helper function to render break time
    const renderBreakTime = (logData) => {
        if (!logData) {
            return <span className="text-gray-400">-</span>;
        }

        // Check break data status
        const hasBreakStart = logData.break_start && 
                             logData.break_start !== 'No break' && 
                             logData.break_start !== 'null' && 
                             logData.break_start.trim() !== '';

        const hasBreakEnd = logData.break_end && 
                           logData.break_end !== 'No break' && 
                           logData.break_end !== 'null' && 
                           logData.break_end.trim() !== '';

        const breakStatus = !hasBreakStart && !hasBreakEnd ? 'missing_both' :
                           !hasBreakStart && hasBreakEnd ? 'missing_start' :
                           hasBreakStart && !hasBreakEnd ? 'missing_end' : 'complete';

        // Calculate actual break duration if possible
        const calculateBreakDuration = (start, end) => {
            if (!start || !end) return null;
            
            try {
                let s = start.includes('T') ? start.split('T')[1].substring(0, 5) : start;
                let e = end.includes('T') ? end.split('T')[1].substring(0, 5) : end;
                
                const [sh, sm] = s.split(':').map(Number);
                const [eh, em] = e.split(':').map(Number);
                
                let minutes = (eh * 60 + em) - (sh * 60 + sm);
                if (minutes < 0) minutes += 24 * 60;
                
                return minutes;
            } catch (error) {
                return null;
            }
        };

        const actualBreakMinutes = calculateBreakDuration(logData.break_start, logData.break_end);
        
        // Format break time display
        const formatTime = (timeString) => {
            if (!timeString) return null;
            let time = timeString.includes('T') ? timeString.split('T')[1].substring(0, 5) : timeString;
            if (time.match(/^\d{1,2}:\d{2}$/)) {
                const [h, m] = time.split(':').map(Number);
                const period = h >= 12 ? 'PM' : 'AM';
                const twelveHour = h % 12 || 12;
                return `${twelveHour}:${m.toString().padStart(2, '0')} ${period}`;
            }
            return time;
        };

        const displayStart = formatTime(logData.break_start);
        const displayEnd = formatTime(logData.break_end);

        // Generate display text based on break status
        let displayText = '';
        let warningLevel = 'none';
        let warningMessage = '';

        switch (breakStatus) {
            case 'complete':
                displayText = `${displayStart} - ${displayEnd}`;
                warningLevel = actualBreakMinutes < 5 ? 'warning' : 'none';
                warningMessage = actualBreakMinutes < 5 ? 'Very short break recorded' : '';
                break;
                
            case 'missing_start':
                displayText = `⚠ Missing Start - ${displayEnd}`;
                warningLevel = 'error';
                warningMessage = 'Break start time is missing';
                break;
                
            case 'missing_end':
                displayText = `${displayStart} - ⚠ Missing End`;
                warningLevel = 'error';
                warningMessage = 'Break end time is missing';
                break;
                
            case 'missing_both':
                displayText = '⚠ No Break Data';
                warningLevel = 'warning';
                warningMessage = 'Using default 1-hour break deduction';
                break;
        }

        // Format duration for badge
        const formatDuration = (minutes) => {
            if (!minutes) return '1h*'; // Default when unknown
            if (minutes < 60) return `${minutes}m`;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        };

        const breakText = formatDuration(actualBreakMinutes);

        // Badge styling based on break status
        const getBadgeStyle = (status, minutes) => {
            if (status === 'missing_start' || status === 'missing_end') {
                return 'bg-red-100 text-red-800 border-red-300';
            }
            if (status === 'missing_both') {
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            }
            if (!minutes || minutes < 5) {
                return 'bg-orange-100 text-orange-800 border-orange-300';
            }
            if (minutes <= 60) {
                return 'bg-green-100 text-green-800 border-green-300';
            }
            if (minutes <= 90) {
                return 'bg-blue-100 text-blue-800 border-blue-300';
            }
            return 'bg-purple-100 text-purple-800 border-purple-300';
        };

        const badgeStyle = getBadgeStyle(breakStatus, actualBreakMinutes);

        return (
            <div className="group relative flex items-center justify-between">
                <div className="flex-1 mr-2">
                    <div className={`text-sm ${
                        warningLevel === 'error' ? 'text-red-700 font-medium' : 
                        warningLevel === 'warning' ? 'text-yellow-700' : 'text-gray-700'
                    }`}>
                        {displayText}
                    </div>
                    {warningMessage && (
                        <div className="text-xs text-gray-500 mt-1">
                            {warningMessage}
                        </div>
                    )}
                </div>
                
                <div className="relative">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${badgeStyle}`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {breakText}
                        {(breakStatus === 'missing_both' || breakStatus === 'missing_start' || breakStatus === 'missing_end') && (
                            <span className="ml-1">*</span>
                        )}
                    </span>
                    
                    {/* Detailed tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 max-w-xs">
                        <div className="font-medium mb-1">Break Information</div>
                        <div>Status: {breakStatus.replace('_', ' ')}</div>
                        {actualBreakMinutes && (
                            <div>Recorded: {actualBreakMinutes} minutes</div>
                        )}
                        <div>Applied: {breakStatus === 'missing_both' ? '1h default' : 'calculated'}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                </div>
            </div>
        );
    };

    // Helper function to format hours worked
    const formatHoursWorked = (hoursWorkedFormatted, hrsWorkedMinutes) => {
        // If the backend already formatted it according to new rules, use that
        if (hoursWorkedFormatted) {
            return hoursWorkedFormatted;
        }
        
        // Fallback: apply the same logic in frontend
        if (!hrsWorkedMinutes || hrsWorkedMinutes <= 0) {
            return '0';
        }
        
        const hours = hrsWorkedMinutes / 60;
        
        if (hours >= 8) {
            return '8';
        }
        
        const wholeHours = Math.floor(hours);
        const remainingMinutes = hrsWorkedMinutes % 60;
        
        if (wholeHours > 0 && remainingMinutes > 0) {
            return `${wholeHours}h ${remainingMinutes}m`;
        } else if (wholeHours > 0) {
            return `${wholeHours}h`;
        } else {
            return `${remainingMinutes}m`;
        }
    };

    // Attendance issue options
    const attendanceIssueOptions = [
        { value: '', label: 'All Records' },
        { value: 'late', label: 'Late Records' },
        { value: 'missing_time_out', label: 'Missing Time Out' },
        { value: 'missing_time_in', label: 'Missing Time In' },
        { value: 'absent', label: 'Absent Days' },
        { value: 'insufficient_hours', label: 'Insufficient Hours' },
    ];

    // Period options
    const periodOptions = [
        { value: 'full', label: 'Full Month' },
        { value: 'first_half', label: 'First Half (1-15)' },
        { value: 'second_half', label: 'Second Half (16-End)' },
    ];

    // Calculate employee issues
    const calculateEmployeeIssues = () => {
        const issues = {
            hasLatesThisMonth: false,
            hasMissingTimeIn: false,
            hasMissingTimeOut: false,
            lateCount: 0,
            hasMultipleLates: false
        };

        if (!attendanceLogs || !Array.isArray(attendanceLogs)) return issues;

        attendanceLogs.forEach(day => {
            if (day.has_log && day.log_data) {
                // Check for late status
                if (day.log_data.status === 'Late') {
                    issues.lateCount++;
                    issues.hasLatesThisMonth = true;
                }

                // Check for missing time in/out
                if (day.log_data.time_in === 'No time in' || !day.log_data.time_in) {
                    issues.hasMissingTimeIn = true;
                }
                if (day.log_data.time_out === 'No time out' || !day.log_data.time_out) {
                    issues.hasMissingTimeOut = true;
                }
            }
        });

        issues.hasMultipleLates = issues.lateCount >= 10;

        return issues;
    };

    const employeeIssues = calculateEmployeeIssues();

    // Check if row should be highlighted
    const shouldHighlightRow = (day) => {
        if (!day.has_log || !day.log_data) return false;

        const isLate = day.log_data.status === 'Late';
        const hasMissingTimeIn = day.log_data.time_in === 'No time in' || !day.log_data.time_in;
        const hasMissingTimeOut = day.log_data.time_out === 'No time out' || !day.log_data.time_out;

        return isLate || hasMissingTimeIn || hasMissingTimeOut;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Present':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'Late':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'Absent':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'Rest Day':
                return <Calendar className="w-4 h-4 text-blue-500" />;
            case 'No Time Records':
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present':
                return 'bg-green-100 text-green-800';
            case 'Late':
                return 'bg-yellow-100 text-yellow-800';
            case 'Absent':
                return 'bg-red-100 text-red-800';
            case 'Rest Day':
                return 'bg-blue-100 text-blue-800';
            case 'No Time Records':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const hasActiveFilters = () => {
        return dateRange.start_date || dateRange.end_date || advancedFilters.attendance_issue || showCorrectionRequests;
    };


    // Add this state to your component
const [editingCell, setEditingCell] = useState(null);
const [editFormData, setEditFormData] = useState({});

// Add this handler for inline editing
const handleCellEdit = (day, field, value) => {
    // Check if this record is approved and has log_data
    const isApproved = day.log_data && day.log_data.correction_status === 'Approved';
    
    if (isApproved) {
        setEditingCell(`${day.date}-${field}`);
        setEditFormData({
            ...editFormData,
            [`${day.date}-${field}`]: value
        });
    }
};

// Add this state to track updated records
const [updatedRecords, setUpdatedRecords] = useState({});

// Enhanced handleSaveEdit with detailed debugging
// FIXED optimistic calculation functions



// Debug helper - only logs for specific date
const debugLog = (date, message, data = {}) => {
    // Only log if it's for the date we're interested in
    if (date === '2025-08-12') { // Change this to the specific date you're testing
        console.log(`🔍 [${date}] ${message}`, data);
    }
};
// Also update the handleSaveEdit to ensure we're passing the right data
const handleSaveEdit = async (day, field) => {
    const value = editFormData[`${day.date}-${field}`];
    
    debugLog(day.date, 'handleSaveEdit called', {
        field: field,
        value: value,
        originalTimeIn: day.log_data?.time_in,
        originalScheduleStart: day.log_data?.schedule_start,
        originalRemarks: day.log_data?.remarks
    });
    
    if (!day.log_data || !day.log_data.id) {
        debugLog(day.date, '❌ Cannot save edit: No valid attendance record ID');
        return;
    }

    try {
        const formData = {
            field: field,
            value: value,
        };

        if (field === 'schedule') {
            formData.schedule_start = editFormData[`${day.date}-schedule_start`];
            formData.schedule_end = editFormData[`${day.date}-schedule_end`];
        }

        if (field === 'break') {
            formData.break_start = editFormData[`${day.date}-break_start`];
            formData.break_end = editFormData[`${day.date}-break_end`];
        }

        debugLog(day.date, 'Sending formData to backend', formData);

        // Enhanced optimistic update for time_in field with debugging
        if (field === 'time_in' && value) {
            debugLog(day.date, 'Performing optimistic update for time_in');
            
            const scheduleStart = day.log_data.schedule_start;
            debugLog(day.date, 'Using schedule start for calculation', { scheduleStart });
            
            const optimisticLateMinutes = calculateOptimisticLateMinutes(day.date, value, scheduleStart);
            const optimisticStatus = calculateOptimisticStatus(day.date, value, scheduleStart);
            const optimisticRemarks = generateOptimisticRemarks(day.date, value, scheduleStart);
            
            debugLog(day.date, 'Optimistic calculation results', {
                newTimeIn: value,
                scheduleStart: scheduleStart,
                calculatedLateMinutes: optimisticLateMinutes,
                calculatedStatus: optimisticStatus,
                calculatedRemarks: optimisticRemarks
            });

            const optimisticUpdate = {
                ...day.log_data,
                [field]: value,
                late_minutes: optimisticLateMinutes,
                status: optimisticStatus,
                remarks: optimisticRemarks
            };

            debugLog(day.date, 'Setting optimistic update', optimisticUpdate);
            
            setUpdatedRecords(prev => ({
                ...prev,
                [day.date]: optimisticUpdate
            }));

            debugLog(day.date, 'Optimistic update applied');
        } else {
            // For other fields, just update the field
            const optimisticUpdate = {
                ...day.log_data,
                [field]: value
            };

            setUpdatedRecords(prev => ({
                ...prev,
                [day.date]: optimisticUpdate
            }));
        }

        setEditingCell(null);
        setEditFormData({});

        debugLog(day.date, 'Sending request to backend');

        // ✅ REPLACE THIS ENTIRE SECTION with the new onSuccess callback:
        router.post(route('hr.attendance.update-field', day.log_data.id), formData, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                debugLog(day.date, 'Backend response received - full page props', {
                    hasAttendanceLogs: !!page.props.attendanceLogs,
                    attendanceLogsCount: page.props.attendanceLogs?.length,
                    allDates: page.props.attendanceLogs?.map(log => log.date)
                });
                
                // Check if the update was reflected in the response
                const updatedLog = page.props.attendanceLogs?.find(log => log.date === day.date);
                if (updatedLog) {
                    debugLog(day.date, 'Updated log from backend - FULL DATA', {
                        log_data: updatedLog.log_data,
                        time_in: updatedLog.log_data?.time_in,
                        late_minutes: updatedLog.log_data?.late_minutes,
                        remarks: updatedLog.log_data?.remarks,
                        status: updatedLog.log_data?.status
                    });
                    
                    // ✅ CRITICAL FIX: Only clear optimistic update if backend data is CORRECT
                    const backendHasCorrectData = updatedLog.log_data?.late_minutes > 0 && 
                                                updatedLog.log_data?.remarks?.includes('Late');
                    
                    if (backendHasCorrectData) {
                        debugLog(day.date, '✅ Backend has correct data - clearing optimistic update');
                        setUpdatedRecords(prev => {
                            const newRecords = { ...prev };
                            delete newRecords[day.date];
                            return newRecords;
                        });
                    } else {
                        debugLog(day.date, '❌ Backend returned incorrect data - KEEPING optimistic update');
                        debugLog(day.date, 'Expected late minutes > 0, but got:', updatedLog.log_data?.late_minutes);
                        debugLog(day.date, 'Expected remarks to include "Late", but got:', updatedLog.log_data?.remarks);
                        // Don't clear optimistic update - keep our correct calculation
                    }
                    
                } else {
                    debugLog(day.date, '❌ Updated log not found in response - keeping optimistic update');
                    // Don't clear optimistic update if backend didn't return updated data
                }
            },
            onError: (errors) => {
                debugLog(day.date, '❌ Backend error', errors);
                // Revert optimistic update on error
                setUpdatedRecords(prev => {
                    const newRecords = { ...prev };
                    delete newRecords[day.date];
                    return newRecords;
                });
                debugLog(day.date, 'Reverted optimistic update due to error');
                alert('Failed to save: ' + (errors.message || 'Unknown error'));
            }
        });

    } catch (error) {
        debugLog(day.date, '💥 Network error', error);
        alert('Network error: ' + error.message);
    }
};
// Add this useEffect to monitor optimistic updates
useEffect(() => {
    debugLog('2025-08-12', 'updatedRecords state changed', {
        hasUpdate: !!updatedRecords['2025-08-12'],
        updateData: updatedRecords['2025-08-12']
    });
}, [updatedRecords]);


// FIXED optimistic calculation functions with targeted debugging
const calculateOptimisticLateMinutes = (date, timeIn, scheduleStart) => {
    if (!timeIn || !scheduleStart) {
        debugLog(date, '⚠️ Missing data for late calculation', { timeIn, scheduleStart });
        return 0;
    }
    
    try {
        debugLog(date, 'Optimistic Late Calculation INPUT', {
            timeIn,
            scheduleStart,
            timeInType: typeof timeIn,
            scheduleStartType: typeof scheduleStart
        });

        // Extract time part if it's a full datetime string
        let timeInTime = timeIn;
        let scheduleTime = scheduleStart;

        // If timeIn is a full datetime like "2025-08-12 08:25:00", extract just the time
        if (timeIn.includes(' ')) {
            timeInTime = timeIn.split(' ')[1]?.substring(0, 5); // Get "08:25"
        } else if (timeIn.includes('T')) {
            timeInTime = timeIn.split('T')[1]?.substring(0, 5); // Get "08:25" from ISO format
        }
        
        // If scheduleStart is a full datetime, extract just the time
        if (scheduleStart.includes(' ')) {
            scheduleTime = scheduleStart.split(' ')[1]?.substring(0, 5); // Get "08:00"
        } else if (scheduleStart.includes('T')) {
            scheduleTime = scheduleStart.split('T')[1]?.substring(0, 5); // Get "08:00" from ISO format
        }

        // Ensure we have HH:MM format
        timeInTime = timeInTime.substring(0, 5);
        scheduleTime = scheduleTime.substring(0, 5);

        debugLog(date, 'Parsed times', {
            timeInTime,
            scheduleTime
        });

        // Create date objects for comparison (using same arbitrary date)
        const timeInDate = new Date(`2000-01-01T${timeInTime}:00`);
        const scheduleDate = new Date(`2000-01-01T${scheduleTime}:00`);

        debugLog(date, 'Date objects created', {
            timeInDate: timeInDate.toString(),
            scheduleDate: scheduleDate.toString(),
            timeInHours: timeInDate.getHours(),
            timeInMinutes: timeInDate.getMinutes(),
            scheduleHours: scheduleDate.getHours(),
            scheduleMinutes: scheduleDate.getMinutes()
        });

        if (timeInDate > scheduleDate) {
            const lateMinutes = Math.round((timeInDate - scheduleDate) / (1000 * 60));
            debugLog(date, '⏰ Late detected', `${lateMinutes} minutes`);
            return lateMinutes;
        }
        
        debugLog(date, '✅ On time or early');
        return 0;
    } catch (error) {
        debugLog(date, '❌ Error in optimistic late calculation', error);
        return 0;   
    }
};

const calculateOptimisticStatus = (date, timeIn, scheduleStart) => {
    const lateMinutes = calculateOptimisticLateMinutes(date, timeIn, scheduleStart);
    const status = lateMinutes > 0 ? 'Late' : 'Present';
    debugLog(date, 'Optimistic status', status);
    return status;
};

const generateOptimisticRemarks = (date, timeIn, scheduleStart) => {
    const lateMinutes = calculateOptimisticLateMinutes(date, timeIn, scheduleStart);
    let remarks;
    
    if (lateMinutes > 0) {
        remarks = `Late by ${lateMinutes} minute${lateMinutes > 1 ? 's' : ''}`;
    } else {
        remarks = 'On Time';
    }
    
    debugLog(date, 'Optimistic remarks', remarks);
    return remarks;
};

// Add debugging to the display data functions
// Add debugging to the display data functions - only for specific date
const getDisplayData = (day, field) => {
    // If this record was updated, use the updated data
    if (updatedRecords[day.date]) {
        const value = updatedRecords[day.date][field];
        debugLog(day.date, `getDisplayData [${field}]: Using UPDATED value`, value);
        return value;
    }
    
    // Otherwise use the original data
    if (day.has_log && day.log_data) {
        const value = day.log_data[field];
        debugLog(day.date, `getDisplayData [${field}]: Using ORIGINAL value`, value);
        return value;
    }
    
    debugLog(day.date, `getDisplayData [${field}]: No data available`);
    return null;
};

const getDisplayStatus = (day) => {
    if (updatedRecords[day.date]) {
        const status = updatedRecords[day.date].status;
        debugLog(day.date, 'getDisplayStatus: Using UPDATED status', status);
        return status;
    }
    
    if (day.has_log && day.log_data) {
        const status = day.log_data.status;
        debugLog(day.date, 'getDisplayStatus: Using ORIGINAL status', status);
        return status;
    }
    
    const status = day.status;
    debugLog(day.date, 'getDisplayStatus: Using DEFAULT status', status);
    return status;
};

const getDisplayRemarks = (day) => {
    if (updatedRecords[day.date]) {
        const remarks = updatedRecords[day.date].remarks;
        debugLog(day.date, 'getDisplayRemarks: Using UPDATED remarks', remarks);
        return remarks;
    }
    
    if (day.has_log && day.log_data) {
        const remarks = day.log_data.remarks;
        debugLog(day.date, 'getDisplayRemarks: Using ORIGINAL remarks', remarks);
        return remarks;
    }
    
    debugLog(day.date, 'getDisplayRemarks: No remarks available');
    return '';
};

// Add useEffect to monitor state changes
useEffect(() => {
    console.log('🔄 updatedRecords state changed:', updatedRecords);
}, [updatedRecords]);

// Add debugging to the cell render
const renderCellWithDebug = (day, field, value) => {
    console.log(`🎯 Rendering cell [${field}] for ${day.date}:`, {
        value: value,
        hasUpdatedRecord: !!updatedRecords[day.date],
        updatedValue: updatedRecords[day.date]?.[field],
        isEditing: editingCell === `${day.date}-${field}`
    });
    return value;
};

// Add this handler to cancel editing
const handleCancelEdit = () => {
    setEditingCell(null);
    setEditFormData({});
};

    return (
        <HRLayout user={auth.user}>
            <Head title={`${employee.firstname} ${employee.lastname} - Attendance Logs`} />

            {/* Correction Review Modal */}
            {isReviewModalOpen && selectedCorrection && (
                <CorrectionReviewModal 
                    correction={selectedCorrection}
                    onClose={handleCloseReviewModal}
                    onApprove={(remarks) => {
                        router.post(route('hr.attendance-corrections.approve', selectedCorrection.log_data.correction_request_id), {
                            remarks
                        }, {
                            preserveScroll: true,
                            onSuccess: () => {
                                handleCloseReviewModal();
                            }
                        });
                    }}
                    onReject={(remarks) => {
                        router.post(route('hr.attendance-corrections.reject', selectedCorrection.log_data.correction_request_id), {
                            remarks
                        }, {
                            preserveScroll: true,
                            onSuccess: () => {
                                handleCloseReviewModal();
                            }
                        });
                    }}
                />
            )}

            <div className="space-y-6">
                {/* Back Button and Filter Controls - UPDATED */}
                <div className="flex items-center justify-between">
                    <Link 
                        href="/hr/attendance/logs"
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Back to Employee Summary
                    </Link>
                    
                    <div className="flex space-x-2">
                        {/* NEW: Correction Requests Button */}
                        <button
                            onClick={handleCorrectionRequestsToggle}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                showCorrectionRequests
                                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Bell className="w-4 h-4" />
                            <span>Correction Requests</span>
                            {correctionStats?.reviewed > 0 && (
                                <span className={`inline-flex items-center justify-center min-w-6 h-6 text-xs font-bold rounded-full ${
                                    showCorrectionRequests
                                        ? 'bg-white text-amber-600'
                                        : 'bg-amber-500 text-white'
                                }`}>
                                    {correctionStats.reviewed}
                                </span>
                            )}
                        </button>

                        <SecondaryButton
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center space-x-2"
                        >
                            <Filter className="w-4 h-4" />
                            <span>Filter</span>
                            {hasActiveFilters() && (
                                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                                    !
                                </span>
                            )}
                        </SecondaryButton>
                        
                        {/* Compare Button */}
                        <SecondaryButton
                            onClick={() => {
                                const url = `/hr/attendance/logs/employee/${employee.employee_id}/compare`;
                                const params = {
                                    month: selectedMonth,
                                    period: selectedPeriod,
                                    start_date: dateRange.start_date,
                                    end_date: dateRange.end_date
                                };

                                router.get(url, params, {
                                    onSuccess: (page) => {
                                        console.log('✅ Request successful:', page);
                                    },
                                    onError: (errors) => {
                                        console.error('❌ Request failed:', errors);
                                    }
                                });
                            }}
                            className="flex items-center space-x-2 bg-purple-600 hover:bg-green-200 text-black-900"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Compare to Raw Logs</span>
                        </SecondaryButton>
                    </div>
                </div>

                {/* NEW: Correction Requests Filter Indicator */}
                {showCorrectionRequests && (
                    <div className="bg-purple-500 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Bell className="w-4 h-4 text-white-600" />
                                <span className="text-sm font-medium text-white-800">
                                    Showing correction requests reviewed by Department Head
                                </span>
                                <span className="text-xs text-white-600 bg-yellow-100 px-2 py-1 rounded-full">
                                    {filteredLogs.length} records
                                </span>
                            </div>
                            <button
                                onClick={() => setShowCorrectionRequests(false)}
                                className="text-sm text-white-600 hover:text-white-800"
                            >
                                Show All Records
                            </button>
                        </div>
                    </div>
                )}

                {/* Employee Info with Issue Indicators */}
                <div className={`bg-white p-6 rounded-lg shadow-sm border ${
                    (employeeIssues.hasLatesThisMonth || 
                     employeeIssues.hasMissingTimeIn || 
                     employeeIssues.hasMissingTimeOut || 
                     employeeIssues.hasMultipleLates) 
                        ? 'border-l-4 border-l-red-500' 
                        : ''
                }`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {employee.firstname} {employee.lastname}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {employee.department} • Employee ID: {employee.employee_id}
                                </p>
                                {employee.biometric_id && (
                                    <p className="text-xs text-gray-500">
                                        Biometric ID: {employee.biometric_id}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Issue Indicators */}
                        {(employeeIssues.hasLatesThisMonth || 
                          employeeIssues.hasMissingTimeIn || 
                          employeeIssues.hasMissingTimeOut || 
                          employeeIssues.hasMultipleLates) && (
                            <div className="flex flex-wrap gap-2">
                                {employeeIssues.hasLatesThisMonth && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Has Late Logs ({employeeIssues.lateCount} times)
                                    </span>
                                )}
                                {employeeIssues.hasMissingTimeIn && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Missing Time In
                                    </span>
                                )}
                                {employeeIssues.hasMissingTimeOut && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Missing Time Out
                                    </span>
                                )}
                                {employeeIssues.hasMultipleLates && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        10+ Late Incidents
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Enhanced Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <Calendar className="w-8 h-8 text-blue-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Working Days</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.working_days}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <Clock className="w-8 h-8 text-green-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Hours Worked</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.total_hours_worked}h</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <XCircle className="w-8 h-8 text-red-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Absent Days</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.absent_days}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <TrendingUp className="w-8 h-8 text-purple-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Avg Hours/Day</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.average_hours_per_day}h</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <AlertTriangle className="w-8 h-8 text-orange-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Late Count</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.late_count}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <Eye className="w-8 h-8 text-indigo-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Showing</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.filtered_count}</p>
                                <p className="text-xs text-gray-500">records</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Filters */}
                {showFilters && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={clearAllFilters}
                                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column - Date Filters */}
                            <div className="space-y-4">
                                <div>
                                    <InputLabel value="Month Selection" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="month" value="Month" />
                                            <Select
                                                id="month"
                                                value={selectedMonth}
                                                onChange={(e) => handleMonthChange(e.target.value)}
                                                options={filters.available_months?.map(month => ({
                                                    value: month,
                                                    label: new Date(month + '-01').toLocaleDateString('en-US', { 
                                                        month: 'long', 
                                                        year: 'numeric' 
                                                    })
                                                })) || []}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="period" value="Period" />
                                            <Select
                                                id="period"
                                                value={selectedPeriod}
                                                onChange={(e) => handlePeriodChange(e.target.value)}
                                                options={periodOptions}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <InputLabel value="Custom Date Range" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="start_date" value="Start Date" />
                                            <TextInput
                                                id="start_date"
                                                type="date"
                                                value={dateRange.start_date}
                                                onChange={(e) => handleDateRangeChange('start_date', e.target.value)}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="end_date" value="End Date" />
                                            <TextInput
                                                id="end_date"
                                                type="date"
                                                value={dateRange.end_date}
                                                onChange={(e) => handleDateRangeChange('end_date', e.target.value)}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                    {(dateRange.start_date || dateRange.end_date) && (
                                        <div className="flex justify-between items-center mt-2">
                                            <p className="text-xs text-gray-500">
                                                Date range: {dateRange.start_date || 'Start'} to {dateRange.end_date || 'End'}
                                            </p>
                                            <button
                                                onClick={clearDateRange}
                                                className="text-xs text-red-600 hover:text-red-800"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Advanced Filters */}
                            <div className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="attendance_issue" value="Attendance Issue" />
                                    <Select
                                        id="attendance_issue"
                                        value={advancedFilters.attendance_issue}
                                        onChange={(e) => handleAdvancedFilterChange('attendance_issue', e.target.value)}
                                        options={attendanceIssueOptions}
                                    />
                                </div>

                                {advancedFilters.attendance_issue === 'insufficient_hours' && (
                                    <div>
                                        <InputLabel htmlFor="hours_threshold" value="Hours Threshold" />
                                        <TextInput
                                            id="hours_threshold"
                                            type="number"
                                            min="1"
                                            max="24"
                                            step="0.5"
                                            value={advancedFilters.hours_threshold}
                                            onChange={(e) => handleAdvancedFilterChange('hours_threshold', e.target.value)}
                                            placeholder="Maximum hours threshold"
                                            className="w-full"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Show records with less than {advancedFilters.hours_threshold} working hours
                                        </p>
                                    </div>
                                )}

                                {advancedFilters.attendance_issue && (
                                    <div className="flex justify-between items-center pt-2">
                                        <p className="text-sm text-gray-600">
                                            Filtering: {attendanceIssueOptions.find(opt => opt.value === advancedFilters.attendance_issue)?.label}
                                        </p>
                                        <button
                                            onClick={clearAdvancedFilters}
                                            className="text-sm text-red-600 hover:text-red-800"
                                        >
                                            Clear Filter
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                            <SecondaryButton onClick={() => setShowFilters(false)}>
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton onClick={handleFilterChange}>
                                Apply Filters
                            </PrimaryButton>
                        </div>
                    </div>
                )}

                {/* Filter Summary */}
                {hasActiveFilters() && !showCorrectionRequests && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Filter className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Active Filters:</span>
                                <div className="flex flex-wrap gap-2">
                                    {dateRange.start_date && dateRange.end_date && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Date Range: {dateRange.start_date} to {dateRange.end_date}
                                        </span>
                                    )}
                                    {advancedFilters.attendance_issue && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {attendanceIssueOptions.find(opt => opt.value === advancedFilters.attendance_issue)?.label}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={clearAllFilters}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                )}

                {/* Attendance Logs Table - UPDATED */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">
                                {showCorrectionRequests ? (
                                    <>Correction Requests - Reviewed by Department Head</>
                                ) : dateRange.start_date || dateRange.end_date ? (
                                    <>
                                        Attendance Records - {dateRange.start_date || 'Start'} to {dateRange.end_date || 'End'}
                                    </>
                                ) : (
                                    <>
                                        Attendance Records - {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
                                            month: 'long', 
                                            year: 'numeric' 
                                        })} 
                                        {selectedPeriod === 'first_half' && ' (1-15)'}
                                        {selectedPeriod === 'second_half' && ' (16-End)'}
                                    </>
                                )}
                                {!showCorrectionRequests && advancedFilters.attendance_issue && (
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                        • Filtered by: {attendanceIssueOptions.find(opt => opt.value === advancedFilters.attendance_issue)?.label}
                                    </span>
                                )}
                            </h3>
                            <div className="text-sm text-gray-500">
                                Showing {filteredLogs.length} records
                            </div>
                        </div>
                    </div>
                    
                    {filteredLogs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Schedule
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time In
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time Out
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Break Time
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hours Worked
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        {/* NEW: Correction Status Column */}
                                        {showCorrectionRequests && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Correction Status
                                            </th>
                                        )}
                                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Remarks
                                        </th> */}
                                        {/* NEW: Actions Column for Corrections */}
                                        {showCorrectionRequests && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
    {filteredLogs.map((day, index) => {
        // Add null check for log_data
        const hasLogData = day.has_log && day.log_data;
        const correctionStatus = hasLogData ? day.log_data.correction_status : null;
        const isApproved = correctionStatus === 'Approved';
        const isReviewed = correctionStatus === 'Reviewed';

        return (
            <tr 
                key={day.date || `day-${index}`} 
                className={`hover:bg-gray-50 ${
                    shouldHighlightRow(day) ? 'bg-red-50 border-l-4 border-l-red-500' : 
                    showCorrectionRequests && isApproved ? 'bg-green-50 border-l-4 border-l-green-500' :
                    showCorrectionRequests && isReviewed ? 'bg-yellow-50 border-l-4 border-l-yellow-500' : ''
                }`}
            >
                <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                        <div className="text-sm font-medium text-gray-900">
                            {day.date_formatted}
                        </div>
                        <div className="text-sm text-gray-500">
                            {day.day_of_week}
                        </div>
                        {isApproved && (
                            <span className="inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Approved - Editable
                            </span>
                        )}
                    </div>
                </td>

                {/* Schedule Cell */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingCell === `${day.date}-schedule` && isApproved ? (
                        <div className="flex space-x-2">
                            <input
                                type="time"
                                value={editFormData[`${day.date}-schedule_start`] || (hasLogData && day.log_data.schedule_start?.split(' ')[1]?.substring(0, 5)) || ''}
                                onChange={(e) => setEditFormData({
                                    ...editFormData,
                                    [`${day.date}-schedule_start`]: e.target.value
                                })}
                                className="w-20 border-gray-300 rounded text-sm"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="time"
                                value={editFormData[`${day.date}-schedule_end`] || (hasLogData && day.log_data.schedule_end?.split(' ')[1]?.substring(0, 5)) || ''}
                                onChange={(e) => setEditFormData({
                                    ...editFormData,
                                    [`${day.date}-schedule_end`]: e.target.value
                                })}
                                className="w-20 border-gray-300 rounded text-sm"
                            />
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => handleSaveEdit(day, 'schedule')}
                                    className="text-green-600 hover:text-green-800 text-xs"
                                >
                                    ✓
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div 
                            onClick={() => isApproved && handleCellEdit(day, 'schedule', hasLogData ? day.log_data.schedule_formatted : '')}
                            className={`${isApproved ? 'cursor-pointer hover:bg-blue-50 px-2 py-1 rounded' : ''}`}
                        >
                            {hasLogData ? (
                                day.log_data.schedule_formatted
                            ) : (
                                <span className="text-gray-400">No schedule</span>
                            )}
                            {isApproved && (
                                <div className="text-xs text-blue-600 mt-1">Click to edit</div>
                            )}
                        </div>
                    )}
                </td>

             {/* Time In Cell - Enhanced with Debugging */}
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
    {editingCell === `${day.date}-time_in` && isApproved ? (
        <div className="flex items-center space-x-2">
            <input
                type="time"
                value={editFormData[`${day.date}-time_in`] || getDisplayData(day, 'time_in')?.split(' ')[1]?.substring(0, 5) || ''}
                onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('✏️ Time In input changed:', newValue);
                    setEditFormData({
                        ...editFormData,
                        [`${day.date}-time_in`]: newValue
                    });
                }}
                className="border-gray-300 rounded text-sm"
            />
            <div className="flex space-x-1">
                <button
                    onClick={() => {
                        console.log('💾 Save clicked for time_in');
                        handleSaveEdit(day, 'time_in');
                    }}
                    className="text-green-600 hover:text-green-800 text-xs"
                >
                    ✓
                </button>
                <button
                    onClick={() => {
                        console.log('❌ Cancel clicked for time_in');
                        handleCancelEdit();
                    }}
                    className="text-red-600 hover:text-red-800 text-xs"
                >
                    ✕
                </button>
            </div>
        </div>
    ) : (
        <div 
            onClick={() => {
                if (isApproved) {
                    console.log('🖱️ Click to edit time_in:', getDisplayData(day, 'time_in'));
                    handleCellEdit(day, 'time_in', getDisplayData(day, 'time_in'));
                }
            }}
            className={`${isApproved ? 'cursor-pointer hover:bg-blue-50 px-2 py-1 rounded' : ''}`}
        >
            {renderCellWithDebug(day, 'time_in', getDisplayData(day, 'time_in')) || (
                <span className="text-red-500 font-medium">No time in</span>
            )}
            {isApproved && (
                <div className="text-xs text-blue-600 mt-1">Click to edit</div>
            )}
            {/* Debug info
            <div className="text-xs text-gray-400 mt-1">
                Late: {getDisplayData(day, 'late_minutes')}m | 
                Status: {getDisplayStatus(day)} | 
                Remarks: {getDisplayRemarks(day)}
            </div> */}
        </div>
    )}
</td>

                {/* Time Out Cell */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingCell === `${day.date}-time_out` && isApproved ? (
                        <div className="flex items-center space-x-2">
                            <input
                                type="time"
                                value={editFormData[`${day.date}-time_out`] || (hasLogData && day.log_data.time_out?.split(' ')[1]?.substring(0, 5)) || ''}
                                onChange={(e) => setEditFormData({
                                    ...editFormData,
                                    [`${day.date}-time_out`]: e.target.value
                                })}
                                className="border-gray-300 rounded text-sm"
                            />
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => handleSaveEdit(day, 'time_out')}
                                    className="text-green-600 hover:text-green-800 text-xs"
                                >
                                    ✓
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div 
                            onClick={() => isApproved && handleCellEdit(day, 'time_out', hasLogData ? day.log_data.time_out : '')}
                            className={`${isApproved ? 'cursor-pointer hover:bg-blue-50 px-2 py-1 rounded' : ''}`}
                        >
                            {hasLogData ? (
                                <div className="flex flex-col space-y-1">
                                    <div className="text-gray-900">
                                        {day.log_data.time_out || (
                                            <span className="text-red-500 font-medium">No time out</span>
                                        )}
                                    </div>
                                    {day.log_data.has_undertime && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300 w-fit">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Undertime: {day.log_data.undertime_formatted}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-gray-400">-</span>
                            )}
                            {isApproved && (
                                <div className="text-xs text-blue-600 mt-1">Click to edit</div>
                            )}
                        </div>
                    )}
                </td>

                {/* Break Time Cell */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingCell === `${day.date}-break` && isApproved ? (
                        <div className="flex items-center space-x-2">
                            <input
                                type="time"
                                value={editFormData[`${day.date}-break_start`] || (hasLogData && day.log_data.break_start?.split(' ')[1]?.substring(0, 5)) || ''}
                                onChange={(e) => setEditFormData({
                                    ...editFormData,
                                    [`${day.date}-break_start`]: e.target.value
                                })}
                                className="border-gray-300 rounded text-sm"
                                placeholder="Start"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="time"
                                value={editFormData[`${day.date}-break_end`] || (hasLogData && day.log_data.break_end?.split(' ')[1]?.substring(0, 5)) || ''}
                                onChange={(e) => setEditFormData({
                                    ...editFormData,
                                    [`${day.date}-break_end`]: e.target.value
                                })}
                                className="border-gray-300 rounded text-sm"
                                placeholder="End"
                            />
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => handleSaveEdit(day, 'break')}
                                    className="text-green-600 hover:text-green-800 text-xs"
                                >
                                    ✓
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div 
                            onClick={() => isApproved && handleCellEdit(day, 'break', hasLogData ? day.log_data.break_formatted : '')}
                            className={`${isApproved ? 'cursor-pointer hover:bg-blue-50 px-2 py-1 rounded' : ''}`}
                        >
                            {hasLogData ? (
                                renderBreakTime(day.log_data)
                            ) : (
                                <span className="text-gray-400">-</span>
                            )}
                            {isApproved && (
                                <div className="text-xs text-blue-600 mt-1">Click to edit</div>
                            )}
                        </div>
                    )}
                </td>


                {/* Hours Worked Cell - FIXED */}
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
    {hasLogData ? (
        formatHoursWorked(
            day.log_data.hrs_worked_formatted, 
            day.log_data.hrs_worked_minutes,
            day.log_data
        )
    ) : (
        <span className="text-gray-400">-</span>
    )}
</td>

               {/* Status Cell - Updated */}
<td className="px-6 py-4 whitespace-nowrap">
    <div className="flex items-center">
        {getStatusIcon(getDisplayStatus(day))}
        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(getDisplayStatus(day))}`}>
            {getDisplayStatus(day)}
        </span>
        {/* Show late minutes if applicable */}
        {getDisplayStatus(day) === 'Late' && (
            <span className="ml-2 text-xs text-yellow-600">
                ({getDisplayData(day, 'late_minutes')} mins)
            </span>
        )}
    </div>
</td>

               {/* Remarks Cell - Updated
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
    {editingCell === `${day.date}-remarks` && isApproved ? (
        <div className="flex items-start space-x-2">
            <textarea
                value={editFormData[`${day.date}-remarks`] || getDisplayRemarks(day) || ''}
                onChange={(e) => setEditFormData({
                    ...editFormData,
                    [`${day.date}-remarks`]: e.target.value
                })}
                rows="2"
                className="w-full border-gray-300 rounded text-sm"
                placeholder="Add remarks..."
            />
            <div className="flex space-x-1 mt-1">
                <button
                    onClick={() => handleSaveEdit(day, 'remarks')}
                    className="text-green-600 hover:text-green-800 text-xs"
                >
                    ✓
                </button>
                <button
                    onClick={handleCancelEdit}
                    className="text-red-600 hover:text-red-800 text-xs"
                >
                    ✕
                </button>
            </div>
        </div>
    ) : (
        <div 
            onClick={() => isApproved && handleCellEdit(day, 'remarks', getDisplayRemarks(day))}
            className={`${isApproved ? 'cursor-pointer hover:bg-blue-50 px-2 py-1 rounded' : ''}`}
        >
            {getDisplayRemarks(day) || (
                <span className="text-gray-400">No remarks</span>
            )}
            {isApproved && (
                <div className="text-xs text-blue-600 mt-1">Click to edit</div>
            )}
        </div>
    )}
</td> */}

                {/* Actions Column - Only for Correction Requests */}
                {showCorrectionRequests && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isReviewed ? (
                            <button
                                onClick={() => handleReviewCorrection(day)}
                                className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                            >
                                Review Correction
                            </button>
                        ) : isApproved ? (
                            <span className="text-green-600 font-medium">✓ Approved</span>
                        ) : null}
                    </td>
                )}
            </tr>
        );
    })}
</tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                {showCorrectionRequests 
                                    ? 'No correction requests found' 
                                    : 'No attendance records'
                                }
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {showCorrectionRequests
                                    ? 'There are no correction requests reviewed by Department Head for the selected period.'
                                    : 'No attendance records found for the selected period and filters.'
                                }
                            </p>
                            {(hasActiveFilters() || showCorrectionRequests) && (
                                <button
                                    onClick={() => {
                                        if (showCorrectionRequests) {
                                            setShowCorrectionRequests(false);
                                        } else {
                                            clearAllFilters();
                                        }
                                    }}
                                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    {showCorrectionRequests ? 'Show All Records' : 'Clear Filters'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </HRLayout>
    );
}