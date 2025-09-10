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

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return '⏰';
            case 'approved':
                return '✅';
            case 'rejected':
                return '❌';
            default:
                return '⏰';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'approved':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
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

    const canTakeAction = conversion.status === 'pending';

    return (
        <HRLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Credit Conversion Details</h2>}
        >
            <Head title="Credit Conversion Details" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Link href={route('hr.credit-conversions')}>
                            <PrimaryButton className="flex items-center gap-2">
                                ← Back to Credit Conversions
                            </PrimaryButton>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Status Card */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 bg-white border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                        {getStatusIcon(conversion.status)}
                                        Request Status
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-md text-sm font-medium border ${getStatusColor(conversion.status)}`}>
                                            {conversion.status.charAt(0).toUpperCase() + conversion.status.slice(1)}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {conversion.status === 'pending' && 'Awaiting HR approval'}
                                            {conversion.status === 'approved' && 'Approved by HR'}
                                            {conversion.status === 'rejected' && 'Rejected by HR'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Conversion Details */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 bg-white border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                        📄 Conversion Details
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="leave_type" value="Leave Type" />
                                            <div className="mt-1">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-medium">
                                                    {conversion.leave_type_code || 'N/A'} - {conversion.leave_type_name || 'Unknown'}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="credits_requested" value="Credits Requested" />
                                            <div className="mt-1 text-lg font-semibold text-gray-900">
                                                {conversion.credits_requested} days
                                            </div>
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="equivalent_cash" value="Cash Equivalent" />
                                            <div className="mt-1 text-lg font-semibold text-green-600">
                                                ₱{parseFloat(conversion.equivalent_cash).toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="submitted_at" value="Date Submitted" />
                                            <div className="mt-1 text-sm text-gray-900">
                                                {formatDate(conversion.submitted_at)}
                                            </div>
                                        </div>
                                    </div>

                                    {conversion.remarks && (
                                        <div>
                                            <InputLabel htmlFor="remarks" value="Employee Remarks" />
                                            <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                                                {conversion.remarks}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Employee Information */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 bg-white border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                        👤 Employee Information
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="name" value="Name" />
                                            <div className="mt-1 text-sm text-gray-900">
                                                {conversion.employee.firstname} {conversion.employee.lastname}
                                            </div>
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="position" value="Position" />
                                            <div className="mt-1 text-sm text-gray-900">
                                                {conversion.employee.position}
                                            </div>
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="department" value="Department" />
                                            <div className="mt-1 text-sm text-gray-900">
                                                {conversion.employee.department?.name || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="salary" value="Monthly Salary" />
                                            <div className="mt-1 text-sm text-gray-900">
                                                ₱{parseFloat(conversion.employee.monthly_salary).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Approval Information */}
                            {conversion.status !== 'pending' && (
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6 bg-white border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                            {conversion.status === 'approved' ? '✅ Approval' : '❌ Rejection'} Information
                                        </h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <InputLabel htmlFor="approver" value="Approved/Rejected By" />
                                                <div className="mt-1 text-sm text-gray-900">
                                                    {conversion.approver?.name || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <InputLabel htmlFor="approved_at" value="Date" />
                                                <div className="mt-1 text-sm text-gray-900">
                                                    {formatDate(conversion.approved_at)}
                                                </div>
                                            </div>
                                        </div>
                                        {conversion.remarks && (
                                            <div>
                                                <InputLabel htmlFor="hr_remarks" value="HR Remarks" />
                                                <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                                                    {conversion.remarks}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {canTakeAction && (
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6 bg-white border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900">Take Action</h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex gap-4">
                                            <PrimaryButton
                                                onClick={() => setShowApproveForm(true)}
                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                            >
                                                ✅ Approve Request
                                            </PrimaryButton>
                                            <DangerButton
                                                onClick={() => setShowRejectForm(true)}
                                                className="flex-1"
                                            >
                                                ❌ Reject Request
                                            </DangerButton>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Stats */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 bg-white border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Quick Information</h3>
                                </div>
                                <div className="p-6 space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500">📅</span>
                                        <span className="text-gray-600">Submitted:</span>
                                        <span className="font-medium">{formatDate(conversion.submitted_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500">💰</span>
                                        <span className="text-gray-600">Daily Rate:</span>
                                        <span className="font-medium">
                                            ₱{(parseFloat(conversion.employee.monthly_salary) / 22).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500">🏢</span>
                                        <span className="text-gray-600">Department:</span>
                                        <span className="font-medium">
                                            {conversion.employee.department?.name || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Important Notes */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 bg-white border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Important Notes</h3>
                                </div>
                                <div className="p-6">
                                    <div className="text-xs text-gray-600 space-y-2">
                                        <div>• Each leave type must have <strong>more than 15 days</strong> individually</div>
                                        <div>• Maximum 10 days per year can be monetized</div>
                                        <div>• Cash equivalent: (Monthly Salary ÷ 22) × Days</div>
                                        <div>• Credits will be deducted upon approval</div>
                                        <div>• Employee must have sufficient balance</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Approve Form Modal */}
                    {showApproveForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                                <h3 className="text-lg font-semibold mb-4">Approve Conversion Request</h3>
                                <form onSubmit={handleApprove} className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="approve_remarks" value="Approval Remarks (Optional)" />
                                        <textarea
                                            id="approve_remarks"
                                            value={approveData.remarks}
                                            onChange={(e) => setApproveData('remarks', e.target.value)}
                                            placeholder="Any additional notes..."
                                            rows={3}
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        />
                                        {approveErrors.remarks && (
                                            <InputError message={approveErrors.remarks} className="mt-2" />
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <PrimaryButton
                                            type="submit"
                                            disabled={approveProcessing}
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                        >
                                            {approveProcessing ? 'Approving...' : 'Approve'}
                                        </PrimaryButton>
                                        <PrimaryButton
                                            type="button"
                                            onClick={() => setShowApproveForm(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Reject Form Modal */}
                    {showRejectForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                                <h3 className="text-lg font-semibold mb-4">Reject Conversion Request</h3>
                                <form onSubmit={handleReject} className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="reject_remarks" value="Rejection Reason *" />
                                        <textarea
                                            id="reject_remarks"
                                            value={rejectData.remarks}
                                            onChange={(e) => setRejectData('remarks', e.target.value)}
                                            placeholder="Please provide a reason for rejection..."
                                            rows={3}
                                            required
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        />
                                        {rejectErrors.remarks && (
                                            <InputError message={rejectErrors.remarks} className="mt-2" />
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <DangerButton
                                            type="submit"
                                            disabled={rejectProcessing}
                                            className="flex-1"
                                        >
                                            {rejectProcessing ? 'Rejecting...' : 'Reject'}
                                        </DangerButton>
                                        <PrimaryButton
                                            type="button"
                                            onClick={() => setShowRejectForm(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </PrimaryButton>
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
