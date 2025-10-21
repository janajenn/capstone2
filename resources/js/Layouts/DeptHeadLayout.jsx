// resources/js/Layouts/DeptHeadLayout.jsx
import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import PageTransition from '@/Components/PageTransition';
import RoleSwitchButton from '@/Components/RoleSwitchButton';
import DeptHeadNotificationDropdown from '@/Components/DeptHeadNotificationDropdown';
import Swal from 'sweetalert2';
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
    CurrencyDollarIcon,
    BuildingOfficeIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function DeptHeadLayout({ children }) {
    const { props, url } = usePage();
    const userRole = props.auth.role;
    
    const [collapsed, setCollapsed] = useState(false);
    const [mode, setMode] = useState("dept_head");

    const toggleSidebar = () => setCollapsed(!collapsed);

    const isActiveLink = (href) => {
        return url.startsWith(href);
    };

    const handleLogout = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You will be logged out of your account.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Logout',
            cancelButtonText: 'Cancel',
            background: '#ffffff',
            backdrop: `
                rgba(0, 0, 0, 0.4)
                url("/images/nyan-cat.gif")
                left top
                no-repeat
            `,
            customClass: {
                popup: 'rounded-xl shadow-2xl',
                title: 'text-xl font-semibold text-gray-800',
                htmlContainer: 'text-gray-600',
                confirmButton: 'px-6 py-2 rounded-lg font-medium',
                cancelButton: 'px-6 py-2 rounded-lg font-medium'
            },
            buttonsStyling: false,
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                router.post('/logout');
            }
        });
    };

    const deptHeadNavigation = [
        { href: '/dept-head/dashboard', label: 'Dashboard', icon: HomeIcon },
        { href: '/dept-head/leave-requests', label: 'Leave Approvals', icon: DocumentTextIcon },
        { href: '/dept-head/employees', label: 'Team Management', icon: UserGroupIcon },
        { href: '/dept-head/leave-calendar', label: 'Leave Calendar', icon: CalendarIcon },
        // { href: '/dept-head/recall-requests', label: 'Recall Requests', icon: ArrowPathIcon },
        // { href: '/dept-head/chart-data', label: 'Analytics', icon: ChartBarIcon },
    ];

    const employeeNavigation = [
        { href: '/employee/dashboard', label: 'Dashboard', icon: HomeIcon },
        { href: '/employee/my-leave-requests', label: 'My Leave Requests', icon: DocumentTextIcon },
        { href: '/employee/leave-calendar', label: 'Leave Calendar', icon: CalendarIcon },
        { href: '/employee/credit-conversion', label: 'Credit Conversion', icon: CurrencyDollarIcon },
    ];

    const currentNavigation = mode === "dept_head" ? deptHeadNavigation : employeeNavigation;

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Modern Sidebar */}
            <div className={`fixed inset-y-0 left-0 transition-all duration-300 flex flex-col z-50 ${
                collapsed ? 'w-20' : 'w-72'
            }`}>
                {/* Sidebar with gradient background */}
                <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700/50 shadow-2xl">
                    
                    {/* Header Section */}
                    <div className="p-6 border-b border-gray-700/50">
                        <div className={`flex items-center justify-between transition-all duration-300 ${
                            collapsed ? 'flex-col space-y-3' : 'space-x-3'
                        }`}>
                            {!collapsed ? (
                                <>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <BuildingOfficeIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h1 className="font-bold text-lg text-white truncate">
                                                {mode === "dept_head" ? "Department Head" : "Employee"}
                                            </h1>
                                            <p className="text-xs text-gray-400 truncate">
                                                {props.auth.user.name}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={toggleSidebar}
                                        className="p-2 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200 group"
                                    >
                                        <ChevronLeftIcon className="h-4 w-4 text-gray-300 group-hover:text-white" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <BuildingOfficeIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <button 
                                        onClick={toggleSidebar}
                                        className="p-2 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200 group"
                                    >
                                        <ChevronRightIcon className="h-4 w-4 text-gray-300 group-hover:text-white" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {currentNavigation.map((item) => {
                            const IconComponent = item.icon;
                            const isActive = isActiveLink(item.href);
                            
                            return (
                                <Link 
                                    key={item.href}
                                    href={item.href} 
                                    className={`flex items-center p-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                                        isActive 
                                            ? 'bg-white/10 text-white shadow-lg shadow-blue-500/25 backdrop-blur-sm' 
                                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    {/* Active indicator */}
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-full"></div>
                                    )}
                                    
                                    <div className={`relative flex items-center ${
                                        collapsed ? 'justify-center' : 'space-x-3'
                                    }`}>
                                        <div className={`p-2 rounded-lg transition-all duration-200 ${
                                            isActive 
                                                ? 'bg-white/20' 
                                                : 'bg-gray-700/50 group-hover:bg-white/10'
                                        }`}>
                                            <IconComponent className={`h-5 w-5 ${
                                                isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                                            }`} />
                                        </div>
                                        
                                        {!collapsed && (
                                            <span className={`font-medium transition-all duration-200 ${
                                                isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                                            }`}>
                                                {item.label}
                                            </span>
                                        )}
                                    </div>

                                    {/* Tooltip for collapsed state */}
                                    {collapsed && (
                                        <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl z-50 border border-gray-700">
                                            {item.label}
                                            {/* Tooltip arrow */}
                                            <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}

                        {/* Role Switch Button */}
                        {(userRole === "dept_head" || userRole === "hr" || userRole === "admin") && (
                            <div className="pt-4 mt-4 border-t border-gray-700/50">
                                <RoleSwitchButton 
                                    collapsed={collapsed} 
                                    currentMode={mode} 
                                    modernDesign={true}
                                />
                            </div>
                        )}
                    </nav>

                    {/* Footer Section */}
                    <div className="p-4 border-t border-gray-700/50">
                        {/* User Info */}
                        {!collapsed && (
                            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-700/30 mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    {props.auth.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {props.auth.user.name}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {props.auth.role?.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className={`flex items-center w-full p-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                                collapsed ? 'justify-center' : ''
                            } bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-white border border-red-500/20 hover:border-red-500/30`}
                        >
                            <XMarkIcon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && (
                                <span className="ml-3 font-medium">Logout</span>
                            )}
                            {collapsed && (
                                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl z-50 border border-gray-700">
                                    Logout
                                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
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
                <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm z-10 sticky top-0">
                    <div className="flex items-center justify-between px-8 py-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {getPageTitle(url)}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {getPageSubtitle(url, props.auth.user.name)}
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <DeptHeadNotificationDropdown />
                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                                mode === "dept_head" 
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                            } shadow-lg`}>
                                {mode === "dept_head" ? "👑 Department Head" : "💼 Employee Mode"}
                            </span>
                        </div>
                    </div>
                </header>
                
                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-blue-50/30">
                    <PageTransition animation="fade-slide-up" duration={400} delay={100} className="p-6">
                        {children}
                    </PageTransition>
                </main>
            </div>
        </div>
    );
}

// Helper function to get page title based on URL
function getPageTitle(url) {
    const routes = {
        '/dept-head/dashboard': 'Dashboard Overview',
        '/dept-head/leave-requests': 'Leave Approvals',
        '/dept-head/employees': 'Team Management',
        '/dept-head/leave-calendar': 'Leave Calendar',
        '/dept-head/recall-requests': 'Recall Requests',
        '/employee/dashboard': 'My Dashboard',
        '/employee/my-leave-requests': 'My Leave Requests',
        '/employee/leave-calendar': 'Leave Calendar',
        '/employee/credit-conversion': 'Credit Conversion'
    };
    
    for (const [route, title] of Object.entries(routes)) {
        if (url.startsWith(route)) return title;
    }
    return 'Dashboard';
}

// Helper function to get page subtitle
function getPageSubtitle(url, userName) {
    if (url.startsWith('/dept-head/dashboard')) {
        return `Welcome back, ${userName}. Here's your team overview.`;
    } else if (url.startsWith('/dept-head/leave-requests')) {
        return 'Review and approve leave requests from your team';
    } else if (url.startsWith('/dept-head/employees')) {
        return 'Manage your team members and their information';
    } else if (url.startsWith('/dept-head/leave-calendar')) {
        return 'View scheduled leaves across your department';
    }
    return `Hello, ${userName}`;
}