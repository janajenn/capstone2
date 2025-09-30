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
    const { props, url } = usePage();
    const userRole = props.auth.role;
    
    const [collapsed, setCollapsed] = useState(false);
    const [mode, setMode] = useState("hr");

    const toggleSidebar = () => setCollapsed(!collapsed);

    // Helper function to check if a link is active
    const isActiveLink = (href) => {
        return url.startsWith(href);
    };

    // Navigation items for HR mode
    const hrNavigation = [
        { href: '/hr/dashboard', label: 'Dashboard', icon: HomeIcon },
        { href: '/hr/employees', label: 'Employees', icon: UserGroupIcon },
        { href: '/hr/leave-credits', label: 'Leave Credits', icon: TableCellsIcon },
        { href: '/hr/leave-types', label: 'Leave Types', icon: DocumentTextIcon },
        { href: '/hr/departments', label: 'Departments', icon: BuildingOfficeIcon },
        { href: '/hr/leave-requests', label: 'Leave Requests', icon: ExclamationTriangleIcon },
        { href: '/hr/recall-requests', label: 'Recall Requests', icon: ArrowPathIcon },
        { href: '/hr/credit-conversions', label: 'Credit Conversions', icon: CurrencyDollarIcon },
        { href: '/hr/leave-calendar', label: 'Leave Calendar', icon: CalendarIcon },
    ];

    // Navigation items for Employee mode
    const employeeNavigation = [
        { href: '/employee/dashboard', label: 'Dashboard', icon: HomeIcon },
        { href: '/employee/my-leave-requests', label: 'My Leave Requests', icon: DocumentTextIcon },
        { href: '/employee/leave-calendar', label: 'Leave Calendar', icon: CalendarIcon },
        { href: '/employee/credit-conversion', label: 'Credit Conversion', icon: CurrencyDollarIcon },
    ];

    const currentNavigation = mode === "hr" ? hrNavigation : employeeNavigation;

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Fixed Sidebar with custom brandBlue */}
            <div className={`fixed inset-y-0 left-0 transition-all duration-300 bg-brand-blue text-white flex flex-col z-50 ${collapsed ? 'w-16' : 'w-64'}`}>
                <div className="flex items-center justify-between p-4 border-b border-blue-800">
                    {!collapsed ? (
                        <div className="flex items-center space-x-3">
                            {/* Logo */}
                            <img 
                                src="/assets/hr.png" 
                                alt="HRMO Logo" 
                                className="w-9 h-9 object-cover rounded"
                            />
                            <h1 className="font-bold text-xl">
                                {mode === "hr" ? "HR PORTAL" : "EMPLOYEE MODE"}
                            </h1>
                        </div>
                    ) : (
                        // Show only logo when collapsed
                        <div className="flex justify-center w-full">
                            <img 
                                src="/assets/hr.png" 
                                alt="HRMO Logo" 
                                className="w-9 h-9 object-cover rounded"
                            />
                        </div>
                    )}
                    <button 
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-full hover:bg-blue-800 transition-colors"
                    >
                        {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
                    </button>
                </div>

                <nav className="flex flex-col p-3 space-y-1 flex-1 mt-2 overflow-y-auto">
                    {currentNavigation.map((item) => {
                        const IconComponent = item.icon;
                        const isActive = isActiveLink(item.href);
                        
                        return (
                            <Link 
                                key={item.href}
                                href={item.href} 
                                className={`flex items-center p-3 rounded-lg transition-all duration-200 group relative ${
                                    isActive 
                                        ? 'bg-brand-yellow text-gray-900 shadow-lg' 
                                        : 'hover:bg-blue-800 hover:text-white'
                                }`}
                            >
                                <IconComponent className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-gray-900' : ''}`} />
                                {!collapsed && (
                                    <span className={`ml-3 font-medium ${isActive ? 'text-gray-900' : ''}`}>
                                        {item.label}
                                    </span>
                                )}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}

                    {/* Role Switch Button */}
                    {(userRole === "hr" || userRole === "admin" || userRole === "dept_head") && (
                        <RoleSwitchButton collapsed={collapsed} currentMode={mode} />
                    )}

                    {/* Logout */}
                    <div className="mt-auto pt-3 border-t border-blue-800">
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="flex items-center w-full p-3 rounded-lg hover:bg-red-600/20 text-red-100 hover:text-white transition-all duration-200 group relative"
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

            {/* Main Content - Adjusted for fixed sidebar */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
                {/* Header */}
                <header className="bg-white shadow-sm z-10 sticky top-0">
                    <div className="flex items-center justify-between px-6 py-3">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Welcome, {props.auth.user.name}
                        </h2>
                        <div className="flex items-center space-x-4">
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-brand-blue text-white">
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