import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useForm } from '@inertiajs/react';

export default function AdminRecallModal({ isOpen, onClose, leaveRequest }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        reason: '',
        new_leave_date_from: '',
        new_leave_date_to: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.recall-leave', leaveRequest.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // Calculate minimum date (today)
    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Calculate minimum end date based on start date
    const getMinEndDate = () => {
        return data.new_leave_date_from || getTodayDate();
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
                                    Recall & Reschedule Leave Request
                                </Dialog.Title>

                                <div className="mt-4">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-yellow-800">
                                                    Admin Recall & Reschedule
                                                </h3>
                                                <div className="mt-2 text-sm text-yellow-700">
                                                    <p>
                                                        This action will recall the original leave, restore vacation leave credits, 
                                                        and allow you to specify new dates for the leave.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-md p-4 mb-4">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Original Leave Details</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-500">Employee:</span>
                                                <p className="font-medium">{leaveRequest.employee.firstname} {leaveRequest.employee.lastname}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Leave Type:</span>
                                                <p className="font-medium">{leaveRequest.leaveType.name}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-gray-500">Original Date Range:</span>
                                                <p className="font-medium">
                                                    {new Date(leaveRequest.date_from).toLocaleDateString()} - {new Date(leaveRequest.date_to).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Duration:</span>
                                                <p className="font-medium">{leaveRequest.total_days} days</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                    {/* New Date Range Fields */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="new_leave_date_from" className="block text-sm font-medium text-gray-700">
                                                New Start Date *
                                            </label>
                                            <input
                                                type="date"
                                                id="new_leave_date_from"
                                                name="new_leave_date_from"
                                                min={getTodayDate()}
                                                value={data.new_leave_date_from}
                                                onChange={(e) => setData('new_leave_date_from', e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                required
                                            />
                                            {errors.new_leave_date_from && (
                                                <p className="mt-1 text-sm text-red-600">{errors.new_leave_date_from}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="new_leave_date_to" className="block text-sm font-medium text-gray-700">
                                                New End Date *
                                            </label>
                                            <input
                                                type="date"
                                                id="new_leave_date_to"
                                                name="new_leave_date_to"
                                                min={getMinEndDate()}
                                                value={data.new_leave_date_to}
                                                onChange={(e) => setData('new_leave_date_to', e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                required
                                            />
                                            {errors.new_leave_date_to && (
                                                <p className="mt-1 text-sm text-red-600">{errors.new_leave_date_to}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reason Field */}
                                    <div>
                                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                                            Reason for Recall & Reschedule *
                                        </label>
                                        <textarea
                                            id="reason"
                                            name="reason"
                                            rows={4}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Please provide a reason for recalling and rescheduling this leave request..."
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
                                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            onClick={handleClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                        >
                                            {processing ? 'Processing...' : 'Recall & Reschedule'}
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