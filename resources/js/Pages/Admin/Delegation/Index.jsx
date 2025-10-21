import { Head, useForm, usePage, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState, useEffect } from 'react';

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
    
    const [showForm, setShowForm] = useState(false);
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
                setShowForm(false);
            }
        });
    };
    
    const cancelDelegation = async (delegationId) => {
        if (!confirm('Are you sure you want to cancel this delegation?')) {
            return;
        }

        setActionLoading(delegationId);
        
        try {
            await router.post(route('admin.cancel-delegation', delegationId));
        } catch (error) {
            console.error('Error cancelling delegation:', error);
        } finally {
            setActionLoading(null);
        }
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

    return (
        <AdminLayout>
            <Head title="Delegation Management" />
            
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Flash Messages */}
                {flash.success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {flash.error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">{flash.error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Delegation Management</h1>
                            <p className="text-gray-600 mt-1">Manage approval authority delegation</p>
                        </div>
                        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                            {isPrimaryAdmin && (
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                                    Primary Admin
                                </span>
                            )}
                            {activeDelegation && activeDelegation.to_admin_id === currentUser.id && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                    Delegated Approver
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Current Status Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 className="ml-3 text-lg font-semibold text-gray-900">Active Approver</h3>
                        </div>
                        <div className="text-gray-700">
                            {activeDelegation ? (
                                <div>
                                    <p className="text-xl font-semibold text-gray-900 mb-1">
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
                                    <p className="text-xl font-semibold text-gray-900 mb-1">
                                        {getAdminDisplayName(delegations.find(d => d.from_admin?.is_primary)?.from_admin) || 'Primary Admin'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        No active delegation
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 className="ml-3 text-lg font-semibold text-gray-900">Your Permissions</h3>
                        </div>
                        <div className="text-gray-700">
                            {canDelegate ? (
                                <div className="flex items-center text-green-600">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">Can create and manage delegations</span>
                                </div>
                            ) : (
                                <div className="flex items-center text-gray-600">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>View-only access</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active & Future Delegations */}
                {(activeDelegations.length > 0 || futureDelegations.length > 0) && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current & Scheduled</h2>
                        
                        <div className="space-y-4">
                            {activeDelegations.map(delegation => (
                                <div key={delegation.id} className="bg-white rounded-xl border border-green-200 p-5 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                                    ACTIVE
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    Until {formatDate(delegation.end_date)}
                                                </span>
                                            </div>
                                            <div className="text-gray-900">
                                                <p className="font-medium text-lg">
                                                    {getAdminDisplayName(delegation.from_admin)} → {getAdminDisplayName(delegation.to_admin)}
                                                </p>
                                                {delegation.reason && (
                                                    <p className="text-gray-600 mt-1 text-sm">Reason: {delegation.reason}</p>
                                                )}
                                            </div>
                                        </div>
                                        {canCancelDelegation(delegation) && (
                                            <button
                                                onClick={() => cancelDelegation(delegation.id)}
                                                disabled={actionLoading === delegation.id}
                                                className="mt-3 sm:mt-0 sm:ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium transition-colors"
                                            >
                                                {actionLoading === delegation.id ? 'Cancelling...' : 'Cancel'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {futureDelegations.map(delegation => (
                                <div key={delegation.id} className="bg-white rounded-xl border border-yellow-200 p-5 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
                                                    SCHEDULED
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    Starts {formatDate(delegation.start_date)}
                                                </span>
                                            </div>
                                            <div className="text-gray-900">
                                                <p className="font-medium text-lg">
                                                    {getAdminDisplayName(delegation.from_admin)} → {getAdminDisplayName(delegation.to_admin)}
                                                </p>
                                                {delegation.reason && (
                                                    <p className="text-gray-600 mt-1 text-sm">Reason: {delegation.reason}</p>
                                                )}
                                            </div>
                                        </div>
                                        {canCancelDelegation(delegation) && (
                                            <button
                                                onClick={() => cancelDelegation(delegation.id)}
                                                disabled={actionLoading === delegation.id}
                                                className="mt-3 sm:mt-0 sm:ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium transition-colors"
                                            >
                                                {actionLoading === delegation.id ? 'Cancelling...' : 'Cancel'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Create Delegation Form */}
                {canDelegate && (
                    <div className="mb-8">
                        {!showForm ? (
                            <button
                                onClick={() => setShowForm(true)}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center shadow-sm"
                            >
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Create New Delegation
                            </button>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Delegation</h3>
                                
                                <form onSubmit={submit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Delegate To *
                                            </label>
                                            <select
                                                value={data.to_admin_id}
                                                onChange={e => setData('to_admin_id', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                required
                                            >
                                                <option value="">Select an admin</option>
                                                {availableAdmins.map(admin => (
                                                    <option key={admin.id} value={admin.id}>
                                                        {getAdminDisplayName(admin)} {admin.is_primary && '(Primary)'}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.to_admin_id && <p className="text-red-600 text-sm mt-1">{errors.to_admin_id}</p>}
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
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                required
                                            />
                                            {errors.start_date && <p className="text-red-600 text-sm mt-1">{errors.start_date}</p>}
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
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                required
                                            />
                                            {errors.end_date && <p className="text-red-600 text-sm mt-1">{errors.end_date}</p>}
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
                                            placeholder="Enter reason for delegation..."
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                        />
                                        {errors.reason && <p className="text-red-600 text-sm mt-1">{errors.reason}</p>}
                                    </div>
                                    
                                    <div className="flex space-x-3">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors flex items-center"
                                        >
                                            {processing ? 'Creating...' : 'Create Delegation'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowForm(false);
                                                reset();
                                            }}
                                            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {/* Delegation History */}
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Delegation History</h2>
                        <span className="text-sm text-gray-500 mt-2 sm:mt-0">
                            {pastDelegations.length} record(s)
                        </span>
                    </div>
                    
                    {pastDelegations.length > 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                From
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                To
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Period
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {pastDelegations.map(delegation => (
                                            <tr key={delegation.id} className="hover:bg-gray-50 transition-colors">
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
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        delegation.status === 'active' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : delegation.status === 'ended'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-gray-100 text-gray-800'
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
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No delegation history</h3>
                            <p className="text-gray-500">Get started by creating your first delegation.</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}