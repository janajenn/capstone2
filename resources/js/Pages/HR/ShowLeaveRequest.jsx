import HRLayout from '@/Layouts/HRLayout';
import { useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';

const getStatusColor = (status) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function ShowLeaveRequest() {
  const { props } = usePage();
  const { leaveRequest, flash } = props;

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);

  const { data, setData, post, processing, errors } = useForm({
    remarks: '',
  });

  const handleApprove = () => {
    if (confirm('Are you sure you want to approve this leave request?')) {
      post(`/hr/leave-requests/${leaveRequest.id}/approve`);
    }
  };

  const handleReject = () => {
    if (!data.remarks.trim()) {
      alert('Please provide rejection remarks.');
      return;
    }
    post(`/hr/leave-requests/${leaveRequest.id}/reject`);
  };

  const calculateDays = () => {
    const start = new Date(leaveRequest.date_from);
    const end = new Date(leaveRequest.date_to);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  };

  return (
    <HRLayout>
      <div className="mb-6">
        <button
          onClick={() => router.visit('/hr/leave-requests')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Leave Requests
        </button>
        <h1 className="text-2xl font-bold">Leave Request Details</h1>
      </div>

      {flash?.success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {flash.success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Request Information</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(leaveRequest.status)}`}>
                {leaveRequest.status.charAt(0).toUpperCase() + leaveRequest.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                <p className="mt-1 text-sm text-gray-900">{leaveRequest.leave_type?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration</label>
                <p className="mt-1 text-sm text-gray-900">{calculateDays()} day(s)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date From</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(leaveRequest.date_from)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date To</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(leaveRequest.date_to)}</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <p className="mt-1 text-sm text-gray-900">{leaveRequest.reason}</p>
            </div>
          </div>

          {/* Additional Details */}
          {leaveRequest.details && leaveRequest.details.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Additional Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leaveRequest.details.map((detail, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700">
                      {detail.field_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{detail.field_value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachment */}
          {leaveRequest.attachment_path && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Attachment</h2>
              <a
                href={`/storage/${leaveRequest.attachment_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Attachment
              </a>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Employee Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Employee Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">
                  {leaveRequest.employee?.firstname} {leaveRequest.employee?.lastname}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <p className="mt-1 text-sm text-gray-900">{leaveRequest.employee?.department?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <p className="mt-1 text-sm text-gray-900">{leaveRequest.employee?.position}</p>
              </div>
            </div>
          </div>

          {/* Request Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Request Timeline</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Submitted</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(leaveRequest.created_at)}</p>
              </div>
              {leaveRequest.approved_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Processed</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(leaveRequest.approved_at)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {leaveRequest.status === 'pending' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Approve Request'}
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={processing}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Reject Request
                </button>
              </div>
            </div>
          )}

          {/* Approval/Rejection Form */}
          {showRejectForm && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Reject Request</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rejection Remarks</label>
                  <textarea
                    value={data.remarks}
                    onChange={(e) => setData('remarks', e.target.value)}
                    rows="3"
                    className="mt-1 w-full border rounded p-2"
                    placeholder="Please provide a reason for rejection..."
                  />
                  {errors.remarks && <p className="text-red-500 text-sm mt-1">{errors.remarks}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </HRLayout>
  );
}

