import HRLayout from '@/Layouts/HRLayout';
import { useForm, usePage, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import LeaveForm from '@/Components/LeaveForm';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Helper function to determine approval status based on leave_approvals
// Helper function to determine approval status based on leave_approvals
const getApprovalStatus = (request) => {
  if (!request.approvals || request.approvals.length === 0) {
    // Check if it's a department head request
    if (request.employee?.user?.role === 'dept_head' || request.is_dept_head_request) {
      return 'dept_head_pending';
    }
    return 'hr_pending';
  }

  // Check if any approval has rejected status
  const hasRejection = request.approvals.some(approval => approval.status === 'rejected');
  if (hasRejection) {
    return 'rejected';
  }

  // Get approvals by role
  const hrApproval = request.approvals.find(a => a.role === 'hr' && a.status === 'approved');
  const deptHeadApproval = request.approvals.find(a => a.role === 'dept_head' && a.status === 'approved');
  const adminApproval = request.approvals.find(a => a.role === 'admin' && a.status === 'approved');

  // Check if this is a department head request
  const isDeptHead = request.employee?.user?.role === 'dept_head' || request.is_dept_head_request;

  // Check if fully approved
  if (isDeptHead) {
    // Department heads only need HR and Admin approval
    if (hrApproval && adminApproval) {
      return 'fully_approved';
    }
  } else {
    // Regular employees need HR, Dept Head, and Admin approval
    if (hrApproval && deptHeadApproval && adminApproval) {
      return 'fully_approved';
    }
  }

  // Check if approved by HR only
  if (hrApproval && !deptHeadApproval && !adminApproval) {
    // Check if this is a department head request (bypass dept head approval)
    if (isDeptHead) {
      return 'approved_by_hr_to_admin'; // Special status for dept head requests
    }
    return 'approved_by_hr';
  }

  // Check if approved by HR and Dept Head (regular employees only)
  if (hrApproval && deptHeadApproval && !adminApproval && !isDeptHead) {
    return 'in_progress';
  }

  // Check if approved by HR and Admin (department heads only)
  if (hrApproval && adminApproval && !deptHeadApproval && isDeptHead) {
    return 'fully_approved'; // This should already be caught above, but just in case
  }

  // If there are approvals but don't match specific categories
  return 'in_progress';
};

// Get display status text based on approval status
const getDisplayStatus = (request) => {
  const approvalStatus = getApprovalStatus(request);

  switch (approvalStatus) {
    case 'hr_pending':
      return 'HR Pending';
    case 'dept_head_pending':
      return 'Dept Head Request - Pending';
    case 'approved_by_hr':
      return 'Approved by HR';
    case 'approved_by_hr_to_admin':
      return 'Approved by HR → To Admin';
    case 'in_progress':
      // Check which approvals exist for more specific status
      const hrApproval = request.approvals.find(a => a.role === 'hr' && a.status === 'approved');
      const deptHeadApproval = request.approvals.find(a => a.role === 'dept_head' && a.status === 'approved');

      if (hrApproval && deptHeadApproval) {
        return 'Approved by Dept Head';
      } else if (hrApproval) {
        return 'Approved by HR';
      }
      return 'In Progress';
    case 'fully_approved':
      return 'Fully Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return 'HR Pending';
  }
};

// Get display status color based on approval status
const getDisplayStatusColor = (request) => {
  const approvalStatus = getApprovalStatus(request);

  switch (approvalStatus) {
    case 'hr_pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'dept_head_pending':
      return 'bg-purple-100 text-purple-800';
    case 'approved_by_hr':
      return 'bg-blue-100 text-blue-800';
    case 'approved_by_hr_to_admin':
      return 'bg-indigo-100 text-indigo-800';
    case 'in_progress':
      return 'bg-purple-100 text-purple-800';
    case 'fully_approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Check if request is from department head
const isDeptHeadRequest = (request) => {
  return request.is_dept_head_request || request.employee?.user?.role === 'dept_head';
};

export default function LeaveRequests() {
  const { props } = usePage();
  const { leaveRequests, filters, flash } = props;

  const [selectedRequests, setSelectedRequests] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [activeTab, setActiveTab] = useState('hr_pending');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedRequestForForm, setSelectedRequestForForm] = useState(null);

  const { data, setData, post, processing } = useForm({
    status: filters?.status || 'all',
    date_from: filters?.date_from || '',
    date_to: filters?.date_to || '',
    search: filters?.search || '',
  });

  // Calculate summary statistics
  const summaryData = useMemo(() => {
    if (!leaveRequests.data) {
      return {
        total: 0,
        pending: 0,
        dept_head_pending: 0,
        approved: 0,
        rejected: 0
      };
    }

    return {
      total: leaveRequests.total,
      pending: leaveRequests.data.filter(request => getApprovalStatus(request) === 'hr_pending').length,
      dept_head_pending: leaveRequests.data.filter(request => getApprovalStatus(request) === 'dept_head_pending').length,
      approved: leaveRequests.data.filter(request => getApprovalStatus(request) === 'fully_approved').length,
      rejected: leaveRequests.data.filter(request => getApprovalStatus(request) === 'rejected').length
    };
  }, [leaveRequests]);

  // Filter leave requests based on active tab using approval status
// Filter leave requests based on active tab using approval status
const filteredRequests = useMemo(() => {
  if (!leaveRequests.data) return [];

  return leaveRequests.data.filter(request => {
    const approvalStatus = getApprovalStatus(request);
    const hasHRApproval = request.approvals?.some(approval => 
      approval.role === 'hr' && approval.status === 'approved'
    );

    switch (activeTab) {
      case 'hr_pending':
        return approvalStatus === 'hr_pending';
      case 'dept_head_pending':
        return approvalStatus === 'dept_head_pending';
      case 'approved_by_hr':
        // Show ALL requests that have HR approval, regardless of current status
        return hasHRApproval;
      case 'rejected':
        return approvalStatus === 'rejected';
      case 'fully_approved':
        return approvalStatus === 'fully_approved';
      default:
        return true;
    }
  });
}, [leaveRequests.data, activeTab]);

// Count requests for each tab
const tabCounts = useMemo(() => {
  if (!leaveRequests.data) return { hr_pending: 0, dept_head_pending: 0, approved_by_hr: 0, rejected: 0, fully_approved: 0 };

  const counts = {
    hr_pending: 0,
    dept_head_pending: 0,
    approved_by_hr: 0,
    rejected: 0,
    fully_approved: 0
  };

  leaveRequests.data.forEach(request => {
    const approvalStatus = getApprovalStatus(request);
    const hasHRApproval = request.approvals?.some(approval => 
      approval.role === 'hr' && approval.status === 'approved'
    );

    switch (approvalStatus) {
      case 'hr_pending':
        counts.hr_pending++;
        break;
      case 'dept_head_pending':
        counts.dept_head_pending++;
        break;
      case 'rejected':
        counts.rejected++;
        break;
      case 'fully_approved':
        counts.fully_approved++;
        break;
      default:
        // For in_progress status, don't count in other tabs
        break;
    }

    // Count for approved_by_hr tab - ALL requests with HR approval
    if (hasHRApproval) {
      counts.approved_by_hr++;
    }
  });

  return counts;
}, [leaveRequests.data]);

  // Tab configuration
  const tabs = [
    { id: 'hr_pending', name: 'HR Pending', count: tabCounts.hr_pending },
    { id: 'dept_head_pending', name: 'Dept Head Requests', count: tabCounts.dept_head_pending },
    { id: 'approved_by_hr', name: 'Approved by HR', count: tabCounts.approved_by_hr },
    { id: 'rejected', name: 'Rejected', count: tabCounts.rejected },
    { id: 'fully_approved', name: 'Fully Approved', count: tabCounts.fully_approved },
  ];

  const handleFilter = () => {
    router.get('/hr/leave-requests', data, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRequests(filteredRequests.map(req => req.id));
      setShowBulkActions(true);
    } else {
      setSelectedRequests([]);
      setShowBulkActions(false);
    }
  };

  const handleSelectRequest = (requestId) => {
    if (selectedRequests.includes(requestId)) {
      setSelectedRequests(selectedRequests.filter(id => id !== requestId));
    } else {
      setSelectedRequests([...selectedRequests, requestId]);
    }
    setShowBulkActions(selectedRequests.length + 1 > 0);
  };

  const handleApprove = (requestId) => {
    if (confirm('Are you sure you want to approve this leave request?')) {
      post(`/hr/leave-requests/${requestId}/approve`);
    }
  };

  const handleReject = (requestId) => {
    const remarks = prompt('Please provide rejection remarks:');
    if (remarks) {
      router.post(route('hr.leave-requests.reject', requestId), {
        remarks: remarks,
      }, {
        onSuccess: () => {
          console.log('Rejection successful');
        },
        onError: (errors) => {
          console.error('Rejection failed:', errors);
        }
      });
    }
  };

  const handleBulkAction = (action) => {
    if (selectedRequests.length === 0) return;

    const formData = {
      action: action,
      request_ids: selectedRequests,
      remarks: action === 'reject' ? prompt('Please provide rejection remarks:') : '',
    };

    if (action === 'reject' && !formData.remarks) {
      alert('Remarks are required for rejection.');
      return;
    }

    router.post(route('hr.leave-requests.bulk-action'), formData, {
      onSuccess: () => {
        setSelectedRequests([]);
        setShowBulkActions(false);
      },
      onError: (errors) => {
        console.error('Bulk action failed:', errors);
      }
    });
  };

  // Handle form generation
  const handleGenerateForm = (request) => {
    setSelectedRequestForForm(request);
    setShowFormModal(true);
  };

  // Close form modal
  const closeFormModal = () => {
    setShowFormModal(false);
    setSelectedRequestForForm(null);
  };

  // Prepare data for LeaveForm component
  const prepareFormData = (request) => {
    if (!request) return null;

    // Transform leave request data to match LeaveForm component expectations
    const leaveRequestData = {
      id: request.id,
      leave_type: request.leave_type?.code || request.leave_type?.name,
      start_date: request.date_from,
      end_date: request.date_to,
      created_at: request.created_at,
      status: getApprovalStatus(request),
      reason: request.reason || '',
      remarks: request.details?.[0]?.details || ''
    };

    // Transform employee data
    const employeeData = {
      full_name: `${request.employee?.firstname || ''} ${request.employee?.lastname || ''}`.trim(),
      position: request.employee?.position || 'N/A',
      salary: request.employee?.monthly_salary || 0,
      department: {
        name: request.employee?.department?.name || 'N/A'
      },
      leave_credits: {
        vacation_leave: 0,
        sick_leave: 0
      }
    };

    // Transform approvers data
    const approversData = request.approvals?.map(approval => ({
      name: approval.approver?.name || 'System User',
      role: approval.role === 'hr' ? 'HRMO-Designate' : 
            approval.role === 'dept_head' ? 'Department Head' : 
            approval.role === 'admin' ? 'Municipal Vice Mayor' : 'Approver'
    })) || [];

    return {
      leaveRequest: leaveRequestData,
      employee: employeeData,
      approvers: approversData
    };
  };

  // Check if a request can be approved (only pending requests)
  const canApprove = (request) => {
    const status = getApprovalStatus(request);
    return status === 'hr_pending' || status === 'dept_head_pending';
  };

  // Check if a request can generate form (only fully approved requests)
  const canGenerateForm = (request) => {
    return getApprovalStatus(request) === 'fully_approved';
  };

  // Get available actions for a request
  const getAvailableActions = (request) => {
    const actions = [];
    const approvalStatus = getApprovalStatus(request);
    const isDeptHead = isDeptHeadRequest(request);

    // View action is always available
    actions.push({
      type: 'view',
      label: 'View',
      color: 'text-blue-600 hover:text-blue-900',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      onClick: () => router.visit(`/hr/leave-requests/${request.id}`)
    });

    // Approve/Reject actions for pending requests
    if (approvalStatus === 'hr_pending' || approvalStatus === 'dept_head_pending') {
      actions.push({
        type: 'approve',
        label: isDeptHead ? 'Approve → To Admin' : 'Approve',
        color: 'text-green-600 hover:text-green-900',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
        onClick: () => handleApprove(request.id)
      });

      actions.push({
        type: 'reject',
        label: 'Reject',
        color: 'text-red-600 hover:text-red-900',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
        onClick: () => handleReject(request.id)
      });
    }

    // Generate form action for fully approved requests
    if (approvalStatus === 'fully_approved') {
      actions.push({
        type: 'generate',
        label: 'Generate Form',
        color: 'text-purple-600 hover:text-purple-900',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        onClick: () => handleGenerateForm(request)
      });
    }

    return actions;
  };

  return (
    <HRLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Leave Requests Management</h1>
              <p className="text-gray-600 mt-1">Monitor and manage all employee leave requests in one place</p>
            </div>
            {showBulkActions && (
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button
                  onClick={() => handleBulkAction('approve')}
                  disabled={processing}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  <div className="p-1 rounded-lg bg-green-500 mr-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Approve Selected ({selectedRequests.length})
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={processing}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  <div className="p-1 rounded-lg bg-red-500 mr-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  Reject Selected ({selectedRequests.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Flash Messages */}
        {flash?.success && (
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{summaryData.total}</h2>
                <p className="text-sm text-gray-600">Total Requests</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-50">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{summaryData.pending}</h2>
                <p className="text-sm text-gray-600">Pending HR</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-50">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{summaryData.dept_head_pending}</h2>
                <p className="text-sm text-gray-600">Dept Head Requests</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{summaryData.approved}</h2>
                <p className="text-sm text-gray-600">Approved Requests</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-50">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{summaryData.rejected}</h2>
                <p className="text-sm text-gray-600">Rejected Requests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="w-full md:w-1/2 mb-4 md:mb-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={data.search}
                  onChange={(e) => setData('search', e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="status" className="text-sm text-gray-600">Status:</label>
                <select
                  id="status"
                  value={data.status}
                  onChange={(e) => setData('status', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="hr_pending">HR Pending</option>
                  <option value="dept_head_pending">Dept Head Requests</option>
                  <option value="approved_by_hr">Approved by HR</option>
                  <option value="rejected">Rejected</option>
                  <option value="fully_approved">Fully Approved</option>
                </select>
              </div>
              <button
                onClick={handleFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md hover:shadow-lg"
              >
                <div className="p-1 rounded-lg bg-blue-500 mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Tabs and Table Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-6 text-sm font-medium border-b-2 transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.name}
                  {tab.count > 0 && (
                    <span className={`
                      ml-2 py-0.5 px-2 rounded-full text-xs
                      ${activeTab === tab.id
                        ? 'bg-blue-100 text-blue-800'
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

          {/* Leave Requests Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee & Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approval Progress
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search or filter to find what you're looking for.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => {
                    const actions = getAvailableActions(request);
                    const isDeptHead = isDeptHeadRequest(request);
                    
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedRequests.includes(request.id)}
                            onChange={() => handleSelectRequest(request.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            disabled={!canApprove(request)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {request.employee?.firstname?.charAt(0)}{request.employee?.lastname?.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {request.employee?.firstname} {request.employee?.lastname}
                                {isDeptHead && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Dept Head
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.employee?.department?.name}
                              </div>
                              <div className="text-xs text-blue-600">
                                {isDeptHead ? 'HR → Admin' : 'HR → Dept Head → Admin'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.leave_type?.name}</div>
                          <div className="text-sm text-gray-500">{request.leave_type?.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(request.date_from)} - {formatDate(request.date_to)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {Math.ceil((new Date(request.date_to) - new Date(request.date_from)) / (1000 * 60 * 60 * 24)) + 1} days
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getDisplayStatusColor(request)}`}>
                            {getDisplayStatus(request)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {request.approvals && request.approvals.length > 0 ? (
                              <div className="flex space-x-2">
                                {request.approvals.map(approval => (
                                  <span
                                    key={approval.approval_id}
                                    className={`px-1 text-xs ${
                                      approval.status === 'approved' ? 'text-green-600' :
                                      approval.status === 'rejected' ? 'text-red-600' : 'text-gray-400'
                                    }`}
                                    title={`${approval.role}: ${approval.status}`}
                                  >
                                    {approval.role.charAt(0).toUpperCase()}
                                  </span>
                                ))}
                                {isDeptHead && !request.approvals.find(a => a.role === 'dept_head') && (
                                  <span className="px-1 text-xs text-gray-300" title="Department Head Approval Bypassed">
                                    D
                                  </span>
                                )}
                              </div>
                            ) : (
                              'No approvals yet'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-start space-x-2">
                            {actions.map((action, index) => (
                              <button
                                key={action.type}
                                onClick={action.onClick}
                                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium transition-colors ${action.color}`}
                              >
                                {action.icon}
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

          {/* Pagination */}
          {leaveRequests.data && leaveRequests.data.length > 0 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{leaveRequests.from}</span> to <span className="font-medium">{leaveRequests.to}</span> of{' '}
                  <span className="font-medium">{leaveRequests.total}</span> results
                </div>
                <div className="flex space-x-2">
                  {/* Previous Page */}
                  {leaveRequests.prev_page_url && (
                    <button
                      onClick={() => router.visit(leaveRequests.prev_page_url, { preserveState: true, preserveScroll: true })}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>
                  )}

                  {/* Page Numbers */}
                  {leaveRequests.links.slice(1, -1).map((link, index) => (
                    <button
                      key={index}
                      onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true })}
                      className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                        link.active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}

                  {/* Next Page */}
                  {leaveRequests.next_page_url && (
                    <button
                      onClick={() => router.visit(leaveRequests.next_page_url, { preserveState: true, preserveScroll: true })}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leave Form Modal */}
        {showFormModal && selectedRequestForForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  Generate Leave Form - {selectedRequestForForm.employee?.firstname} {selectedRequestForForm.employee?.lastname}
                </h2>
                <button
                  onClick={closeFormModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <LeaveForm 
                  {...prepareFormData(selectedRequestForForm)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </HRLayout>
  );
}