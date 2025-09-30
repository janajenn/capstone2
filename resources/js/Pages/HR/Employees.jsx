import HRLayout from '@/Layouts/HRLayout';
import { useForm, usePage, Link, router } from '@inertiajs/react';
import { useState, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

export default function Employees({ employees, departments, filters }) {
    const { flash } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(filters?.department || '');
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const searchInputRef = useRef(null);

    const { data, setData, post, reset, errors } = useForm({
        firstname: '',
        middlename: '',
        lastname: '',
        gender: 'male',
        date_of_birth: '',
        position: '',
        department_id: '',
        status: 'active',
        contact_number: '',
        address: '',
        civil_status: '',
        biometric_id: '',
        monthly_salary: '',
        daily_rate: '',
        email: '',
        password: '',
        role: 'employee',
        is_primary: false
    });

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((term, department) => {
            router.get(route('hr.employees'), {
                search: term || null,
                department: department || null,
                page: 1 // Reset to first page when searching
            }, {
                preserveState: true,
                replace: true,
                preserveScroll: true
            });
        }, 300),
        []
    );

    // Handle search input change
    const handleSearchChange = (term) => {
        setSearchTerm(term);
        debouncedSearch(term, selectedDepartment);
    };

    // Handle department filter change
    const handleFilterChange = (departmentId) => {
        setSelectedDepartment(departmentId);
        router.get(route('hr.employees'), {
            search: searchTerm || null,
            department: departmentId || null,
            page: 1 // Reset to first page when filtering
        }, {
            preserveState: true,
            replace: true,
            preserveScroll: true
        });
    };

    // Handle pagination
    const handlePageChange = (page) => {
        router.get(route('hr.employees'), {
            search: searchTerm || null,
            department: selectedDepartment || null,
            page: page
        }, {
            preserveState: true,
            replace: true,
            preserveScroll: true
        });
    };

    // Clear all filters
    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedDepartment('');
        searchInputRef.current.value = '';
        router.get(route('hr.employees'), {}, {
            preserveState: true,
            replace: true,
            preserveScroll: true
        });
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('hr.employees.store'), {
            onSuccess: () => {
                reset();
                setIsModalOpen(false);
            }
        });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
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
                            className={`px-3 py-1 rounded-md text-sm font-medium ${
                                link.active
                                    ? 'bg-blue-600 text-white'
                                    : link.url
                                    ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
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
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                    >
                        Add Employee
                    </button>
                </div>

                {/* Success Message */}
                {flash?.success && (
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {flash.success}
                    </div>
                )}

                {/* Filters Section */}
                <div className="mb-6 bg-white rounded-xl shadow-sm p-4">
                    <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                        {/* Search Bar */}
                        <div className="flex-1">
                            <label htmlFor="search" className="sr-only">Search employees</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    ref={searchInputRef}
                                    id="search"
                                    type="text"
                                    placeholder="Search employees by name, position, or department..."
                                    defaultValue={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>
                        </div>

                        {/* Department Filter */}
                        <div className="flex items-center space-x-4">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                Department:
                            </label>
                            <select
                                value={selectedDepartment}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                className="w-full md:w-48 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            >
                                <option value="">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Clear Filters Button */}
                        {(searchTerm || selectedDepartment) && (
                            <button
                                onClick={clearAllFilters}
                                className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

               {/* Modal Backdrop */}
               {isModalOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
                        onClick={closeModal}
                    ></div>
                )}

                {/* Modal */}
                <div className={`
                    fixed inset-0 z-50 flex items-center justify-center p-4
                    transition-all duration-300 ease-in-out
                    ${isModalOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
                `}>
                    <div
                        className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-800">Add New Employee</h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={submit} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={data.firstname}
                                    onChange={e => setData('firstname', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.firstname && <div className="text-red-500 text-xs mt-1">{errors.firstname}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                                <input
                                    type="text"
                                    placeholder="Middle Name"
                                    value={data.middlename}
                                    onChange={e => setData('middlename', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.middlename && <div className="text-red-500 text-xs mt-1">{errors.middlename}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={data.lastname}
                                    onChange={e => setData('lastname', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.lastname && <div className="text-red-500 text-xs mt-1">{errors.lastname}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <select
                                    value={data.gender}
                                    onChange={e => setData('gender', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                {errors.gender && <div className="text-red-500 text-xs mt-1">{errors.gender}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={e => setData('date_of_birth', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.date_of_birth && <div className="text-red-500 text-xs mt-1">{errors.date_of_birth}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                <input
                                    type="text"
                                    placeholder="Position"
                                    value={data.position}
                                    onChange={e => setData('position', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.position && <div className="text-red-500 text-xs mt-1">{errors.position}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <select
                                    value={data.department_id}
                                    onChange={e => setData('department_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                                {errors.department_id && <div className="text-red-500 text-xs mt-1">{errors.department_id}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {errors.status && <div className="text-red-500 text-xs mt-1">{errors.status}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                <input
                                    type="text"
                                    placeholder="Contact Number"
                                    value={data.contact_number}
                                    onChange={e => setData('contact_number', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.contact_number && <div className="text-red-500 text-xs mt-1">{errors.contact_number}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    placeholder="Address"
                                    value={data.address}
                                    onChange={e => setData('address', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.address && <div className="text-red-500 text-xs mt-1">{errors.address}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                                <input
                                    type="text"
                                    placeholder="Civil Status"
                                    value={data.civil_status}
                                    onChange={e => setData('civil_status', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.civil_status && <div className="text-red-500 text-xs mt-1">{errors.civil_status}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Biometric ID</label>
                                <input
                                    type="number"
                                    placeholder="Biometric ID"
                                    value={data.biometric_id}
                                    onChange={e => setData('biometric_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.biometric_id && <div className="text-red-500 text-xs mt-1">{errors.biometric_id}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary</label>
                                <input
                                    type="number"
                                    placeholder="Monthly Salary"
                                    value={data.monthly_salary}
                                    onChange={e => setData('monthly_salary', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.monthly_salary && <div className="text-red-500 text-xs mt-1">{errors.monthly_salary}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate</label>
                                <input
                                    type="number"
                                    placeholder="Daily Rate"
                                    value={data.daily_rate}
                                    onChange={e => setData('daily_rate', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.daily_rate && <div className="text-red-500 text-xs mt-1">{errors.daily_rate}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                />
                                {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                />
                                {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={data.role}
                                    onChange={e => setData('role', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                >
                                    <option value="">Select Role</option>
                                    <option value="employee">Employee</option>
                                    <option value="hr">HR</option>
                                    <option value="dept_head">Department Head</option>
                                    <option value="admin">Admin</option>
                                </select>
                                {errors.role && <div className="text-red-500 text-xs mt-1">{errors.role}</div>}
                            </div>
                             {/* Primary Admin Toggle - Only show for admin role */}
                             {data.role === 'admin' && (
                                <div className="md:col-span-2 lg:col-span-3">
                                    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <input
                                            type="checkbox"
                                            id="is_primary"
                                            checked={data.is_primary}
                                            onChange={e => setData('is_primary', e.target.checked)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="is_primary" className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-700">
                                                Set as Primary Admin
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                This user will be the primary administrator. Only one admin can be primary at a time.
                                            </span>
                                        </label>
                                    </div>
                                    {errors.is_primary && <div className="text-red-500 text-xs mt-1">{errors.is_primary}</div>}
                                </div>
                            )}

                            <div className="md:col-span-2 lg:col-span-3 flex justify-end pt-2 space-x-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                                >
                                    Add Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Employees Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">Employee List</h2>
                        <span className="text-sm text-gray-500">
                            {employees.total} employee{employees.total !== 1 ? 's' : ''} found
                            {selectedDepartment && ` in ${departments.find(d => d.id == selectedDepartment)?.name}`}
                            {searchTerm && ` matching "${searchTerm}"`}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto bg-white shadow rounded-lg">
                            <thead>
                                <tr className="bg-gray-50 text-left">
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Position</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.data && employees.data.map(emp => (
                                    <tr key={emp.employee_id} className="border-t hover:bg-gray-50">
                                        <td className="p-4">{emp.firstname} {emp.lastname}</td>
                                        <td className="p-4">{emp.position}</td>
                                        <td className="p-4">{emp.department?.name}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <Link
                                                href={route('hr.employees.show', emp.employee_id)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {(!employees.data || employees.data.length === 0) && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500">
                                            No employees found
                                            {searchTerm && ` matching "${searchTerm}"`}
                                            {selectedDepartment && !searchTerm && ` in this department`}.
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