import AdminLayout from '@/Layouts/AdminLayout';
import { useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';

const getStatusColor = (status) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const calculateWorkingDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
  }

  return count;
};

export default function ShowLeaveRequest() {
  const { props } = usePage();
  const { leaveRequest, workingDays, leaveCredit, flash } = props;

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);

  const { data, setData, post, processing, errors } = useForm({
    remarks: '',
  });

  const handleApprove = async () => {
    const result = await Swal.fire({
      title: 'Approve Leave Request?',
      text: 'Are you sure you want to approve this leave request?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      post(`/admin/leave-requests/${leaveRequest.id}/approve`);
    }
  };

  const handleReject = async () => {
    if (!data.remarks.trim()) {
      await Swal.fire({
        title: 'Remarks Required',
        text: 'Please provide rejection remarks.',
        icon: 'warning',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Reject Leave Request?',
      text: 'Are you sure you want to reject this leave request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reject!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      post(`/admin/leave-requests/${leaveRequest.id}/reject`);
    }
  };

  const calculateTotalDays = () => {
    const start = new Date(leaveRequest.date_from);
    const end = new Date(leaveRequest.date_to);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <button
          onClick={() => router.visit('/admin/leave-requests')}
          className="text-green-500 hover:text-green-600 mb-4 flex items-center transition duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Leave Requests
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Leave Request Details</h1>
      </div>

      {flash?.success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {flash.success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {leaveRequest.employee?.firstname} {leaveRequest.employee?.lastname}
                </h2>
                <p className="text-gray-600">{leaveRequest.employee?.department?.name}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(leaveRequest.status)}`}>
                {leaveRequest.status.charAt(0).toUpperCase() + leaveRequest.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-sm font-semibold text-green-800 mb-2">Leave Type</h3>
                <p className="text-lg font-bold text-green-900">{leaveRequest.leave_type?.name}</p>
                <p className="text-sm text-green-600">({leaveRequest.leave_type?.code})</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-sm font-semibold text-green-800 mb-2">Duration</h3>
                <p className="text-lg font-bold text-green-900">{calculateTotalDays()} day(s)</p>
                <p className="text-sm text-green-600">{workingDays} working days</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Credit Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Days With Pay</span>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">{leaveRequest.days_with_pay || 0}</p>
                  <p className="text-xs text-green-600 mt-1">Paid leave days</p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Days Without Pay</span>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">{leaveRequest.days_without_pay || 0}</p>
                  <p className="text-xs text-green-600 mt-1">Unpaid leave days</p>
                </div>
              </div>

              {leaveCredit && (leaveRequest.leave_type?.code === 'SL' || leaveRequest.leave_type?.code === 'VL') && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Available {leaveRequest.leave_type?.code} Balance: {' '}
                    <span className="font-semibold">
                      {leaveRequest.leave_type?.code === 'SL' ? leaveCredit.sl_balance : leaveCredit.vl_balance} days
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-sm font-semibold text-green-700 mb-2">Start Date</h3>
                <p className="text-lg font-medium text-green-900">{formatDate(leaveRequest.date_from)}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-sm font-semibold text-green-700 mb-2">End Date</h3>
                <p className="text-lg font-medium text-green-900">{formatDate(leaveRequest.date_to)}</p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-sm font-semibold text-green-700 mb-2">Reason for Leave</h3>
              <p className="text-green-900 leading-relaxed">{leaveRequest.reason}</p>
            </div>
          </div>

          {leaveRequest.details && leaveRequest.details.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leaveRequest.details.map((detail, index) => (
                  <div key={index} className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      {detail.field_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    <p className="text-green-900 font-medium">{detail.field_value || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {leaveRequest.attachment_path && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Supporting Document</h2>
              <a
                href={`/storage/${leaveRequest.attachment_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Attachment
              </a>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Employee Details</h2>
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <label className="block text-xs font-medium text-green-700 mb-1">Name</label>
                <p className="text-sm font-medium text-green-900">
                  {leaveRequest.employee?.firstname} {leaveRequest.employee?.lastname}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <label className="block text-xs font-medium text-green-700 mb-1">Department</label>
                <p className="text-sm font-medium text-green-900">{leaveRequest.employee?.department?.name}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <label className="block text-xs font-medium text-green-700 mb-1">Position</label>
                <p className="text-sm font-medium text-green-900">{leaveRequest.employee?.position}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Request Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Submitted</span>
                <span className="text-sm font-medium text-green-900">{formatDate(leaveRequest.created_at)}</span>
              </div>
              {leaveRequest.updated_at !== leaveRequest.created_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium text-green-900">{formatDate(leaveRequest.updated_at)}</span>
                </div>
              )}
              {leaveRequest.approved_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Processed</span>
                  <span className="text-sm font-medium text-green-900">{formatDate(leaveRequest.approved_at)}</span>
                </div>
              )}
            </div>
          </div>

          {(leaveRequest.status === 'pending_admin' || leaveRequest.status === 'pending') && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Manage Request</h2>
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition duration-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {processing ? 'Processing...' : 'Approve Request'}
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={processing}
                  className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition duration-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject Request
                </button>
              </div>
            </div>
          )}

          {showRejectForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Reject Request</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Remarks</label>
                  <textarea
                    value={data.remarks}
                    onChange={(e) => setData('remarks', e.target.value)}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Please provide a reason for rejection..."
                  />
                  {errors.remarks && <p className="text-red-500 text-sm mt-1">{errors.remarks}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition duration-200"
                  >
                    {processing ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}