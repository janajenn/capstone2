import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { usePage, Link } from '@inertiajs/react';
import LeaveProgressTracker from '../Employee/LeaveProgressTracker';
import LeaveRecallModal from '@/Components/LeaveRecallModal';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function MyLeaveRequests() {
    const { leaveRequests, employee } = usePage().props;
    const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
    const [selectedLeaveRequest, setSelectedLeaveRequest] = useState(null);

    // Debug: Log the structure of leaveRequests
    useEffect(() => {
        console.log('leaveRequests structure:', leaveRequests);
    }, [leaveRequests]);

    const handleRecallClick = (leaveRequest) => {
        setSelectedLeaveRequest(leaveRequest);
        setIsRecallModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsRecallModalOpen(false);
        setSelectedLeaveRequest(null);
    };

    // Safe data extraction for Laravel pagination structure
    const getPaginationData = () => {
        if (!leaveRequests) {
            return {
                data: [],
                from: 0,
                to: 0,
                total: 0,
                current_page: 1,
                last_page: 1,
                links: []
            };
        }

        // Laravel pagination structure (no 'meta' property)
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

        // If it's a simple array (non-paginated)
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Leave Requests</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Showing {from}-{to} of {total} requests
                        </p>
                    </div>
                    <a
                        href={route('employee.leave-recalls')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        View Leave Recalls
                    </a>
                </div>

                <motion.div
                    className="bg-white shadow-sm rounded-lg overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval Progress</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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

                                        return (
                                            <motion.tr
                                                key={request.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.2 }}
                                                whileHover={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                                                            <span className="text-blue-600">
                                                                {request.leave_type?.code === 'VL' ? '🏖️' :
                                                                 request.leave_type?.code === 'SL' ? '🤒' :
                                                                 request.leave_type?.code === 'MAT' ? '👶' : '📋'}
                                                            </span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{request.leave_type?.name || 'N/A'}</div>
                                                            <div className="text-sm text-gray-500">{request.leave_type?.code || 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Submitted on {new Date(request.created_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {duration} day{duration !== 1 ? 's' : ''}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <LeaveProgressTracker approvals={request.approvals} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex flex-col space-y-1">
                                                        {request.status === 'approved' && !request.recalls?.some(recall => recall.status === 'approved') && (
                                                            <button
                                                                onClick={() => handleRecallClick(request)}
                                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                                                            >
                                                                Recall Leave
                                                            </button>
                                                        )}
                                                        {request.recalls?.some(recall => recall.status === 'approved') && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                                                </svg>
                                                                Recalled
                                                            </span>
                                                        )}
                                                        {request.recalls?.some(recall => recall.status === 'pending') && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Recall Pending
                                                            </span>
                                                        )}
                                                        {request.recalls?.some(recall => recall.status === 'rejected') && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                                Recall Rejected
                                                            </span>
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

            {/* Leave Recall Modal */}
            <LeaveRecallModal
                isOpen={isRecallModalOpen}
                onClose={handleCloseModal}
                leaveRequest={selectedLeaveRequest}
                employee={employee}
            />
        </EmployeeLayout>
    );
}