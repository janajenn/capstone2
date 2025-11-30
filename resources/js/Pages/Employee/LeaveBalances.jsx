import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { usePage, router } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { debounce } from 'lodash';

export default function LeaveBalances() {
    const { props } = usePage();
    const { 
        earnableLeaveCredits, 
        nonEarnableLeaveBalances, 
        employee, 
        receivedDonations = [], 
        eligibleRecipients = [], 
        canDonate = false 
    } = props;
    
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // HR Approval Modal States
    const [showHrApprovalModal, setShowHrApprovalModal] = useState(false);
    const [pendingDonations, setPendingDonations] = useState([]);

    // Initialize search results with eligible recipients
    useEffect(() => {
        setSearchResults(eligibleRecipients);
    }, [eligibleRecipients]);

    // Debounced search function
    const debouncedSearch = useMemo(
        () =>
            debounce(async (searchValue) => {
                if (!searchValue.trim()) {
                    setSearchResults(eligibleRecipients);
                    setIsSearching(false);
                    return;
                }

                setIsSearching(true);
                try {
                    const response = await fetch(`/employee/search-recipients?search=${encodeURIComponent(searchValue)}`);
                    const data = await response.json();
                    setSearchResults(data);
                } catch (error) {
                    console.error('Search failed:', error);
                    setSearchResults(eligibleRecipients);
                } finally {
                    setIsSearching(false);
                }
            }, 300),
        [eligibleRecipients]
    );

    // Handle search input change
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    // Clear search when modal closes
    useEffect(() => {
        if (!showDonationModal) {
            setSearchTerm('');
            setSearchResults(eligibleRecipients);
        }
    }, [showDonationModal, eligibleRecipients]);

    const openDonationModal = () => {
        setShowDonationModal(true);
        setSearchResults(eligibleRecipients);
    };

    const closeDonationModal = () => {
        setShowDonationModal(false);
        setSelectedRecipient('');
        setSearchTerm('');
    };

    // Add this useEffect to check for pending donations on component mount
    useEffect(() => {
        checkPendingDonations();
    }, []);

    const checkPendingDonations = async () => {
        try {
            const response = await fetch('/hr/leave-donations/pending');
            const data = await response.json();
            if (data.pending_count > 0) {
                setPendingDonations(data.donations || []);
                setShowHrApprovalModal(true);
            }
        } catch (error) {
            console.error('Error checking pending donations:', error);
        }
    };

    const showErrorAlert = (message) => {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'OK'
        });
    };

    const showSuccessAlert = (message) => {
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: message,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'OK'
        });
    };

    const handleDonate = () => {
        if (!selectedRecipient) {
            showErrorAlert('Please select a recipient');
            return;
        }

        setIsLoading(true);
        
        router.post('/employee/donate-maternity-leave', {
            recipient_employee_id: selectedRecipient,
            days: 7
        }, {
            onSuccess: () => {
                showSuccessAlert('Donation request submitted successfully! Waiting for HR approval.');
                closeDonationModal();
            },
            onError: (errors) => {
                showErrorAlert('Donation failed: ' + (errors.error || 'An error occurred'));
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };

    // Find maternity leave balance
    const maternityBalance = nonEarnableLeaveBalances.find(balance => 
        balance.code === 'ML'
    );

    // Find paternity leave balance
    const paternityBalance = nonEarnableLeaveBalances.find(balance => 
        balance.code === 'PL'
    );

    // Calculate total donated days for paternity leave
    const totalDonatedDays = receivedDonations.reduce((total, donation) => total + donation.days_donated, 0);

    const canShowDonateButton = canDonate && 
                               maternityBalance && 
                               maternityBalance.balance >= 7 &&
                               employee.gender?.toLowerCase() === 'female';

    return (
        <EmployeeLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 p-6">
                {/* Animated Background Elements */}
                <div className="fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-emerald-200 to-green-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-green-200 to-teal-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
                </div>

                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="relative">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-emerald-900 bg-clip-text text-transparent mb-2">
                                Leave Balances
                            </h1>
                            <p className="text-gray-600 text-lg">
                                View your current leave credits and allocations
                            </p>
                            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
                        </div>
                    </div>

                    {/* Employee Info Card */}
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-8 mb-8 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-emerald-800 bg-clip-text text-transparent">
                                    {employee.firstname} {employee.lastname}
                                </h2>
                                <p className="text-gray-600 text-sm">{employee.position}</p>
                                <p className="text-gray-500">{employee.department?.name}</p>
                                <p className="text-gray-500 text-sm">Gender: {employee.gender}</p>
                            </div>
                            
                        </div>
                    </div>

                    {/* Donation History Section - Show if user has received donations */}
                    {receivedDonations.length > 0 && (
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl shadow-2xl p-8 mb-8 hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-sm font-semibold text-white">Received Maternity Leave Donations</h3>
                                    <div className="mt-2 text-emerald-100">
                                        <p>You have received maternity leave donations from female colleagues:</p>
                                        <ul className="list-disc list-inside space-y-1 mt-3">
                                            {receivedDonations.map((donation) => (
                                                <li key={donation.id} className="text-sm">
                                                    <strong>{donation.days_donated} days</strong> from {donation.donor_name} 
                                                    on {donation.donated_at}
                                                </li>
                                            ))}
                                        </ul>
                                        {totalDonatedDays > 0 && (
                                            <p className="mt-3 font-semibold text-white">
                                                Total donated to your paternity leave: <span className="text-emerald-100">{totalDonatedDays} days</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fixed Leave Allocations */}
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl mb-8 hover:shadow-2xl transition-all duration-300">
                        <div className="px-8 py-6 border-b border-white/20 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-emerald-800 bg-clip-text text-transparent">
                                    Fixed Leave Allocations
                                </h2>
                                <p className="text-gray-600">
                                    These leaves have fixed annual allocations
                                </p>
                            </div>
                            {canShowDonateButton && (
                                <button
                                    onClick={openDonationModal}
                                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 shadow-lg"
                                >
                                    Donate 7 Days Maternity Leave
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200/50">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                            Leave Type
                                        </th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                            Annual Allocation
                                        </th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                            Days Used
                                        </th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                            Current Balance
                                        </th>
                                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                            Type
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200/30">
                                    {nonEarnableLeaveBalances.length > 0 ? (
                                        nonEarnableLeaveBalances.map((balance) => (
                                            <tr key={balance.code} className="hover:bg-white/50 transition-colors duration-200">
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {balance.type}
                                                            {balance.code === 'ML' && canDonate && (
                                                                <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                                                                    Can Donate
                                                                </span>
                                                            )}
                                                            {balance.code === 'PL' && totalDonatedDays > 0 && (
                                                                <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                                    +{totalDonatedDays} days donated
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            Code: {balance.code}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {balance.default_days} days
                                                    </div>
                                                    {balance.code === 'PL' && totalDonatedDays > 0 && (
                                                        <div className="text-sm text-emerald-600 font-medium">
                                                            + {totalDonatedDays} donated days
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {balance.total_used} days
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="flex flex-col space-y-2">
                                                        <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm   font-bold ${
                                                            balance.balance > 0 
                                                                ? 'bg-emerald-100 text-emerald-800' 
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {balance.balance} days
                                                        </span>
                                                        {balance.code === 'PL' && totalDonatedDays > 0 && (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                                {totalDonatedDays} days from maternity donations
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow">
                                                        Fixed Allocation
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-12 text-center">
                                                <div className="text-gray-500 text-sm">
                                                    No fixed leave allocations found for this year.
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Donation Modal */}
                    {showDonationModal && (
                        <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-2xl border border-white/20">
                                <div className="p-8">
                                    <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-emerald-800 bg-clip-text text-transparent text-center mt-6">
                                        Donate Maternity Leave
                                    </h3>
                                    
                                    <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl">
                                        <p className="text-sm text-amber-800 text-center font-medium">
                                            You are donating 7 days of your maternity leave to your selected partner.
                                        </p>
                                        <p className="text-sm text-amber-700 text-center mt-2">
                                            This request will require HR approval before processing.
                                        </p>
                                    </div>

                                    <div className="mt-6">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            Search and Select Male Recipient *
                                        </label>
                                        
                                        {/* Search Input */}
                                        <div className="relative mb-4">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                                placeholder="Type to search for male employees by name, position, or department..."
                                                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 pl-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                                            />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                            {isSearching && (
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                    <svg className="animate-spin h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Results Dropdown */}
                                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm">
                                            {searchResults.length > 0 ? (
                                                searchResults.map((recipient) => (
                                                    <div
                                                        key={recipient.employee_id}
                                                        onClick={() => setSelectedRecipient(recipient.employee_id)}
                                                        className={`p-4 border-b border-gray-100 last:border-b-0 cursor-pointer transition-all duration-200 ${
                                                            selectedRecipient === recipient.employee_id
                                                                ? 'bg-emerald-50 border-emerald-200'
                                                                : 'hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="font-semibold text-gray-900">
                                                                    {recipient.name}
                                                                </div>
                                                                <div className="text-sm text-gray-600 mt-1">
                                                                    {recipient.position}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {recipient.department}
                                                                </div>
                                                            </div>
                                                            {selectedRecipient === recipient.employee_id && (
                                                                <div className="flex-shrink-0">
                                                                    <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-gray-500">
                                                    No male employees found matching your search.
                                                </div>
                                            )}
                                        </div>

                                        {/* Selected Recipient Display */}
                                        {selectedRecipient && (
                                            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-sm font-medium text-emerald-800">
                                                            Selected: {searchResults.find(r => r.employee_id === selectedRecipient)?.name}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedRecipient('')}
                                                        className="text-sm text-emerald-600 hover:text-emerald-800"
                                                    >
                                                        Change
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end space-x-4 mt-8">
                                        <button
                                            onClick={closeDonationModal}
                                            disabled={isLoading}
                                            className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDonate}
                                            disabled={isLoading || !selectedRecipient}
                                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 flex items-center"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </>
                                            ) : (
                                                'Submit for HR Approval'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HR Approval Required Modal */}
                    {showHrApprovalModal && (
                        <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-2xl border border-white/20">
                                <div className="p-8">
                                    <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg mb-4">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    
                                    <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
                                        HR Approval Required
                                    </h3>
                                    
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
                                        <p className="text-amber-800 text-center font-medium mb-4">
                                            You have {pendingDonations.length} pending maternity leave donation request(s) that require HR approval.
                                        </p>
                                        <p className="text-amber-700 text-sm text-center">
                                            Please review and process these requests in the HR Leave Donations section.
                                        </p>
                                    </div>

                                    {pendingDonations.length > 0 && (
                                        <div className="max-h-60 overflow-y-auto mb-6">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Pending Requests:</h4>
                                            <div className="space-y-3">
                                                {pendingDonations.map((donation) => (
                                                    <div key={donation.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {donation.donor?.firstname} {donation.donor?.lastname}
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    Donating {donation.days_donated} days to {donation.recipient?.firstname} {donation.recipient?.lastname}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Requested: {new Date(donation.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                Pending
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end space-x-4">
                                        <button
                                            onClick={() => setShowHrApprovalModal(false)}
                                            className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105"
                                        >
                                            Close
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowHrApprovalModal(false);
                                                router.visit('/hr/leave-donations');
                                            }}
                                            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            Go to Donations Page
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Information Section */}
                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl shadow-2xl p-8 hover:shadow-2xl transition-all duration-300">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-6">
                                <h3 className="text-xl font-semibold text-white">Important Information</h3>
                                <div className="mt-4 text-emerald-100">
                                    <ul className="list-disc list-inside space-y-3">
                                        <li><strong>Sick Leave (SL) & Vacation Leave (VL):</strong> Accumulate 1.25 days each month and can be converted to cash</li>
                                        <li><strong>Fixed Leave Allocations:</strong> Renew annually with fixed number of days</li>
                                        <li><strong>Maternity Leave Donation:</strong> Female employees can donate 7 days of maternity leave to male partners (requires HR approval)</li>
                                        <li><strong>Donated Days:</strong> Donated paternity leave days are added to your balance and shown separately</li>
                                        <li>Balances are updated in real-time after leave approvals</li>
                                        <li>For questions about your leave balances, contact HR</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}