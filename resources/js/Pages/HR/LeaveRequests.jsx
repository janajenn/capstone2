import HRLayout from '@/Layouts/HRLayout';
import { useForm, usePage, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Helper function to determine approval status based on leave_approvals
// Helper function to determine approval status based on leave_approvals
// Helper function to determine approval status based on leave_approvals
const getApprovalStatus = (request) => {
  if (!request.approvals || request.approvals.length === 0) {
    return 'hr_pending';
  }

  // Check if any approval has rejected status
  const hasRejection = request.approvals.some(approval => approval.status === 'rejected');
  if (hasRejection) {
    return 'rejected';
  }

  // Get approvals by role
  const hrApproval = request.approvals.find(a => a.role === 'hr');
  const deptHeadApproval = request.approvals.find(a => a.role === 'dept_head');
  const adminApproval = request.approvals.find(a => a.role === 'admin');

  // Check if fully approved (all three roles have approved)
  if (hrApproval && deptHeadApproval && adminApproval) {
    return 'fully_approved';
  }

  // Check if approved by HR only
  if (hrApproval && !deptHeadApproval && !adminApproval) {
    return 'approved_by_hr';
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
    case 'approved_by_hr':
      return 'Approved by HR';
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
    case 'approved_by_hr':
      return 'bg-blue-100 text-blue-800';
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


export default function LeaveRequests() {
  const { props } = usePage();
  const { leaveRequests, filters, flash } = props;

  const [selectedRequests, setSelectedRequests] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const { data, setData, post, processing } = useForm({
    status: filters?.status || 'all',
    date_from: filters?.date_from || '',
    date_to: filters?.date_to || '',
    search: filters?.search || '',
  });

  // Filter leave requests based on active tab using approval status
  const filteredRequests = useMemo(() => {
  if (!leaveRequests.data) return [];

  return leaveRequests.data.filter(request => {
    const approvalStatus = getApprovalStatus(request);

    switch (activeTab) {
      case 'hr_pending':
        return approvalStatus === 'hr_pending';
      case 'approved_by_hr':
        return approvalStatus === 'approved_by_hr';
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
  if (!leaveRequests.data) return { hr_pending: 0, approved_by_hr: 0, rejected: 0, fully_approved: 0 };

  const counts = {
    hr_pending: 0,
    approved_by_hr: 0,
    rejected: 0,
    fully_approved: 0
  };

  leaveRequests.data.forEach(request => {
    const approvalStatus = getApprovalStatus(request);

    switch (approvalStatus) {
      case 'hr_pending':
        counts.hr_pending++;
        break;
      case 'approved_by_hr':
        counts.approved_by_hr++;
        break;
      case 'rejected':
        counts.rejected++;
        break;
      case 'fully_approved':
        counts.fully_approved++;
        break;
      default:
        // For in_progress status, don't count in any tab
        break;
    }
  });

  return counts;
}, [leaveRequests.data]);
// Tab configuration


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
    setShowBulkActions(selectedRequests.length > 0);
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

    post('/hr/leave-requests/bulk-action', formData);
  };

  const handleApprove = (requestId) => {
    if (confirm('Are you sure you want to approve this leave request?')) {
      post(`/hr/leave-requests/${requestId}/approve`);
    }
  };

  const handleReject = (requestId) => {
    const remarks = prompt('Please provide rejection remarks:');
    if (remarks) {
      post(`/hr/leave-requests/${requestId}/reject`, {
        remarks: remarks,
      });
    }
  };

  // Check if a request can be approved (only pending requests)
  const canApprove = (request) => {
  return getApprovalStatus(request) === 'hr_pending';
};

  // Tab configuration
  const tabs = [
  { id: 'hr_pending', name: 'HR Pending', count: tabCounts.hr_pending },
  { id: 'approved_by_hr', name: 'Approved by HR', count: tabCounts.approved_by_hr },
  { id: 'rejected', name: 'Rejected', count: tabCounts.rejected },
  { id: 'fully_approved', name: 'Fully Approved', count: tabCounts.fully_approved },
];

  return (
    <HRLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leave Requests</h1>
        {showBulkActions && (
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={processing}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Approve Selected ({selectedRequests.length})
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={processing}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Reject Selected ({selectedRequests.length})
            </button>
          </div>
        )}
      </div>

      {flash?.success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {flash.success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
           <select
  value={data.status}
  onChange={(e) => setData('status', e.target.value)}
  className="w-full border rounded p-2"
>
  <option value="all">All Status</option>
  <option value="hr_pending">HR Pending</option>
  <option value="approved_by_hr">Approved by HR</option>
  <option value="rejected">Rejected</option>
  <option value="fully_approved">Fully Approved</option>
</select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Date From</label>
            <input
              type="date"
              value={data.date_from}
              onChange={(e) => setData('date_from', e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Date To</label>
            <input
              type="date"
              value={data.date_to}
              onChange={(e) => setData('date_to', e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Search Employee</label>
            <input
              type="text"
              value={data.search}
              onChange={(e) => setData('search', e.target.value)}
              placeholder="Employee name..."
              className="w-full border rounded p-2"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleFilter}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
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
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                    className="rounded border-gray-300"
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
                  Approval Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No leave requests found in this category.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => handleSelectRequest(request.id)}
                        className="rounded border-gray-300"
                        disabled={!canApprove(request)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.employee?.firstname} {request.employee?.lastname}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(request.date_from)} - {formatDate(request.date_to)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDisplayStatusColor(request)}`}>
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
                          </div>
                        ) : (
                          'No approvals yet'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.visit(`/hr/leave-requests/${request.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {canApprove(request) && (
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
              )}
            </tbody>
          </table>
        </div>
      </div>
    </HRLayout>
  );
}
