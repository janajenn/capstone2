import HRLayout from '@/Layouts/HRLayout';
import { usePage, router } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import Swal from 'sweetalert2';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts';

// Enhanced status colors with gradients
const getStatusColor = (status) => {
  switch (status) {
    case 'approved':
      return 'from-emerald-400 to-green-600';
    case 'rejected':
      return 'from-rose-400 to-red-600';
    case 'pending':
      return 'from-amber-400 to-orange-500';
    default:
      return 'from-gray-400 to-gray-600';
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Custom chart colors with modern palette
const CHART_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  gray: '#6b7280'
};

const GRADIENT_COLORS = [
  'url(#primaryGradient)',
  'url(#secondaryGradient)',
  'url(#accentGradient)',
  'url(#successGradient)',
];

export default function Dashboard() {
    const { props } = usePage();
    const { 
        pendingCount, 
        recentRequests, 
        requestsByStatus,
        totalEmployees,
        totalDepartments,
        fullyApprovedRequests,
        rejectedRequests,
        leaveTypeStats,
        monthlyStats,
        departmentStats,
        availableYears,
        currentYear,
        currentMonth,
        filters
    } = props;

    // State to track previous data for comparison
    const [previousData, setPreviousData] = useState({
        pendingCount: pendingCount,
        recentRequests: recentRequests || [],
        requestsByStatus: requestsByStatus || {}
    });

    // State for filters
    const [localFilters, setLocalFilters] = useState({
        year: currentYear || new Date().getFullYear(),
        month: currentMonth || ''
    });

    // Ref to track if this is the first load
    const isFirstLoad = useRef(true);
    const [isPolling, setIsPolling] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState(
        'Notification' in window ? Notification.permission : 'denied'
    );

    // Animation states
    const [animatedStats, setAnimatedStats] = useState({
        employees: 0,
        departments: 0,
        approved: 0,
        rejected: 0
    });

    // Animate numbers on mount
    useEffect(() => {
        const animateValue = (start, end, duration, setter) => {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const value = Math.floor(progress * (end - start) + start);
                setter(value);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        };

        setTimeout(() => {
            animateValue(0, totalEmployees || 0, 2000, (val) => setAnimatedStats(prev => ({...prev, employees: val})));
            animateValue(0, totalDepartments || 0, 2000, (val) => setAnimatedStats(prev => ({...prev, departments: val})));
            animateValue(0, fullyApprovedRequests || 0, 2000, (val) => setAnimatedStats(prev => ({...prev, approved: val})));
            animateValue(0, rejectedRequests || 0, 2000, (val) => setAnimatedStats(prev => ({...prev, rejected: val})));
        }, 500);
    }, [totalEmployees, totalDepartments, fullyApprovedRequests, rejectedRequests]);

    // Enhanced notification functions
    const playNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Audio notification not supported');
        }
    };

    const showBrowserNotification = (title, body) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '/assets/Opol_logo.png',
                badge: '/assets/Opol_logo.png',
                tag: 'leave-request-notification'
            });
        }
    };

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
        }
    };

    const handleFilterChange = (newFilters) => {
        setLocalFilters(newFilters);
        router.get('/hr/dashboard', newFilters, {
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

    // Enhanced polling with visual feedback
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                setIsPolling(true);
                router.reload({
                    only: ['pendingCount', 'recentRequests', 'requestsByStatus'],
                    preserveScroll: true,
                    onSuccess: (page) => {
                        const newData = page.props;
                        // Skip notification on first load
                        if (!isFirstLoad.current) {
                            // Check for new pending requests
                            const newPendingCount = newData.pendingCount || 0;
                            const previousPendingCount = previousData.pendingCount || 0;

                            if (newPendingCount > previousPendingCount) {
                                const newRequestsCount = newPendingCount - previousPendingCount;

                                // Play notification sound
                                playNotificationSound();

                                // Show browser notification if tab is not active
                                if (document.hidden) {
                                    showBrowserNotification(
                                        `${newRequestsCount} new leave request${newRequestsCount > 1 ? 's' : ''} received!`,
                                        'Click to view details'
                                    );
                                }

                                // Show notification for new pending requests
                                Swal.fire({
                                    toast: true,
                                    position: 'top-end',
                                    icon: 'info',
                                    title: `${newRequestsCount} new leave request${newRequestsCount > 1 ? 's' : ''} received!`,
                                    text: 'Click to view details',
                                    showConfirmButton: false,
                                    timer: 5000,
                                    timerProgressBar: true,
                                    didOpen: (toast) => {
                                        toast.addEventListener('click', () => {
                                            router.visit('/hr/leave-requests');
                                        });
                                    }
                                });
                            }

                            // Check for new recent requests
                            const newRecentRequests = newData.recentRequests || [];
                            const previousRecentRequests = previousData.recentRequests || [];

                            if (newRecentRequests.length > previousRecentRequests.length) {
                                // Find the newest request(s)
                                const newRequests = newRecentRequests.slice(0, newRecentRequests.length - previousRecentRequests.length);

                                if (newRequests.length > 0) {
                                    const latestRequest = newRequests[0];
                                    const employeeName = `${latestRequest.employee?.firstname} ${latestRequest.employee?.middlename} ${latestRequest.employee?.lastname}`;
                                    const leaveType = latestRequest.leave_type?.name;

                                    // Play notification sound
                                    playNotificationSound();

                                    // Show browser notification if tab is not active
                                    if (document.hidden) {
                                        showBrowserNotification(
                                            `New leave request from ${employeeName}`,
                                            `${leaveType} - ${formatDate(latestRequest.date_from)} to ${formatDate(latestRequest.date_to)}`
                                        );
                                    }

                                    Swal.fire({
                                        toast: true,
                                        position: 'top-end',
                                        icon: 'success',
                                        title: `New leave request from ${employeeName}`,
                                        text: `${leaveType} - ${formatDate(latestRequest.date_from)} to ${formatDate(latestRequest.date_to)}`,
                                        showConfirmButton: false,
                                        timer: 6000,
                                        timerProgressBar: true,
                                        didOpen: (toast) => {
                                            toast.addEventListener('click', () => {
                                                router.visit('/hr/leave-requests');
                                            });
                                        }
                                    });
                                }
                            }
                        }
                        setPreviousData({
                            pendingCount: newData.pendingCount,
                            recentRequests: newData.recentRequests,
                            requestsByStatus: newData.requestsByStatus
                        });
                        isFirstLoad.current = false;
                    },
                    onFinish: () => setIsPolling(false)
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setIsPolling(false);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [previousData, localFilters]);

    // Custom Tooltip Component
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl">
                    <p className="font-semibold text-gray-900">{label}</p>
                    <p className="text-indigo-600 font-medium">
                        {payload[0].value} requests
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <HRLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
                {/* Animated Background Elements */}
                <div className="fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
                </div>

                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="relative">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                                HR Analytics Dashboard
                            </h1>
                            <p className="text-gray-600 text-lg">Comprehensive insights for strategic HR management</p>
                            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center space-x-3">
                            {notificationPermission === 'default' && (
                                <button
                                    onClick={requestNotificationPermission}
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 flex items-center shadow-lg hover:scale-105"
                                >
                                    <div className="p-2 rounded-xl bg-white/20 mr-3">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5L19.5 4.5" />
                                        </svg>
                                    </div>
                                    Enable Notifications
                                </button>
                            )}
                            {notificationPermission === 'granted' && (
                                <span className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl text-sm font-medium shadow-lg flex items-center">
                                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                                    ✓ Live Updates Active
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Enhanced Filter Section */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-indigo-800 bg-clip-text text-transparent">
                                    Data Insights
                                </h3>
                                <p className="text-gray-600 mt-1">Filter and analyze your HR metrics</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Year</label>
                                    <select
                                        value={localFilters.year}
                                        onChange={(e) => handleFilterChange({ ...localFilters, year: e.target.value })}
                                        className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
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
                                        className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
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
                            {isPolling && (
                                <div className="flex items-center text-sm text-indigo-600">
                                    <div className="w-2 h-2 bg-indigo-600 rounded-full mr-2 animate-pulse"></div>
                                    Live updating...
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Employees Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-white/20 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Total Employees</p>
                                    <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                                        {animatedStats.employees.toLocaleString()}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-2">Active workforce</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center text-xs text-blue-600 font-medium">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                                    All departments
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Departments Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-white/20 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Total Departments</p>
                                    <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-700 bg-clip-text text-transparent">
                                        {animatedStats.departments}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-2">Organizational units</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center text-xs text-purple-600 font-medium">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
                                    Company structure
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

                    {/* Rejected Requests Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-red-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-white/20 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Rejected Requests</p>
                                    <h2 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-red-700 bg-clip-text text-transparent">
                                        {animatedStats.rejected}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-2">This period</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center text-xs text-rose-600 font-medium">
                                    <div className="w-2 h-2 bg-rose-500 rounded-full mr-2 animate-pulse"></div>
                                    Requires attention
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Leave Types Chart */}
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-8 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-indigo-800 bg-clip-text text-transparent">
                                    Leave Type Distribution
                                </h3>
                                <p className="text-gray-600 mt-1">Most frequently applied leave types</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={leaveTypeStats || []}>
                                    <defs>
                                        <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#6b7280"
                                        fontSize={12}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis 
                                        stroke="#6b7280"
                                        fontSize={12}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar 
                                        dataKey="count" 
                                        fill="url(#primaryGradient)"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Monthly Trends Chart */}
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-8 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-indigo-800 bg-clip-text text-transparent">
                                    Monthly Trends
                                </h3>
                                <p className="text-gray-600 mt-1">Leave requests throughout the year</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyStats || []}>
                                    <defs>
                                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="month" 
                                        stroke="#6b7280"
                                        fontSize={12}
                                    />
                                    <YAxis 
                                        stroke="#6b7280"
                                        fontSize={12}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="count" 
                                        stroke="#8b5cf6" 
                                        strokeWidth={3}
                                        fill="url(#areaGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Department Comparison Chart */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-8 mb-6 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-indigo-800 bg-clip-text text-transparent">
                                Department Analysis
                            </h3>
                            <p className="text-gray-600 mt-1">Leave requests across departments</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={departmentStats || []}>
                                <defs>
                                    <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.2}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#6b7280"
                                    fontSize={12}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis 
                                    stroke="#6b7280"
                                    fontSize={12}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar 
                                    dataKey="count" 
                                    fill="url(#secondaryGradient)"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </HRLayout>
    );
}