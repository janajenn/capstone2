// resources/js/Pages/Admin/ShowCreditConversion.jsx
import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Swal from 'sweetalert2';

const ShowCreditConversion = ({ conversion }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    const getStatusBadgeClass = (status) => {
        const classes = {
            'pending': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
            'hr_approved': 'bg-blue-100 text-blue-800 border border-blue-200',
            'dept_head_approved': 'bg-purple-100 text-purple-800 border border-purple-200',
            'admin_approved': 'bg-green-100 text-green-800 border border-green-200',
            'rejected': 'bg-red-100 text-red-800 border border-red-200'
        };
        return classes[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
    };

    const getStatusDisplay = (status) => {
        const statusMap = {
            'pending': 'Pending HR Approval',
            'hr_approved': 'Approved by HR - Pending Dept Head',
            'dept_head_approved': 'Approved by Dept Head - Pending Admin',
            'admin_approved': 'Fully Approved',
            'rejected': 'Rejected'
        };
        return statusMap[status] || status;
    };

    const handleApprove = () => {
        Swal.fire({
            title: 'Approve Credit Conversion?',
            text: `Are you sure you want to approve ${conversion.employee_name}'s request for ${formatCurrency(conversion.equivalent_cash)}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Approve & Deduct Credits',
            cancelButtonText: 'Cancel',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl shadow-2xl border border-gray-200',
                title: 'text-xl font-bold text-gray-800'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.credit-conversions.approve', conversion.id));
            }
        });
    };

    const handleReject = () => {
        Swal.fire({
            title: 'Reject Credit Conversion?',
            input: 'textarea',
            inputLabel: 'Reason for Rejection',
            inputPlaceholder: 'Please provide a reason for rejecting this request...',
            inputAttributes: {
                required: 'true'
            },
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Reject Request',
            cancelButtonText: 'Cancel',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl shadow-2xl border border-gray-200',
                title: 'text-xl font-bold text-gray-800'
            },
            preConfirm: (remarks) => {
                if (!remarks) {
                    Swal.showValidationMessage('Please provide a reason for rejection');
                    return false;
                }
                return remarks;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.credit-conversions.reject', conversion.id), {
                    remarks: result.value
                });
            }
        });
    };

    const getApproverName = (approver) => {
        if (!approver) return 'N/A';
        return approver.name || `${approver.first_name} ${approver.last_name}`;
    };

    return (
        <AdminLayout>
            <Head title={`Credit Conversion - ${conversion.employee_name}`} />
            
            <div className="py-6">
                <div className="max-w-6xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Credit Conversion Request
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    Detailed view of credit conversion request #{conversion.id}
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Link 
                                    href={route('admin.credit-conversions')}
                                    className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-medium"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to List
                                </Link>
                                
                                {/* Action Buttons */}
                                {conversion.status === 'dept_head_approved' && (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={handleApprove}
                                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 font-medium"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Approve
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 font-medium"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Left Column - Main Details */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Status & Overview Card */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Request Overview</h2>
                                        <p className="text-sm text-gray-600">Current status and basic information</p>
                                    </div>
                                    <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusBadgeClass(conversion.status)}`}>
                                        {getStatusDisplay(conversion.status)}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{conversion.credits_requested}</div>
                                        <div className="text-sm text-gray-600">Credits Requested</div>
                                        <div className="text-xs text-blue-500 mt-1">Vacation Leave Days</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {formatCurrency(conversion.equivalent_cash)}
                                        </div>
                                        <div className="text-sm text-gray-600">Cash Equivalent</div>
                                        <div className="text-xs text-green-500 mt-1">Total Amount</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-purple-600">
                                            {formatCurrency(conversion.conversion_rate || 0)}
                                        </div>
                                        <div className="text-sm text-gray-600">Rate per Credit</div>
                                        <div className="text-xs text-purple-500 mt-1">Conversion Rate</div>
                                    </div>
                                </div>
                            </div>

                            {/* Employee Information */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h2>
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                        <span className="text-white font-bold text-lg">
                                            {conversion.employee_name?.split(' ').map(n => n[0]).join('')}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Full Name</label>
                                            <p className="text-sm font-medium text-gray-900">{conversion.employee_name}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Employee ID</label>
                                            <p className="text-sm font-medium text-gray-900">{conversion.employee_id}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Department</label>
                                            <p className="text-sm font-medium text-gray-900">
                                                {conversion.employee?.department?.name || conversion.department}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Position</label>
                                            <p className="text-sm font-medium text-gray-900">{conversion.position}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Leave Type Details */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave Type Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Leave Type</label>
                                        <p className="text-sm font-medium text-gray-900">
                                            {conversion.leave_type_name} ({conversion.leave_type_code})
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Description</label>
                                        <p className="text-sm text-gray-900">
                                            {conversion.leave_type_description || 'Vacation Leave Credits'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Approval Timeline */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Approval Timeline</h2>
                                <div className="space-y-6">
                                    {/* Request Submitted */}
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">Request Submitted</p>
                                            <p className="text-sm text-gray-500">{formatDate(conversion.created_at)}</p>
                                            <p className="text-xs text-gray-400 mt-1">Initial submission by employee</p>
                                        </div>
                                    </div>

                                    {/* HR Approval */}
                                    {conversion.hr_approved_at && (
                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">HR Approval</p>
                                                <p className="text-sm text-gray-500">{formatDate(conversion.hr_approved_at)}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Approved by: {getApproverName(conversion.hr_approver)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Department Head Approval */}
                                    {conversion.dept_head_approved_at && (
                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">Department Head Approval</p>
                                                <p className="text-sm text-gray-500">{formatDate(conversion.dept_head_approved_at)}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Approved by: {getApproverName(conversion.dept_head_approver)}
                                                    </p>
                                                </div>
                                        </div>
                                    )}

                                    {/* Admin Approval */}
                                    {conversion.admin_approved_at && (
                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">Admin Approval</p>
                                                <p className="text-sm text-gray-500">{formatDate(conversion.admin_approved_at)}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Approved by: {getApproverName(conversion.admin_approver)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rejection */}
                                    {conversion.rejected_at && (
                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">Request Rejected</p>
                                                <p className="text-sm text-gray-500">{formatDate(conversion.rejected_at)}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Rejected by: {getApproverName(conversion.rejected_by)}
                                                </p>
                                                {conversion.rejection_remarks && (
                                                    <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                                                        <p className="text-sm font-medium text-red-800">Reason:</p>
                                                        <p className="text-sm text-red-700 mt-1">{conversion.rejection_remarks}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Quick Info & Actions */}
                        <div className="space-y-6">
                            {/* Request Summary */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Summary</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Request ID:</span>
                                        <span className="text-sm font-medium text-gray-900">#{conversion.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Submitted:</span>
                                        <span className="text-sm text-gray-900">{formatDate(conversion.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Last Updated:</span>
                                        <span className="text-sm text-gray-900">{formatDate(conversion.updated_at)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Conversion Calculation */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Calculation</h2>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{conversion.credits_requested} credits ×</span>
                                        <span className="font-medium">{formatCurrency(conversion.conversion_rate || 0)}</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                                        <span className="text-gray-800 font-medium">Total:</span>
                                        <span className="text-green-600 font-bold">{formatCurrency(conversion.equivalent_cash)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Current Balance Info (if available) */}
                            {(conversion.current_credits !== undefined) && (
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Credit Balance</h2>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600 mb-2">
                                            {conversion.current_credits}
                                        </div>
                                        <div className="text-sm text-gray-600">Current VL Credits</div>
                                        <div className="text-xs text-gray-500 mt-1">After conversion: {conversion.current_credits - conversion.credits_requested}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default ShowCreditConversion;