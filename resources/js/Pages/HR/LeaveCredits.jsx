import HRLayout from '@/Layouts/HRLayout';
import { usePage, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function LeaveCredits() {
    const { employees, alreadyCredited, flash, creditedMonth, creditedYear } = usePage().props;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const { data, setData, put, reset } = useForm({
        sl_balance: '',
        vl_balance: '',
    });

    const openModal = (employee) => {
        setSelectedEmployee(employee);
        setData({
            sl_balance: employee.leave_credit?.sl_balance ?? 0,
            vl_balance: employee.leave_credit?.vl_balance ?? 0,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEmployee(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        put(route('hr.leave-credits.update', selectedEmployee.id), {
            onSuccess: () => {
                closeModal();
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Leave credits updated successfully.',
                    timer: 3000,
                    showConfirmButton: false
                });
            },
        });
    };

    const handleMonthlyCredit = () => {
        if (alreadyCredited) {
            const monthYear = `${creditedMonth} ${creditedYear}`;
            Swal.fire({
                icon: 'warning',
                title: 'Already Added',
                text: `Leave credits for ${monthYear} have already been added.`,
                confirmButtonText: 'OK'
            });
            return;
        }

        router.post(route('hr.leave-credits.monthly-add'), {}, {
            preserveScroll: true,
            onSuccess: (page) => {
                const { creditedMonth, creditedYear } = page.props;
                const monthYear = `${creditedMonth} ${creditedYear}`;

                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: `Monthly leave credits for ${monthYear} were successfully added.`,
                    timer: 3000,
                    showConfirmButton: false
                });
            },
            onError: (errors) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to add monthly credits. Please try again.',
                    confirmButtonText: 'OK'
                });
            }
        });
    };

    return (
        <HRLayout>
            <h1 className="text-2xl font-bold mb-4">Manage Leave Credits</h1>

            {/* Add Monthly Credit Button */}
            <div className="mb-4">
                <button
                    onClick={handleMonthlyCredit}
                    className={`px-4 py-2 rounded text-white ${alreadyCredited ? 'bg-gray-400 ' : 'bg-blue-600 hover:bg-blue-700'}`}

                >
                    {alreadyCredited ? 'Monthly Credits Already Added' : 'Add Monthly Leave Credits (+1.25)'}
                </button>
            </div>

            <div className="overflow-x-auto bg-white shadow rounded-lg">
                <table className="min-w-full table-auto border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left border">Employee Name</th>
                            <th className="px-4 py-2 text-left border">SL Balance</th>
                            <th className="px-4 py-2 text-left border">VL Balance</th>
                            <th className="px-4 py-2 text-left border">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((employee) => (
                            <tr key={employee.id}>
                                <td className="px-4 py-2 border">{employee.name}</td>
                                <td className="px-4 py-2 border">{employee.leave_credit?.sl_balance ?? 'To be updated by HR'}</td>
                                <td className="px-4 py-2 border">{employee.leave_credit?.vl_balance ?? 'To be updated by HR'}</td>
                                <td className="px-4 py-2 border">
                                    <button
                                        className="text-blue-500 hover:underline"
                                        onClick={() => openModal(employee)}
                                    >
                                        Override Leave Credits
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded shadow w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">
                            Edit Leave Credits for {selectedEmployee.name}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block mb-1 font-medium">SL Balance</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.sl_balance}
                                    onChange={(e) => setData('sl_balance', e.target.value)}
                                    className="w-full border px-3 py-2 rounded"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1 font-medium">VL Balance</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.vl_balance}
                                    onChange={(e) => setData('vl_balance', e.target.value)}
                                    className="w-full border px-3 py-2 rounded"
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </HRLayout>
    );
}
