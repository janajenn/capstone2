import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import PageTransition from '@/Components/PageTransition';
import RoleSwitchButton from '@/Components/RoleSwitchButton';
import NotificationDropdown from '@/Components/NotificationDropdown';
import Swal from 'sweetalert2';
import {
    HomeIcon,
    DocumentTextIcon,
    ClipboardDocumentListIcon,
    CalendarIcon,
    CreditCardIcon,
    ChartBarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowRightOnRectangleIcon,
    ClockIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';

export default function EmployeeLayout({ children }) {
    const { props, url } = usePage();
    const userRole = props.auth.role;
    const user = props.auth?.user;
    
    const [collapsed, setCollapsed] = useState(false);
    const [mode, setMode] = useState("employee");

    const toggleSidebar = () => setCollapsed(!collapsed);

    // Fixed isActiveLink function with exact matching for all conflicting routes
    const isActiveLink = (href) => {
        const currentUrl = url;
        
        // Define routes that need exact matching (all routes that share prefixes)
        const exactMatchRoutes = [
            '/employee/leave',
            '/employee/leave-balances',
            '/employee/credit-conversion',
            '/employee/credit-conversions'
        ];
        
        // For routes that need exact matching
        if (exactMatchRoutes.includes(href)) {
            return currentUrl === href || currentUrl === href + '/';
        }
        
        // For other routes, use prefix matching
        return currentUrl.startsWith(href);
    };

    const handleLogout = () => {
        Swal.fire({
            title: 'Confirm Logout',
            text: "Are you sure you want to log out of your account?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Logout',
            cancelButtonText: 'Cancel',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl shadow-2xl border border-gray-200',
                title: 'text-xl font-bold bg-gradient-to-r from-gray-800 to-emerald-800 bg-clip-text text-transparent',
                htmlContainer: 'text-gray-600',
                confirmButton: 'px-6 py-2 rounded-xl font-medium bg-gradient-to-r from-rose-500 to-red-600 text-white hover:shadow-lg transition-all duration-300',
                cancelButton: 'px-6 py-2 rounded-xl font-medium bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:shadow-lg transition-all duration-300'
            },
            buttonsStyling: false,
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                router.post('/logout');
            }
        });
    };

    const employeeNavigation = [
        { href: '/employee/dashboard', label: 'Dashboard', icon: HomeIcon },
        { href: '/employee/leave', label: 'Request Leave', icon: DocumentTextIcon },
        { href: '/employee/my-leave-requests', label: 'My Requests', icon: ClipboardDocumentListIcon },
        { href: '/employee/leave-calendar', label: 'Leave Calendar', icon: CalendarIcon },
        { href: '/employee/credit-conversion', label: 'Credit Conversion', icon: CreditCardIcon },
        { href: '/employee/credit-conversions', label: 'Conversion History', icon: ClockIcon },
        { href: '/employee/attendance-logs', label: 'Attendance Logs', icon: ChartBarIcon },
        { href: '/employee/credits-log', label: 'Credits Log', icon: ClipboardDocumentListIcon }, // Changed icon
        { href: '/employee/leave-balances', label: 'Leave Balances', icon: CreditCardIcon }, // Changed icon
    ];

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
            {/* Enhanced Modern Sidebar */}
            <div className={`fixed inset-y-0 left-0 transition-all duration-500 flex flex-col z-50 ${
                collapsed ? 'w-16' : 'w-64'
            }`}>
                {/* Sidebar with glass morphism effect */}
                <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-2xl">
                    
                    {/* Header Section with Gradient */}
                    <div className="p-4 border-b border-white/30">
                        <div className={`flex items-center justify-between transition-all duration-300 ${
                            collapsed ? 'flex-col space-y-3' : 'space-x-3'
                        }`}>
                            {!collapsed ? (
                                <>
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                                <UserCircleIcon className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h1 className="font-bold text-sm bg-gradient-to-r from-gray-800 to-emerald-800 bg-clip-text text-transparent">
                                                Employee Portal
                                            </h1>
                                            <p className="text-sm text-gray-600 truncate mt-0.5">
                                                Self Service
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={toggleSidebar}
                                        className="p-1.5 rounded-lg bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white/80 transition-all duration-300 group hover:scale-105 hover:shadow-lg"
                                    >
                                        <ChevronLeftIcon className="h-3 w-3 text-gray-700 group-hover:text-emerald-600 transition-colors" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <UserCircleIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white"></div>
                                    </div>
                                    <button 
                                        onClick={toggleSidebar}
                                        className="p-1.5 rounded-lg bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white/80 transition-all duration-300 group hover:scale-105 hover:shadow-lg"
                                    >
                                        <ChevronRightIcon className="h-3 w-3 text-gray-700 group-hover:text-emerald-600 transition-colors" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {employeeNavigation.map((item) => {
                            const IconComponent = item.icon;
                            const isActive = isActiveLink(item.href);
                            
                            return (
                                <Link 
                                    key={item.href}
                                    href={item.href} 
                                    className={`group relative flex items-center p-2 rounded-xl transition-all duration-300 overflow-hidden ${
                                        isActive 
                                            ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg transform scale-105' 
                                            : 'text-gray-700 hover:bg-white/60 hover:shadow-md hover:scale-105 backdrop-blur-sm'
                                    }`}
                                >
                                    {/* Animated background for active state */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 opacity-100"></div>
                                    )}
                                    
                                    {/* Hover gradient effect */}
                                    <div className={`absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                                        isActive ? 'opacity-100' : ''
                                    }`}></div>
                                    
                                    <div className={`relative flex items-center z-10 ${
                                        collapsed ? 'justify-center' : 'space-x-2'
                                    }`}>
                                        <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                                            isActive 
                                                ? 'bg-white/20 text-white' 
                                                : 'bg-white/80 text-gray-700 group-hover:bg-white group-hover:text-emerald-600'
                                        }`}>
                                            <IconComponent className={`h-4 w-4 ${
                                                isActive ? 'text-white' : 'text-gray-600 group-hover:text-emerald-600'
                                            }`} />
                                        </div>
                                        
                                        {!collapsed && (
                                            <span className={`text-sm font-medium transition-all duration-300 ${
                                                isActive ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'
                                            }`}>
                                                {item.label}
                                            </span>
                                        )}
                                    </div>

                                    {/* Active indicator bar */}
                                    {isActive && !collapsed && (
                                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white/40 rounded-full"></div>
                                    )}

                                    {/* Enhanced Tooltip for collapsed state */}
                                    {collapsed && (
                                        <div className="absolute left-full ml-2 px-2 py-1.5 bg-gray-900/95 backdrop-blur-sm text-white rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl z-50 border border-white/10">
                                            {item.label}
                                            {/* Tooltip arrow */}
                                            <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-3 border-transparent border-r-gray-900/95"></div>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}

                        {/* Enhanced Role Switch Button */}
                        {(userRole === "hr" || userRole === "admin" || userRole === "dept_head") && (
                            <div className="pt-4 mt-2 border-t border-white/30">
                                <div className={`p-2 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 ${
                                    collapsed ? 'text-center' : ''
                                }`}>
                                    <RoleSwitchButton 
                                        collapsed={collapsed} 
                                        currentMode={mode} 
                                        modernDesign={true}
                                        colorScheme="gradient"
                                    />
                                </div>
                            </div>
                        )}
                    </nav>

                    {/* Enhanced Footer Section - Removed Logout */}
                    <div className="p-3 border-t border-white/30">
                        {/* User Info */}
                        {!collapsed && (
                            <div className="p-2 rounded-xl bg-gradient-to-r from-slate-100 to-green-100/50 backdrop-blur-sm border border-white/40">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                                        <span className="text-white font-bold text-xs">
                                            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'E'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 truncate">
                                            {user?.name}
                                        </p>
                                        <p className="text-xs text-gray-600 truncate">
                                            {userRole === 'employee' ? 'Employee' : 'Staff'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-500 ${
                collapsed ? 'ml-16' : 'ml-64'
            }`}>
                {/* Enhanced Header with Logout */}
                <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg z-10 sticky top-0">
                    <div className="flex items-center justify-between px-6 py-3">
                        <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-emerald-800 bg-clip-text text-transparent">
                                {getEmployeePageTitle(url)}
                            </h2>
                            <p className="text-sm text-gray-600 mt-0.5">
                                {getEmployeePageSubtitle(url, user?.name)}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <NotificationDropdown />
                            
                            {/* User Info and Logout in Header */}
                            <div className="flex items-center space-x-3">
                                
                                {/* Logout Button in Header */}
                                <button
                                    onClick={handleLogout}
                                    className="group relative flex items-center p-2 rounded-xl bg-gradient-to-r from-rose-100 to-red-100/50 hover:from-rose-200 hover:to-red-200 backdrop-blur-sm border border-rose-200/50 hover:border-rose-300 hover:shadow-lg transition-all duration-300"
                                    title="Logout"
                                >
                                    {/* Animated background */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                                    
                                    <div className="relative z-10 flex items-center">
                                        <div className="p-1.5 rounded-lg bg-white/80 group-hover:bg-white/20 transition-all duration-300">
                                            <ArrowRightOnRectangleIcon className="h-4 w-4 text-rose-600 group-hover:text-white transition-colors" />
                                        </div>
                                    </div>

                                    {/* Tooltip */}
                                    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-2 py-1.5 bg-gray-900/95 backdrop-blur-sm text-white rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl z-50 border border-white/10">
                                        Logout
                                        <div className="absolute left-1/2 -top-1 transform -translate-x-1/2 border-3 border-transparent border-b-gray-900/95"></div>
                                    </div>
                                </button>
                            </div>

                            <span className={`px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg backdrop-blur-sm`}>
                                💼 Employee
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

            {/* Animated Background Elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-emerald-200 to-green-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-green-200 to-teal-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
            </div>
        </div>
    );
}

// Helper function to get Employee page title based on URL
function getEmployeePageTitle(url) {
    const routes = {
        '/employee/dashboard': 'My Dashboard',
        '/employee/leave': 'Request Leave',
        '/employee/my-leave-requests': 'My Leave Requests',
        '/employee/leave-calendar': 'Leave Calendar',
        '/employee/credit-conversion': 'Credit Conversion',
        '/employee/credit-conversions': 'Conversion History',
        '/employee/credits-log': 'Credits Log', // Add this line

        '/employee/attendance-logs': 'Attendance Logs',
        '/employee/leave-balances': 'Leave Balances'
    };
    
    // Try exact match first
    if (routes[url]) {
        return routes[url];
    }
    
    // Try match with trailing slash
    if (url.endsWith('/') && routes[url.slice(0, -1)]) {
        return routes[url.slice(0, -1)];
    }
    
    // Fallback to prefix matching for specific routes
    for (const [route, title] of Object.entries(routes)) {
        if (url.startsWith(route) && route !== '/employee/dashboard') {
            // Skip conflicting matches
            if (route === '/employee/leave' && url.startsWith('/employee/leave-balances')) {
                continue;
            }
            if (route === '/employee/credit-conversion' && url.startsWith('/employee/credit-conversions')) {
                continue;
            }
            return title;
        }
    }
    
    return 'Employee Dashboard';
}

// Helper function to get Employee page subtitle
function getEmployeePageSubtitle(url, userName) {
    // Remove trailing slash for consistent matching
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    
    if (cleanUrl === '/employee/dashboard') {
        return `Welcome back, ${userName}. Your personal workspace and analytics.`;
    } else if (cleanUrl === '/employee/leave') {
        return 'Submit a new leave request for approval';
    } else if (cleanUrl === '/employee/my-leave-requests' || cleanUrl.startsWith('/employee/my-leave-requests/')) {
        return 'View and track your leave request status';
    } else if (cleanUrl === '/employee/leave-calendar' || cleanUrl.startsWith('/employee/leave-calendar/')) {
        return 'Visualize your scheduled leaves and time off';
    } else if (cleanUrl === '/employee/credit-conversion') {
        return 'Convert your leave credits to monetary value';
    } else if (cleanUrl === '/employee/credit-conversions' || cleanUrl.startsWith('/employee/credit-conversions/')) {
        return 'Track your credit conversion history and status';
    } else if (cleanUrl === '/employee/attendance-logs' || cleanUrl.startsWith('/employee/attendance-logs/')) {
        return 'Monitor your attendance records and patterns';
    } else if (cleanUrl === '/employee/leave-balances' || cleanUrl.startsWith('/employee/leave-balances/')) {
        return 'Check your current leave credit balances';
    }
    return `Welcome, ${userName}. Streamlined employee self-service portal.`;
}