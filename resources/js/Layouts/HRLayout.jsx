// resources/js/Layouts/HRLayout.jsx
import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import PageTransition from '@/Components/PageTransition';
import RoleSwitchButton from '@/Components/RoleSwitchButton';
import HRNotificationDropdown from '@/Components/HRNotificationDropdown';
import Swal from 'sweetalert2';
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
    ArrowPathIcon,
    ClipboardDocumentListIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function HRLayout({ children }) {
    const { props, url } = usePage();
    const userRole = props.auth.role;
    
    const [collapsed, setCollapsed] = useState(false);
    const [mode, setMode] = useState("hr");

    const toggleSidebar = () => setCollapsed(!collapsed);

    const isActiveLink = (href) => {
        return url.startsWith(href);
    };

    const handleLogout = () => {
        Swal.fire({
            title: 'Confirm Logout',
            text: "Are you sure you want to log out of your HR account?",
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

    const hrNavigation = [
        { href: '/hr/dashboard', label: 'Dashboard', icon: HomeIcon },
        { href: '/hr/employees', label: 'Employees', icon: UserGroupIcon },
        { href: '/hr/leave-credits', label: 'Leave Credits', icon: TableCellsIcon },
        { href: '/hr/leave-types', label: 'Leave Types', icon: DocumentTextIcon },
        { href: '/hr/departments', label: 'Departments', icon: BuildingOfficeIcon },
        { href: '/hr/leave-requests', label: 'Leave Requests', icon: ExclamationTriangleIcon },
        { href: '/hr/credit-conversions', label: 'Leave Credits Monetization', icon: CurrencyDollarIcon },
        { href: '/hr/leave-calendar', label: 'Leave Calendar', icon: CalendarIcon },
        { href: '/hr/leave-recordings', label: 'Leave Recordings', icon: ClipboardDocumentListIcon },
        { href: '/hr/attendance/logs', label: 'Attendance Logs', icon: CalendarIcon },
    ];

    const employeeNavigation = [
        { href: '/employee/dashboard', label: 'Dashboard', icon: HomeIcon },
        { href: '/employee/my-leave-requests', label: 'My Leave Requests', icon: DocumentTextIcon },
        { href: '/employee/leave-calendar', label: 'Leave Calendar', icon: CalendarIcon },
        { href: '/employee/credit-conversion', label: 'Credit Conversion', icon: CurrencyDollarIcon },
        { href: '/employee/attendance-logs', label: 'Attendance Logs', icon: CalendarIcon },
    ];

    const currentNavigation = mode === "hr" ? hrNavigation : employeeNavigation;

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Modern HR Sidebar */}
            <div className={`fixed inset-y-0 left-0 transition-all duration-300 flex flex-col z-50 ${
                collapsed ? 'w-20' : 'w-72'
            }`}>
                {/* Sidebar with sophisticated blue-gray background */}
                <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-800 via-slate-700 to-slate-900 border-r border-slate-600 shadow-2xl">
                    
                    {/* Header Section */}
                    <div className="p-5 border-b border-slate-600">
                        <div className={`flex items-center justify-between transition-all duration-300 ${
                            collapsed ? 'flex-col space-y-3' : 'space-x-3'
                        }`}>
                            {!collapsed ? (
                                <>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <BuildingOfficeIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h1 className="font-bold text-base text-white truncate">
                                                {mode === "hr" ? "HR Portal" : "Employee"}
                                            </h1>
                                            <p className="text-xs text-slate-300 truncate mt-0.5">
                                                Human Resources
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={toggleSidebar}
                                        className="p-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 transition-all duration-200 group"
                                    >
                                        <ChevronLeftIcon className="h-4 w-4 text-slate-300 group-hover:text-white" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <BuildingOfficeIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <button 
                                        onClick={toggleSidebar}
                                        className="p-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 transition-all duration-200 group"
                                    >
                                        <ChevronRightIcon className="h-4 w-4 text-slate-300 group-hover:text-white" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                        {currentNavigation.map((item) => {
                            const IconComponent = item.icon;
                            const isActive = isActiveLink(item.href);
                            
                            return (
                                <Link 
                                    key={item.href}
                                    href={item.href} 
                                    className={`flex items-center p-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                                        isActive 
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' 
                                            : 'text-slate-300 hover:bg-slate-600 hover:text-white'
                                    }`}
                                >
                                    {/* Active indicator */}
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full"></div>
                                    )}
                                    
                                    <div className={`relative flex items-center ${
                                        collapsed ? 'justify-center' : 'space-x-3'
                                    }`}>
                                        <div className={`p-1.5 rounded-md transition-all duration-200 ${
                                            isActive 
                                                ? 'bg-white/20' 
                                                : 'bg-slate-600 group-hover:bg-slate-500'
                                        }`}>
                                            <IconComponent className={`h-4 w-4 ${
                                                isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                                            }`} />
                                        </div>
                                        
                                        {!collapsed && (
                                            <span className={`text-sm font-normal transition-all duration-200 ${
                                                isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                                            }`}>
                                                {item.label}
                                            </span>
                                        )}
                                    </div>

                                    {/* Tooltip for collapsed state */}
                                    {collapsed && (
                                        <div className="absolute left-full ml-2 px-2 py-1.5 bg-slate-800 text-white rounded-md text-xs font-normal whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl z-50 border border-slate-600">
                                            {item.label}
                                            {/* Tooltip arrow */}
                                            <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-3 border-transparent border-r-slate-800"></div>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}

                        {/* Role Switch Button */}
                        {(userRole === "hr" || userRole === "admin" || userRole === "dept_head") && (
                            <div className="pt-3 mt-3 border-t border-slate-600">
                                <RoleSwitchButton 
                                    collapsed={collapsed} 
                                    currentMode={mode} 
                                    modernDesign={true}
                                    colorScheme="slate"
                                />
                            </div>
                        )}
                    </nav>

                    {/* Footer Section - Made more compact */}
                    <div className="p-3 border-t border-slate-600">
                        
                        {/* Logout Button - More compact */}
                        <button
                            onClick={handleLogout}
                            className={`flex items-center w-full p-2 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                                collapsed ? 'justify-center' : ''
                            } bg-red-600/80 hover:bg-red-600 text-white border border-red-500/30 hover:border-red-400`}
                        >
                            <XMarkIcon className="h-4 w-4 flex-shrink-0" />
                            {!collapsed && (
                                <span className="ml-2 text-sm font-medium">Logout</span>
                            )}
                            {collapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1.5 bg-slate-800 text-white rounded-md text-xs font-normal whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl z-50 border border-slate-600">
                                    Logout
                                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-3 border-transparent border-r-slate-800"></div>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
                collapsed ? 'ml-20' : 'ml-72'
            }`}>
                {/* Modern Header */}
                <header className="bg-white border-b border-gray-200 shadow-sm z-10 sticky top-0">
                    <div className="flex items-center justify-between px-6 py-3">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                {getHRPageTitle(url)}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {getHRPageSubtitle(url, props.auth.user.name)}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <HRNotificationDropdown />
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                mode === "hr" 
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                                    : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                            } shadow`}>
                                {mode === "hr" ? "👔 HR Portal" : "💼 Employee"}
                            </span>
                        </div>
                    </div>
                </header>
                
                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-gray-50">
                    <PageTransition animation="fade-slide-up" duration={400} delay={100} className="p-4">
                        {children}
                    </PageTransition>
                </main>
            </div>
        </div>
    );
}

// Helper function to get HR page title based on URL
function getHRPageTitle(url) {
    const routes = {
        '/hr/dashboard': 'HR Dashboard',
        '/hr/employees': 'Employee Management',
        '/hr/leave-credits': 'Leave Credits',
        '/hr/leave-types': 'Leave Types',
        '/hr/departments': 'Department Management',
        '/hr/leave-requests': 'Leave Requests',
        '/hr/credit-conversions': 'Credit Conversions',
        '/hr/leave-calendar': 'Leave Calendar',
        '/hr/leave-recordings': 'Leave Recordings',
        '/hr/attendance/logs': 'Attendance Logs',
        '/employee/dashboard': 'My Dashboard',
        '/employee/my-leave-requests': 'My Leave Requests',
        '/employee/leave-calendar': 'Leave Calendar',
        '/employee/credit-conversion': 'Credit Conversion',
        '/employee/attendance-logs': 'Attendance Logs'
    };
    
    for (const [route, title] of Object.entries(routes)) {
        if (url.startsWith(route)) return title;
    }
    return 'HR Dashboard';
}

// Helper function to get HR page subtitle
function getHRPageSubtitle(url, userName) {
    if (url.startsWith('/hr/dashboard')) {
        return `Welcome back, ${userName}. HR management overview.`;
    } else if (url.startsWith('/hr/employees')) {
        return 'Manage employee information and records';
    } else if (url.startsWith('/hr/leave-credits')) {
        return 'View and manage employee leave balances';
    } else if (url.startsWith('/hr/leave-types')) {
        return 'Configure leave types and policies';
    } else if (url.startsWith('/hr/departments')) {
        return 'Manage departments and organizational structure';
    } else if (url.startsWith('/hr/leave-requests')) {
        return 'Review and approve employee leave requests';
    } else if (url.startsWith('/hr/credit-conversions')) {
        return 'Process leave credit to cash conversions';
    } else if (url.startsWith('/hr/leave-calendar')) {
        return 'View all scheduled leaves across organization';
    } else if (url.startsWith('/hr/leave-recordings')) {
        return 'Track and manage leave recordings';
    } else if (url.startsWith('/hr/attendance/logs')) {
        return 'View and manage attendance records';
    }
    return `Hello, ${userName}`;
}