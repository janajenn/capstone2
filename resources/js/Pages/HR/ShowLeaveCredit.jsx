// resources/js/Pages/HR/ShowLeaveCredit.jsx
import HRLayout from '@/Layouts/HRLayout';
import { usePage, Link } from '@inertiajs/react';
import { useState } from 'react';

// Import Heroicons v2
import {
    ChevronRightIcon,
    ArrowLeftIcon,
    PrinterIcon,
    BuildingOfficeIcon,
    BriefcaseIcon,
    UserCircleIcon,
    ChartBarIcon,
    ChartPieIcon,
    InformationCircleIcon,
    ArrowRightIcon,
    CalendarDaysIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    UserIcon,
    UserGroupIcon,
    ArrowTrendingUpIcon,
    ClipboardDocumentListIcon,
    ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

// Enhanced avatar component with gradient options
const EmployeeAvatar = ({ employee, size = "lg" }) => {
    const sizes = {
        sm: "w-10 h-10",
        md: "w-14 h-14",
        lg: "w-16 h-16",
        xl: "w-20 h-20"
    };

    const getInitials = () => {
        if (!employee) return '??';
        const firstInitial = employee.firstname ? employee.firstname[0] : '';
        const lastInitial = employee.lastname ? employee.lastname[0] : '';
        return (firstInitial + lastInitial).toUpperCase();
    };

    return (
        <div className={`${sizes[size]} bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg relative`}>
            {getInitials()}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-indigo-100 flex items-center justify-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            </div>
        </div>
    );
};

// Modern status badge
const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold ${
        status === 'active' 
            ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200' 
            : 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 border border-rose-200'
    }`}>
        <span className={`w-2 h-2 rounded-full mr-2 ${
            status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
        }`}></span>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
);

// Enhanced usage progress bar
const UsageProgressBar = ({ used, total, type = 'default', showLabel = true }) => {
    const percentage = total > 0 ? (used / total) * 100 : 0;
    
    const getColorConfig = (type) => {
        const configs = {
            'SL': { 
                gradient: 'from-blue-500 to-cyan-500',
                bg: 'bg-blue-100',
                text: 'text-blue-600'
            },
            'VL': { 
                gradient: 'from-emerald-500 to-green-500',
                bg: 'bg-emerald-100',
                text: 'text-emerald-600'
            },
            'default': { 
                gradient: 'from-purple-500 to-indigo-500',
                bg: 'bg-purple-100',
                text: 'text-purple-600'
            }
        };
        return configs[type] || configs.default;
    };

    const config = getColorConfig(type);

    return (
        <div className="space-y-2">
            {showLabel && (
                <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-600">Usage</span>
                    <span className="font-semibold text-gray-800">
                        {used}/{total} days
                    </span>
                </div>
            )}
            <div className="relative">
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                        className={`h-2.5 rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span className={config.text}>
                        {percentage.toFixed(0)}%
                    </span>
                    <span>100%</span>
                </div>
            </div>
        </div>
    );
};

// Icon component for leave types
const LeaveTypeIcon = ({ code, size = "w-6 h-6" }) => {
    const iconConfig = {
        'SL': { 
            icon: ClockIcon, 
            color: 'text-blue-500',
            bg: 'bg-blue-100'
        },
        'VL': { 
            icon: CalendarDaysIcon, 
            color: 'text-emerald-500',
            bg: 'bg-emerald-100'
        },
        'default': { 
            icon: ClipboardDocumentListIcon, 
            color: 'text-purple-500',
            bg: 'bg-purple-100'
        }
    };

    const config = iconConfig[code] || iconConfig.default;
    const IconComponent = config.icon;

    return (
        <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
            <IconComponent className={`${size}`} />
        </div>
    );
};

