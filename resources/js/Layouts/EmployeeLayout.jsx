// resources/js/Layouts/EmployeeLayout.jsx
import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import NotificationDropdown from '@/Components/NotificationDropdown';
import PageTransition from '@/Components/PageTransition';
import RoleSwitchButton from '@/Components/RoleSwitchButton';
import {
    HomeIcon,
    DocumentTextIcon,
    ClipboardDocumentListIcon,
    CalendarIcon,
    CreditCardIcon,
    ChartBarIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon,
    ClockIcon

} from '@heroicons/react/24/outline';
export default function EmployeeLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const { auth } = usePage().props;
    const user = auth?.user;

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <div className={`transition-all duration-300 bg-white shadow-lg flex flex-col fixed left-0 top-0 bottom-0 z-10 ${collapsed ? 'w-16' : 'w-64'}`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    {!collapsed && <h1 className="font-bold text-xl text-blue-800">Employee Portal</h1>}
                    <button 
                        onClick={toggleSidebar}
                        className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    >
                        {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
                    </button>
                </div>

                <nav className="flex flex-col p-3 space-y-1 flex-1">
                    <Link 
                        href="/employee/dashboard" 
                        className="flex items-center space-x-2 p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600"
                    >
                        <HomeIcon className="h-5 w-5" />
                        {!collapsed && <span>Dashboard</span>}
                    </Link>
                    <Link 
                        href="/employee/leave" 
                        className="flex items-center space-x-2 p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600"
                    >
                        <DocumentTextIcon className="h-5 w-5" />
                        {!collapsed && <span>Request Leave</span>}
                    </Link>
                    <Link 
                        href="/employee/my-leave-requests" 
                        className="flex items-center space-x-2 p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600"
                    >
                        <ClipboardDocumentListIcon className="h-5 w-5" />
                        {!collapsed && <span>My Requests</span>}
                    </Link>
                    <Link 
                        href="/employee/leave-calendar" 
                        className="flex items-center space-x-2 p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600"
                    >
                        <CalendarIcon className="h-5 w-5" />
                        {!collapsed && <span>Leave Calendar</span>}
                    </Link>
                    <Link 
                        href="/employee/credit-conversion" 
                        className="flex items-center space-x-2 p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600"
                    >
                        <CreditCardIcon className="h-5 w-5" />
                        {!collapsed && <span>Credit Conversion</span>}
                    </Link>
                    <Link 
    href="/employee/credit-conversions" 
    className="flex items-center space-x-2 p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50 text-gray-700 hover:text-blue-600"
>
    <ClockIcon className="h-5 w-5" />
    {!collapsed && <span>Conversion History</span>}
</Link>

                    <Link 
    href={route('employee.leave-balances')} 
    className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-50"
>
    <ChartBarIcon className="h-5 w-5 mr-2" />
    {!collapsed && <span>Leave Balances</span>}
</Link>


                    {/* Role Switch Button - Only show for non-employee users */}
                    <RoleSwitchButton collapsed={collapsed} currentMode="employee" />

                    {/* Logout */}
                    <div className="mt-auto pt-3 border-t border-gray-100">
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="w-full flex items-center space-x-2 p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                        >
                            <XMarkIcon className="h-5 w-5" />
                            {!collapsed && <span>Logout</span>}
                        </Link>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className={`flex-1 overflow-auto ${collapsed ? 'ml-16' : 'ml-64'}`}>
                {/* Header */}
                <header className="bg-white shadow-sm sticky top-0 z-10">
                    <div className="px-6 py-3 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Welcome, {user?.name}
                            </h2>
                            <p className="text-sm text-gray-500">Employee Dashboard</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <NotificationDropdown />
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                Employee
                            </span>
                        </div>
                    </div>
                </header>
                
                {/* Page Content */}
                <main>
                    <PageTransition 
                        animation="fade-slide-up"
                        duration={400}
                        delay={100}
                        className="p-6"
                    >
                        {children}
                    </PageTransition>
                </main>
            </div>
        </div>
    );
}