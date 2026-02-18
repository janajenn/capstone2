import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import SecondaryButton from '@/Components/SecondaryButton';
import { 
    Calendar, 
    Clock, 
    User, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    ChevronLeft,
    FileText,
    Download,
    RefreshCw,
    Eye,
    Search,
    BarChart3,
    TrendingUp,
    Shield,
    Info,
    Zap
} from 'lucide-react';

export default function AttendanceComparison({ auth, employee, comparisonData, summary, dateRange, filters }) {
    
    // Function to convert 24-hour time to 12-hour format with AM/PM
    const formatTimeTo12Hour = (timeString) => {
        if (!timeString || timeString === 'No time in' || timeString === 'No time out') {
            return timeString;
        }
        
        try {
            // Handle time strings like "14:30" or "08:45"
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours, 10);
            const minute = parseInt(minutes, 10);
            
            if (isNaN(hour) || isNaN(minute)) {
                return timeString; // Return original if parsing fails
            }
            
            const period = hour >= 12 ? 'PM' : 'AM';
            const twelveHour = hour % 12 || 12; // Convert 0 to 12 for midnight
            
            return `${twelveHour}:${minute.toString().padStart(2, '0')} ${period}`;
        } catch (error) {
            return timeString; // Return original if any error occurs
        }
    };

    // Function to format hours worked (like "8:30" to "8h 30m")
   // Function to format hours worked according to the new computation rules
// - If 8 hours or above: display "8"
// - If below 8 hours: display full time in "Xh Ym" format
// FIXED: Use identical calculation for both processed and raw data
const formatHoursWorked = (minutes) => {
    if (minutes === null || minutes === undefined || minutes <= 0) {
        return '0';
    }

    // Convert minutes to hours
    const hours = minutes / 60;
    
    // Apply the new rule: if 8 or above, display "8"
    if (hours >= 8) {
        return '8';
    }
    
    // If below 8 hours, display full time in "Xh Ym" format
    const wholeHours = Math.floor(hours);
    const remainingMinutes = minutes % 60;
    
    if (wholeHours > 0 && remainingMinutes > 0) {
        return `${wholeHours}h ${remainingMinutes}m`;
    } else if (wholeHours > 0) {
        return `${wholeHours}h`;
    } else {
        return `${remainingMinutes}m`;
    }
};

