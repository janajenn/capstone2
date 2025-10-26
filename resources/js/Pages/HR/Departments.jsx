import HRLayout from '@/Layouts/HRLayout';
import { usePage, useForm, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

export default function Departments({ departments, employees }) {
    const { flash } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [headSearchTerm, setHeadSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showTransferConfirm, setShowTransferConfirm] = useState(false);
    const [transferInfo, setTransferInfo] = useState(null);
    const dropdownRef = useRef(null);

    const { data, setData, post, put, reset, delete: destroy, processing, errors } = useForm({
        name: '',
        head_employee_id: '',
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter departments based on search term
    const filteredDepartments = departments.data?.filter(dept => 
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.head && dept.head.name.toLowerCase().includes(searchTerm.toLowerCase()))
    ) ?? [];

    // Filter employees for dropdown based on search
    const filteredEmployees = employees.filter(employee => 
        employee.name.toLowerCase().includes(headSearchTerm.toLowerCase()) ||
        employee.firstname.toLowerCase().includes(headSearchTerm.toLowerCase()) ||
        employee.lastname.toLowerCase().includes(headSearchTerm.toLowerCase())
    );

    // Get selected employee
    const selectedEmployee = data.head_employee_id 
        ? employees.find(emp => emp.employee_id === data.head_employee_id)
        : null;

    // Check if selected employee is already a department head
    const checkIfEmployeeIsAlreadyHead = () => {
        if (!selectedEmployee) return false;
        return selectedEmployee.is_current_dept_head && 
               selectedEmployee.current_head_department_id !== (editingDepartment?.id || null);
    };

    const openAddModal = () => {
        setIsEditing(false);
        setEditingDepartment(null);
        reset();
        setHeadSearchTerm('');
        setIsModalOpen(true);
    };

    const openEditModal = (department) => {
        setIsEditing(true);
        setEditingDepartment(department);
        const selectedHead = employees.find(emp => emp.employee_id === department.head_employee_id);
        setData({
            name: department.name,
            head_employee_id: department.head_employee_id || '',
        });
        setHeadSearchTerm(selectedHead ? selectedHead.name : '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingDepartment(null);
        setHeadSearchTerm('');
        setShowTransferConfirm(false);
        setTransferInfo(null);
        reset();
        setIsDropdownOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
    
        // Check if the selected employee is already a department head in another department
        if (selectedEmployee && checkIfEmployeeIsAlreadyHead()) {
            setTransferInfo({
                employeeName: selectedEmployee.name,
                currentDepartment: selectedEmployee.current_head_department,
                newDepartment: data.name,
                employeeId: selectedEmployee.employee_id,
                currentDepartmentId: selectedEmployee.current_head_department_id
            });
            setShowTransferConfirm(true);
            return;
        }
    
        proceedWithSubmit();
    };

    const proceedWithSubmit = () => {
        const submitData = {
            name: data.name,
            head_employee_id: data.head_employee_id
        };
    
        if (isEditing) {
            put(route('hr.departments.update', editingDepartment.id), submitData, {
                preserveScroll: true,
                onSuccess: () => closeModal(),
                onError: () => {/* Error handled by Inertia */}
            });
        } else {
            post(route('hr.departments.store'), submitData, {
                preserveScroll: true,
                onSuccess: () => closeModal(),
                onError: () => {/* Error handled by Inertia */}
            });
        }
    };
    
    const handleTransferConfirm = () => {
        const transferData = {
            name: data.name,
            head_employee_id: transferInfo.employeeId,
            transfer_from: transferInfo.currentDepartmentId,
            transfer_employee_id: transferInfo.employeeId
        };
    
        if (isEditing) {
            put(route('hr.departments.update', editingDepartment.id), transferData, {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                    setShowTransferConfirm(false);
                    setTransferInfo(null);
                },
                onError: () => setShowTransferConfirm(false)
            });
        } else {
            post(route('hr.departments.store'), transferData, {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                    setShowTransferConfirm(false);
                    setTransferInfo(null);
                },
                onError: () => setShowTransferConfirm(false)
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this department? This will remove the department head role from the current head.')) {
            destroy(route('hr.departments.delete', id));
        }
    };

    // Handle pagination
    const handlePageChange = (page) => {
        router.get(route('hr.departments'), { page }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    // Generate pagination links
    const renderPagination = () => {
        if (!departments.links || departments.links.length <= 3) return null;

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                    Showing {departments.from} to {departments.to} of {departments.total} results
                </div>
                <div className="flex space-x-1">
                    {departments.links.map((link, index) => (
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

    // Role badge component
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

    return (
        <HRLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="relative">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                                Department Management
                            </h1>
                            <p className="text-gray-600 text-lg">Manage all departments within your organization</p>
                            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 shadow-lg"
                        >
                            + Add New Department
                        </button>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash.success && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl mb-6 flex items-center shadow-lg">
                        <div className="p-2 rounded-xl bg-emerald-500 text-white mr-3">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        {flash.success}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <StatCard 
                        icon="department" 
                        value={departments.total} 
                        label="Total Departments" 
                        color="from-blue-500 to-indigo-500"
                    />
                    <StatCard 
                        icon="head" 
                        value={departments.data?.filter(dept => dept.head !== null).length || 0} 
                        label="Departments with Heads" 
                        color="from-green-500 to-emerald-500"
                    />
                    <StatCard 
                        icon="warning" 
                        value={departments.data?.filter(dept => dept.head === null).length || 0} 
                        label="Departments Needing Heads" 
                        color="from-amber-500 to-orange-500"
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
                                    placeholder="Search departments or department heads..."
                                    className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-4 md:mt-0">
                            <span className="text-sm text-gray-600">
                                {filteredDepartments.length} of {departments.total} departments
                            </span>
                        </div>
                    </div>
                </div>

                {/* Departments Table */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Department List</h2>
                        <span className="text-sm text-gray-500">
                            {filteredDepartments.length} department{filteredDepartments.length !== 1 ? 's' : ''} found
                            {searchTerm && ` matching "${searchTerm}"`}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead>
                                <tr className="bg-gray-50 text-left text-sm">
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Department Head</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDepartments.length > 0 ? (
                                    filteredDepartments.map((department) => (
                                        <DepartmentRow 
                                            key={department.id}
                                            department={department}
                                            onEdit={openEditModal}
                                            onDelete={handleDelete}
                                        />
                                    ))
                                ) : (
                                    <EmptyState 
                                        searchTerm={searchTerm}
                                        onAddDepartment={openAddModal}
                                    />
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {renderPagination()}
                </div>

                {/* Add/Edit Modal */}
                <DepartmentModal 
                    isOpen={isModalOpen}
                    isEditing={isEditing}
                    data={data}
                    setData={setData}
                    headSearchTerm={headSearchTerm}
                    setHeadSearchTerm={setHeadSearchTerm}
                    isDropdownOpen={isDropdownOpen}
                    setIsDropdownOpen={setIsDropdownOpen}
                    filteredEmployees={filteredEmployees}
                    selectedEmployee={selectedEmployee}
                    processing={processing}
                    onSubmit={handleSubmit}
                    onClose={closeModal}
                    dropdownRef={dropdownRef}
                    RoleBadge={RoleBadge}
                />

                {/* Transfer Confirmation Modal */}
                <TransferModal 
                    isOpen={showTransferConfirm}
                    transferInfo={transferInfo}
                    processing={processing}
                    onConfirm={handleTransferConfirm}
                    onCancel={() => setShowTransferConfirm(false)}
                />
            </div>
        </HRLayout>
    );
}

// Stat Card Component
const StatCard = ({ icon, value, label, color }) => {
    const icons = {
        department: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        ),
        head: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        ),
        warning: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        )
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

// Department Row Component
const DepartmentRow = ({ department, onEdit, onDelete }) => (
    <tr className="border-t hover:bg-gray-50/50 transition-colors">
        <td className="p-4">
            <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <div className="font-medium text-gray-900">{department.name}</div>
            </div>
        </td>
        <td className="p-4">
            {department.head ? (
                <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{department.head.firstname} {department.head.lastname}</div>
                        <div className="text-sm text-gray-500">{department.head.position}</div>
                    </div>
                </div>
            ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                    Not Assigned
                </span>
            )}
        </td>
        <td className="p-4">
            {department.head ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Active
                </span>
            ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Needs Attention
                </span>
            )}
        </td>
        <td className="p-4 text-right">
            <div className="flex items-center justify-end space-x-3">
                <button
                    onClick={() => onEdit(department)}
                    className="inline-flex items-center px-4 py-2 text-indigo-600 font-medium rounded-xl hover:bg-indigo-50 transition-all duration-300"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                </button>
                <button
                    onClick={() => onDelete(department.id)}
                    className="inline-flex items-center px-4 py-2 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-all duration-300"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                </button>
            </div>
        </td>
    </tr>
);

// Empty State Component
const EmptyState = ({ searchTerm, onAddDepartment }) => (
    <tr>
        <td colSpan="4" className="p-8 text-center">
            <div className="flex flex-col items-center">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-600">No departments found</h3>
                <p className="text-gray-500 mt-2">
                    {searchTerm 
                        ? `No results matching "${searchTerm}"`
                        : 'Get started by adding your first department'
                    }
                </p>
                <div className="mt-6">
                    <button
                        onClick={onAddDepartment}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Department
                    </button>
                </div>
            </div>
        </td>
    </tr>
);

// Department Modal Component
const DepartmentModal = ({ 
    isOpen, 
    isEditing, 
    data, 
    setData, 
    headSearchTerm, 
    setHeadSearchTerm, 
    isDropdownOpen, 
    setIsDropdownOpen, 
    filteredEmployees, 
    selectedEmployee, 
    processing, 
    onSubmit, 
    onClose, 
    dropdownRef,
    RoleBadge 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 transition-opacity duration-300 flex items-start justify-center p-4 pt-20">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden transform transition-all">
                <div className="px-8 py-6 border-b border-gray-200 bg-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-indigo-800 bg-clip-text text-transparent">
                            {isEditing ? 'Edit Department' : 'Add New Department'}
                        </h2>
                        <p className="text-gray-600 text-sm mt-1">
                            {isEditing ? 'Update department details and assign department head' : 'Create a new department in the system'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={onSubmit} className="px-8 py-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department Name</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                            placeholder="Enter department name"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Department Head Assignment */}
                    <div className="mb-6" ref={dropdownRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Department Head
                            <span className="text-xs text-gray-500 ml-1">(Optional)</span>
                        </label>
                        
                        <div className="relative">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={headSearchTerm}
                                    onChange={(e) => {
                                        setHeadSearchTerm(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    placeholder="Type to search all active employees..."
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm pr-10"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            {isDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                                    {filteredEmployees.length > 0 ? (
                                        filteredEmployees.map((employee) => (
                                            <div
                                                key={employee.employee_id}
                                                onClick={() => {
                                                    setData('head_employee_id', employee.employee_id);
                                                    setHeadSearchTerm(employee.name);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`px-4 py-3 cursor-pointer hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                                    data.head_employee_id === employee.employee_id 
                                                        ? 'bg-indigo-100 border-l-4 border-indigo-500' 
                                                        : ''
                                                }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="font-medium text-gray-900">{employee.name}</div>
                                                    <div className="flex items-center space-x-1">
                                                        {employee.is_current_dept_head && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                                Current Head
                                                            </span>
                                                        )}
                                                        <RoleBadge role={employee.role} />
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600 flex justify-between mt-1">
                                                    <span>{employee.position}</span>
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                                        {employee.current_department}
                                                    </span>
                                                </div>
                                                {employee.is_current_dept_head && employee.current_head_department && (
                                                    <div className="text-xs text-amber-600 mt-1">
                                                        Currently heads: {employee.current_head_department}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-gray-500 text-center">
                                            No employees found matching "{headSearchTerm}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedEmployee && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-green-800">Selected: </span>
                                            <RoleBadge role={selectedEmployee.role} />
                                            {selectedEmployee.is_current_dept_head && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                    Current Head
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm text-green-700 block mt-1">
                                            {selectedEmployee.name} - {selectedEmployee.position}
                                        </span>
                                        {selectedEmployee.is_current_dept_head && selectedEmployee.current_head_department && (
                                            <div className="text-xs text-amber-600 mt-1">
                                                Currently heads: <strong>{selectedEmployee.current_head_department}</strong>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData('head_employee_id', '');
                                            setHeadSearchTerm('');
                                        }}
                                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                            Choose from all active employees (Employees, Dept Heads, HR, and Admins)
                        </p>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-2xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={processing}
                            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-2xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition shadow-lg hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Processing...' : isEditing ? 'Update Department' : 'Add Department'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Transfer Modal Component
const TransferModal = ({ isOpen, transferInfo, processing, onConfirm, onCancel }) => {
    if (!isOpen || !transferInfo) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 transition-opacity duration-300 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden transform transition-all">
                <div className="px-8 py-6 border-b border-gray-200 bg-white">
                    <h2 className="text-xl font-bold text-gray-800">Transfer Department Head</h2>
                </div>
                <div className="px-8 py-6">
                    <div className="mb-4">
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-3 rounded-2xl bg-amber-500 text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-gray-700 text-center mb-4">
                            The employee you selected as department head is already the head of another department.
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                            <div className="text-sm text-amber-800">
                                <p><strong>Employee:</strong> {transferInfo.employeeName}</p>
                                <p><strong>Current Department:</strong> {transferInfo.currentDepartment}</p>
                                <p><strong>New Department:</strong> {transferInfo.newDepartment}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 text-center">
                            Do you want to transfer them as the department head of this new department? 
                            Their previous department will temporarily have no department head.
                        </p>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button 
                            type="button" 
                            onClick={onCancel}
                            className="px-6 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-2xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            onClick={onConfirm}
                            disabled={processing}
                            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-2xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition shadow-lg hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Transferring...' : 'Yes, Transfer'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};