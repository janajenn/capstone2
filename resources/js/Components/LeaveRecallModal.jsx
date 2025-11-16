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
                                                <span className="text-gray-500">Days with Pay:</span>
                                                <p className="font-medium text-green-600">{leaveRequest.days_with_pay} days</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Days without Pay:</span>
                                                <p className="font-medium text-orange-600">{leaveRequest.days_without_pay} days</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Status:</span>
                                                <p className="font-medium text-red-600">Recalled</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recall Information */}
                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-orange-900 mb-3">Recall Information</h4>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <span className="text-orange-700 font-medium">Reason for Recall:</span>
                                                <p className="text-orange-800 mt-1 bg-white p-3 rounded border border-orange-100">
                                                    {recallData.reason}
                                                </p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-orange-700 font-medium">Recall Date:</span>
                                                    <p className="text-orange-800 mt-1">
                                                        {new Date(recallData.recalled_at).toLocaleDateString()} at {new Date(recallData.recalled_at).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-orange-700 font-medium">Recalled By:</span>
                                                    <p className="text-orange-800 mt-1">
                                                        Administration
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Credit Restoration Information */}
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-green-900 mb-3">Credit Restoration</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center">
                                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="text-green-700">
                                                    <strong>{leaveRequest.days_with_pay} Vacation Leave credits</strong> have been restored to your balance
                                                </span>
                                            </div>
                                            {leaveRequest.days_without_pay > 0 && (
                                                <div className="flex items-center text-gray-600">
                                                    <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    <span>
                                                        {leaveRequest.days_without_pay} days without pay were not restored (no credits were deducted for these days)
                                                    </span>
                                                </div>
                                            )}
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
                                                        Your leave credits for days with pay have been automatically restored.
                                                        You may submit a new leave request if needed.
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