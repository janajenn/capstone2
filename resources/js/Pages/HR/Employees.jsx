import HRLayout from '@/Layouts/HRLayout';
import { useForm, usePage, Link, router } from '@inertiajs/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import PDFPreviewModal from '@/Components/PDFPreviewModal'; // Adjust path as needed
import { generateEmployeePDF } from '@/Utils/pdfGenerator'; // Adjust path as needed
import EmployeeModal from '@/Components/EmployeeModal';


// Avatar component for male/female
const EmployeeAvatar = ({ gender, className = "w-8 h-8" }) => {
    if (gender === 'female') {
        return (
            <div className={`${className} bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
            </div>
        );
    }

    // Default to male avatar
    return (
        <div className={`${className} bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
        </div>
    );
};

// Password input with show/hide toggle
const PasswordInput = ({ value, onChange, placeholder, error, confirm = false }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <input
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-12"
                required
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
                {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                )}
            </button>
            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </div>
    );
};

// Updated Loading spinner component with higher z-index
const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[9999] flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4">
            {/* Animated Spinner */}
            <div className="flex justify-center mb-6">
                <div className="relative">
                    {/* Outer ring */}
                    <div className="w-20 h-20 border-4 border-white/20 rounded-full"></div>
                    {/* Spinning ring */}
                    <div className="w-20 h-20 border-4 border-transparent border-t-white border-r-white rounded-full animate-spin absolute top-0 left-0"></div>
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></div>
                </div>
            </div>

            {/* Loading Text */}
            <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Creating Employee Account</h3>
                <p className="text-white/70 text-sm">Please wait while we process your request</p>
                {/* Animated dots */}
                <div className="flex justify-center space-x-1 mt-4">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    </div>
);

