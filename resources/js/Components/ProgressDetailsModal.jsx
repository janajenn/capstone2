// resources/js/Components/ProgressDetailsModal.jsx
import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import LeaveProgressTracker from '../Pages/Employee/LeaveProgressTracker';

const ProgressDetailsModal = ({ 
    isOpen, 
    onClose, 
    leaveRequest, 
    isRecalled, 
    recallData,
    employee 
}) => {
    if (!leaveRequest) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-50" />
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
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                                >
                                    Leave Request Details
                                </Dialog.Title>

                                {/* Leave Summary */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Leave Type:</span>
                                            <p className="font-medium">{leaveRequest.leave_type?.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Date Range:</span>
                                            <p className="font-medium">
                                                {new Date(leaveRequest.date_from).toLocaleDateString()} - {new Date(leaveRequest.date_to).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Duration:</span>
                                            <p className="font-medium">{leaveRequest.total_days} days</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Status:</span>
                                            <p className={`font-medium ${
                                                isRecalled ? 'text-red-600' :
                                                leaveRequest.status === 'approved' ? 'text-green-600' :
                                                leaveRequest.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                                            }`}>
                                                {isRecalled ? 'Recalled' : leaveRequest.status}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Full Progress Tracker */}
                                <div className="mb-6">
                                    <LeaveProgressTracker 
                                        approvals={leaveRequest.approvals} 
                                        isDeptHead={leaveRequest.is_dept_head_request || employee?.user?.role === 'dept_head'}
                                        isRecalled={isRecalled}
                                        recallData={recallData}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-3 mt-6">
                                    {isRecalled && recallData && (
                                        <button
                                            onClick={() => {
                                                onClose();
                                                // This would open the recall details modal
                                                // You can pass a callback prop to handle this
                                            }}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            View Full Recall Details
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        onClick={onClose}
                                    >
                                        Close
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ProgressDetailsModal;