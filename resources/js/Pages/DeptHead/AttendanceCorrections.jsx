import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import DeptHeadLayout from '@/Layouts/DeptHeadLayout';
import Swal from 'sweetalert2';
import { 
    Calendar, 
    Clock, 
    User, 
    Eye, 
    CheckCircle, 
    XCircle,
    Filter,
    Search,
    FileText,
    AlertTriangle,
    Download
} from 'lucide-react';

const StatusBadge = ({ status }) => {
    const statusConfig = {
        'Pending': {
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-200',
            icon: Clock,
        },
        'Reviewed': {
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
            icon: Eye,
        },
        'Approved': {
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            icon: CheckCircle,
        },
        'Rejected': {
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            icon: XCircle,
        },
    };

    const config = statusConfig[status] || statusConfig.Pending;
    const IconComponent = config.icon;

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
            <IconComponent className="w-3 h-3 mr-1" />
            {status}
        </span>
    );
};

export default function AttendanceCorrections({ auth, corrections, departmentName, stats, filters }) {
    const { flash } = usePage().props;
    const [localFilters, setLocalFilters] = useState({
        status: filters.status || 'all',
        employee: filters.employee || ''
    });

    // SweetAlert2 for success/error messages
    useEffect(() => {
        if (flash.success) {
            Swal.fire({
                title: 'Success!',
                text: flash.success,
                icon: 'success',
                confirmButtonColor: '#10B981',
                background: '#ffffff',
                customClass: {
                    popup: 'rounded-2xl shadow-2xl border border-gray-200',
                    title: 'text-xl font-bold text-green-600'
                }
            });
        }
        if (flash.error) {
            Swal.fire({
                title: 'Error!',
                text: flash.error,
                icon: 'error',
                confirmButtonColor: '#EF4444',
                background: '#ffffff',
                customClass: {
                    popup: 'rounded-2xl shadow-2xl border border-gray-200',
                    title: 'text-xl font-bold text-red-600'
                }
            });
        }
    }, [flash]);

    const updateFilters = () => {
        router.get(route('dept_head.attendance-corrections'), localFilters, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setLocalFilters({ status: 'all', employee: '' });
        router.get(route('dept_head.attendance-corrections'), {}, {
            preserveState: true,
            replace: true
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Simple Pagination Component
    const SimplePagination = () => {
        if (!corrections.links || corrections.links.length <= 3) {
            return null;
        }

        return (
            <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                    Showing {corrections.from} to {corrections.to} of {corrections.total} results
                </div>
                <div className="flex space-x-1">
                    {corrections.links[0].url && (
                        <Link
                            href={corrections.links[0].url}
                            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors duration-200 ${
                                corrections.current_page === 1
                                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            preserveState
                        >
                            Previous
                        </Link>
                    )}

                    {corrections.links.slice(1, -1).map((link, index) => (
                        <Link
                            key={index}
                            href={link.url}
                            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors duration-200 ${
                                link.active
                                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-yellow-500'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            preserveState
                        >
                            {link.label}
                        </Link>
                    ))}

                    {corrections.links[corrections.links.length - 1].url && (
                        <Link
                            href={corrections.links[corrections.links.length - 1].url}
                            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors duration-200 ${
                                corrections.current_page === corrections.last_page
                                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            preserveState
                        >
                            Next
                        </Link>
                    )}
                </div>
            </div>
        );
    };

    return (
        <DeptHeadLayout user={auth.user}>
            <Head title="Attendance Correction Requests" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Attendance Correction Requests - {departmentName}
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Review and validate attendance correction requests from your team members
                        </p>
                    </div>

                    {/* Stats Cards - Updated Theme */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {/* Pending Review */}
                        <div className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Clock className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-yellow-100">Pending Review</p>
                                    <p className="text-2xl font-bold text-white">{stats.pending}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Reviewed */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Eye className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-blue-100">Reviewed</p>
                                    <p className="text-2xl font-bold text-white">{stats.reviewed}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Approved */}
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <CheckCircle className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-green-100">Approved</p>
                                    <p className="text-2xl font-bold text-white">{stats.approved}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Total Requests */}
                        <div className="bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <FileText className="h-6 w-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-100">Total Requests</p>
                                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select 
                                        value={localFilters.status} 
                                        onChange={(e) => setLocalFilters({...localFilters, status: e.target.value})}
                                        className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="Pending">Pending Review</option>
                                        <option value="Reviewed">Reviewed</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Employee</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input 
                                            type="text" 
                                            value={localFilters.employee} 
                                            onChange={(e) => setLocalFilters({...localFilters, employee: e.target.value})}
                                            placeholder="Search by employee name..."
                                            className="w-full pl-10 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex items-end space-x-2">
                                    <button 
                                        onClick={updateFilters}
                                        className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                                    >
                                        Apply Filters
                                    </button>
                                    <button 
                                        onClick={clearFilters}
                                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-medium"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Correction Requests Table */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Employee
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Attendance Date
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Explanation
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Submitted
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {corrections.data.map((correction) => (
                                            <tr key={correction.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                                                            <span className="text-white font-bold text-sm">
                                                                {correction.employee_name.split(' ').map(n => n[0]).join('')}
                                                            </span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {correction.employee_name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {correction.department}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {correction.attendance_date_formatted}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                                                    <div className="line-clamp-2">
                                                        {correction.explanation}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <StatusBadge status={correction.status} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(correction.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        <Link 
                                                            href={route('dept_head.attendance-corrections.show', correction.id)}
                                                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200 font-medium"
                                                        >
                                                            View
                                                        </Link>
                                                        {correction.proof_image && (
    <a
        href={`/attendance-corrections/${correction.id}/view-proof`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-600 hover:text-green-900 transition-colors duration-200 font-medium"
    >
        View Proof
    </a>
)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {corrections.data.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-8 text-center">
                                                    <div className="text-gray-500">
                                                        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                                                        <p className="mt-2 text-sm font-medium">No attendance correction requests found</p>
                                                        <p className="text-xs mt-1">Try adjusting your filters or check back later</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Simple Pagination */}
                            <SimplePagination />
                        </div>
                    </div>
                </div>
            </div>
        </DeptHeadLayout>
    );
}