// Capitalize first letter of each word
const capitalizeWords = (str) => {
    if (!str) return '';
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

export default function Employees({ employees, departments, filters }) {
    const { flash } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false); // New state for PDF preview
    const [selectedDepartment, setSelectedDepartment] = useState(filters?.department || '');
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const searchInputRef = useRef(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

    const { data, setData, post, reset, errors, processing } = useForm({
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

    // Get the selected department's head information
    const selectedDepartmentHead = data.department_id
        ? departments.find(dept => dept.id == data.department_id)?.head
        : null;

    // Check if department head role should be disabled
    const isDeptHeadDisabled = selectedDepartmentHead !== null;

    // Sort employees alphabetically by first name, then last name
    const sortedEmployees = {
        ...employees,
        data: employees.data ? [...employees.data].sort((a, b) => {
            const nameA = `${a.firstname} ${a.lastname}`.toLowerCase();
            const nameB = `${b.firstname} ${b.lastname}`.toLowerCase();
            return nameA.localeCompare(nameB);
        }) : []
    };

    // Add this function to handle avatar clicks
    const handleAvatarClick = (employee) => {
        setSelectedEmployee(employee);
        setIsEmployeeModalOpen(true);
    };

    // Auto-capitalize name fields
    const handleNameChange = (field, value) => {
        setData(field, capitalizeWords(value));
    };

    // Validate password confirmation
    const validatePassword = () => {
        if (data.password !== passwordConfirm) {
            setPasswordError('Passwords do not match');
            return false;
        }
        setPasswordError('');
        return true;
    };

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

    // PDF Preview Handler
    const handlePDFPreview = () => {
        if (!employees.data || employees.data.length === 0) {
            return;
        }
        setIsPDFPreviewOpen(true);
    };

    // PDF Download Handler
    const handlePDFDownload = () => {
        generateEmployeePDF(employees, departments, selectedDepartment, searchTerm);
        setIsPDFPreviewOpen(false);
    };

    const handleSearchChange = (term) => {
        setSearchTerm(term);
        debouncedSearch(term, selectedDepartment);
    };

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

        if (!validatePassword()) {
            return;
        }

        // Close modal first, then start loading
        setIsModalOpen(false);
        setIsLoading(true);

        post(route('hr.employees.store'), {
            onSuccess: () => {
                reset();
                setPasswordConfirm('');
                setIsLoading(false);
                // Success message will be shown via flash message
            },
            onError: () => {
                setIsLoading(false);
                // Reopen modal if there are errors
                setIsModalOpen(true);
            },
            preserveScroll: true
        });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
        setPasswordConfirm('');
        setPasswordError('');
    };

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
                            className={`px-3 py-1 rounded-md text-sm font-medium ${link.active
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
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
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="relative">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                                Employee Management
                            </h1>
                            <p className="text-gray-600 text-lg">Manage your workforce efficiently</p>
                            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                        </div>
                        <div className="flex space-x-3 mt-4 md:mt-0">
                            {/* Download PDF Button */}
                            <button
                                onClick={handlePDFPreview}
                                disabled={!employees.data || employees.data.length === 0}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Employee List
                            </button>

                            {/* Add Employee Button */}
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 shadow-lg"
                            >
                                + Add Employee
                            </button>
                        </div>
                    </div>
                </div>




                {/* Success Message */}
                {flash?.success && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl mb-6 flex items-center shadow-lg">
                        <div className="p-2 rounded-xl bg-emerald-500 text-white mr-3">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        {flash.success}
                    </div>
                )}

                {/* Error Message */}
                {Object.keys(errors).length > 0 && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6 flex items-center shadow-lg">
                        <div className="p-2 rounded-xl bg-red-500 text-white mr-3">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">Please fix the following errors:</p>
                            <ul className="list-disc list-inside text-sm mt-1">
                                {Object.values(errors).map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Filters Section */}
                <div className="mb-6 bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6">
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
                                    className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                />
                            </div>
                        </div>

                        {/* Department Filter */}
                        <div className="flex items-center space-x-4">
                            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                Department:
                            </label>
                            <select
                                value={selectedDepartment}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                className="w-full md:w-48 border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
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
                                className="px-4 py-3 text-sm text-gray-600 hover:text-gray-800 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 transition whitespace-nowrap bg-white/50 backdrop-blur-sm"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Loading Overlay */}
                {isLoading && <LoadingSpinner />}

                {/* PDF Preview Modal */}
                <PDFPreviewModal
                    isOpen={isPDFPreviewOpen}
                    onClose={() => setIsPDFPreviewOpen(false)}
                    onConfirm={handlePDFDownload}
                    employees={employees}
                    departments={departments}
                    selectedDepartment={selectedDepartment}
                    searchTerm={searchTerm}
                />

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 transition-opacity duration-300 flex items-start justify-center p-4 pt-12">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex">
                            {/* Form Content */}
                            <div className="flex-1 flex flex-col">
                                {/* Header */}
                                <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-8 py-6 flex justify-between items-center rounded-t-2xl">
                                    <div>
                                        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-indigo-800 bg-clip-text text-transparent">
                                            Add New Employee
                                        </h2>
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
                                                        onChange={e => handleNameChange('firstname', e.target.value)}
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
                                                        onChange={e => handleNameChange('middlename', e.target.value)}
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
                                                        onChange={e => handleNameChange('lastname', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                                        required
                                                    />
                                                    {errors.lastname && <div className="text-red-500 text-xs mt-1">{errors.lastname}</div>}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                                                    <div className="flex items-center space-x-4">
                                                        <select
                                                            value={data.gender}
                                                            onChange={e => setData('gender', e.target.value)}
                                                            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                                            required
                                                        >
                                                            <option value="male">Male</option>
                                                            <option value="female">Female</option>
                                                        </select>
                                                        <EmployeeAvatar gender={data.gender} className="w-10 h-10" />
                                                    </div>
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

                                                        <option value="single_non_solo_parent">Single (Non-Solo Parent)</option>
                                                        <option value="single_solo_parent">Single (Solo Parent)</option>

                                                        <option value="married_non_solo_parent">Married (Non-Solo Parent)</option>
                                                        <option value="married_solo_parent">Married (Solo Parent)</option>

                                                        <option value="divorced_non_solo_parent">Divorced (Non-Solo Parent)</option>
                                                        <option value="divorced_solo_parent">Divorced (Solo Parent)</option>

                                                        <option value="widowed_non_solo_parent">Widowed (Non-Solo Parent)</option>
                                                        <option value="widowed_solo_parent">Widowed (Solo Parent)</option>
                                                    </select>
                                                    {errors.civil_status && <div className="text-red-500 text-xs mt-1">{errors.civil_status}</div>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Employment Information Section */}
                                        <div className="mb-8">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
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

                                                    {/* Department Head Information */}
                                                    {data.department_id && (
                                                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-700">
                                                                        Department Head:
                                                                    </p>
                                                                    {selectedDepartmentHead ? (
                                                                        <p className="text-sm text-gray-600">
                                                                            {selectedDepartmentHead.firstname} {selectedDepartmentHead.lastname}
                                                                            - {selectedDepartmentHead.position}
                                                                        </p>
                                                                    ) : (
                                                                        <p className="text-sm text-amber-600 font-medium">
                                                                            No department head currently assigned
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {selectedDepartmentHead && (
                                                                    <div className="flex-shrink-0">
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                                            </svg>
                                                                            Head Assigned
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
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
                                            </div>
                                        </div>

                                        {/* Account Information */}
                                        <div className="mb-8">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                                Account Information
                                            </h3>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                                    <PasswordInput
                                                        value={data.password}
                                                        onChange={e => setData('password', e.target.value)}
                                                        placeholder="Password"
                                                        error={errors.password}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                                                    <PasswordInput
                                                        value={passwordConfirm}
                                                        onChange={e => setPasswordConfirm(e.target.value)}
                                                        placeholder="Confirm Password"
                                                        error={passwordError}
                                                        confirm={true}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                                                    <select
                                                        value={data.role}
                                                        onChange={e => setData('role', e.target.value)}
                                                        className={`w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${isDeptHeadDisabled && data.role === 'dept_head' ? 'bg-amber-50 border-amber-200' : ''
                                                            }`}
                                                        required
                                                    >
                                                        <option value="">Select Role</option>
                                                        <option value="employee">Employee</option>
                                                        <option value="hr">HR</option>
                                                        <option
                                                            value="dept_head"
                                                            disabled={isDeptHeadDisabled}
                                                            className={isDeptHeadDisabled ? 'text-gray-400 bg-gray-100' : ''}
                                                        >
                                                            Department Head
                                                            {isDeptHeadDisabled && ' (Already assigned)'}
                                                        </option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    {errors.role && <div className="text-red-500 text-xs mt-1">{errors.role}</div>}

                                                    {/* Role Selection Warning */}
                                                    {isDeptHeadDisabled && data.role === 'dept_head' && (
                                                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                            <div className="flex items-start">
                                                                <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                </svg>
                                                                <div>
                                                                    <p className="text-sm font-medium text-amber-800">
                                                                        Department Head Role Unavailable
                                                                    </p>
                                                                    <p className="text-sm text-amber-700 mt-1">
                                                                        This department already has a department head: <strong>{selectedDepartmentHead.firstname} {selectedDepartmentHead.lastname}</strong>.
                                                                        Only one department head can be assigned per department.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}


                                                </div>
                                            </div>
                                        </div>

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
                                                disabled={processing || (isDeptHeadDisabled && data.role === 'dept_head')}
                                                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processing ? 'Creating...' : 'Create Employee Account'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add this right before the Employees Table */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>💡 <strong>Tip:</strong> Click on employee avatars to quickly view their details and leave history</span>
                    </div>
                </div>

                {/* Employees Table */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Employee List</h2>
                        <span className="text-sm text-gray-500">
                            {sortedEmployees.total} employee{sortedEmployees.total !== 1 ? 's' : ''} found
                            {selectedDepartment && ` in ${departments.find(d => d.id == selectedDepartment)?.name}`}
                            {searchTerm && ` matching "${searchTerm}"`}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead>
                                <tr className="bg-gray-50 text-left text-sm">
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Position</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedEmployees.data && sortedEmployees.data.map(emp => (
                                    <tr key={emp.employee_id} className="border-t hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={() => handleAvatarClick(emp)}
                                                    className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                                                >
                                                    <EmployeeAvatar gender={emp.gender} />
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {emp.firstname} {emp.lastname}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{emp.email}</div>
                                                    </div>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-700">{emp.position}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                {emp.department?.name}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${emp.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full mr-2 ${emp.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                                                    }`}></span>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <Link
                                                href={route('hr.employees.show', emp.employee_id)}
                                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {(!sortedEmployees.data || sortedEmployees.data.length === 0) && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                                </svg>
                                                <p className="text-lg font-medium text-gray-600">No employees found</p>
                                                <p className="text-gray-500 mt-2">
                                                    {searchTerm && `No results matching "${searchTerm}"`}
                                                    {selectedDepartment && !searchTerm && `No employees in this department`}
                                                    {!searchTerm && !selectedDepartment && 'Get started by adding your first employee'}
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
            <EmployeeModal
                employee={selectedEmployee}
                isOpen={isEmployeeModalOpen}
                onClose={() => {
                    setIsEmployeeModalOpen(false);
                    setSelectedEmployee(null);
                }}
            />
        </HRLayout>
    );
}