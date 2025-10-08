import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';

const EmployeeRecordings = () => {
    const { employee, recordings, year, years } = usePage().props;
    const [selectedYear, setSelectedYear] = useState(year);
    const [editingRemarks, setEditingRemarks] = useState(null);
    const [remarksValue, setRemarksValue] = useState('');

    // Helper function inside component
    const parseDateRangeToDays = (fromDate, toDate) => {
        try {
            const start = new Date(fromDate);
            const end = new Date(toDate);
            const days = [];
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return [];
            }
            
            const currentDate = new Date(start);
            
            while (currentDate <= end) {
                const dayNumber = currentDate.getDate();
                days.push(dayNumber);
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            return days;
        } catch (error) {
            console.error('Error parsing date range:', error);
            return [];
        }
    };

    const handleYearChange = (newYear) => {
        setSelectedYear(newYear);
        router.get(route('hr.leave-recordings.employee', { 
            employee: employee.employee_id,
            year: newYear
        }));
    };

    const goBack = () => {
        router.visit(route('hr.leave-recordings'));
    };

    const startEditRemarks = (employeeId, year, month, currentRemarks) => {
        setEditingRemarks({ employeeId, year, month });
        setRemarksValue(currentRemarks || '');
    };

    const cancelEditRemarks = () => {
        setEditingRemarks(null);
        setRemarksValue('');
    };

    const saveRemarks = async (employeeId, year, month) => {
        try {
            const response = await fetch(route('hr.leave-recordings.update-remarks', employeeId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({
                    remarks: remarksValue,
                    employee_id: employeeId,
                    year: year,
                    month: month,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setEditingRemarks(null);
                setRemarksValue('');
                // Refresh the page to show updated data
                router.reload();
            } else {
                alert('Failed to update remarks: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating remarks:', error);
            alert('Failed to update remarks.');
        }
    };

    const formatLateDays = (days) => {
        if (days === null || days === undefined || days === '–') return '–';
        const num = typeof days === 'string' ? parseFloat(days) : days;
        return Number.isNaN(num) ? '–' : num.toFixed(3);
    };

    return (
        <HRLayout>
            <Head title={`Leave Recordings - ${employee.firstname} ${employee.lastname}`} />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <button
                                        onClick={goBack}
                                        className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Back to Employees
                                    </button>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {employee.firstname} {employee.lastname}
                                    </h1>
                                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                                        <span className="flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            {employee.department}
                                        </span>
                                        <span className="flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            {employee.position}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <label className="text-sm font-medium text-gray-700">Year:</label>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => handleYearChange(parseInt(e.target.value))}
                                            className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            {years.map((year) => (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recordings Table */}
                    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Month
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Leave Dates
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Lates
        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            VL Earned
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            VL Used
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            VL Balance
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            SL Earned
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            SL Used
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            SL Balance
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Remarks
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recordings.map((recording, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                {recording.date_month}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
    {recording.inclusive_dates && recording.inclusive_dates.length > 0 ? (
        <div className="space-y-1">
            {recording.inclusive_dates.map((date, idx) => {
                const dayNumbers = parseDateRangeToDays(date.from, date.to);
                return (
                    <div key={idx} className="text-xs leading-tight">
                        {dayNumbers.length > 0 ? (
                            <span className="text-gray-700 font-medium">
                                {dayNumbers.join(', ')}
                            </span>
                        ) : (
                            <span className="text-gray-400">Invalid date range</span>
                        )}
                        <span className="text-gray-500 ml-1 text-xs">({date.type})</span>
                    </div>
                );
            })}
        </div>
    ) : (
        <span className="text-gray-400 text-xs">No leaves</span>
    )}
</td>

<td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 text-center">
    {formatLateDays(recording.total_lates)}
</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 text-center">
                                                {recording.vl_earned ?? '–'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                                                {recording.vl_used}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 text-center">
                                                {recording.vl_balance ?? '–'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 text-center">
                                                {recording.sl_earned ?? '–'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                                                {recording.sl_used}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 text-center">
                                                {recording.sl_balance ?? '–'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                                                {editingRemarks && 
                                                 editingRemarks.employeeId === employee.employee_id &&
                                                 editingRemarks.year === recording.year &&
                                                 editingRemarks.month === recording.month ? (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            value={remarksValue}
                                                            onChange={(e) => setRemarksValue(e.target.value)}
                                                            rows="2"
                                                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                            placeholder="Enter remarks..."
                                                        />
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => saveRemarks(employee.employee_id, recording.year, recording.month)}
                                                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={cancelEditRemarks}
                                                                className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div 
                                                        onClick={() => startEditRemarks(
                                                            employee.employee_id, 
                                                            recording.year, 
                                                            recording.month, 
                                                            recording.remarks
                                                        )}
                                                        className="cursor-pointer hover:bg-gray-100 p-2 rounded border border-transparent hover:border-gray-300 min-h-[40px]"
                                                    >
                                                        {recording.remarks ? (
                                                            <span className="text-gray-700 text-xs">{recording.remarks}</span>
                                                        ) : (
                                                            <span className="text-gray-400 italic text-xs">Click to add remarks</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                                {recording.total_vl_sl ?? '–'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Empty State */}
                        {recordings.length === 0 && (
                            <div className="text-center py-8">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No recordings found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    No leave recordings found for {selectedYear}.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </HRLayout>
    );
};

export default EmployeeRecordings;