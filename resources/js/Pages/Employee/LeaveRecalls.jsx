import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { usePage, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function LeaveRecalls() {
    const { leaveRecalls } = usePage().props;

    const getStatusBadge = (status) => {
        const baseClasses = "px-2.5 py-0.5 rounded-full text-xs font-medium";
        
        switch (status) {
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'approved':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'rejected':
                return `${baseClasses} bg-red-100 text-red-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <EmployeeLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Leave Recalls</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Track your leave recall requests and their approval status
                        </p>
                    </div>
                    <Link
                        href={route('employee.my-leave-requests')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Leave Requests
                    </Link>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Leave Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Approved Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        New Date Range
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reason
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Approved By Dept Head
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Approved By HR
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leaveRecalls.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                            No leave recall requests found
                                        </td>
                                    </tr>
                                ) : (
                                    leaveRecalls.map((recall) => (
                                        <motion.tr
                                            key={recall.id}
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
                                                            {recall.leave_request.leave_type.code === 'VL' ? '🏖️' :
                                                             recall.leave_request.leave_type.code === 'SL' ? '🤒' :
                                                             recall.leave_request.leave_type.code === 'MAT' ? '👶' : '📋'}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {recall.leave_request.leave_type.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {recall.leave_request.leave_type.code}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(recall.approved_leave_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {recall.new_leave_date_from && recall.new_leave_date_to
                                                    ? `${formatDate(recall.new_leave_date_from)} - ${formatDate(recall.new_leave_date_to)}`
                                                    : formatDate(recall.new_leave_date_to || recall.new_leave_date_from)
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                                <div className="truncate" title={recall.reason_for_change}>
                                                    {recall.reason_for_change}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={getStatusBadge(recall.status)}>
                                                    {recall.status.charAt(0).toUpperCase() + recall.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {recall.approved_by_depthead ? (
                                                    <div>
                                                        <div className="font-medium">
                                                            {recall.approved_by_depthead.name}
                                                        </div>
                                                        <div className="text-gray-500">
                                                            {formatDate(recall.updated_at)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {recall.approved_by_hr ? (
                                                    <div>
                                                        <div className="font-medium">
                                                            {recall.approved_by_hr.name}
                                                        </div>
                                                        <div className="text-gray-500">
                                                            {formatDate(recall.updated_at)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </EmployeeLayout>
    );
}
