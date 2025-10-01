// resources/js/Pages/Employee/Dashboard.jsx
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { usePage, Link } from '@inertiajs/react';
import LeaveRequestCard from '../Employee/LeaveRequestCard';

export default function Dashboard() {
    const { props } = usePage();
    const { userName, departmentName, leaveCredits, latestLeaveRequest } = props;

    return (
        <EmployeeLayout>
            

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

                {/* Credit Conversion Quick Access */}
                <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded shadow text-white">
                    <div className="text-green-100 text-sm">Quick Actions</div>
                    <div className="text-lg font-semibold mb-2">Convert Leave Credits</div>
                    <Link 
                        href="/employee/credit-conversion" 
                        className="inline-block bg-white text-green-600 px-3 py-1 rounded text-sm font-medium hover:bg-green-50 transition-colors"
                    >
                        Get Started →
                    </Link>
                </div>

               
                {/* {latestLeaveRequest && (
                    <LeaveRequestCard request={latestLeaveRequest} />
                )} */}
            </div>
        </EmployeeLayout>
    );
}
