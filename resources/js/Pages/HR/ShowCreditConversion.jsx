import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function ShowCreditConversion({ auth, conversion }) {
    const [showApproveForm, setShowApproveForm] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);

    const { data: approveData, setData: setApproveData, post: approvePost, processing: approveProcessing, errors: approveErrors } = useForm({
        remarks: '',
    });

    const { data: rejectData, setData: setRejectData, post: rejectPost, processing: rejectProcessing, errors: rejectErrors } = useForm({
        remarks: '',
    });

    const handleApprove = (e) => {
        e.preventDefault();
        approvePost(route('hr.credit-conversions.approve', conversion.conversion_id), {
            onSuccess: () => {
                setShowApproveForm(false);
                setApproveData({ remarks: '' });
            },
        });
    };

    const handleReject = (e) => {
        e.preventDefault();
        rejectPost(route('hr.credit-conversions.reject', conversion.conversion_id), {
            onSuccess: () => {
                setShowRejectForm(false);
                setRejectData({ remarks: '' });
            },
        });
    };

    const getStatusConfig = (status) => {
        const configs = {
            pending: {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                color: 'bg-amber-50 text-amber-700 border-amber-200',
                label: 'Pending Review'
            },
            approved: {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ),
                color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                label: 'Approved'
            },
            rejected: {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ),
                color: 'bg-rose-50 text-rose-700 border-rose-200',
                label: 'Rejected'
            }
        };
        return configs[status] || configs.pending;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const statusConfig = getStatusConfig(conversion.status);
    const canTakeAction = conversion.status === 'pending';
    const isVL = conversion.leave_type_code === 'VL';

    return (
        <HRLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Credit Conversion Details</h2>}
        >
            <Head title="Credit Conversion Details" />

            <div className="py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Link 
                            href={route('hr.credit-conversions')}
                            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Credit Conversions
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Important Notice */}
                            {!isVL && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <div>
                                            <h4 className="text-sm font-medium text-amber-900">Non-Eligible Leave Type</h4>
                                            <p className="text-sm text-amber-700 mt-1">
                                                Only Vacation Leave (VL) credits can be monetized. Sick Leave (SL) credits are not eligible for cash conversion.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Status Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Request Status
                                        </h3>
                                        <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color} border`}>
                                            {statusConfig.icon}
                                            <span className="ml-1.5">{statusConfig.label}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="text-sm text-gray-600">
                                        {conversion.status === 'pending' && 'This request is awaiting your review and approval.'}
                                        {conversion.status === 'approved' && 'This request has been approved and processed.'}
                                        {conversion.status === 'rejected' && 'This request has been rejected.'}
                                    </div>
                                </div>
                            </div>

                            {/* Conversion Details */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        Conversion Details
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Leave Type</label>
                                                <div className="mt-1">
                                                    <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                                                        isVL 
                                                            ? 'bg-green-100 text-green-800 border border-green-200' 
                                                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                                                    }`}>
                                                        {conversion.leave_type_code} - {conversion.leave_type_name}
                                                        {isVL && (
                                                            <span className="ml-2 px-2 py-1 text-xs bg-green-200 text-green-800 rounded-full">
                                                                Monetizable
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Credits Requested</label>
                                                <div className="mt-1 flex items-center text-lg font-semibold text-gray-900">
                                                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {conversion.credits_requested} days
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Conversion Value</label>
                                                <div className="mt-1">
                                                    <div className="text-lg font-semibold text-gray-900">
                                                        {isVL ? 'Eligible for Monetization' : 'Not Eligible'}
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        {isVL 
                                                            ? 'VL credits can be converted to cash equivalent'
                                                            : 'SL credits cannot be monetized'
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Date Submitted</label>
                                                <div className="mt-1 flex items-center text-sm text-gray-900">
                                                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {formatDate(conversion.submitted_at)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {conversion.remarks && (
                                        <div className="mt-6">
                                            <label className="text-sm font-medium text-gray-500">Employee Remarks</label>
                                            <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700">
                                                {conversion.remarks}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Employee Information */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Employee Information
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Full Name</label>
                                                <div className="mt-1 text-sm text-gray-900 font-medium">
                                                    {conversion.employee.firstname} {conversion.employee.lastname}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Position</label>
                                                <div className="mt-1 text-sm text-gray-900">
                                                    {conversion.employee.position}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Department</label>
                                                <div className="mt-1">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        {conversion.employee.department?.name || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Monthly Salary</label>
                                                <div className="mt-1 text-sm font-semibold text-gray-900">
                                                    ₱{conversion.employee.monthly_salary?.toLocaleString() || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {canTakeAction && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                                        <h3 className="text-lg font-semibold text-gray-900">Take Action</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <PrimaryButton
                                                onClick={() => setShowApproveForm(true)}
                                                disabled={!isVL}
                                                className={`flex-1 py-3 text-base font-medium ${
                                                    isVL 
                                                        ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600' 
                                                        : 'bg-gray-400 border-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {isVL ? 'Approve Request' : 'VL Only'}
                                            </PrimaryButton>
                                            <DangerButton
                                                onClick={() => setShowRejectForm(true)}
                                                className="flex-1 py-3 text-base font-medium"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Reject Request
                                            </DangerButton>
                                        </div>
                                        {!isVL && (
                                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <p className="text-sm text-amber-700">
                                                    Only Vacation Leave (VL) conversion requests can be approved. Sick Leave (SL) requests must be rejected.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Approval Information */}
                            {conversion.status !== 'pending' && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                            {conversion.status === 'approved' ? (
                                                <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 mr-2 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                            {conversion.status === 'approved' ? 'Approval' : 'Rejection'} Information
                                        </h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Approved/Rejected By</label>
                                                <div className="mt-1 text-sm text-gray-900 font-medium">
                                                    {conversion.approver?.name || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Date</label>
                                                <div className="mt-1 text-sm text-gray-900">
                                                    {formatDate(conversion.approved_at)}
                                                </div>
                                            </div>
                                        </div>
                                        {conversion.remarks && (
                                            <div className="mt-6">
                                                <label className="text-sm font-medium text-gray-500">HR Remarks</label>
                                                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700">
                                                    {conversion.remarks}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Information */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                                    <h3 className="text-lg font-semibold text-gray-900">Quick Information</h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center text-sm">
                                            <svg className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <div>
                                                <div className="font-medium text-gray-900">Submitted</div>
                                                <div className="text-gray-500">{formatDate(conversion.submitted_at)}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <svg className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <div>
                                                <div className="font-medium text-gray-900">Department</div>
                                                <div className="text-gray-500">{conversion.employee.department?.name || 'N/A'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <svg className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            <div>
                                                <div className="font-medium text-gray-900">Eligibility</div>
                                                <div className="text-gray-500">
                                                    {isVL ? 'VL - Eligible' : 'SL - Not Eligible'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Important Notes */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                                    <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Important Notes
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3 text-sm text-gray-600">
                                        <div className="flex items-start">
                                            <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span><strong>Only VL credits</strong> can be monetized</span>
                                        </div>
                                        <div className="flex items-start">
                                            <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span><strong>Minimum 10 VL credits</strong> required</span>
                                        </div>
                                        <div className="flex items-start">
                                            <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span><strong>Maximum 10 days</strong> per year</span>
                                        </div>
                                        <div className="flex items-start">
                                            <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>SL credits <strong>cannot</strong> be converted</span>
                                        </div>
                                        <div className="flex items-start">
                                            <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Cash amount details are handled separately</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Approve Form Modal */}
                    {showApproveForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-white">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Approve Conversion Request
                                    </h3>
                                </div>
                                <form onSubmit={handleApprove} className="p-6 space-y-4">
                                    <div>
                                        <InputLabel htmlFor="approve_remarks" value="Approval Remarks (Optional)" />
                                        <textarea
                                            id="approve_remarks"
                                            value={approveData.remarks}
                                            onChange={(e) => setApproveData('remarks', e.target.value)}
                                            placeholder="Any additional notes or comments for the employee..."
                                            rows={4}
                                            className="mt-1 block w-full border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg shadow-sm transition-colors duration-200"
                                        />
                                        {approveErrors.remarks && (
                                            <InputError message={approveErrors.remarks} className="mt-2" />
                                        )}
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <PrimaryButton
                                            type="submit"
                                            disabled={approveProcessing}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 py-3"
                                        >
                                            {approveProcessing ? (
                                                <div className="flex items-center justify-center">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Approving...
                                                </div>
                                            ) : (
                                                'Approve VL Conversion'
                                            )}
                                        </PrimaryButton>
                                        <button
                                            type="button"
                                            onClick={() => setShowApproveForm(false)}
                                            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Reject Form Modal */}
                    {showRejectForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-rose-50 to-white">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Reject Conversion Request
                                    </h3>
                                </div>
                                <form onSubmit={handleReject} className="p-6 space-y-4">
                                    <div>
                                        <InputLabel htmlFor="reject_remarks" value="Rejection Reason *" />
                                        <textarea
                                            id="reject_remarks"
                                            value={rejectData.remarks}
                                            onChange={(e) => setRejectData('remarks', e.target.value)}
                                            placeholder="Please provide a reason for rejection..."
                                            rows={4}
                                            required
                                            className="mt-1 block w-full border-gray-300 focus:border-rose-500 focus:ring-rose-500 rounded-lg shadow-sm transition-colors duration-200"
                                        />
                                        {rejectErrors.remarks && (
                                            <InputError message={rejectErrors.remarks} className="mt-2" />
                                        )}
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <DangerButton
                                            type="submit"
                                            disabled={rejectProcessing}
                                            className="flex-1 py-3"
                                        >
                                            {rejectProcessing ? (
                                                <div className="flex items-center justify-center">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Rejecting...
                                                </div>
                                            ) : (
                                                'Reject Request'
                                            )}
                                        </DangerButton>
                                        <button
                                            type="button"
                                            onClick={() => setShowRejectForm(false)}
                                            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </HRLayout>
    );
}