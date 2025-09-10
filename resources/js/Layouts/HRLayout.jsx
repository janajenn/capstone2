import { useState } from "react";
import { Link } from "@inertiajs/react";
import PageTransition from "@/Components/PageTransition";

export default function HRLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Fixed Sidebar */}
            <div
                className={`fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out bg-gradient-to-b from-indigo-800 to-indigo-900 text-white ${
                    collapsed ? "w-16" : "w-64"
                } z-50`}
            >
                <div className="flex items-center justify-between p-4 border-b border-indigo-700">
                    {!collapsed && (
                        <h1 className="font-bold text-xl tracking-tight">HR Portal</h1>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-full bg-indigo-700 hover:bg-indigo-600 transition-colors"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                </div>

                <nav className="flex flex-col p-3 space-y-1 mt-2">
                    <Link
                        href="/hr/dashboard"
                        className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                        </svg>
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                        </svg>
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {!collapsed && <span className="ml-3">Leave Requests</span>}
                        {collapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                Leave Requests
                            </div>
                        )}
                    </Link>

                    <Link
                        href="/hr/credit-conversions"
                        className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092c.938-.177 1.791-.604 2.353-1.253a1 1 0 10-1.51-1.31c.163.187.452.377.843.504v-1.941c-.622-.117-1.196-.342-1.676-.662C9.398 10.235 9 9.99 9 8c0-.99.398-1.765 1.324-2.246.48-.32 1.054-.545 1.676-.662V7z" clipRule="evenodd" />
                        </svg>
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        {!collapsed && <span className="ml-3">Leave Calendar</span>}
                        {collapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                Leave Calendar
                            </div>
                        )}
                    </Link>

                    <Link
                        href="/leave-form-demo"
                        className="flex items-center p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" clipRule="evenodd" />
                        </svg>
                        {!collapsed && <span className="ml-3">Leave Form Demo</span>}
                        {collapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                Leave Form Demo
                            </div>
                        )}
                    </Link>

                </nav>

                {/* Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-indigo-700">
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex items-center w-full p-3 rounded-lg hover:bg-red-600/20 text-red-100 hover:text-white transition-all duration-200 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                        </svg>
                        {!collapsed && <span className="ml-3">Logout</span>}
                        {collapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                Logout
                            </div>
                        )}
                    </Link>
                </div>
            </div>

            {/* Main content with proper spacing */}
            <div
                className={`flex-1 transition-all duration-300 ease-in-out ${
                    collapsed ? "ml-16" : "ml-64"
                } min-h-screen overflow-auto`}
            >
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
