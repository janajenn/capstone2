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
    Eye
} from 'lucide-react';

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

export default function EmployeeAttendanceLogs({ auth, employee, attendanceLogs, summary, filters }) {
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

    const handleFilterChange = () => {
        const params = {
            month: selectedMonth, 
            period: selectedPeriod,
            ...dateRange,
            ...advancedFilters
        };

        // Remove empty values
        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null) {
                delete params[key];
            }
        });

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
        return dateRange.start_date || dateRange.end_date || advancedFilters.attendance_issue;
    };

    return (
        <HRLayout user={auth.user}>
            <Head title={`${employee.firstname} ${employee.lastname} - Attendance Logs`} />

            <div className="space-y-6">
                {/* Back Button and Filter Controls */}
                <div className="flex items-center justify-between">
                    <Link 
                        href="/hr/attendance/logs"
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Back to Employee Summary
                    </Link>
                    <div className="flex space-x-2">
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
                    </div>
                </div>

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
                {hasActiveFilters() && (
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

                {/* Attendance Logs Table */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">
                                {dateRange.start_date || dateRange.end_date ? (
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
                                {advancedFilters.attendance_issue && (
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                        • Filtered by: {attendanceIssueOptions.find(opt => opt.value === advancedFilters.attendance_issue)?.label}
                                    </span>
                                )}
                            </h3>
                            <div className="text-sm text-gray-500">
                                Showing {attendanceLogs?.length || 0} records
                            </div>
                        </div>
                    </div>
                    
                    {attendanceLogs && attendanceLogs.length > 0 ? (
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
                                            Hours Worked
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Remarks
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {attendanceLogs.map((day, index) => (
                                        <tr 
                                            key={day.date || `day-${index}`} 
                                            className={`hover:bg-gray-50 ${
                                                shouldHighlightRow(day) ? 'bg-red-50 border-l-4 border-l-red-500' : ''
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
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {day.has_log && day.log_data ? (
                                                    day.log_data.schedule_formatted
                                                ) : (
                                                    <span className="text-gray-400">No schedule</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {day.has_log && day.log_data ? (
                                                    day.log_data.time_in || (
                                                        <span className="text-red-500 font-medium">No time in</span>
                                                    )
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {day.has_log && day.log_data ? (
                                                    day.log_data.time_out || (
                                                        <span className="text-red-500 font-medium">No time out</span>
                                                    )
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {day.has_log && day.log_data ? (
                                                    day.log_data.hrs_worked_formatted
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {getStatusIcon(day.has_log ? day.log_data?.status : day.status)}
                                                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(day.has_log ? day.log_data?.status : day.status)}`}>
                                                        {day.has_log ? day.log_data?.status : day.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {day.has_log && day.log_data ? (
                                                    day.log_data.remarks || (
                                                        <span className="text-gray-400">No remarks</span>
                                                    )
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                No attendance records found for the selected period and filters.
                            </p>
                            {hasActiveFilters() && (
                                <button
                                    onClick={clearAllFilters}
                                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </HRLayout>
    );
}