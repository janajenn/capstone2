import DeptHeadLayout from '@/Layouts/DeptHeadLayout';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusColor = (status) => {
  switch (status) {
    case 'pending_dept_head':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'approved':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'pending_dept_head':
      return 'Pending Your Approval';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
};

export default function RescheduleRequests({ rescheduleRequests, departmentName, pendingCount, flash, filters }) {
  const { props } = usePage();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [activeTab, setActiveTab] = useState(filters?.status || 'pending');

  const { post } = useForm();

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeTab === 'pending') {
      url.searchParams.delete('status');
    } else {
      url.searchParams.set('status', activeTab);
    }
    router.visit(url.toString(), { preserveState: true, preserveScroll: true });
  }, [activeTab]);

  // Filter requests based on active tab (now handled by backend)
  const filteredRequests = useMemo(() => {
    return rescheduleRequests.data || [];
  }, [rescheduleRequests.data]);

  // Count requests by status (for tab badges)
  const requestCounts = useMemo(() => {
    if (!rescheduleRequests.data) return { pending: 0, approved: 0, rejected: 0 };
    
    return {
      pending: rescheduleRequests.data.filter(request => request.status === 'pending_dept_head').length,
      approved: rescheduleRequests.data.filter(request => request.status === 'approved').length,
      rejected: rescheduleRequests.data.filter(request => request.status === 'rejected').length,
    };
  }, [rescheduleRequests.data]);

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedRequest(null);
    setRejectingId(null);
    setRejectRemarks('');
  };

  const handleApprove = async (requestId) => {
    const result = await Swal.fire({
      title: 'Approve Reschedule Request?',
      text: 'Are you sure you want to approve this reschedule request?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      post(route('dept_head.reschedule-requests.approve', requestId), {}, {
        onSuccess: () => {
          Swal.fire({
            title: 'Approved!',
            text: 'Reschedule request has been approved.',
            icon: 'success',
            confirmButtonColor: '#10B981',
          });
        },
        onError: (errors) => {
          console.error('Approval failed:', errors);
          Swal.fire({
            title: 'Error!',
            text: 'Failed to approve reschedule request. Please try again.',
            icon: 'error',
            confirmButtonColor: '#EF4444',
          });
        }
      });
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectRemarks.trim()) {
      await Swal.fire({
        title: 'Remarks Required',
        text: 'Please provide rejection remarks.',
        icon: 'warning',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Reject Reschedule Request?',
      text: 'Are you sure you want to reject this reschedule request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reject it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      post(route('dept_head.reschedule-requests.reject', requestId), {
        remarks: rejectRemarks,
      }, {
        onSuccess: () => {
          setRejectingId(null);
          setRejectRemarks('');
          Swal.fire({
            title: 'Rejected!',
            text: 'Reschedule request has been rejected.',
            icon: 'success',
            confirmButtonColor: '#10B981',
          });
        },
        onError: (errors) => {
          console.error('Rejection failed:', errors);
          Swal.fire({
            title: 'Error!',
            text: 'Failed to reject reschedule request. Please try again.',
            icon: 'error',
            confirmButtonColor: '#EF4444',
          });
        }
      });
    }
  };

  const startReject = (requestId) => {
    setRejectingId(requestId);
    setRejectRemarks('');
  };

  const cancelReject = () => {
    setRejectingId(null);
    setRejectRemarks('');
  };

  // Tab configuration
  const tabs = [
    { id: 'pending', name: 'Pending', count: requestCounts.pending, color: 'yellow' },
    { id: 'approved', name: 'Approved', count: requestCounts.approved, color: 'green' },
    { id: 'rejected', name: 'Rejected', count: requestCounts.rejected, color: 'red' },
  ];

  return (
    <DeptHeadLayout>
      <Head title="Reschedule Requests" />

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
                Reschedule Requests
              </h1>
              <p className="text-gray-600 text-lg">Manage reschedule requests for {departmentName} department</p>
              <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"></div>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-sm text-gray-500 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                Showing <span className="font-semibold text-gray-800">{rescheduleRequests.from || 0}</span> to{' '}
                <span className="font-semibold text-gray-800">{rescheduleRequests.to || 0}</span> of{' '}
                <span className="font-semibold text-gray-800">{rescheduleRequests.total || 0}</span> results
              </p>
            </div>
          </div>
        </div>

        {/* Flash Messages */}
        {flash?.success && (
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

        {flash?.error && (
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

        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                    ${activeTab === tab.id
                      ? `border-${tab.color}-500 text-${tab.color}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.name}
                  {tab.count > 0 && (
                    <span
                      className={`
                        ml-2 py-0.5 px-2 text-xs rounded-full font-semibold
                        ${activeTab === tab.id
                          ? `bg-${tab.color}-100 text-${tab.color}-800`
                          : 'bg-gray-100 text-gray-600'
                        }
                      `}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Reschedule Requests Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/50">
              <thead className="bg-gradient-to-r from-yellow-50 to-amber-50">
                <tr>
                  <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Employee
                  </th>
                  <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Original Leave
                  </th>
                  <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Proposed Dates
                  </th>
                  <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Reason
                  </th>
                  <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th scope="col" className="px-8 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-200/30">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
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
                              {request.employee?.firstname} {request.employee?.lastname}
                            </div>
                            <div className="text-sm text-gray-500">{request.employee?.department?.name}</div>
                            <div className="text-xs text-purple-600 font-medium mt-1">
                              {request.employee?.user?.role === 'hr' ? 'HR Employee' : 'Employee'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.original_leave_request?.leave_type?.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(request.original_leave_request?.date_from)} to {formatDate(request.original_leave_request?.date_to)}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{request.original_leave_request?.total_days} days</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {request.proposed_dates?.slice(0, 3).map((date, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                {formatDate(date)}
                              </span>
                            ))}
                            {request.proposed_dates?.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                                +{request.proposed_dates.length - 3} more
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {request.proposed_dates?.length} day{request.proposed_dates?.length !== 1 ? 's' : ''} total
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div>
                          <p className="text-sm text-gray-900 line-clamp-2" title={request.reason}>
                            {request.reason}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                        {request.dept_head_reviewed_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDateTime(request.dept_head_reviewed_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(request.submitted_at)}
                        </div>
                      </td>
                      
                      {/* Actions Column for All Tabs */}
                      <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-medium">
                        {/* Pending Requests - Full Actions */}
                        {request.status === 'pending_dept_head' && (
                          rejectingId === request.id ? (
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
                                  onClick={cancelReject}
                                  className="px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end space-x-4">
                              <button
                                onClick={() => handleViewDetails(request)}
                                className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center font-medium"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 15.5v-11a2 2 0 012-2h16a2 2 0 012 2v11a2 2 0 01-2 2H4a2 2 0 01-2-2z" />
                                </svg>
                                View Details
                              </button>
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
                                onClick={() => startReject(request.id)}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center font-medium"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject
                              </button>
                            </div>
                          )
                        )}

                        {/* Approved/Rejected Requests - View Details Only */}
                        {(request.status === 'approved' || request.status === 'rejected') && (
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => handleViewDetails(request)}
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-100 to-amber-100 mb-4">
                          <svg className="h-16 w-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {activeTab === 'pending' 
                            ? 'No pending reschedule requests'
                            : activeTab === 'approved'
                            ? 'No approved reschedule requests'
                            : 'No rejected reschedule requests'
                          }
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {activeTab === 'pending'
                            ? 'There are no pending reschedule requests requiring your approval at the moment.'
                            : activeTab === 'approved'
                            ? 'No reschedule requests have been approved yet.'
                            : 'No reschedule requests have been rejected yet.'
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {rescheduleRequests.data && rescheduleRequests.data.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-8 py-6 border-t border-yellow-200/50">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <div className="text-sm text-gray-700 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                  Showing <span className="font-semibold text-gray-800">{rescheduleRequests.from}</span> to{' '}
                  <span className="font-semibold text-gray-800">{rescheduleRequests.to}</span> of{' '}
                  <span className="font-semibold text-gray-800">{rescheduleRequests.total}</span> results
                </div>
                <div className="flex space-x-2">
                  {/* Previous Button */}
                  {rescheduleRequests.prev_page_url && (
                    <button
                      onClick={() => router.visit(rescheduleRequests.prev_page_url, { preserveState: true, preserveScroll: true })}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all duration-300 transform hover:scale-105 shadow-sm"
                    >
                      ← Previous
                    </button>
                  )}

                  {/* Page Numbers */}
                  {rescheduleRequests.links?.slice(1, -1).map((link, index) => (
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
                  {rescheduleRequests.next_page_url && (
                    <button
                      onClick={() => router.visit(rescheduleRequests.next_page_url, { preserveState: true, preserveScroll: true })}
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

        {/* View Details Modal */}
        {isViewModalOpen && selectedRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl mx-auto my-auto max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-600 to-amber-700 rounded-t-3xl p-6 text-white shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Reschedule Request Details</h2>
                      <div className="flex items-center space-x-4 mt-1 text-amber-100">
                        <span>Request ID: #{selectedRequest.id}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)} text-current bg-white/20`}>
                          {getStatusText(selectedRequest.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content - Scrollable area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Employee & Status Summary */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Employee Card */}
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-100">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Employee Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-yellow-700">Full Name</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {selectedRequest.employee?.firstname} {selectedRequest.employee?.lastname}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-yellow-700">Department</label>
                        <p className="text-lg text-gray-900 mt-1">{selectedRequest.employee?.department?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-yellow-700">Role</label>
                        <p className="text-lg text-gray-900 capitalize mt-1">{selectedRequest.employee?.user?.role}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-yellow-700">Approval Flow</label>
                        <p className="text-lg font-semibold text-yellow-600 mt-1">
                          HR → Dept Head (Final)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status & Timeline Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Request Timeline
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">Submitted</span>
                        <span className="text-sm text-gray-900 font-semibold">{formatDateTime(selectedRequest.submitted_at)}</span>
                      </div>
                      {selectedRequest.hr_reviewed_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-700">HR Approved</span>
                          <span className="text-sm text-gray-900 font-semibold">{formatDateTime(selectedRequest.hr_reviewed_at)}</span>
                          {selectedRequest.hr_approver && (
                            <span className="text-xs text-gray-500">by {selectedRequest.hr_approver.name}</span>
                          )}
                        </div>
                      )}
                      {selectedRequest.dept_head_reviewed_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-700">
                            {selectedRequest.status === 'approved' ? 'Dept Head Approved' : 'Dept Head Rejected'}
                          </span>
                          <span className="text-sm text-gray-900 font-semibold">{formatDateTime(selectedRequest.dept_head_reviewed_at)}</span>
                          {selectedRequest.dept_head_approver && (
                            <span className="text-xs text-gray-500">by {selectedRequest.dept_head_approver.name}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Leave Information */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Original Leave */}
                  <div className="bg-white rounded-2xl p-6 border border-orange-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Original Leave Request
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-orange-700">Leave Type</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {selectedRequest.original_leave_request?.leave_type?.name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-orange-700">Duration</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {selectedRequest.original_leave_request?.total_days} days
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-orange-700">Original Dates</label>
                        <p className="text-lg text-gray-900 mt-1">
                          {formatDate(selectedRequest.original_leave_request?.date_from)} to {formatDate(selectedRequest.original_leave_request?.date_to)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Proposed Dates */}
                  <div className="bg-white rounded-2xl p-6 border border-green-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Proposed New Dates
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedRequest.proposed_dates?.map((date, index) => (
                          <div key={index} className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                            <div className="text-xs font-medium text-green-600">Date {index + 1}</div>
                            <div className="text-sm font-bold text-green-800 mt-1">{formatDate(date)}</div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-green-100 border border-green-300 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-green-800">Total Days</span>
                          <span className="text-xl font-bold text-green-900">{selectedRequest.proposed_dates?.length} days</span>
                        </div>
                        <div className="text-sm text-green-700 text-center mt-2">
                          ✓ Matches original leave duration
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reschedule Reason */}
                <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Reason for Reschedule
                  </h3>
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                    <p className="text-gray-800 leading-relaxed text-lg">
                      {selectedRequest.reason}
                    </p>
                  </div>
                </div>

                {/* HR Remarks */}
                {selectedRequest.hr_remarks && (
                  <div className="bg-white rounded-2xl p-6 border border-purple-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4">HR Remarks</h3>
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                      <p className="text-gray-700 leading-relaxed">
                        {selectedRequest.hr_remarks}
                      </p>
                    </div>
                  </div>
                )}

                {/* Dept Head Remarks */}
                {selectedRequest.dept_head_remarks && (
                  <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-amber-900 mb-4">Your Remarks</h3>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <p className="text-gray-700 leading-relaxed">
                        {selectedRequest.dept_head_remarks}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions - Only show for pending requests */}
              {selectedRequest.status === 'pending_dept_head' && (
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-3xl shrink-0">
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.id);
                        handleCloseModal();
                      }}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Approve Request
                    </button>
                    <button
                      onClick={() => {
                        startReject(selectedRequest.id);
                      }}
                      className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Reject Request
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-xl shadow-lg hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Close button only for approved/rejected requests */}
              {(selectedRequest.status === 'approved' || selectedRequest.status === 'rejected') && (
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-3xl shrink-0">
                  <div className="flex justify-end">
                    <button
                      onClick={handleCloseModal}
                      className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-xl shadow-lg hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DeptHeadLayout>
  );
}