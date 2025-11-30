import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { usePage, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';

export default function LeaveHistory() {
    const { leaveHistory, employee, flash } = usePage().props;
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [isRescheduleHistoryModalOpen, setIsRescheduleHistoryModalOpen] = useState(false);
    const [activeKebabMenu, setActiveKebabMenu] = useState(null);
    const [selectedDates, setSelectedDates] = useState([]);

    // Inertia form for reschedule
    const { data, setData, post, processing, errors, reset } = useForm({
        original_leave_request_id: '',
        proposed_dates: [],
        reason: '',
    });

    // Safe data extraction for pagination
    const getPaginationData = () => {
        if (!leaveHistory) {
            return { data: [], from: 0, to: 0, total: 0, current_page: 1, last_page: 1, links: [] };
        }

        if (leaveHistory.data !== undefined) {
            return {
                data: leaveHistory.data || [],
                from: leaveHistory.from || 0,
                to: leaveHistory.to || 0,
                total: leaveHistory.total || 0,
                current_page: leaveHistory.current_page || 1,
                last_page: leaveHistory.last_page || 1,
                links: leaveHistory.links || [],
                next_page_url: leaveHistory.next_page_url || null,
                prev_page_url: leaveHistory.prev_page_url || null
            };
        }

        return {
            data: Array.isArray(leaveHistory) ? leaveHistory : [],
            from: 1,
            to: Array.isArray(leaveHistory) ? leaveHistory.length : 0,
            total: Array.isArray(leaveHistory) ? leaveHistory.length : 0,
            current_page: 1,
            last_page: 1,
            links: []
        };
    };

    const paginationData = getPaginationData();
    const { data: tableData, from, to, total, current_page, last_page, links, next_page_url, prev_page_url } = paginationData;
    const isPaginated = leaveHistory && leaveHistory.data !== undefined;
    const hasData = tableData && tableData.length > 0;

    // Show flash messages
    useEffect(() => {
        if (flash.success) {
            alert('✅ ' + flash.success);
        }
        if (flash.error) {
            alert('❌ ' + flash.error);
        }
    }, [flash]);

    const handleViewDetails = (leave) => {
        setSelectedLeave(leave);
        setIsViewModalOpen(true);
        setActiveKebabMenu(null);
    };

    const handleApplyReschedule = (leave) => {
        // Only allow rescheduling for fully approved leaves
        if (leave.status !== 'approved') {
            alert('Only fully approved leave requests can be rescheduled.');
            setActiveKebabMenu(null);
            return;
        }
        
        // Make sure we have the complete leave object with total_days
        setSelectedLeave({
            ...leave,
            total_days: leave.total_days || calculateDuration(leave.date_from, leave.date_to)
        });
        setSelectedDates([]);
        setData('reason', '');
        setData('original_leave_request_id', leave.id);
        setIsRescheduleModalOpen(true);
        setActiveKebabMenu(null);
    };
    
    // Add this helper function to calculate duration if needed
    const calculateDuration = (dateFrom, dateTo) => {
        const start = new Date(dateFrom);
        const end = new Date(dateTo);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    };


    const handleViewRescheduleHistory = (leave) => {
        setSelectedLeave(leave);
        setIsRescheduleHistoryModalOpen(true);
        setActiveKebabMenu(null);
    };

    const handleCloseModals = () => {
        setIsViewModalOpen(false);
        setIsRescheduleModalOpen(false);
        setIsRescheduleHistoryModalOpen(false);
        setSelectedLeave(null);
        setSelectedDates([]);
        reset();
        setActiveKebabMenu(null);
    };

    const toggleKebabMenu = (leaveId) => {
        setActiveKebabMenu(activeKebabMenu === leaveId ? null : leaveId);
    };

    // Date selection functions for reschedule
    const isWeekend = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
    };

    const handleDateSelect = (date) => {
    const dateString = date.toISOString().split('T')[0];
    const originalDuration = selectedLeave?.total_days || 0;
    
    let newSelectedDates;
    if (selectedDates.includes(dateString)) {
        // Remove date if already selected
        newSelectedDates = selectedDates.filter(d => d !== dateString);
    } else {
        // Check if user has reached the maximum allowed dates
        if (selectedDates.length >= originalDuration) {
            alert(`You can only select ${originalDuration} date(s) for rescheduling, matching the original leave duration.`);
            return;
        }
        // Add date if not selected and within limit
        newSelectedDates = [...selectedDates, dateString].sort();
    }
    
    setSelectedDates(newSelectedDates);
    setData('proposed_dates', newSelectedDates);
};

    const handleRemoveDate = (dateToRemove) => {
        const newSelectedDates = selectedDates.filter(date => date !== dateToRemove);
        setSelectedDates(newSelectedDates);
        setData('proposed_dates', newSelectedDates);
    };

    const clearAllDates = () => {
        setSelectedDates([]);
        setData('proposed_dates', []);
    };

    // Generate calendar dates for the next 3 months
    const calendarDates = useMemo(() => {
        const dates = [];
        const today = new Date();
        const endDate = new Date();
        endDate.setMonth(today.getMonth() + 3); // Show next 3 months
        
        const current = new Date(today);
        while (current <= endDate) {
            if (!isWeekend(current)) {
                dates.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }, []);

    // Group dates by month for display
    const groupedDates = useMemo(() => {
        const groups = {};
        calendarDates.forEach(date => {
            const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(date);
        });
        return groups;
    }, [calendarDates]);

    const handleSubmitReschedule = () => {
        if (selectedDates.length === 0) {
            alert('Please select at least one date for rescheduling.');
            return;
        }

        if (!data.reason.trim()) {
            alert('Please provide a reason for rescheduling.');
            return;
        }

        // Validate that selected dates match original duration
        const originalDuration = selectedLeave?.total_days || 0;
        if (selectedDates.length !== originalDuration) {
            alert(`Please select exactly ${originalDuration} date(s) to match the original leave duration.`);
            return;
        }

        // Submit using Inertia
        post(route('employee.leave-reschedule.submit'), {
            onSuccess: () => {
                handleCloseModals();
                // The page will refresh automatically due to Inertia
            },
            onError: (errors) => {
                console.error('Reschedule submission errors:', errors);
                alert('Failed to submit reschedule request. Please check the form and try again.');
            }
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200';
            case 'pending':
                return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-200';
            case 'pending_hr':
                return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200';
            case 'pending_dept_head':
                return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-200';
            case 'pending_admin':
                return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-200';
            case 'rejected':
                return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200';
            case 'recalled':
                return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200';
            default:
                return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved':
                return 'Approved';
            case 'pending':
                return 'Pending';
            case 'pending_hr':
                return 'Pending HR';
            case 'pending_dept_head':
                return 'Pending Dept Head';
            case 'pending_admin':
                return 'Pending Admin';
            case 'rejected':
                return 'Rejected';
            case 'recalled':
                return 'Recalled';
            default:
                return status;
        }
    };

    const getLeaveTypeIcon = (code) => {
        switch (code) {
            case 'VL': return '🏖️';
            case 'SL': return '🤒';
            case 'MAT': return '👶';
            case 'STL': return '📚';
            case 'SLBW': return '🩺';
            default: return '📋';
        }
    };

    const getLeaveTypeColor = (code) => {
        switch (code) {
            case 'VL': return 'from-blue-400 to-blue-500';
            case 'SL': return 'from-green-400 to-green-500';
            case 'MAT': return 'from-pink-400 to-pink-500';
            case 'STL': return 'from-purple-400 to-purple-500';
            case 'SLBW': return 'from-indigo-400 to-indigo-500';
            default: return 'from-gray-400 to-gray-500';
        }
    };

    const getRescheduleStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800';
            case 'rejected':
                return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800';
            case 'pending_hr':
                return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800';
            case 'pending_dept_head':
                return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800';
            default:
                return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800';
        }
    };

    const getRescheduleStatusText = (status) => {
        switch (status) {
            case 'approved':
                return 'Approved';
            case 'rejected':
                return 'Rejected';
            case 'pending_hr':
                return 'Pending HR';
            case 'pending_dept_head':
                return 'Pending Dept Head';
            default:
                return status;
        }
    };

    return (
        <EmployeeLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                                        Leave History
                                    </h1>
                                    <p className="text-sm text-gray-600 mt-1 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1 inline-block">
                                        Showing {from}-{to} of {total} leave requests
                                    </p>
                                </div>
                            </div>
                            
                            <Link
                                href={route('employee.my-leave-requests')}
                                className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 border border-transparent rounded-xl font-semibold text-sm text-white uppercase tracking-wider hover:from-emerald-600 hover:to-green-700 focus:from-emerald-600 focus:to-green-700 active:from-emerald-700 active:to-green-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 focus:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Back to Requests
                            </Link>
                        </div>
                    </motion.div>

                    {/* Main Content Card */}
                    <motion.div
                        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200/50">
                                <thead className="bg-gradient-to-r from-emerald-50 to-green-50/30">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                                            Leave Details
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                                            Duration
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                                            Submitted
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white/50 divide-y divide-gray-200/30">
                                    {!hasData ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-16 h-16 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center mb-4">
                                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No leave history found</h3>
                                                    <p className="text-gray-600 max-w-sm">Your approved and pending leave requests will appear here.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        tableData.map((leave) => {
                                            const startDate = new Date(leave.date_from);
                                            const endDate = new Date(leave.date_to);
                                            // FIXED: Use total_days from backend which now uses selected_dates count
const duration = leave.total_days || Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                                            return (
                                                <motion.tr
                                                    key={leave.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                    className={`hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-green-50/30 transition-all duration-200 ${
                                                        leave.is_recalled ? 'bg-red-50/50 border-l-4 border-l-red-400' : ''
                                                    } ${leave.is_rescheduled ? 'bg-blue-50/50 border-l-4 border-l-blue-400' : ''}`}
                                                >
                                                    {/* Leave Details Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-start space-x-4">
                                                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-r ${getLeaveTypeColor(leave.leave_type?.code)}`}>
                                                                <span className="text-white text-lg">
                                                                    {getLeaveTypeIcon(leave.leave_type?.code)}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center space-x-3">
                                                                    <p className="text-sm font-semibold text-gray-900">
                                                                        {leave.leave_type?.name}
                                                                    </p>
                                                                    {leave.is_recalled && (
                                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200">
                                                                            Recalled
                                                                        </span>
                                                                    )}
                                                                    {leave.is_rescheduled && (
                                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200">
                                                                            Rescheduled
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-2 bg-white/50 rounded-full px-2 py-1 inline-block">
                                                                    Reason: {leave.reason}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Duration Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col space-y-1">
                                                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-sm">
                                                                {duration} day{duration !== 1 ? 's' : ''}
                                                            </span>
                                                            <div className="text-xs text-gray-500 text-center">
                                                                {leave.days_with_pay} with pay
                                                                {leave.days_without_pay > 0 && `, ${leave.days_without_pay} without pay`}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Status Column */}
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-sm ${getStatusColor(leave.status)}`}>
                                                            {getStatusText(leave.status)}
                                                        </span>
                                                    </td>

                                                    {/* Submitted Date Column */}
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-900">
                                                            {new Date(leave.created_at).toLocaleDateString()}
                                                        </span>
                                                        {leave.approved_at && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                Approved: {new Date(leave.approved_at).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Actions Column */}
                                                    <td className="px-6 py-4 relative">
                                                        <div className="flex items-center justify-start">
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => toggleKebabMenu(leave.id)}
                                                                className="inline-flex items-center p-2 border border-gray-300 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                                                            >
                                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                                </svg>
                                                            </motion.button>

                                                            {activeKebabMenu === leave.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 z-10"
                                                                >
                                                                    <div className="py-1">
                                                                        <button
                                                                            onClick={() => handleViewDetails(leave)}
                                                                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 w-full text-left transition-all duration-200"
                                                                        >
                                                                            <svg className="h-4 w-4 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                            </svg>
                                                                            View Details
                                                                        </button>
                                                                        {leave.status === 'approved' && (
                                                                            <button
                                                                                onClick={() => handleApplyReschedule(leave)}
                                                                                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 w-full text-left transition-all duration-200"
                                                                            >
                                                                                <svg className="h-4 w-4 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                                </svg>
                                                                                Apply Reschedule
                                                                            </button>
                                                                        )}
                                                                        {leave.has_reschedule_history && (
                                                                            <button
                                                                                onClick={() => handleViewRescheduleHistory(leave)}
                                                                                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 w-full text-left transition-all duration-200"
                                                                            >
                                                                                <svg className="h-4 w-4 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                </svg>
                                                                                Reschedule History
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {isPaginated && last_page > 1 && (
                            <div className="bg-gradient-to-r from-emerald-50/50 to-green-50/30 px-6 py-4 border-t border-gray-200/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex justify-between flex-1 sm:hidden">
                                        {current_page > 1 && prev_page_url && (
                                            <Link
                                                href={prev_page_url}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-emerald-50 transition-all duration-200"
                                            >
                                                Previous
                                            </Link>
                                        )}
                                        {current_page < last_page && next_page_url && (
                                            <Link
                                                href={next_page_url}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-emerald-50 transition-all duration-200"
                                            >
                                                Next
                                            </Link>
                                        )}
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1">
                                                Showing <span className="font-semibold">{from}</span> to <span className="font-semibold">{to}</span> of{' '}
                                                <span className="font-semibold">{total}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
                                                {/* Previous Page Link */}
                                                {current_page > 1 && prev_page_url ? (
                                                    <Link
                                                        href={prev_page_url}
                                                        className="relative inline-flex items-center px-3 py-2 rounded-l-xl border border-gray-300 bg-white/80 backdrop-blur-sm text-sm font-medium text-gray-500 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-200"
                                                    >
                                                        <span className="sr-only">Previous</span>
                                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </Link>
                                                ) : (
                                                    <span className="relative inline-flex items-center px-3 py-2 rounded-l-xl border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400 cursor-not-allowed">
                                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                )}

                                                {/* Page Numbers */}
                                                {Array.from({ length: last_page }, (_, i) => i + 1).map((page) => {
                                                    if (
                                                        page === 1 ||
                                                        page === last_page ||
                                                        (page >= current_page - 1 && page <= current_page + 1)
                                                    ) {
                                                        const pageLink = links.find(link => link.label === page.toString());
                                                        const url = pageLink ? pageLink.url : `?page=${page}`;
                                                        
                                                        return (
                                                            <Link
                                                                key={page}
                                                                href={url}
                                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-200 ${
                                                                    current_page === page
                                                                        ? 'z-10 bg-gradient-to-r from-emerald-500 to-green-600 border-emerald-500 text-white shadow-lg'
                                                                        : 'bg-white/80 backdrop-blur-sm border-gray-300 text-gray-500 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50'
                                                                }`}
                                                            >
                                                                {page}
                                                            </Link>
                                                        );
                                                    } else if (page === current_page - 2 || page === current_page + 2) {
                                                        return (
                                                            <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white/80 backdrop-blur-sm text-sm font-medium text-gray-700">
                                                                ...
                                                            </span>
                                                        );
                                                    }
                                                    return null;
                                                })}

                                                {/* Next Page Link */}
                                                {current_page < last_page && next_page_url ? (
                                                    <Link
                                                        href={next_page_url}
                                                        className="relative inline-flex items-center px-3 py-2 rounded-r-xl border border-gray-300 bg-white/80 backdrop-blur-sm text-sm font-medium text-gray-500 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-200"
                                                    >
                                                        <span className="sr-only">Next</span>
                                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </Link>
                                                ) : (
                                                    <span className="relative inline-flex items-center px-3 py-2 rounded-r-xl border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400 cursor-not-allowed">
                                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

{/* View Details Modal - Landscape Style */}
{isViewModalOpen && selectedLeave && (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 w-full max-w-6xl max-h-[85vh] overflow-hidden"
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex-shrink-0 p-6 border-b border-gray-200/50">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                            Leave Request Details
                        </h3>
                        <button
                            onClick={handleCloseModals}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content - Landscape Layout */}
                <div className="flex-1 overflow-hidden">
                    <div className="grid grid-cols-2 h-full">
                        {/* Left Column - Basic Information */}
                        <div className="border-r border-gray-200/50 overflow-y-auto p-6">
                            <div className="space-y-6">
                                {/* Leave Type & Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-r from-emerald-50 to-green-50/30 p-4 rounded-xl border border-emerald-100">
                                        <label className="block text-sm font-semibold text-emerald-800 mb-2">Leave Type</label>
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r ${getLeaveTypeColor(selectedLeave.leave_type?.code)}`}>
                                                <span className="text-white text-lg">
                                                    {getLeaveTypeIcon(selectedLeave.leave_type?.code)}
                                                </span>
                                            </div>
                                            <p className="text-lg font-semibold text-gray-900">{selectedLeave.leave_type?.name}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-emerald-50 to-green-50/30 p-4 rounded-xl border border-emerald-100">
                                        <label className="block text-sm font-semibold text-emerald-800 mb-2">Status</label>
                                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-sm ${getStatusColor(selectedLeave.status)}`}>
                                            {getStatusText(selectedLeave.status)}
                                        </span>
                                        {selectedLeave.is_recalled && (
                                            <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200">
                                                Recalled
                                            </span>
                                        )}
                                    </div>
                                </div>

{/* Selected Dates - Only show the actual selected dates in boxes */}
<div className="bg-white/50 p-4 rounded-xl border border-gray-200/50">
    <label className="block text-sm font-semibold text-gray-700 mb-3">
        Selected Dates ({selectedLeave.total_days} day{selectedLeave.total_days !== 1 ? 's' : ''})
    </label>
    
    {selectedLeave.selected_dates && selectedLeave.selected_dates.length > 0 ? (
        <div className="space-y-3">
            {/* Show ONLY the selected dates in boxes */}
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {selectedLeave.selected_dates.map((date, index) => (
                    <div 
                        key={index}
                        className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 text-center"
                    >
                        <div className="text-sm text-blue-600 font-semibold">
                            {new Date(date).toLocaleDateString('en-US', { 
                                weekday: 'short'
                            })}
                        </div>
                        <div className="text-xs text-blue-800 mt-1">
                            {new Date(date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Only show total count */}
            <div className="text-center text-xs text-gray-600 pt-2 border-t border-gray-200">
                {selectedLeave.selected_dates.length} date{selectedLeave.selected_dates.length !== 1 ? 's' : ''} selected
            </div>
        </div>
    ) : (
        /* When no selected dates exist, show a simple message */
        <div className="text-center text-gray-500 py-4">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Date range: {new Date(selectedLeave.date_from).toLocaleDateString()} - {new Date(selectedLeave.date_to).toLocaleDateString()}</p>
        </div>
    )}
</div>

                                {/* Duration */}
                                <div className="bg-white/50 p-4 rounded-xl border border-gray-200/50">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <div className="font-semibold text-blue-800 text-sm mb-1">Total Days</div>
                                            <div className="text-2xl font-bold text-blue-600">{selectedLeave.total_days}</div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-green-800 text-sm mb-1">With Pay</div>
                                            <div className="text-2xl font-bold text-green-600">{selectedLeave.days_with_pay}</div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-orange-800 text-sm mb-1">Without Pay</div>
                                            <div className="text-2xl font-bold text-orange-600">{selectedLeave.days_without_pay}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reason */}
                                <div className="bg-white/50 p-4 rounded-xl border border-gray-200/50">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                                    <p className="text-gray-900">{selectedLeave.reason}</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Balance Information & Details */}
                        <div className="overflow-y-auto p-6">
                            <div className="space-y-6">
                                {/* Leave Balance Information */}
                                {selectedLeave.status === 'approved' && (
                                    <div>
                                        <h4 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent mb-4">
                                            Leave Balance Information
                                        </h4>
                                        
                                        {['SL', 'VL'].includes(selectedLeave.leave_type?.code) ? (
                                            // For SL and VL - Show Leave Credits
                                            <div className="bg-gradient-to-r from-blue-50 to-blue-100/30 p-6 rounded-xl border border-blue-200">
                                                <h5 className="font-bold text-blue-900 mb-4 text-lg">Leave Credits ({selectedLeave.leave_type?.name})</h5>
                                                <div className="grid grid-cols-3 gap-4 text-center">
                                                    <div className="bg-white/80 p-3 rounded-xl border border-blue-200">
                                                        <div className="font-semibold text-blue-800 text-xs mb-1">Before</div>
                                                        <div className="text-xl font-bold text-blue-600">{selectedLeave.balance_before}</div>
                                                    </div>
                                                    <div className="bg-white/80 p-3 rounded-xl border border-red-200">
                                                        <div className="font-semibold text-red-800 text-xs mb-1">Deducted</div>
                                                        <div className="text-xl font-bold text-red-600">-{selectedLeave.days_with_pay}</div>
                                                    </div>
                                                    <div className="bg-white/80 p-3 rounded-xl border border-green-200">
                                                        <div className="font-semibold text-green-800 text-xs mb-1">After</div>
                                                        <div className="text-xl font-bold text-green-600">{selectedLeave.balance_after}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // For other leave types - Show Leave Balance
                                            <div className="bg-gradient-to-r from-green-50 to-green-100/30 p-6 rounded-xl border border-green-200">
                                                <h5 className="font-bold text-green-900 mb-4 text-lg">Leave Balance ({selectedLeave.leave_type?.name})</h5>
                                                <div className="grid grid-cols-3 gap-4 text-center">
                                                    <div className="bg-white/80 p-3 rounded-xl border border-green-200">
                                                        <div className="font-semibold text-green-800 text-xs mb-1">Before</div>
                                                        <div className="text-xl font-bold text-green-600">{selectedLeave.balance_before}</div>
                                                    </div>
                                                    <div className="bg-white/80 p-3 rounded-xl border border-red-200">
                                                        <div className="font-semibold text-red-800 text-xs mb-1">Used</div>
                                                        <div className="text-xl font-bold text-red-600">-{selectedLeave.days_with_pay}</div>
                                                    </div>
                                                    <div className="bg-white/80 p-3 rounded-xl border border-blue-200">
                                                        <div className="font-semibold text-blue-800 text-xs mb-1">After</div>
                                                        <div className="text-xl font-bold text-blue-600">{selectedLeave.balance_after}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Additional Details */}
                                {selectedLeave.details && selectedLeave.details.length > 0 && (
                                    <div>
                                        <h4 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent mb-4">
                                            Additional Information
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedLeave.details.map((detail, index) => (
                                                <div key={index} className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-gray-200/50">
                                                    <span className="font-semibold text-gray-700 capitalize text-sm">
                                                        {detail.field_name.replace(/_/g, ' ')}:
                                                    </span>
                                                    <span className="text-gray-900 font-medium text-sm">{detail.field_value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Approvals */}
                                {selectedLeave.approvals && selectedLeave.approvals.length > 0 && (
                                    <div>
                                        <h4 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent mb-4">
                                            Approval History
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedLeave.approvals.map((approval, index) => (
                                                <div key={index} className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-gray-200/50">
                                                    <div>
                                                        <span className="font-semibold text-gray-700 capitalize text-sm">
                                                            {approval.role.replace(/_/g, ' ')}:
                                                        </span>
                                                        <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            approval.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {approval.status}
                                                        </span>
                                                    </div>
                                                    <span className="text-gray-500 text-xs">
                                                        {approval.approved_at ? new Date(approval.approved_at).toLocaleDateString() : 'Pending'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 p-6 border-t border-gray-200/50">
                    <div className="flex justify-end">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCloseModals}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-base font-semibold rounded-xl shadow-lg hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200"
                        >
                            Close
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    </div>
)}


            {/* Apply Reschedule Modal - Landscape Style */}
{/* Apply Reschedule Modal - Landscape Style */}
{isRescheduleModalOpen && selectedLeave && (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 w-full max-w-7xl h-[90vh] flex flex-col" // Changed to fixed height and flex-col
        >
            {/* Header - Fixed */}
            <div className="flex-shrink-0 p-6 border-b border-gray-200/50">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                        Apply Reschedule
                    </h3>
                    <button
                        onClick={handleCloseModals}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-hidden">
                <div className="grid grid-cols-3 h-full">
                    {/* Left Column - Original Leave Info */}
                    <div className="border-r border-gray-200/50 overflow-y-auto p-6">
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100/30 p-4 rounded-xl border border-blue-200">
                                <h4 className="text-lg font-semibold text-blue-900 mb-3">Original Leave Request</h4>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <span className="font-medium text-blue-800">Leave Type:</span>
                                        <span className="ml-2 text-blue-900">{selectedLeave.leave_type?.name}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-blue-800">Original Dates:</span>
                                        <span className="ml-2 text-blue-900">
                                            {new Date(selectedLeave.date_from).toLocaleDateString()} - {new Date(selectedLeave.date_to).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-blue-800">Duration:</span>
                                        <span className="ml-2 text-blue-900">{selectedLeave.total_days} days</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-blue-800">Reason:</span>
                                        <span className="ml-2 text-blue-900">{selectedLeave.reason}</span>
                                    </div>
                                </div>
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800 font-medium">
                                        📝 <strong>Note:</strong> Select exactly <strong>{selectedLeave.total_days} date(s)</strong>
                                    </p>
                                </div>
                            </div>

                            {/* Selected Dates Preview */}
                            <div className="bg-gradient-to-r from-green-50 to-green-100/30 p-4 rounded-xl border border-green-200">
                                <div className="flex justify-between items-center mb-3">
                                    <h5 className="font-semibold text-green-900 text-sm">
                                        Selected Dates ({selectedDates.length}/{selectedLeave.total_days})
                                    </h5>
                                    <button
                                        onClick={clearAllDates}
                                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto"> {/* Added max height and scroll */}
                                    {selectedDates.length > 0 ? (
                                        selectedDates.map((date) => (
                                            <div key={date} className="flex justify-between items-center bg-white border border-green-300 rounded-lg p-2">
                                                <span className="text-sm text-green-800">
                                                    {new Date(date).toLocaleDateString()}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveDate(date)}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-2">No dates selected yet</p>
                                    )}
                                </div>
                                {selectedDates.length === selectedLeave.total_days && (
                                    <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded-lg">
                                        <p className="text-sm text-green-800 text-center">
                                            ✅ Perfect! Selected {selectedLeave.total_days} date(s).
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Reschedule Reason */}
                            <div className="bg-white/50 p-4 rounded-xl border border-gray-200/50">
                                <label htmlFor="rescheduleReason" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reason for Reschedule *
                                </label>
                                <textarea
                                    id="rescheduleReason"
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    placeholder="Please explain why you need to reschedule this leave..."
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm"
                                    required
                                />
                                {errors.reason && (
                                    <p className="text-red-600 text-sm mt-1">{errors.reason}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Middle & Right Columns - Calendar */}
                    <div className="col-span-2 border-r border-gray-200/50 overflow-y-auto p-6">
                        <h4 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent mb-4">
                            Select New Dates
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-6">
                            {Object.entries(groupedDates).map(([monthYear, dates]) => (
                                <div key={monthYear} className="bg-white/50 p-4 rounded-xl border border-gray-200/50">
                                    <h6 className="font-semibold text-gray-900 mb-3 text-sm">{monthYear}</h6>
                                    <div className="grid grid-cols-7 gap-1">
                                        {/* Day headers */}
                                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(day => (
                                            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-1">
                                                {day}
                                            </div>
                                        ))}
                                        
                                        {/* Date cells */}
                                        {dates.map((date) => {
                                            const dateString = date.toISOString().split('T')[0];
                                            const isSelected = selectedDates.includes(dateString);
                                            const isToday = date.toDateString() === new Date().toDateString();
                                            const isDisabled = selectedDates.length >= selectedLeave.total_days && !isSelected;
                                            
                                            return (
                                                <button
                                                    key={dateString}
                                                    onClick={() => handleDateSelect(date)}
                                                    disabled={isDisabled}
                                                    className={`p-2 rounded text-xs font-medium transition-all duration-200 ${
                                                        isSelected
                                                            ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg transform scale-105'
                                                            : isToday
                                                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                            : isDisabled
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {date.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer - Fixed */}
            <div className="flex-shrink-0 p-6 border-t border-gray-200/50 bg-white/80 backdrop-blur-sm">
                <div className="flex justify-end space-x-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCloseModals}
                        disabled={processing}
                        className="px-6 py-3 bg-gray-600 text-white text-base font-semibold rounded-xl shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSubmitReschedule}
                        disabled={selectedDates.length !== selectedLeave.total_days || !data.reason.trim() || processing}
                        className={`px-6 py-3 text-base font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                            selectedDates.length !== selectedLeave.total_days || !data.reason.trim() || processing
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500'
                        }`}
                    >
                        {processing ? 'Submitting...' : 'Submit Reschedule Request'}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    </div>
)}

           {/* Reschedule History Modal - Landscape Style */}
{isRescheduleHistoryModalOpen && selectedLeave && (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 w-full max-w-7xl max-h-[80vh] overflow-hidden"
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex-shrink-0 p-6 border-b border-gray-200/50">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                            Reschedule History
                        </h3>
                        <button
                            onClick={handleCloseModals}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content - Landscape Layout */}
                <div className="flex-1 overflow-hidden">
                    <div className="grid grid-cols-3 h-full">
                        {/* Left Column - Original Leave Info */}
                        <div className="border-r border-gray-200/50 overflow-y-auto p-6">
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100/30 p-4 rounded-xl border border-blue-200">
                                <h4 className="text-lg font-semibold text-blue-900 mb-3">Original Leave Request</h4>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <span className="font-medium text-blue-800">Leave Type:</span>
                                        <span className="ml-2 text-blue-900">{selectedLeave.leave_type?.name}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-blue-800">Current Dates:</span>
                                        <span className="ml-2 text-blue-900">
                                            {new Date(selectedLeave.date_from).toLocaleDateString()} - {new Date(selectedLeave.date_to).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-blue-800">Duration:</span>
                                        <span className="ml-2 text-blue-900">{selectedLeave.total_days} days</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-blue-800">Status:</span>
                                        <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLeave.status)}`}>
                                            {getStatusText(selectedLeave.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle & Right Columns - Reschedule History */}
                        <div className="col-span-2 overflow-y-auto p-6">
                            <h4 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent mb-4">
                                Reschedule Requests ({selectedLeave.all_reschedule_requests?.length || 0})
                            </h4>

                            {!selectedLeave.all_reschedule_requests || selectedLeave.all_reschedule_requests.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-xl">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600">No reschedule history found.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                                    {selectedLeave.all_reschedule_requests.map((reschedule, index) => (
                                        <div key={reschedule.id} className="bg-white/50 p-4 rounded-xl border border-gray-200/50">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h5 className="font-semibold text-gray-900">
                                                        Request #{index + 1}
                                                    </h5>
                                                    <p className="text-sm text-gray-600">
                                                        Submitted: {new Date(reschedule.submitted_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRescheduleStatusColor(reschedule.status)}`}>
                                                    {getRescheduleStatusText(reschedule.status)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Proposed Dates */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Proposed Dates
                                                    </label>
                                                    <div className="space-y-1">
                                                        {Array.isArray(reschedule.proposed_dates) && reschedule.proposed_dates.map((date, dateIndex) => (
                                                            <div
                                                                key={dateIndex}
                                                                className="text-sm bg-blue-50 text-blue-800 p-2 rounded border border-blue-200"
                                                            >
                                                                {new Date(date).toLocaleDateString()}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Reason & Remarks */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Reason
                                                    </label>
                                                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mb-3">{reschedule.reason}</p>
                                                    
                                                    {reschedule.hr_remarks && (
                                                        <div className="mb-2">
                                                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                                HR Remarks
                                                            </label>
                                                            <p className="text-xs text-gray-900 bg-green-50 p-2 rounded">{reschedule.hr_remarks}</p>
                                                        </div>
                                                    )}
                                                    
                                                    {reschedule.dept_head_remarks && (
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                                Dept Head Remarks
                                                            </label>
                                                            <p className="text-xs text-gray-900 bg-orange-50 p-2 rounded">{reschedule.dept_head_remarks}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 p-6 border-t border-gray-200/50">
                    <div className="flex justify-end">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCloseModals}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-base font-semibold rounded-xl shadow-lg hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200"
                        >
                            Close
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    </div>
)}
        </EmployeeLayout>
    );
}