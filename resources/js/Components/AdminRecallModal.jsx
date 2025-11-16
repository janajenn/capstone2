import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function AdminRecallModal({ isOpen, onClose, leaveRequest }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        reason: '', // Simple reason field
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        Swal.fire({
            title: "Recall this leave request?",
            text: "This will recall the leave request and automatically return the deducted leave credits to the employee.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, recall",
            cancelButtonText: "Cancel",
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl shadow-2xl border border-gray-200',
                title: 'text-xl font-bold text-gray-800',
                confirmButton: 'px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium',
                cancelButton: 'px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-medium'
            },
            buttonsStyling: false
        }).then((result) => {
            if (result.isConfirmed) {
                post(route('admin.recall-leave', leaveRequest.id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: "Recalled!",
                            text: "The leave request has been recalled and leave credits have been returned.",
                            icon: "success",
                            confirmButtonColor: '#10B981',
                            background: '#ffffff',
                            customClass: {
                                popup: 'rounded-2xl shadow-2xl border border-gray-200'
                            }
                        });
                        reset();
                        onClose();
                    },
                    onError: (errors) => {
                        console.error('Recall error:', errors);
                        let errorMessage = "There was a problem recalling the request";

                        if (errors.error) {
                            errorMessage = errors.error;
                        } else if (errors.message) {
                            errorMessage = errors.message;
                        }

                        Swal.fire({
                            title: "Error",
                            text: errorMessage,
                            icon: "error",
                            confirmButtonColor: '#EF4444',
                            background: '#ffffff',
                            customClass: {
                                popup: 'rounded-2xl shadow-2xl border border-gray-200'
                            }
                        });
                    },
                });
            }
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!leaveRequest) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900"
                                >
                                    Recall Leave Request
                                </Dialog.Title>

                                <div className="mt-4">
                                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 mb-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-orange-800">
                                                    Admin Recall
                                                </h3>
                                                <div className="mt-2 text-sm text-orange-700">
                                                    <p>
                                                        This action will recall the approved leave request and automatically 
                                                        return the deducted vacation leave credits to the employee.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Leave Request Details</h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Employee:</span>
                                                <span className="font-medium text-gray-900">
                                                    {leaveRequest.employee.firstname} {leaveRequest.employee.lastname}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Leave Type:</span>
                                                <span className="font-medium text-gray-900">{leaveRequest.leaveType.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Date Range:</span>
                                                <span className="font-medium text-gray-900">
                                                    {new Date(leaveRequest.date_from).toLocaleDateString()} - {new Date(leaveRequest.date_to).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Duration:</span>
                                                <span className="font-medium text-gray-900">{leaveRequest.total_days} days</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Status:</span>
                                                <span className="font-medium text-green-600">Approved</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                    {/* Simple Reason Field */}
                                    <div>
                                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                                            Reason for Recall <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="reason"
                                            name="reason"
                                            rows={4}
                                            className="block w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
                                            placeholder="Please provide a reason for recalling this leave request..."
                                            value={data.reason}
                                            onChange={(e) => setData('reason', e.target.value)}
                                            required
                                        />
                                        {errors.reason && (
                                            <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                            onClick={handleClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-600 border border-transparent rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                                        >
                                            {processing ? 'Processing...' : 'Confirm Recall'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}