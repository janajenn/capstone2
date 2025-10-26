import { useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import HRLayout from '@/Layouts/HRLayout';

export default function LeaveTypes() {
    const { leaveTypes, flash } = usePage().props;
    const [editing, setEditing] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSickOrVacation, setIsSickOrVacation] = useState(false);

    const form = useForm({
        name: '',
        code: '',
        earnable: false,
        deductible: false,
        document_required: false,
        default_days: null,
    });

    // Check if the current code is SL or VL to disable default_days
    useEffect(() => {
        const code = form.data.code.toUpperCase();
        setIsSickOrVacation(code === 'SL' || code === 'VL');
        
        // If code is SL or VL, force default_days to be null
        if (isSickOrVacation) {
            form.setData('default_days', null);
        }
    }, [form.data.code]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            form.put(`/hr/leave-types/${editing.id}`, {
                onSuccess: () => {
                    form.reset();
                    setEditing(null);
                    setIsModalOpen(false);
                    setIsSickOrVacation(false);
                },
            });
        } else {
            form.post('/hr/leave-types', {
                onSuccess: () => {
                    form.reset();
                    setIsModalOpen(false);
                    setIsSickOrVacation(false);
                },
            });
        }
    };

    const startEdit = (type) => {
        const code = type.code.toUpperCase();
        const isSickVacation = code === 'SL' || code === 'VL';
        
        form.setData({
            name: type.name,
            code: type.code,
            earnable: type.earnable,
            deductible: type.deductible,
            document_required: type.document_required,
            default_days: isSickVacation ? null : type.default_days,
        });
        
        setIsSickOrVacation(isSickVacation);
        setEditing(type);
        setIsModalOpen(true);
    };

    const cancelEdit = () => {
        form.reset();
        setEditing(null);
        setIsModalOpen(false);
        setIsSickOrVacation(false);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this leave type?')) {
            form.delete(`/hr/leave-types/${id}`);
        }
    };

    const openModal = () => {
        setEditing(null);
        form.reset();
        setIsSickOrVacation(false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        form.reset();
        setEditing(null);
        setIsSickOrVacation(false);
        setIsModalOpen(false);
    };

    // Handle default_days input change
    const handleDefaultDaysChange = (e) => {
        const value = e.target.value;
        // Convert empty string to null, otherwise parse as integer
        form.setData('default_days', value === '' ? null : parseInt(value));
    };

    // Handle code input change
    const handleCodeChange = (e) => {
        const value = e.target.value;
        form.setData('code', value);
        
        // Check if code is SL or VL
        const code = value.toUpperCase();
        setIsSickOrVacation(code === 'SL' || code === 'VL');
        
        // If code is SL or VL, force default_days to be null
        if (code === 'SL' || code === 'VL') {
            form.setData('default_days', null);
        }
    };

    // Pagination functions
    const previousPage = () => {
        if (leaveTypes.prev_page_url) {
            window.location.href = leaveTypes.prev_page_url;
        }
    };

    const nextPage = () => {
        if (leaveTypes.next_page_url) {
            window.location.href = leaveTypes.next_page_url;
        }
    };

    const goToPage = (page) => {
        if (page !== leaveTypes.current_page) {
            const url = new URL(leaveTypes.first_page_url);
            url.searchParams.set('page', page);
            window.location.href = url.toString();
        }
    };

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = [];
        const current = leaveTypes.current_page;
        const last = leaveTypes.last_page;
        const delta = 2; // Number of pages to show on each side of current page

        for (let i = 1; i <= last; i++) {
            if (i === 1 || i === last || (i >= current - delta && i <= current + delta)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }

        return pages;
    };

    return (
        <HRLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="relative">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                                Leave Types Management
                            </h1>
                            <p className="text-gray-600 text-lg">Configure and manage all leave types within your organization</p>
                            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                        </div>
                        <button
                            onClick={openModal}
                            className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 shadow-lg"
                        >
                            + Add Leave Type
                        </button>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash.success && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl mb-6 flex items-center shadow-lg">
                        <div className="p-2 rounded-xl bg-emerald-500 text-white mr-3">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        {flash.success}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 p-6 rounded-3xl shadow-xl">
                        <div className="flex items-center">
                            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h2 className="text-2xl font-bold text-gray-800">{leaveTypes.total}</h2>
                                <p className="text-sm text-gray-600">Total Leave Types</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 p-6 rounded-3xl shadow-xl">
                        <div className="flex items-center">
                            <div className="p-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {leaveTypes.data.filter(type => type.earnable).length}
                                </h2>
                                <p className="text-sm text-gray-600">Earnable Types</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 p-6 rounded-3xl shadow-xl">
                        <div className="flex items-center">
                            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {leaveTypes.data.filter(type => type.deductible).length}
                                </h2>
                                <p className="text-sm text-gray-600">Deductible Types</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 p-6 rounded-3xl shadow-xl">
                        <div className="flex items-center">
                            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {leaveTypes.data.filter(type => type.document_required).length}
                                </h2>
                                <p className="text-sm text-gray-600">Require Documents</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add/Edit Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 transition-opacity duration-300 flex items-start justify-center p-4 pt-20">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden transform transition-all">
                            <div className="px-8 py-6 border-b border-gray-200 bg-white">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-indigo-800 bg-clip-text text-transparent">
                                    {editing ? 'Edit Leave Type' : 'Add New Leave Type'}
                                </h2>
                                <p className="text-gray-600 text-sm mt-1">
                                    {editing ? 'Update leave type details' : 'Create a new leave type in the system'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="px-8 py-6 max-h-[70vh] overflow-y-auto">
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                    <input
                                        type="text"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                        placeholder="Enter leave type name"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                                    <input
                                        type="text"
                                        value={form.data.code}
                                        onChange={handleCodeChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                        placeholder="e.g., SL, VL, SPL, etc."
                                        required
                                    />
                                    {isSickOrVacation && (
                                        <p className="text-sm text-blue-600 mt-2 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            Note: Sick Leave (SL) and Vacation Leave (VL) cannot have default days as they are earned through credits.
                                        </p>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Default Days {isSickOrVacation && '(Not allowed for SL/VL)'}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.data.default_days === null ? '' : form.data.default_days}
                                        onChange={handleDefaultDaysChange}
                                        className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                                            isSickOrVacation 
                                                ? 'bg-gray-100 cursor-not-allowed border-gray-200' 
                                                : 'border-gray-200 bg-white/50 backdrop-blur-sm'
                                        }`}
                                        placeholder={isSickOrVacation ? 'Not applicable for SL/VL' : 'Leave blank for no default'}
                                        disabled={isSickOrVacation}
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                        {isSickOrVacation 
                                            ? 'Sick and Vacation leaves are earned through credits and reset annually.'
                                            : 'Number of days automatically granted and reset every January 1. Leave blank if not applicable.'
                                        }
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors bg-white/50 backdrop-blur-sm">
                                        <input
                                            type="checkbox"
                                            checked={form.data.earnable}
                                            onChange={(e) => form.setData('earnable', e.target.checked)}
                                            className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Earnable</span>
                                    </label>

                                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors bg-white/50 backdrop-blur-sm">
                                        <input
                                            type="checkbox"
                                            checked={form.data.deductible}
                                            onChange={(e) => form.setData('deductible', e.target.checked)}
                                            className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Deductible</span>
                                    </label>

                                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors bg-white/50 backdrop-blur-sm">
                                        <input
                                            type="checkbox"
                                            checked={form.data.document_required}
                                            onChange={(e) => form.setData('document_required', e.target.checked)}
                                            className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Document Required</span>
                                    </label>
                                </div>

                                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                                    <button 
                                        type="button" 
                                        onClick={closeModal}
                                        className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-2xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={form.processing}
                                        className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-2xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-lg hover:scale-105 disabled:opacity-75 transition-all duration-300"
                                    >
                                        {form.processing ? 'Processing...' : editing ? 'Update Leave Type' : 'Add Leave Type'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Leave Types Table */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Leave Types List</h2>
                        <span className="text-sm text-gray-500">
                            {leaveTypes.total} leave type{leaveTypes.total !== 1 ? 's' : ''} configured
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead>
                                <tr className="bg-gray-50 text-left text-sm">
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Default Days</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Properties</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaveTypes.data.map((type) => {
                                    const isSickVacation = type.code.toUpperCase() === 'SL' || type.code.toUpperCase() === 'VL';
                                    return (
                                        <tr key={type.id} className="border-t hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{type.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                    {type.code}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {isSickVacation ? (
                                                    <span className="text-gray-400 text-sm" title="Earned through credits">N/A</span>
                                                ) : type.default_days !== null ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                        {type.default_days} days
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {type.earnable === 1 && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Earnable
                                                        </span>
                                                    )}
                                                    {type.deductible === 1 && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                            Deductible
                                                        </span>
                                                    )}
                                                    {type.document_required === 1 && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                            Requires Doc
                                                        </span>
                                                    )}
                                                    {type.earnable === 0 && type.deductible === 0 && type.document_required === 0 && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                            Not Required
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end space-x-3">
                                                    <button
                                                        onClick={() => startEdit(type)}
                                                        className="inline-flex items-center px-4 py-2 text-indigo-600 font-medium rounded-xl hover:bg-indigo-50 transition-all duration-300"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(type.id)}
                                                        className="inline-flex items-center px-4 py-2 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-all duration-300"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {leaveTypes.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {leaveTypes.from} to {leaveTypes.to} of {leaveTypes.total} results
                            </div>
                            <div className="flex space-x-2">
                                {/* Previous Button */}
                                <button
                                    onClick={previousPage}
                                    disabled={!leaveTypes.prev_page_url}
                                    className={`px-4 py-2 rounded-2xl border-2 transition-all ${
                                        leaveTypes.prev_page_url
                                            ? 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:shadow-lg'
                                            : 'text-gray-400 border-gray-200 cursor-not-allowed'
                                    }`}
                                >
                                    Previous
                                </button>

                                {/* Page Numbers */}
                                <div className="hidden sm:flex space-x-1">
                                    {getPageNumbers().map((page, index) => (
                                        page === '...' ? (
                                            <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-400">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => goToPage(page)}
                                                className={`px-4 py-2 rounded-2xl border-2 transition-all ${
                                                    page === leaveTypes.current_page
                                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500 shadow-lg'
                                                        : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:shadow-lg'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    ))}
                                </div>

                                {/* Next Button */}
                                <button
                                    onClick={nextPage}
                                    disabled={!leaveTypes.next_page_url}
                                    className={`px-4 py-2 rounded-2xl border-2 transition-all ${
                                        leaveTypes.next_page_url
                                            ? 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:shadow-lg'
                                            : 'text-gray-400 border-gray-200 cursor-not-allowed'
                                    }`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </HRLayout>
    );
}