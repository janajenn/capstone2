import HRLayout from '@/Layouts/HRLayout';
import { usePage, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Departments() {
    const { departments, flash } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { data, setData, post, put, reset, delete: destroy, processing } = useForm({
        name: '',
    });

    // Filter departments based on search term
    const filteredDepartments = departments.filter(dept => 
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.head && dept.head.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const openAddModal = () => {
        setIsEditing(false);
        setEditingDepartment(null);
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (department) => {
        setIsEditing(true);
        setEditingDepartment(department);
        setData('name', department.name);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingDepartment(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isEditing) {
            put(route('hr.departments.update', editingDepartment.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('hr.departments.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
            destroy(route('hr.departments.delete', id));
        }
    };

    return (
        <HRLayout>
            <div className="min-h-screen bg-gray-50 p-6">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Department Management</h1>
                            <p className="text-gray-600 mt-1">Manage all departments within your organization</p>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="mt-4 md:mt-0 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md hover:shadow-lg"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add New Department
                        </button>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash.success && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md shadow-sm">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-green-700">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center">
                            <div className="p-3 rounded-lg bg-blue-50">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h2 className="text-2xl font-bold text-gray-800">{departments.length}</h2>
                                <p className="text-sm text-gray-600">Total Departments</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center">
                            <div className="p-3 rounded-lg bg-green-50">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {departments.filter(dept => dept.head !== null).length}
                                </h2>
                                <p className="text-sm text-gray-600">Departments with Heads</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center">
                            <div className="p-3 rounded-lg bg-amber-50">
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {departments.filter(dept => dept.head === null).length}
                                </h2>
                                <p className="text-sm text-gray-600">Departments Needing Heads</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="w-full md:w-1/2 mb-4 md:mb-0">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search departments or department heads..."
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                                {filteredDepartments.length} of {departments.length} departments
                            </span>
                        </div>
                    </div>
                </div>

                {/* Departments Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Department Head
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredDepartments.length > 0 ? (
                                    filteredDepartments.map((department) => (
                                        <tr key={department.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{department.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {department.head ? (
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{department.head.name}</div>
                                                            <div className="text-sm text-gray-500">{department.head.position}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                        Not Assigned
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {department.head ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Needs Attention
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-3">
                                                    <button
                                                        onClick={() => openEditModal(department)}
                                                        className="text-blue-600 hover:text-blue-900 transition-colors flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(department.id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No departments found</h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Try adjusting your search or filter to find what you're looking for.
                                            </p>
                                            <div className="mt-6">
                                                <button
                                                    onClick={openAddModal}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                    </svg>
                                                    Add Department
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add/Edit Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    {isEditing ? 'Edit Department' : 'Add New Department'}
                                </h2>
                            </div>
                            <form onSubmit={handleSubmit} className="px-6 py-4">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter department name"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={closeModal}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={processing}
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
                                    >
                                        {processing ? 'Processing...' : isEditing ? 'Update Department' : 'Add Department'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </HRLayout>
    );
}