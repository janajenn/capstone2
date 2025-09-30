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
    const [currentTime, setCurrentTime] = useState(new Date());
    
    const { data, setData, post, processing, errors, reset } = useForm({
        to_admin_id: '',
        start_date: '',
        end_date: '',
        reason: ''
    });

    // Update current time every minute to refresh status
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        
        return () => clearInterval(timer);
    }, []);
    
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

    // Check if current user can cancel a specific delegation
    const canCancelDelegation = (delegation) => {
        // The delegator (creator) can always cancel their own delegation
        if (delegation.from_admin_id === currentUser.id) return true;
        
        // The delegatee (person delegated to) can cancel if they don't want the responsibility
        if (delegation.to_admin_id === currentUser.id) return true;
        
        // Primary admin can cancel any delegation
        if (isPrimaryAdmin) return true;
        
        return false;
    };

    const handleStartDateChange = (e) => {
        setData('start_date', e.target.value);
        if (data.end_date && e.target.value > data.end_date) {
            setData('end_date', '');
        }
    };

    // Safe data access functions with employee name fallback
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

    // Use backend-computed values directly
    const activeDelegations = delegations.filter(d => d.is_active && d.from_admin && d.to_admin);
    const futureDelegations = delegations.filter(d => d.is_future && d.from_admin && d.to_admin);
    const pastDelegations = delegations.filter(d => d.is_ended && d.from_admin && d.to_admin);
    
    // Format date for display
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
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Simple Debug Information - Safe version */}
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm">
                            <p><strong>Current Status:</strong></p>
                            <p>Time: {currentTime.toLocaleString()}</p>
                            <p>Active: {activeDelegations.length} | Scheduled: {futureDelegations.length} | Ended: {pastDelegations.length}</p>
                            {delegations.map(d => (
                                <div key={d.id} className="mt-1 text-xs">
                                    Delegation {d.id}: {formatDate(d.start_date)} to {formatDate(d.end_date)} - 
                                    Status: {d.status} | Active: {d.is_active ? 'Yes' : 'No'} | Future: {d.is_future ? 'Yes' : 'No'}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Flash Messages */}
                    {flash.success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-medium text-green-800">{flash.success}</p>
                            </div>
                        </div>
                    )}

                    {flash.error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-medium text-red-800">{flash.error}</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Delegation Management</h2>
                                    <p className="text-gray-600 mt-1">Manage approval authority delegation across administrators</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {isPrimaryAdmin && (
                                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                            </svg>
                                            Primary Admin
                                        </span>
                                    )}
                                    {activeDelegation && activeDelegation.to_admin_id === currentUser.id && (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Delegated Approver
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Current Status Card */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Approval Status</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center mb-2">
                                            <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <h4 className="font-medium text-blue-800">Active Approver</h4>
                                        </div>
                                        <p className="text-blue-700">
                                            {activeDelegation ? (
                                                <>
                                                    <strong className="text-lg">{getAdminDisplayName(activeDelegation.to_admin)}</strong>
                                                    <br />
                                                    <span className="text-sm">
                                                        Delegated by {getAdminShortName(activeDelegation.from_admin)}
                                                        <br />
                                                        Valid until {formatDate(activeDelegation.end_date)}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <strong className="text-lg">{getAdminDisplayName(delegations.find(d => d.from_admin?.is_primary)?.from_admin) || 'Primary Admin'}</strong>
                                                    <br />
                                                    <span className="text-sm">No active delegation - primary admin has approval authority</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center mb-2">
                                            <svg className="h-5 w-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <h4 className="font-medium text-gray-800">Your Permissions</h4>
                                        </div>
                                        <p className="text-gray-700">
                                            {canDelegate ? (
                                                <span className="text-green-600 flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    You can create and manage delegations
                                                </span>
                                            ) : (
                                                <span className="text-gray-600 flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                                    </svg>
                                                    View-only access
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Active & Future Delegations */}
                            {(activeDelegations.length > 0 || futureDelegations.length > 0) && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Current & Scheduled Delegations</h3>
                                    
                                    {/* Active Delegations */}
                                    {activeDelegations.map(delegation => (
                                        <div key={delegation.id} className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                            ACTIVE
                                                        </span>
                                                        <span className="text-sm text-green-600">
                                                            Until {formatDate(delegation.end_date)}
                                                        </span>
                                                    </div>
                                                    <div className="text-green-800">
                                                        <p className="font-medium">
                                                            {getAdminDisplayName(delegation.from_admin)} → {getAdminDisplayName(delegation.to_admin)}
                                                        </p>
                                                        {delegation.reason && (
                                                            <p className="text-sm mt-1">Reason: {delegation.reason}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {canCancelDelegation(delegation) && (
                                                    <button
                                                        onClick={() => cancelDelegation(delegation.id)}
                                                        disabled={actionLoading === delegation.id}
                                                        className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                        {actionLoading === delegation.id ? 'Cancelling...' : 'Cancel'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Future Delegations */}
                                    {futureDelegations.map(delegation => (
                                        <div key={delegation.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V6z" clipRule="evenodd" />
                                                            </svg>
                                                            SCHEDULED
                                                        </span>
                                                        <span className="text-sm text-yellow-600">
                                                            Starts {formatDate(delegation.start_date)}
                                                        </span>
                                                    </div>
                                                    <div className="text-yellow-800">
                                                        <p className="font-medium">
                                                            {getAdminDisplayName(delegation.from_admin)} → {getAdminDisplayName(delegation.to_admin)}
                                                        </p>
                                                        {delegation.reason && (
                                                            <p className="text-sm mt-1">Reason: {delegation.reason}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {canCancelDelegation(delegation) && (
                                                    <button
                                                        onClick={() => cancelDelegation(delegation.id)}
                                                        disabled={actionLoading === delegation.id}
                                                        className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                        {actionLoading === delegation.id ? 'Cancelling...' : 'Cancel'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Delegation Form for Active Approvers */}
                            {canDelegate && (
                                <div className="mb-8">
                                    {!showForm ? (
                                        <button
                                            onClick={() => setShowForm(true)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                            Create New Delegation
                                        </button>
                                    ) : (
                                        <form onSubmit={submit} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Delegation</h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Delegate To *
                                                    </label>
                                                    <select
                                                        value={data.to_admin_id}
                                                        onChange={e => setData('to_admin_id', e.target.value)}
                                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                        required
                                                    >
                                                        <option value="">Select an admin</option>
                                                        {availableAdmins.map(admin => (
                                                            <option key={admin.id} value={admin.id}>
                                                                {getAdminDisplayName(admin)} {admin.is_primary && '(Primary)'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.to_admin_id && <div className="text-red-600 text-sm mt-1">{errors.to_admin_id}</div>}
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Start Date *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={data.start_date}
                                                        onChange={handleStartDateChange}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                        required
                                                    />
                                                    {errors.start_date && <div className="text-red-600 text-sm mt-1">{errors.start_date}</div>}
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        End Date *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={data.end_date}
                                                        onChange={e => setData('end_date', e.target.value)}
                                                        min={data.start_date || new Date().toISOString().split('T')[0]}
                                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                        required
                                                    />
                                                    {errors.end_date && <div className="text-red-600 text-sm mt-1">{errors.end_date}</div>}
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Reason (Optional)
                                                </label>
                                                <textarea
                                                    value={data.reason}
                                                    onChange={e => setData('reason', e.target.value)}
                                                    rows={3}
                                                    placeholder="Enter reason for delegation..."
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                                {errors.reason && <div className="text-red-600 text-sm mt-1">{errors.reason}</div>}
                                            </div>
                                            
                                            <div className="flex space-x-2">
                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    {processing ? 'Creating...' : 'Create Delegation'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowForm(false);
                                                        reset();
                                                    }}
                                                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Delegation History Table */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Delegation History</h3>
                                    <span className="text-sm text-gray-500">
                                        {pastDelegations.length} record(s) found
                                    </span>
                                </div>
                                
                                {pastDelegations.length > 0 ? (
                                    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Delegated From
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Delegated To
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Period
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Reason
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {pastDelegations.map(delegation => (
                                                    <tr key={delegation.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                                    <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {getAdminShortName(delegation.from_admin)}
                                                                    </div>
                                                                    {delegation.from_admin?.is_primary && (
                                                                        <span className="text-xs text-purple-600">Primary Admin</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{getAdminShortName(delegation.to_admin)}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {formatDate(delegation.start_date)} 
                                                                <br />
                                                                <span className="text-gray-500">to</span>
                                                                <br />
                                                                {formatDate(delegation.end_date)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                                {delegation.reason || '-'}
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
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <span className="text-gray-400 text-sm">No actions available</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No delegation history</h3>
                                        <p className="mt-1 text-sm text-gray-500">Get started by creating your first delegation.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}