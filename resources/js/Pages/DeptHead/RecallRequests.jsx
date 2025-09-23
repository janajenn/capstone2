import DeptHeadLayout from '@/Layouts/DeptHeadLayout';
import { usePage, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

export default function RecallRequests() {
    const { recallRequests, departmentName, flash } = usePage().props;
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionType, setActionType] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        remarks: ''
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
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

    const openModal = (request, action) => {
        setSelectedRequest(request);
        setActionType(action);
        setData({ remarks: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
        setActionType('');
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!selectedRequest) return;

        const url = actionType === 'approve' 
            ? `/dept-head/recall-requests/${selectedRequest.id}/approve`
            : `/dept-head/recall-requests/${selectedRequest.id}/reject`;

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
        <DeptHeadLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Leave Recall Requests</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Review and approve leave recall requests from {departmentName} department
                        </p>
                    </div>
                </div>

                {flash?.success && (
                    <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {flash.success}
                    </div>
                )}

                <motion.div
                    className="bg-white shadow-sm rounded-lg overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
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
                                        Original Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        New Date Range
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reason
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Submitted
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recallRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                            No recall requests pending your approval
                                        </td>
                                    </tr>
                                ) : (
                                    recallRequests.map((request) => (
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
                                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(request.approved_leave_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {request.new_leave_date_from && request.new_leave_date_to
                                                    ? `${formatDate(request.new_leave_date_from)} - ${formatDate(request.new_leave_date_to)}`
                                                    : formatDate(request.new_leave_date_to || request.new_leave_date_from)
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                                <div className="truncate" title={request.reason_for_change}>
                                                    {request.reason_for_change}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(request.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
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
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
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
        </DeptHeadLayout>
    );
}
