import React from 'react';
import { Head, Link } from '@inertiajs/react';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { 
    Calendar, 
    Clock, 
    AlertTriangle, 
    CheckCircle, 
    XCircle, 
    Eye,
    FileText,
    ArrowLeft
} from 'lucide-react';

const StatusBadge = ({ status }) => {
    const statusConfig = {
        'Pending': {
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-200',
            icon: Clock,
        },
        'Reviewed': {
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
            icon: Eye,
        },
        'Approved': {
            bgColor: 'bg-green-50',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            icon: CheckCircle,
        },
        'Rejected': {
            bgColor: 'bg-red-50',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            icon: XCircle,
        },
    };

    const config = statusConfig[status] || statusConfig.Pending;
    const IconComponent = config.icon;

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
            <IconComponent className="w-3 h-3 mr-1" />
            {status}
        </span>
    );
};

export default function MyCorrectionRequests({ auth, corrections }) {
    return (
        <EmployeeLayout user={auth.user}>
            <Head title="My Correction Requests" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link 
                                href="/employee/attendance-logs" 
                                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Attendance Logs
                            </Link>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                                My Correction Requests
                            </h1>
                            <p className="text-gray-600 text-lg">
                                View and track all your submitted attendance correction requests
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">{corrections.data.length}</div>
                            <div className="text-sm text-gray-500">Total Requests</div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center mr-4">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {corrections.data.filter(c => c.status === 'Pending').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-4">
                                <Eye className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Reviewed</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {corrections.data.filter(c => c.status === 'Reviewed').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mr-4">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Approved</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {corrections.data.filter(c => c.status === 'Approved').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mr-4">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Rejected</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {corrections.data.filter(c => c.status === 'Rejected').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Correction Requests Table */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                                <FileText className="w-5 h-5 mr-2" />
                                My Correction Requests
                            </h3>
                            <div className="text-sm text-gray-500">
                                Showing {corrections.data.length} of {corrections.total} requests
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Date Requested
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Attendance Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Explanation
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Reviewed By
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Remarks
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {corrections.data.length > 0 ? (
                                    corrections.data.map((correction, index) => (
                                        <tr key={correction.id} className="hover:bg-gray-50 transition-colors duration-200">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                                                        <Calendar className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {new Date(correction.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(correction.created_at).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {new Date(correction.attendance_date).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                                                <div className="line-clamp-2">
                                                    {correction.explanation}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={correction.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {correction.reviewer ? (
                                                    <span className="font-medium">{correction.reviewer}</span>
                                                ) : (
                                                    <span className="text-gray-400 italic">Not reviewed yet</span>
                                                )}
                                                {correction.reviewed_at && (
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(correction.reviewed_at).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                                                {correction.remarks ? (
                                                    <div className="line-clamp-2">
                                                        {correction.remarks}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">No remarks</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                    <AlertTriangle className="w-10 h-10 text-gray-400" />
                                                </div>
                                                <h3 className="text-xl font-medium text-gray-900 mb-2">
                                                    No correction requests found
                                                </h3>
                                                <p className="text-gray-500 max-w-md mb-4">
                                                    You haven't submitted any attendance correction requests yet.
                                                </p>
                                                <Link
                                                    href="/employee/attendance-logs"
                                                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                                >
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    Go to Attendance Logs
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {corrections.links && corrections.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {corrections.from} to {corrections.to} of {corrections.total} results
                                </div>
                                <div className="flex space-x-2">
                                    {corrections.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-3 py-1 rounded-md text-sm font-medium ${
                                                link.active
                                                    ? 'bg-blue-500 text-white'
                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </EmployeeLayout>
    );
}