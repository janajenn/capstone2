import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { usePage, Link } from '@inertiajs/react';
import CompactProgressIndicator from '@/Components/CompactProgressIndicator';
import ProgressDetailsModal from '@/Components/ProgressDetailsModal';
import LeaveRecallModal from '@/Components/LeaveRecallModal';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function MyLeaveRequests() {
    const { leaveRequests, employee } = usePage().props;
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedRecallData, setSelectedRecallData] = useState(null);

    const handleViewProgress = (request) => {
        setSelectedRequest(request);
        setIsProgressModalOpen(true);
    };

    const handleViewRecallDetails = (request) => {
        setSelectedRequest(request);
        setSelectedRecallData(request.recall_data);
        setIsRecallModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsProgressModalOpen(false);
        setIsRecallModalOpen(false);
        setSelectedRequest(null);
        setSelectedRecallData(null);
    };

    // Safe data extraction for pagination
    const getPaginationData = () => {
        if (!leaveRequests) {
            return { data: [], from: 0, to: 0, total: 0, current_page: 1, last_page: 1, links: [] };
        }

        if (leaveRequests.data !== undefined) {
            return {
                data: leaveRequests.data || [],
                from: leaveRequests.from || 0,
                to: leaveRequests.to || 0,
                total: leaveRequests.total || 0,
                current_page: leaveRequests.current_page || 1,
                last_page: leaveRequests.last_page || 1,
                links: leaveRequests.links || [],
                next_page_url: leaveRequests.next_page_url || null,
                prev_page_url: leaveRequests.prev_page_url || null
            };
        }

        return {
            data: Array.isArray(leaveRequests) ? leaveRequests : [],
            from: 1,
            to: Array.isArray(leaveRequests) ? leaveRequests.length : 0,
            total: Array.isArray(leaveRequests) ? leaveRequests.length : 0,
            current_page: 1,
            last_page: 1,
            links: []
        };
    };

    const paginationData = getPaginationData();
    const { data, from, to, total, current_page, last_page, links, next_page_url, prev_page_url } = paginationData;
    const isPaginated = leaveRequests && leaveRequests.data !== undefined;
    const hasData = data && data.length > 0;

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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                                        My Leave Requests
                                    </h1>
                                    <p className="text-sm text-gray-600 mt-1 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1 inline-block">
                                        Showing {from}-{to} of {total} requests
                                    </p>
                                </div>
                            </div>
                            
                            <Link
                                href={route('employee.leave-history')}
                                className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 border border-transparent rounded-xl font-semibold text-sm text-white uppercase tracking-wider hover:from-emerald-600 hover:to-green-700 focus:from-emerald-600 focus:to-green-700 active:from-emerald-700 active:to-green-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 focus:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Leave History
                            </Link>
                        </div>
                    </motion.div>

                    {/* INFORMATION BANNER */}
                    <motion.div
                        className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">
                                    Leave Request Tracking
                                </h3>
                                <div className="mt-1 text-sm text-blue-700">
                                    <p>
                                        This page displays the current status of your leave requests. You can track the approval progress and view details, but no actions can be performed here.
                                    </p>
                                    <p className="mt-1 font-medium">
                                        To reschedule or modify leave requests, please visit the <Link href={route('employee.leave-history')} className="underline hover:text-blue-900">Leave History</Link> page.
                                    </p>
                                </div>
                            </div>
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
                                            Progress
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
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No leave requests found</h3>
                                                    <p className="text-gray-600 max-w-sm">Get started by submitting a new leave request through the system.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        data.map((request) => {
                                            const startDate = new Date(request.date_from);
                                            const endDate = new Date(request.date_to);
                                            
                                            // FIXED: Use total_days from backend which now uses selected_dates count
                                            const duration = request.total_days;
                                            
                                            const isRecalled = request.is_recalled;
                                            const recallData = request.recall_data;

                                            return (
                                                <motion.tr
                                                    key={request.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                    className={`hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-green-50/30 transition-all duration-200 ${
                                                        isRecalled ? 'bg-red-50/50 border-l-4 border-l-red-400' : ''
                                                    }`}
                                                >
                                                    {/* Leave Details Column */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-start space-x-4">
                                                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                                                                isRecalled 
                                                                    ? 'bg-gradient-to-r from-gray-400 to-gray-500' 
                                                                    : 'bg-gradient-to-r from-blue-400 to-blue-500'
                                                            }`}>
                                                                <span className="text-white text-lg">
                                                                    {request.leave_type?.code === 'VL' ? '🏖️' :
                                                                     request.leave_type?.code === 'SL' ? '🤒' :
                                                                     request.leave_type?.code === 'MAT' ? '👶' : '📋'}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center space-x-3">
                                                                    <p className={`text-sm font-semibold ${
                                                                        isRecalled ? 'text-gray-700' : 'text-gray-900'
                                                                    }`}>
                                                                        {request.leave_type?.name}
                                                                    </p>
                                                                    {isRecalled && (
                                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200">
                                                                            Recalled
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className={`text-sm ${
                                                                    isRecalled ? 'text-gray-500' : 'text-gray-600'
                                                                } mt-1`}>
                                                                    {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-2 bg-white/50 rounded-full px-2 py-1 inline-block">
                                                                    Submitted: {new Date(request.created_at).toLocaleDateString()}
                                                                </p>
                                                                {/* Show selected dates info */}
                                                                {request.selected_dates_count > 0 && (
                                                                    <p className="text-xs text-blue-600 mt-1 bg-blue-50 rounded-full px-2 py-1 inline-block">
                                                                        {request.selected_dates_count} selected day{request.selected_dates_count !== 1 ? 's' : ''}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Duration Column - FIXED */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col space-y-1">
                                                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
                                                                isRecalled 
                                                                    ? 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700' 
                                                                    : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800'
                                                            }`}>
                                                                {duration} day{duration !== 1 ? 's' : ''}
                                                            </span>
                                                            {/* Show working days if different from total days */}
                                                            {request.calculated_days && request.calculated_days !== duration && (
                                                                <span className="text-xs text-gray-500">
                                                                    ({request.calculated_days} working days)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Status Column */}
<td className="px-6 py-4">
    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
        isRecalled
            ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
            : request.status === 'approved'
            ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
            : request.status === 'rejected'
            ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
            : request.status === 'pending_hr' || request.status === 'pending_dept_head' || request.status === 'pending_admin' || request.status === 'pending'
            ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800'
            : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
    }`}>
        {isRecalled ? 'Recalled' : 
         request.status === 'approved' ? 'Approved' :
         request.status === 'rejected' ? 'Rejected' :
         request.status === 'pending_hr' ? 'Pending HR' :
         request.status === 'pending_dept_head' ? 'Pending Dept Head' :
         request.status === 'pending_admin' ? 'Pending Admin' :
         request.status === 'pending' ? 'Pending' : request.status}
    </span>
</td>

                                                    {/* Progress Column */}
                                                    <td className="px-6 py-4">
                                                        <CompactProgressIndicator 
                                                            approvals={request.approvals} 
                                                            isDeptHead={request.is_dept_head_request || employee?.user?.role === 'dept_head'}
                                                            isAdmin={employee?.user?.role === 'admin'}
                                                            isRecalled={isRecalled}
                                                            onClick={() => isRecalled ? handleViewRecallDetails(request) : handleViewProgress(request)}
                                                        />
                                                    </td>

                                                    {/* Actions Column */}
                                                    <td className="px-6 py-4">
                                                        {isRecalled && recallData ? (
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleViewRecallDetails(request)}
                                                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 border border-transparent text-sm font-medium rounded-xl text-white shadow-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                                                            >
                                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                                Recall Details
                                                            </motion.button>
                                                        ) : (
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleViewProgress(request)}
                                                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 shadow-md hover:shadow-lg"
                                                            >
                                                                View Details
                                                            </motion.button>
                                                        )}
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

                {/* Progress Details Modal */}
                <ProgressDetailsModal
                    isOpen={isProgressModalOpen}
                    onClose={handleCloseModals}
                    leaveRequest={selectedRequest}
                    isRecalled={selectedRequest?.is_recalled}
                    recallData={selectedRequest?.recall_data}
                    employee={employee}
                />

                {/* Leave Recall Modal */}
                <LeaveRecallModal
                    isOpen={isRecallModalOpen}
                    onClose={handleCloseModals}
                    recallData={selectedRecallData}
                    leaveRequest={selectedRequest}
                />
            </div>
        </EmployeeLayout>
    );
}