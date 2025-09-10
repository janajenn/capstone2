// resources/js/Layouts/EmployeeLayout.jsx

import { useState } from 'react';
import { Link } from '@inertiajs/react';
import NotificationDropdown from '@/Components/NotificationDropdown';
import { Bell } from 'lucide-react';
import PageTransition from '@/Components/PageTransition';

export default function EmployeeLayout({ children, user }) {
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Fixed Sidebar */}
            <div className={`transition-all duration-300 bg-white border-r flex flex-col fixed left-0 top-0 bottom-0 z-10 ${collapsed ? 'w-16' : 'w-64'}`}>
                <div className="flex items-center justify-between p-4 border-b">
                    {!collapsed && <h1 className="font-bold text-xl">Employee</h1>}
                    <button onClick={toggleSidebar}>
                        {collapsed ? '➡️' : '⬅️'}
                    </button>
                </div>

                <nav className="flex flex-col p-2 space-y-2 flex-1">
                    <Link href="/employee/dashboard" className="hover:bg-gray-200 rounded p-2">
                        🏠 {!collapsed && 'Dashboard'}
                    </Link>
                    <Link href="/employee/leave" className="hover:bg-gray-200 rounded p-2">
                        📝 {!collapsed && 'Request Leave'}
                    </Link>
                    <Link href="/employee/my-leave-requests" className="hover:bg-gray-200 rounded p-2">
                        📋 {!collapsed && 'My Requests'}
                    </Link>
                    <Link href="/employee/leave-calendar" className="hover:bg-gray-200 rounded p-2">
                        📅 {!collapsed && 'Leave Calendar'}
                    </Link>
                    <Link href="/employee/credit-conversion" className="hover:bg-gray-200 rounded p-2">
                        💰 {!collapsed && 'Credit Conversion'}
                    </Link>
                    <Link href="/employee/credit-conversions" className="hover:bg-gray-200 rounded p-2">
                        📊 {!collapsed && 'Conversion History'}
                    </Link>

                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="hover:bg-red-100 text-red-600 rounded p-2 mt-auto text-left"
                    >
                        🚪 {!collapsed && 'Logout'}
                    </Link>
                </nav>
            </div>

            {/* Scrollable Content Area */}
            <div className={`flex-1 overflow-auto ${collapsed ? 'ml-16' : 'ml-64'}`}>
                {/* Header with Notifications */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                    <div>
                        {/* <h2 className="text-xl font-semibold text-gray-800"></h2> */}
                    </div>
                    <div className="flex items-center space-x-4">
                        <NotificationDropdown />
                        <div className="text-sm text-gray-600">
                           
                        </div>
                    </div>
                </div>
                
                <PageTransition 
                    animation="fade-slide-up"
                    duration={400}
                    delay={100}
                    className="p-6"
                >
                    {children}
                </PageTransition>
            </div>
        </div>
    );
}