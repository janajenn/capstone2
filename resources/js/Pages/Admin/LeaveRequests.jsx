import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm, router, Link } from "@inertiajs/react";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import AdminRecallModal from "@/Components/AdminRecallModal"; // Make sure this import exists

const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'pending_to_admin': 'bg-yellow-100 text-yellow-800',
    'dept_head_requests': 'bg-purple-100 text-purple-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'recalled': 'bg-orange-100 text-orange-800',
    'hr_approved': 'bg-blue-100 text-blue-800',
    'dept_head_approved': 'bg-purple-100 text-purple-800',
    'admin_approved': 'bg-green-100 text-green-800',
    'cancelled': 'bg-gray-100 text-gray-800'
};

const statusLabels = {
    'pending': 'Pending',
    'pending_to_admin': 'Pending Admin Approval',
    'dept_head_requests': 'Department Head Requests',
    'approved': 'Fully Approved',
    'rejected': 'Rejected',
    'recalled': 'Recalled',
    'hr_approved': 'HR Approved',
    'dept_head_approved': 'Dept Head Approved',
    'admin_approved': 'Admin Approved',
    'cancelled': 'Cancelled'
};

const getStatusDisplay = (status) => {
    const statusMap = {
        'pending_to_admin': { label: 'Pending Admin Approval', color: 'bg-yellow-100 text-yellow-800' },
        'dept_head_requests': { label: 'Department Head Requests', color: 'bg-purple-100 text-purple-800' },
        'approved': { label: 'Fully Approved', color: 'bg-green-100 text-green-800' },
        'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-800' },
        'recalled': { label: 'Recalled', color: 'bg-orange-100 text-orange-800' },
        'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
        'hr_approved': { label: 'HR Approved', color: 'bg-blue-100 text-blue-800' },
        'dept_head_approved': { label: 'Dept Head Approved', color: 'bg-purple-100 text-purple-800' },
        'admin_approved': { label: 'Admin Approved', color: 'bg-green-100 text-green-800' },
        'cancelled': { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
        'expired': { label: 'Expired', color: 'bg-gray-100 text-gray-800' }
    };

    const display = statusMap[status] || { 
        label: status || 'Unknown Status', 
        color: 'bg-gray-100 text-gray-800' 
    };
    
    return display;
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Helper function to calculate working days between two dates
const calculateWorkingDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
};

