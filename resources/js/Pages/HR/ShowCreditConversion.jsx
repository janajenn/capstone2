import React, { useState, useEffect } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

export default function ShowCreditConversion({ auth, conversion, flash }) {
    const [showRejectForm, setShowRejectForm] = useState(false);

    const { data: rejectData, setData: setRejectData, post: rejectPost, processing: rejectProcessing, errors: rejectErrors } = useForm({
        remarks: '',
    });

    const { post: approvePost, processing: approveProcessing } = useForm();

    // Handle SweetAlert2 notifications
    useEffect(() => {
        if (flash.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: flash.success,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: '#10B981',
                color: 'white',
                iconColor: 'white'
            });
        }
        
        if (flash.error) {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: flash.error,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true,
            });
        }
    }, [flash]);

    const handleReject = (e) => {
        e.preventDefault();
        rejectPost(route('hr.credit-conversions.reject', conversion.conversion_id), {
            onSuccess: () => {
                setShowRejectForm(false);
                setRejectData({ remarks: '' });
                // Success message will be handled by the flash message
            },
            onError: (errors) => {
                // Error message will be handled by the flash message
            }
        });
    };

    const handleApprove = () => {
        console.log('Approve button clicked');
        console.log('Conversion ID:', conversion.conversion_id);
        console.log('Route:', route('hr.credit-conversions.approve', conversion.conversion_id));
        
        Swal.fire({
            title: 'Are you sure?',
            text: "You are about to approve this credit conversion request.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, approve it!',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                console.log('Sending approval request...');
                
                approvePost(route('hr.credit-conversions.approve', conversion.conversion_id), {
                    onSuccess: () => {
                        console.log('Approval successful');
                        // Success message will be handled by the flash message
                    },
                    onError: (errors) => {
                        console.log('Approval failed:', errors);
                        // Error message will be handled by the flash message
                    },
                    onFinish: () => {
                        console.log('Approval request finished');
                    }
                });
            }
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
                color: 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300',
                label: 'Pending HR Review'
            },
            hr_approved: {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ),
                color: 'bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-800 border-blue-300',
                label: 'Approved by HR - Pending Dept Head'
            },
            dept_head_approved: {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ),
                color: 'bg-gradient-to-r from-purple-100 to-violet-200 text-purple-800 border-purple-300',
                label: 'Approved by Dept Head - Pending Admin'
            },
            admin_approved: {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ),
                color: 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border-green-300',
                label: 'Fully Approved - Ready for Processing'
            },
            rejected: {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ),
                color: 'bg-gradient-to-r from-rose-100 to-red-200 text-rose-800 border-rose-300',
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

    // Safe data access
    const employee = conversion.employee || {};
    const statusConfig = getStatusConfig(conversion.status);
    const canTakeAction = conversion.status === 'pending';
    const isVL = conversion.leave_type_code === 'VL';

    return (
        <HRLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Credit Conversion Details</h2>}
        >
            <Head title="Credit Conversion Details" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <Link 
                            href={route('hr.credit-conversions')}
                            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm hover:shadow-md"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Credit Conversions
                        </Link>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Important Notice */}
                            {!isVL && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 backdrop-blur-sm shadow-sm"
                                >
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mt-0.5 mr-4">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">Non-Eligible Leave Type</h4>
                                            <p className="text-sm text-amber-700 mt-2">
                                                Only Vacation Leave (VL) credits can be monetized. Sick Leave (SL) credits are not eligible for cash conversion.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Status Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
                            >
                                <div className="px-6 py-5 border-b border-gray-200/30 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent flex items-center">
                                            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            Request Status
                                        </h3>
                                        <div className={`flex items-center px-4 py-2 rounded-full text-sm font-semibold ${statusConfig.color} border shadow-sm`}>
                                            {statusConfig.icon}
                                            <span className="ml-2">{statusConfig.label}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="text-sm text-gray-600 bg-white/50 backdrop-blur-sm rounded-xl p-4">
                                        {conversion.status === 'pending' && 'This request is awaiting your review and approval.'}
                                        {conversion.status === 'hr_approved' && 'This request has been approved by HR and is pending Department Head approval.'}
                                        {conversion.status === 'dept_head_approved' && 'This request has been approved by Department Head and is pending Admin approval.'}
                                        {conversion.status === 'admin_approved' && 'This request has been fully approved and processed. 10 VL credits have been deducted from the employee\'s balance.'}
                                        {conversion.status === 'rejected' && 'This request has been rejected.'}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Conversion Details */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
                            >
                                <div className="px-6 py-5 border-b border-gray-200/30 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent flex items-center">
                                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        Conversion Details
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Leave Type</label>
                                                <div className="mt-2">
                                                    <span className={`inline-flex items-center px-4 py-3 rounded-xl text-sm font-semibold ${
                                                        isVL 
                                                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                                                            : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200'
                                                    }`}>
                                                        {conversion.leave_type_code} - {conversion.leave_type_name}
                                                        {isVL && (
                                                            <span className="ml-2 px-3 py-1 text-xs bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 rounded-full font-medium">
                                                                Monetizable
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Credits Requested</label>
                                                <div className="mt-2 flex items-center text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    {conversion.credits_requested || 0} days
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Date Submitted</label>
                                                <div className="mt-2 flex items-center text-sm text-gray-900 bg-white/50 backdrop-blur-sm rounded-xl p-3">
                                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    {formatDate(conversion.submitted_at)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {conversion.employee_remarks && (
                                        <div className="mt-6">
                                            <label className="text-sm font-medium text-gray-500">Employee Remarks</label>
                                            <div className="mt-2 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 text-sm text-gray-700 backdrop-blur-sm">
                                                {conversion.employee_remarks}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Employee Information */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
                            >
                                <div className="px-6 py-5 border-b border-gray-200/30 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent flex items-center">
                                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center mr-3">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        Employee Information
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Full Name</label>
                                                <div className="mt-1 text-lg font-semibold text-gray-900">
                                                    {employee.firstname || ''} {employee.lastname || ''}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Position</label>
                                                <div className="mt-1 text-sm text-gray-900 bg-white/50 backdrop-blur-sm rounded-xl p-3">
                                                    {employee.position || 'No position'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Department</label>
                                                <div className="mt-2">
                                                    <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200">
                                                        {employee.department?.name || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Action Buttons */}
                            {canTakeAction && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
                                >
                                    <div className="px-6 py-5 border-b border-gray-200/30 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                                        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Take Action</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                                                <button
                                                    onClick={handleApprove}
                                                    disabled={!isVL || approveProcessing || rejectProcessing}
                                                    className={`w-full py-4 text-base font-semibold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center ${
                                                        !isVL 
                                                            ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed' 
                                                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white hover:shadow-xl'
                                                    } ${(approveProcessing || rejectProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {approveProcessing ? (
                                                        <div className="flex items-center">
                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Approving...
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-2">
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                            {isVL ? 'Approve & Forward to Dept Head' : 'VL Only'}
                                                        </>
                                                    )}
                                                </button>
                                            </motion.div>
                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                                                <DangerButton
                                                    onClick={() => setShowRejectForm(true)}
                                                    disabled={approveProcessing || rejectProcessing}
                                                    className={`w-full py-4 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${
                                                        (approveProcessing || rejectProcessing) ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                                >
                                                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-2">
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </div>
                                                    Reject Request
                                                </DangerButton>
                                            </motion.div>
                                        </div>
                                        {!isVL && (
                                            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl backdrop-blur-sm">
                                                <p className="text-sm text-amber-700">
                                                    Only Vacation Leave (VL) conversion requests can be approved. Sick Leave (SL) requests must be rejected.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Approval Timeline */}
                            {(conversion.status !== 'pending') && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
                                >
                                    <div className="px-6 py-5 border-b border-gray-200/30 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                                        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent flex items-center">
                                            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            Approval Timeline
                                        </h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            {/* HR Approval */}
                                            {conversion.hr_approved_at && (
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center shadow-sm">
                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-4">
                                                        <p className="text-sm font-semibold text-gray-900">Approved by HR</p>
                                                        <p className="text-sm text-gray-500">
                                                            {conversion.hr_approver_name || 'HR Manager'} • {formatDate(conversion.hr_approved_at)}
                                                        </p>
                                                        {conversion.hr_remarks && (
                                                            <p className="text-sm text-gray-600 mt-1 bg-white/50 rounded-xl p-2">{conversion.hr_remarks}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Dept Head Approval */}
                                            {conversion.dept_head_approved_at && (
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-100 to-violet-200 rounded-xl flex items-center justify-center shadow-sm">
                                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-4">
                                                        <p className="text-sm font-semibold text-gray-900">Approved by Department Head</p>
                                                        <p className="text-sm text-gray-500">
                                                            {conversion.dept_head_approver_name || 'Department Head'} • {formatDate(conversion.dept_head_approved_at)}
                                                        </p>
                                                        {conversion.dept_head_remarks && (
                                                            <p className="text-sm text-gray-600 mt-1 bg-white/50 rounded-xl p-2">{conversion.dept_head_remarks}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Admin Approval */}
                                            {conversion.admin_approved_at && (
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-200 rounded-xl flex items-center justify-center shadow-sm">
                                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-4">
                                                        <p className="text-sm font-semibold text-gray-900">Approved by Admin</p>
                                                        <p className="text-sm text-gray-500">
                                                            {conversion.admin_approver_name || 'Administrator'} • {formatDate(conversion.admin_approved_at)}
                                                        </p>
                                                        {conversion.admin_remarks && (
                                                            <p className="text-sm text-gray-600 mt-1 bg-white/50 rounded-xl p-2">{conversion.admin_remarks}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Credit Deduction Notice */}
                                            {conversion.status === 'admin_approved' && (
                                                <div className="flex items-start mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl backdrop-blur-sm">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-4">
                                                        <p className="text-sm font-semibold text-green-900">Credit Deduction Completed</p>
                                                        <p className="text-sm text-green-700 mt-1">
                                                            <strong>{conversion.credits_requested} VL credits</strong> have been deducted from the employee's balance.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Information */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
                            >
                                <div className="px-6 py-5 border-b border-gray-200/30 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Quick Information</h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {[
                                            {
                                                icon: (
                                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                ),
                                                label: 'Submitted',
                                                value: formatDate(conversion.submitted_at)
                                            },
                                            {
                                                icon: (
                                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                ),
                                                label: 'Department',
                                                value: employee.department?.name || 'N/A'
                                            },
                                            {
                                                icon: (
                                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                ),
                                                label: 'Eligibility',
                                                value: isVL ? 'VL - Eligible' : 'SL - Not Eligible'
                                            },
                                            {
                                                icon: (
                                                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                ),
                                                label: 'Current Stage',
                                                value: conversion.current_approver_role || 'HR Review'
                                            }
                                        ].map((item, index) => (
                                            <motion.div
                                                key={item.label}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 + index * 0.1 }}
                                                className="flex items-center text-sm bg-white/50 backdrop-blur-sm rounded-xl p-3"
                                            >
                                                <div className="w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mr-3">
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{item.label}</div>
                                                    <div className="text-gray-500">{item.value}</div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Important Notes */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl backdrop-blur-sm shadow-sm overflow-hidden"
                            >
                                <div className="px-6 py-5 border-b border-blue-200/30 bg-gradient-to-r from-blue-100/50 to-indigo-100/50">
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent flex items-center">
                                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        Important Notes
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3 text-sm text-blue-800">
                                        {[
                                            "Only VL credits can be monetized",
                                            "Minimum 10 VL credits required to apply",
                                            "Maximum 10 days per year",
                                            "SL credits cannot be converted",
                                            "Credits deducted only after Admin approval",
                                            "Three-stage approval: HR → Dept Head → Admin"
                                        ].map((note, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 + index * 0.1 }}
                                                className="flex items-start"
                                            >
                                                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <strong>{note.split(':')[0]}</strong>{note.split(':')[1] || note}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Reject Form Modal */}
                    {showRejectForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-white/20 backdrop-blur-sm"
                            >
                                <div className="px-6 py-5 border-b border-gray-200/30 bg-gradient-to-r from-rose-50/50 to-red-50/50">
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-rose-700 to-red-700 bg-clip-text text-transparent flex items-center">
                                        <div className="w-6 h-6 bg-gradient-to-r from-rose-500 to-red-500 rounded-full flex items-center justify-center mr-3">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
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
                                            disabled={rejectProcessing}
                                            className="mt-2 block w-full border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 rounded-xl shadow-sm transition-all duration-200 bg-white/50 backdrop-blur-sm p-3 disabled:opacity-50"
                                        />
                                        {rejectErrors.remarks && (
                                            <InputError message={rejectErrors.remarks} className="mt-2" />
                                        )}
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                                            <DangerButton
                                                type="submit"
                                                disabled={rejectProcessing}
                                                className="w-full py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
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
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowRejectForm(false)}
                                                disabled={rejectProcessing}
                                                className="w-full px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </motion.div>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </HRLayout>
    );
}