// FIXED: Use identical calculation for late time
const formatLateTime = (lateMinutes) => {
    if (lateMinutes === null || lateMinutes === undefined || lateMinutes <= 0 || isNaN(lateMinutes)) {
        return 'On time';
    }
    
    if (lateMinutes < 60) return `${lateMinutes}m late`;
    
    const hoursPart = Math.floor(lateMinutes / 60);
    const minutesPart = lateMinutes % 60;
    
    if (minutesPart === 0) return `${hoursPart}h late`;
    return `${hoursPart}h ${minutesPart}m late`;
};

    const getStatusIcon = (status) => {
        switch (status) {
            case 'match':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'mismatch':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'missing_raw':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'missing_processed':
                return <XCircle className="w-5 h-5 text-orange-500" />;
            case 'no_data':
                return <Clock className="w-5 h-5 text-gray-500" />;
            default:
                return <AlertTriangle className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'match':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'mismatch':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'missing_raw':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'missing_processed':
                return 'bg-orange-50 border-orange-200 text-orange-800';
            case 'no_data':
                return 'bg-gray-50 border-gray-200 text-gray-800';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'match':
                return 'Perfect Match';
            case 'mismatch':
                return 'Data Mismatch';
            case 'missing_raw':
                return 'Missing Raw Data';
            case 'missing_processed':
                return 'Missing Processed Data';
            case 'no_data':
                return 'No Data Available';
            default:
                return 'Unknown Status';
        }
    };

    const getQualityScoreColor = (score) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 80) return 'text-yellow-600';
        if (score >= 70) return 'text-orange-600';
        return 'text-red-600';
    };

    // Enhanced back function that preserves filters
    const handleBackToLogs = () => {
        const backUrl = `/hr/attendance/logs/employee/${employee.employee_id}`;
        
        // Preserve the filters from the original request
        const queryParams = new URLSearchParams();
        
        if (filters?.month) queryParams.append('month', filters.month);
        if (filters?.period) queryParams.append('period', filters.period);
        if (filters?.start_date) queryParams.append('start_date', filters.start_date);
        if (filters?.end_date) queryParams.append('end_date', filters.end_date);
        
        const fullUrl = queryParams.toString() ? `${backUrl}?${queryParams.toString()}` : backUrl;
        
        router.get(fullUrl);
    };

    const handleRefresh = () => {
        router.reload();
    };

    // Filter out remark-related differences and recalculate status based on time data only
    const filterTimeDifferences = (differences) => {
        if (!differences) return [];
        
        // Exclude differences related to remarks and other non-time fields
        const excludedKeywords = [
            'remark', 'note', 'comment', 'description', 'annotation',
            'import batch', 'created at', 'raw row'
        ];
        
        return differences.filter(diff => {
            const lowerDiff = diff.toLowerCase();
            return !excludedKeywords.some(keyword => lowerDiff.includes(keyword));
        });
    };

    // Check if records actually match based on time data only (excluding remarks)
    const shouldRecordsMatch = (entry) => {
        if (!entry.processed_data || !entry.raw_data) {
            return false;
        }
        
        // Define time fields to compare (exclude remarks and metadata)
        const timeFields = ['time_in', 'time_out', 'hrs_worked_formatted', 'late_formatted'];
        
        for (let field of timeFields) {
            const processedValue = entry.processed_data[field];
            const rawValue = entry.raw_data[field];
            
            // Normalize values for comparison
            if (normalizeTimeValue(processedValue) !== normalizeTimeValue(rawValue)) {
                return false;
            }
        }
        
        return true;
    };

    const normalizeTimeValue = (value) => {
        if (!value) return null;
        
        // Remove AM/PM and spaces for comparison, handle "No time in/out"
        if (value === 'No time in' || value === 'No time out') {
            return null;
        }
        
        return value.toString()
            .replace(/\s*(AM|PM)/gi, '')
            .replace(/\s+/g, '')
            .toLowerCase();
    };

    // Process comparison data to enhance with filtered differences and accurate status
    // Process comparison data to enhance with filtered differences and accurate status