export default function LeaveRequests({ leaveRequests, filters, flash, currentApprover, isActiveApprover, departments }) {
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectRemarks, setRejectRemarks] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'pending_to_admin');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department || '');
    const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
    const [selectedLeaveRequest, setSelectedLeaveRequest] = useState(null);

    // Handle tab change
    const handleTabChange = (status) => {
        setSelectedStatus(status);
        updateFilters({ status });
    };

    // Handle search
    const handleSearch = (search) => {
        setSearchTerm(search);
        updateFilters({ search });
    };

    // Handle department filter
    const handleDepartmentChange = (department) => {
        setSelectedDepartment(department);
        updateFilters({ department });
    };

    // Update filters with debouncing for search
    const updateFilters = (newFilters) => {
        const currentFilters = {
            status: selectedStatus,
            search: searchTerm,
            department: selectedDepartment,
            ...newFilters
        };

        router.get(route('admin.leave-requests.index'), currentFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    // Debounced search
    useEffect(() => {
        if (filters.search !== undefined) {
            const timeoutId = setTimeout(() => {
                if (searchTerm !== filters.search) {
                    handleSearch(searchTerm);
                }
            }, 500);

            return () => clearTimeout(timeoutId);
        }
    }, [searchTerm]);

    // Handle recall click
    const handleRecallClick = (leaveRequest) => {
        setSelectedLeaveRequest(leaveRequest);
        setIsRecallModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsRecallModalOpen(false);
        setSelectedLeaveRequest(null);
    };

    const handleApprove = (id) => {
        Swal.fire({
            title: "Approve this leave request?",
            text: "This will approve the leave request and deduct leave credits if applicable",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, approve",
            cancelButtonText: "Cancel",
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl shadow-2xl border border-gray-200',
                title: 'text-xl font-bold text-gray-800',
                confirmButton: 'px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium',
                cancelButton: 'px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-medium'
            },
            buttonsStyling: false
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.leave-requests.approve', id), {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: "Approved!",
                            text: "The leave request has been approved.",
                            icon: "success",
                            confirmButtonColor: '#10B981',
                            background: '#ffffff',
                            customClass: {
                                popup: 'rounded-2xl shadow-2xl border border-gray-200'
                            }
                        });
                        router.reload({ only: ['leaveRequests'] });
                    },
                    onError: (errors) => {
                        console.error('Approval error:', errors);
                        let errorMessage = "There was a problem approving the request";

                        if (errors.error) {
                            errorMessage = errors.error;
                        } else if (errors.message) {
                            errorMessage = errors.message;
                        }

                        Swal.fire({
                            title: "Error",
                            text: errorMessage,
                            icon: "error",
                            confirmButtonColor: '#EF4444',
                            background: '#ffffff',
                            customClass: {
                                popup: 'rounded-2xl shadow-2xl border border-gray-200'
                            }
                        });
                    },
                });
            }
        });
    };

    const handleReject = (id) => {
        if (!rejectRemarks.trim()) {
            Swal.fire({
                title: "Error",
                text: "Please enter rejection remarks",
                icon: "error",
                confirmButtonColor: '#EF4444',
                background: '#ffffff',
                customClass: {
                    popup: 'rounded-2xl shadow-2xl border border-gray-200'
                }
            });
            return;
        }

        router.post(route('admin.leave-requests.reject', id), {
            remarks: rejectRemarks
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectingId(null);
                setRejectRemarks("");
                Swal.fire({
                    title: "Rejected!",
                    text: "The leave request has been rejected.",
                    icon: "success",
                    confirmButtonColor: '#10B981',
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-2xl shadow-2xl border border-gray-200'
                    }
                });
                router.reload({ only: ['leaveRequests'] });
            },
            onError: (errors) => {
                console.error('Rejection error:', errors);
                let errorMessage = "There was a problem rejecting the request";
                
                if (errors.remarks) {
                    errorMessage = errors.remarks[0];
                } else if (errors.error) {
                    errorMessage = errors.error;
                } else if (errors.message) {
                    errorMessage = errors.message;
                }
                
                Swal.fire({
                    title: "Error",
                    text: errorMessage,
                    icon: "error",
                    confirmButtonColor: '#EF4444',
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-2xl shadow-2xl border border-gray-200'
                    }
                });
            },
        });
    };

    // Show unauthorized message if user is not active approver
    if (!isActiveApprover) {
        return (
            <AdminLayout>
                <Head title="Leave Requests Management" />
                <div className="py-6">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Approval Rights Delegated</h2>
                            
                            <p className="text-gray-600 mb-6">
                                You are not currently authorized to approve leave requests.
                            </p>
                            
                            <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-4 border border-red-100 mb-6">
                                <p className="text-sm text-red-800">
                                    <strong>Current Approver:</strong> {currentApprover.name}
                                </p>
                                {currentApprover.is_primary && (
                                    <span className="inline-block mt-2 px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full">
                                        Primary Admin
                                    </span>
                                )}
                            </div>
                            
                            <button
                                onClick={() => router.visit(route('admin.delegation.index'))}
                                className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                            >
                                Manage Delegation
                            </button>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Head title="Leave Requests Management" />
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header Section - Red Theme */}
                    <div className="mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Leave Requests Management</h1>
                                <p className="text-gray-600 mt-2">Manage all leave requests in the system</p>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <p className="text-sm text-gray-500">
                                    Showing {leaveRequests.from || 0} to {leaveRequests.to || 0} of {leaveRequests.total || 0} results
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Current Approver Status */}
                    <div className="mb-6">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-800">
                                        You are currently the active approver
                                    </p>
                                    <p className="text-xs text-green-600">
                                        {currentApprover.is_primary ? 'Primary Admin' : 'Delegated Approver'}
                                    </p>
                                </div>
                                <div className="p-2 bg-green-100 rounded-xl">
                                    <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Flash Messages */}
                    {flash.success && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 mb-6 rounded-2xl shadow-sm">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-green-700">{flash.success}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {flash.error && (
                        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 mb-6 rounded-2xl shadow-sm">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{flash.error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search and Filter Bar - Red Theme */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search Bar */}
                            <div className="flex-1">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                                        placeholder="Search by employee name, position, or leave type..."
                                    />
                                </div>
                            </div>

                            {/* Department Filter */}
                            <div className="w-full md:w-64">
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => handleDepartmentChange(e.target.value)}
                                    className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                                >
                                    <option value="">All Departments</option>
                                    {departments?.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Status Filter Tabs - Red Theme */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleTabChange('pending_to_admin')}
                                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                    selectedStatus === 'pending_to_admin'
                                        ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                                }`}
                            >
                                Pending to Admin
                                {selectedStatus === 'pending_to_admin' && leaveRequests.data && leaveRequests.data.length > 0 && (
                                    <span className="ml-2 bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                                        {leaveRequests.total}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => handleTabChange('dept_head_requests')}
                                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                    selectedStatus === 'dept_head_requests'
                                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                                }`}
                            >
                                Dept Head Requests
                                {selectedStatus === 'dept_head_requests' && leaveRequests.data && leaveRequests.data.length > 0 && (
                                    <span className="ml-2 bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                                        {leaveRequests.total}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => handleTabChange('approved')}
                                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                    selectedStatus === 'approved'
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                                }`}
                            >
                                Fully Approved
                                {selectedStatus === 'approved' && leaveRequests.data && leaveRequests.data.length > 0 && (
                                    <span className="ml-2 bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                                        {leaveRequests.total}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => handleTabChange('rejected')}
                                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                    selectedStatus === 'rejected'
                                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                                }`}
                            >
                                Rejected
                                {selectedStatus === 'rejected' && leaveRequests.data && leaveRequests.data.length > 0 && (
                                    <span className="ml-2 bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                                        {leaveRequests.total}
                                    </span>
                                )}
                            </button>
                            {/* NEW: Recalls Tab */}
                            <button
                                onClick={() => handleTabChange('recalled')}
                                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                    selectedStatus === 'recalled'
                                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                                }`}
                            >
                                Recalls
                                {selectedStatus === 'recalled' && leaveRequests.data && leaveRequests.data.length > 0 && (
                                    <span className="ml-2 bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                                        {leaveRequests.total}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Requests Table - Red Theme */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Leave Type
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Dates
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Duration
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Recall Details
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {leaveRequests.data && leaveRequests.data.length > 0 ? (
                                        leaveRequests.data.map((request) => (
                                            <tr key={request.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md">
                                                            <span className="text-white font-bold text-sm">
                                                                {request.employee.firstname[0]}{request.employee.lastname[0]}
                                                            </span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {request.employee.firstname} {request.employee.lastname}
                                                                {request.employee?.role === 'dept_head' && (
                                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                        Dept Head
                                                                    </span>
                                                                )}
                                                                {request.employee?.role === 'admin' && (
                                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                        Admin
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-500">{request.employee.department}</div>
                                                            <div className="text-sm text-gray-500">{request.employee.position}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{request.leaveType.name}</div>
                                                    <div className="text-sm text-gray-500">({request.leaveType.code})</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {formatDate(request.date_from)} to {formatDate(request.date_to)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 font-medium">
                                                        {request.total_days || calculateWorkingDays(request.date_from, request.date_to)} days
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {(() => {
                                                        const statusDisplay = getStatusDisplay(request.status);
                                                        return (
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusDisplay.color}`}>
                                                                {statusDisplay.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
    {selectedStatus === 'recalled' && request.recall_data ? (
        <div className="space-y-1">
            <div className="text-xs text-gray-600">
                <strong>Reason:</strong> {request.recall_data.reason}
            </div>
            <div className="text-xs text-gray-500">
                Recalled on: {request.recall_data.recalled_at && formatDate(request.recall_data.recalled_at)}
            </div>
        </div>
    ) : request.can_be_recalled ? (
        <button
            onClick={() => handleRecallClick(request)}
            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
        >
            Recall
        </button>
    ) : request.has_recall ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Recalled
        </span>
    ) : (
        <span className="text-gray-400 text-xs">N/A</span>
    )}
