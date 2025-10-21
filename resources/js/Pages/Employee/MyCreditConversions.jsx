import React from 'react';
import { Head, Link } from '@inertiajs/react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import PrimaryButton from '@/Components/PrimaryButton';

export default function MyCreditConversions({ auth, conversions, conversionStats }) {
    const safeConversions = Array.isArray(conversions) ? conversions : [];
    const safeConversionStats = conversionStats || {};
    const getStatusConfig = (status, statusDisplay) => {
        // Always use the statusDisplay from backend if provided
        if (statusDisplay) {
            return {
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ),
                color: 'bg-green-100 text-green-800 border-green-200',
                label: statusDisplay,
                description: statusDisplay.includes('Forwarded') 
                    ? 'Your request has been approved by HR and forwarded to the Accounting Office.'
                    : null
            };
        }
    
        // Fallback to default mapping only if no statusDisplay provided
        const configs = {
            pending: {
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                label: 'Pending HR Approval'
            },
            approved: {
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ),
                color: 'bg-green-100 text-green-800 border-green-200',
                label: 'Approved - Forwarded to Accounting',
                description: 'Your request has been approved by HR and forwarded to the Accounting/Budget Office for processing and cash release.'
            },
            rejected: {
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ),
                color: 'bg-red-100 text-red-800 border-red-200',
                label: 'Rejected'
            }
        };
        return configs[status] || configs.pending;
    };


    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const StatCard = ({ title, value, subtitle, icon, color }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <EmployeeLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">My Credit Conversions</h2>}
        >
            <Head title="My Credit Conversions" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Credit Conversion History</h1>
                            <p className="text-gray-600 mt-2">Track your Vacation Leave (VL) credit to cash conversion requests</p>
                        </div>
                        <Link href={route('employee.credit-conversion')}>
                            <PrimaryButton className="flex items-center gap-2 px-6 py-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                New VL Conversion
                            </PrimaryButton>
                        </Link>
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Total Converted"
                            value={`${safeConversionStats.total_converted_days || 0} days`}
                            subtitle="VL Credits Only"
                            icon={
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            }
                            color="bg-blue-100"
                        />
                        <StatCard
                            title="Remaining Quota"
                            value={`${safeConversionStats.remaining_quota || 0} days`}
                            subtitle="Annual limit: 10 days"
                            icon={
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                            color="bg-amber-100"
                        />
                        <StatCard
                            title="Pending Requests"
                            value={safeConversionStats.pending_requests || 0}
                            icon={
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            }
                            color="bg-purple-100"
                        />
                        <StatCard
                            title="Available VL Credits"
                            value={`${safeConversionStats.available_vl_balance || 0} days`}
                            subtitle="Minimum 10 required"
                            icon={
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            }
                            color="bg-green-100"
                        />
                    </div>

                    {/* Important Notice */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h4 className="text-sm font-medium text-blue-900">Process Information</h4>
                                <p className="text-sm text-blue-700 mt-1">
                                    <strong>HR processes your request and forwards it to Accounting/Budget Office.</strong> Once approved by HR, 
                                    your request moves to the Accounting Office for final processing and cash release. You will be notified 
                                    once the process is complete.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Conversion History */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Conversion Requests</h3>
                        </div>
                        <div className="p-6">
                            {safeConversions.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 mb-4">
                                        <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No conversion requests yet</h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        Start converting your Vacation Leave credits by submitting your first request.
                                    </p>
                                    <Link href={route('employee.credit-conversion')}>
                                        <PrimaryButton className="px-6 py-3">
                                            Convert VL Credits
                                        </PrimaryButton>
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Submitted</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Days</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {safeConversions.map((conversion) => {
                                                const statusConfig = getStatusConfig(conversion.status, conversion.status_display);
                                                const isVL = conversion.leave_type_code === 'VL';
                                                
                                                return (
                                                    <tr key={conversion.conversion_id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {formatDate(conversion.submitted_at)}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                                isVL 
                                                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                                            }`}>
                                                                {conversion.leave_type_code || 'N/A'} - {conversion.leave_type_name || 'Unknown'}
                                                                {isVL && (
                                                                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-200 text-green-800 rounded-full">
                                                                        Monetizable
                                                                    </span>
                                                                )}
                                                                {!isVL && (
                                                                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                                                                        Not Monetizable
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                            {conversion.credits_requested || 0} days
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col space-y-1">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                                                    {statusConfig.icon}
                                                                    <span className="ml-1.5">{statusConfig.label}</span>
                                                                </span>
                                                                {statusConfig.description && (
                                                                    <span className="text-xs text-gray-500 max-w-xs">
                                                                        {statusConfig.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                                                            <div className="truncate" title={conversion.remarks}>
                                                                {conversion.remarks || '-'}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Process Flow Information */}
                    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Process Flow</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">1</div>
                                <h4 className="font-medium text-gray-900">Submit Request</h4>
                                <p className="text-sm text-gray-600 mt-1">Employee submits VL conversion request</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">2</div>
                                <h4 className="font-medium text-gray-900">HR Approval</h4>
                                <p className="text-sm text-gray-600 mt-1">HR reviews and forwards to Accounting</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">3</div>
                                <h4 className="font-medium text-gray-900">Accounting Processing</h4>
                                <p className="text-sm text-gray-600 mt-1">Accounting processes and releases cash</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}