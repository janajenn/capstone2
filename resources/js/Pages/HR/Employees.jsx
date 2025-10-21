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

    const debouncedSearch = useCallback(
        debounce((term, department) => {
            const params = {};
            
            if (term && term.trim() !== '') {
                params.search = term;
            }
            
            if (department && department !== '') {
                params.department = department;
            }
    
            router.get(route('hr.employees'), params, {
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
        const params = {};
        
        if (searchTerm && searchTerm.trim() !== '') {
            params.search = searchTerm;
        }
        
        if (departmentId && departmentId !== '') {
            params.department = departmentId;
        }
    
        router.get(route('hr.employees'), params, {
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
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={closeModal}
    ></div>
)}

{/* Modal */}
<div className={`
    fixed inset-0 z-50 flex items-start justify-center p-4 pt-12
    transition-all duration-300 ease-in-out
    ${isModalOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
`}>
    <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex"
        onClick={(e) => e.stopPropagation()}
    >
        {/* Illustration Sidebar */}
        <div className="hidden lg:flex flex-col justify-center items-center w-2/5 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-l-2xl p-8">
            <div className="text-center mb-8">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Add Employee</h3>
                <p className="text-gray-600">Fill in the details to create a new employee account</p>
            </div>
            
            <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-4 bg-blue-300 rounded-full opacity-30 animate-pulse delay-75"></div>
                <div className="absolute inset-8 bg-blue-400 rounded-full opacity-40 animate-pulse delay-150"></div>
                
                {/* Person Illustration */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                        <div className="w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center">
                            <svg className="w-20 h-20 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Secure & encrypted data storage</span>
                </div>
            </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-8 py-6 flex justify-between items-center rounded-tr-2xl">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Add New Employee</h2>
                    <p className="text-gray-600 text-sm mt-1">Create a new employee account in the system</p>
                </div>
                <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto">
                <form onSubmit={submit} className="p-8">
                    {/* Personal Information Section */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={data.firstname}
                                    onChange={e => setData('firstname', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                />
                                {errors.firstname && <div className="text-red-500 text-xs mt-1">{errors.firstname}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                                <input
                                    type="text"
                                    placeholder="Middle Name"
                                    value={data.middlename}
                                    onChange={e => setData('middlename', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.middlename && <div className="text-red-500 text-xs mt-1">{errors.middlename}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={data.lastname}
                                    onChange={e => setData('lastname', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                />
                                {errors.lastname && <div className="text-red-500 text-xs mt-1">{errors.lastname}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                                <select
                                    value={data.gender}
                                    onChange={e => setData('gender', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                {errors.gender && <div className="text-red-500 text-xs mt-1">{errors.gender}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                                <input
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={e => setData('date_of_birth', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                />
                                {errors.date_of_birth && <div className="text-red-500 text-xs mt-1">{errors.date_of_birth}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Civil Status</label>
                                <select
                                    value={data.civil_status}
                                    onChange={e => setData('civil_status', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                >
                                    <option value="">Select Status</option>
                                    <option value="single">Single</option>
                                    <option value="married">Married</option>
                                    <option value="divorced">Divorced</option>
                                    <option value="widowed">Widowed</option>
                                </select>
                                {errors.civil_status && <div className="text-red-500 text-xs mt-1">{errors.civil_status}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Employment Information Section */}
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                            Employment Information
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
                                <input
                                    type="text"
                                    placeholder="Position"
                                    value={data.position}
                                    onChange={e => setData('position', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                />
                                {errors.position && <div className="text-red-500 text-xs mt-1">{errors.position}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                                <select
                                    value={data.department_id}
                                    onChange={e => setData('department_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                                {errors.department_id && <div className="text-red-500 text-xs mt-1">{errors.department_id}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                                <select
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {errors.status && <div className="text-red-500 text-xs mt-1">{errors.status}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Biometric ID</label>
                                <input
                                    type="number"
                                    placeholder="Biometric ID"
                                    value={data.biometric_id}
                                    onChange={e => setData('biometric_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.biometric_id && <div className="text-red-500 text-xs mt-1">{errors.biometric_id}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary</label>
                                <input
                                    type="number"
                                    placeholder="Monthly Salary"
                                    value={data.monthly_salary}
                                    onChange={e => setData('monthly_salary', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.monthly_salary && <div className="text-red-500 text-xs mt-1">{errors.monthly_salary}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Rate</label>
                                <input
                                    type="number"
                                    placeholder="Daily Rate"
                                    value={data.daily_rate}
                                    onChange={e => setData('daily_rate', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.daily_rate && <div className="text-red-500 text-xs mt-1">{errors.daily_rate}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Contact & Account Information */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                            Contact & Account Information
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                                <input
                                    type="text"
                                    placeholder="Contact Number"
                                    value={data.contact_number}
                                    onChange={e => setData('contact_number', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.contact_number && <div className="text-red-500 text-xs mt-1">{errors.contact_number}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                <input
                                    type="text"
                                    placeholder="Address"
                                    value={data.address}
                                    onChange={e => setData('address', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                                {errors.address && <div className="text-red-500 text-xs mt-1">{errors.address}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                />
                                {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                />
                                {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                                <select
                                    value={data.role}
                                    onChange={e => setData('role', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
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
                        </div>
                    </div>

                    {/* Primary Admin Toggle */}
                    {data.role === 'admin' && (
                        <div className="mb-8">
                            <div className="flex items-center space-x-4 p-6 bg-blue-50 rounded-xl border border-blue-200">
                                <input
                                    type="checkbox"
                                    id="is_primary"
                                    checked={data.is_primary}
                                    onChange={e => setData('is_primary', e.target.checked)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="is_primary" className="flex flex-col">
                                    <span className="text-lg font-medium text-gray-700">
                                        Set as Primary Administrator
                                    </span>
                                    <span className="text-sm text-gray-600 mt-1">
                                        This user will have full system administration privileges. Only one admin can be primary at a time.
                                    </span>
                                </label>
                            </div>
                            {errors.is_primary && <div className="text-red-500 text-xs mt-1">{errors.is_primary}</div>}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition shadow-lg hover:shadow-xl"
                        >
                            Create Employee Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
                {/* Employees Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-sm font-semibold text-gray-800">Employee List</h2>
                        <span className="text-sm text-gray-500">
                            {employees.total} employee{employees.total !== 1 ? 's' : ''} found
                            {selectedDepartment && ` in ${departments.find(d => d.id == selectedDepartment)?.name}`}
                            {searchTerm && ` matching "${searchTerm}"`}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto bg-white shadow rounded-lg">
                            <thead>
                                <tr className="bg-gray-50 text-left text-sm">
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