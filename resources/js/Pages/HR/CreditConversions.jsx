import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import { debounce } from 'lodash';

// Safe Avatar component with null checks
const EmployeeAvatar = ({ employee, className = "w-10 h-10" }) => {
    const getInitials = () => {
        if (!employee) return '??';
        const firstInitial = employee.firstname ? employee.firstname[0] : '';
        const lastInitial = employee.lastname ? employee.lastname[0] : '';
        return (firstInitial + lastInitial).toUpperCase() || '??';
    };

    return (
        <div className={`${className} bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
            {getInitials()}
        </div>
    );
};

// Safe employee name display
const EmployeeName = ({ employee }) => {
    if (!employee) {
        return (
            <div>
                <div className="font-medium text-gray-900">Unknown Employee</div>
                <div className="text-sm text-gray-500">Employee not found</div>
            </div>
        );
    }

    return (
        <div>
            <div className="font-medium text-gray-900">
                {employee.firstname || ''} {employee.lastname || ''}
            </div>
            <div className="text-sm text-gray-500">{employee.position || 'No position'}</div>
        </div>
    );
};

// Safe department display
const DepartmentDisplay = ({ employee }) => {
    if (!employee || !employee.department) {
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                N/A
            </span>
        );
    }

    return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {employee.department.name}
        </span>
    );
};

// Status badge component
const StatusBadge = ({ status }) => {
    const getStatusConfig = (status) => {
        const configs = {
            pending: {
                gradient: 'from-yellow-400 to-amber-500',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                label: 'Pending HR Review'
            },
            hr_approved: {
                gradient: 'from-blue-400 to-indigo-500',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ),
                label: 'Approved by HR'
            },
            dept_head_approved: {
                gradient: 'from-purple-400 to-purple-600',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ),
                label: 'Approved by Dept Head'
            },
            admin_approved: {
                gradient: 'from-emerald-400 to-green-500',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ),
                label: 'Fully Approved'
            },
            rejected: {
                gradient: 'from-rose-400 to-red-500',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ),
                label: 'Rejected'
            }
        };
        return configs[status] || configs.pending;
    };

    const config = getStatusConfig(status);

    return (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-medium text-white bg-gradient-to-r ${config.gradient} shadow-lg`}>
            {config.icon}
            <span className="ml-1.5">{config.label}</span>
        </span>
    );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, trend, color }) => (
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-2xl ${color} bg-gradient-to-br from-opacity-20 to-opacity-40`}>
                {trend}
            </div>
        </div>
    </div>
);

// Modal component for consistent styling
const Modal = ({ isOpen, onClose, title, children, actions }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            
            <div className="relative bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-md transform transition-all">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    {children}
                </div>

                {/* Actions */}
                {actions && (
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function CreditConversions({ auth, conversions, stats, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.employee || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedConversion, setSelectedConversion] = useState(null);
    const searchInputRef = useRef(null);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₱0.00';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    const debouncedSearch = useCallback(
        debounce((term, status) => {
            router.get('/hr/credit-conversions', {
                employee: term || null,
                status: status || null,
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 300),
        []
    );

    const handleSearchChange = (term) => {
        setSearchTerm(term);
        debouncedSearch(term, statusFilter);
    };

    const handleStatusChange = (status) => {
        setStatusFilter(status);
        debouncedSearch(searchTerm, status);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        if (searchInputRef.current) {
            searchInputRef.current.value = '';
        }
        router.get('/hr/credit-conversions', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleRejectConversion = (conversion) => {
        setSelectedConversion(conversion);
        setShowRejectModal(true);
    };

    const renderPagination = () => {
        if (!conversions.links || conversions.links.length <= 3) return null;

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                    Showing {conversions.from} to {conversions.to} of {conversions.total} results
                </div>
                <div className="flex space-x-1">
                    {conversions.links.map((link, index) => (
                        <button
                            key={index}
                            onClick={() => link.url && router.visit(link.url, { preserveState: true, preserveScroll: true })}
                            disabled={!link.url}
                            className={`px-3 py-1 rounded-xl text-sm font-medium ${
                                link.active
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                                    : link.url
                                    ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>
        );
    };

    // Safe conversion data check
    const safeConversions = conversions?.data || [];

    return (
        <HRLayout>
            <Head title="Credit Conversion Management" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="relative">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                                Credit Conversion Management
                            </h1>
                            <p className="text-gray-600 text-lg">Review and manage employee Vacation Leave credit to cash conversion requests</p>
                            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Important Notice */}
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-6 shadow-lg">
                    <div className="flex items-start">
                        <div className="p-2 rounded-2xl bg-blue-500 text-white mr-4">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-blue-900">Important Information</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                <strong>Only Vacation Leave (VL) credits can be monetized.</strong> Sick Leave (SL) credits are not eligible for cash conversion. 
                                Minimum 10 VL credits required per request. Maximum 10 days can be converted per year.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Requests"
                        value={stats?.total || 0}
                        color="bg-blue-100"
                        trend={
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Pending HR Review"
                        value={stats?.pending || 0}
                        color="bg-yellow-100"
                        trend={
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Fully Approved"
                        value={stats?.approved || 0}
                        color="bg-green-100"
                        trend={
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Rejected Requests"
                        value={stats?.rejected || 0}
                        color="bg-red-100"
                        trend={
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        }
                    />
                </div>

                {/* Filters Section */}
                <div className="mb-6 bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                            <div className="relative max-w-md">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search employees by name..."
                                    defaultValue={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <label htmlFor="status" className="text-sm font-semibold text-gray-700">Status:</label>
                                <select
                                    id="status"
                                    value={statusFilter}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className="w-full md:w-48 border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending HR Review</option>
                                    <option value="hr_approved">Approved by HR</option>
                                    <option value="dept_head_approved">Approved by Dept Head</option>
                                    <option value="admin_approved">Fully Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => debouncedSearch(searchTerm, statusFilter)}
                                    className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    Apply Filters
                                </button>
                                {(searchTerm || statusFilter) && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-3 text-gray-600 hover:text-gray-800 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 transition whitespace-nowrap bg-white/50 backdrop-blur-sm"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conversions Table */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">VL Credit Conversion Requests</h2>
                        <span className="text-sm text-gray-500">
                            {conversions?.total || 0} request{conversions?.total !== 1 ? 's' : ''} found
                            {statusFilter && ` with status "${statusFilter}"`}
                            {searchTerm && ` matching "${searchTerm}"`}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead>
                                <tr className="bg-gray-50 text-left text-sm">
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Days</th>
                                    {/* <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Cash Equivalent</th> */}
                                    {/* <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Date Submitted</th> */}
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safeConversions.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                <p className="text-lg font-medium text-gray-600">No conversion requests found</p>
                                                <p className="text-gray-500 mt-2">
                                                    {searchTerm || statusFilter ? 'Try adjusting your search filters.' : 'Employees will appear here when they submit VL conversion requests.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    safeConversions.map((conversion) => {
                                        const isVL = conversion.leave_type_code === 'VL';
                                        const isPending = conversion.status === 'pending';
                                        const employee = conversion.employee || {};
                                        
                                        return (
                                            <tr 
                                                key={conversion.conversion_id} 
                                                className="border-t hover:bg-gray-50/50 transition-colors cursor-pointer"
                                                onClick={() => router.visit(route('hr.credit-conversions.show', conversion.conversion_id))}
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-3">
                                                        <EmployeeAvatar employee={employee} />
                                                        <EmployeeName employee={employee} />
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <DepartmentDisplay employee={employee} />
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-2xl text-xs font-medium ${
                                                        isVL 
                                                            ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white' 
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {conversion.leave_type_code} - {conversion.leave_type_name}
                                                        {isVL && (
                                                            <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                                                                Monetizable
                                                            </span>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-lg font-bold text-gray-900">
                                                        {conversion.credits_requested || 0} days
                                                    </div>
                                                </td>
                                                {/* <td className="p-4">
                                                    <div className="text-lg font-bold text-emerald-600">
                                                        {formatCurrency(conversion.equivalent_cash)}
                                                    </div>
                                                </td> */}
                                                {/* <td className="p-4">
                                                    <div className="text-sm text-gray-900">
                                                        {formatDate(conversion.submitted_at)}
                                                    </div>
                                                </td> */}
                                                <td className="p-4">
                                                    <StatusBadge status={conversion.status} />
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                                                        <Link 
                                                            href={route('hr.credit-conversions.show', conversion.conversion_id)}
                                                            className="px-3 py-2 text-indigo-600 hover:text-indigo-800 font-medium rounded-xl hover:bg-indigo-50 transition text-sm flex items-center"
                                                        >
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            View
                                                        </Link>
                                                        {isPending && (
                                                            <>
                                                                <Link 
                                                                    href={route('hr.credit-conversions.approve', conversion.conversion_id)}
                                                                    method="post"
                                                                    as="button"
                                                                    className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 text-sm flex items-center"
                                                                >
                                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    Approve
                                                                </Link>
                                                                <button
                                                                    onClick={() => handleRejectConversion(conversion)}
                                                                    className="px-3 py-2 bg-gradient-to-r from-rose-500 to-red-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 text-sm flex items-center"
                                                                >
                                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {renderPagination()}
                </div>
            </div>

            {/* Animated Background Elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
            </div>
        </HRLayout>
    );
}