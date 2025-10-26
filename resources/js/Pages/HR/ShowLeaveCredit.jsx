// resources/js/Pages/HR/ShowLeaveCredit.jsx
import HRLayout from '@/Layouts/HRLayout';
import { usePage, Link } from '@inertiajs/react';
import { useState } from 'react';

// Compact avatar component
const EmployeeAvatar = ({ employee, className = "w-12 h-12" }) => {
    const getInitials = () => {
        if (!employee) return '??';
        const firstInitial = employee.firstname ? employee.firstname[0] : '';
        const lastInitial = employee.lastname ? employee.lastname[0] : '';
        return (firstInitial + lastInitial).toUpperCase();
    };

    return (
        <div className={`${className} bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
            {getInitials()}
        </div>
    );
};

// Compact status badge
const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium ${
        status === 'active' 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-rose-100 text-rose-800'
    }`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
        }`}></span>
        {status?.toUpperCase()}
    </span>
);

// Usage progress bar component
const UsageProgressBar = ({ used, total, type = 'default' }) => {
    const percentage = total > 0 ? (used / total) * 100 : 0;
    
    const getColorConfig = (type) => {
        const configs = {
            'SL': { bg: 'bg-blue-200', fill: 'bg-blue-500', text: 'text-blue-700' },
            'VL': { bg: 'bg-emerald-200', fill: 'bg-emerald-500', text: 'text-emerald-700' },
            'default': { bg: 'bg-purple-200', fill: 'bg-purple-500', text: 'text-purple-700' }
        };
        return configs[type] || configs.default;
    };

    const config = getColorConfig(type);

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className={config.text}>Used: {used}d</span>
                <span className="text-gray-600">Remaining: {total - used}d</span>
            </div>
            <div className={`w-full ${config.bg} rounded-full h-2`}>
                <div 
                    className={`${config.fill} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <div className="text-xs text-gray-500 text-center">
                {percentage.toFixed(0)}% used
            </div>
        </div>
    );
};

