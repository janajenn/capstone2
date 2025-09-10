import React from 'react';
import { Head, Link } from '@inertiajs/react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import PrimaryButton from '@/Components/PrimaryButton';

export default function MyCreditConversions({ auth, conversions, conversionStats }) {
    // Ensure conversions is an array
    const safeConversions = Array.isArray(conversions) ? conversions : [];
    
    // Ensure conversionStats is an object
    const safeConversionStats = conversionStats || {};
    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return '⏰';
            case 'approved':
                return '✅';
            case 'rejected':
                return '❌';
            default:
                return '⚠️';
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

    return (
        <EmployeeLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">My Credit Conversions</h2>}
        >
            <Head title="My Credit Conversions" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header with Action Button */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Credit Conversion History</h1>
                            <p className="text-gray-600">Track your leave credit to cash conversion requests</p>
                        </div>
                        <Link href={route('employee.credit-conversion')}>
                            <PrimaryButton className="flex items-center gap-2">
                                ➕ New Request
                            </PrimaryButton>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Statistics Cards */}
                        <div className="lg:col-span-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Total Converted</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {safeConversionStats?.total_converted_days || 0} days
                                                </p>
                                            </div>
                                            <div className="p-2 bg-blue-100 rounded-full">
                                                <span className="text-2xl">✅</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Total Cash Received</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    ₱{(safeConversionStats?.total_cash_received || 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="p-2 bg-green-100 rounded-full">
                                                <span className="text-2xl font-bold text-green-600">₱</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Remaining Quota</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {safeConversionStats?.remaining_quota || 0} days
                                                </p>
                                            </div>
                                            <div className="p-2 bg-yellow-100 rounded-full">
                                                <span className="text-2xl">⏰</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {safeConversionStats?.pending_requests || 0}
                                                </p>
                                            </div>
                                            <div className="p-2 bg-orange-100 rounded-full">
                                                <span className="text-2xl">⚠️</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Conversion History Table */}
                        <div className="lg:col-span-4">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 bg-white border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Requests</h3>
                                </div>
                                <div className="p-6">
                                                                                        {safeConversions.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-gray-400 mb-4">
                                                <span className="text-6xl">⏰</span>
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversion requests yet</h3>
                                            <p className="text-gray-600 mb-4">
                                                Start converting your leave credits to cash by submitting a request.
                                            </p>
                                            <Link href={route('employee.credit-conversion')}>
                                                <PrimaryButton>Make Your First Request</PrimaryButton>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-200">
                                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Leave Type</th>
                                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Days</th>
                                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Cash Equivalent</th>
                                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {safeConversions.map((conversion) => (
                                                        <tr key={conversion.conversion_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="py-3 px-4 text-sm text-gray-900">
                                                                {formatDate(conversion.submitted_at)}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-medium">
                                                                    {conversion.leave_type_code || 'N/A'} - {conversion.leave_type_name || 'Unknown'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-sm text-gray-900">
                                                                {conversion.credits_requested || 0} days
                                                            </td>
                                                            <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                                                                ₱{parseFloat(conversion.equivalent_cash || 0).toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center gap-2">
                                                                    {getStatusIcon(conversion.status)}
                                                                    <span className={`px-2 py-1 rounded text-sm font-medium border ${getStatusColor(conversion.status)}`}>
                                                                        {conversion.status ? conversion.status.charAt(0).toUpperCase() + conversion.status.slice(1) : 'Unknown'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                                                                {conversion.remarks || '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}
