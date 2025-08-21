// resources/js/Pages/Employee/Dashboard.jsx
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { usePage } from '@inertiajs/react';
import LeaveRequestCard from '../Employee/LeaveRequestCard';

export default function Dashboard() {
    const { props } = usePage();
    const { userName, departmentName, leaveCredits, latestLeaveRequest } = props;

    return (
        <EmployeeLayout>
            <h1 className="text-2xl font-bold">Employee Dashboard</h1>
            <p className="mt-2">Welcome, {userName}!</p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded shadow">
                    <div className="text-gray-500 text-sm">Department</div>
                    <div className="text-xl font-semibold">{departmentName || 'N/A'}</div>
                </div>
                <div className="p-4 bg-white rounded shadow">
                    <div className="text-gray-500 text-sm">Sick Leave Balance</div>
                    <div className="text-xl font-semibold">{leaveCredits?.sl ?? 0}</div>
                </div>
                <div className="p-4 bg-white rounded shadow">
                    <div className="text-gray-500 text-sm">Vacation Leave Balance</div>
                    <div className="text-xl font-semibold">{leaveCredits?.vl ?? 0}</div>
                </div>

                {/* Add the Leave Request Card - spans all columns */}
                {latestLeaveRequest && (
                    <LeaveRequestCard request={latestLeaveRequest} />
                )}
            </div>
        </EmployeeLayout>
    );
}
