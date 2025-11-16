import { Head, useForm, usePage, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function DelegationIndex() {
    const { 
        delegations, 
        availableAdmins, 
        activeDelegation, 
        canDelegate, 
        isPrimaryAdmin, 
        currentUser,
        flash 
    } = usePage().props;
    
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('current'); // 'current' or 'history'
    const [actionLoading, setActionLoading] = useState(null);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        to_admin_id: '',
        start_date: '',
        end_date: '',
        reason: ''
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.delegate-approval'), {
            onSuccess: () => {
                reset();
                setShowModal(false);
                Swal.fire({
                    title: 'Success!',
                    text: 'Delegation created successfully.',
                    icon: 'success',
                    confirmButtonColor: '#10B981',
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-2xl shadow-2xl border border-gray-200'
                    }
                });
            },
            onError: (errors) => {
                console.error('Delegation creation error:', errors);
                // Show error message in modal
                Swal.fire({
                    title: 'Error!',
                    text: 'Failed to create delegation. Please check the form for errors.',
                    icon: 'error',
                    confirmButtonColor: '#EF4444',
                });
            }
        });
    };
    
    const cancelDelegation = async (delegationId) => {
        Swal.fire({
            title: 'Cancel Delegation?',
            text: "Are you sure you want to cancel this delegation?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Cancel',
            cancelButtonText: 'Go Back',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl shadow-2xl border border-gray-200',
                title: 'text-xl font-bold text-gray-800'
            },
            buttonsStyling: false
        }).then((result) => {
            if (result.isConfirmed) {
                setActionLoading(delegationId);
                
                router.post(route('admin.cancel-delegation', delegationId), {}, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Cancelled!',
                            text: 'Delegation has been cancelled successfully.',
                            icon: 'success',
                            confirmButtonColor: '#10B981',
                            background: '#ffffff',
                            customClass: {
                                popup: 'rounded-2xl shadow-2xl border border-gray-200'
                            }
                        });
                    },
                    onError: (errors) => {
                        console.error('Error cancelling delegation:', errors);
                        Swal.fire({
                            title: 'Error!',
                            text: 'Failed to cancel delegation. Please try again.',
                            icon: 'error',
                            confirmButtonColor: '#EF4444',
                            background: '#ffffff',
                            customClass: {
                                popup: 'rounded-2xl shadow-2xl border border-gray-200'
                            }
                        });
                    },
                    onFinish: () => {
                        setActionLoading(null);
                    }
                });
            }
        });
    };

    const canCancelDelegation = (delegation) => {
        if (delegation.from_admin_id === currentUser.id) return true;
        if (delegation.to_admin_id === currentUser.id) return true;
        if (isPrimaryAdmin) return true;
        return false;
    };

    const handleStartDateChange = (e) => {
        setData('start_date', e.target.value);
        if (data.end_date && e.target.value > data.end_date) {
            setData('end_date', '');
        }
    };

    const getAdminDisplayName = (admin) => {
        if (!admin) return 'Unknown Admin';
        
        if (admin.employee) {
            const { firstname, middlename, lastname } = admin.employee;
            const fullName = `${firstname || ''} ${middlename || ''} ${lastname || ''}`.trim();
            if (fullName) return fullName;
        }
        
        return admin.name || 'Unknown Admin';
    };

    const getAdminShortName = (admin) => {
        if (!admin) return 'Unknown';
        
        if (admin.employee) {
            const { firstname, lastname } = admin.employee;
            if (firstname && lastname) return `${firstname} ${lastname}`;
            if (firstname) return firstname;
        }
        
        return admin.name || 'Unknown';
    };

    const activeDelegations = delegations.filter(d => d.is_active && d.from_admin && d.to_admin);
    const futureDelegations = delegations.filter(d => d.is_future && d.from_admin && d.to_admin);
    const pastDelegations = delegations.filter(d => d.is_ended && d.from_admin && d.to_admin);
    
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Modal component
    const DelegationModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-t-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Create New Delegation</h2>
                            <p className="text-red-100 mt-1 text-sm">
                                Delegate your approval authority to another admin
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setShowModal(false);
                                reset();
                            }}
                            className="text-red-100 hover:text-white transition-colors duration-200"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mx-6 mt-6 rounded-lg">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">What happens when you delegate?</h3>
                            <div className="mt-1 text-sm text-blue-700">
                                <ul className="list-disc list-inside space-y-1">
                                    <li>The selected admin will be able to approve/reject leave requests on your behalf</li>
                                    <li>You will temporarily lose approval authority during the delegation period</li>
                                    <li>The delegation can be cancelled anytime by you, the delegate, or the primary admin</li>
                                    <li>All actions taken by the delegate will be recorded under their name</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delegate To *
                            </label>
                            <select
                                value={data.to_admin_id}
                                onChange={e => setData('to_admin_id', e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                                required
                            >
                                <option value="">Select an admin</option>
                                {availableAdmins.map(admin => (
                                    <option key={admin.id} value={admin.id}>
                                        {getAdminDisplayName(admin)} {admin.is_primary && '(Primary)'}
                                    </option>
                                ))}
                            </select>
                            {errors.to_admin_id && <p className="text-red-600 text-sm mt-2">{errors.to_admin_id}</p>}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date *
                            </label>
                            <input
                                type="date"
                                value={data.start_date}
                                onChange={handleStartDateChange}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                                required
                            />
                            {errors.start_date && <p className="text-red-600 text-sm mt-2">{errors.start_date}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date *
                            </label>
                            <input
                                type="date"
                                value={data.end_date}
                                onChange={e => setData('end_date', e.target.value)}
                                min={data.start_date || new Date().toISOString().split('T')[0]}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                                required
                            />
                            {errors.end_date && <p className="text-red-600 text-sm mt-2">{errors.end_date}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason (Optional)
                        </label>
                        <textarea
                            value={data.reason}
                            onChange={e => setData('reason', e.target.value)}
                            rows={3}
                            placeholder="Enter reason for delegation (e.g., vacation, business trip, medical leave)..."
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                        />
                        {errors.reason && <p className="text-red-600 text-sm mt-2">{errors.reason}</p>}
                    </div>
                    
                    <div className="flex space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium disabled:opacity-50 flex items-center justify-center"
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Delegation...
                                </>
                            ) : (
                                'Create Delegation'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowModal(false);
                                reset();
                            }}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    // Tab Navigation
    const TabNavigation = () => (
        <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
                <button
                    onClick={() => setActiveTab('current')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'current'
                            ? 'border-red-500 text-red-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Current Delegations
                    {(activeDelegations.length > 0 || futureDelegations.length > 0) && (
                        <span className="ml-2 py-0.5 px-2 text-xs bg-red-100 text-red-600 rounded-full">
                            {activeDelegations.length + futureDelegations.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'history'
                            ? 'border-red-500 text-red-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Delegation History
                    {pastDelegations.length > 0 && (
                        <span className="ml-2 py-0.5 px-2 text-xs bg-gray-100 text-gray-600 rounded-full">
                            {pastDelegations.length}
                        </span>
                    )}
                </button>
            </nav>
        </div>
    );

    // Current Delegations Tab Content
    const CurrentDelegationsTab = () => (
        <div className="space-y-6">
            {/* Create Delegation Button */}
            {canDelegate && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium flex items-center shadow-md"
                    >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create New Delegation
                    </button>
                </div>
            )}

            {/* Active & Future Delegations */}
            {(activeDelegations.length > 0 || futureDelegations.length > 0) ? (
                <div className="space-y-4">
                    {activeDelegations.map(delegation => (
                        <div key={delegation.id} className="bg-white rounded-2xl shadow-lg border border-green-200 p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-full shadow-sm">
                                            ACTIVE
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Until {formatDate(delegation.end_date)}
                                        </span>
                                    </div>
                                    <div className="text-gray-900">
                                        <p className="font-bold text-lg">
                                            {getAdminDisplayName(delegation.from_admin)} → {getAdminDisplayName(delegation.to_admin)}
                                        </p>
                                        {delegation.reason && (
                                            <p className="text-gray-600 mt-2 text-sm">Reason: {delegation.reason}</p>
                                        )}
                                    </div>
                                </div>
                                {canCancelDelegation(delegation) && (
                                    <button
                                        onClick={() => cancelDelegation(delegation.id)}
                                        disabled={actionLoading === delegation.id}
                                        className="mt-4 md:mt-0 md:ml-4 px-6 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium disabled:opacity-50"
                                    >
                                        {actionLoading === delegation.id ? 'Cancelling...' : 'Cancel'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {futureDelegations.map(delegation => (
                        <div key={delegation.id} className="bg-white rounded-2xl shadow-lg border border-yellow-200 p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-sm font-medium rounded-full shadow-sm">
                                            SCHEDULED
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Starts {formatDate(delegation.start_date)}
                                        </span>
                                    </div>
                                    <div className="text-gray-900">
                                        <p className="font-bold text-lg">
                                            {getAdminDisplayName(delegation.from_admin)} → {getAdminDisplayName(delegation.to_admin)}
                                        </p>
                                        {delegation.reason && (
                                            <p className="text-gray-600 mt-2 text-sm">Reason: {delegation.reason}</p>
                                        )}
                                    </div>
                                </div>
                                {canCancelDelegation(delegation) && (
                                    <button
                                        onClick={() => cancelDelegation(delegation.id)}
                                        disabled={actionLoading === delegation.id}
                                        className="mt-4 md:mt-0 md:ml-4 px-6 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium disabled:opacity-50"
                                    >
                                        {actionLoading === delegation.id ? 'Cancelling...' : 'Cancel'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No current delegations</h3>
                    <p className="text-gray-500 mb-4">There are no active or scheduled delegations at the moment.</p>
                    {canDelegate && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                        >
                            Create Your First Delegation
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    // History Tab Content
    const HistoryTab = () => (
        <div>
            {pastDelegations.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        From
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        To
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Period
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Reason
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pastDelegations.map(delegation => (
                                    <tr key={delegation.id} className="hover:bg-gray-50 transition-colors duration-200">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {getAdminShortName(delegation.from_admin)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{getAdminShortName(delegation.to_admin)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(delegation.start_date)} - {formatDate(delegation.end_date)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {delegation.reason || 'No reason provided'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                delegation.status === 'active' 
                                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                                    : delegation.status === 'ended'
                                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                            }`}>
                                                {delegation.status_label}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No delegation history</h3>
                    <p className="text-gray-500">Get started by creating your first delegation.</p>
                </div>
            )}
        </div>
    );

    return (
        <AdminLayout>
            <Head title="Delegation Management" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Delegation Management</h1>
                                <p className="text-gray-600 mt-2">Manage approval authority delegation</p>
                            </div>
                            <div className="flex items-center space-x-2 mt-4 md:mt-0">
                                {isPrimaryAdmin && (
                                    <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-full shadow-sm">
                                        Primary Admin
                                    </span>
                                )}
                                {activeDelegation && activeDelegation.to_admin_id === currentUser.id && (
                                    <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-full shadow-sm">
                                        Delegated Approver
                                    </span>
                                )}
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

                    {/* Current Status Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <div className="flex items-center mb-4">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h3 className="ml-4 text-lg font-semibold text-gray-900">Active Approver</h3>
                            </div>
                            <div className="text-gray-700">
                                {activeDelegation ? (
                                    <div>
                                        <p className="text-xl font-bold text-gray-900 mb-1">
                                            {getAdminDisplayName(activeDelegation.to_admin)}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Delegated by {getAdminShortName(activeDelegation.from_admin)}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Valid until {formatDate(activeDelegation.end_date)}
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-xl font-bold text-gray-900 mb-1">
                                            {getAdminDisplayName(delegations.find(d => d.from_admin?.is_primary)?.from_admin) || 'Primary Admin'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            No active delegation
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <div className="flex items-center mb-4">
                                <div className="p-3 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-md">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h3 className="ml-4 text-lg font-semibold text-gray-900">Your Permissions</h3>
                            </div>
                            <div className="text-gray-700">
                                {canDelegate ? (
                                    <div className="flex items-center text-green-600 font-medium">
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Can create and manage delegations
                                    </div>
                                ) : (
                                    <div className="flex items-center text-gray-600">
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                        </svg>
                                        View-only access
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <TabNavigation />

                    {/* Tab Content */}
                    {activeTab === 'current' ? <CurrentDelegationsTab /> : <HistoryTab />}
                </div>
            </div>

            {/* Modal */}
            {showModal && <DelegationModal />}
        </AdminLayout>
    );
}