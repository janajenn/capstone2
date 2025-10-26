import HRLayout from '@/Layouts/HRLayout';
import { usePage, useForm, router } from '@inertiajs/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import Swal from 'sweetalert2';

// Avatar component matching the design system
const EmployeeAvatar = ({ employee, className = "w-10 h-10" }) => {
    const getInitials = () => {
        if (!employee) return '??';
        const firstInitial = employee.firstname ? employee.firstname[0] : '';
        const lastInitial = employee.lastname ? employee.lastname[0] : '';
        return (firstInitial + lastInitial).toUpperCase();
    };

    const getFullName = () => {
        if (!employee) return 'Unknown Employee';
        return `${employee.firstname || ''} ${employee.lastname || ''}`.trim();
    };

    return (
        <div className={`${className} bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
            {getInitials()}
        </div>
    );
};

// Status badge for leave credits
const LeaveBalanceBadge = ({ balance, type }) => {
    const getConfig = (type) => {
        const configs = {
            sl: {
                gradient: 'from-blue-500 to-indigo-600',
                label: 'SL'
            },
            vl: {
                gradient: 'from-emerald-500 to-green-600',
                label: 'VL'
            }
        };
        return configs[type] || configs.sl;
    };

    const config = getConfig(type);

    return (
        <div className={`bg-gradient-to-r ${config.gradient} text-white rounded-2xl px-4 py-3 text-center shadow-lg`}>
            <div className="text-xs font-medium opacity-90">{config.label}</div>
            <div className="text-xl font-bold mt-1">{balance || 0}</div>
            <div className="text-xs opacity-80">days</div>
        </div>
    );
};

// Modal component for consistent styling
const Modal = ({ isOpen, onClose, title, children, actions }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            
            <div className="relative bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-md transform transition-all">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    {children}
                </div>

                {/* Actions */}
                {actions && (
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function LeaveCredits({ 
    employees, 
    alreadyCredited, 
    flash, 
    creditedMonth, 
    creditedYear, 
    departments, 
    filters,
    showCreditWarning,
    warningMonth,
    warningYear 
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(showCreditWarning || false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(filters?.department || '');
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const searchInputRef = useRef(null);

    const { data, setData, put, reset, processing } = useForm({
        sl_balance: '',
        vl_balance: '',
        imported_at: '',
    });

    useEffect(() => {
        if (showCreditWarning) {
            setIsWarningModalOpen(true);
        }
    }, [showCreditWarning]);

    const debouncedSearch = useCallback(
        debounce((term, department) => {
            router.get(route('hr.leave-credits'), {
                search: term || null,
                department: department || null,
                page: 1
            }, {
                preserveState: true,
                replace: true,
                preserveScroll: true
            });
        }, 300),
        []
    );

    const handleSearchChange = (term) => {
        setSearchTerm(term);
        debouncedSearch(term, selectedDepartment);
    };

    const handleFilterChange = (departmentId) => {
        setSelectedDepartment(departmentId);
        router.get(route('hr.leave-credits'), {
            search: searchTerm || null,
            department: departmentId || null,
            page: 1
        }, {
            preserveState: true,
            replace: true,
            preserveScroll: true
        });
    };

    const handlePageChange = (page) => {
        router.get(route('hr.leave-credits'), {
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
        if (searchInputRef.current) {
            searchInputRef.current.value = '';
        }
        router.get(route('hr.leave-credits'), {}, {
            preserveState: true,
            replace: true,
            preserveScroll: true
        });
    };

    const openModal = (employee) => {
        setSelectedEmployee(employee);
        
        const leaveCredit = employee.leave_credit || {};
        
        const formatDateForInput = (dateString) => {
            if (!dateString) return '';
            if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return dateString;
            }
            if (typeof dateString === 'string') {
                return dateString.split('T')[0];
            }
            return '';
        };
        
        setData({
            sl_balance: leaveCredit.sl_balance ?? 0,
            vl_balance: leaveCredit.vl_balance ?? 0,
            imported_at: formatDateForInput(leaveCredit.imported_at),
        });
        
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEmployee(null);
        reset();
    };

    const closeWarningModal = () => {
        setIsWarningModalOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        put(route('hr.leave-credits.update', selectedEmployee.employee_id), {
            onSuccess: () => {
                closeModal();
                router.reload({ 
                    only: ['employees'],
                    preserveScroll: true,
                    preserveState: true
                });
                
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Leave credits updated successfully.',
                    timer: 3000,
                    showConfirmButton: false,
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-2xl shadow-2xl border border-gray-200'
                    }
                });
            },
            onError: (errors) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update leave credits. Please try again.',
                    confirmButtonText: 'OK',
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-2xl shadow-2xl border border-gray-200'
                    }
                });
            }
        });
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
                            className={`px-3 py-1 rounded-xl text-sm font-medium ${
                                link.active
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

    const getFullName = (employee) => {
        if (!employee) return 'Unknown Employee';
        return `${employee.firstname || ''} ${employee.lastname || ''}`.trim();
    };

    return (
        <HRLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="relative">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                                Leave Credits Management
                            </h1>
                            <p className="text-gray-600 text-lg">Manage and track employee leave balances</p>
                            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
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

                {/* Employees Table */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Employee Leave Credits</h2>
                        <span className="text-sm text-gray-500">
                            {employees.total} employee{employees.total !== 1 ? 's' : ''} found
                            {selectedDepartment && ` in ${departments.find(d => d.id == selectedDepartment)?.name}`}
                            {searchTerm && ` matching "${searchTerm}"`}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead>
                                <tr className="bg-gray-50 text-left text-sm">
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Sick Leave</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Vacation Leave</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.data && employees.data.map((employee) => (
                                    <tr 
                                        key={employee.employee_id} 
                                        className="border-t hover:bg-gray-50/50 transition-colors cursor-pointer"
                                        onClick={() => router.visit(route('hr.leave-credits.show', employee.employee_id))}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <EmployeeAvatar employee={employee} />
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {getFullName(employee)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{employee.position}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                {employee.department?.name || 'No Department'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className={`text-lg font-bold ${
                                                employee.leave_credit?.sl_balance ? 'text-blue-600' : 'text-gray-400 italic'
                                            }`}>
                                                {employee.leave_credit ? employee.leave_credit.sl_balance : 'To be updated by HR'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className={`text-lg font-bold ${
                                                employee.leave_credit?.vl_balance ? 'text-green-600' : 'text-gray-400 italic'
                                            }`}>
                                                {employee.leave_credit ? employee.leave_credit.vl_balance : 'To be updated by HR'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openModal(employee);
                                                }}
                                            >
                                                Override Credits
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                
                                {(!employees.data || employees.data.length === 0) && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-lg font-medium text-gray-600">No employees found</p>
                                                <p className="text-gray-500 mt-2">
                                                    {searchTerm && `No results matching "${searchTerm}"`}
                                                    {selectedDepartment && !searchTerm && `No employees in this department`}
                                                    {!searchTerm && !selectedDepartment && 'No employees available'}
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

                {/* Edit Credits Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    title="Edit Leave Credits"
                    actions={
                        <>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={processing}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:shadow-lg transition disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    }
                >
                    {selectedEmployee && (
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                Update leave credits for <span className="font-semibold text-gray-800">{getFullName(selectedEmployee)}</span>
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <LeaveBalanceBadge balance={selectedEmployee.leave_credit?.sl_balance} type="sl" />
                                <LeaveBalanceBadge balance={selectedEmployee.leave_credit?.vl_balance} type="vl" />
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sick Leave Balance
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.sl_balance}
                                        onChange={(e) => setData('sl_balance', e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                        disabled={processing}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Vacation Leave Balance
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.vl_balance}
                                        onChange={(e) => setData('vl_balance', e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                        disabled={processing}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Import Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={data.imported_at || ''}
                                        onChange={(e) => setData('imported_at', e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                        disabled={processing}
                                    />
                                </div>
                            </form>
                        </div>
                    )}
                </Modal>

               
            </div>

            {/* Animated Background Elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
            </div>
        </HRLayout>
    );
}