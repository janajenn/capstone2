import DeptHeadLayout from '@/Layouts/DeptHeadLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    approved_by_dept_head: 'bg-blue-100 text-blue-800 border border-blue-200',
    fully_approved: 'bg-green-100 text-green-800 border border-green-200',
    rejected: 'bg-red-100 text-red-800 border border-red-200'
};

const statusLabels = {
    pending: 'Pending',
    approved_by_dept_head: 'Approved by Dept Head',
    fully_approved: 'Fully Approved',
    rejected: 'Rejected'
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export default function LeaveRequests({ leaveRequests, departmentName, filters, flash }) {
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectRemarks, setRejectRemarks] = useState('');
    const { post } = useForm();

    // Handle status filter change
    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        router.get(route('dept_head.leave-requests'), {
            status: status === 'all' ? '' : status
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleApprove = (id) => {
        if (confirm('Are you sure you want to approve this leave request?')) {
            post(route('dept_head.leave-requests.approve', id), {
                onSuccess: () => {
                    // Success handled by flash message
                }
            });
        }
    };

    const handleReject = (id) => {
        if (!rejectRemarks.trim()) {
            alert('Please provide rejection remarks.');
            return;
        }

        post(route('dept_head.leave-requests.reject', id), {
            remarks: rejectRemarks,
            onSuccess: () => {
                setRejectingId(null);
                setRejectRemarks('');
            }
        });
    };

    const getRequestStatus = (request) => {
        // Use the display_status from backend if available, otherwise fall back to calculation
        if (request.display_status) {
            return request.display_status;
        }
        
        // Fallback logic
        if (request.status === 'rejected') return 'rejected';
        if (request.status === 'approved' && request.admin_approval?.status === 'approved') return 'fully_approved';
        if (request.dept_head_approval?.status === 'approved') return 'approved_by_dept_head';
        return 'pending';
    };

    // Filter requests client-side for the current page (optional)
    const currentPageRequests = leaveRequests.data || [];

    return (
        <DeptHeadLayout>
            <Head title="Leave Requests Management" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-amber-50 p-6">
                {/* Animated Background Elements */}
                <div className="fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-yellow-200 to-amber-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-amber-200 to-orange-200 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
                </div>

                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="relative">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent mb-2">
                                Leave Approvals
                            </h1>
                            <p className="text-gray-600 text-lg">Manage leave requests for {departmentName} department</p>
                            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"></div>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <p className="text-sm text-gray-500 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                                Showing <span className="font-semibold text-gray-800">{leaveRequests.from || 0}</span> to{' '}
                                <span className="font-semibold text-gray-800">{leaveRequests.to || 0}</span> of{' '}
                                <span className="font-semibold text-gray-800">{leaveRequests.total || 0}</span> results
                            </p>
                        </div>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash.success && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 mb-6 rounded-2xl shadow-lg backdrop-blur-sm">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 p-2 rounded-xl bg-green-100">
                                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-semibold text-green-800">Success!</p>
                                <p className="text-green-700 mt-1">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {flash.error && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-6 mb-6 rounded-2xl shadow-lg backdrop-blur-sm">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 p-2 rounded-xl bg-red-100">
                                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-semibold text-red-800">Error</p>
                                <p className="text-red-700 mt-1">{flash.error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Filter Tabs */}
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 mb-8">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => handleStatusChange('all')}
                            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                                selectedStatus === 'all'
                                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-yellow-300 shadow-sm'
                            }`}
                        >
                            All Requests
                        </button>
                        <button
                            onClick={() => handleStatusChange('pending')}
                            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                                selectedStatus === 'pending'
                                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-yellow-300 shadow-sm'
                            }`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => handleStatusChange('approved_by_dept_head')}
                            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                                selectedStatus === 'approved_by_dept_head'
                                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-yellow-300 shadow-sm'
                            }`}
                        >
                            Approved by Dept Head
                        </button>
                        <button
                            onClick={() => handleStatusChange('rejected')}
                            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                                selectedStatus === 'rejected'
                                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-yellow-300 shadow-sm'
                            }`}
                        >
                            Rejected
                        </button>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200/50">
                            <thead className="bg-gradient-to-r from-yellow-50 to-amber-50">
                                <tr>
                                    <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Employee
                                    </th>
                                    <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Leave Type
                                    </th>
                                    <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Dates
                                    </th>
                                    <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-8 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white/50 divide-y divide-gray-200/30">
                                {currentPageRequests.length > 0 ? (
                                    currentPageRequests.map((request) => {
                                        const status = getRequestStatus(request);
                                        return (
                                            <tr key={request.id} className="hover:bg-yellow-50/30 transition-all duration-300 group">
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                                            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-semibold text-gray-900 group-hover:text-yellow-700 transition-colors">
                                                                {request.employee_name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">{request.position}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{request.leave_type}</div>
                                                    <div className="text-sm text-gray-500">({request.leave_type_code})</div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 font-medium">
                                                        {formatDate(request.date_from)} to {formatDate(request.date_to)}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">{request.total_days} days</div>
                                                <div className="text-sm text-gray-500">Duration</div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${statusColors[status]} shadow-sm`}>
                                                        {statusLabels[status]}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-medium">
                                                    {rejectingId === request.id ? (
                                                        <div className="space-y-4 bg-red-50/50 p-4 rounded-xl border border-red-200">
                                                            <textarea
                                                                value={rejectRemarks}
                                                                onChange={(e) => setRejectRemarks(e.target.value)}
                                                                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                                                                placeholder="Enter rejection reason (required)"
                                                                rows={3}
                                                                required
                                                            />
                                                            <div className="flex space-x-3 justify-end">
                                                                <button
                                                                    onClick={() => handleReject(request.id)}
                                                                    className="px-6 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                                                                >
                                                                    Confirm Reject
                                                                </button>
                                                                <button
                                                                    onClick={() => setRejectingId(null)}
                                                                    className="px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end space-x-4">
                                                            {status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleApprove(request.id)}
                                                                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center font-medium"
                                                                    >
                                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setRejectingId(request.id)}
                                                                        className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center font-medium"
                                                                    >
                                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button
                                                                onClick={() => router.visit(route('dept_head.leave-requests.show', request.id))}
                                                                className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center font-medium"
                                                            >
                                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 15.5v-11a2 2 0 012-2h16a2 2 0 012 2v11a2 2 0 01-2 2H4a2 2 0 01-2-2z" />
                                                                </svg>
                                                                View Details
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-100 to-amber-100 mb-4">
                                                    <svg className="h-16 w-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900 mb-2">No leave requests found</h3>
                                                <p className="text-gray-600 text-sm">
                                                    {selectedStatus === 'all' 
                                                        ? 'There are no leave requests in your department.' 
                                                        : `There are no ${statusLabels[selectedStatus]?.toLowerCase()} leave requests.`}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {leaveRequests.data && leaveRequests.data.length > 0 && (
                        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-8 py-6 border-t border-yellow-200/50">
                            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                                <div className="text-sm text-gray-700 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                                    Showing <span className="font-semibold text-gray-800">{leaveRequests.from}</span> to{' '}
                                    <span className="font-semibold text-gray-800">{leaveRequests.to}</span> of{' '}
                                    <span className="font-semibold text-gray-800">{leaveRequests.total}</span> results
                                </div>
                                <div className="flex space-x-2">
                                    {/* Previous Button */}
                                    {leaveRequests.prev_page_url && (
                                        <button
                                            onClick={() => router.visit(leaveRequests.prev_page_url, { preserveState: true, preserveScroll: true })}
                                            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all duration-300 transform hover:scale-105 shadow-sm"
                                        >
                                            ← Previous
                                        </button>
                                    )}

                                    {/* Page Numbers */}
                                    {leaveRequests.links.slice(1, -1).map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true })}
                                            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 ${
                                                link.active
                                                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 shadow-sm'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}

                                    {/* Next Button */}
                                    {leaveRequests.next_page_url && (
                                        <button
                                            onClick={() => router.visit(leaveRequests.next_page_url, { preserveState: true, preserveScroll: true })}
                                            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all duration-300 transform hover:scale-105 shadow-sm"
                                        >
                                            Next →
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DeptHeadLayout>
    );
}