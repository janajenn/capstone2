import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import HRLayout from '@/Layouts/HRLayout';

export default function LeaveTypes() {
    const { leaveTypes, flash } = usePage().props;
    const [editing, setEditing] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const form = useForm({
        name: '',
        code: '',
        earnable: false,
        deductible: false,
        document_required: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            form.put(`/hr/leave-types/${editing.id}`, {
                onSuccess: () => {
                    form.reset();
                    setEditing(null);
                    setIsModalOpen(false);
                },
            });
        } else {
            form.post('/hr/leave-types', {
                onSuccess: () => {
                    form.reset();
                    setIsModalOpen(false);
                },
            });
        }
    };

    const startEdit = (type) => {
        form.setData({
            name: type.name,
            code: type.code,
            earnable: type.earnable,
            deductible: type.deductible,
            document_required: type.document_required,
        });
        setEditing(type);
        setIsModalOpen(true);
    };

    const cancelEdit = () => {
        form.reset();
        setEditing(null);
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this leave type?')) {
            form.delete(`/hr/leave-types/${id}`);
        }
    };

    const openModal = () => {
        setEditing(null);
        form.reset();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        form.reset();
        setEditing(null);
        setIsModalOpen(false);
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
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Leave Types</h1>
                    <button
                        onClick={openModal}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                    >
                        Add Leave Type
                    </button>
                </div>

                {flash.success && (
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {flash.success}
                    </div>
                )}

                {/* Modal Backdrop */}
                {isModalOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
                        onClick={closeModal}
                    ></div>
                )}

                {/* Modal */}
                <div className={`
                    fixed inset-0 z-50 flex items-center justify-center p-4
                    transition-all duration-300 ease-in-out
                    ${isModalOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
                `}>
                    <div
                        className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {editing ? 'Edit Leave Type' : 'Add New Leave Type'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                <input
                                    type="text"
                                    value={form.data.code}
                                    onChange={(e) => form.setData('code', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={form.data.earnable}
                                        onChange={(e) => form.setData('earnable', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Earnable</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={form.data.deductible}
                                        onChange={(e) => form.setData('deductible', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Deductible</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={form.data.document_required}
                                        onChange={(e) => form.setData('document_required', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Document Required</span>
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                                >
                                    {editing ? 'Update' : 'Create'} Leave Type
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">Leave Types List</h2>
                        <div className="text-sm text-gray-500">
                            Showing {leaveTypes.from} to {leaveTypes.to} of {leaveTypes.total} entries
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full bg-white">
                            <thead>
                                <tr className="bg-gray-50 text-left">
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Earnable</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Deductible</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Requires Doc</th>
                                    <th className="p-4 font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaveTypes.data.map((type) => (
                                    <tr key={type.id} className="border-t hover:bg-gray-50">
                                        <td className="p-4">{type.name}</td>
                                        <td className="p-4 font-mono text-sm">{type.code}</td>
                                        <td className="p-4 text-center">
                                            {type.earnable ? (
                                                <svg className="w-4 h-4 text-green-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-gray-400 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {type.deductible ? (
                                                <svg className="w-4 h-4 text-green-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-gray-400 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {type.document_required ? (
                                                <svg className="w-4 h-4 text-green-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-gray-400 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </td>
                                        <td className="p-4 space-x-2">
                                            <button
                                                onClick={() => startEdit(type)}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(type.id)}
                                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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
                                    className={`px-3 py-1 rounded-md border ${
                                        leaveTypes.prev_page_url
                                            ? 'text-gray-700 border-gray-300 hover:bg-gray-50'
                                            : 'text-gray-400 border-gray-200 cursor-not-allowed'
                                    }`}
                                >
                                    Previous
                                </button>

                                {/* Page Numbers */}
                                <div className="hidden sm:flex space-x-1">
                                    {getPageNumbers().map((page, index) => (
                                        page === '...' ? (
                                            <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-400">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => goToPage(page)}
                                                className={`px-3 py-1 rounded-md border ${
                                                    page === leaveTypes.current_page
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'text-gray-700 border-gray-300 hover:bg-gray-50'
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
                                    className={`px-3 py-1 rounded-md border ${
                                        leaveTypes.next_page_url
                                            ? 'text-gray-700 border-gray-300 hover:bg-gray-50'
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
