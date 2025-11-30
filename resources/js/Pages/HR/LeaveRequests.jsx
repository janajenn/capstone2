import HRLayout from '@/Layouts/HRLayout';
import { useForm, usePage, router, Link } from '@inertiajs/react';
import { useState, useMemo,useEffect} from 'react';
import Swal from 'sweetalert2';
import LeaveForm from '@/Components/LeaveForm';
import EmployeeModal from '@/Components/EmployeeModal';


const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

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
  const isAdmin = request.employee?.user?.role === 'admin';

  // Check if fully approved
  if (isDeptHead || isAdmin) {
    // Department heads AND Admins only need HR and Admin approval
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
    // Check if this is a department head or admin request (bypass dept head approval)
    if (isDeptHead || isAdmin) {
      return 'approved_by_hr_to_admin'; // Special status for dept head and admin requests
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
      return 'Dept Head/Admin Request - Pending';
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

const isRescheduledRequest = (request) => {
  if (!request.reschedule_requests || !Array.isArray(request.reschedule_requests)) {
    return false;
  }

  const hasApprovedReschedule = request.reschedule_requests.some(req => {
    // Debug each reschedule request
    console.log(`🔍 Checking reschedule:`, {
      reschedule_id: req.id,
      status: req.status,
      original_leave_request_id: req.original_leave_request_id,
      matches_request_id: req.original_leave_request_id === request.id
    });
    
    return req.status === 'approved' && req.original_leave_request_id === request.id;
  });

  return hasApprovedReschedule;
};

export default function LeaveRequests() {
  const { props } = usePage();
  const { leaveRequests, filters, flash, departments, rescheduleRequestsCount,tabCounts  } = props;
    

  const [selectedRequests, setSelectedRequests] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [activeTab, setActiveTab] = useState('hr_pending');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedRequestForForm, setSelectedRequestForForm] = useState(null);

  // Add these states for employee modal
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

  const { data, setData, post, processing } = useForm({
    status: filters?.status || 'all',
    date_from: filters?.date_from || '',
    date_to: filters?.date_to || '',
    search: filters?.search || '',
    department: filters?.department || '', 
  });

  // Calculate summary statistics
  const summaryData = useMemo(() => {
    if (!leaveRequests.data) {
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      };
    }

    return {
      total: leaveRequests.total,
      pending: leaveRequests.data.filter(request => getApprovalStatus(request) === 'hr_pending').length,
      approved: leaveRequests.data.filter(request => getApprovalStatus(request) === 'fully_approved').length,
      rejected: leaveRequests.data.filter(request => getApprovalStatus(request) === 'rejected').length
    };
  }, [leaveRequests]);

  // Update the filteredRequests logic
// Use the data that's already filtered by backend
// Update the filteredRequests logic
const filteredRequests = useMemo(() => {
  if (!leaveRequests.data) return [];

  return leaveRequests.data.filter(request => {
    const approvalStatus = getApprovalStatus(request);
    const hasHRApproval = request.approvals?.some(approval => 
      approval.role === 'hr' && approval.status === 'approved'
    );
    const isRescheduled = isRescheduledRequest(request);

    switch (activeTab) {
      case 'hr_pending':
        return approvalStatus === 'hr_pending';
      case 'dept_head_pending':
        // Show department head AND admin requests
        return approvalStatus === 'dept_head_pending' || 
               (request.employee?.user?.role === 'admin' && approvalStatus === 'hr_pending');
      case 'approved_by_hr':
        // Show ALL requests that have HR approval, regardless of current status
        return hasHRApproval;
      case 'rejected':
        return approvalStatus === 'rejected';
      case 'fully_approved':
        // Show fully approved requests that are NOT rescheduled
        return approvalStatus === 'fully_approved' && !isRescheduled;
        case 'rescheduled':
          // Show ANY request that has reschedule requests (approved or not)
          return request.reschedule_requests && 
                 Array.isArray(request.reschedule_requests) && 
                 request.reschedule_requests.length > 0;
      default:
        return true;
    }
  });
}, [leaveRequests.data, activeTab]);







 // Update the tabs configuration
 const tabs = [
  { id: 'hr_pending', name: 'HR Pending', count: tabCounts.hr_pending },
  { id: 'dept_head_pending', name: 'Dept Head/Admin Requests', count: tabCounts.dept_head_pending },
  { id: 'approved_by_hr', name: 'Approved by HR', count: tabCounts.approved_by_hr },
  { id: 'rejected', name: 'Disapproved', count: tabCounts.rejected },
  { id: 'fully_approved', name: 'Fully Approved', count: tabCounts.fully_approved },
  { id: 'rescheduled', name: 'Rescheduled', count: tabCounts.rescheduled },
];





const debugRescheduleData = () => {
  console.log('=== 🐛 RESCHEDULE DEBUG - COMPLETE DATA ===');
  
  if (!leaveRequests.data || leaveRequests.data.length === 0) {
    console.log('❌ No leave requests data available');
    return;
  }

  console.log('Total leave requests:', leaveRequests.data.length);
  
  // Show ALL requests and their reschedule data
  leaveRequests.data.forEach((request, index) => {
    const rescheduleReqs = request.reschedule_requests || [];
    
    console.log(`📋 Request ${index + 1}:`, {
      id: request.id,
      employee: `${request.employee?.firstname} ${request.employee?.lastname}`,
      leaveStatus: request.status,
      rescheduleRequestsCount: rescheduleReqs.length,
      rescheduleRequests: rescheduleReqs.map(req => ({
        reschedule_id: req.id,
        status: req.status,
        original_leave_request_id: req.original_leave_request_id,
        proposed_dates: req.proposed_dates,
        reason: req.reason
      })),
      isRescheduled: isRescheduledRequest(request)
    });
  });

  // Now show only rescheduled ones
  console.log('=== 🎯 RESCHEDULED REQUESTS ONLY ===');
  const rescheduledRequests = leaveRequests.data.filter(request => isRescheduledRequest(request));
  
  rescheduledRequests.forEach((request, index) => {
    const approvedReschedules = (request.reschedule_requests || []).filter(req => req.status === 'approved');
    
    console.log(`✅ Rescheduled Request ${index + 1}:`, {
      id: request.id,
      employee: `${request.employee?.firstname} ${request.employee?.lastname}`,
      approvedRescheduleCount: approvedReschedules.length,
      approvedReschedules: approvedReschedules.map(req => ({
        reschedule_id: req.id,
        original_leave_request_id: req.original_leave_request_id
      }))
    });
  });

  console.log(`📊 FINAL COUNT: ${rescheduledRequests.length} rescheduled requests found`);
  console.log('=== 🐛 DEBUG END ===');
};





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

  const handleApprove = async (requestId) => {
    const result = await Swal.fire({
      title: 'Approve Leave Request?',
      text: 'Are you sure you want to approve this leave request?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl',
        cancelButton: 'rounded-xl'
      }
    });
  
    if (result.isConfirmed) {
      post(`/hr/leave-requests/${requestId}/approve`);
    }
  };

  const handleReject = async (requestId) => {
    const { value: remarks } = await Swal.fire({
      title: 'Reject Leave Request',
      text: 'Please provide rejection remarks:',
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Rejection Remarks',
      inputPlaceholder: 'Enter the reason for rejection...',
      inputAttributes: {
        'aria-label': 'Enter the reason for rejection'
      },
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
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl',
        cancelButton: 'rounded-xl',
        input: 'rounded-xl'
      }
    });
  
    if (remarks) {
      router.post(route('hr.leave-requests.reject', requestId), {
        remarks: remarks,
      }, {
        onSuccess: () => {
          Swal.fire({
            title: 'Rejected!',
            text: 'Leave request has been rejected.',
            icon: 'success',
            confirmButtonColor: '#10B981',
            customClass: {
              popup: 'rounded-2xl',
              confirmButton: 'rounded-xl'
            }
          });
        },
        onError: (errors) => {
          console.error('Rejection failed:', errors);
          Swal.fire({
            title: 'Error!',
            text: 'Failed to reject leave request. Please try again.',
            icon: 'error',
            confirmButtonColor: '#EF4444',
            customClass: {
              popup: 'rounded-2xl',
              confirmButton: 'rounded-xl'
            }
          });
        }
      });
    }
  };

  const handleAvatarClick = (employee) => {
    setSelectedEmployee(employee);
    setIsEmployeeModalOpen(true);
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
  const handleGenerateForm = async (request) => {
    const result = await Swal.fire({
      title: 'Generate Leave Form',
      text: 'Please review the form in case there are mistakes. Do you want to proceed with generating the leave form?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, proceed',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      setSelectedRequestForForm(request);
      setShowFormModal(true);
    }
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
    remarks: request.details?.[0]?.details || '',
    details: request.details || [],
    days_with_pay: request.days_with_pay || 0,
    days_without_pay: request.days_without_pay || 0,
    selected_dates: request.selected_dates || [] // ADD THIS LINE
  };

  // Get leave credit logs for the specific leave type
  const getLeaveCreditData = (leaveType) => {
    if (!request.employee?.leave_credit_logs) return null;
    
    // Find the most recent log for this leave type
    const relevantLogs = request.employee.leave_credit_logs.filter(log => 
      log.type === leaveType
    );
    
    if (relevantLogs.length === 0) return null;
    
    // Get the most recent log
    const latestLog = relevantLogs[0];
    
    return {
      total_earned: latestLog.balance_before,
      less_application: latestLog.points_deducted,
      balance: latestLog.balance_after
    };
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
    },
    leave_credit_logs: request.employee?.leave_credit_logs || []
  };

  // Helper function to get default position based on role
  const getDefaultPosition = (role) => {
    const defaultPositions = {
      'hr': 'HRMO-Designate',
      'dept_head': 'Department Head',
      'admin': 'Municipal Vice Mayor'
    };
    return defaultPositions[role] || 'Approver';
  };

  // Transform approvers data WITH POSITION
  const approversData = request.approvals?.map(approval => {
    // Get the approver's actual position if available, otherwise use default
    const approverPosition = approval.approver?.employee?.position || getDefaultPosition(approval.role);
    
    return {
      name: approval.approver?.name || 'System User',
      role: approval.role === 'hr' ? 'HRMO-Designate' : 
            approval.role === 'dept_head' ? 'Department Head' : 
            approval.role === 'admin' ? 'Municipal Vice Mayor' : 'Approver',
      position: approverPosition, // ADD POSITION HERE
      approved_at: approval.approved_at
    };
  }) || [];

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

  // Update the getAvailableActions function to include form generation for rescheduled requests
const getAvailableActions = (request) => {
  const actions = [];
  const approvalStatus = getApprovalStatus(request);
  const isDeptHead = isDeptHeadRequest(request);
  const isRescheduled = isRescheduledRequest(request);

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
      label: isDeptHead || request.employee?.user?.role === 'admin' ? 'Approve → To Admin' : 'Approve',
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

  // Generate form action for fully approved AND rescheduled requests
  if (approvalStatus === 'fully_approved' || isRescheduled) {
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


useEffect(() => {
  console.log('📄 Pagination Data:', {
    current_page: leaveRequests.current_page,
    per_page: leaveRequests.per_page,
    from: leaveRequests.from,
    to: leaveRequests.to,
    total: leaveRequests.total,
    last_page: leaveRequests.last_page,
    data_length: leaveRequests.data?.length
  });
}, [leaveRequests]);


useEffect(() => {
  if (leaveRequests.data && leaveRequests.data.length > 0) {
    console.log('🔍 DEBUG: First request approvals data:', leaveRequests.data[0].approvals);
    
    if (leaveRequests.data[0].approvals) {
      leaveRequests.data[0].approvals.forEach((approval, index) => {
        console.log(`Approver ${index + 1}:`, {
          role: approval.role,
          approver_name: approval.approver?.name,
          approver_position: approval.approver?.employee?.position,
          has_employee_data: !!approval.approver?.employee
        });
      });
    }
  }
}, [leaveRequests.data]);


  // Handle pagination for each tab
  const handlePageChange = (url) => {
    if (url) {
      router.visit(url, { 
        preserveState: true, 
        preserveScroll: true 
      });
    }
  };


  // Add this inside your component temporarily to debug
const DebugInfo = () => {
  if (!leaveRequests.data) return null;
  
  const sampleRequest = leaveRequests.data[0];




  // Add this debug effect
useEffect(() => {
  console.log('🔍 DATA FLOW DEBUG:');
  console.log('Backend sent:', leaveRequests.data?.length, 'records');
  console.log('Active tab:', activeTab);
  
  if (leaveRequests.data) {
    // Check what happens with your filtering
    const afterFiltering = leaveRequests.data.filter(request => {
      const approvalStatus = getApprovalStatus(request);
      const hasHRApproval = request.approvals?.some(approval => 
        approval.role === 'hr' && approval.status === 'approved'
      );
      const isRescheduled = isRescheduledRequest(request);

      switch (activeTab) {
        case 'hr_pending':
          return approvalStatus === 'hr_pending';
        case 'dept_head_pending':
          return approvalStatus === 'dept_head_pending' || 
                 (request.employee?.user?.role === 'admin' && approvalStatus === 'hr_pending');
        case 'approved_by_hr':
          return hasHRApproval;
        case 'rejected':
          return approvalStatus === 'rejected';
        case 'fully_approved':
          return approvalStatus === 'fully_approved' && !isRescheduled;
        case 'rescheduled':
          return isRescheduled;
        default:
          return true;
      }
    });
    
    console.log('After frontend filtering:', afterFiltering.length, 'records');
    console.log('Records that were filtered out:', leaveRequests.data.length - afterFiltering.length);
  }
}, [leaveRequests.data, activeTab]);


  
  return (
    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
      <h3 className="font-bold text-yellow-800">Debug Info:</h3>
      <p>Total requests: {leaveRequests.data.length}</p>
      {sampleRequest && (
        <>
          <p>Sample request status: {sampleRequest.status}</p>
          <p>Sample request reschedule_history: {JSON.stringify(sampleRequest.reschedule_history)}</p>
          <p>Sample request rescheduled_at: {sampleRequest.rescheduled_at}</p>
          <p>Is rescheduled? {isRescheduledRequest(sampleRequest) ? 'YES' : 'NO'}</p>
        </>
      )}
    </div>
  );
};

  return (
    <HRLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="relative">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                Leave Requests Management
              </h1>
              <p className="text-gray-600 text-lg">Monitor and manage all employee leave requests in one place</p>
              <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
            </div>
            
            {/* Button Container with Badge */}
            <div className="mt-4 md:mt-0 flex space-x-3">
              {/* Reschedule Requests Button with Badge */}
              <Link
                href="/hr/reschedule-requests"
                className="relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 shadow-lg group"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Reschedule Requests
                
                {/* Status Badge */}
                {rescheduleRequestsCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-6 h-6 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5 shadow-lg transform group-hover:scale-110 transition-transform duration-200 border-2 border-white">
                    {rescheduleRequestsCount > 99 ? '99+' : rescheduleRequestsCount}
                  </span>
                )}
              </Link>
            </div>


            

            {showBulkActions && (
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button
                  onClick={() => handleBulkAction('approve')}
                  disabled={processing}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50"
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
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50"
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
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl mb-6 flex items-center shadow-lg">
            <div className="p-2 rounded-xl bg-emerald-500 text-white mr-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            {flash.success}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{summaryData.total}</h2>
                <p className="text-sm text-gray-600">Total Requests</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{summaryData.pending}</h2>
                <p className="text-sm text-gray-600">Pending HR</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{summaryData.approved}</h2>
                <p className="text-sm text-gray-600">Approved Requests</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-red-500 to-rose-500">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
        <div className="mb-6 bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">Search employees</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                  value={data.search}
                  onChange={(e) => setData('search', e.target.value)}
                />
              </div>
            </div>
            
            {/* Department Filter Dropdown */}
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mt-4 md:mt-0">
              <div className="w-full md:w-48">
                <select
                  value={data.department}
                  onChange={(e) => setData('department', e.target.value)}
                  className="block w-full pl-3 pr-10 py-3 text-base border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-2xl bg-white/50 backdrop-blur-sm"
                >
                  <option value="">All Departments</option>
                  {departments && Array.isArray(departments) && departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleFilter}
                  disabled={processing}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Apply Filters
                </button>
                
                {(data.search || data.department || data.date_from || data.date_to) && (
                  <button
                    onClick={() => {
                      setData({
                        status: 'all',
                        date_from: '',
                        date_to: '',
                        search: '',
                        department: '',
                      });
                      setTimeout(handleFilter, 100);
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-2xl hover:bg-gray-50 transition-all duration-300"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

                  {/* Add this right before the Employees Table */}
<div className="mb-4 flex items-center justify-between">
    <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>💡 <strong>Tip:</strong> Click on employee avatars to quickly view their details and leave history</span>
    </div>
</div>


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
                      ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.name}
                  {tab.count > 0 && (
                    <span className={`
                      ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                      ${activeTab === tab.id
                        ? 'bg-indigo-100 text-indigo-800'
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
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 text-left text-sm">
                  <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Employee & Type</th>
                  <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                  <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Approval Progress</th>
                  <th className="p-4 font-medium text-gray-500 uppercase tracking-wider w-48">Actions</th>
                </tr>
              </thead>
             
              <tbody>
  {filteredRequests.length === 0 ? (
    <tr>
      <td colSpan="6" className="p-8 text-center">
        <div className="flex flex-col items-center">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-600">No leave requests found</h3>
          <p className="text-gray-500 mt-2">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      </td>
    </tr>
  ) : (
    filteredRequests.map((request) => {
      const actions = getAvailableActions(request);
      const isDeptHead = isDeptHeadRequest(request);
      const isRescheduled = isRescheduledRequest(request);
      
      // Calculate total days - use selected_dates count if available, otherwise calculate from date range
      const totalDays = request.selected_dates 
        ? request.selected_dates.length 
        : Math.ceil((new Date(request.date_to) - new Date(request.date_from)) / (1000 * 60 * 60 * 24)) + 1;
      
      // Get display status
      const displayStatus = getDisplayStatus(request);
      const statusColor = getDisplayStatusColor(request);
      
      return (
        <tr key={request.id} className="border-t hover:bg-gray-50/50 transition-colors">
          <td className="p-4">
  <div className="flex items-center space-x-3">
    <button 
      onClick={() => handleAvatarClick(request.employee)}
      className="flex items-center space-x-3 hover:opacity-80 transition-all duration-300 group relative"
      title="Click to view employee details and leave history"
    >
      <div className="flex-shrink-0 relative">
        <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <span className="text-white font-medium">
            {request.employee?.firstname?.charAt(0)}{request.employee?.lastname?.charAt(0)}
          </span>
        </div>
        {/* Hover indicator */}
        <div className="absolute -inset-1 rounded-2xl border-2 border-blue-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors flex items-center space-x-2">
          <span>{request.employee?.firstname} {request.employee?.lastname}</span>
          <svg className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
        <div className="text-sm text-gray-500">
          {request.employee?.department?.name}
        </div>
        <div className="flex items-center space-x-2 mt-1">
          {isDeptHead && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Dept Head
            </span>
          )}
          {request.employee?.user?.role === 'admin' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Admin
            </span>
          )}
        </div>
        <div className="text-xs text-blue-600 mt-1">
          {request.employee?.user?.role === 'admin' ? 'HR → Admin' : 
           isDeptHead ? 'HR → Admin' : 'HR → Dept Head → Admin'}
        </div>
      </div>
      
      {/* Hover Tooltip */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
        View employee details
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
      </div>
    </button>
  </div>
</td>
          <td className="p-4">
            <div className="text-sm text-gray-900">{request.leave_type?.name}</div>
            <div className="text-sm text-gray-500">{request.leave_type?.code}</div>
          </td>
          <td className="p-4">
            <div className="text-sm text-gray-900">
              {formatDate(request.date_from)} - {formatDate(request.date_to)}
            </div>
            <div className="text-sm text-gray-500">
              {totalDays} days
            </div>
           
{isRescheduled && request.reschedule_history && request.reschedule_history.length > 0 && (
  <div className="text-xs text-purple-600 mt-1">
    <span className="font-medium">(Rescheduled)</span>
    {request.reschedule_history[0]?.original_dates && (
      <div className="text-gray-400">
        Originally: {formatDate(request.reschedule_history[0].original_dates.date_from)} to {formatDate(request.reschedule_history[0].original_dates.date_to)}
      </div>
    )}
  </div>
)}
          </td>
          <td className="p-4">
            <div className="flex flex-col space-y-1">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                {displayStatus}
              </span>
              {isRescheduled && (
                <span className="text-xs text-purple-600">(Rescheduled)</span>
              )}
            </div>
          </td>
          <td className="p-4">
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
                  {/* Show bypassed approvals for special roles */}
                  {(isDeptHead || request.employee?.user?.role === 'admin') && 
                   !request.approvals.find(a => a.role === 'dept_head') && (
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
          <td className="p-4">
            <div className="flex items-center justify-start space-x-2">
              {actions.map((action, index) => (
                <button
                  key={action.type}
                  onClick={action.onClick}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-300 ${action.color}`}
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

          {/* Pagination - Fixed for each tab */}
          {leaveRequests.data && leaveRequests.data.length > 0 && (
           <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
           <div className="text-sm text-gray-700">
             Showing <span className="font-medium">{leaveRequests.from}</span> to{' '}
             <span className="font-medium">{leaveRequests.to}</span> of{' '}
             <span className="font-medium">{leaveRequests.total}</span> results
           </div>
           
           {/* Pagination buttons */}
           <div className="flex space-x-2">
             {leaveRequests.links.map((link, index) => (
               <button
                 key={index}
                 onClick={() => handlePageChange(link.url)}
                 className={`px-4 py-2 text-sm border-2 rounded-2xl transition-all duration-300 ${
                   link.active
                     ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500 shadow-lg'
                     : 'border-gray-200 hover:bg-gray-50 hover:shadow-lg'
                 }`}
                 dangerouslySetInnerHTML={{ __html: link.label }}
                  />


                ))}

                {/* Next Page */}
                {leaveRequests.next_page_url && (
                  <button
                    onClick={() => handlePageChange(leaveRequests.next_page_url)}
                    className="px-4 py-2 text-sm border-2 border-gray-200 rounded-2xl hover:bg-gray-50 transition-all duration-300 hover:shadow-lg"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Simple Full-screen Modal */}
        {showFormModal && selectedRequestForForm && (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800">
                Generate Leave Form - {selectedRequestForForm.employee?.firstname} {selectedRequestForForm.employee?.lastname}
              </h2>
              <div className="flex space-x-3">
                <button
                  onClick={closeFormModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            
            {/* Form Content */}
            <div className="p-6">
              <LeaveForm 
                {...prepareFormData(selectedRequestForForm)}
              />
            </div>
          </div>
        )}
      </div>

      
      <EmployeeModal 
  employee={selectedEmployee}
  isOpen={isEmployeeModalOpen}
  onClose={() => {
    setIsEmployeeModalOpen(false);
    setSelectedEmployee(null);
  }}
/>
    </HRLayout>
  );
}