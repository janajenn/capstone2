import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm, router, Link } from "@inertiajs/react";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

const statusColors = {
    pending_to_admin: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
};

const statusLabels = {
    pending_to_admin: 'Pending Admin Approval',
    approved: 'Fully Approved',
    rejected: 'Rejected'
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export default function LeaveRequests({ leaveRequests, filters, flash, currentApprover, isActiveApprover }) {
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectRemarks, setRejectRemarks] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'pending_to_admin');

    // Handle tab change
    const handleTabChange = (status) => {
        setSelectedStatus(status);
        router.get(route('admin.leave-requests.index'), { status }, {
            preserveState: true,
            replace: true
        });
    };

    const handleApprove = (id) => {
        Swal.fire({
            title: "Approve this leave request?",
            text: "This will approve the leave request and deduct leave credits if applicable",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, approve",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.leave-requests.approve', id), {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire(
                            "Approved!",
                            "The leave request has been approved.",
                            "success"
                        );
                        // Refresh the page to update the list
                        router.reload({ only: ['leaveRequests'] });
                    },
                    onError: (errors) => {
                        console.error('Approval error:', errors);
                        let errorMessage = "There was a problem approving the request";

                        if (errors.error) {
                            errorMessage = errors.error;
                        } else if (errors.message) {
                            errorMessage = errors.message;
                        }

                        Swal.fire("Error", errorMessage, "error");
                    },
                });
            }
        });
    };

    const handleReject = (id) => {
        if (!rejectRemarks.trim()) {
            Swal.fire("Error", "Please enter rejection remarks", "error");
            return;
        }

        router.post(route('admin.leave-requests.reject', id), {
            remarks: rejectRemarks
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectingId(null);
                setRejectRemarks("");
                Swal.fire("Rejected!", "The leave request has been rejected.", "success");
                // Refresh the page to update the list
                router.reload({ only: ['leaveRequests'] });
            },
            onError: (errors) => {
                console.error('Rejection error:', errors);
                let errorMessage = "There was a problem rejecting the request";
                
                if (errors.remarks) {
                    errorMessage = errors.remarks[0];
                } else if (errors.error) {
                    errorMessage = errors.error;
                } else if (errors.message) {
                    errorMessage = errors.message;
                }
                
                Swal.fire("Error", errorMessage, "error");
            },
        });
    };

    const getRequestStatus = (request) => {
        // If we're in the pending_to_admin tab and there's no admin approval yet,
        // show it as pending_to_admin regardless of the database status
        if (selectedStatus === 'pending_to_admin' && !request.admin_approval) {
            return 'pending_to_admin';
        }
        
        // Otherwise, use the actual status from the database
        return request.status;
    };

    // Show unauthorized message if user is not active approver
    if (!isActiveApprover) {
        return (
            <AdminLayout>
                <Head title="Leave Requests Management" />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
                            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        
                        <h2 className="mt-4 text-xl font-bold text-gray-900">Approval Rights Delegated</h2>
                        
                        <p className="mt-2 text-gray-600">
                            You are not currently authorized to approve leave requests.
                        </p>
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                                <strong>Current Approver:</strong> {currentApprover.name}
                            </p>
                            {currentApprover.is_primary && (
                                <span className="inline-block mt-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                                    Primary Admin
                                </span>
                            )}
                        </div>
                        
                        <div className="mt-6 space-y-3">
                            <button
                                onClick={() => router.visit(route('admin.delegation.index'))}
                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Manage Delegation
                            </button>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Head title="Leave Requests Management" />
            <div className="min-h-screen bg-gray-50 p-6">
                {/* Header with current approver status */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Leave Requests Management</h1>
                            <p className="text-gray-600 mt-1">Manage all leave requests in the system</p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-800">
                                            You are currently the active approver
                                        </p>
                                        <p className="text-xs text-green-600">
                                            {currentApprover.is_primary ? 'Primary Admin' : 'Delegated Approver'}
                                        </p>
                                    </div>
                                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
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
                            onClick={() => handleTabChange('pending_to_admin')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedStatus === 'pending_to_admin'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Pending to Admin
                            {selectedStatus === 'pending_to_admin' && leaveRequests.data && leaveRequests.data.length > 0 && (
                                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                    {leaveRequests.total}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('fully_approved')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedStatus === 'fully_approved'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Fully Approved
                            {selectedStatus === 'fully_approved' && leaveRequests.data && leaveRequests.data.length > 0 && (
                                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    {leaveRequests.total}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('rejected')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedStatus === 'rejected'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Rejected
                            {selectedStatus === 'rejected' && leaveRequests.data && leaveRequests.data.length > 0 && (
                                <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                    {leaveRequests.total}
                                </span>
                            )}
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
                                        HR Certification
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Dept Head Approval
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
                                {leaveRequests.data && leaveRequests.data.length > 0 ? (
                                    leaveRequests.data.map((request) => {
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
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {request.employee.firstname} {request.employee.lastname}
                                                            </div>
                                                            <div className="text-sm text-gray-500">{request.employee.department}</div>
                                                            <div className="text-sm text-gray-500">{request.employee.position}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{request.leaveType.name}</div>
                                                    <div className="text-sm text-gray-500">({request.leaveType.code})</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {formatDate(request.date_from)} to {formatDate(request.date_to)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{request.total_days} days</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {request.hr_approval ? (
                                                        <div className="flex flex-col">
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mb-1">
                                                                Certified
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {formatDate(request.hr_approval.approved_at)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {request.dept_head_approval ? (
                                                        <div className="flex flex-col">
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mb-1">
                                                                Approved
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {formatDate(request.dept_head_approval.approved_at)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
                                                        {statusLabels[status]}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {selectedStatus === 'pending_to_admin' && (
                                                        rejectingId === request.id ? (
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
                                                                        onClick={() => {
                                                                            setRejectingId(null);
                                                                            setRejectRemarks("");
                                                                        }}
                                                                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-end space-x-3">
                                                                <button
                                                                    onClick={() => handleApprove(request.id)}
                                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => setRejectingId(request.id)}
                                                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )
                                                    )}
                                                    {(selectedStatus === 'fully_approved' || selectedStatus === 'rejected') && (
                                                        <span className="text-gray-400 text-sm">No actions available</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests found</h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {selectedStatus === 'pending_to_admin' 
                                                    ? 'There are no leave requests pending admin approval.' 
                                                    : selectedStatus === 'fully_approved'
                                                    ? 'There are no fully approved leave requests.'
                                                    : 'There are no rejected leave requests.'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {leaveRequests.data && leaveRequests.data.length > 0 && (
                        <div className="bg-white px-6 py-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{leaveRequests.from}</span> to{' '}
                                    <span className="font-medium">{leaveRequests.to}</span> of{' '}
                                    <span className="font-medium">{leaveRequests.total}</span> results
                                </div>
                                <div className="flex space-x-2">
                                    {/* Previous Page */}
                                    {leaveRequests.prev_page_url ? (
                                        <Link
                                            href={leaveRequests.prev_page_url}
                                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                            preserveState
                                        >
                                            Previous
                                        </Link>
                                    ) : (
                                        <span className="px-3 py-1 text-sm bg-gray-50 text-gray-400 rounded cursor-not-allowed">
                                            Previous
                                        </span>
                                    )}

                                   

                                    {/* Next Page */}
                                    {leaveRequests.next_page_url ? (
                                        <Link
                                            href={leaveRequests.next_page_url}
                                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                            preserveState
                                        >
                                            Next
                                        </Link>
                                    ) : (
                                        <span className="px-3 py-1 text-sm bg-gray-50 text-gray-400 rounded cursor-not-allowed">
                                            Next
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}