import AdminLayout from '@/Layouts/AdminLayout';
import { usePage, router } from '@inertiajs/react';
import { useState } from 'react';

export default function ApprovedLeaveRequests({ leaveRequests, filters, pageTitle, totalCount, error }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(route('admin.leave-requests.fully-approved'), { search: e.target.value }, {
            preserveState: true,
            preserveScroll: true,
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

    const getApprovalStatus = (approvals) => {
        const hrApproval = approvals?.find(a => a.role === 'hr');
        const deptHeadApproval = approvals?.find(a => a.role === 'dept_head');
        const adminApproval = approvals?.find(a => a.role === 'admin');

        return {
            hr: hrApproval?.status === 'approved',
            deptHead: deptHeadApproval?.status === 'approved',
            admin: adminApproval?.status === 'approved'
        };
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50 p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{pageTitle}</h1>
                            <p className="text-gray-600 mt-1">
                                Total Approved Requests: {totalCount}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-red-700">{error}</span>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by employee name or leave type..."
                                value={search}
                                onChange={handleSearch}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Leave Requests Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employee
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Leave Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Dates
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Approvals
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leaveRequests.data && leaveRequests.data.length > 0 ? (
                                    leaveRequests.data.map((request) => {
                                        const approvals = getApprovalStatus(request.approvals || []);
                                        
                                        return (
                                            <tr key={request.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {request.employee?.firstname} {request.employee?.lastname}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {request.employee?.position}
                                                                {request.employee?.department && ` • ${request.employee.department.name}`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        <div className="font-medium">{request.leave_type?.name}</div>
                                                        <div className="text-gray-500">({request.leave_type?.code})</div>
                                                        {request.reason && (
                                                            <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                                                {request.reason}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {formatDate(request.date_from)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        to {formatDate(request.date_to)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {request.total_days} day{request.total_days !== 1 ? 's' : ''}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col space-y-1">
                                                        <div className="flex items-center">
                                                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${approvals.hr ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                            <span className="text-xs text-gray-600">HR</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${approvals.deptHead ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                            <span className="text-xs text-gray-600">Dept Head</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${approvals.admin ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                            <span className="text-xs text-gray-600">Admin</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Approved
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center">
                                            <div className="text-gray-500">
                                                {error ? 'Error loading leave requests' : 'No approved leave requests found.'}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {leaveRequests.data && leaveRequests.data.length > 0 && (
                        <div className="bg-white px-6 py-4 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {leaveRequests.from} to {leaveRequests.to} of {leaveRequests.total} results
                                </div>
                                <div className="flex space-x-2 mt-2 sm:mt-0">
                                    {leaveRequests.links && leaveRequests.links.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.visit(link.url)}
                                            className={`px-3 py-1 rounded ${
                                                link.active
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}