import DeptHeadLayout from '@/Layouts/DeptHeadLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved_by_dept_head: 'bg-blue-100 text-blue-800',
    fully_approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
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

            <div className="min-h-screen bg-gray-50 p-6">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Leave Requests Management</h1>
                            <p className="text-gray-600 mt-1">Manage leave requests for {departmentName} department</p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <p className="text-sm text-gray-500">
                                Showing {leaveRequests.from || 0} to {leaveRequests.to || 0} of {leaveRequests.total || 0} results
                            </p>
                        </div>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash.success && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md shadow-sm">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-green-700">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {flash.error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md shadow-sm">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{flash.error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Filter Tabs */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleStatusChange('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedStatus === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All Requests
                        </button>
                        <button
                            onClick={() => handleStatusChange('pending')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedStatus === 'pending'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => handleStatusChange('approved_by_dept_head')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedStatus === 'approved_by_dept_head'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Approved by Dept Head
                        </button>
                        {/* <button
                            onClick={() => handleStatusChange('fully_approved')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedStatus === 'fully_approved'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Fully Approved
                        </button> */}
                        <button
                            onClick={() => handleStatusChange('rejected')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedStatus === 'rejected'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Rejected
                        </button>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employee
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Leave Type
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Dates
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentPageRequests.length > 0 ? (
                                    currentPageRequests.map((request) => {
                                        const status = getRequestStatus(request);
                                        return (
                                            <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{request.employee_name}</div>
                                                            <div className="text-sm text-gray-500">{request.position}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{request.leave_type}</div>
                                                    <div className="text-sm text-gray-500">({request.leave_type_code})</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {formatDate(request.date_from)} to {formatDate(request.date_to)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{request.total_days} days</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
                                                        {statusLabels[status]}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {rejectingId === request.id ? (
                                                        <div className="space-y-2">
                                                            <textarea
                                                                value={rejectRemarks}
                                                                onChange={(e) => setRejectRemarks(e.target.value)}
                                                                className="w-full border rounded p-2 text-sm"
                                                                placeholder="Enter rejection reason (required)"
                                                                rows={3}
                                                                required
                                                            />
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => handleReject(request.id)}
                                                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                                                >
                                                                    Confirm Reject
                                                                </button>
                                                                <button
                                                                    onClick={() => setRejectingId(null)}
                                                                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end space-x-3">
                                                         {status === 'pending' && (
    <>
        <button
            onClick={() => handleApprove(request.id)}
            className="text-green-600 hover:text-green-900 transition-colors flex items-center"
        >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Approve
        </button>
        <button
            onClick={() => setRejectingId(request.id)}
            className="text-red-600 hover:text-red-900 transition-colors flex items-center"
        >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Reject
        </button>
    </>
)}
                                                            <button
                                                                onClick={() => router.visit(route('dept_head.leave-requests.show', request.id))}
                                                                className="text-blue-600 hover:text-blue-900 transition-colors flex items-center"
                                                            >
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 15.5v-11a2 2 0 012-2h16a2 2 0 012 2v11a2 2 0 01-2 2H4a2 2 0 01-2-2z" />
                                                                </svg>
                                                                View
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests found</h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {selectedStatus === 'all' 
                                                    ? 'There are no leave requests in your department.' 
                                                    : `There are no ${statusLabels[selectedStatus]?.toLowerCase()} leave requests.`}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {leaveRequests.data && leaveRequests.data.length > 0 && (
                        <div className="bg-white px-6 py-4 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-semibold">{leaveRequests.from}</span> to <span className="font-semibold">{leaveRequests.to}</span> of{' '}
                                    <span className="font-semibold">{leaveRequests.total}</span> results
                                </div>
                                <div className="flex space-x-1">
                                    {/* Previous Button */}
                                    {leaveRequests.prev_page_url && (
                                        <button
                                            onClick={() => router.visit(leaveRequests.prev_page_url, { preserveState: true, preserveScroll: true })}
                                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
                                        >
                                            Previous
                                        </button>
                                    )}

                                    {/* Page Numbers */}
                                    {leaveRequests.links.slice(1, -1).map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true })}
                                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                link.active
                                                    ? 'bg-blue-600 text-white border border-blue-600'
                                                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}

                                    {/* Next Button */}
                                    {leaveRequests.next_page_url && (
                                        <button
                                            onClick={() => router.visit(leaveRequests.next_page_url, { preserveState: true, preserveScroll: true })}
                                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
                                        >
                                            Next
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