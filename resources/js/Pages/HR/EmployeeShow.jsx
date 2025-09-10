// resources/js/Pages/HR/EmployeeShow.jsx
import HRLayout from '@/Layouts/HRLayout';
import { usePage,Link  } from '@inertiajs/react';

export default function EmployeeShow() {
    const { employee } = usePage().props;

    // Function to generate initials for avatar
    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    // Function to format currency
    const formatCurrency = (amount) => {
        if (!amount) return 'N/A';
        return `₱${parseFloat(amount).toLocaleString()}`;
    };

    // Function to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <HRLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Header Section */}
                    <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="h-16 w-16 flex-shrink-0 bg-blue-700 rounded-full flex items-center justify-center text-2xl font-bold">
                                    {getInitials(employee.firstname, employee.lastname)}
                                </div>
                                <div className="ml-4">
                                    <h1 className="text-2xl font-bold">
                                        {employee.firstname} {employee.middlename} {employee.lastname}
                                    </h1>
                                    <p className="text-blue-100">{employee.position}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${employee.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}>
                                {employee.status?.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* Employee Details */}
                    <div className="px-6 py-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Personal Information */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Personal Information</h2>
                                <div className="space-y-3">
                                    <div className="flex">
                                        <div className="w-1/3 text-gray-500">Gender</div>
                                        <div className="w-2/3 font-medium capitalize">{employee.gender || 'N/A'}</div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 text-gray-500">Date of Birth</div>
                                        <div className="w-2/3 font-medium">{formatDate(employee.date_of_birth)}</div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 text-gray-500">Civil Status</div>
                                        <div className="w-2/3 font-medium capitalize">{employee.civil_status || 'N/A'}</div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 text-gray-500">Contact Number</div>
                                        <div className="w-2/3 font-medium">{employee.contact_number || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Work Information */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Work Information</h2>
                                <div className="space-y-3">
                                    <div className="flex">
                                        <div className="w-1/3 text-gray-500">Department</div>
                                        <div className="w-2/3 font-medium">{employee.department?.name || 'N/A'}</div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 text-gray-500">Position</div>
                                        <div className="w-2/3 font-medium">{employee.position || 'N/A'}</div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 text-gray-500">Biometric ID</div>
                                        <div className="w-2/3 font-medium">{employee.biometric_id || 'N/A'}</div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 text-gray-500">Employment Status</div>
                                        <div className="w-2/3 font-medium capitalize">{employee.status || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Compensation */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Compensation</h2>
                                <div className="space-y-3">
                                    <div className="flex">
                                        <div className="w-1/3 text-gray-500">Monthly Salary</div>
                                        <div className="w-2/3 font-medium">
                                            {formatCurrency(employee.monthly_salary)}
                                        </div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 text-gray-500">Daily Rate</div>
                                        <div className="w-2/3 font-medium">
                                            {formatCurrency(employee.daily_rate)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Contact Information</h2>
                                <div className="space-y-3">
                                    <div className="flex">
                                        <div className="w-1/3 text-gray-500">Email</div>
                                        <div className="w-2/3 font-medium">{employee.user?.email || 'N/A'}</div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/3 text-gray-500">Address</div>
                                        <div className="w-2/3 font-medium">{employee.address || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Leave Credits - Only show if available */}
                            {employee.leave_credit && (
                                <div className="md:col-span-2">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Leave Credits</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h3 className="text-sm font-medium text-blue-800">Sick Leave</h3>
                                            <p className="text-2xl font-bold text-blue-600">
                                                {employee.leave_credit.sl_balance || 0}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <h3 className="text-sm font-medium text-green-800">Vacation Leave</h3>
                                            <p className="text-2xl font-bold text-green-600">
                                                {employee.leave_credit.vl_balance || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end space-x-3">
                            <Link
                    href={route('hr.employees')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Back to List
                </Link>


                <Link
    href={route('hr.employees.edit', employee.employee_id)}
    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
>
    Edit Employee
</Link>
                        </div>
                    </div>
                </div>
            </div>
        </HRLayout>
    );
}
