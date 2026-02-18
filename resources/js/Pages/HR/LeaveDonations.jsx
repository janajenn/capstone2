import HRLayout from '@/Layouts/HRLayout';
import { usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function LeaveDonations({ donations, stats, filters }) {
    const { props } = usePage();
    const [localFilters, setLocalFilters] = useState({
        status: filters.status || 'all',
        search: filters.search || ''
    });
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [hrRemarks, setHrRemarks] = useState('');

    const handleFilterChange = (newFilters) => {
        setLocalFilters(newFilters);
        router.get('/hr/leave-donations', newFilters, {
            preserveState: true,
            replace: true
        });
    };

    const openApproveModal = (donation) => {
        setSelectedDonation(donation);
        setHrRemarks('');
        setShowApproveModal(true);
    };

    const openRejectModal = (donation) => {
        setSelectedDonation(donation);
        setHrRemarks('');
        setShowRejectModal(true);
    };

    const openViewModal = (donation) => {
        setSelectedDonation(donation);
        setShowViewModal(true);
    };

    const closeModals = () => {
        setShowApproveModal(false);
        setShowRejectModal(false);
        setShowViewModal(false);
        setSelectedDonation(null);
        setHrRemarks('');
    };

    const handleApprove = () => {
        if (!selectedDonation) return;

        router.post(`/hr/leave-donations/${selectedDonation.id}/approve`, {
            hr_remarks: hrRemarks
        }, {
            onSuccess: () => {
                Swal.fire('Success!', 'Donation request approved successfully!', 'success');
                closeModals();
            },
            onError: (errors) => {
                Swal.fire('Error!', errors.error || 'Failed to approve donation', 'error');
            }
        });
    };

    const handleReject = () => {
        if (!selectedDonation) return;

        if (!hrRemarks.trim()) {
            Swal.fire('Error!', 'Please provide remarks for rejection.', 'error');
            return;
        }

        router.post(`/hr/leave-donations/${selectedDonation.id}/reject`, {
            hr_remarks: hrRemarks
        }, {
            onSuccess: () => {
                Swal.fire('Success!', 'Donation request rejected successfully!', 'success');
                closeModals();
            },
            onError: (errors) => {
                Swal.fire('Error!', errors.error || 'Failed to reject donation', 'error');
            }
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'pending_hr': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending HR Approval' },
            'pending_recipient': { color: 'bg-orange-100 text-orange-800', label: 'Pending Recipient Acceptance' },
            'completed': { color: 'bg-green-100 text-green-800', label: 'Approved & Completed' },
            'cancelled': { color: 'bg-red-100 text-red-800', label: 'Rejected/Cancelled' }
        };

        const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // -----------------------------------------------------------------
    // ✅ SIMPLIFIED – just return the stored value, no calculation
    // -----------------------------------------------------------------
    const getDonorBalanceAfter = (donation) => {
        if (donation.status === 'completed' && donation.donor_balance_after !== null) {
            return donation.donor_balance_after;
        }
        return null;
    };

    return (
        <HRLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="relative">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                            Maternity Leave Donations
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Manage and approve maternity leave donation requests
                        </p>
                        <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                            </div>
                            <div className="p-3 rounded-2xl bg-indigo-100">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                                <h3 className="text-3xl font-bold text-yellow-600">{stats.pending}</h3>
                            </div>
                            <div className="p-3 rounded-2xl bg-yellow-100">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Approved</p>
                                <h3 className="text-3xl font-bold text-green-600">{stats.approved}</h3>
                            </div>
                            <div className="p-3 rounded-2xl bg-green-100">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Rejected</p>
                                <h3 className="text-3xl font-bold text-red-600">{stats.cancelled}</h3>
                            </div>
                            <div className="p-3 rounded-2xl bg-red-100">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by donor/recipient name, employee ID..."
                                value={localFilters.search}
                                onChange={(e) => handleFilterChange({ ...localFilters, search: e.target.value })}
                                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                            />
                        </div>
                        <div className="flex gap-4">
                            <select
                                value={localFilters.status}
                                onChange={(e) => handleFilterChange({ ...localFilters, status: e.target.value })}
                                className="border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                            >
                                <option value="all">All Status</option>
                                <option value="pending_hr">Pending HR</option>
                                <option value="pending_recipient">Pending Recipient</option>
                                <option value="completed">Approved</option>
                                <option value="cancelled">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Donations Table */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200/50">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Donation Details
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Days & Balance
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Dates
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/30">
                                {donations.data.length > 0 ? (
                                    donations.data.map((donation) => (
                                        <tr key={donation.id} className="hover:bg-white/50 transition-colors duration-200">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                            {donation.donor?.firstname?.charAt(0) || '?'}
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {donation.donor?.firstname} {donation.donor?.lastname}
                                                            <span className="text-xs text-gray-500 ml-2">(ID: {donation.donor?.employee_id})</span>
                                                        </div>
                                                        <div className="text-sm text-gray-500 truncate">
                                                            <span className="font-medium">Donating to:</span> {donation.recipient?.firstname} {donation.recipient?.lastname}
                                                            <span className="text-xs text-gray-500 ml-2">(ID: {donation.recipient?.employee_id})</span>
                                                        </div>
                                                        <div className="text-xs text-gray-400 truncate">
                                                            {donation.donor?.department?.name || 'No Dept'} • {donation.donor?.position || 'No Position'}
                                                            <span className="mx-2">→</span>
                                                            {donation.recipient?.department?.name || 'No Dept'} • {donation.recipient?.position || 'No Position'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                        {donation.days_donated} days
                                                    </span>
                                                    
                                                    {/* ✅ Completed donation - show historical snapshot */}
                                                    {donation.status === 'completed' && donation.donor_balance_after !== null && (
                                                        <div className="text-xs text-gray-600">
                                                            <span className="font-medium">Remaining after donation:</span>{' '}
                                                            {donation.donor_balance_after} days
                                                        </div>
                                                    )}
                                                    
                                                    {/* ✅ Pending donation - show current live balance */}
                                                    {donation.status !== 'completed' && donation.donor_current_balance !== null && (
                                                        <div className="text-xs text-gray-500">
                                                            <span className="font-medium">Current balance:</span>{' '}
                                                            {donation.donor_current_balance} days
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    {getStatusBadge(donation.status)}
                                                    {donation.hr_remarks && (
                                                        <div className="text-xs text-gray-500 truncate max-w-xs" title={donation.hr_remarks}>
                                                            HR: {donation.hr_remarks}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm text-gray-500">
                                                        <span className="font-medium">Requested:</span> {formatDate(donation.created_at)}
                                                    </div>
                                                    {donation.approved_at && (
                                                        <div className="text-sm text-gray-500">
                                                            <span className="font-medium">Approved:</span> {formatDate(donation.approved_at)}
                                                        </div>
                                                    )}
                                                    {donation.rejected_at && (
                                                        <div className="text-sm text-red-500">
                                                            <span className="font-medium">Rejected:</span> {formatDate(donation.rejected_at)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => openViewModal(donation)}
                                                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors duration-200 flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        View
                                                    </button>
                                                    {donation.status === 'pending_hr' && (
                                                        <>
                                                            <button
                                                                onClick={() => openApproveModal(donation)}
                                                                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => openRejectModal(donation)}
                                                                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="text-gray-500 text-sm">
                                                No donation requests found.
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {donations.links && donations.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-gray-200/30">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {donations.from} to {donations.to} of {donations.total} results
                                </div>
                                <div className="flex space-x-2">
                                    {donations.links.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            className={`px-3 py-1 rounded-lg ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ✅ FIXED: View Modal - Donation Details Section */}
                {showViewModal && selectedDonation && (
                    <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-white/20">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            Donation Request Details
                                        </h3>
                                        <p className="text-gray-600">ID: {selectedDonation.id}</p>
                                    </div>
                                    <button
                                        onClick={closeModals}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                                    >
                                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {/* Donor Information */}
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Donor Information
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center">
                                                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                                                    {selectedDonation.donor?.firstname?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {selectedDonation.donor?.firstname} {selectedDonation.donor?.lastname}
                                                    </p>
                                                    <p className="text-sm text-gray-500">ID: {selectedDonation.donor?.employee_id}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-gray-500">Department</p>
                                                    <p className="font-medium">{selectedDonation.donor?.department?.name || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Position</p>
                                                    <p className="font-medium">{selectedDonation.donor?.position || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Email</p>
                                                    <p className="font-medium text-sm truncate">{selectedDonation.donor?.email || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Contact</p>
                                                    <p className="font-medium">{selectedDonation.donor?.contact_number || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recipient Information */}
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                            </svg>
                                            Recipient Information
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center">
                                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                                                    {selectedDonation.recipient?.firstname?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {selectedDonation.recipient?.firstname} {selectedDonation.recipient?.lastname}
                                                    </p>
                                                    <p className="text-sm text-gray-500">ID: {selectedDonation.recipient?.employee_id}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-gray-500">Department</p>
                                                    <p className="font-medium">{selectedDonation.recipient?.department?.name || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Position</p>
                                                    <p className="font-medium">{selectedDonation.recipient?.position || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Email</p>
                                                    <p className="font-medium text-sm truncate">{selectedDonation.recipient?.email || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Contact</p>
                                                    <p className="font-medium">{selectedDonation.recipient?.contact_number || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ✅ FIXED: Donation Details - Using correct field names */}
                                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Donation Details
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white rounded-xl p-4">
                                            <p className="text-sm text-gray-500 mb-1">Days Donated</p>
                                            <p className="text-2xl font-bold text-blue-600">{selectedDonation.days_donated} days</p>
                                        </div>
                                        
                                        {/* ✅ Completed donation - show historical snapshot */}
                                        {selectedDonation.status === 'completed' && selectedDonation.donor_balance_after !== null && (
                                            <div className="bg-white rounded-xl p-4">
                                                <p className="text-sm text-gray-500 mb-1">Donor Balance After Donation</p>
                                                <div className="flex items-center">
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {selectedDonation.donor_balance_after} days
                                                    </p>
                                                    <div className="ml-2">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-green-600 mt-1">
                                                    ✓ Snapshot taken at approval
                                                </p>
                                            </div>
                                        )}

                                        {/* ✅ Pending donation - show current balance */}
                                        {selectedDonation.status !== 'completed' && selectedDonation.donor_current_balance !== null && (
                                            <div className="bg-white rounded-xl p-4">
                                                <p className="text-sm text-gray-500 mb-1">Donor Current Balance</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {selectedDonation.donor_current_balance} days
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    ⏳ Live balance (subject to change)
                                                </p>
                                            </div>
                                        )}
                                        
                                        <div className="bg-white rounded-xl p-4">
                                            <p className="text-sm text-gray-500 mb-1">Donation Type</p>
                                            <p className="text-lg font-medium text-gray-900">
                                                {selectedDonation.recipient?.gender === 'male' ? 'Paternity Leave' : 'Maternity Leave'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* ✅ Show calculation for completed donations only */}
                                    {selectedDonation.status === 'completed' && 
                                     selectedDonation.donor_balance_before !== null && 
                                     selectedDonation.donor_balance_after !== null && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Historical calculation at approval:</span><br />
                                                Balance before: {selectedDonation.donor_balance_before} days<br />
                                                Days donated: {selectedDonation.days_donated} days<br />
                                                <span className="font-bold text-green-600">
                                                    Remaining: {selectedDonation.donor_balance_after} days
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Timeline & Remarks */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-start">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-medium">Request Submitted</p>
                                                    <p className="text-sm text-gray-500">{formatDate(selectedDonation.created_at)}</p>
                                                </div>
                                            </div>
                                            {selectedDonation.approved_at && (
                                                <div className="flex items-start">
                                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Approved</p>
                                                        <p className="text-sm text-gray-500">{formatDate(selectedDonation.approved_at)}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedDonation.rejected_at && (
                                                <div className="flex items-start">
                                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Rejected</p>
                                                        <p className="text-sm text-gray-500">{formatDate(selectedDonation.rejected_at)}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Remarks & Notes</h4>
                                        <div className="space-y-4">
                                            {selectedDonation.hr_remarks && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 mb-1">HR Remarks:</p>
                                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedDonation.hr_remarks}</p>
                                                </div>
                                            )}
                                            {selectedDonation.donor_remarks && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 mb-1">Donor Remarks:</p>
                                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedDonation.donor_remarks}</p>
                                                </div>
                                            )}
                                            {selectedDonation.recipient_remarks && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 mb-1">Recipient Remarks:</p>
                                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedDonation.recipient_remarks}</p>
                                                </div>
                                            )}
                                            {!selectedDonation.hr_remarks && !selectedDonation.donor_remarks && !selectedDonation.recipient_remarks && (
                                                <p className="text-gray-500 italic">No remarks provided</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                {selectedDonation.status === 'pending_hr' && (
                                    <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                                        <button
                                            onClick={() => {
                                                closeModals();
                                                openApproveModal(selectedDonation);
                                            }}
                                            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200 flex items-center"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Approve Request
                                        </button>
                                        <button
                                            onClick={() => {
                                                closeModals();
                                                openRejectModal(selectedDonation);
                                            }}
                                            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 flex items-center"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Reject Request
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Approve Modal */}
                {showApproveModal && selectedDonation && (
                    <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-900">
                                        Approve Donation Request
                                    </h3>
                                    <button
                                        onClick={closeModals}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <p className="text-gray-600 mb-2">
                                        Are you sure you want to approve this donation?
                                    </p>
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-semibold">Donor:</span> {selectedDonation.donor?.firstname} {selectedDonation.donor?.lastname}<br />
                                            <span className="font-semibold">Recipient:</span> {selectedDonation.recipient?.firstname} {selectedDonation.recipient?.lastname}<br />
                                            <span className="font-semibold">Days Donated:</span> {selectedDonation.days_donated}<br />
                                            <span className="font-semibold">Donor Current Balance:</span> {selectedDonation.donor_current_balance || 0} days
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        HR Remarks (Optional)
                                    </label>
                                    <textarea
                                        value={hrRemarks}
                                        onChange={(e) => setHrRemarks(e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                        rows="3"
                                        placeholder="Add any remarks about this approval..."
                                    ></textarea>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={closeModals}
                                        className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleApprove}
                                        className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Modal */}
                {showRejectModal && selectedDonation && (
                    <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-900">
                                        Reject Donation Request
                                    </h3>
                                    <button
                                        onClick={closeModals}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <p className="text-gray-600 mb-2">
                                        Are you sure you want to reject this donation request?
                                    </p>
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-semibold">Donor:</span> {selectedDonation.donor?.firstname} {selectedDonation.donor?.lastname}<br />
                                            <span className="font-semibold">Recipient:</span> {selectedDonation.recipient?.firstname} {selectedDonation.recipient?.lastname}<br />
                                            <span className="font-semibold">Days Donated:</span> {selectedDonation.days_donated}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rejection Reason <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={hrRemarks}
                                        onChange={(e) => setHrRemarks(e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                                        rows="3"
                                        placeholder="Please provide a reason for rejection..."
                                    ></textarea>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={closeModals}
                                        className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Reject
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