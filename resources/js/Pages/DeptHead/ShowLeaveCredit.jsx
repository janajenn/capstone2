import DeptHeadLayout from '@/Layouts/DeptHeadLayout';
import { usePage, Link } from '@inertiajs/react';

export default function ShowLeaveCredit() {
    const { employee, earnableLeaveCredits, nonEarnableLeaveBalances } = usePage().props;

    // Function to generate initials for avatar
    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    return (
        <DeptHeadLayout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                    <p className="text-blue-100">{employee.position} • {employee.department?.name}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${employee.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {employee.status?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Leave Credits Content */}
                    <div className="px-6 py-5">
                        {/* Earnable Leave Types (SL and VL) */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                                Earnable Leave Credits
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                These leave types accumulate points monthly and can be converted to cash.
                            </p>
                            
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Leave Type
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Code
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Current Balance
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {earnableLeaveCredits.map((credit, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {credit.type}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {credit.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {credit.balance} days
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {credit.description}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Non-Earnable Leave Types */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                                Fixed Leave Balances
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                These leave types have fixed allocations, do not accumulate monthly, and are refreshed annually.
                            </p>
                            
                            {nonEarnableLeaveBalances.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Leave Type
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Code
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Default Allocation
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Current Balance
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Description
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {nonEarnableLeaveBalances.map((balance, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {balance.type}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {balance.code}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {balance.default_days || 'N/A'} days
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {balance.balance} days
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {balance.description}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No fixed leave credits</h3>
                                    <p className="mt-1 text-sm text-gray-500">This employee doesn't have any fixed leave allocations yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Additional Information */}
                        <div className="mt-8 bg-gray-50 rounded-lg p-6">
                            <h3 className="text-md font-semibold text-gray-800 mb-2">Leave Credits Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                    <p><strong>Earnable Leaves:</strong> Sick Leave (SL) and Vacation Leave (VL) accumulate 1.25 days each per month.</p>
                                </div>
                                <div>
                                    <p><strong>Fixed Leaves:</strong> Other leave types have fixed allocations that do not accumulate monthly.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                        <Link
                            href={route('dept_head.employees')}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Employees
                        </Link>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={() => window.print()}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Print Summary
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DeptHeadLayout>
    );
}