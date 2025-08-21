import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import HRLayout from '@/Layouts/HRLayout';


export default function LeaveTypes() {
    const { leaveTypes, flash } = usePage().props;
    const [editing, setEditing] = useState(null);

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
                },
            });
        } else {
            form.post('/hr/leave-types', {
                onSuccess: () => form.reset(),
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
    };

    const cancelEdit = () => {
        form.reset();
        setEditing(null);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this leave type?')) {
            form.delete(`/hr/leave-types/${id}`);
        }
    };

    return (
        <HRLayout>
            <h1 className="text-2xl font-bold mb-4">Manage Leave Types</h1>

            {flash.success && (
                <div className="bg-green-100 text-green-800 p-2 mb-4 rounded">
                    {flash.success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="mb-6 space-y-4 bg-white p-4 rounded shadow">
                <div>
                    <label className="block mb-1">Name</label>
                    <input
                        type="text"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        className="border p-2 w-full rounded"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1">Code</label>
                    <input
                        type="text"
                        value={form.data.code}
                        onChange={(e) => form.setData('code', e.target.value)}
                        className="border p-2 w-full rounded"
                        required
                    />
                </div>

                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={form.data.earnable}
                            onChange={(e) => form.setData('earnable', e.target.checked)}
                        />
                        Earnable
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={form.data.deductible}
                            onChange={(e) => form.setData('deductible', e.target.checked)}
                        />
                        Deductible
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={form.data.document_required}
                            onChange={(e) => form.setData('document_required', e.target.checked)}
                        />
                        Document Required
                    </label>
                </div>

                <div className="flex space-x-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                        {editing ? 'Update' : 'Create'}
                    </button>
                    {editing && (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="bg-gray-300 px-4 py-2 rounded"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <table className="w-full bg-white rounded shadow">
                <thead>
                    <tr className="bg-gray-100 text-left">
                        <th className="p-2">Name</th>
                        <th className="p-2">Code</th>
                        <th className="p-2">Earnable</th>
                        <th className="p-2">Deductible</th>
                        <th className="p-2">Requires Doc</th>
                        <th className="p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {leaveTypes.map((type) => (
                        <tr key={type.id} className="border-t">
                            <td className="p-2">{type.name}</td>
                            <td className="p-2">{type.code}</td>
                            <td className="p-2">{type.earnable ? '✅' : '❌'}</td>
                            <td className="p-2">{type.deductible ? '✅' : '❌'}</td>
                            <td className="p-2">{type.document_required ? '✅' : '❌'}</td>
                            <td className="p-2 space-x-2">
                                <button
                                    onClick={() => startEdit(type)}
                                    className="text-blue-600 hover:underline"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(type.id)}
                                    className="text-red-600 hover:underline"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </HRLayout>
    );
}
