// resources/js/Pages/Employee/Dashboard.jsx
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { usePage, Link } from '@inertiajs/react';

export default function Dashboard() {
    const { props } = usePage();
    const { userName, departmentName, leaveCredits, latestLeaveRequest } = props;

    // Quick Actions Data
    const quickActions = [
        {
            title: 'View Attendance Logs',
            href: '/employee/attendance-logs',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'blue'
        },
        {
            title: 'Apply for Leave',
            href: '/employee/leave',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            color: 'green'
        },
        {
            title: 'Convert Leave Credits',
            href: '/employee/credit-conversion',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            ),
            color: 'purple'
        },
        {
            title: 'View Leave History',
            href: '/employee/my-leave-requests',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            color: 'orange'
        },
        {
            title: 'My Leave Calendar',
            href: '/employee/leave-calendar',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            color: 'indigo'
        }
    ];

    const getColorClasses = (color) => {
        const colors = {
            blue: 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300',
            green: 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300',
            purple: 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100 hover:border-purple-300',
            orange: 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100 hover:border-orange-300',
            indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300'
        };
        return colors[color] || colors.blue;
    };

    return (
        <EmployeeLayout>
            
            

            {/* Main Dashboard Grid */}
            <div className="space-y-8">
                {/* Leave Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vacation Leave Balance Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-blue-900">Vacation Leave</h3>
                                <p className="text-blue-600 text-sm">Available Leave Credits Balance</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-blue-900 mb-2">
                            {leaveCredits?.vl ?? 0} <span className="text-lg font-normal text-blue-600">days</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((leaveCredits?.vl / 15) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>

{/* Sick Leave Balance Card */}
<div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
    <div className="flex items-center justify-between mb-4">
        <div>
            <h3 className="text-lg font-semibold text-green-900">Sick Leave</h3>
            <p className="text-green-600 text-sm">Available Leave Credits Balance</p>
        </div>
        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        </div>
    </div>
    <div className="text-3xl font-bold text-green-900 mb-2">
        {leaveCredits?.sl ?? 0} <span className="text-lg font-normal text-green-600">days</span>
    </div>
    <div className="w-full bg-green-200 rounded-full h-2">
        <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((leaveCredits?.sl / 15) * 100, 100)}%` }}
        ></div>
    </div>
</div>
</div>

                {/* Quick Actions Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                href={action.href}
                                className={`flex flex-col items-center justify-center p-5 border-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${getColorClasses(action.color)}`}
                            >
                                <div className="mb-3 p-3 rounded-lg bg-white shadow-sm">
                                    {action.icon}
                                </div>
                                <span className="text-sm font-medium text-center">{action.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Additional Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Department Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Department</p>
                                <p className="text-lg font-semibold text-gray-900">{departmentName || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Recent Activity</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {latestLeaveRequest ? 'Leave Request' : 'No recent activity'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Apply */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Need time off?</p>
                                <p className="text-white text-lg font-semibold">Apply for Leave</p>
                            </div>
                            <Link 
                                href="/employee/leave"
                                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                            >
                                Apply Now
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}