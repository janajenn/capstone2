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

    const closeModals = () => {
        setShowApproveModal(false);
        setShowRejectModal(false);
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
                                placeholder="Search by donor or recipient name..."
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
                                        Days
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                        Request Date
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
                                                            {donation.donor?.firstname?.charAt(0)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {donation.donor?.firstname} {donation.donor?.lastname}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Donating to: {donation.recipient?.firstname} {donation.recipient?.lastname}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {donation.donor?.department?.name} → {donation.recipient?.department?.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                    {donation.days_donated} days
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(donation.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(donation.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {donation.status === 'pending_hr' && (
                                                    <div className="flex space-x-2">
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
                                                    </div>
                                                )}
                                                {donation.status !== 'pending_hr' && (
                                                    <span className="text-gray-400">Processed</span>
                                                )}
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

                {/* Approve Modal */}
                {showApproveModal && selectedDonation && (
                    <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                                    Approve Donation Request
                                </h3>
                                
                                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-gray-600 text-center">
                                        You are approving the donation of <strong>{selectedDonation.days_donated} days</strong> from{' '}
                                        <strong>{selectedDonation.donor?.firstname} {selectedDonation.donor?.lastname}</strong> to{' '}
                                        <strong>{selectedDonation.recipient?.firstname} {selectedDonation.recipient?.lastname}</strong>.
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Remarks (Optional)
                                    </label>
                                    <textarea
                                        value={hrRemarks}
                                        onChange={(e) => setHrRemarks(e.target.value)}
                                        placeholder="Add any remarks or notes..."
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
                                        rows="3"
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={closeModals}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleApprove}
                                        className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200"
                                    >
                                        Confirm Approval
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
                                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl shadow-lg mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                                    Reject Donation Request
                                </h3>
                                
                                <div className="bg-red-50 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-red-600 text-center">
                                        You are rejecting the donation request from{' '}
                                        <strong>{selectedDonation.donor?.firstname} {selectedDonation.donor?.lastname}</strong>.
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason for Rejection *
                                    </label>
                                    <textarea
                                        value={hrRemarks}
                                        onChange={(e) => setHrRemarks(e.target.value)}
                                        placeholder="Please provide the reason for rejection..."
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                                        rows="3"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={closeModals}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={!hrRemarks.trim()}
                                        className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        Confirm Rejection
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