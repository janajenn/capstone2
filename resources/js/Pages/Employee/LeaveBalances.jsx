import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { usePage } from '@inertiajs/react';

export default function LeaveBalances() {
    const { props } = usePage();
    const { earnableLeaveCredits, nonEarnableLeaveBalances, employee } = props;

    return (
        <EmployeeLayout>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Leave Balances</h1>
                        <p className="text-gray-600 mt-2">
                            View your current leave credits and balances
                        </p>
                    </div>

                    {/* Employee Info Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {employee.firstname} {employee.lastname}
                                </h2>
                                <p className="text-gray-600">{employee.position}</p>
                                <p className="text-gray-500 text-sm">{employee.department?.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Employee ID</p>
                                <p className="font-mono text-gray-900">{employee.employee_id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Earnable Leave Credits (SL & VL) */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Earnable Leave Credits</h2>
                            <p className="text-gray-600 text-sm">
                                These leaves accumulate monthly and can be converted to cash
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Leave Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Current Balance
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {earnableLeaveCredits.map((credit, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {credit.type}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Code: {credit.code}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    credit.balance > 0 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {credit.balance} days
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {credit.description}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Non-Earnable Leave Balances */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Fixed Leave Allocations</h2>
                            <p className="text-gray-600 text-sm">
                                These leaves have fixed annual allocations
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Leave Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Annual Allocation
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Days Used
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Current Balance
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {nonEarnableLeaveBalances.length > 0 ? (
                                        nonEarnableLeaveBalances.map((balance, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {balance.type}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Code: {balance.code}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {balance.default_days} days
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {balance.total_used} days
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        balance.balance > 0 
                                                            ? 'bg-blue-100 text-blue-800' 
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {balance.balance} days
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                        Fixed Allocation
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                                                No fixed leave allocations found for this year.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Information Section */}
                    <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <ul className="list-disc list-inside space-y-1">
                                        <li><strong>Sick Leave (SL) & Vacation Leave (VL):</strong> Accumulate 1.25 days each month and can be converted to cash</li>
                                        <li><strong>Fixed Leave Allocations:</strong> Renew annually with fixed number of days</li>
                                        <li>Balances are updated in real-time after leave approvals</li>
                                        <li>For questions about your leave balances, contact HR</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}