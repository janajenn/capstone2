import DeptHeadLayout from '@/Layouts/DeptHeadLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
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

// Custom yellow color constants
const DEPT_HEAD_PRIMARY = '#fbbf24';
const DEPT_HEAD_SECONDARY = '#f59e0b';
const DEPT_HEAD_DARK = '#d97706';

// Enhanced status colors with gradients for yellow accent theme
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

// Custom chart colors with yellow palette
const CHART_COLORS = {
  primary: DEPT_HEAD_PRIMARY,
  secondary: DEPT_HEAD_SECONDARY,
  accent: DEPT_HEAD_DARK,
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  gray: '#9ca3af'
};

export default function Dashboard({ 
    initialLeaveRequests = [], 
    departmentName, 
    stats,
    chartData,
    selectedYear,
    availableYears
}) {
    const [leaveRequests, setLeaveRequests] = useState(() => initialLeaveRequests || []);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectRemarks, setRejectRemarks] = useState('');
    const [isPolling, setIsPolling] = useState(false);
    const [currentChartData, setCurrentChartData] = useState(chartData);
    const [currentYear, setCurrentYear] = useState(selectedYear);
    const { post } = useForm();
    const pollingIntervalRef = useRef(null);
    const isMountedRef = useRef(true);
    const isInitialLoadRef = useRef(true);
    const knownRequestIds = useRef(new Set(initialLeaveRequests.map(r => r.id)));

    // Animation states
    const [animatedStats, setAnimatedStats] = useState({
        employees: 0,
        approved: 0,
        rejected: 0,
        pending: 0
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
            animateValue(0, stats?.totalEmployees || 0, 2000, (val) => setAnimatedStats(prev => ({...prev, employees: val})));
            animateValue(0, stats?.approvedLeaveRequests || 0, 2000, (val) => setAnimatedStats(prev => ({...prev, approved: val})));
            animateValue(0, stats?.rejectedLeaveRequests || 0, 2000, (val) => setAnimatedStats(prev => ({...prev, rejected: val})));
            animateValue(0, initialLeaveRequests?.length || 0, 2000, (val) => setAnimatedStats(prev => ({...prev, pending: val})));
        }, 500);
    }, [stats, initialLeaveRequests]);

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
            return permission;
        }
        return 'denied';
    };

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            clearInterval(pollingIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        const fetchUpdatedRequests = async () => {
            if (!isMountedRef.current) return;

            try {
                setIsPolling(true);
                const response = await fetch('/dept-head/updated-requests');

                if (!response.ok) throw new Error('Network response was not ok');

                const { newRequests } = await response.json();

                if (!isMountedRef.current || !Array.isArray(newRequests)) return;

                if (newRequests.length > 0) {
                    setLeaveRequests(prev => {
                        const existingIds = new Set(prev.map(r => r.id));
                        const filteredNewRequests = newRequests.filter(r => !existingIds.has(r.id));

                        const trulyNewRequests = filteredNewRequests.filter(
                            r => !knownRequestIds.current.has(r.id)
                        );

                        trulyNewRequests.forEach(r => knownRequestIds.current.add(r.id));

                        if (!isInitialLoadRef.current && pollingIntervalRef.current && trulyNewRequests.length > 0) {
                            const latestRequest = trulyNewRequests[0];
                            
                            // Play notification sound
                            playNotificationSound();

                            // Show browser notification if tab is not active
                            if (document.hidden) {
                                showBrowserNotification(
                                    `New leave request from ${latestRequest.employee?.firstname} ${latestRequest.employee?.lastname}`,
                                    'Click to view details'
                                );
                            }

                            Swal.fire({
                                toast: true,
                                position: 'top-end',
                                icon: 'info',
                                title: `New request from ${latestRequest.employee?.firstname} ${latestRequest.employee?.lastname}`,
                                showConfirmButton: false,
                                timer: 5000,
                                timerProgressBar: true,
                                didOpen: (toast) => {
                                    toast.addEventListener('click', () => {
                                        router.visit('/dept-head/leave-requests');
                                    });
                                }
                            });
                        }

                        return [...filteredNewRequests, ...prev];
                    });
                }
            } catch (error) {
                console.error('Polling error:', error);
            } finally {
                if (isMountedRef.current) {
                    setIsPolling(false);
                    isInitialLoadRef.current = false;
                }
            }
        };

        fetchUpdatedRequests();
        pollingIntervalRef.current = setInterval(fetchUpdatedRequests, 10000);

        return () => {
            clearInterval(pollingIntervalRef.current);
        };
    }, []);

    // Fetch chart data when year changes
    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const response = await fetch(`/dept-head/chart-data?year=${currentYear}`);
                const data = await response.json();
                setCurrentChartData(data);
            } catch (error) {
                console.error('Error fetching chart data:', error);
            }
        };

        fetchChartData();
    }, [currentYear]);

    const handleYearChange = (year) => {
        setCurrentYear(year);
        router.get(`/dept-head/dashboard?year=${year}`, {}, {
            preserveState: true,
            replace: true
        });
    };

    const handleApprove = (id) => {
        Swal.fire({
            title: 'Approve this leave request?',
            text: 'This will move the request to the next approval stage',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, approve',
            cancelButtonText: 'Cancel',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl shadow-2xl border border-gray-200',
                confirmButton: 'px-6 py-2 rounded-xl font-medium bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-800 hover:shadow-lg transition-all duration-300',
                cancelButton: 'px-6 py-2 rounded-xl font-medium bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:shadow-lg transition-all duration-300'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                post(`/dept-head/leave-requests/${id}/approve`, {
                    onSuccess: () => {
                        setLeaveRequests(prev => prev.filter(r => r.id !== id));
                        Swal.fire('Approved!', 'The leave request has been approved.', 'success');
                    },
                    onError: () => {
                        Swal.fire('Error', 'There was a problem approving the request', 'error');
                    }
                });
            }
        });
    };

    const handleReject = (id) => {
        if (!rejectRemarks.trim()) {
            Swal.fire('Error', 'Please enter rejection remarks', 'error');
            return;
        }

        post(`/dept-head/leave-requests/${id}/reject`, {
            remarks: rejectRemarks,
            onSuccess: () => {
                setLeaveRequests(prev => prev.filter(r => r.id !== id));
                setRejectingId(null);
                setRejectRemarks('');
                Swal.fire('Rejected!', 'The leave request has been rejected.', 'success');
            },
            onError: () => {
                Swal.fire('Error', 'There was a problem rejecting the request', 'error');
            }
        });
    };

    // Custom Tooltip Component
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl">
                    <p className="font-semibold text-gray-900">{label}</p>
                    <p className="text-yellow-600 font-medium">
                        {payload[0].value} {payload[0].name?.toLowerCase() || 'items'}
                    </p>
                </div>
            );
        }
        return null;
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

    return (
        <DeptHeadLayout>
            <Head title="Department Head Dashboard" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-amber-50 p-6">
                {/* Animated Background Elements */}
                <div className="fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-yellow-200 to-amber-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-amber-200 to-orange-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
                </div>

                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="relative">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent mb-2">
                                Department Analytics
                            </h1>
                            <p className="text-gray-600 text-lg">Strategic insights for {departmentName} management</p>
                            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"></div>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center space-x-3">
                            {/* <button
                                onClick={requestNotificationPermission}
                                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-800 rounded-2xl hover:shadow-2xl transition-all duration-300 flex items-center shadow-lg hover:scale-105 border border-yellow-300"
                            >
                                <div className="p-2 rounded-xl bg-white/30 mr-3">
                                
                                </div>
                               
                            </button> */}
                            {/* {isPolling && (
                                <span className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl text-sm font-medium shadow-lg flex items-center">
                                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                                    
                                </span>
                            )} */}
                        </div>
                    </div>
                </div>

                {/* Enhanced Filter Section */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent">
                                    Data Insights
                                </h3>
                                <p className="text-gray-600 mt-1">Filter and analyze your department metrics</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Year</label>
                                    <select
                                        value={currentYear}
                                        onChange={(e) => handleYearChange(e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                                    >
                                        {availableYears?.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Month</label>
                                    <select
                                        value={''}
                                        onChange={() => {}}
                                        className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300 bg-white/50 backdrop-blur-sm opacity-50 cursor-not-allowed"
                                        disabled
                                    >
                                        {monthOptions.map(month => (
                                            <option key={month.value} value={month.value}>{month.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                <p>Displaying data for: <span className="font-semibold text-gray-800">
                                    {currentYear}
                                </span></p>
                            </div>
                            {/* {isPolling && (
                                <div className="flex items-center text-sm text-yellow-600">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                                    Live updating...
                                </div>
                            )} */}
                        </div>
                    </div>
                </div>

                {/* Enhanced Stats Cards with Yellow Accent Theme */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Employees Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-white/20 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Team Members</p>
                                    <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent">
                                        {animatedStats.employees.toLocaleString()}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-2">Active in department</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg">
                                    <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center text-xs text-yellow-600 font-medium">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                                    {departmentName}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Approved Requests Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-white/20 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Approved Requests</p>
                                    <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent">
                                        {animatedStats.approved}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-2">This period</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg">
                                    <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center text-xs text-yellow-600 font-medium">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                                    Successfully processed
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rejected Requests Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-white/20 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Rejected Requests</p>
                                    <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent">
                                        {animatedStats.rejected}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-2">This period</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg">
                                    <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center text-xs text-yellow-600 font-medium">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                                    Requires attention
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Approvals Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-white/20 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Pending Approvals</p>
                                    <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent">
                                        {animatedStats.pending}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-2">Awaiting action</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg">
                                    <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center text-xs text-yellow-600 font-medium">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                                    Needs review
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Charts Section with Yellow Accent Theme */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Leave Types Chart */}
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-8 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent">
                                    Leave Type Distribution
                                </h3>
                                <p className="text-gray-600 mt-1">Most frequently applied leave types</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg">
                                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={currentChartData?.leaveTypeData || []}>
                                    <defs>
                                        <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.2}/>
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
                                        dataKey="value" 
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
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent">
                                    Monthly Trends
                                </h3>
                                <p className="text-gray-600 mt-1">Leave requests throughout {currentYear}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg">
                                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={currentChartData?.monthlyData || []}>
                                    <defs>
                                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
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
                                        dataKey="leaves" 
                                        stroke="#f59e0b" 
                                        strokeWidth={3}
                                        fill="url(#areaGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Section with Yellow Accent */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-8 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent">
                                Quick Actions
                            </h3>
                            <p className="text-gray-600 mt-1">Manage your department efficiently</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button 
                            onClick={() => router.visit('/dept-head/leave-requests')}
                            className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl hover:scale-105 transition-all duration-300 group hover:border-yellow-400"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <h4 className="font-semibold text-gray-900 group-hover:text-yellow-700 transition-colors">Leave Approvals</h4>
                                    <p className="text-sm text-gray-600 mt-1">{animatedStats.pending} pending requests</p>
                                </div>
                            </div>
                        </button>

                        <button 
                            onClick={() => router.visit('/dept-head/employees')}
                            className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl hover:scale-105 transition-all duration-300 group hover:border-yellow-400"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <h4 className="font-semibold text-gray-900 group-hover:text-yellow-700 transition-colors">Team Management</h4>
                                    <p className="text-sm text-gray-600 mt-1">{animatedStats.employees} team members</p>
                                </div>
                            </div>
                        </button>

                        <button 
                            onClick={() => router.visit('/dept-head/leave-calendar')}
                            className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl hover:scale-105 transition-all duration-300 group hover:border-yellow-400"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <h4 className="font-semibold text-gray-900 group-hover:text-yellow-700 transition-colors">Leave Calendar</h4>
                                    <p className="text-sm text-gray-600 mt-1">View scheduled leaves</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </DeptHeadLayout>
    );
}