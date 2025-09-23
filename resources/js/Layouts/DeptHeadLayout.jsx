// resources/js/Layouts/DeptHeadLayout.jsx
import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import PageTransition from '@/Components/PageTransition';
import RoleSwitchButton from '@/Components/RoleSwitchButton';
import {
    HomeIcon,
    DocumentTextIcon,
    UserGroupIcon,
    ChartBarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon,
    ArrowPathIcon,
    CalendarIcon,
    CurrencyDollarIcon // Added CurrencyDollarIcon for employee mode
} from '@heroicons/react/24/outline';

export default function DeptHeadLayout({ children }) {
    const { props } = usePage();
    const userRole = props.auth.role;
    
    const [collapsed, setCollapsed] = useState(false);
    const [mode, setMode] = useState("dept_head");

    const toggleSidebar = () => setCollapsed(!collapsed);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Fixed Sidebar */}
            <div className={`fixed inset-y-0 left-0 transition-all duration-300 bg-white shadow-lg flex flex-col z-50 ${collapsed ? 'w-16' : 'w-64'}`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    {!collapsed && (
                        <h1 className="font-bold text-xl text-blue-800">
                            {mode === "dept_head" ? "DEPARTMENT HEAD" : "EMPLOYEE MODE"}
                        </h1>
                    )}
                    <button 
                        onClick={toggleSidebar}
                        className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    >
                        {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
                    </button>
                </div>

                <nav className="flex flex-col p-3 space-y-1 flex-1 overflow-y-auto">
                    {mode === "dept_head" ? (
                        <>
                            <Link 
                                href="/dept-head/dashboard" 
                                className="flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600 group"
                            >
                                <HomeIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Dashboard</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Dashboard
                                    </div>
                                )}
                            </Link>
                            <Link 
                                href="/dept-head/leave-requests" 
                                className="flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600 group"
                            >
                                <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Leave Approvals</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Leave Approvals
                                    </div>
                                )}
                            </Link>
                            <Link 
                                href="/dept-head/employees" 
                                className="flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600 group"
                            >
                                <UserGroupIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Team Management</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Team Management
                                    </div>
                                )}
                            </Link>
                            <Link 
                                href="/dept-head/leave-calendar" 
                                className="flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600 group"
                            >
                                <CalendarIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Leave Calendar</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Leave Calendar
                                    </div>
                                )}
                            </Link>
                            <Link 
                                href="/dept-head/reports" 
                                className="flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600 group"
                            >
                                <ChartBarIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Reports</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Reports
                                    </div>
                                )}
                            </Link>
                            <Link 
                                href="/dept-head/recall-requests" 
                                className="flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600 group"
                            >
                                <ArrowPathIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Recall Requests</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Recall Requests
                                    </div>
                                )}
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link 
                                href="/employee/dashboard" 
                                className="flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600 group"
                            >
                                <HomeIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Dashboard</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Dashboard
                                    </div>
                                )}
                            </Link>
                            <Link 
                                href="/employee/my-leave-requests" 
                                className="flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600 group"
                            >
                                <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">My Leave Requests</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        My Leave Requests
                                    </div>
                                )}
                            </Link>
                            <Link 
                                href="/employee/leave-calendar" 
                                className="flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600 group"
                            >
                                <CalendarIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Leave Calendar</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Leave Calendar
                                    </div>
                                )}
                            </Link>
                            <Link 
                                href="/employee/credit-conversion" 
                                className="flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600 group"
                            >
                                <CurrencyDollarIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Credit Conversion</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Credit Conversion
                                    </div>
                                )}
                            </Link>
                        </>
                    )}

                    {/* Role Switch Button */}
                    {(userRole === "dept_head" || userRole === "hr" || userRole === "admin") && (
                        <RoleSwitchButton collapsed={collapsed} currentMode={mode} />
                    )}

                    {/* Logout */}
                    <div className="mt-auto pt-3 border-t border-gray-100">
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-red-50 text-red-600 hover:text-red-700 group"
                        >
                            <XMarkIcon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && <span className="ml-3">Logout</span>}
                            {collapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                    Logout
                                </div>
                            )}
                        </Link>
                    </div>
                </nav>
            </div>

            {/* Main Content - Adjusted for fixed sidebar */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
                {/* Header */}
                <header className="bg-white shadow-sm z-10 sticky top-0">
                    <div className="flex items-center justify-between px-6 py-3">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Welcome, {props.auth.user.name}
                        </h2>
                        <div className="flex items-center space-x-4">
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                {mode === "dept_head" ? "Department Head" : "Employee Mode"}
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