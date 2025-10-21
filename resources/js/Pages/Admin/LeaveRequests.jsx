import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm, router, Link } from "@inertiajs/react";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import AdminRecallModal from "@/Components/AdminRecallModal";

const statusColors = {
    pending_to_admin: 'bg-yellow-100 text-yellow-800',
    dept_head_requests: 'bg-purple-100 text-purple-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    recalled: 'bg-orange-100 text-orange-800'
};

const statusLabels = {
    pending_to_admin: 'Pending Admin Approval',
    dept_head_requests: 'Department Head Requests',
    approved: 'Fully Approved',
    rejected: 'Rejected',
    recalled: 'Recalled'
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
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.leave-requests.approve', id), {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire(
                            "Approved!",
                            "The leave request has been approved.",
                            "success"
                        );
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

                        Swal.fire("Error", errorMessage, "error");
                    },
                });
            }
        });
    };

    const handleReject = (id) => {
        if (!rejectRemarks.trim()) {
            Swal.fire("Error", "Please enter rejection remarks", "error");
            return;
        }

        router.post(route('admin.leave-requests.reject', id), {
            remarks: rejectRemarks
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectingId(null);
                setRejectRemarks("");
                Swal.fire("Rejected!", "The leave request has been rejected.", "success");
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
                
                Swal.fire("Error", errorMessage, "error");
            },
        });
    };

    // FIXED: Improved status determination logic
    const getRequestStatus = (request) => {
        // For specific tabs, return the tab status
        if (selectedStatus === 'approved') {
            return 'approved';
        }
        if (selectedStatus === 'recalled') {
            return 'recalled';
        }
        if (selectedStatus === 'rejected') {
            return 'rejected';
        }
        if (selectedStatus === 'dept_head_requests') {
            return 'dept_head_requests';
        }
        
        // For pending_to_admin tab
        if (selectedStatus === 'pending_to_admin' && !request.admin_approval) {
            return 'pending_to_admin';
        }
        
        // Fallback to actual status
        return request.status || 'pending_to_admin';
    };

    // FIXED: Calculate duration for display
    const getDurationDisplay = (request) => {
        // Use total_days if available from backend
        if (request.total_days) {
            return `${request.total_days} days`;
        }
        
        // Calculate working days as fallback
        const workingDays = calculateWorkingDays(request.date_from, request.date_to);
        return `${workingDays} days`;
    };

    const isDeptHeadRequest = (request) => {
        return request.is_dept_head_request || request.employee?.role === 'dept_head';
    };

    const getWorkflowType = (request) => {
        if (request.employee?.role === 'admin') {
            return "HR → Admin (Admin Request)";
        } else if (isDeptHeadRequest(request)) {
            return "HR → Admin (Dept Head Request)";
        } else {
            return "HR → Dept Head → Admin";
        }
    };

    // Show unauthorized message if user is not active approver
    if (!isActiveApprover) {
        return (
            <AdminLayout>
                <Head title="Leave Requests Management" />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
                            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        
                        <h2 className="mt-4 text-xl font-bold text-gray-900">Approval Rights Delegated</h2>
                        
                        <p className="mt-2 text-gray-600">
                            You are not currently authorized to approve leave requests.
                        </p>
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                                <strong>Current Approver:</strong> {currentApprover.name}
                            </p>
                            {currentApprover.is_primary && (
                                <span className="inline-block mt-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                                    Primary Admin
                                </span>
                            )}
                        </div>
                        
                        <div className="mt-6 space-y-3">
                            <button
                                onClick={() => router.visit(route('admin.delegation.index'))}
                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
            <div className="min-h-screen bg-gray-50 p-6">
                {/* Header Section - Matching Dept Head Style */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Leave Requests Management</h1>
                            <p className="text-gray-600 mt-1">Manage all leave requests in the system</p>
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
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-800">
                                    You are currently the active approver
                                </p>
                                <p className="text-xs text-green-600">
                                    {currentApprover.is_primary ? 'Primary Admin' : 'Delegated Approver'}
                                </p>
                            </div>
                            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash.success && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md shadow-sm">
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
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md shadow-sm">
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

                {/* Search and Filter Bar - Matching Dept Head Style */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
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
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Search by employee name, position, or leave type..."
                                />
                            </div>
                        </div>

                        {/* Department Filter */}
                        <div className="w-full md:w-64">
                            <select
                                value={selectedDepartment}
                                onChange={(e) => handleDepartmentChange(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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

                {/* Status Filter Tabs - Matching Dept Head Style */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleTabChange('pending_to_admin')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedStatus === 'pending_to_admin'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Pending to Admin
                            {selectedStatus === 'pending_to_admin' && leaveRequests.data && leaveRequests.data.length > 0 && (
                                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                    {leaveRequests.total}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('dept_head_requests')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedStatus === 'dept_head_requests'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Dept Head Requests
                            {selectedStatus === 'dept_head_requests' && leaveRequests.data && leaveRequests.data.length > 0 && (
                                <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                    {leaveRequests.total}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('approved')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedStatus === 'approved'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Fully Approved
                            {selectedStatus === 'approved' && leaveRequests.data && leaveRequests.data.length > 0 && (
                                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    {leaveRequests.total}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('rejected')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedStatus === 'rejected'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Rejected
                            {selectedStatus === 'rejected' && leaveRequests.data && leaveRequests.data.length > 0 && (
                                <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                    {leaveRequests.total}
                                </span>
                            )}
                        </button>
                        {/* NEW: Recalls Tab */}
                        <button
                            onClick={() => handleTabChange('recalled')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedStatus === 'recalled'
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Recalls
                            {selectedStatus === 'recalled' && leaveRequests.data && leaveRequests.data.length > 0 && (
                                <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                                    {leaveRequests.total}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Requests Table - Matching Dept Head Style */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employee
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Leave Type
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Dates
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Recall Details
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leaveRequests.data && leaveRequests.data.length > 0 ? (
                                    leaveRequests.data.map((request) => {
                                        const status = getRequestStatus(request);
                                        const isDeptHead = isDeptHeadRequest(request);
                                        const workflowType = getWorkflowType(request);
                                        const durationDisplay = getDurationDisplay(request);
                                        
                                        return (
                                            <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {request.employee.firstname} {request.employee.lastname}
                                                                {isDeptHead && (
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
                                                            <div className="text-xs text-blue-600 mt-1">
                                                                {workflowType}
                                                            </div>
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
                                                    {/* FIXED: Show actual number of days */}
                                                    <div className="text-sm text-gray-900 font-medium">
                                                        {durationDisplay}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {/* FIXED: Ensure status always displays */}
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                                                        {statusLabels[status] || 'Unknown Status'}
                                                    </span>
                                                </td>
                                                
                                                {/* Recall Details Column - Enhanced for Recalls Tab */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {selectedStatus === 'recalled' && request.recall_data ? (
                                                        <div className="space-y-1">
                                                            <div className="text-xs text-gray-600">
                                                                <strong>Reason:</strong> {request.recall_data.reason}
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                <strong>Original Dates:</strong> {formatDate(request.date_from)} - {formatDate(request.date_to)}
                                                            </div>
                                                            <div className="text-xs text-green-600">
                                                                <strong>New Dates:</strong> {request.recall_data.new_date_from && formatDate(request.recall_data.new_date_from)} - {request.recall_data.new_date_to && formatDate(request.recall_data.new_date_to)}
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
                                                        <span className="text-gray-400 text-xs">Not applicable</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {(selectedStatus === 'pending_to_admin' || selectedStatus === 'dept_head_requests') ? (
                                                        rejectingId === request.id ? (
                                                            <div className="space-y-2">
                                                                <textarea
                                                                    value={rejectRemarks}
                                                                    onChange={(e) => setRejectRemarks(e.target.value)}
                                                                    className="w-full border rounded p-2 text-sm"
                                                                    placeholder="Enter rejection reason (required)"
                                                                    rows={3}
                                                                    required
                                                                />
                                                                <div className="flex space-x-2 justify-end">
                                                                    <button
                                                                        onClick={() => handleReject(request.id)}
                                                                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                                                    >
                                                                        Confirm Reject
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setRejectingId(null);
                                                                            setRejectRemarks("");
                                                                        }}
                                                                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-end space-x-3">
                                                                <button
                                                                    onClick={() => router.visit(`/admin/leave-requests/${request.id}`)}
                                                                    className="text-blue-600 hover:text-blue-900 transition-colors flex items-center"
                                                                >
                                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                    View
                                                                </button>
                                                                <button
                                                                    onClick={() => handleApprove(request.id)}
                                                                    className="text-green-600 hover:text-green-900 transition-colors flex items-center"
                                                                >
                                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => setRejectingId(request.id)}
                                                                    className="text-red-600 hover:text-red-900 transition-colors flex items-center"
                                                                >
                                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )
                                                    ) : (
                                                        <div className="flex items-center justify-end">
                                                            <button
                                                                onClick={() => router.visit(`/admin/leave-requests/${request.id}`)}
                                                                className="text-blue-600 hover:text-blue-900 transition-colors flex items-center"
                                                            >
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                                View
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests found</h3>
                                            <p className="mt-1 text-sm text-gray-500">
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
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Matching Dept Head Style */}
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
                                        <button
                                            onClick={() => router.visit(leaveRequests.prev_page_url, { preserveState: true, preserveScroll: true })}
                                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
                                        >
                                            Previous
                                        </button>
                                    )}

                                    {/* Page Numbers */}
                                    {leaveRequests.links.slice(1, -1).map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true })}
                                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                link.active
                                                    ? 'bg-blue-600 text-white border border-blue-600'
                                                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}

                                    {/* Next Button */}
                                    {leaveRequests.next_page_url && (
                                        <button
                                            onClick={() => router.visit(leaveRequests.next_page_url, { preserveState: true, preserveScroll: true })}
                                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
                                        >
                                            Next
                                        </button>
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
        </AdminLayout>
    );
}