// Enhanced leave balance card
const LeaveBalanceCard = ({ type, code, balance, description, defaultDays, isEarnable, usedDays = 0 }) => {
    const getConfig = (code) => {
        const configs = {
            'SL': { 
                gradient: 'from-blue-50 to-cyan-50',
                border: 'border-blue-200',
                text: 'text-blue-700'
            },
            'VL': { 
                gradient: 'from-emerald-50 to-green-50',
                border: 'border-emerald-200',
                text: 'text-emerald-700'
            },
            'default': { 
                gradient: 'from-purple-50 to-indigo-50',
                border: 'border-purple-200',
                text: 'text-purple-700'
            }
        };
        return configs[code] || configs.default;
    };

    const config = getConfig(code);
    const totalAllocation = defaultDays || balance + usedDays;
    const isFixed = !isEarnable && defaultDays;

    return (
        <div className={`bg-gradient-to-br ${config.gradient} border ${config.border} rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <LeaveTypeIcon code={code} />
                    <div>
                        <h3 className="font-bold text-gray-800">{type}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.text} bg-white/70`}>
                                {code}
                            </span>
                            {isEarnable && (
                                <span className="text-xs text-blue-600 font-medium flex items-center">
                                    <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                                    +1.25/mo
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{balance}</div>
                    <div className="text-xs text-gray-500">days left</div>
                </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {description}
            </p>
            
            {/* Usage tracking for fixed leaves */}
            {isFixed && (
                <div className="mb-4">
                    <UsageProgressBar 
                        used={usedDays} 
                        total={totalAllocation} 
                        type={code}
                        showLabel={false}
                    />
                </div>
            )}
            
            <div className="flex items-center justify-between text-sm">
                {defaultDays ? (
                    <span className="text-gray-700 font-medium">
                        Allocation: {defaultDays}d
                    </span>
                ) : (
                    <span className="text-gray-600">Accumulating monthly</span>
                )}
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    isFixed 
                        ? usedDays > 0 
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        : 'bg-blue-100 text-blue-600'
                }`}>
                    {isFixed ? `Used: ${usedDays}d` : 'Earnable'}
                </span>
            </div>
        </div>
    );
};

// Stats card component
const StatCard = ({ title, value, subtitle, color = 'blue', Icon }) => {
    const colors = {
        blue: { 
            bg: 'from-blue-50 to-indigo-50', 
            border: 'border-blue-200', 
            text: 'text-blue-700',
            iconBg: 'bg-blue-100 text-blue-600'
        },
        green: { 
            bg: 'from-emerald-50 to-green-50', 
            border: 'border-emerald-200', 
            text: 'text-emerald-700',
            iconBg: 'bg-emerald-100 text-emerald-600'
        },
        purple: { 
            bg: 'from-purple-50 to-pink-50', 
            border: 'border-purple-200', 
            text: 'text-purple-700',
            iconBg: 'bg-purple-100 text-purple-600'
        },
        amber: { 
            bg: 'from-amber-50 to-orange-50', 
            border: 'border-amber-200', 
            text: 'text-amber-700',
            iconBg: 'bg-amber-100 text-amber-600'
        }
    };

    const config = colors[color] || colors.blue;

    return (
        <div className={`bg-gradient-to-br ${config.bg} border ${config.border} rounded-2xl p-5`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                </div>
                {Icon && (
                    <div className={`p-2 rounded-lg ${config.iconBg}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>
        </div>
    );
};

// Tab component with icons
const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            active
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
    >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        {count !== null && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${
                active
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-300 text-gray-700'
            }`}>
                {count}
            </span>
        )}
    </button>
);

export default function ShowLeaveCredit() {
    const { employee, earnableLeaveCredits, nonEarnableLeaveBalances } = usePage().props;
    const [activeTab, setActiveTab] = useState('overview');

    // Calculate usage statistics
    const calculateUsageStats = () => {
        const fixedLeaves = nonEarnableLeaveBalances.filter(leave => leave.default_days);
        
        const totalAllocated = fixedLeaves.reduce((total, leave) => total + (parseFloat(leave.default_days) || 0), 0);
        const totalUsed = fixedLeaves.reduce((total, leave) => {
            const used = (parseFloat(leave.default_days) || 0) - (parseFloat(leave.balance) || 0);
            return total + Math.max(0, used);
        }, 0);
        const totalRemaining = fixedLeaves.reduce((total, leave) => total + (parseFloat(leave.balance) || 0), 0);

        return {
            totalAllocated,
            totalUsed,
            totalRemaining,
            usagePercentage: totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0
        };
    };

    const usageStats = calculateUsageStats();
    
    // Format numbers
    const formatNumber = (num) => {
        if (num === null || num === undefined) return '0';
        const formatted = parseFloat(num).toFixed(2);
        return formatted.replace(/\.00$/, '');
    };

    // Calculate totals
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

    // Tab configurations
    const tabs = [
        { id: 'overview', label: 'Overview', icon: ChartBarIcon, count: null },
        { id: 'earnable', label: 'Earnable', icon: ArrowTrendingUpIcon, count: earnableLeaveCredits.length },
        { id: 'fixed', label: 'Fixed', icon: ClipboardDocumentListIcon, count: nonEarnableLeaveBalances.length },
    ];

    return (
        <HRLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header with Breadcrumb */}
                <div className="mb-6">
                    <nav className="flex items-center text-sm text-gray-600">
                        <Link href={route('hr.dashboard')} className="hover:text-indigo-600 transition-colors">
                            Dashboard
                        </Link>
                        <ChevronRightIcon className="w-4 h-4 mx-2" />
                        <Link href={route('hr.leave-credits')} className="hover:text-indigo-600 transition-colors">
                            Leave Credits
                        </Link>
                        <ChevronRightIcon className="w-4 h-4 mx-2" />
                        <span className="font-medium text-gray-900">{getFullName()}</span>
                    </nav>
                </div>

                {/* Main Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <EmployeeAvatar employee={employee} size="lg" />
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {getFullName()}
                                </h1>
                                <div className="flex items-center space-x-4 mt-2">
                                    <div className="flex items-center space-x-2">
                                        <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-600">{employee.department?.name}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <BriefcaseIcon className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-600">{employee.position}</span>
                                    </div>
                                    <StatusBadge status={employee.status} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <Link
                                href={route('hr.leave-credits')}
                                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium flex items-center space-x-2"
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                                <span>Back to List</span>
                            </Link>
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition text-sm font-medium flex items-center space-x-2"
                            >
                                <PrinterIcon className="w-4 h-4" />
                                <span>Print Report</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Total Leave Balance"
                        value={`${formatNumber(totalAll)} days`}
                        subtitle="Available across all types"
                        color="blue"
                        Icon={ChartBarIcon}
                    />
                    
                    <StatCard
                        title="Earnable Leaves"
                        value={`${formatNumber(totalEarnable)} days`}
                        subtitle="Accumulating monthly"
                        color="green"
                        Icon={ArrowTrendingUpIcon}
                    />
                    
                    <StatCard
                        title="Fixed Allocation"
                        value={`${formatNumber(usageStats.totalAllocated)} days`}
                        subtitle={`${formatNumber(usageStats.totalUsed)} used`}
                        color="purple"
                        Icon={ClipboardDocumentListIcon}
                    />
                    
                    <StatCard
                        title="Usage Rate"
                        value={`${formatNumber(usageStats.usagePercentage)}%`}
                        subtitle={`${formatNumber(usageStats.totalRemaining)}d left`}
                        color="amber"
                        Icon={ChartPieIcon}
                    />
                </div>

                {/* Fixed Leaves Usage Summary */}
                {usageStats.totalAllocated > 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Fixed Leaves Usage</h3>
                                <p className="text-sm text-gray-500">Annual allocation usage overview</p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium text-gray-600">
                                    {formatNumber(usageStats.totalRemaining)} days remaining
                                </div>
                                <div className="text-xs text-gray-500">
                                    of {formatNumber(usageStats.totalAllocated)} allocated
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="relative">
                                <div className="w-full bg-gray-100 rounded-full h-3">
                                    <div 
                                        className="h-3 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transition-all duration-700"
                                        style={{ width: `${usageStats.usagePercentage}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600 mt-2">
                                    <span>0%</span>
                                    <span className="font-semibold text-amber-600">
                                        {formatNumber(usageStats.usagePercentage)}% used
                                    </span>
                                    <span>100%</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                                    <div className="text-sm font-medium text-amber-800">Used</div>
                                    <div className="text-xl font-bold text-amber-900">
                                        {formatNumber(usageStats.totalUsed)}
                                    </div>
                                    <div className="text-xs text-amber-700">days</div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                                    <div className="text-sm font-medium text-blue-800">Remaining</div>
                                    <div className="text-xl font-bold text-blue-900">
                                        {formatNumber(usageStats.totalRemaining)}
                                    </div>
                                    <div className="text-xs text-blue-700">days</div>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
                                    <div className="text-sm font-medium text-purple-800">Total</div>
                                    <div className="text-xl font-bold text-purple-900">
                                        {formatNumber(usageStats.totalAllocated)}
                                    </div>
                                    <div className="text-xs text-purple-700">allocated</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="mb-6">
                    <div className="flex space-x-2">
                        {tabs.map((tab) => (
                            <TabButton
                                key={tab.id}
                                active={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                icon={tab.icon}
                                label={tab.label}
                                count={tab.count}
                            />
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Earnable Leaves Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Earnable Leaves</h3>
                                        <p className="text-sm text-gray-500">Accumulate monthly at 1.25 days each</p>
                                    </div>
                                    <div className="text-sm font-medium text-blue-600 flex items-center">
                                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                                        Total: {formatNumber(totalEarnable)} days
                                    </div>
                                </div>
                                
                                {earnableLeaveCredits.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                ) : (
                                    <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-dashed border-blue-200">
                                        <ArrowTrendingUpIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No earnable leaves configured</p>
                                    </div>
                                )}
                            </div>

                            {/* Fixed Leaves Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Fixed Leave Allocations</h3>
                                        <p className="text-sm text-gray-500">Annual allocations with usage tracking</p>
                                    </div>
                                    <div className="text-sm font-medium text-purple-600 flex items-center">
                                        <ClipboardDocumentListIcon className="w-4 h-4 mr-1" />
                                        Remaining: {formatNumber(usageStats.totalRemaining)} days
                                    </div>
                                </div>
                                
                                {nonEarnableLeaveBalances.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {nonEarnableLeaveBalances.map((balance, index) => {
                                            const usedDays = balance.default_days 
                                                ? (parseFloat(balance.default_days) || 0) - (parseFloat(balance.balance) || 0)
                                                : 0;
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
                                    <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-purple-200">
                                        <ClipboardDocumentListIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No fixed leave allocations</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Individual Tabs */}
                    {activeTab === 'earnable' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {nonEarnableLeaveBalances.map((balance, index) => {
                                    const usedDays = balance.default_days 
                                        ? (parseFloat(balance.default_days) || 0) - (parseFloat(balance.balance) || 0)
                                        : 0;
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
                        </div>
                    )}
                </div>

                {/* Information Footer */}
                <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                                <InformationCircleIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-1">Leave Information</h4>
                                <p className="text-sm text-gray-600">
                                    Earnable leaves (SL/VL) accumulate 1.25 days each monthly. 
                                    Fixed leaves show real-time usage against annual allocations.
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('hr.employees.show', employee.employee_id)}
                            className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 transition text-sm font-medium flex items-center space-x-2"
                        >
                            <span>View Full Profile</span>
                            <ArrowRightIcon className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </HRLayout>
    );
}