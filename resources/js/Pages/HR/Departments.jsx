import HRLayout from '@/Layouts/HRLayout';
import { usePage, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Departments() {
    const { departments, flash } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const { data, setData, post, put, reset, delete: destroy } = useForm({
        name: '',
    });

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
        if (confirm('Are you sure you want to delete this department?')) {
            destroy(route('hr.departments.delete', id));
        }
    };

    return (
        <HRLayout>
            <h1 className="text-2xl font-bold mb-4">Manage Departments</h1>

            {/* Flash Messages */}
            {flash.success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 mb-4 rounded">
                    {flash.success}
                </div>
            )}

            {/* Add Department Button */}
            <div className="mb-4">
                <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Add New Department
                </button>
            </div>

            {/* Departments Table */}
            <div className="overflow-x-auto bg-white shadow rounded-lg">
                <table className="min-w-full table-auto border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left border">Department Name</th>
                            <th className="px-4 py-2 text-left border">Department Head</th>
                            <th className="px-4 py-2 text-left border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.map((department) => (
                            <tr key={department.id}>
                                <td className="px-4 py-2 border">{department.name}</td>
                                <td className="px-4 py-2 border">
                                    {department.head ? department.head.name : 'Not Assigned'}
                                </td>
                                <td className="px-4 py-2 border">
                                    <div className="flex space-x-2">
                                        <button
                                            className="text-blue-500 hover:underline"
                                            onClick={() => openEditModal(department)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="text-red-500 hover:underline"
                                            onClick={() => handleDelete(department.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded shadow w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">
                            {isEditing ? 'Edit Department' : 'Add New Department'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block mb-1 font-medium">Department Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full border px-3 py-2 rounded"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                                    {isEditing ? 'Update' : 'Add'} Department
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </HRLayout>
    );
}
