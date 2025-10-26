// resources/js/Pages/DeptHead/ShowCreditConversion.jsx
import React from 'react';
import { Head, Link } from '@inertiajs/react';
import DeptHeadLayout from '@/Layouts/DeptHeadLayout';

const ShowCreditConversion = ({ conversion }) => {
    const formatDate = (dateString) => {
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
            'pending': 'bg-yellow-100 text-yellow-800',
            'hr_approved': 'bg-blue-100 text-blue-800',
            'dept_head_approved': 'bg-purple-100 text-purple-800',
            'admin_approved': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <DeptHeadLayout>
            <Head title={`Credit Conversion - ${conversion.employee_name}`} />
            
            <div className="py-6">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <Link 
                            href={route('dept_head.credit-conversions')}
                            className="text-blue-600 hover:text-blue-900 mb-4 inline-block"
                        >
                            ← Back to Credit Conversions
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Credit Conversion Details
                        </h1>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Information</h3>
                                    <dl className="space-y-2">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Employee Name</dt>
                                            <dd className="text-sm text-gray-900">{conversion.employee_name}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Department</dt>
                                            <dd className="text-sm text-gray-900">{conversion.department}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Position</dt>
                                            <dd className="text-sm text-gray-900">{conversion.employee?.position}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Details</h3>
                                    <dl className="space-y-2">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Leave Type</dt>
                                            <dd className="text-sm text-gray-900">
                                                {conversion.leave_type_name} ({conversion.leave_type_code})
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Credits Requested</dt>
                                            <dd className="text-sm text-gray-900">{conversion.credits_requested} days</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Cash Equivalent</dt>
                                            <dd className="text-sm text-gray-900 font-semibold">
                                                {formatCurrency(conversion.equivalent_cash)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                                            <dd className="text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(conversion.status)}`}>
                                                    {conversion.status_display}
                                                </span>
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Timeline</h3>
                                <div className="space-y-4">
                                    {/* Submitted */}
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-900">Submitted</p>
                                            <p className="text-sm text-gray-500">{formatDate(conversion.submitted_at)}</p>
                                            {conversion.employee_remarks && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    <strong>Remarks:</strong> {conversion.employee_remarks}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* HR Approval */}
                                    {conversion.hr_approved_at && (
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-900">
                                                    Approved by HR - {conversion.hr_approver_name}
                                                </p>
                                                <p className="text-sm text-gray-500">{formatDate(conversion.hr_approved_at)}</p>
                                                {conversion.hr_remarks && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        <strong>Remarks:</strong> {conversion.hr_remarks}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Department Head Approval */}
                                    {conversion.dept_head_approved_at && (
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-900">
                                                    Approved by Department Head - {conversion.dept_head_approver_name}
                                                </p>
                                                <p className="text-sm text-gray-500">{formatDate(conversion.dept_head_approved_at)}</p>
                                                {conversion.dept_head_remarks && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        <strong>Remarks:</strong> {conversion.dept_head_remarks}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Admin Approval */}
                                    {conversion.admin_approved_at && (
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-900">
                                                    Approved by Admin - {conversion.admin_approver_name}
                                                </p>
                                                <p className="text-sm text-gray-500">{formatDate(conversion.admin_approved_at)}</p>
                                                {conversion.admin_remarks && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        <strong>Remarks:</strong> {conversion.admin_remarks}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DeptHeadLayout>
    );
};

export default ShowCreditConversion;