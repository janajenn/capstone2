import HRLayout from '@/Layouts/HRLayout';
import { usePage, useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

export default function RecallRequests() {
    const { recallRequests, stats, recentActivity, filters, flash } = usePage().props;
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [actionType, setActionType] = useState('');
    const [activeTab, setActiveTab] = useState(filters?.status || 'all');

    const { data, setData, post, processing, errors, reset } = useForm({
        status: filters?.status || 'all',
        search: filters?.search || '',
        date_from: filters?.date_from || '',
        date_to: filters?.date_to || '',
        remarks: ''
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const baseClasses = "px-2.5 py-0.5 rounded-full text-xs font-medium";
        
        switch (status) {
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'approved':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'rejected':
                return `${baseClasses} bg-red-100 text-red-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return '⏳';
            case 'approved':
                return '✅';
            case 'rejected':
                return '❌';
            default:
                return '📋';
        }
    };

    // Filter requests based on active tab
    const filteredRequests = useMemo(() => {
        if (!recallRequests.data) return [];
        
        if (activeTab === 'all') {
            return recallRequests.data;
        }
        
        return recallRequests.data.filter(request => request.status === activeTab);
    }, [recallRequests.data, activeTab]);

    // Tab configuration
    const tabs = [
        { id: 'all', name: 'All Requests', count: stats.total },
        { id: 'pending', name: 'Pending', count: stats.pending },
        { id: 'approved', name: 'Approved', count: stats.approved },
        { id: 'rejected', name: 'Rejected', count: stats.rejected },
    ];

    const openModal = (request, action) => {
        setSelectedRequest(request);
        setActionType(action);
        setData('remarks', '');
        setIsModalOpen(true);
    };

    const openDetailsModal = (request) => {
        setSelectedRequest(request);
        setIsDetailsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsDetailsModalOpen(false);
        setSelectedRequest(null);
        setActionType('');
        reset();
    };

    const handleFilter = () => {
        router.get('/hr/recall-requests', {
            status: data.status,
            search: data.search,
            date_from: data.date_from,
            date_to: data.date_to,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!selectedRequest) return;

        const url = actionType === 'approve' 
            ? `/hr/recall-requests/${selectedRequest.id}/approve`
            : `/hr/recall-requests/${selectedRequest.id}/reject`;

        post(url, {
            onSuccess: () => {
                closeModal();
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: `Recall request ${actionType}d successfully!`,
                    timer: 3000,
                    showConfirmButton: false
                });
            },
            onError: (errors) => {
                console.error('Error:', errors);
            }
        });
    };

    return (
        <HRLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Leave Recall Requests</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage and review all leave recall requests
                        </p>
                    </div>
                </div>

                {flash?.success && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">📋</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">⏳</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">✅</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Approved</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                    >
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">❌</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Rejected</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Search and Filter Section */}
                        <motion.div
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                                <div className="w-full md:w-1/2">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search employees..."
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            value={data.search}
                                            onChange={(e) => setData('search', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <label htmlFor="status" className="text-sm text-gray-600">Status:</label>
                                        <select
                                            id="status"
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleFilter}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Tabs and Table Section */}
                        <motion.div
                            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            {/* Tabs */}
                            <div className="border-b border-gray-200">
                                <nav className="-mb-px flex">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                                py-4 px-6 text-sm font-medium border-b-2 transition-colors duration-200 flex items-center
                                                ${activeTab === tab.id
                                                    ? 'border-blue-500 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }
                                            `}
                                        >
                                            {tab.name}
                                            {tab.count > 0 && (
                                                <span className={`
                                                    ml-2 py-0.5 px-2 rounded-full text-xs
                                                    ${activeTab === tab.id
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }
                                                `}>
                                                    {tab.count}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Employee
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Leave Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date Submitted
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredRequests.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center">
                                                    <div className="text-gray-500">
                                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No recall requests found</h3>
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            {activeTab === 'all' 
                                                                ? 'No recall requests have been submitted yet.'
                                                                : `No ${activeTab} recall requests found.`
                                                            }
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRequests.map((request) => (
                                                <motion.tr
                                                    key={request.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.2 }}
                                                    whileHover={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <span className="text-blue-600 font-medium">
                                                                    {request.employee.firstname.charAt(0)}{request.employee.lastname.charAt(0)}
                                                                </span>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {request.employee.firstname} {request.employee.lastname}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {request.employee.department?.name || 'No Department'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center">
                                                                <span className="text-blue-600 text-xs">
                                                                    {request.leave_request.leave_type.code === 'VL' ? '🏖️' :
                                                                     request.leave_request.leave_type.code === 'SL' ? '🤒' :
                                                                     request.leave_request.leave_type.code === 'MAT' ? '👶' : '📋'}
                                                                </span>
                                                            </div>
                                                            <div className="ml-3">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {request.leave_request.leave_type.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {request.leave_request.leave_type.code}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={getStatusBadge(request.status)}>
                                                            {getStatusIcon(request.status)} {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDate(request.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => openDetailsModal(request)}
                                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                                                            >
                                                                View Details
                                                            </button>
                                                            {request.status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => openModal(request, 'approve')}
                                                                        className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openModal(request, 'reject')}
                                                                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {recallRequests.data && recallRequests.data.length > 0 && (
                                <div className="bg-white px-6 py-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{recallRequests.from}</span> to <span className="font-medium">{recallRequests.to}</span> of{' '}
                                            <span className="font-medium">{recallRequests.total}</span> results
                                        </div>
                                        <div className="flex space-x-2">
                                            {/* Previous Page */}
                                            {recallRequests.prev_page_url && (
                                                <button
                                                    onClick={() => router.visit(recallRequests.prev_page_url, { preserveState: true, preserveScroll: true })}
                                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                                >
                                                    Previous
                                                </button>
                                            )}

                                            {/* Page Numbers */}
                                            {recallRequests.links.slice(1, -1).map((link, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true })}
                                                    className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                                                        link.active
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}

                                            {/* Next Page */}
                                            {recallRequests.next_page_url && (
                                                <button
                                                    onClick={() => router.visit(recallRequests.next_page_url, { preserveState: true, preserveScroll: true })}
                                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                                >
                                                    Next
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Recent Activity Sidebar */}
                    <div className="lg:col-span-1">
                        <motion.div
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                        >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {recentActivity.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                                ) : (
                                    recentActivity.map((activity) => (
                                        <div key={activity.id} className="flex items-start space-x-3">
                                            <div className="flex-shrink-0">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                    activity.status === 'approved' ? 'bg-green-100' :
                                                    activity.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                                                }`}>
                                                    <span className="text-sm">
                                                        {getStatusIcon(activity.status)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {activity.employee_name}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {activity.leave_type}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {formatDateTime(activity.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Approval/Rejection Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal}></div>
                        
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <span className="text-blue-600 text-xl">
                                                {actionType === 'approve' ? '✅' : '❌'}
                                            </span>
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                                {actionType === 'approve' ? 'Approve Recall Request' : 'Reject Recall Request'}
                                            </h3>
                                            
                                            {selectedRequest && (
                                                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                                                    <p className="text-sm text-gray-700">
                                                        <strong>Employee:</strong> {selectedRequest.employee.firstname} {selectedRequest.employee.lastname}
                                                    </p>
                                                    <p className="text-sm text-gray-700">
                                                        <strong>Leave Type:</strong> {selectedRequest.leave_request.leave_type.name}
                                                    </p>
                                                    <p className="text-sm text-gray-700">
                                                        <strong>New Date Range:</strong> {selectedRequest.new_leave_date_from && selectedRequest.new_leave_date_to
                                                            ? `${formatDate(selectedRequest.new_leave_date_from)} - ${formatDate(selectedRequest.new_leave_date_to)}`
                                                            : formatDate(selectedRequest.new_leave_date_to || selectedRequest.new_leave_date_from)
                                                        }
                                                    </p>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    {actionType === 'reject' ? 'Rejection Reason' : 'Remarks'} 
                                                    {actionType === 'reject' && <span className="text-red-500">*</span>}
                                                </label>
                                                <textarea
                                                    value={data.remarks}
                                                    onChange={(e) => setData('remarks', e.target.value)}
                                                    rows={3}
                                                    required={actionType === 'reject'}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder={actionType === 'approve' ? 'Optional remarks...' : 'Please provide reason for rejection...'}
                                                />
                                                {errors.remarks && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.remarks}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 ${
                                            actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                    >
                                        {processing ? 'Processing...' : `${actionType === 'approve' ? 'Approve' : 'Reject'} Request`}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {isDetailsModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal}></div>
                        
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <span className="text-blue-600 text-xl">📋</span>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                            Recall Request Details
                                        </h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Employee Information</h4>
                                                <div className="space-y-1 text-sm">
                                                    <p><strong>Name:</strong> {selectedRequest.employee.firstname} {selectedRequest.employee.lastname}</p>
                                                    <p><strong>Department:</strong> {selectedRequest.employee.department?.name || 'N/A'}</p>
                                                    <p><strong>Position:</strong> {selectedRequest.employee.position || 'N/A'}</p>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Leave Information</h4>
                                                <div className="space-y-1 text-sm">
                                                    <p><strong>Leave Type:</strong> {selectedRequest.leave_request.leave_type.name} ({selectedRequest.leave_request.leave_type.code})</p>
                                                    <p><strong>Original Date:</strong> {formatDate(selectedRequest.approved_leave_date)}</p>
                                                    <p><strong>New Date Range:</strong> {selectedRequest.new_leave_date_from && selectedRequest.new_leave_date_to
                                                        ? `${formatDate(selectedRequest.new_leave_date_from)} - ${formatDate(selectedRequest.new_leave_date_to)}`
                                                        : formatDate(selectedRequest.new_leave_date_to || selectedRequest.new_leave_date_from)
                                                    }</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Reason for Change</h4>
                                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                                                {selectedRequest.reason_for_change}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Department Head Approval</h4>
                                                <div className="text-sm">
                                                    {selectedRequest.approved_by_depthead ? (
                                                        <>
                                                            <p><strong>Approved by:</strong> {selectedRequest.approved_by_depthead.name}</p>
                                                            <p><strong>Date:</strong> {formatDateTime(selectedRequest.updated_at)}</p>
                                                        </>
                                                    ) : (
                                                        <p className="text-gray-500">Pending department head approval</p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">HR Approval</h4>
                                                <div className="text-sm">
                                                    {selectedRequest.approved_by_hr ? (
                                                        <>
                                                            <p><strong>Approved by:</strong> {selectedRequest.approved_by_hr.name}</p>
                                                            <p><strong>Date:</strong> {formatDateTime(selectedRequest.updated_at)}</p>
                                                        </>
                                                    ) : selectedRequest.status === 'rejected' ? (
                                                        <p className="text-red-500">Rejected by HR</p>
                                                    ) : (
                                                        <p className="text-yellow-500">Pending HR approval</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {selectedRequest.status === 'rejected' && selectedRequest.approved_by_hr && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Rejection Reason</h4>
                                                <p className="text-sm text-gray-900 bg-red-50 p-3 rounded-md">
                                                    {selectedRequest.remarks || 'No reason provided'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </HRLayout>
    );
}