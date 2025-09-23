// resources/js/Layouts/HRLayout.jsx
import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import PageTransition from '@/Components/PageTransition';
import RoleSwitchButton from '@/Components/RoleSwitchButton';
import {
    HomeIcon,
    UserGroupIcon,
    CalendarIcon,
    TableCellsIcon,
    BuildingOfficeIcon,
    ExclamationTriangleIcon,
    CurrencyDollarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DocumentTextIcon,
    XMarkIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function HRLayout({ children }) {
    const { props } = usePage();
    const userRole = props.auth.role;
    
    const [collapsed, setCollapsed] = useState(false);
    const [mode, setMode] = useState("hr");

    const toggleSidebar = () => setCollapsed(!collapsed);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`transition-all duration-300 bg-gradient-to-b from-indigo-800 to-indigo-900 text-white flex flex-col ${collapsed ? 'w-16' : 'w-64'}`}>
                <div className="flex items-center justify-between p-4 border-b border-indigo-700">
                    {!collapsed && (
                        <h1 className="font-bold text-xl">
                            {mode === "hr" ? "HR PORTAL" : "EMPLOYEE MODE"}
                        </h1>
                    )}
                    <button 
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-full bg-indigo-700 hover:bg-indigo-600 transition-colors"
                    >
                        {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
                    </button>
                </div>

                <nav className="flex flex-col p-3 space-y-1 flex-1 mt-2">
                    {mode === "hr" ? (
                        <>
                            <Link 
                                href="/hr/dashboard" 
                                className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
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
                                href="/hr/employees" 
                                className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
                            >
                                <UserGroupIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Employees</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Employees
                                    </div>
                                )}
                            </Link>

                            <Link 
                                href="/hr/leave-credits" 
                                className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
                            >
                                <TableCellsIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Leave Credits</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Leave Credits
                                    </div>
                                )}
                            </Link>

                            <Link 
                                href="/hr/leave-types" 
                                className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
                            >
                                <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Leave Types</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Leave Types
                                    </div>
                                )}
                            </Link>

                            <Link 
                                href="/hr/departments" 
                                className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
                            >
                                <BuildingOfficeIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Departments</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Departments
                                    </div>
                                )}
                            </Link>

                            <Link 
                                href="/hr/leave-requests" 
                                className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
                            >
                                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Leave Requests</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Leave Requests
                                    </div>
                                )}
                            </Link>

                            <Link 
                                href="/hr/recall-requests" 
                                className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
                            >
                                <ArrowPathIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Recall Requests</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Recall Requests
                                    </div>
                                )}
                            </Link>

                            <Link 
                                href="/hr/credit-conversions" 
                                className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
                            >
                                <CurrencyDollarIcon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span className="ml-3">Credit Conversions</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        Credit Conversions
                                    </div>
                                )}
                            </Link>

                            <Link 
                                href="/hr/leave-calendar" 
                                className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
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
                                className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
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
                                className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
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
                                className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
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
                                className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
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
                    {(userRole === "hr" || userRole === "admin" || userRole === "dept_head") && (
                        <RoleSwitchButton collapsed={collapsed} currentMode={mode} />
                    )}

                    {/* Logout */}
                    <div className="mt-auto pt-3 border-t border-indigo-700">
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="flex items-center w-full p-3 rounded-lg hover:bg-red-600/20 text-red-100 hover:text-white transition-all duration-200 group"
                        >
                            <XMarkIcon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && <span className="ml-3">Logout</span>}
                            {collapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                    Logout
                                </div>
                            )}
                        </Link>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm z-10">
                    <div className="flex items-center justify-between px-6 py-3">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Welcome, {props.auth.user.name}
                        </h2>
                        <div className="flex items-center space-x-4">
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
                                {mode === "hr" ? "HR Mode" : "Employee Mode"}
                            </span>
                        </div>
                    </div>
                </header>
                
                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    <PageTransition animation="fade-slide-up" duration={400} delay={100} className="p-6">
                        {children}
                    </PageTransition>
                </main>
            </div>
        </div>
    );
}