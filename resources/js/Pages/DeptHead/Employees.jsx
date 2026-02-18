import DeptHeadLayout from '@/Layouts/DeptHeadLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Employees({ employees, departmentName, flash }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [removingEmployee, setRemovingEmployee] = useState(null);
    const { delete: destroy } = useForm();

    // Filter employees based on search term
    const filteredEmployees = employees.data.filter(employee => 
        employee.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.department?.name && employee.department.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleRemoveFromDepartment = (employeeId) => {
        if (confirm('Are you sure you want to remove this employee from your department? This action cannot be undone.')) {
            destroy(route('dept_head.employees.remove', employeeId), {
                onSuccess: () => {
                    setRemovingEmployee(null);
                },
                onError: () => {
                    setRemovingEmployee(null);
                }
            });
        }
    };

    return (
        <DeptHeadLayout>
            <Head title="Team Management" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-amber-50 p-6">
                {/* Animated Background Elements */}
                <div className="fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-yellow-200 to-amber-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-amber-200 to-orange-200 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
                </div>

                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="relative">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent mb-2">
                                Team Management
                            </h1>
                            <p className="text-gray-600 text-lg">Manage employees in your department: {departmentName}</p>
                            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash.success && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 mb-6 rounded-2xl shadow-lg backdrop-blur-sm">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 p-2 rounded-xl bg-green-100">
                                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-lg font-semibold text-green-800">Success!</p>
                                <p className="text-green-700 mt-1">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {flash.error && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-6 mb-6 rounded-2xl shadow-lg backdrop-blur-sm">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 p-2 rounded-xl bg-red-100">
                                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-lg font-semibold text-red-800">Error</p>
                                <p className="text-red-700 mt-1">{flash.error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Employees Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-700 bg-clip-text text-transparent">
                                        {employees.total}
                                    </h2>
                                    <p className="text-sm text-gray-600">Total Employees</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Active Employees Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                                        {employees.data.filter(emp => emp.status === 'active').length}
                                    </h2>
                                    <p className="text-sm text-gray-600">Active Employees</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Inactive Employees Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-red-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-red-700 bg-clip-text text-transparent">
                                        {employees.data.filter(emp => emp.status === 'inactive').length}
                                    </h2>
                                    <p className="text-sm text-gray-600">Inactive Employees</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Section */}
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="w-full md:w-1/2 mb-4 md:mb-0">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search employees by name, position, email, or department..."
                                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300 bg-white/50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-sm text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                                {searchTerm ? filteredEmployees.length : employees.data.length} of {employees.total} employees
                            </span>
                        </div>
                    </div>
                </div>

                {/* Employees Table */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200/50">
                            <thead className="bg-gradient-to-r from-yellow-50 to-amber-50">
                                <tr>
                                    <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Employee
                                    </th>
                                    <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Position & Department
                                    </th>
                                    <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-8 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white/50 divide-y divide-gray-200/30">
                                {(searchTerm ? filteredEmployees : employees.data).length > 0 ? (
                                    (searchTerm ? filteredEmployees : employees.data).map((employee) => (
                                        <tr key={employee.employee_id} className="hover:bg-yellow-50/30 transition-all duration-300 group">
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                                        <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-lg font-semibold text-gray-900 group-hover:text-yellow-700 transition-colors">
                                                            {employee.firstname} {employee.middlename ? employee.middlename + ' ' : ''}{employee.lastname}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{employee.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="text-lg font-medium text-gray-900">{employee.position}</div>
                                                <div className="text-sm text-gray-500">
                                                    {employee.department?.name || 'No Department'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{employee.contact_number}</div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                {employee.status === 'active' ? (
                                                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200 shadow-sm">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-200 shadow-sm">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-4">
                                                    <Link
                                                       href={route('dept_head.employees.leave-credits', employee.employee_id)}
                                                        className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center font-medium"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        View Leave Credits
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-100 to-amber-100 mb-4">
                                                    <svg className="h-16 w-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900 mb-2">No employees found</h3>
                                                <p className="text-gray-600 text-lg">
                                                    {employees.total === 0 
                                                        ? `There are no employees in the ${departmentName} department.` 
                                                        : "Try adjusting your search to find what you're looking for."}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {employees.links.length > 3 && (
                        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-8 py-6 border-t border-yellow-200/50">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-sm text-gray-700 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 mb-4 sm:mb-0">
                                    Showing <span className="font-semibold text-gray-800">{employees.from}</span> to{' '}
                                    <span className="font-semibold text-gray-800">{employees.to}</span> of{' '}
                                    <span className="font-semibold text-gray-800">{employees.total}</span> results
                                </div>
                                <div className="flex space-x-2">
                                    {employees.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                                                link.active
                                                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 shadow-sm'
                                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DeptHeadLayout>
    );
}