// Process comparison data to enhance with filtered differences and accurate status
// FIXED: Process comparison data with identical formatting
const processedComparisonData = comparisonData.map(entry => {
    const filteredDifferences = filterTimeDifferences(entry.differences);
    
    // Determine actual status based on time data only
    let actualStatus = entry.status;
    if (entry.status === 'mismatch' && filteredDifferences.length === 0) {
        actualStatus = 'match';
    } else if (entry.status === 'mismatch' && filteredDifferences.length > 0) {
        actualStatus = 'mismatch';
    }
    
    if (entry.processed_data && entry.raw_data && shouldRecordsMatch(entry)) {
        actualStatus = 'match';
    }

    return {
        ...entry,
        processed_data: entry.processed_data ? {
            ...entry.processed_data,
            time_in: formatTimeTo12Hour(entry.processed_data.time_in),
            time_out: formatTimeTo12Hour(entry.processed_data.time_out),
            // FIXED: Use raw minutes for consistent formatting
            hrs_worked_formatted: formatHoursWorked(entry.processed_data.hrs_worked_minutes),
            // FIXED: Use raw minutes for consistent formatting
            late_formatted: formatLateTime(entry.processed_data.late_minutes),
            schedule_formatted: entry.processed_data.schedule_formatted ? 
                `${formatTimeTo12Hour(entry.processed_data.schedule_start)} - ${formatTimeTo12Hour(entry.processed_data.schedule_end)}` : 
                entry.processed_data.schedule_formatted
        } : null,
        raw_data: entry.raw_data ? {
            ...entry.raw_data,
            time_in: formatTimeTo12Hour(entry.raw_data.time_in),
            time_out: formatTimeTo12Hour(entry.raw_data.time_out),
            // FIXED: Use raw minutes for consistent formatting
            hrs_worked_formatted: formatHoursWorked(entry.raw_data.hrs_worked_minutes),
            // FIXED: Use raw minutes for consistent formatting
            late_formatted: formatLateTime(entry.raw_data.late_minutes),
            schedule_start: formatTimeTo12Hour(entry.raw_data.schedule_start),
            schedule_end: formatTimeTo12Hour(entry.raw_data.schedule_end)
        } : null,
        differences: filteredDifferences,
        status: actualStatus,
        original_differences_count: entry.differences ? entry.differences.length : 0,
        filtered_differences_count: filteredDifferences.length
    };
});


    // Filter for records that have data to show
    const recordsWithData = processedComparisonData.filter(entry => 
        entry.has_processed || entry.has_raw || entry.status === 'mismatch'
    );

    // Calculate enhanced summary based on processed data
    const enhancedSummary = {
        ...summary,
        // Recalculate based on filtered data
        actual_match_count: processedComparisonData.filter(entry => entry.status === 'match').length,
        actual_mismatch_count: processedComparisonData.filter(entry => entry.status === 'mismatch').length,
        filtered_differences_total: processedComparisonData.reduce((sum, entry) => sum + entry.filtered_differences_count, 0)
    };

    return (
        <HRLayout user={auth.user}>
            <Head title={`${employee.firstname} ${employee.lastname} - Attendance Comparison`} />

            <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button 
                                onClick={handleBackToLogs}
                                className="flex items-center text-blue-100 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Back to Logs
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold">Attendance Data Comparison</h1>
                                <p className="text-blue-100 mt-1">
                                    Time-only comparison (remarks excluded) • {employee.firstname} {employee.lastname}
                                </p>
                            </div>
                        </div>
                        <SecondaryButton 
                            onClick={handleRefresh}
                            className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh Data
                        </SecondaryButton>
                    </div>
                </div>

                {/* Enhanced Employee Info Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {employee.firstname} {employee.lastname}
                                </h2>
                                <div className="flex items-center space-x-4 mt-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                                        {employee.department}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        ID: {employee.employee_id}
                                    </span>
                                    {employee.biometric_id && (
                                        <span className="text-sm text-gray-500">
                                            Biometric ID: {employee.biometric_id}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Data Quality</div>
                            <div className={`text-2xl font-bold ${getQualityScoreColor(enhancedSummary.data_quality_score)}`}>
                                {enhancedSummary.data_quality_score}%
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Time-only comparison
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-green-800 uppercase tracking-wide">Perfect Matches</p>
                                <p className="text-3xl font-bold text-green-900 mt-2">{enhancedSummary.actual_match_count}</p>
                                <p className="text-sm text-green-700 mt-1">{enhancedSummary.match_percentage}% match rate</p>
                                <p className="text-xs text-green-600 mt-1">Time data only</p>
                            </div>
                            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-yellow-800 uppercase tracking-wide">Time Mismatches</p>
                                <p className="text-3xl font-bold text-yellow-900 mt-2">{enhancedSummary.actual_mismatch_count}</p>
                                <p className="text-sm text-yellow-700 mt-1">Actual time differences</p>
                                <p className="text-xs text-yellow-600 mt-1">{enhancedSummary.filtered_differences_total} issues</p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                                <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-red-800 uppercase tracking-wide">Missing Raw</p>
                                <p className="text-3xl font-bold text-red-900 mt-2">{enhancedSummary.missing_raw_count}</p>
                                <p className="text-sm text-red-700 mt-1">Import issues</p>
                                <p className="text-xs text-red-600 mt-1">No source data</p>
                            </div>
                            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                                <XCircle className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-blue-800 uppercase tracking-wide">Quality Score</p>
                                <p className="text-3xl font-bold text-blue-900 mt-2">{enhancedSummary.data_quality_score}%</p>
                                <p className="text-sm text-blue-700 mt-1">Overall accuracy</p>
                                <p className="text-xs text-blue-600 mt-1">Remarks excluded</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Date Range Info */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-indigo-100">Comparison Period</div>
                                <div className="text-lg font-semibold">
                                    {dateRange.start} to {dateRange.end}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-indigo-100">Analysis Summary</div>
                            <div className="text-lg font-semibold">
                                {enhancedSummary.total_days} days • {recordsWithData.length} records
                            </div>
                            <div className="text-sm text-indigo-200 mt-1">
                                Remarks excluded from comparison
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Comparison Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Time-Only Data Comparison
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Side-by-side analysis • 12-hour format • Remarks excluded from matching logic
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border border-gray-200">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-700">
                                    {recordsWithData.length} records analyzed
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-48">
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span>Date & Status</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-blue-50 border-r border-blue-100">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                            <span>System Data</span>
                                            <span className="text-xs text-blue-600 font-normal">(Processed)</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-orange-50">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                            <span>Source Data</span>
                                            <span className="text-xs text-orange-600 font-normal">(Raw)</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-56 bg-gray-50">
                                        <div className="flex items-center space-x-2">
                                            <BarChart3 className="w-4 h-4 text-gray-500" />
                                            <span>Time Differences</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {recordsWithData.map((entry, index) => (
                                    <tr key={entry.date} className="hover:bg-gray-50 transition-colors group">
                                        {/* Date and Status Column */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {entry.date_formatted}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-medium">
                                                        {entry.day_of_week}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {getStatusIcon(entry.status)}
                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(entry.status)}`}>
                                                        {getStatusText(entry.status)}
                                                    </span>
                                                </div>
                                                {entry.original_differences_count > entry.filtered_differences_count && (
                                                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                        {entry.original_differences_count - entry.filtered_differences_count} 
                                                        non-time differences filtered
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        
                                        {/* Processed Data Column */}
                                        <td className="px-6 py-4 border-r border-blue-50 bg-blue-50/50">
                                            {entry.processed_data ? (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Time In</span>
                                                            <div className={`mt-1 text-sm font-medium ${!entry.processed_data.time_in || entry.processed_data.time_in === 'No time in' ? 'text-red-600' : 'text-gray-900'}`}>
                                                                {entry.processed_data.time_in || '—'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Time Out</span>
                                                            <div className={`mt-1 text-sm font-medium ${!entry.processed_data.time_out || entry.processed_data.time_out === 'No time out' ? 'text-red-600' : 'text-gray-900'}`}>
                                                                {entry.processed_data.time_out || '—'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Hours</span>
                                                            <div className="mt-1 text-sm font-bold text-gray-900">
                                                                {entry.processed_data.hrs_worked_formatted || '0h 00m'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Late</span>
                                                            <div className={`mt-1 text-sm font-medium ${entry.processed_data.late_minutes > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                                                                {entry.processed_data.late_formatted}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Schedule</span>
                                                        <div className="mt-1 text-sm font-medium text-gray-900 bg-white px-2 py-1 rounded border">
                                                            {entry.processed_data.schedule_formatted || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-6">
                                                    <XCircle className="mx-auto h-8 w-8 text-gray-300" />
                                                    <div className="mt-2 text-sm text-gray-500 font-medium">No processed data</div>
                                                </div>
                                            )}
                                        </td>
                                        
                                        {/* Raw Data Column */}
                                        <td className="px-6 py-4 bg-orange-50/50">
                                            {entry.raw_data ? (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Time In</span>
                                                            <div className={`mt-1 text-sm font-medium ${!entry.raw_data.time_in || entry.raw_data.time_in === 'No time in' ? 'text-red-600' : 'text-gray-900'}`}>
                                                                {entry.raw_data.time_in || '—'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Time Out</span>
                                                            <div className={`mt-1 text-sm font-medium ${!entry.raw_data.time_out || entry.raw_data.time_out === 'No time out' ? 'text-red-600' : 'text-gray-900'}`}>
                                                                {entry.raw_data.time_out || '—'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Hours</span>
                                                            <div className="mt-1 text-sm font-bold text-gray-900">
                                                                {entry.raw_data.hrs_worked_formatted || '0h 00m'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Late</span>
                                                            <div className={`mt-1 text-sm font-medium ${entry.raw_data.late_minutes > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                                                                {entry.raw_data.late_formatted}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Schedule</span>
                                                        <div className="mt-1 text-sm font-medium text-gray-900 bg-white px-2 py-1 rounded border">
                                                            {entry.raw_data.schedule_start && entry.raw_data.schedule_end 
                                                                ? `${entry.raw_data.schedule_start} - ${entry.raw_data.schedule_end}`
                                                                : 'N/A'}
                                                        </div>
                                                    </div>
                                                    {/* {entry.raw_data.import_batch && (
                                                        <div>
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Import Batch</span>
                                                            <div className="mt-1 text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded border">
                                                                {entry.raw_data.import_batch}
                                                            </div>
                                                        </div>
                                                    )} */}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6">
                                                    <XCircle className="mx-auto h-8 w-8 text-gray-300" />
                                                    <div className="mt-2 text-sm text-gray-500 font-medium">No raw data</div>
                                                </div>
                                            )}
                                        </td>
                                        
                                        {/* Analysis Column */}
                                        <td className="px-6 py-4 bg-gray-50/50">
                                            {entry.differences && entry.differences.length > 0 ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                                        <span className="text-sm font-semibold text-yellow-700">
                                                            Time Differences Found
                                                        </span>
                                                    </div>
                                                    <ul className="text-sm text-yellow-700 space-y-1">
                                                        {entry.differences.map((diff, idx) => (
                                                            <li key={idx} className="flex items-start">
                                                                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                                                                <span className="text-xs">{diff}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {entry.original_differences_count > entry.filtered_differences_count && (
                                                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            {entry.original_differences_count - entry.filtered_differences_count} 
                                                            non-time differences filtered out
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-center py-4">
                                                    <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
                                                    <span className="text-sm font-semibold text-green-600">Perfect Match</span>
                                                    <span className="text-xs text-green-500 mt-1">All time data matches</span>
                                                    {entry.original_differences_count > 0 && (
                                                        <div className="text-xs text-gray-500 mt-2 bg-green-50 px-2 py-1 rounded">
                                                            {entry.original_differences_count} remark differences ignored
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Enhanced Empty State */}
                    {recordsWithData.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No comparison data found</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                No attendance data found for the selected period in either processed or raw logs.
                            </p>
                            <button
                                onClick={handleBackToLogs}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                            >
                                Back to Attendance Logs
                            </button>
                        </div>
                    )}
                </div>

                {/* Enhanced Legend */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                        <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                        Comparison Guide
                    </h4>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {[
                                { status: 'match', icon: CheckCircle, text: 'Perfect Match - Time data identical' },
                                { status: 'mismatch', icon: AlertTriangle, text: 'Time Mismatch - Actual time differences' },
                                { status: 'missing_raw', icon: XCircle, text: 'Missing Raw - No source data' },
                                { status: 'missing_processed', icon: XCircle, text: 'Missing Processed - No system data' },
                                { status: 'no_data', icon: Clock, text: 'No Data - No records found' }
                            ].map((item, index) => (
                                <div key={item.status} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200">
                                    <item.icon className={`w-5 h-5 ${getStatusColor(item.status).split(' ')[3]}`} />
                                    <span className="text-sm text-gray-700 font-medium">{item.text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-2">
                                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-blue-800">Important Note</p>
                                    <p className="text-sm text-blue-700 mt-1">
                                        This comparison <strong>excludes remarks and metadata</strong> from the matching logic. 
                                        Only time data (Time In, Time Out, Hours Worked, Late Minutes) is used to determine matches.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HRLayout>
    );
}