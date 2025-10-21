import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { usePage, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function LeaveHistory() {
    const { leaveHistory, employee } = usePage().props;

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
    const { data, from, to, total, current_page, last_page, links, next_page_url, prev_page_url } = paginationData;
    const isPaginated = leaveHistory && leaveHistory.data !== undefined;
    const hasData = data && data.length > 0;

    return (
        <EmployeeLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Leave History</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Showing approved leave requests {from}-{to} of {total}
                        </p>
                    </div>
                    <Link
                        href={route('employee.my-leave-requests')}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150"
                    >
                        Back to Requests
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
                                        Balance Before / After
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Approved Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {!hasData ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="mt-2 text-sm font-medium text-gray-900">No leave history found</p>
                                            <p className="text-sm text-gray-500">Your approved leaves will appear here.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((leave) => {
                                        const startDate = new Date(leave.date_from);
                                        const endDate = new Date(leave.date_to);
                                        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                                        return (
                                            <motion.tr
                                                key={leave.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.2 }}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start space-x-3">
                                                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                                                            <span className="text-sm text-green-600">
                                                                {leave.leave_type?.code === 'VL' ? '🏖️' :
                                                                 leave.leave_type?.code === 'SL' ? '🤒' :
                                                                 leave.leave_type?.code === 'MAT' ? '👶' : '📋'}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {leave.leave_type?.name}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Reason: {leave.reason}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {duration} day{duration !== 1 ? 's' : ''}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-medium">Before: {leave.balance_before}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <span className="font-medium">After: {leave.balance_after}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-900">
                                                        {leave.approved_at ? new Date(leave.approved_at).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Same as your existing pagination */}
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
        </EmployeeLayout>
    );
}