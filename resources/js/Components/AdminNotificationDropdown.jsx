// resources/js/Components/AdminNotificationDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function AdminNotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const audioRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/admin/notifications', {
                credentials: 'same-origin',
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            setNotifications(data.notifications);
            setUnreadCount(data.unread_count);
        } catch (error) {
            console.error('Error fetching Admin notifications:', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await fetch('/admin/notifications/unread-count', {
                credentials: 'same-origin',
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            if (data.unread_count !== unreadCount) {
                setUnreadCount(data.unread_count);
            }
        } catch (error) {
            console.error('Error fetching Admin unread count:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            // Close dropdown first
            setIsOpen(false);
    
            // Mark as read via API (optional - you can also rely on the redirect endpoint to mark as read)
            if (!notification.is_read) {
                await markAsRead(notification.id);
            }
    
            // Use Inertia to handle the redirect via the new click route
            router.visit(`/admin/notifications/${notification.id}/click`);
            
        } catch (error) {
            console.error('Error handling notification click:', error);
            
            // Fallback: try to redirect directly if the click route fails
            if (notification.redirect_url) {
                router.visit(notification.redirect_url);
            }
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch(`/admin/notifications/${notificationId}/mark-read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
            });
            
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
                setPreviousUnreadCount(data.unread_count);
            }
        } catch (error) {
            console.error('Error marking Admin notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/admin/notifications/mark-all-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
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
            console.error('Error marking all Admin notifications as read:', error);
        }
    };

    // ... keep existing useEffect hooks and helper functions ...

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
            case 'leave_request_submission':
                return '📥';
            case 'leave_request':
                return '📅';
            case 'dept_head_request':
                return '👨‍💼';
            case 'leave_recall':
                return '↩️';
            case 'credit_conversion':
                return '💰';
            case 'attendance_correction':
                return '⏰';
            default:
                return '🔔';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Bell className="w-6 h-6" />
                
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <audio ref={audioRef} preload="auto">
                <source src="/sounds/mixkit-bell-notification-933.wav" type="audio/wav" />
            </audio>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Admin Notifications</h3>
                        <div className="flex items-center space-x-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    </div>

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
                                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group ${
                                        !notification.is_read ? 'bg-blue-50' : ''
                                    }`}
                                    onClick={() => handleNotificationClick(notification)}
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
                                            {/* Redirect hint */}
                                            <div className="mt-1 flex items-center text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span>Click to view →</span>
                                            </div>
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