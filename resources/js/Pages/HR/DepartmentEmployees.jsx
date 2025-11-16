import HRLayout from '@/Layouts/HRLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function DepartmentEmployees({ department, employees }) {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter employees based on search term (client-side on current page)
    const filteredEmployees = employees.data?.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? [];

    // Handle pagination
    const handlePageChange = (page) => {
        router.get(route('hr.departments.employees', department.id), { page }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    // Generate pagination links
    const renderPagination = () => {
        if (!employees.links || employees.links.length <= 3) return null;

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                    Showing {employees.from} to {employees.to} of {employees.total} results
                </div>
                <div className="flex space-x-1">
                    {employees.links.map((link, index) => (
                        <button
                            key={index}
                            onClick={() => link.url && handlePageChange(link.url.split('page=')[1])}
                            disabled={!link.url}
                            className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                                link.active
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                                    : link.url
                                    ? 'text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:shadow-lg'
                                    : 'text-gray-400 bg-gray-100 cursor-not-allowed border-2 border-gray-200'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <HRLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="relative">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                                Employees in {department.name}
                            </h1>
                            <p className="text-gray-600 text-lg">View and manage employees in this department</p>
                            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                        </div>
                        <Link
                            href={route('hr.departments')}
                            className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 shadow-lg"
                        >
                            ← Back to Departments
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <StatCard 
                        icon="employee" 
                        value={department.employee_count} 
                        label="Total Employees" 
                        color="from-blue-500 to-indigo-500"
                    />
                    <StatCard 
                        icon="head" 
                        value={department.head ? 1 : 0} 
                        label="Department Head Assigned" 
                        color="from-green-500 to-emerald-500"
                    />
                    <StatCard 
                        icon="active" 
                        value={department.status === 'active' ? 'Yes' : 'No'} 
                        label="Department Active" 
                        color="from-green-500 to-emerald-500"
                    />
                </div>

                {/* Search */}
                <div className="mb-6 bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex-1">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search employees by name or position..."
                                    className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-4 md:mt-0">
                            <span className="text-sm text-gray-600">
                                {filteredEmployees.length} of {employees.total} employees
                            </span>
                        </div>
                    </div>
                </div>

                {/* Employees Table */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Employee List</h2>
                        <span className="text-sm text-gray-500">
                            {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
                            {searchTerm && ` matching "${searchTerm}"`}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead>
                                <tr className="bg-gray-50 text-left text-sm">
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Position</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map((employee) => (
                                        <tr key={employee.employee_id} className="border-t hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 font-medium text-gray-900">{employee.name}</td>
                                            <td className="p-4 text-gray-600">{employee.position}</td>
                                            <td className="p-4">
                                                <RoleBadge role={employee.role} />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center">
                                            <div className="flex flex-col items-center">
                                                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <h3 className="text-lg font-medium text-gray-600">No employees found</h3>
                                                <p className="text-gray-500 mt-2">
                                                    {searchTerm 
                                                        ? `No results matching "${searchTerm}"`
                                                        : 'This department has no active employees'
                                                    }
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {renderPagination()}
                </div>
            </div>
        </HRLayout>
    );
}

// StatCard Component (reused/adapted)
const StatCard = ({ icon, value, label, color }) => {
    const icons = {
        employee: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        ),
        head: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        ),
        active: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        ),
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center">
                <div className={`p-3 rounded-2xl bg-gradient-to-r ${color}`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        {icons[icon]}
                    </svg>
                </div>
                <div className="ml-4">
                    <h2 className="text-2xl font-bold text-gray-800">{value}</h2>
                    <p className="text-sm text-gray-600">{label}</p>
                </div>
            </div>
        </div>
    );
};

// RoleBadge Component (added for role display)
const RoleBadge = ({ role }) => {
    const roleStyles = {
        employee: 'bg-blue-100 text-blue-800',
        dept_head: 'bg-purple-100 text-purple-800',
        hr: 'bg-green-100 text-green-800',
        admin: 'bg-red-100 text-red-800',
    };
    
    const roleLabels = {
        employee: 'Employee',
        dept_head: 'Dept Head',
        hr: 'HR',
        admin: 'Admin',
    };

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleStyles[role] || 'bg-gray-100 text-gray-800'}`}>
            {roleLabels[role] || role}
        </span>
    );
};