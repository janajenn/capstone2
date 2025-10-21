import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Unauthorized({ message, currentApprover }) {
    const { auth } = usePage().props;

    return (
        <AdminLayout>
            <Head title="Unauthorized Access" />
            
            <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-lg w-full space-y-8">
                    <div className="text-center">
                        {/* Warning Icon */}
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50">
                            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        
                        <h2 className="mt-4 text-2xl font-semibold text-gray-800">
                            Unauthorized Access
                        </h2>
                        
                        <p className="mt-2 text-sm text-gray-500">
                            {message}
                        </p>
                    </div>

                    {/* Information Cards */}
                    <div className="space-y-6">
                        {/* Current Approver Information */}
                        {currentApprover && (
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100 transition-transform duration-200 hover:scale-[1.02]">
                                <h3 className="text-sm font-medium text-green-800 mb-3">
                                    Current Active Approver
                                </h3>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p><span className="font-medium text-green-900">Name:</span> {currentApprover.name}</p>
                                    <p><span className="font-medium text-green-900">Status:</span> {currentApprover.is_primary ? 'Primary Admin' : 'Delegated Approver'}</p>
                                </div>
                            </div>
                        )}

                        {/* User Information */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100 transition-transform duration-200 hover:scale-[1.02]">
                            <h3 className="text-sm font-medium text-green-800 mb-3">
                                Your Information
                            </h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium text-green-900">Name:</span> {auth.user.name}</p>
                                <p><span className="font-medium text-green-900">Role:</span> {auth.user.role}</p>
                                <p><span className="font-medium text-green-900">Status:</span> {auth.user.is_primary ? 'Primary Admin' : 'Regular Admin'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 mt-8">
                        <a
                            href={route('admin.dashboard')}
                            className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg font-medium text-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition ease-in-out duration-150"
                        >
                            Back to Dashboard
                        </a>
                        <a
                            href={route('admin.delegation')}
                            className="inline-flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg font-medium text-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition ease-in-out duration-150"
                        >
                            Manage Delegations
                        </a>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}