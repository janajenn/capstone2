import DeptHeadLayout from '@/Layouts/DeptHeadLayout';
import { usePage, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';

const getStatusColor = (status) => {
  switch (status) {
    case 'dept_approved':
      return 'bg-green-100 text-green-800';
    case 'dept_rejected':
      return 'bg-red-100 text-red-800';
    case 'approved':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function LeaveRequests() {
    const { props } = usePage();
    const { leaveRequests, filters, departmentName } = props;
    
    const [selectedRequests, setSelectedRequests] = useState([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkAction, setBulkAction] = useState('');
    const [bulkRemarks, setBulkRemarks] = useState('');
    
    const { post } = useForm();

    const handleFilter = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        router.get('/dept-head/leave-requests', newFilters, { preserveState: true });
    };

    const handleApprove = (id) => {
        Swal.fire({
            title: 'Approve Leave Request?',
            text: 'This will approve the leave request for your department.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Approve',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                post(`/dept-head/leave-requests/${id}/approve`, {
                    onSuccess: () => {
                        Swal.fire('Approved!', 'Leave request has been approved.', 'success');
                    }
                });
            }
        });
    };

    const handleReject = (id) => {
        Swal.fire({
            title: 'Reject Leave Request?',
            text: 'Please provide a reason for rejection:',
            input: 'textarea',
            inputPlaceholder: 'Enter rejection reason...',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to provide a reason for rejection!';
                }
            },
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Reject',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                post(`/dept-head/leave-requests/${id}/reject`, {
                    data: { remarks: result.value },
                    onSuccess: () => {
                        Swal.fire('Rejected!', 'Leave request has been rejected.', 'success');
                    }
                });
            }
        });
    };

    const handleBulkAction = () => {
        if (selectedRequests.length === 0) {
            Swal.fire('No Selection', 'Please select at least one request.', 'warning');
            return;
        }

        if (bulkAction === 'reject' && !bulkRemarks.trim()) {
            Swal.fire('Missing Reason', 'Please provide a reason for rejection.', 'warning');
            return;
        }

        const actionText = bulkAction === 'approve' ? 'approve' : 'reject';
        Swal.fire({
            title: `Bulk ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}?`,
            text: `This will ${actionText} ${selectedRequests.length} leave request(s).`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: bulkAction === 'approve' ? '#10B981' : '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: `Yes, ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                post('/dept-head/leave-requests/bulk-action', {
                    data: {
                        action: bulkAction,
                        request_ids: selectedRequests,
                        remarks: bulkRemarks
                    },
                    onSuccess: () => {
                        setSelectedRequests([]);
                        setShowBulkModal(false);
                        setBulkAction('');
                        setBulkRemarks('');
                        Swal.fire('Success!', `Leave requests have been ${actionText}ed.`, 'success');
                    }
                });
            }
        });
    };

    const toggleSelectAll = () => {
        if (selectedRequests.length === leaveRequests.data.length) {
            setSelectedRequests([]);
        } else {
            setSelectedRequests(leaveRequests.data.map(req => req.id));
        }
    };

    const toggleSelect = (id) => {
        if (selectedRequests.includes(id)) {
            setSelectedRequests(selectedRequests.filter(reqId => reqId !== id));
        } else {
            setSelectedRequests([...selectedRequests, id]);
        }
    };

    return (
        <DeptHeadLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Department Leave Requests</h1>
                <p className="text-gray-600">Review and process HR-approved leave requests for {departmentName}</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={filters?.status || 'all'}
                            onChange={(e) => handleFilter('status', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">HR Approved (Pending Review)</option>
                            <option value="dept_approved">Department Approved</option>
                            <option value="dept_rejected">Department Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                        <input
                            type="date"
                            value={filters?.date_from || ''}
                            onChange={(e) => handleFilter('date_from', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                        <input
                            type="date"
                            value={filters?.date_to || ''}
                            onChange={(e) => handleFilter('date_to', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Employee</label>
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={filters?.search || ''}
                            onChange={(e) => handleFilter('search', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedRequests.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <span className="text-blue-800">
                            {selectedRequests.length} request(s) selected
                        </span>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setShowBulkModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Bulk Actions
                            </button>
                            <button
                                onClick={() => setSelectedRequests([])}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Requests Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedRequests.length === leaveRequests.data.length && leaveRequests.data.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Leave Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dates
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    HR Approved
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leaveRequests.data.length > 0 ? (
                                leaveRequests.data.map((request) => (
                                    <tr key={request.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedRequests.includes(request.id)}
                                                onChange={() => toggleSelect(request.id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {request.employee?.first_name} {request.employee?.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {request.employee?.department?.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{request.leave_type?.name}</div>
                                            <div className="text-sm text-gray-500">{request.leave_type?.code}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(request.date_from)} - {formatDate(request.date_to)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                                                {request.status === 'approved' ? 'HR Approved' : 
                                                 request.status === 'dept_approved' ? 'Dept Approved' :
                                                 request.status === 'dept_rejected' ? 'Dept Rejected' :
                                                 request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(request.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => router.visit(`/dept-head/leave-requests/${request.id}`)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    View
                                                </button>
                                                {request.status === 'approved' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(request.id)}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(request.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                        No leave requests found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {leaveRequests.links && leaveRequests.links.length > 3 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 flex justify-between sm:hidden">
                                {leaveRequests.prev_page_url && (
                                    <a
                                        href={leaveRequests.prev_page_url}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Previous
                                    </a>
                                )}
                                {leaveRequests.next_page_url && (
                                    <a
                                        href={leaveRequests.next_page_url}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Next
                                    </a>
                                )}
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing{' '}
                                        <span className="font-medium">{leaveRequests.from}</span>
                                        {' '}to{' '}
                                        <span className="font-medium">{leaveRequests.to}</span>
                                        {' '}of{' '}
                                        <span className="font-medium">{leaveRequests.total}</span>
                                        {' '}results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        {leaveRequests.links.map((link, index) => (
                                            <a
                                                key={index}
                                                href={link.url}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                    link.active
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                } ${index === 0 ? 'rounded-l-md' : ''} ${index === leaveRequests.links.length - 1 ? 'rounded-r-md' : ''}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Action Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Action</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                                <select
                                    value={bulkAction}
                                    onChange={(e) => setBulkAction(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Action</option>
                                    <option value="approve">Approve</option>
                                    <option value="reject">Reject</option>
                                </select>
                            </div>
                            {bulkAction === 'reject' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
                                    <textarea
                                        value={bulkRemarks}
                                        onChange={(e) => setBulkRemarks(e.target.value)}
                                        rows="3"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter reason for rejection..."
                                    />
                                </div>
                            )}
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowBulkModal(false);
                                        setBulkAction('');
                                        setBulkRemarks('');
                                    }}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBulkAction}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Execute
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DeptHeadLayout>
    );
}
