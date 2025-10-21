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

    // DEBUG: Check the complete employee object structure
    console.log('=== EMPLOYEE DATA DEBUG ===');
    console.log('Full employee object:', employee);
    console.log('Employee keys:', Object.keys(employee || {}));
    console.log('Employee user object:', employee?.user);
    console.log('User keys:', Object.keys(employee?.user || {}));
    
    // Check if role is at different locations
    console.log('employee.role:', employee?.role);
    console.log('employee.user.role:', employee?.user?.role);
    console.log('employee.user_type:', employee?.user_type);
    console.log('employee.user?.user_type:', employee?.user?.user_type);
    
    // Check the page props structure
    console.log('All page props:', usePage().props);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Leave Requests</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Showing {from}-{to} of {total} requests
                    </p>
                </div>
                {/* ADD THIS BUTTON */}
                <Link
                    href={route('employee.leave-history')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Leave History
                </Link>
            </div>

                <motion.div
                    className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Leave Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Progress
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {!hasData ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="mt-2 text-sm font-medium text-gray-900">No leave requests found</p>
                                            <p className="text-sm text-gray-500">Get started by submitting a new leave request.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((request) => {
                                        const startDate = new Date(request.date_from);
                                        const endDate = new Date(request.date_to);
                                        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                                        const isRecalled = request.is_recalled;
                                        const recallData = request.recall_data;

                                        return (
                                            <motion.tr
                                                key={request.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.2 }}
                                                className={`hover:bg-gray-50 ${
                                                    isRecalled ? 'bg-red-50 border-l-4 border-l-red-400' : ''
                                                }`}
                                            >
                                                {/* Leave Details Column */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start space-x-3">
                                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                                            isRecalled ? 'bg-gray-300' : 'bg-blue-100'
                                                        }`}>
                                                            <span className={`text-sm ${
                                                                isRecalled ? 'text-gray-600' : 'text-blue-600'
                                                            }`}>
                                                                {request.leave_type?.code === 'VL' ? '🏖️' :
                                                                 request.leave_type?.code === 'SL' ? '🤒' :
                                                                 request.leave_type?.code === 'MAT' ? '👶' : '📋'}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center space-x-2">
                                                                <p className={`text-sm font-medium ${
                                                                    isRecalled ? 'text-gray-600' : 'text-gray-900'
                                                                }`}>
                                                                    {request.leave_type?.name}
                                                                </p>
                                                                {isRecalled && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                        Recalled
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className={`text-sm ${
                                                                isRecalled ? 'text-gray-500' : 'text-gray-600'
                                                            }`}>
                                                                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Submitted: {new Date(request.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Duration Column */}
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        isRecalled 
                                                            ? 'bg-gray-200 text-gray-700' 
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {duration} day{duration !== 1 ? 's' : ''}
                                                    </span>
                                                </td>

                                                {/* Status Column */}
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        isRecalled
                                                            ? 'bg-red-100 text-red-800'
                                                            : request.status === 'approved'
                                                            ? 'bg-green-100 text-green-800'
                                                            : request.status === 'rejected'
                                                            ? 'bg-red-100 text-red-800'
                                                            : request.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {isRecalled ? 'Recalled' : 
                                                         request.status === 'approved' ? 'Approved' :
                                                         request.status === 'rejected' ? 'Rejected' :
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
                                                        <button
                                                            onClick={() => handleViewRecallDetails(request)}
                                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                                        >
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            Recall Details
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleViewProgress(request)}
                                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                                        >
                                                            View Details
                                                        </button>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                     {/* Pagination - Only show if paginated and multiple pages exist */}
                   {isPaginated && last_page > 1 && (
                        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex justify-between flex-1 sm:hidden">
                                    {current_page > 1 && prev_page_url && (
                                        <Link
                                            href={prev_page_url}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Previous
                                        </Link>
                                    )}
                                    {current_page < last_page && next_page_url && (
                                        <Link
                                            href={next_page_url}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{from}</span> to <span className="font-medium">{to}</span> of{' '}
                                            <span className="font-medium">{total}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            {/* Previous Page Link */}
                                            {current_page > 1 && prev_page_url ? (
                                                <Link
                                                    href={prev_page_url}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                                >
                                                    <span className="sr-only">Previous</span>
                                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </Link>
                                            ) : (
                                                <span className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400 cursor-not-allowed">
                                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
                                                    // Find the link for this page
                                                    const pageLink = links.find(link => link.label === page.toString());
                                                    const url = pageLink ? pageLink.url : `?page=${page}`;
                                                    
                                                    return (
                                                        <Link
                                                            key={page}
                                                            href={url}
                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                current_page === page
                                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            {page}
                                                        </Link>
                                                    );
                                                } else if (page === current_page - 2 || page === current_page + 2) {
                                                    return (
                                                        <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
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
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                                >
                                                    <span className="sr-only">Next</span>
                                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </Link>
                                            ) : (
                                                <span className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400 cursor-not-allowed">
                                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
        </EmployeeLayout>
    );
}