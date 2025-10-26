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
    CurrencyDollarIcon,
    BuildingOfficeIcon,
    CreditCardIcon
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
    ];

    const currentNavigation = mode === "admin" ? adminNavigation : employeeNavigation;

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Modern Admin Sidebar */}
            <div className={`fixed inset-y-0 left-0 transition-all duration-300 flex flex-col z-50 ${
                collapsed ? 'w-20' : 'w-72'
            }`}>
                {/* Sidebar with sophisticated purple-red background */}
                <div className="flex-1 flex flex-col bg-gradient-to-b from-purple-900 via-purple-800 to-red-900 border-r border-purple-600 shadow-2xl">
                    
                    {/* Header Section */}
                    <div className="p-5 border-b border-purple-600">
                        <div className={`flex items-center justify-between transition-all duration-300 ${
                            collapsed ? 'flex-col space-y-3' : 'space-x-3'
                        }`}>
                            {!collapsed ? (
                                <>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                                            <ShieldCheckIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h1 className="font-bold text-base text-white truncate">
                                                {mode === "admin" ? "Admin Portal" : "Employee"}
                                            </h1>
                                            <p className="text-xs text-purple-200 truncate mt-0.5">
                                                System Administrator
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={toggleSidebar}
                                        className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-all duration-200 group"
                                    >
                                        <ChevronLeftIcon className="h-4 w-4 text-purple-200 group-hover:text-white" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <ShieldCheckIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <button 
                                        onClick={toggleSidebar}
                                        className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-all duration-200 group"
                                    >
                                        <ChevronRightIcon className="h-4 w-4 text-purple-200 group-hover:text-white" />
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
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40' 
                                            : 'text-purple-200 hover:bg-purple-600 hover:text-white'
                                    }`}
                                >
                                    {/* Active indicator */}
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-purple-400 rounded-r-full"></div>
                                    )}
                                    
                                    <div className={`relative flex items-center ${
                                        collapsed ? 'justify-center' : 'space-x-3'
                                    }`}>
                                        <div className={`p-1.5 rounded-md transition-all duration-200 ${
                                            isActive 
                                                ? 'bg-white/20' 
                                                : 'bg-purple-600 group-hover:bg-purple-500'
                                        }`}>
                                            <IconComponent className={`h-4 w-4 ${
                                                isActive ? 'text-white' : 'text-purple-200 group-hover:text-white'
                                            }`} />
                                        </div>
                                        
                                        {!collapsed && (
                                            <span className={`text-sm font-normal transition-all duration-200 ${
                                                isActive ? 'text-white' : 'text-purple-200 group-hover:text-white'
                                            }`}>
                                                {item.label}
                                            </span>
                                        )}
                                    </div>

                                    {/* Tooltip for collapsed state */}
                                    {collapsed && (
                                        <div className="absolute left-full ml-2 px-2 py-1.5 bg-purple-800 text-white rounded-md text-xs font-normal whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl z-50 border border-purple-600">
                                            {item.label}
                                            {/* Tooltip arrow */}
                                            <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-3 border-transparent border-r-purple-800"></div>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}

                        {/* Role Switch Button */}
                        {(userRole === "admin" || userRole === "hr" || userRole === "dept_head") && (
                            <div className="pt-3 mt-3 border-t border-purple-600">
                                <RoleSwitchButton 
                                    collapsed={collapsed} 
                                    currentMode={mode} 
                                    modernDesign={true}
                                    colorScheme="purple"
                                />
                            </div>
                        )}
                    </nav>

                    {/* Footer Section */}
                    <div className="p-3 border-t border-purple-600">
                        {/* User Info */}
                        {!collapsed && (
                            <div className="flex items-center space-x-2 p-2 rounded-lg bg-purple-600/50 mb-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-red-500 rounded-full flex items-center justify-center text-white font-medium text-xs shadow">
                                    {props.auth.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-white truncate leading-tight">
                                        {props.auth.user.name}
                                    </p>
                                    <p className="text-xs text-purple-200 truncate leading-tight">
                                        {props.auth.role?.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Logout Button */}
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
                                <div className="absolute left-full ml-2 px-2 py-1.5 bg-purple-800 text-white rounded-md text-xs font-normal whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl z-50 border border-purple-600">
                                    Logout
                                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-3 border-transparent border-r-purple-800"></div>
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
                                {getAdminPageTitle(url)}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {getAdminPageSubtitle(url, props.auth.user.name)}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <AdminNotificationDropdown />
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                mode === "admin" 
                                    ? 'bg-gradient-to-r from-purple-500 to-red-600 text-white' 
                                    : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                            } shadow`}>
                                {mode === "admin" ? "👑 Admin Portal" : "💼 Employee Mode"}
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

// Helper function to get Admin page title based on URL
function getAdminPageTitle(url) {
    const routes = {
        '/admin/dashboard': 'Admin Dashboard',
        '/admin/leave-requests': 'Leave Requests',
        '/admin/credit-conversions': 'Credit Conversion Requests',
        '/admin/credit-conversions/': 'Credit Conversion Details', // For show page
        '/admin/delegation': 'Delegate Approver',
        '/admin/leave-calendar': 'Leave Calendar',
        '/employee/dashboard': 'My Dashboard',
        '/employee/my-leave-requests': 'My Leave Requests',
        '/employee/leave-calendar': 'Leave Calendar',
        '/employee/credit-conversion': 'Credit Conversion'
    };
    
    for (const [route, title] of Object.entries(routes)) {
        if (url.startsWith(route)) return title;
    }
    return 'Admin Dashboard';
}

// Helper function to get Admin page subtitle
function getAdminPageSubtitle(url, userName) {
    if (url.startsWith('/admin/dashboard')) {
        return `Welcome back, ${userName}. System administration overview.`;
    } else if (url.startsWith('/admin/leave-requests')) {
        return 'Review and approve all leave requests';
    } else if (url.startsWith('/admin/credit-conversions') && !url.includes('/admin/credit-conversions/')) {
        return 'Review and approve credit conversion requests';
    } else if (url.startsWith('/admin/credit-conversions/')) {
        return 'View credit conversion request details';
    } else if (url.startsWith('/admin/delegation')) {
        return 'Manage approval delegation settings';
    } else if (url.startsWith('/admin/leave-calendar')) {
        return 'View all scheduled leaves across organization';
    } else if (url.startsWith('/employee/dashboard')) {
        return `Welcome back, ${userName}. Your personal workspace.`;
    } else if (url.startsWith('/employee/my-leave-requests')) {
        return 'View and manage your leave requests';
    } else if (url.startsWith('/employee/leave-calendar')) {
        return 'View your scheduled leaves and time off';
    } else if (url.startsWith('/employee/credit-conversion')) {
        return 'Convert your leave credits to cash';
    }
    return `Hello, ${userName}`;
}