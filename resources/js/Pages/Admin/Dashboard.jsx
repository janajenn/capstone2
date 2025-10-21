import AdminLayout from '@/Layouts/AdminLayout';
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
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';

const getStatusColor = (status) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function AdminDashboard() {
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
        totalUsers,
        totalHRUsers,
        activeEmployees,
        inactiveEmployees
    } = props;

    // State to track previous data for comparison
    const [previousData, setPreviousData] = useState({
        pendingCount: pendingCount,
        recentRequests: recentRequests || [],
        requestsByStatus: requestsByStatus || {}
    });

    // Ref to track if this is the first load
    const isFirstLoad = useRef(true);

    // State to track polling status
    const [isPolling, setIsPolling] = useState(false);

    // State to track notification permission
    const [notificationPermission, setNotificationPermission] = useState(
        'Notification' in window ? Notification.permission : 'denied'
    );

    // Function to play notification sound
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

    // Function to show browser notification
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

    // Function to request notification permission
    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
        }
    };

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                setIsPolling(true);
                router.reload({
                    only: ['pendingCount', 'recentRequests', 'requestsByStatus'],
                    preserveScroll: true,
                    onSuccess: (page) => {
                        const newData = page.props;

                        if (!isFirstLoad.current) {
                            const newPendingCount = newData.pendingCount || 0;
                            const previousPendingCount = previousData.pendingCount || 0;

                            if (newPendingCount > previousPendingCount) {
                                const newRequestsCount = newPendingCount - previousPendingCount;

                                playNotificationSound();

                                if (document.hidden) {
                                    showBrowserNotification(
                                        `${newRequestsCount} new leave request${newRequestsCount > 1 ? 's' : ''} received!`,
                                        'Click to view details'
                                    );
                                }

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
                                            router.visit('/admin/leave-requests');
                                        });
                                    }
                                });
                            }

                            const newRecentRequests = newData.recentRequests || [];
                            const previousRecentRequests = previousData.recentRequests || [];

                            if (newRecentRequests.length > previousRecentRequests.length) {
                                const newRequests = newRecentRequests.slice(0, newRecentRequests.length - previousRecentRequests.length);

                                if (newRequests.length > 0) {
                                    const latestRequest = newRequests[0];
                                    const employeeName = `${latestRequest.employee?.firstname} ${latestRequest.employee?.middlename} ${latestRequest.employee?.lastname}`;
                                    const leaveType = latestRequest.leave_type?.name;

                                    playNotificationSound();

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
                                                router.visit('/admin/leave-requests');
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
                    onFinish: () => {
                        setIsPolling(false);
                    }
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setIsPolling(false);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [previousData]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && !isFirstLoad.current) {
                setIsPolling(true);
                router.reload({
                    only: ['pendingCount', 'recentRequests', 'requestsByStatus'],
                    preserveScroll: true,
                    onFinish: () => setIsPolling(false)
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Chart colors
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];


    

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50 p-6">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Admin Analytics Dashboard</h1>
                            <p className="text-gray-600 mt-1">Comprehensive system overview and analytics for administrators</p>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center space-x-2">
                            {notificationPermission === 'default' && (
                                <button
                                    onClick={requestNotificationPermission}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-md hover:shadow-lg"
                                >
                                    <div className="p-1 rounded-lg bg-green-500 mr-2">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5L19.5 4.5" />
                                        </svg>
                                    </div>
                                    Enable Notifications
                                </button>
                            )}
                            {notificationPermission === 'granted' && (
                                <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                                    ✓ Notifications Enabled
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                
{/* Filter Section */}
<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 md:mb-0">Filter Reports</h3>
        <div className="flex flex-col sm:flex-row gap-4">
            {/* Year Filter */}
            <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Year:</label>
                <select 
                    value={props.currentYear || new Date().getFullYear()}
                    onChange={(e) => {
                        const year = e.target.value;
                        router.get(route('admin.dashboard'), { 
                            year: year,
                            month: props.currentMonth 
                        }, {
                            preserveState: true,
                            preserveScroll: true
                        });
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {props.availableYears?.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Month:</label>
                <select 
                    value={props.currentMonth || ''}
                    onChange={(e) => {
                        const month = e.target.value;
                        router.get(route('admin.dashboard'), { 
                            year: props.currentYear,
                            month: month 
                        }, {
                            preserveState: true,
                            preserveScroll: true
                        });
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">All Months</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                </select>
            </div>

            {/* Reset Filter Button */}
            <button
                onClick={() => {
                    router.get(route('admin.dashboard'), {}, {
                        preserveState: true,
                        preserveScroll: true
                    });
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
                Reset Filters
            </button>
        </div>
    </div>
    
    {/* Active Filter Display */}
    {(props.currentYear || props.currentMonth) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
                <strong>Active Filters:</strong> 
                {props.currentYear && ` Year: ${props.currentYear}`}
                {props.currentMonth && ` | Month: ${new Date(2000, props.currentMonth - 1).toLocaleString('default', { month: 'long' })}`}
            </p>
        </div>
    )}
</div>



{/* Stats Cards - Enhanced for Admin */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    {/* Total Employees Card - Clickable */}
    <div 
        onClick={() => router.visit(route('admin.employees.index'))}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300"
    >
        <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-50">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </div>
            <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{totalEmployees || 0}</h2>
                <p className="text-sm text-gray-600">Total Employees</p>
            </div>
        </div>
    </div>
    
    {/* Active Employees Card - Clickable */}
    <div 
        onClick={() => router.visit(route('admin.employees.active'))}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-green-300"
    >
        <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-50">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5a2 2 0 012-2h2a2 2 0 012 2v1H9V5zm0 4a2 2 0 012-2h2a2 2 0 012 2v5a2 2 0 01-2 2h-2a2 2 0 01-2-2V9z" />
                </svg>
            </div>
            <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{activeEmployees || 0}</h2>
                <p className="text-sm text-gray-600">Active Employees</p>
            </div>
        </div>
    </div>
    
    {/* Inactive Employees Card - Clickable */}
    <div 
        onClick={() => router.visit(route('admin.employees.inactive'))}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-red-300"
    >
        <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-50">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{inactiveEmployees || 0}</h2>
                <p className="text-sm text-gray-600">Inactive Employees</p>
            </div>
        </div>
    </div>
    
    {/* System Users Card - Clickable */}
    <div 
        onClick={() => router.visit(route('admin.users.index'))}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-purple-300"
    >
        <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-50">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </div>
            <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{totalUsers || 0}</h2>
                <p className="text-sm text-gray-600">System Users</p>
            </div>
        </div>
    </div>
</div>

{/* Second Row of Stats Cards */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    {/* Fully Approved Requests Card - Clickable */}
    <div 
       onClick={() => {
        try {
            router.visit(route('admin.leave-requests.fully-approved'));
        } catch (error) {
            console.error('Route error:', error);
            // Fallback to direct URL
            router.visit('/admin/leave-requests/fully-approved');
        }
    }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-emerald-300"
    >
        <div className="flex items-center">
            <div className="p-3 rounded-lg bg-emerald-50">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{fullyApprovedRequests || 0}</h2>
                <p className="text-sm text-gray-600">Fully Approved Requests</p>
            </div>
        </div>
    </div>
    
    {/* Rejected Requests Card - Clickable */}
    <div 
        onClick={() => router.visit(route('admin.leave-requests.rejected'))}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-red-300"
    >
        <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-50">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{rejectedRequests || 0}</h2>
                <p className="text-sm text-gray-600">Rejected Requests</p>
            </div>
        </div>
    </div>
    
    {/* Total Departments Card - Clickable */}
    <div 
        onClick={() => router.visit(route('admin.departments.index'))}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-green-300"
    >
        <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-50">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            </div>
            <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{totalDepartments || 0}</h2>
                <p className="text-sm text-gray-600">Total Departments</p>
            </div>
        </div>
    </div>
    
    {/* HR Users Card - Clickable */}
    <div 
        onClick={() => router.visit(route('admin.users.hr'))}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-orange-300"
    >
        <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-50">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
            </div>
            <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{totalHRUsers || 0}</h2>
                <p className="text-sm text-gray-600">HR Users</p>
            </div>
        </div>
    </div>
</div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Leave Types Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4">
        <div>
            <h3 className="text-lg font-semibold text-gray-800">
                Most Applied Leave Types
                {(props.currentYear || props.currentMonth) && (
                    <span className="text-sm text-gray-500 ml-2">
                        ({props.currentYear || 'All Years'}{props.currentMonth ? ` - ${new Date(2000, props.currentMonth - 1).toLocaleString('default', { month: 'long' })}` : ''})
                    </span>
                )}
            </h3>
            </div>
                            <div className="p-2 rounded-lg bg-blue-50">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={leaveTypeStats || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#3B82F6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Monthly Trends Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4">
        <div>
            <h3 className="text-lg font-semibold text-gray-800">
                {props.currentMonth ? 'Daily Trends' : 'Monthly Trends'}
                {props.currentYear && (
                    <span className="text-sm text-gray-500 ml-2">
                        ({props.currentYear})
                    </span>
                )}
            </h3>
        </div>
                            <div className="p-2 rounded-lg bg-green-50">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyStats || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Department Comparison Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
    <div className="flex items-center justify-between mb-4">
        <div>
            <h3 className="text-lg font-semibold text-gray-800">
                Leave Requests by Department
                {(props.currentYear || props.currentMonth) && (
                    <span className="text-sm text-gray-500 ml-2">
                        ({props.currentYear || 'All Years'}{props.currentMonth ? ` - ${new Date(2000, props.currentMonth - 1).toLocaleString('default', { month: 'long' })}` : ''})
                    </span>
                )}
            </h3>
        </div>
                        <div className="p-2 rounded-lg bg-purple-50">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={departmentStats || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8B5CF6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

              
            </div>
        </AdminLayout>
    );
}