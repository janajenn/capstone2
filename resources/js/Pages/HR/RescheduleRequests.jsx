import HRLayout from '@/Layouts/HRLayout';
import { usePage, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
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

const getRescheduleStatusColor = (status) => {
  switch (status) {
    case 'pending_hr':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'pending_dept_head':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'approved':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

const getRescheduleStatusText = (status) => {
  switch (status) {
    case 'pending_hr':
      return 'Pending HR Approval';
    case 'pending_dept_head':
      return 'Pending Department Head';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
};

// Helper function to determine approval flow
const getApprovalFlow = (employeeRole) => {
  if (['employee', 'hr'].includes(employeeRole)) {
    return 'HR → Dept Head';
  }
  if (['dept_head', 'admin'].includes(employeeRole)) {
    return 'HR Only';
  }
  return 'Unknown';
};

// Helper function to determine if approval is final
const isFinalApproval = (employeeRole) => {
  return ['dept_head', 'admin'].includes(employeeRole);
};

export default function RescheduleRequests() {
  const { props } = usePage();
  const { rescheduleRequests, filters, flash } = props;

  const [activeTab, setActiveTab] = useState('pending_hr');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Filter reschedule requests based on active tab
  const filteredRequests = useMemo(() => {
    if (!rescheduleRequests.data) return [];

    return rescheduleRequests.data.filter(request => {
      switch (activeTab) {
        case 'pending_hr':
          return request.status === 'pending_hr';
        case 'pending_dept_head':
          return request.status === 'pending_dept_head';
        case 'approved':
          return request.status === 'approved';
        case 'rejected':
          return request.status === 'rejected';
        default:
          return true;
      }
    });
  }, [rescheduleRequests.data, activeTab]);

  // Count requests for each tab
  const tabCounts = useMemo(() => {
    if (!rescheduleRequests.data) return { pending_hr: 0, pending_dept_head: 0, approved: 0, rejected: 0 };

    const counts = {
      pending_hr: 0,
      pending_dept_head: 0,
      approved: 0,
      rejected: 0
    };

    rescheduleRequests.data.forEach(request => {
      if (counts.hasOwnProperty(request.status)) {
        counts[request.status]++;
      }
    });

    return counts;
  }, [rescheduleRequests.data]);

  const tabs = [
    { id: 'pending_hr', name: 'Pending HR', count: tabCounts.pending_hr },
    { id: 'pending_dept_head', name: 'Pending Dept Head', count: tabCounts.pending_dept_head },
    { id: 'approved', name: 'Approved', count: tabCounts.approved },
    { id: 'rejected', name: 'Rejected', count: tabCounts.rejected },
  ];

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedRequest(null);
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
      router.post(`/hr/reschedule-requests/${requestId}/approve`, {}, {
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
    const { value: remarks } = await Swal.fire({
      title: 'Reject Reschedule Request',
      text: 'Please provide rejection remarks:',
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Rejection Remarks',
      inputPlaceholder: 'Enter the reason for rejection...',
      showCancelButton: true,
      confirmButtonText: 'Reject Request',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Remarks are required for rejection!';
        }
      },
    });

    if (remarks) {
      router.post(`/hr/reschedule-requests/${requestId}/reject`, {
        remarks: remarks,
      }, {
        onSuccess: () => {
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

  // Check if request can be approved (only pending requests)
  const canApprove = (request) => {
    return request.status === 'pending_hr';
  };

  // Check if request can be rejected (only pending requests)
  const canReject = (request) => {
    return request.status === 'pending_hr';
  };

  // Get available actions for a request with correct logic
  const getAvailableActions = (request) => {
    const actions = [];
    const employeeRole = request.employee?.user?.role;

    // View action is always available
    actions.push({
      type: 'view',
      label: 'View Details',
      color: 'text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200',
      onClick: () => handleViewDetails(request)
    });

    // Approve/Reject actions for pending HR requests
    if (canApprove(request)) {
      const approveLabel = isFinalApproval(employeeRole) ? 'Approve' : 'Approve → To Dept Head';
      
      actions.push({
        type: 'approve',
        label: approveLabel,
        color: 'text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 border border-green-200',
        onClick: () => handleApprove(request.id)
      });

      actions.push({
        type: 'reject',
        label: 'Reject',
        color: 'text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200',
        onClick: () => handleReject(request.id)
      });
    }

    return actions;
  };

  return (
    <HRLayout>
      {/* WIDENED CONTAINER - Changed from max-w-7xl to max-w-screen-2xl */}
      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="relative">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                Reschedule Requests
              </h1>
              <p className="text-gray-600 text-lg">Manage employee leave reschedule requests</p>
              <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Flash Messages */}
        {flash?.success && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl mb-6 flex items-center shadow-lg">
            <div className="p-2 rounded-xl bg-emerald-500 text-white mr-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            {flash.success}
          </div>
        )}

        {/* Tabs and Table Section */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200
                    ${activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 bg-purple-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.name}
                  {tab.count > 0 && (
                    <span className={`
                      ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                      ${activeTab === tab.id
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                      }
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Reschedule Requests Table - WIDER LAYOUT */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px]"> {/* Increased minimum width */}
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-indigo-50">
                  <th className="p-4 font-semibold text-purple-800 uppercase tracking-wider text-left w-80">Employee</th>
                  <th className="p-4 font-semibold text-purple-800 uppercase tracking-wider text-left w-80">Original Leave</th>
                  <th className="p-4 font-semibold text-purple-800 uppercase tracking-wider text-left w-96">Proposed Dates</th>
                  <th className="p-4 font-semibold text-purple-800 uppercase tracking-wider text-left w-120">Reason</th>
                  <th className="p-4 font-semibold text-purple-800 uppercase tracking-wider text-left w-48">Status</th>
                  <th className="p-4 font-semibold text-purple-800 uppercase tracking-wider text-left w-48">Submitted</th>
                  <th className="p-4 font-semibold text-purple-800 uppercase tracking-wider text-left w-80">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/30">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No reschedule requests found</h3>
                        <p className="text-gray-500 max-w-md">
                          {activeTab === 'pending_hr' 
                            ? 'All reschedule requests have been processed. No pending HR approvals at the moment.'
                            : `No ${activeTab.replace('_', ' ')} reschedule requests found.`
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => {
                    const actions = getAvailableActions(request);
                    const employeeRole = request.employee?.user?.role;
                    const approvalFlow = getApprovalFlow(employeeRole);
                    
                    return (
                      <tr key={request.id} className="hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-indigo-50/20 transition-all duration-200 group">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                              <span className="text-white font-semibold text-sm">
                                {request.employee?.firstname?.charAt(0)}{request.employee?.lastname?.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-semibold text-gray-900">
                                  {request.employee?.firstname} {request.employee?.lastname}
                                </p>
                                {employeeRole && employeeRole !== 'employee' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                    {employeeRole}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {request.employee?.department?.name}
                              </p>
                              <p className="text-xs text-purple-600 font-medium mt-1">
                                {approvalFlow}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {request.original_leave_request?.leave_type?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(request.original_leave_request?.date_from)} - {formatDate(request.original_leave_request?.date_to)}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span className="bg-gray-100 px-2 py-1 rounded-full">
                                {request.original_leave_request?.total_days} days
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-2">
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
                        <td className="p-4">
                          <div>
                            <p className="text-sm text-gray-900 line-clamp-3 leading-relaxed" title={request.reason}>
                              {request.reason}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getRescheduleStatusColor(request.status)}`}>
                            {getRescheduleStatusText(request.status)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-900 whitespace-nowrap">
                            {formatDate(request.submitted_at)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {actions.map((action, index) => (
                              <button
                                key={action.type}
                                onClick={action.onClick}
                                className={`inline-flex items-center px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 hover:shadow-md ${action.color}`}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BEAUTIFIED MODAL - Fixed white space issue */}
        {isViewModalOpen && selectedRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl mx-auto my-auto max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-t-3xl p-6 text-white shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Reschedule Request Details</h2>
                      <div className="flex items-center space-x-4 mt-1 text-purple-100">
                        <span>Request ID: #{selectedRequest.id}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRescheduleStatusColor(selectedRequest.status)} text-current bg-white/20`}>
                          {getRescheduleStatusText(selectedRequest.status)}
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
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Employee Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-purple-700">Full Name</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {selectedRequest.employee?.firstname} {selectedRequest.employee?.lastname}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-purple-700">Department</label>
                        <p className="text-lg text-gray-900 mt-1">{selectedRequest.employee?.department?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-purple-700">Role</label>
                        <p className="text-lg text-gray-900 capitalize mt-1">{selectedRequest.employee?.user?.role}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-purple-700">Approval Flow</label>
                        <p className="text-lg font-semibold text-purple-600 mt-1">
                          {getApprovalFlow(selectedRequest.employee?.user?.role)}
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
                          <span className="text-sm font-medium text-blue-700">HR Reviewed</span>
                          <span className="text-sm text-gray-900 font-semibold">{formatDateTime(selectedRequest.hr_reviewed_at)}</span>
                        </div>
                      )}
                      {selectedRequest.dept_head_reviewed_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-700">Dept Head Reviewed</span>
                          <span className="text-sm text-gray-900 font-semibold">{formatDateTime(selectedRequest.dept_head_reviewed_at)}</span>
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
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-orange-700">Reason</label>
                        <p className="text-gray-700 bg-orange-50 rounded-lg p-4 border border-orange-100 mt-1 leading-relaxed">
                          {selectedRequest.original_leave_request?.reason}
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

                {/* Remarks Section */}
                {(selectedRequest.hr_remarks || selectedRequest.dept_head_remarks) && (
                  <div className="bg-white rounded-2xl p-6 border border-purple-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4">Review Remarks</h3>
                    <div className="space-y-4">
                      {selectedRequest.hr_remarks && (
                        <div>
                          <label className="text-sm font-medium text-purple-700 block mb-2">HR Remarks</label>
                          <p className="text-gray-700 bg-purple-50 rounded-lg p-4 border border-purple-100 leading-relaxed">
                            {selectedRequest.hr_remarks}
                          </p>
                        </div>
                      )}
                      {selectedRequest.dept_head_remarks && (
                        <div>
                          <label className="text-sm font-medium text-purple-700 block mb-2">Department Head Remarks</label>
                          <p className="text-gray-700 bg-purple-50 rounded-lg p-4 border border-purple-100 leading-relaxed">
                            {selectedRequest.dept_head_remarks}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-3xl shrink-0">
                <div className="flex justify-end space-x-4">
                  {canApprove(selectedRequest) && (
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.id);
                        handleCloseModal();
                      }}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      {isFinalApproval(selectedRequest.employee?.user?.role) ? 'Approve Request' : 'Approve → To Dept Head'}
                    </button>
                  )}
                  {canReject(selectedRequest) && (
                    <button
                      onClick={() => {
                        handleReject(selectedRequest.id);
                        handleCloseModal();
                      }}
                      className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Reject Request
                    </button>
                  )}
                  <button
                    onClick={handleCloseModal}
                    className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-xl shadow-lg hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </HRLayout>
  );
}