</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {(selectedStatus === 'pending_to_admin' || selectedStatus === 'dept_head_requests') ? (
                                                        rejectingId === request.id ? (
                                                            <div className="space-y-2">
                                                                <textarea
                                                                    value={rejectRemarks}
                                                                    onChange={(e) => setRejectRemarks(e.target.value)}
                                                                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                                                                    placeholder="Enter rejection reason (required)"
                                                                    rows={3}
                                                                    required
                                                                />
                                                                <div className="flex space-x-2 justify-end">
                                                                    <button
                                                                        onClick={() => handleReject(request.id)}
                                                                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                                                                    >
                                                                        Confirm Reject
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setRejectingId(null);
                                                                            setRejectRemarks("");
                                                                        }}
                                                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-medium"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-end space-x-3">
                                                                <Link
                                                                    href={`/admin/leave-requests/${request.id}`}
                                                                    className="text-blue-600 hover:text-blue-900 transition-colors duration-200 font-medium"
                                                                >
                                                                    View
                                                                </Link>
                                                                <button
                                                                    onClick={() => handleApprove(request.id)}
                                                                    className="text-green-600 hover:text-green-900 transition-colors duration-200 font-medium"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => setRejectingId(request.id)}
                                                                    className="text-red-600 hover:text-red-900 transition-colors duration-200 font-medium"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )
                                                    ) : (
                                                        <div className="flex items-center justify-end">
                                                            <Link
                                                                href={`/admin/leave-requests/${request.id}`}
                                                                className="text-blue-600 hover:text-blue-900 transition-colors duration-200 font-medium"
                                                            >
                                                                View
                                                            </Link>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center">
                                                <div className="text-gray-500">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="mt-2 text-sm font-medium">No leave requests found</p>
                                                    <p className="text-xs mt-1">
                                                        {selectedStatus === 'pending_to_admin' 
                                                            ? 'There are no leave requests pending admin approval.' 
                                                            : selectedStatus === 'dept_head_requests'
                                                            ? 'There are no department head leave requests.'
                                                            : selectedStatus === 'approved'
                                                            ? 'There are no fully approved leave requests.'
                                                            : selectedStatus === 'rejected'
                                                            ? 'There are no rejected leave requests.'
                                                            : 'There are no recalled leave requests.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination - Red Theme */}
                        {leaveRequests.data && leaveRequests.data.length > 0 && (
                            <div className="bg-white px-6 py-4 border-t border-gray-200">
                                <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                                    <div className="text-sm text-gray-700">
                                        Showing <span className="font-semibold">{leaveRequests.from}</span> to <span className="font-semibold">{leaveRequests.to}</span> of{' '}
                                        <span className="font-semibold">{leaveRequests.total}</span> results
                                    </div>
                                    <div className="flex space-x-1">
                                        {/* Previous Button */}
                                        {leaveRequests.prev_page_url && (
                                            <Link
                                                href={leaveRequests.prev_page_url}
                                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200"
                                                preserveState
                                            >
                                                Previous
                                            </Link>
                                        )}

                                        {/* Page Numbers */}
                                        {leaveRequests.links.slice(1, -1).map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url}
                                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                                    link.active
                                                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white border border-red-500'
                                                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                                                }`}
                                                preserveState
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}

                                        {/* Next Button */}
                                        {leaveRequests.next_page_url && (
                                            <Link
                                                href={leaveRequests.next_page_url}
                                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200"
                                                preserveState
                                            >
                                                Next
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Admin Recall Modal */}
                    <AdminRecallModal
                        isOpen={isRecallModalOpen}
                        onClose={handleCloseModal}
                        leaveRequest={selectedLeaveRequest}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}