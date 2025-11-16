import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { usePage, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl">
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-green-600 font-medium">
                    {payload[0].value} {payload[0].name === 'days' ? 'days' : 'requests'}
                </p>
            </div>
        );
    }
    return null;
};

export default function EmployeeDashboard() {
    const { props } = usePage();
    const { 
        userName, 
        departmentName, 
        leaveCredits, 
        latestLeaveRequest,
        pendingRequests = 0,
        approvedRequests = 0,
        leaveTypeStats = [],
        monthlyStats = [],
        availableYears = [new Date().getFullYear()],
        currentYear = new Date().getFullYear(),
        currentMonth = ''
    } = props;

    // State for filters
    const [localFilters, setLocalFilters] = useState({
        year: currentYear,
        month: currentMonth
    });

    // Animation states - now using numbers for decimal animation
    const [animatedStats, setAnimatedStats] = useState({
        vacation: 0,
        sick: 0,
        pending: 0,
        approved: 0
    });

    // Animate numbers on mount with decimal support
    useEffect(() => {
        const animateValue = (start, end, duration, setter) => {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const value = parseFloat((progress * (end - start) + start).toFixed(2));
                setter(value);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        };

        setTimeout(() => {
            // Convert leave credits to numbers with 2 decimal places
            const vacationBalance = parseFloat(leaveCredits?.vl || 0).toFixed(2);
            const sickBalance = parseFloat(leaveCredits?.sl || 0).toFixed(2);
            
            animateValue(0, parseFloat(vacationBalance), 2000, (val) => setAnimatedStats(prev => ({...prev, vacation: val})));
            animateValue(0, parseFloat(sickBalance), 2000, (val) => setAnimatedStats(prev => ({...prev, sick: val})));
            animateValue(0, pendingRequests, 2000, (val) => setAnimatedStats(prev => ({...prev, pending: val})));
            animateValue(0, approvedRequests, 2000, (val) => setAnimatedStats(prev => ({...prev, approved: val})));
        }, 500);
    }, [leaveCredits, pendingRequests, approvedRequests]);

    const handleFilterChange = (newFilters) => {
        setLocalFilters(newFilters);
        router.get('/employee/dashboard', newFilters, {
            preserveState: true,
            replace: true
        });
    };

    const monthOptions = [
        { value: '', label: 'All Months' },
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' }
    ];

    const resetFilters = () => {
        const newFilters = { year: new Date().getFullYear(), month: '' };
        setLocalFilters(newFilters);
        handleFilterChange(newFilters);
    };

    // Format number to always show 2 decimal places
    const formatBalance = (value) => {
        return typeof value === 'number' ? value.toFixed(2) : '0.00';
    };

    // Quick Actions Data
    const quickActions = [
        {
            title: 'View Attendance Logs',
            href: '/employee/attendance-logs',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'emerald'
        },
        {
            title: 'Apply for Leave',
            href: '/employee/leave',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            color: 'green'
        },
        {
            title: 'Convert Leave Credits',
            href: '/employee/credit-conversion',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            ),
            color: 'teal'
        },
        {
            title: 'View Leave History',
            href: '/employee/my-leave-requests',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            color: 'lime'
        },
        {
            title: 'My Leave Calendar',
            href: '/employee/leave-calendar',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            color: 'emerald'
        }
    ];

    const getColorClasses = (color) => {
        const colors = {
            emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300',
            green: 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300',
            teal: 'bg-teal-50 border-teal-200 text-teal-600 hover:bg-teal-100 hover:border-teal-300',
            lime: 'bg-lime-50 border-lime-200 text-lime-600 hover:bg-lime-100 hover:border-lime-300'
        };
        return colors[color] || colors.emerald;
    };

    return (
        <EmployeeLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 p-6">
                {/* Animated Background Elements */}
                <div className="fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-emerald-200 to-green-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-green-200 to-teal-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
                </div>

                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="relative">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-emerald-900 bg-clip-text text-transparent mb-2">
                                Employee Dashboard
                            </h1>
                            <p className="text-gray-600 text-lg">Welcome back, {userName}. Your personal workspace and analytics.</p>
                            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center space-x-3">
                            <span className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl text-sm font-medium shadow-lg flex items-center">
                                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                                ✓ Active Employee
                            </span>
                        </div>
                    </div>
                </div>

                {/* Enhanced Filter Section */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-emerald-800 bg-clip-text text-transparent">
                                    Personal Analytics
                                </h3>
                                <p className="text-gray-600 mt-1">Filter and analyze your personal metrics</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Year</label>
                                    <select
                                        value={localFilters.year}
                                        onChange={(e) => handleFilterChange({ ...localFilters, year: e.target.value })}
                                        className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                                    >
                                        {availableYears?.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Month</label>
                                    <select
                                        value={localFilters.month}
                                        onChange={(e) => handleFilterChange({ ...localFilters, month: e.target.value })}
                                        className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                                    >
                                        {monthOptions.map(month => (
                                            <option key={month.value} value={month.value}>{month.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={resetFilters}
                                        className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105"
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                <p>Displaying: <span className="font-semibold text-gray-800">
                                    {localFilters.month ? 
                                        `${monthOptions.find(m => m.value === localFilters.month)?.label} ${localFilters.year}` : 
                                        `All months of ${localFilters.year}`
                                    }
                                </span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Vacation Leave Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-white/20 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Vacation Leave</p>
                                    <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                                        {formatBalance(animatedStats.vacation)}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-2">Available days</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center text-xs text-emerald-600 font-medium">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                                    Current balance
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sick Leave Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-white/20 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Sick Leave</p>
                                    <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                                        {formatBalance(animatedStats.sick)}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-2">Available days</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center text-xs text-green-600 font-medium">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                    Current balance
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Requests Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-white/20 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Pending Requests</p>
                                    <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent">
                                        {animatedStats.pending}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-2">Awaiting approval</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center text-xs text-amber-600 font-medium">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></div>
                                    Under review
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Approved Requests Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-white/20 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Approved Requests</p>
                                    <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                                        {animatedStats.approved}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-2">This period</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center text-xs text-emerald-600 font-medium">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                                    Successfully processed
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

             

                {/* Quick Actions Section */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-8 mb-6 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-emerald-800 bg-clip-text text-transparent">
                                Quick Actions
                            </h3>
                            <p className="text-gray-600 mt-1">Access your most used features quickly</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                href={action.href}
                                className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${getColorClasses(action.color)}`}
                            >
                                <div className="mb-4 p-3 rounded-xl bg-white shadow-sm">
                                    {action.icon}
                                </div>
                                <span className="text-sm font-medium text-center leading-tight">{action.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Additional Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Department Info */}
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-6 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Department</p>
                                <p className="text-lg font-semibold text-gray-900">{departmentName || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-6 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Recent Activity</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {latestLeaveRequest ? 'Leave Request' : 'No recent activity'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Apply */}
                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl shadow-2xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-emerald-100 text-sm">Need time off?</p>
                                <p className="text-white text-lg font-semibold">Apply for Leave</p>
                            </div>
                            <Link 
                                href="/employee/leave"
                                className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-medium hover:bg-emerald-50 transition-all duration-300 hover:scale-105 shadow-lg"
                            >
                                Apply Now
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}