// Enhanced leave balance card with usage tracking
const LeaveBalanceCard = ({ type, code, balance, description, defaultDays, isEarnable, usedDays = 0 }) => {
    const getConfig = (code) => {
        const configs = {
            'SL': { gradient: 'from-blue-500 to-indigo-600', color: 'blue' },
            'VL': { gradient: 'from-emerald-500 to-green-600', color: 'green' },
            'default': { gradient: 'from-purple-500 to-pink-600', color: 'purple' }
        };
        return configs[code] || configs.default;
    };

    const config = getConfig(code);
    const totalAllocation = defaultDays || balance + usedDays;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 bg-gradient-to-r ${config.gradient} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
                        {code}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800">{type}</h3>
                        <p className="text-xs text-gray-500 truncate max-w-[120px]">{description}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">{balance}</div>
                    <div className="text-xs text-gray-500">days left</div>
                </div>
            </div>
            
            {/* Usage tracking for fixed leaves */}
            {!isEarnable && defaultDays && (
                <div className="mb-3">
                    <UsageProgressBar 
                        used={usedDays} 
                        total={totalAllocation} 
                        type={code}
                    />
                </div>
            )}
            
            <div className="flex justify-between items-center text-xs">
                {defaultDays ? (
                    <span className="text-gray-600">Allocation: {defaultDays}d</span>
                ) : (
                    <span className="text-gray-600">Current balance</span>
                )}
                {isEarnable ? (
                    <span className="text-blue-600 font-medium">+1.25/month</span>
                ) : (
                    <div className="flex items-center space-x-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                            usedDays > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                            Used: {usedDays}d
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function ShowLeaveCredit() {
    const { employee, earnableLeaveCredits, nonEarnableLeaveBalances } = usePage().props;
    const [activeTab, setActiveTab] = useState('earnable');

    // Calculate usage statistics
    const calculateUsageStats = () => {
        const fixedLeaves = nonEarnableLeaveBalances.filter(leave => leave.default_days);
        
        const totalAllocated = fixedLeaves.reduce((total, leave) => total + leave.default_days, 0);
        const totalUsed = fixedLeaves.reduce((total, leave) => {
            const used = leave.default_days - leave.balance;
            return total + Math.max(0, used);
        }, 0);
        const totalRemaining = fixedLeaves.reduce((total, leave) => total + leave.balance, 0);

        return {
            totalAllocated,
            totalUsed,
            totalRemaining,
            usagePercentage: totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0
        };
    };

    const usageStats = calculateUsageStats();
    
    // Properly format numbers and calculate totals
    const formatNumber = (num) => {
        if (num === null || num === undefined) return '0';
        // Remove any extra decimal places and format to 2 decimal places
        const formatted = parseFloat(num).toFixed(2);
        // Remove trailing .00 if it's a whole number
        return formatted.replace(/\.00$/, '');
    };

    // Calculate totals properly
    const totalEarnable = earnableLeaveCredits.reduce((total, credit) => {
        return total + (parseFloat(credit.balance) || 0);
    }, 0);
    
    const totalFixed = nonEarnableLeaveBalances.reduce((total, balance) => {
        return total + (parseFloat(balance.balance) || 0);
    }, 0);
    
    const totalAll = totalEarnable + totalFixed;

    const getFullName = () => {
        if (!employee) return 'Unknown Employee';
        return `${employee.firstname || ''} ${employee.lastname || ''}`.trim();
    };

    return (
        <HRLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Compact Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <EmployeeAvatar employee={employee} className="w-14 h-14" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {getFullName()}
                                </h1>
                                <div className="flex items-center space-x-3 mt-1">
                                    <span className="text-sm text-gray-600">{employee.position}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-sm text-gray-600">{employee.department?.name}</span>
                                    <StatusBadge status={employee.status} />
                                </div>
                            </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex items-center space-x-3">
                            <Link
                                href={route('hr.leave-credits')}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
                            >
                                ← Back
                            </Link>
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition text-sm font-medium"
                            >
                                Print
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards - Horizontal - FIXED NUMBERS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                        <div className="text-sm font-medium text-blue-800 mb-1">Total Balance</div>
                        <div className="text-2xl font-bold text-blue-600">{formatNumber(totalAll)}</div>
                        <div className="text-xs text-blue-600">days available</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                        <div className="text-sm font-medium text-emerald-800 mb-1">Earnable</div>
                        <div className="text-2xl font-bold text-emerald-600">{formatNumber(totalEarnable)}</div>
                        <div className="text-xs text-emerald-600">accumulating</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                        <div className="text-sm font-medium text-purple-800 mb-1">Fixed Allocation</div>
                        <div className="text-2xl font-bold text-purple-600">{formatNumber(usageStats.totalAllocated)}</div>
                        <div className="text-xs text-purple-600">/{formatNumber(usageStats.totalUsed)} used</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                        <div className="text-sm font-medium text-amber-800 mb-1">Fixed Usage</div>
                        <div className="text-2xl font-bold text-amber-600">{formatNumber(usageStats.usagePercentage)}%</div>
                        <div className="text-xs text-amber-600">{formatNumber(usageStats.totalRemaining)}d left</div>
                    </div>
                </div>

                {/* Fixed Leaves Usage Overview */}
                {activeTab === 'fixed' && usageStats.totalAllocated > 0 && (
                    <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-800">Fixed Leaves Usage Summary</h3>
                            <span className="text-xs text-gray-500">
                                {formatNumber(usageStats.totalUsed)}d used of {formatNumber(usageStats.totalAllocated)}d allocated
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                                className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${usageStats.usagePercentage}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 mt-2">
                            <span>{formatNumber(usageStats.totalUsed)}d used</span>
                            <span>{formatNumber(usageStats.totalRemaining)}d remaining</span>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="mb-6">
                    <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
                        <button
                            onClick={() => setActiveTab('earnable')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                                activeTab === 'earnable'
                                    ? 'bg-white text-gray-800 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            Earnable Leaves
                            <span className="ml-1 text-xs text-gray-500">({earnableLeaveCredits.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('fixed')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                                activeTab === 'fixed'
                                    ? 'bg-white text-gray-800 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            Fixed Leaves
                            <span className="ml-1 text-xs text-gray-500">({nonEarnableLeaveBalances.length})</span>
                        </button>
                    </div>
                </div>

                {/* Leave Cards Grid */}
                <div className="space-y-4">
                    {activeTab === 'earnable' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Earnable Leave Credits</h3>
                                <span className="text-sm text-gray-500">
                                    Accumulates monthly (+{formatNumber(totalEarnable === 2.5 ? '2.5' : totalEarnable)} days)
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {earnableLeaveCredits.map((credit, index) => (
                                    <LeaveBalanceCard
                                        key={index}
                                        type={credit.type}
                                        code={credit.code}
                                        balance={formatNumber(credit.balance)}
                                        description={credit.description}
                                        isEarnable={true}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'fixed' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Fixed Leave Balances</h3>
                                <span className="text-sm text-gray-500">
                                    {formatNumber(usageStats.totalRemaining)}d remaining of {formatNumber(usageStats.totalAllocated)}d allocated
                                </span>
                            </div>
                            {nonEarnableLeaveBalances.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {nonEarnableLeaveBalances.map((balance, index) => {
                                        const usedDays = balance.default_days ? balance.default_days - (parseFloat(balance.balance) || 0) : 0;
                                        return (
                                            <LeaveBalanceCard
                                                key={index}
                                                type={balance.type}
                                                code={balance.code}
                                                balance={formatNumber(balance.balance)}
                                                description={balance.description}
                                                defaultDays={balance.default_days ? formatNumber(balance.default_days) : null}
                                                usedDays={Math.max(0, usedDays)}
                                                isEarnable={false}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-gray-500 text-sm">No fixed leave allocations</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Quick Info Footer */}
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-800">
                                    Fixed leaves show usage progress. Earnable leaves (SL/VL) accumulate 1.25 days each monthly.
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('hr.employees.show', employee.employee_id)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            View Full Profile →
                        </Link>
                    </div>
                </div>
            </div>
        </HRLayout>
    );
}