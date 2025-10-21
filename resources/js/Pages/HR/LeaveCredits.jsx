import HRLayout from '@/Layouts/HRLayout';
import { usePage, useForm, router } from '@inertiajs/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import Swal from 'sweetalert2';

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

    // Use the form hook
    const { data, setData, put, reset, processing } = useForm({
        sl_balance: '',
        vl_balance: '',
        imported_at: '',
    });

    // Auto-show warning modal when component loads with showCreditWarning
    useEffect(() => {
        if (showCreditWarning) {
            setIsWarningModalOpen(true);
        }
    }, [showCreditWarning]);

    // Debounced search function
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

    // Handle search input change
    const handleSearchChange = (term) => {
        setSearchTerm(term);
        debouncedSearch(term, selectedDepartment);
    };

    // Handle department filter change
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

    // Handle pagination
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

    // Clear all filters
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
        console.log('Opening modal for employee:', {
            employeeId: employee.employee_id,
            employeeName: getFullName(employee),
            leave_credit: employee.leave_credit,
            imported_at: employee.leave_credit?.imported_at
        });
        
        setSelectedEmployee(employee);
        
        const leaveCredit = employee.leave_credit || {};
        
        // Convert the ISO date to YYYY-MM-DD format for the date input
        const formatDateForInput = (dateString) => {
            if (!dateString) return '';
            
            // If it's already in YYYY-MM-DD format, return as is
            if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return dateString;
            }
            
            // If it's an ISO string like "2025-08-01T00:00:00.000000Z"
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
                
                // Refresh the page data to get updated employee information
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
                    showConfirmButton: false
                });
            },
            onError: (errors) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update leave credits. Please try again.',
                    confirmButtonText: 'OK'
                });
            }
        });
    };

    const handleMonthlyCredit = () => {
        if (alreadyCredited) {
            const monthYear = `${creditedMonth} ${creditedYear}`;
            Swal.fire({
                icon: 'warning',
                title: 'Already Added',
                text: `Leave credits for ${monthYear} have already been added.`,
                confirmButtonText: 'OK'
            });
            return;
        }

        router.post(route('hr.leave-credits.monthly-add'), {}, {
            preserveScroll: true,
            onSuccess: (page) => {
                const { creditedMonth, creditedYear } = page.props;
                const monthYear = `${creditedMonth} ${creditedYear}`;

                // Close warning modal if it's open
                setIsWarningModalOpen(false);

                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: `Monthly leave credits for ${monthYear} were successfully added.`,
                    timer: 3000,
                    showConfirmButton: false
                });
            },
            onError: (errors) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to add monthly credits. Please try again.',
                    confirmButtonText: 'OK'
                });
            }
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
                            className={`px-3 py-1 rounded-md text-sm font-medium ${link.active
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

    // Get initials safely
    const getInitials = (employee) => {
        if (!employee) return '??';
        const firstInitial = employee.firstname ? employee.firstname[0] : '';
        const lastInitial = employee.lastname ? employee.lastname[0] : '';
        return (firstInitial + lastInitial).toUpperCase();
    };

    // Get full name safely
    const getFullName = (employee) => {
        if (!employee) return 'Unknown Employee';
        return `${employee.firstname || ''} ${employee.lastname || ''}`.trim();
    };

    return (
        <HRLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-gray-900">Manage Leave Credits</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            View and manage employee leave credits
                        </p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                    <button
    onClick={handleMonthlyCredit}
    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${alreadyCredited ? 'bg-gray-400 ' : 'bg-blue-600 hover:bg-blue-700'}`}
>
    {alreadyCredited ? (
        <>
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Monthly Credits Added for {creditedMonth} {creditedYear}
        </>
    ) : (
        <>
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Add {creditedMonth} {creditedYear} Credits (+1.25)
        </>
    )}
</button>
                    </div>
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

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Employee Leave Credits</h2>
                        <span className="text-sm text-gray-500">
                            {employees.total} employee{employees.total !== 1 ? 's' : ''} found
                            {selectedDepartment && ` in ${departments.find(d => d.id == selectedDepartment)?.name}`}
                            {searchTerm && ` matching "${searchTerm}"`}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employee Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SL Balance
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        VL Balance
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {employees.data && employees.data.map((employee) => (
                                    <tr 
                                        key={employee.employee_id} 
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => router.visit(route('hr.leave-credits.show', employee.employee_id))}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="font-medium text-blue-800">
                                                        {getInitials(employee)}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {getFullName(employee)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{employee.position}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {employee.department?.name || 'No Department'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">
                                                {employee.leave_credit ? (
                                                    employee.leave_credit.sl_balance
                                                ) : (
                                                    <span className="text-gray-400 italic">To be updated by HR</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">
                                                {employee.leave_credit ? (
                                                    employee.leave_credit.vl_balance
                                                ) : (
                                                    <span className="text-gray-400 italic">To be updated by HR</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent row click when clicking button
                                                    openModal(employee);
                                                }}
                                            >
                                                Override
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                
                                {(!employees.data || employees.data.length === 0) && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
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

                {/* Edit Credits Modal */}
                {isModalOpen && selectedEmployee && (
                    <div className="fixed inset-0 overflow-y-auto z-50">
                        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeModal}></div>
                            </div>

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                Edit Leave Credits
                                            </h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500">
                                                    Update leave credits for {getFullName(selectedEmployee)}
                                                </p>
                                            </div>
                                            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                                <div>
                                                    <label htmlFor="sl_balance" className="block text-sm font-medium text-gray-700">
                                                        Sick Leave Balance
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        id="sl_balance"
                                                        value={data.sl_balance}
                                                        onChange={(e) => setData('sl_balance', e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        disabled={processing}
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="vl_balance" className="block text-sm font-medium text-gray-700">
                                                        Vacation Leave Balance
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        id="vl_balance"
                                                        value={data.vl_balance}
                                                        onChange={(e) => setData('vl_balance', e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        disabled={processing}
                                                    />
                                                </div>

                                                <div>
                                                    <label htmlFor="imported_at" className="block text-sm font-medium text-gray-700">
                                                        Imported At (if migrated from old record)
                                                    </label>
                                                    <input
                                                        type="date"
                                                        id="imported_at"
                                                        value={data.imported_at || ''}
                                                        onChange={(e) => setData('imported_at', e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
                                                                focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        disabled={processing}
                                                    />
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={processing}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={processing}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Monthly Credit Warning Modal */}
                {isWarningModalOpen && (
                    <div className="fixed inset-0 overflow-y-auto z-50">
                        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeWarningModal}></div>
                            </div>

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                Monthly Credit Reminder
                                            </h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500">
                                                    The month is about to end. You need to add monthly credits now. 
                                                    If you skip this, you won't be able to go back and add them later.
                                                </p>
                                                <p className="text-sm text-gray-700 mt-2 font-medium">
                                                    Current Month: {warningMonth} {warningYear}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={handleMonthlyCredit}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Add Monthly Credits Now
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeWarningModal}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Remind Me Later
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </HRLayout>
    );
}