import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import DangerButton from '@/Components/DangerButton';

export default function CreditConversion({ auth, leaveCredits, eligibility, conversionStats }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        leave_type: '',
        credits_requested: '',
        remarks: '',
    });

    const [selectedLeaveType, setSelectedLeaveType] = useState('');
    const [maxCredits, setMaxCredits] = useState(0);

    useEffect(() => {
        if (selectedLeaveType) {
            const eligible = eligibility[selectedLeaveType.toLowerCase()];
            if (eligible.eligible) {
                setMaxCredits(Math.min(eligible.available_balance, eligible.available_quota));
            } else {
                setMaxCredits(0);
            }
        }
    }, [selectedLeaveType, eligibility]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('employee.credit-conversion.submit'), {
            onSuccess: () => {
                reset();
                setSelectedLeaveType('');
            },
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'eligible':
                return '✅';
            case 'ineligible':
                return '❌';
            default:
                return '⚠️';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'eligible':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'ineligible':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    return (
        <EmployeeLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Credit Conversion</h2>}
        >
            <Head title="Credit Conversion" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 bg-white border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        💰 Request Leave Credit to Cash Conversion
                                    </h3>
                                    
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Leave Type Selection */}
                                        <div className="space-y-2">
                                            <InputLabel htmlFor="leave_type" value="Leave Type" />
                                            <select
                                                id="leave_type"
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                value={selectedLeaveType}
                                                onChange={(e) => {
                                                    setSelectedLeaveType(e.target.value);
                                                    setData('leave_type', e.target.value);
                                                }}
                                            >
                                                <option value="">Select leave type</option>
                                                <option value="SL">Sick Leave (SL)</option>
                                                <option value="VL">Vacation Leave (VL)</option>
                                            </select>
                                            {errors.leave_type && (
                                                <InputError message={errors.leave_type} className="mt-2" />
                                            )}
                                        </div>

                                        {/* Credits Requested */}
                                        <div className="space-y-2">
                                            <InputLabel htmlFor="credits_requested" value="Credits to Convert (Days)" />
                                            {maxCredits > 0 && (
                                                <span className="text-sm text-gray-500 ml-2">
                                                    (Max: {maxCredits} days)
                                                </span>
                                            )}
                                            <TextInput
                                                id="credits_requested"
                                                type="number"
                                                min="1"
                                                max={maxCredits}
                                                step="0.5"
                                                value={data.credits_requested}
                                                onChange={(e) => setData('credits_requested', e.target.value)}
                                                placeholder="Enter number of days"
                                                disabled={maxCredits === 0}
                                                className="mt-1 block w-full"
                                            />
                                            {errors.credits_requested && (
                                                <InputError message={errors.credits_requested} className="mt-2" />
                                            )}
                                        </div>

                                        {/* Remarks */}
                                        <div className="space-y-2">
                                            <InputLabel htmlFor="remarks" value="Remarks (Optional)" />
                                            <textarea
                                                id="remarks"
                                                value={data.remarks}
                                                onChange={(e) => setData('remarks', e.target.value)}
                                                placeholder="Any additional notes..."
                                                rows={3}
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            />
                                            {errors.remarks && (
                                                <InputError message={errors.remarks} className="mt-2" />
                                            )}
                                        </div>

                                        {/* Submit Button */}
                                        <PrimaryButton
                                            type="submit"
                                            disabled={processing || maxCredits === 0}
                                            className="w-full"
                                        >
                                            {processing ? 'Submitting...' : 'Submit Conversion Request'}
                                        </PrimaryButton>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Current Leave Credits */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 bg-white border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Current Leave Credits</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Sick Leave (SL)</span>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-medium">
                                                {leaveCredits.sl} days
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Vacation Leave (VL)</span>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-medium">
                                                {leaveCredits.vl} days
                                            </span>
                                        </div>
                                        <div className="border-t pt-2 mt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700">Total Credits</span>
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-bold">
                                                    {(parseFloat(leaveCredits.sl) + parseFloat(leaveCredits.vl)).toFixed(2)} days
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Eligibility Status */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 bg-white border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Eligibility Status</h3>
                                    <div className="space-y-4">
                                        {/* SL Eligibility */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">Sick Leave (SL)</span>
                                                {getStatusIcon(eligibility.sl.eligible ? 'eligible' : 'ineligible')}
                                            </div>
                                            <div className={`px-3 py-2 rounded-md text-sm border ${getStatusColor(eligibility.sl.eligible ? 'eligible' : 'ineligible')}`}>
                                                {eligibility.sl.reason}
                                            </div>
                                            {eligibility.sl.eligible && (
                                                <div className="text-xs text-gray-600 space-y-1">
                                                    <div>Available Balance: {eligibility.sl.available_balance} days</div>
                                                    <div>Remaining Quota: {eligibility.sl.available_quota} days</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* VL Eligibility */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">Vacation Leave (VL)</span>
                                                {getStatusIcon(eligibility.vl.eligible ? 'eligible' : 'ineligible')}
                                            </div>
                                            <div className={`px-3 py-2 rounded-md text-sm border ${getStatusColor(eligibility.vl.eligible ? 'eligible' : 'ineligible')}`}>
                                                {eligibility.vl.reason}
                                            </div>
                                            {eligibility.vl.eligible && (
                                                <div className="text-xs text-gray-600 space-y-1">
                                                    <div>Available Balance: {eligibility.vl.available_balance} days</div>
                                                    <div>Remaining Quota: {eligibility.vl.available_quota} days</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Conversion Statistics */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 bg-white border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">This Year's Statistics</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total Converted</span>
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                                                {conversionStats.total_converted_days} days
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total Cash Received</span>
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                                                ₱{conversionStats.total_cash_received.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Remaining Quota</span>
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium">
                                                {conversionStats.remaining_quota} days
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Pending Requests</span>
                                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm font-medium">
                                                {conversionStats.pending_requests}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Important Notes */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 bg-white border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Important Notes</h3>
                                    <div className="text-xs text-gray-600 space-y-2">
                                        <div>• Each leave type must have <strong>more than 15 days</strong> individually</div>
                                        <div>• Maximum 10 days per year can be monetized</div>
                                        <div>• Cash equivalent: (Monthly Salary ÷ 22) × Days</div>
                                        <div>• HR approval required</div>
                                        <div>• Credits deducted upon approval</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}
