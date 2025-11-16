import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import PageTransition from '@/Components/PageTransition';
import RoleSwitchButton from '@/Components/RoleSwitchButton';
import AdminNotificationDropdown from '@/Components/AdminNotificationDropdown';
import Swal from 'sweetalert2';
import {
    HomeIcon,
    UserGroupIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowRightOnRectangleIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    UserIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    BuildingOfficeIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function AdminLayout({ children }) {
    const { props, url } = usePage();
    const userRole = props.auth.role;
    
    const [collapsed, setCollapsed] = useState(false);
    const [mode, setMode] = useState("admin");

    const toggleSidebar = () => setCollapsed(!collapsed);

    const isActiveLink = (href) => {
        return url.startsWith(href);
    };

    const handleLogout = () => {
        Swal.fire({
            title: 'Confirm Logout',
            text: "Are you sure you want to log out of your admin account?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Logout',
            cancelButtonText: 'Cancel',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl shadow-2xl border border-gray-200',
                title: 'text-xl font-bold bg-gradient-to-r from-gray-800 to-red-800 bg-clip-text text-transparent',
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

    const adminNavigation = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: HomeIcon },
        { href: '/admin/leave-requests', label: 'Leave Requests', icon: DocumentTextIcon },
        { href: route('admin.credit-conversions'), label: 'Credit Conversion', icon: CurrencyDollarIcon },
        { href: '/admin/delegation', label: 'Delegate Approver', icon: UserIcon },
        { href: '/admin/leave-calendar', label: 'Leave Calendar', icon: CalendarIcon },
       
        
    ];

    const employeeNavigation = [
        { href: '/employee/dashboard', label: 'Dashboard', icon: HomeIcon },
        { href: '/employee/my-leave-requests', label: 'My Leave Requests', icon: DocumentTextIcon },
        { href: '/employee/leave-calendar', label: 'Leave Calendar', icon: CalendarIcon },
        { href: '/employee/credit-conversion', label: 'Credit Conversion', icon: CurrencyDollarIcon },
        { href: '/employee/attendance-logs', label: 'Attendance Logs', icon: ChartBarIcon },
    ];

    const currentNavigation = mode === "admin" ? adminNavigation : employeeNavigation;

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100">
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
                                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                                                <ShieldCheckIcon className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h1 className="font-bold text-sm bg-gradient-to-r from-gray-800 to-red-800 bg-clip-text text-transparent">
                                                {mode === "admin" ? "Admin Portal" : "Employee"}
                                            </h1>
                                            <p className="text-sm text-gray-600 truncate mt-0.5">
                                                System Administrator
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={toggleSidebar}
                                        className="p-1.5 rounded-lg bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white/80 transition-all duration-300 group hover:scale-105 hover:shadow-lg"
                                    >
                                        <ChevronLeftIcon className="h-3 w-3 text-gray-700 group-hover:text-red-600 transition-colors" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <ShieldCheckIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white"></div>
                                    </div>
                                    <button 
                                        onClick={toggleSidebar}
                                        className="p-1.5 rounded-lg bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white/80 transition-all duration-300 group hover:scale-105 hover:shadow-lg"
                                    >
                                        <ChevronRightIcon className="h-3 w-3 text-gray-700 group-hover:text-red-600 transition-colors" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {currentNavigation.map((item) => {
                            const IconComponent = item.icon;
                            const isActive = isActiveLink(item.href);
                            
                            return (
                                <Link 
                                    key={item.href}
                                    href={item.href} 
                                    className={`group relative flex items-center p-2 rounded-xl transition-all duration-300 overflow-hidden ${
                                        isActive 
                                            ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg transform scale-105' 
                                            : 'text-gray-700 hover:bg-white/60 hover:shadow-md hover:scale-105 backdrop-blur-sm'
                                    }`}
                                >
                                    {/* Animated background for active state */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-600 opacity-100"></div>
                                    )}
                                    
                                    {/* Hover gradient effect */}
                                    <div className={`absolute inset-0 bg-gradient-to-r from-red-500 to-rose-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                                        isActive ? 'opacity-100' : ''
                                    }`}></div>
                                    
                                    <div className={`relative flex items-center z-10 ${
                                        collapsed ? 'justify-center' : 'space-x-2'
                                    }`}>
                                        <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                                            isActive 
                                                ? 'bg-white/20 text-white' 
                                                : 'bg-white/80 text-gray-700 group-hover:bg-white group-hover:text-red-600'
                                        }`}>
                                            <IconComponent className={`h-4 w-4 ${
                                                isActive ? 'text-white' : 'text-gray-600 group-hover:text-red-600'
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
                        {(userRole === "admin" || userRole === "hr" || userRole === "dept_head") && (
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
                            <div className="p-2 rounded-xl bg-gradient-to-r from-slate-100 to-red-100/50 backdrop-blur-sm border border-white/40">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-md">
                                        <span className="text-white font-bold text-xs">
                                            {props.auth.user.name.split(' ').map(n => n[0]).join('')}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 truncate">
                                            {props.auth.user.name}
                                        </p>
                                        <p className="text-xs text-gray-600 truncate">
                                            {userRole === 'admin' ? 'Administrator' : userRole === 'hr' ? 'HR Manager' : 'Department Head'}
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
                            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-red-800 bg-clip-text text-transparent">
                                {getAdminPageTitle(url)}
                            </h2>
                            <p className="text-sm text-gray-600 mt-0.5">
                                {getAdminPageSubtitle(url, props.auth.user.name)}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <AdminNotificationDropdown />
                            
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

                            <span className={`px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r ${
                                mode === "admin" 
                                    ? 'from-red-500 to-rose-600 text-white' 
                                    : 'from-cyan-500 to-blue-600 text-white'
                            } shadow-lg backdrop-blur-sm`}>
                                {mode === "admin" ? "👑 Admin" : "💼 Employee"}
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
                <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-red-200 to-rose-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-rose-200 to-pink-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
            </div>
        </div>
    );
}

// Helper function to get Admin page title based on URL
function getAdminPageTitle(url) {
    const routes = {
        '/admin/dashboard': 'Admin Analytics Dashboard',
        '/admin/leave-requests': 'Leave Requests',
        '/admin/credit-conversions': 'Credit Conversion Requests',
        '/admin/credit-conversions/': 'Credit Conversion Details',
        '/admin/delegation': 'Delegate Approver',
        '/admin/leave-calendar': 'Leave Calendar',
        '/admin/employees': 'Employee Management',
        '/admin/departments': 'Department Management',
        '/admin/attendance/logs': 'Attendance Analytics',
        '/admin/settings': 'System Settings',
        '/employee/dashboard': 'My Dashboard',
        '/employee/my-leave-requests': 'My Leave Requests',
        '/employee/leave-calendar': 'Leave Calendar',
        '/employee/credit-conversion': 'Credit Conversion',
        '/employee/attendance-logs': 'Attendance Logs'
    };
    
    for (const [route, title] of Object.entries(routes)) {
        if (url.startsWith(route)) return title;
    }
    return 'Admin Analytics Dashboard';
}

// Helper function to get Admin page subtitle
function getAdminPageSubtitle(url, userName) {
    if (url.startsWith('/admin/dashboard')) {
        return `Welcome back, ${userName}. Comprehensive system overview and analytics.`;
    } else if (url.startsWith('/admin/leave-requests')) {
        return 'Review and approve all leave requests across the organization';
    } else if (url.startsWith('/admin/credit-conversions') && !url.includes('/admin/credit-conversions/')) {
        return 'Review and approve credit conversion requests';
    } else if (url.startsWith('/admin/credit-conversions/')) {
        return 'View credit conversion request details';
    } else if (url.startsWith('/admin/delegation')) {
        return 'Manage approval delegation settings and permissions';
    } else if (url.startsWith('/admin/leave-calendar')) {
        return 'Visualize and manage organizational leave schedule';
    } else if (url.startsWith('/admin/employees')) {
        return 'Manage employee information and organizational structure';
    } else if (url.startsWith('/admin/departments')) {
        return 'Manage departments, teams, and reporting structure';
    } else if (url.startsWith('/admin/attendance/logs')) {
        return 'Analyze attendance patterns and workforce metrics';
    } else if (url.startsWith('/admin/settings')) {
        return 'Configure system settings and preferences';
    } else if (url.startsWith('/employee/dashboard')) {
        return `Welcome back, ${userName}. Your personal workspace.`;
    } else if (url.startsWith('/employee/my-leave-requests')) {
        return 'View and manage your leave requests';
    } else if (url.startsWith('/employee/leave-calendar')) {
        return 'View your scheduled leaves and time off';
    } else if (url.startsWith('/employee/credit-conversion')) {
        return 'Convert your leave credits to cash';
    } else if (url.startsWith('/employee/attendance-logs')) {
        return 'View your attendance history and logs';
    }
    return `Welcome, ${userName}. Streamlined employee self-service portal.`;
}