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
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function DeptHeadLayout({ children }) {
    const { props, url } = usePage();
    const userRole = props.auth.role;
    
    const [collapsed, setCollapsed] = useState(false);
    const [mode, setMode] = useState("dept_head");

    const toggleSidebar = () => setCollapsed(!collapsed);

    // Helper function to check if a link is active
    const isActiveLink = (href) => {
        return url.startsWith(href);
    };

    // Navigation items for Dept Head mode
    const deptHeadNavigation = [
        { href: '/dept-head/dashboard', label: 'Dashboard', icon: HomeIcon },
        { href: '/dept-head/leave-requests', label: 'Leave Approvals', icon: DocumentTextIcon },
        { href: '/dept-head/employees', label: 'Team Management', icon: UserGroupIcon },
        { href: '/dept-head/leave-calendar', label: 'Leave Calendar', icon: CalendarIcon },
        { href: '/dept-head/recall-requests', label: 'Recall Requests', icon: ArrowPathIcon },
        { href: '/dept-head/chart-data', label: 'Analytics', icon: ChartBarIcon },
    ];

    // Navigation items for Employee mode
    const employeeNavigation = [
        { href: '/employee/dashboard', label: 'Dashboard', icon: HomeIcon },
        { href: '/employee/my-leave-requests', label: 'My Leave Requests', icon: DocumentTextIcon },
        { href: '/employee/leave-calendar', label: 'Leave Calendar', icon: CalendarIcon },
        { href: '/employee/credit-conversion', label: 'Credit Conversion', icon: CurrencyDollarIcon },
    ];

    const currentNavigation = mode === "dept_head" ? deptHeadNavigation : employeeNavigation;

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Fixed Sidebar with deptDark background */}
            <div className={`fixed inset-y-0 left-0 transition-all duration-300 bg-dept-dark text-white flex flex-col z-50 ${collapsed ? 'w-16' : 'w-64'}`}>
                <div className="flex items-center justify-between p-4 border-b border-dept-green/30">
                    {!collapsed ? (
                        <div className="flex items-center space-x-3">
                            {/* Logo */}
                            <div className="w-9 h-9 bg-dept-green rounded-lg flex items-center justify-center">
                                <UserGroupIcon className="h-5 w-5 text-white" />
                            </div>
                            <h1 className="font-bold text-xl text-white">
                                {mode === "dept_head" ? "DEPARTMENT HEAD" : "EMPLOYEE MODE"}
                            </h1>
                        </div>
                    ) : (
                        // Show only logo when collapsed
                        <div className="flex justify-center w-full">
                            <div className="w-9 h-9 bg-dept-green rounded-lg flex items-center justify-center">
                                <UserGroupIcon className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    )}
                    <button 
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-full hover:bg-dept-green/20 transition-colors"
                    >
                        {collapsed ? (
                            <ChevronRightIcon className="h-5 w-5 text-dept-green" />
                        ) : (
                            <ChevronLeftIcon className="h-5 w-5 text-white" />
                        )}
                    </button>
                </div>

                <nav className="flex flex-col p-3 space-y-2 flex-1 mt-2 overflow-y-auto">
                    {currentNavigation.map((item) => {
                        const IconComponent = item.icon;
                        const isActive = isActiveLink(item.href);
                        
                        return (
                            <Link 
                                key={item.href}
                                href={item.href} 
                                className={`flex items-center p-3 rounded-lg transition-all duration-200 group relative ${
                                    isActive 
                                        ? 'bg-dept-green text-white shadow-lg shadow-dept-green/25' 
                                        : 'hover:bg-dept-green/30 hover:text-white'
                                }`}
                            >
                                <IconComponent className={`h-5 w-5 flex-shrink-0 ${
                                    isActive ? 'text-white' : 'text-gray-300'
                                }`} />
                                {!collapsed && (
                                    <span className={`ml-3 font-medium ${
                                        isActive ? 'text-white' : 'text-gray-200'
                                    }`}>
                                        {item.label}
                                    </span>
                                )}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-dept-green text-white rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}

                    {/* Role Switch Button */}
                    {(userRole === "dept_head" || userRole === "hr" || userRole === "admin") && (
                        <RoleSwitchButton 
                            collapsed={collapsed} 
                            currentMode={mode} 
                            deptColors={true}
                        />
                    )}

                    {/* Logout */}
                    <div className="mt-auto pt-4 border-t border-dept-green/30">
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="flex items-center w-full p-3 rounded-lg hover:bg-red-600/20 text-red-200 hover:text-white transition-all duration-200 group relative"
                        >
                            <XMarkIcon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && <span className="ml-3">Logout</span>}
                            {collapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-dept-green text-white rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
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
                    <div className="flex items-center justify-between px-6 py-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Welcome, {props.auth.user.name}
                            </h2>
                            
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-dept-green text-white">
                                {mode === "dept_head" ? "Department Head" : "Employee Mode"}
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