import HRLayout from '@/Layouts/HRLayout';
import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Departments() {
    const { departments, flash } = usePage().props;
    const { data, setData, post, reset } = useForm({ name: '' });

    const [editDept, setEditDept] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editDept) {
            post(`/hr/departments/${editDept.id}`, {
                _method: 'put',
                onSuccess: () => {
                    reset();
                    setEditDept(null);
                },
            });
        } else {
            post('/hr/departments', {
                onSuccess: () => reset(),
            });
        }
    };

    const handleEdit = (dept) => {
        setEditDept(dept);
        setData({ name: dept.name });
    };

    const handleDelete = (id) => {
        if (confirm('Delete this department?')) {
            post(`/hr/departments/${id}`, { _method: 'delete' });
        }
    };

    return (
        <HRLayout>
            <h1 className="text-2xl font-bold mb-4">Manage Departments</h1>

            {flash.success && (
                <div className="bg-green-100 text-green-800 p-2 rounded mb-4">
                    {flash.success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="mb-6 flex items-center gap-4">
                <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="border rounded p-2"
                    placeholder="Department name"
                />
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                    {editDept ? 'Update' : 'Add'}
                </button>
                {editDept && (
                    <button
                        type="button"
                        onClick={() => {
                            setEditDept(null);
                            reset();
                        }}
                        className="text-gray-500 underline"
                    >
                        Cancel
                    </button>
                )}
            </form>

            <table className="w-full bg-white rounded shadow">
                <thead>
                    <tr className="bg-gray-100 text-left">

                        <th className="p-2">Department Name</th>
                        <th className="p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {departments.map((dept, index) => (
                        <tr key={dept.id} className="border-t">

                            <td className="p-2">{dept.name}</td>
                            <td className="p-2 space-x-2">
                                <button
                                    onClick={() => handleEdit(dept)}
                                    className="text-blue-600 hover:underline"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(dept.id)}
                                    className="text-red-600 hover:underline"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    {departments.length === 0 && (
                        <tr>
                            <td colSpan="3" className="p-2 text-center text-gray-500">
                                No departments found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </HRLayout>
    );
}
