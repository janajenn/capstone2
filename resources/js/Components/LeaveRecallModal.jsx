import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function LeaveRecallModal({ isOpen, onClose, recallData, leaveRequest }) {
    if (!recallData || !leaveRequest) return null;

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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                                >
                                    📝 Recall Details - View Only
                                </Dialog.Title>

                                <div className="space-y-6">
                                    {/* Original Leave Information */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Original Leave Request</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Leave Type:</span>
                                                <p className="font-medium">{leaveRequest.leave_type?.name}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Original Dates:</span>
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
                                                <p className="font-medium text-red-600">Recalled</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recall Information */}
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-red-900 mb-3">Recall Information</h4>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <span className="text-red-700 font-medium">Reason for Recall:</span>
                                                <p className="text-red-800 mt-1 bg-white p-3 rounded border border-red-100">
                                                    {recallData.reason}
                                                </p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-red-700 font-medium">Proposed New Start Date:</span>
                                                    <p className="text-red-800 mt-1">
                                                        {new Date(recallData.new_date_from).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-red-700 font-medium">Proposed New End Date:</span>
                                                    <p className="text-red-800 mt-1">
                                                        {new Date(recallData.new_date_to).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <span className="text-red-700 font-medium">Recall Date:</span>
                                                <p className="text-red-800 mt-1">
                                                    {new Date(recallData.recalled_at).toLocaleDateString()} at {new Date(recallData.recalled_at).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Note for Employee */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h4 className="text-sm font-medium text-blue-800">Important Note</h4>
                                                <div className="mt-1 text-sm text-blue-700">
                                                    <p>
                                                        Your leave request has been recalled by administration. 
                                                        Your leave credits have been restored, and you may submit a new leave request 
                                                        with the proposed dates or different dates as needed.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
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
}