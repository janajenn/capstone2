// resources/js/Layouts/AdminLayout.jsx
import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import PageTransition from '@/Components/PageTransition';
import RoleSwitchButton from '@/Components/RoleSwitchButton';
import AdminNotificationDropdown from '@/Components/AdminNotificationDropdown';
import Swal from 'sweetalert2';
import {
    HomeIcon,
    UserGroupIcon,
    ChatBubbleLeftRightIcon,
    Cog6ToothIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    UserIcon,
    CalendarIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function AdminLayout({ children }) {
    const { props } = usePage();
    const userRole = props.auth.role;
    
    const [collapsed, setCollapsed] = useState(false);
    const [mode, setMode] = useState("admin");

    const toggleSidebar = () => setCollapsed(!collapsed);

    const handleLogout = () => {
        Swal.fire({
            title: 'Confirm Logout',
            text: "Are you sure you want to log out of your admin account?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Logout',
            cancelButtonText: 'Cancel',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-xl shadow-2xl',
                title: 'text-xl font-semibold text-gray-800',
                htmlContainer: 'text-gray-600',
                confirmButton: 'px-6 py-2 rounded-lg font-medium',
                cancelButton: 'px-6 py-2 rounded-lg font-medium border border-gray-300'
            },
            buttonsStyling: false,
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                router.post('/logout');
            }
        });
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Fixed Sidebar */}
            <div className={`fixed inset-y-0 left-0 transition-all duration-300 bg-gradient-to-b from-gray-800 to-gray-900 text-white flex flex-col z-50 ${collapsed ? 'w-16' : 'w-64'}`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    {!collapsed && (
                        <h1 className="font-bold text-xl">
                            {mode === "admin" ? "ADMIN PORTAL" : "EMPLOYEE MODE"}
                        </h1>
                    )}
                    <button 
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                    >
                        {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
                    </button>
                </div>

                <nav className="flex flex-col p-3 space-y-1 flex-1 mt-2 overflow-y-auto">
                    {mode === "admin" ? (
                        <>
                            <Link 
                                href="/admin/dashboard" 
                                className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-all duration-200 group"
                            >
                                <HomeIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Dashboard</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Dashboard
                                    </div>
                                )}
                            </Link>

                            <Link 
                                href="/admin/leave-requests" 
                                className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-all duration-200 group"
                            >
                                <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Leave Requests</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Leave Requests
                                    </div>
                                )}
                            </Link>
                            
                            <Link 
                                href="/admin/delegation" 
                                className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-all duration-200 group"
                            >
                                <UserIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Delegate Approver</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Delegate Approver
                                    </div>
                                )}
                            </Link>

                            <Link 
                                href="/admin/leave-calendar" 
                                className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-all duration-200 group"
                            >
                                <CalendarIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Leave Calendar</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Leave Calendar
                                    </div>
                                )}
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link 
                                href="/employee/dashboard" 
                                className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-all duration-200 group"
                            >
                                <HomeIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Dashboard</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Dashboard
                                    </div>
                                )}
                            </Link>
                            <Link 
                                href="/employee/my-leave-requests" 
                                className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-all duration-200 group"
                            >
                                <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">My Leave Requests</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        My Leave Requests
                                    </div>
                                )}
                            </Link>

                            <Link 
                                href="/employee/leave-calendar" 
                                className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-all duration-200 group"
                            >
                                <CalendarIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Leave Calendar</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Leave Calendar
                                    </div>
                                )}
                            </Link>
                            <Link 
                                href="/employee/credit-conversion" 
                                className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-all duration-200 group"
                            >
                                <CurrencyDollarIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Credit Conversion</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Credit Conversion
                                    </div>
                                )}
                            </Link>
                        </>
                    )}

                    {/* Role Switch Button */}
                    {(userRole === "admin" || userRole === "hr" || userRole === "dept_head") && (
                        <RoleSwitchButton collapsed={collapsed} currentMode={mode} />
                    )}

                    {/* Logout */}
                    <div className="mt-auto pt-3 border-t border-gray-700">
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full p-3 rounded-lg hover:bg-red-600/20 text-red-100 hover:text-white transition-all duration-200 group"
                        >
                            <XMarkIcon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && <span className="ml-3">Logout</span>}
                            {collapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-red-600 text-white rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                    Logout
                                </div>
                            )}
                        </button>
                    </div>
                </nav>
            </div>

            {/* Main Content - Adjusted for fixed sidebar */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
                {/* Header */}
                <header className="bg-white shadow-sm z-10 sticky top-0">
                    <div className="flex items-center justify-between px-6 py-3">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Welcome, {props.auth.user.name}
                            </h2>
                            <p className="text-sm text-gray-500">Admin Dashboard</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <AdminNotificationDropdown />
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">
                                {mode === "admin" ? "Admin Mode" : "Employee Mode"}
                            </span>
                        </div>
                    </div>
                </header>
                
                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6">
                    <PageTransition animation="fade-slide-up" duration={400} delay={100}>
                        {children}
                    </PageTransition>
                </main>
            </div>
        </div>
    );
}