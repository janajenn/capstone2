import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { 
    DocumentTextIcon, 
    ArrowDownIcon, 
    ArrowUpIcon,
    MinusIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function CreditsLog({ creditsLog, currentBalances }) {
    const { props } = usePage();
    const user = props.auth?.user;

    // Safe number formatting function
    const formatNumber = (value) => {
        if (value === null || value === undefined) return '0.00';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    // Function to determine transaction type and styling
    const getTransactionType = (log) => {
        const points = typeof log.points_deducted === 'string' ? parseFloat(log.points_deducted) : log.points_deducted;
        
        if (points > 0) {
            return {
                type: 'deduction',
                icon: ArrowDownIcon,
                color: 'text-rose-600',
                bgColor: 'bg-rose-50',
                borderColor: 'border-rose-200',
                label: 'Deduction'
            };
        } else if (points < 0) {
            return {
                type: 'addition',
                icon: ArrowUpIcon,
                color: 'text-emerald-600',
                bgColor: 'bg-emerald-50',
                borderColor: 'border-emerald-200',
                label: 'Addition'
            };
        } else {
            return {
                type: 'neutral',
                icon: MinusIcon,
                color: 'text-gray-600',
                bgColor: 'bg-gray-50',
                borderColor: 'border-gray-200',
                label: 'Adjustment'
            };
        }
    };

    // Function to get leave type styling
    const getLeaveTypeStyle = (type) => {
        switch (type) {
            case 'SL':
                return {
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-800',
                    borderColor: 'border-blue-200'
                };
            case 'VL':
                return {
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-800',
                    borderColor: 'border-green-200'
                };
            default:
                return {
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-800',
                    borderColor: 'border-gray-200'
                };
        }
    };

    return (
        <>
            <Head>
                <title>Credits Log - Employee Portal</title>
                <meta name="description" content="View your leave credits transaction history" />
            </Head>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-emerald-800 bg-clip-text text-transparent">
                                Credits Transaction Log
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Track all your leave credits transactions and balance history
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Current Balances Summary */}
                            <div className="flex items-center space-x-4">
                                <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-200 min-w-24">
                                    <div className="text-sm font-medium text-blue-700">SL Balance</div>
                                    <div className="text-2xl font-bold text-blue-900">{formatNumber(currentBalances.sl)}</div>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-xl border border-green-200 min-w-24">
                                    <div className="text-sm font-medium text-green-700">VL Balance</div>
                                    <div className="text-2xl font-bold text-green-900">{formatNumber(currentBalances.vl)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Information Card */}
                <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl border border-blue-200 p-4">
                    <div className="flex items-start space-x-3">
                        <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                            <strong>About this log:</strong> This page shows all transactions related to your leave credits. 
                            Deductions occur when you use leave credits, while additions happen through monthly accruals or other adjustments.
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">Transaction History</h2>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date & Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Transaction
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Points
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Balance Change
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Remarks
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {creditsLog.data.length > 0 ? (
                                    creditsLog.data.map((log) => {
                                        const transaction = getTransactionType(log);
                                        const leaveTypeStyle = getLeaveTypeStyle(log.type);
                                        const TransactionIcon = transaction.icon;
                                        const absolutePoints = Math.abs(typeof log.points_deducted === 'string' ? parseFloat(log.points_deducted) : log.points_deducted);

                                        return (
                                            <tr 
                                                key={log.id}
                                                className="hover:bg-gray-50/50 transition-colors duration-150"
                                            >
                                                {/* Date & Type */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`p-2 rounded-lg ${leaveTypeStyle.bgColor} ${leaveTypeStyle.borderColor} border`}>
                                                            <DocumentTextIcon className={`h-4 w-4 ${leaveTypeStyle.textColor}`} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {log.formatted_date}
                                                            </div>
                                                            <div className={`text-xs px-2 py-1 rounded-full ${leaveTypeStyle.bgColor} ${leaveTypeStyle.textColor} inline-block mt-1`}>
                                                                {log.type} Leave
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Transaction Type */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`p-1.5 rounded-lg ${transaction.bgColor} ${transaction.borderColor} border`}>
                                                            <TransactionIcon className={`h-3.5 w-3.5 ${transaction.color}`} />
                                                        </div>
                                                        <span className={`text-sm font-medium ${transaction.color}`}>
                                                            {transaction.label}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Points */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`text-sm font-semibold ${transaction.color}`}>
                                                        {transaction.type === 'deduction' ? '-' : '+'}{formatNumber(absolutePoints)}
                                                    </div>
                                                </td>

                                                {/* Balance Change */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 space-y-1">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-gray-500 text-xs">Before:</span>
                                                            <span className="font-medium">{formatNumber(log.balance_before)}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-gray-500 text-xs">After:</span>
                                                            <span className="font-medium text-emerald-600">{formatNumber(log.balance_after)}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Remarks */}
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-600 max-w-xs">
                                                        {log.remarks || 'No remarks provided'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3 text-gray-500">
                                                <DocumentTextIcon className="h-12 w-12 text-gray-300" />
                                                <div>
                                                    <p className="text-lg font-medium text-gray-400">No transactions found</p>
                                                    <p className="text-sm">Your leave credits transaction log will appear here.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {creditsLog.data.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {creditsLog.from} to {creditsLog.to} of {creditsLog.total} transactions
                                </div>
                                <div className="flex space-x-2">
                                    {/* Previous Page */}
                                    {creditsLog.prev_page_url && (
                                        <Link
                                            href={creditsLog.prev_page_url}
                                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                            preserveScroll
                                        >
                                            Previous
                                        </Link>
                                    )}

                                    {/* Next Page */}
                                    {creditsLog.next_page_url && (
                                        <Link
                                            href={creditsLog.next_page_url}
                                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                            preserveScroll
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                                <p className="text-2xl font-bold text-gray-900">{creditsLog.total}</p>
                            </div>
                            <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">SL Transactions</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {creditsLog.data.filter(log => log.type === 'SL').length}
                                </p>
                            </div>
                            <DocumentTextIcon className="h-8 w-8 text-blue-400" />
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">VL Transactions</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {creditsLog.data.filter(log => log.type === 'VL').length}
                                </p>
                            </div>
                            <DocumentTextIcon className="h-8 w-8 text-green-400" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

CreditsLog.layout = page => <EmployeeLayout children={page} />;
