// resources/js/Pages/Admin/Unauthorized.jsx
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";

export default function Unauthorized({ message, currentApprover }) {
    return (
        <AdminLayout>
            <Head title="Access Unauthorized" />
            
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    
                    <h2 className="mt-4 text-xl font-bold text-gray-900">Access Restricted</h2>
                    
                    <p className="mt-2 text-gray-600">
                        {message}
                    </p>
                    
                    {currentApprover && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                                <strong>Current Approver:</strong> {currentApprover}
                            </p>
                        </div>
                    )}
                    
                    <div className="mt-6 space-y-3">
                        <Link
                            href={route('admin.dashboard')}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Go to Dashboard
                        </Link>
                        
                        <Link
                            href={route('admin.delegation')}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Manage Delegation
                        </Link>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}