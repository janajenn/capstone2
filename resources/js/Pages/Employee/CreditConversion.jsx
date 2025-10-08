import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import PrimaryButton from '@/Components/PrimaryButton';

export default function CreditConversion({ auth, leaveCredits, eligibility, conversionStats }) {
    const { data, setData, post, processing, errors } = useForm({
        leave_type: '',
        credits_requested: 10,
        remarks: '',
    });

    const [potentialCash, setPotentialCash] = useState(0);

    useEffect(() => {
        if (auth.user.employee?.monthly_salary) {
            const monthlySalary = auth.user.employee.monthly_salary;
            const cashValue = monthlySalary * 10 * 0.0481927;
            setPotentialCash(Math.round(cashValue * 100) / 100);
        }
    }, [auth.user.employee?.monthly_salary]);

    const submit = (e) => {
        e.preventDefault();
        post(route('employee.credit-conversion.submit'));
    };

    const getEligibilityMessage = (type) => {
        const elig = eligibility[type.toLowerCase()];
        if (!elig.eligible) {
            return (
                <div className="flex items-start space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <svg className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="flex-1">
                        <div className="text-sm font-medium text-rose-800">Not Eligible</div>
                        <div className="text-sm text-rose-700">{elig.reason}</div>
                        <div className="text-sm text-rose-600 mt-1">Available balance: {elig.available_balance} days</div>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                    <div className="text-sm font-medium text-green-800">Eligible for Conversion</div>
                    <div className="text-sm text-green-700">Available balance: {elig.available_balance} days</div>
                    <div className="text-sm text-green-600">Remaining annual quota: {elig.available_quota} days</div>
                </div>
            </div>
        );
    };

    return (
        <EmployeeLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Convert Leave Credits to Cash</h2>}
        >
            <Head title="Convert Leave Credits" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Leave Credit Monetization</h1>
                                <p className="text-gray-600 mt-2">
                                    Convert your unused leave credits to cash using the new monetization formula
                                </p>
                            </div>
                            <Link 
                                href={route('employee.credit-conversions')}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                View History
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        {/* Main Form - 8 columns */}
                        <div className="col-span-12 xl:col-span-8">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Conversion Request</h2>
                                </div>
                                <div className="p-6">
                                    <form onSubmit={submit} className="space-y-8">
                                        {/* Current Balance Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-medium text-blue-600">Sick Leave Balance</div>
                                                        <div className="text-2xl font-bold text-blue-900 mt-1">{leaveCredits.sl} days</div>
                                                    </div>
                                                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-medium text-green-600">Vacation Leave Balance</div>
                                                        <div className="text-2xl font-bold text-green-900 mt-1">{leaveCredits.vl} days</div>
                                                    </div>
                                                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Leave Type Selection */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-4">
                                                Select Leave Type to Convert
                                            </label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Sick Leave Option */}
                                                <div 
                                                    className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                                                        data.leave_type === 'SL' 
                                                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                                                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                    }`}
                                                    onClick={() => setData('leave_type', 'SL')}
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <div className="font-semibold text-gray-900">Sick Leave (SL)</div>
                                                            <div className="text-sm text-gray-600 mt-1">Balance: {leaveCredits.sl} days</div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                            data.leave_type === 'SL' 
                                                                ? 'bg-blue-500 border-blue-500' 
                                                                : 'border-gray-300'
                                                        }`}>
                                                            {data.leave_type === 'SL' && (
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {getEligibilityMessage('SL')}
                                                </div>

                                                {/* Vacation Leave Option */}
                                                <div 
                                                    className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                                                        data.leave_type === 'VL' 
                                                            ? 'border-green-500 bg-green-50 shadow-md' 
                                                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                    }`}
                                                    onClick={() => setData('leave_type', 'VL')}
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <div className="font-semibold text-gray-900">Vacation Leave (VL)</div>
                                                            <div className="text-sm text-gray-600 mt-1">Balance: {leaveCredits.vl} days</div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                            data.leave_type === 'VL' 
                                                                ? 'bg-green-500 border-green-500' 
                                                                : 'border-gray-300'
                                                        }`}>
                                                            {data.leave_type === 'VL' && (
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {getEligibilityMessage('VL')}
                                                </div>
                                            </div>
                                            {errors.leave_type && (
                                                <div className="flex items-center mt-2 text-sm text-rose-600">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                    </svg>
                                                    {errors.leave_type}
                                                </div>
                                            )}
                                        </div>

                                        {/* Conversion Details */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Credits Information */}
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                                                <div className="flex items-center mb-3">
                                                    <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <div className="text-sm font-medium text-amber-800">Conversion Details</div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-amber-700">Minimum Conversion:</span>
                                                        <span className="text-sm font-semibold text-amber-900">10 days</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-amber-700">Credits to Convert:</span>
                                                        <span className="text-lg font-bold text-gray-900">10 days</span>
                                                    </div>
                                                </div>
                                                <input type="hidden" value={10} onChange={(e) => setData('credits_requested', 10)} />
                                            </div>

                                            {/* Cash Calculation */}
                                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                                                <div className="text-sm font-medium text-gray-700 mb-3">Cash Calculation</div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">Monthly Salary:</span>
                                                        <span className="text-sm font-medium text-gray-900">₱{auth.user.employee?.monthly_salary?.toLocaleString() || '0'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-600">Formula:</span>
                                                        <span className="text-xs font-medium text-gray-500 text-right">Monthly Salary × 10 × 0.0481927</span>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                                        <span className="text-sm font-semibold text-gray-700">Estimated Cash Value:</span>
                                                        <span className="text-lg font-bold text-green-600">
                                                            ₱{potentialCash.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Remarks */}
                                        <div>
                                            <label htmlFor="remarks" className="block text-sm font-semibold text-gray-900 mb-3">
                                                Additional Remarks (Optional)
                                            </label>
                                            <textarea
                                                id="remarks"
                                                rows={3}
                                                className="block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 resize-none"
                                                value={data.remarks}
                                                onChange={(e) => setData('remarks', e.target.value)}
                                                placeholder="Provide any additional information or context for your conversion request..."
                                            />
                                            {errors.remarks && (
                                                <div className="flex items-center mt-2 text-sm text-rose-600">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                    </svg>
                                                    {errors.remarks}
                                                </div>
                                            )}
                                        </div>

                                        {/* Submit Button */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                            <div className="text-sm text-gray-500">
                                                Ensure you meet all eligibility requirements before submitting
                                            </div>
                                            <PrimaryButton
                                                type="submit"
                                                disabled={processing || !data.leave_type}
                                                className="px-8 py-3 text-base font-medium"
                                            >
                                                {processing ? (
                                                    <div className="flex items-center">
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Processing...
                                                    </div>
                                                ) : (
                                                    'Submit Conversion Request'
                                                )}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - 4 columns */}
                        <div className="col-span-12 xl:col-span-4 space-y-6">
                            {/* Statistics Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">Conversion Statistics</h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                                <span className="text-sm font-medium text-blue-900">Total Converted</span>
                                            </div>
                                            <span className="text-lg font-bold text-blue-900">{conversionStats.total_converted_days} days</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                                <span className="text-sm font-medium text-green-900">Cash Received</span>
                                            </div>
                                            <span className="text-lg font-bold text-green-900">₱{conversionStats.total_cash_received?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm font-medium text-amber-900">Remaining Quota</span>
                                            </div>
                                            <span className="text-lg font-bold text-amber-900">{conversionStats.remaining_quota} days</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                                <span className="text-sm font-medium text-purple-900">Pending Requests</span>
                                            </div>
                                            <span className="text-lg font-bold text-purple-900">{conversionStats.pending_requests}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Information Card */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="px-6 py-5 border-b border-blue-200">
                                    <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Important Information
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3 text-sm text-blue-800">
                                        <div className="flex items-start">
                                            <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <div>
                                                <strong>Minimum Requirement:</strong> 10 leave credits
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <div>
                                                <strong>Annual Limit:</strong> Maximum 10 days per year
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <div>
                                                <strong>Formula:</strong> Monthly Salary × 10 × 0.0481927
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <div>Approval required from HR department</div>
                                        </div>
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