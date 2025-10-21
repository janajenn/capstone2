import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const audioRef = useRef(null);

    // Fetch notifications and unread count
    const fetchNotifications = async () => {
        try {
            const response = await fetch('/employee/notifications', {
                credentials: 'include',
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Fetch notifications error:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Fetched notifications:', data);
            setNotifications(data.notifications);
            setUnreadCount(data.unread_count);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Fetch only unread count
    const fetchUnreadCount = async () => {
        try {
            const response = await fetch('/employee/notifications/unread-count', {
                credentials: 'include',
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Fetch unread count error:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            if (data.unread_count !== unreadCount) {
                console.log('Unread count updated:', { from: unreadCount, to: data.unread_count });
                setUnreadCount(data.unread_count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (!csrfToken) {
                console.error('CSRF token not found');
                return;
            }

            const response = await fetch(`/employee/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            
            if (response.status === 419) {
                window.location.reload();
                return;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success) {
                setUnreadCount(data.unread_count);
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === notificationId 
                            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
                            : notif
                    )
                );
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            if (error.message.includes('419')) {
                window.location.reload();
            }
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (!csrfToken) {
                console.error('CSRF token not found');
                return;
            }

            const response = await fetch('/employee/notifications/read-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                credentials: 'include',
            });
            
            console.log('Mark all read response status:', response.status);
            
            if (response.status === 419) {
                console.log('Session expired, reloading page...');
                window.location.reload();
                return;
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            if (data.success) {
                setUnreadCount(0);
                setNotifications(prev => 
                    prev.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
                );
                setPreviousUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            
            if (error.message.includes('419')) {
                window.location.reload();
            }
        }
    };

    // Play notification sound only when count increases
    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => {
                console.log('Audio play failed:', e);
                // Fallback: create a simple beep sound using Web Audio API
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
                    
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.2);
                } catch (fallbackError) {
                    console.log('Fallback audio also failed:', fallbackError);
                }
            });
        }
    };

    // Check for new notifications periodically
    useEffect(() => {
        fetchUnreadCount();
        
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Play sound only when unread count increases (not decreases)
    useEffect(() => {
        if (unreadCount > previousUnreadCount && previousUnreadCount !== 0) {
            playNotificationSound();
        }
        setPreviousUnreadCount(unreadCount);
    }, [unreadCount, previousUnreadCount]);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'leave_request':
                return '📅';
            case 'credit_conversion':
                return '💰';
            default:
                return '🔔';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Bell className="w-6 h-6" />
                
                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Audio element for notification sound */}
            <audio ref={audioRef} preload="auto">
                <source src="/sounds/mixkit-bell-notification-933.wav" type="audio/wav" />
            </audio>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        <div className="flex items-center space-x-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Mark all as read
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    console.log('Current state:', { unreadCount, previousUnreadCount, notifications });
                                    fetch('/employee/debug-notifications', {
                                        credentials: 'include'
                                    })
                                        .then(res => res.json())
                                        .then(data => console.log('Debug data:', data))
                                        .catch(err => console.error('Debug error:', err));
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700"
                                title="Debug notifications"
                            >
                                🐛
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await fetch('/employee/test-csrf', {
                                            credentials: 'include'
                                        });
                                        const data = await response.json();
                                        console.log('CSRF Test:', data);
                                    } catch (error) {
                                        console.error('CSRF Test Error:', error);
                                    }
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700"
                                title="Test CSRF"
                            >
                                🔒
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                                <div className="text-4xl mb-2">🔔</div>
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                                        !notification.is_read ? 'bg-blue-50' : ''
                                    }`}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="text-2xl">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className={`text-sm font-medium ${
                                                    !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                                                }`}>
                                                    {notification.title}
                                                </h4>
                                                <span className="text-xs text-gray-500">
                                                    {formatTime(notification.created_at)}
                                                </span>
                                            </div>
                                            <p className={`text-sm mt-1 ${
                                                !notification.is_read ? 'text-gray-800' : 'text-gray-600'
                                            }`}>
                                                {notification.message}
                                            </p>
                                            {!notification.is_read && (
                                                <div className="mt-2">
                                                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                                    <span className="text-xs text-blue-600 ml-2">New</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-200 text-center">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}