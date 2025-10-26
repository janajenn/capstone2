// resources/js/Pages/Admin/CreditConversions.jsx
import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Swal from 'sweetalert2';

const CreditConversions = ({ conversions, stats, filters }) => {
    const { flash } = usePage().props;
    const [localFilters, setLocalFilters] = useState({
        status: filters.status || 'all',
        employee: filters.employee || ''
    });
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedConversion, setSelectedConversion] = useState(null);
    const [rejectRemarks, setRejectRemarks] = useState('');

    // SweetAlert2 for success/error messages
    useEffect(() => {
        if (flash.success) {
            Swal.fire({
                title: 'Success!',
                text: flash.success,
                icon: 'success',
                confirmButtonColor: '#10B981',
                background: '#ffffff',
                customClass: {
                    popup: 'rounded-2xl shadow-2xl border border-gray-200',
                    title: 'text-xl font-bold text-green-600'
                }
            });
        }
        if (flash.error) {
            Swal.fire({
                title: 'Error!',
                text: flash.error,
                icon: 'error',
                confirmButtonColor: '#EF4444',
                background: '#ffffff',
                customClass: {
                    popup: 'rounded-2xl shadow-2xl border border-gray-200',
                    title: 'text-xl font-bold text-red-600'
                }
            });
        }
    }, [flash]);

    const updateFilters = () => {
        router.get(route('admin.credit-conversions'), localFilters, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setLocalFilters({ status: 'all', employee: '' });
        router.get(route('admin.credit-conversions'), {}, {
            preserveState: true,
            replace: true
        });
    };

    const handleApprove = (conversion) => {
        Swal.fire({
            title: 'Approve Credit Conversion?',
            text: `Are you sure you want to approve ${conversion.employee_name}'s credit conversion request for ${formatCurrency(conversion.equivalent_cash)}? This will deduct ${conversion.credits_requested} VL credits.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Approve & Deduct Credits',
            cancelButtonText: 'Cancel',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl shadow-2xl border border-gray-200',
                title: 'text-xl font-bold text-gray-800'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('admin.credit-conversions.approve', conversion.conversion_id), {}, {
                    onSuccess: () => {
                        // SweetAlert will be triggered by the flash message
                    },
                    onError: (errors) => {
                        Swal.fire({
                            title: 'Error!',
                            text: errors.error || 'Failed to approve request.',
                            icon: 'error',
                            confirmButtonColor: '#EF4444',
                        });
                    }
                });
            }
        });
    };

    const handleReject = (conversion) => {
        setSelectedConversion(conversion);
        setShowRejectModal(true);
    };

    const confirmReject = () => {
        if (!rejectRemarks.trim()) {
            Swal.fire({
                title: 'Remarks Required',
                text: 'Please provide a reason for rejection.',
                icon: 'warning',
                confirmButtonColor: '#F59E0B',
                background: '#ffffff'
            });
            return;
        }

        router.post(route('admin.credit-conversions.reject', selectedConversion.conversion_id), {
            remarks: rejectRemarks
        }, {
            onSuccess: () => {
                setShowRejectModal(false);
                setRejectRemarks('');
                setSelectedConversion(null);
                // SweetAlert will be triggered by the flash message
            },
            onError: (errors) => {
                Swal.fire({
                    title: 'Error!',
                    text: errors.error || 'Failed to reject request.',
                    icon: 'error',
                    confirmButtonColor: '#EF4444',
                });
            }
        });
    };

    const getStatusBadgeClass = (status) => {
        const classes = {
            'pending': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
            'hr_approved': 'bg-blue-100 text-blue-800 border border-blue-200',
            'dept_head_approved': 'bg-purple-100 text-purple-800 border border-purple-200',
            'admin_approved': 'bg-green-100 text-green-800 border border-green-200',
            'rejected': 'bg-red-100 text-red-800 border border-red-200'
        };
        return classes[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    // Simple Pagination Component
    const SimplePagination = () => {
        if (!conversions.links || conversions.links.length <= 3) {
            return null;
        }

        return (
            <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                    Showing {conversions.from} to {conversions.to} of {conversions.total} results
                </div>
                <div className="flex space-x-1">
                    {conversions.links[0].url && (
                        <Link
                            href={conversions.links[0].url}
                            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors duration-200 ${
                                conversions.current_page === 1
                                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            preserveState
                        >
                            Previous
                        </Link>
                    )}

                    {conversions.links.slice(1, -1).map((link, index) => (
                        <Link
                            key={index}
                            href={link.url}
                            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors duration-200 ${
                                link.active
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            preserveState
                        >
                            {link.label}
                        </Link>
                    ))}

                    {conversions.links[conversions.links.length - 1].url && (
                        <Link
                            href={conversions.links[conversions.links.length - 1].url}
                            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors duration-200 ${
                                conversions.current_page === conversions.last_page
                                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            preserveState
                        >
                            Next
                        </Link>
                    )}
                </div>
            </div>
        );
    };

    return (
        <AdminLayout>
            <Head title="Credit Conversion Requests - Admin" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Credit Conversion Requests - Admin
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Final approval for credit conversion requests. Only requests approved by Department Head are shown here.
                        </p>
                    </div>

                    {/* Stats Cards - Admin Specific */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {/* Pending Approval - Only Dept Head approved requests waiting for Admin */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-blue-100">Pending My Approval</p>
                                    <p className="text-2xl font-bold text-white">{stats.pending}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Approved - Only those approved by current Admin */}
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-green-100">Approved by Me</p>
                                    <p className="text-2xl font-bold text-white">{stats.approved}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Rejected - Only those rejected by current Admin */}
                        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-red-100">Rejected by Me</p>
                                    <p className="text-2xl font-bold text-white">{stats.rejected}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Total Requests - All requests that reached Admin level */}
                        <div className="bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-100">Total Requests</p>
                                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select 
                                        value={localFilters.status} 
                                        onChange={(e) => setLocalFilters({...localFilters, status: e.target.value})}
                                        className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending_admin">Pending Admin</option>
                                        <option value="fully_approved">Fully Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Employee</label>
                                    <input 
                                        type="text" 
                                        value={localFilters.employee} 
                                        onChange={(e) => setLocalFilters({...localFilters, employee: e.target.value})}
                                        placeholder="Search by employee name..."
                                        className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                                    />
                                </div>
                                
                                <div className="flex items-end space-x-2">
                                    <button 
                                        onClick={updateFilters}
                                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                                    >
                                        Apply Filters
                                    </button>
                                    <button 
                                        onClick={clearFilters}
                                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-medium"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Conversion Requests Table */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Employee
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Leave Type
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Credits
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Cash Equivalent
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Submitted
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {conversions.data.map((conversion) => (
                                            <tr key={conversion.conversion_id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                                            <span className="text-white font-bold text-sm">
                                                                {conversion.employee_name.split(' ').map(n => n[0]).join('')}
                                                            </span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {conversion.employee_name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {conversion.department}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 font-medium">
                                                        {conversion.leave_type_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {conversion.leave_type_code}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                        {conversion.credits_requested} days
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-green-600">
                                                        {formatCurrency(conversion.equivalent_cash)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(conversion.status)}`}>
                                                        {conversion.status_display}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(conversion.submitted_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        <Link 
                                                            href={route('admin.credit-conversions.show', conversion.conversion_id)}
                                                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200 font-medium"
                                                        >
                                                            View
                                                        </Link>
                                                        {/* Only show Approve/Reject for pending admin approval */}
                                                        {conversion.status === 'dept_head_approved' && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleApprove(conversion)}
                                                                    className="text-green-600 hover:text-green-900 transition-colors duration-200 font-medium"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleReject(conversion)}
                                                                    className="text-red-600 hover:text-red-900 transition-colors duration-200 font-medium"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {conversions.data.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-8 text-center">
                                                    <div className="text-gray-500">
                                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <p className="mt-2 text-sm font-medium">No credit conversion requests found</p>
                                                        <p className="text-xs mt-1">Only requests approved by Department Head are shown here</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Simple Pagination */}
                            <SimplePagination />
                        </div>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
                        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                            Reject Credit Conversion
                        </h3>
                        <p className="text-sm text-gray-600 text-center mb-6">
                            Are you sure you want to reject this credit conversion request?
                        </p>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for Rejection (Required)
                            </label>
                            <textarea 
                                value={rejectRemarks}
                                onChange={(e) => setRejectRemarks(e.target.value)}
                                rows="3"
                                className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                                placeholder="Please provide a reason for rejection..."
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setShowRejectModal(false)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmReject}
                                disabled={!rejectRemarks.trim()}
                                className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${
                                    !rejectRemarks.trim() 
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg'
                                }`}
                            >
                                Reject Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default CreditConversions;