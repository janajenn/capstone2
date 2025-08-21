import HRLayout from '@/Layouts/HRLayout';
import { usePage, router } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import Swal from 'sweetalert2';

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

export default function Dashboard() {
    const { props } = usePage();
    const { pendingCount, recentRequests, requestsByStatus } = props;

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
            // Create a simple notification sound using Web Audio API
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
                // Use Inertia's router to fetch data without full page reload
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
                                    const employeeName = `${latestRequest.employee?.first_name} ${latestRequest.employee?.last_name}`;
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

                        // Update previous data
                        setPreviousData({
                            pendingCount: newData.pendingCount,
                            recentRequests: newData.recentRequests,
                            requestsByStatus: newData.requestsByStatus
                        });

                        // Mark that first load is complete
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
        }, 10000); // every 10 seconds

        return () => clearInterval(interval); // cleanup
    }, [previousData]);

    // Handle page visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && !isFirstLoad.current) {
                // Page became visible, refresh data immediately
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

    return (
        <HRLayout>
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">HR Dashboard</h1>
                        <p className="text-gray-600">Welcome to the HR panel.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {notificationPermission === 'default' && (
                            <button
                                onClick={requestNotificationPermission}
                                className="ml-2 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Enable Notifications
                            </button>
                        )}
                        {notificationPermission === 'granted' && (
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                ✓ Notifications Enabled
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                            <p className="text-2xl font-semibold text-gray-900">{pendingCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Approved</p>
                            <p className="text-2xl font-semibold text-gray-900">{requestsByStatus?.approved || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-red-100 text-red-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Rejected</p>
                            <p className="text-2xl font-semibold text-gray-900">{requestsByStatus?.rejected || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Requests</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {(requestsByStatus?.pending || 0) + (requestsByStatus?.approved || 0) + (requestsByStatus?.rejected || 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Leave Requests */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Leave Requests</h2>
                        <button
                            onClick={() => router.visit('/hr/leave-requests')}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            View All
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Leave Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dates
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Submitted
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentRequests && recentRequests.length > 0 ? (
                                recentRequests.map((request) => (
                                    <tr key={request.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {request.employee?.first_name} {request.employee?.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {request.employee?.department?.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{request.leave_type?.name}</div>
                                            <div className="text-sm text-gray-500">{request.leave_type?.code}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(request.date_from)} - {formatDate(request.date_to)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(request.created_at)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                        No leave requests found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </HRLayout>
    );
}
