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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-gray-900">Manage Leave Credits</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            View and manage employee leave credits
                        </p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <button
                            onClick={handleMonthlyCredit}
                            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${alreadyCredited ? 'bg-gray-400 ' : 'bg-blue-600 hover:bg-blue-700'}`}
                            
                        >
                            {alreadyCredited ? (
                                <>
                                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Monthly Credits Added
                                </>
                            ) : (
                                <>
                                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                    </svg>
                                    Add Monthly Credits (+1.25)
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employee Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SL Balance
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        VL Balance
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {employees.map((employee) => (
                                    <tr key={employee.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="font-medium text-blue-800">
                                                        {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                                    <div className="text-sm text-gray-500">{employee.department || 'No department'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">
                                                {employee.leave_credit?.sl_balance ?? (
                                                    <span className="text-gray-400 italic">To be updated by HR</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">
                                                {employee.leave_credit?.vl_balance ?? (
                                                    <span className="text-gray-400 italic">To be updated by HR</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                                                onClick={() => openModal(employee)}
                                            >
                                                Override
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 overflow-y-auto z-50">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeModal}></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Edit Leave Credits
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Update leave credits for {selectedEmployee.name}
                                            </p>
                                        </div>
                                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                            <div>
                                                <label htmlFor="sl_balance" className="block text-sm font-medium text-gray-700">
                                                    Sick Leave Balance
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    id="sl_balance"
                                                    value={data.sl_balance}
                                                    onChange={(e) => setData('sl_balance', e.target.value)}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="vl_balance" className="block text-sm font-medium text-gray-700">
                                                    Vacation Leave Balance
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    id="vl_balance"
                                                    value={data.vl_balance}
                                                    onChange={(e) => setData('vl_balance', e.target.value)}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                />
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </HRLayout>
    );
}