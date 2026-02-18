import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';

const EmployeeRecordings = () => {
    const { employee, recordings, year, years } = usePage().props;
    const [selectedYear, setSelectedYear] = useState(year);
    const [editingRemarks, setEditingRemarks] = useState(null);
    const [remarksValue, setRemarksValue] = useState('');

    console.log('First recording inclusive_dates:', recordings[0]?.inclusive_dates);

    // Helper functions remain unchanged
    const safeToFixed = (value, decimals = 3) => {
        if (value === null || value === undefined || value === '–') return '–';
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return Number.isNaN(num) ? '–' : num.toFixed(decimals);
    };

    const safeNumber = (value) => {
        if (value === null || value === undefined || value === '–') return 0;
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return Number.isNaN(num) ? 0 : num;
    };

    // Parse date range to individual days – used only for display
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

    const saveRemarks = (employeeId, year, month) => {
        router.put(route('hr.leave-recordings.update-remarks', employeeId), {
            remarks: remarksValue,
            employee_id: employeeId,
            year: year,
            month: month,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingRemarks(null);
                setRemarksValue('');
            },
            onError: (errors) => {
                alert('Failed to update remarks. Please try again.');
            }
        });
    };

    const formatLateDays = (days) => {
        if (days === null || days === undefined || days === '–') return '–';
        const num = safeNumber(days);
        
        if (num === 0 || Number.isNaN(num)) {
            return 'No lates';
        }
        
        return num.toFixed(3);
    };

    const hasLates = (days) => {
        if (days === null || days === undefined || days === '–') return false;
        const num = safeNumber(days);
        return !Number.isNaN(num) && num > 0;
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            'approved': 'bg-green-100 text-green-800',
            'pending': 'bg-yellow-100 text-yellow-800',
            'rejected': 'bg-red-100 text-red-800',
            'default': 'bg-gray-100 text-gray-800'
        };
        
        const colorClass = statusColors[status?.toLowerCase()] || statusColors.default;
        return `inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${colorClass}`;
    };

    return (
        <HRLayout>
            <Head title={`Leave Recordings - ${employee.firstname} ${employee.lastname}`} />

            <div className="py-6">
                <div className="max-w-full mx-auto sm:px-4 lg:px-6">
                    {/* Header with back button, employee info, and year filter */}
                    <div className="bg-white overflow-hidden shadow-lg sm:rounded-lg mb-6 border border-gray-200">
                        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <button
                                        onClick={goBack}
                                        className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors font-medium group"
                                    >
                                        <svg className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Back to Employees
                                    </button>
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                {employee.firstname[0]}{employee.lastname[0]}
                                            </div>
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900">
                                                {employee.firstname} {employee.lastname}
                                            </h1>
                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                                <span className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                                                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    {employee.department}
                                                </span>
                                                <span className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                                                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    {employee.position}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Year:</label>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => handleYearChange(parseInt(e.target.value))}
                                            className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
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
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                {/* Table header and body remain exactly as before */}
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th rowSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                                            Month
                                        </th>
                                        <th rowSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                                            Leave Dates
                                        </th>
                                        <th rowSpan={2} className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                                            Lates
                                        </th>
                                        <th colSpan={3} className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-blue-50">
                                            Vacation Leave
                                        </th>
                                        <th colSpan={3} className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-green-50">
                                            Sick Leave
                                        </th>
                                        <th rowSpan={2} className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                                            Total
                                        </th>
                                        <th rowSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Remarks
                                        </th>
                                    </tr>
                                    <tr>
                                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200">Earned</th>
                                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200">Used</th>
                                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200">Balance</th>
                                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200">Earned</th>
                                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200">Used</th>
                                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recordings.map((recording, index) => (
                                        <tr 
                                            key={index} 
                                            className={`hover:bg-gray-50 transition-colors duration-150 ${
                                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                            }`}
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900 border-r border-gray-200">
                                                {recording.date_month}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-900 border-r border-gray-200 max-w-xs">
                                                {recording.inclusive_dates && recording.inclusive_dates.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {recording.inclusive_dates.map((date, idx) => {
                                                            const dayNumbers = parseDateRangeToDays(date.from, date.to);
                                                            const statusBadge = getStatusBadge(date.status);
                                                            return (
                                                                <div key={idx} className="flex items-center gap-1 flex-wrap">
                                                                    <span className="font-mono text-gray-700">
                                                                        {dayNumbers.length > 0 ? dayNumbers.join(', ') : 'Invalid'}
                                                                    </span>
                                                                    <span className={statusBadge}>
                                                                        {date.status || 'Pending'}
                                                                    </span>
                                                                    <span className="text-gray-500 text-xs">
                                                                        {date.type} {date.code && `(${date.code})`}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">No leaves</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-center border-r border-gray-200">
                                                {hasLates(recording.total_lates) ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        {formatLateDays(recording.total_lates)}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {formatLateDays(recording.total_lates)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-2 py-3 whitespace-nowrap text-xs text-center border-r border-gray-200 text-green-600 font-semibold">
                                                {safeToFixed(recording.vl_earned)}
                                            </td>
                                            <td className="px-2 py-3 whitespace-nowrap text-xs text-center border-r border-gray-200 text-gray-900 font-medium">
                                                {safeToFixed(recording.vl_used)}
                                            </td>
                                            <td className="px-2 py-3 whitespace-nowrap text-xs text-center border-r border-gray-200 font-bold"
                                                style={{
                                                    color: safeNumber(recording.vl_balance) > 5 ? '#059669' :
                                                           safeNumber(recording.vl_balance) > 2 ? '#D97706' : '#DC2626'
                                                }}>
                                                {safeToFixed(recording.vl_balance)}
                                            </td>
                                            <td className="px-2 py-3 whitespace-nowrap text-xs text-center border-r border-gray-200 text-green-600 font-semibold">
                                                {safeToFixed(recording.sl_earned)}
                                            </td>
                                            <td className="px-2 py-3 whitespace-nowrap text-xs text-center border-r border-gray-200 text-gray-900 font-medium">
                                                {safeToFixed(recording.sl_used)}
                                            </td>
                                            <td className="px-2 py-3 whitespace-nowrap text-xs text-center border-r border-gray-200 font-bold"
                                                style={{
                                                    color: safeNumber(recording.sl_balance) > 5 ? '#059669' :
                                                           safeNumber(recording.sl_balance) > 2 ? '#D97706' : '#DC2626'
                                                }}>
                                                {safeToFixed(recording.sl_balance)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-center border-r border-gray-200">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-bold">
                                                    {safeToFixed(recording.total_vl_sl)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                                {editingRemarks &&
                                                    editingRemarks.employeeId === employee.employee_id &&
                                                    editingRemarks.year === recording.year &&
                                                    editingRemarks.month === recording.month ? (
                                                    <div className="space-y-3">
                                                        <textarea
                                                            value={remarksValue}
                                                            onChange={(e) => setRemarksValue(e.target.value)}
                                                            rows="3"
                                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm resize-none"
                                                            placeholder="Enter remarks for this month..."
                                                            autoFocus
                                                        />
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => saveRemarks(employee.employee_id, recording.year, recording.month)}
                                                                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                                                            >
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={cancelEditRemarks}
                                                                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors"
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
                                                        className="cursor-pointer hover:bg-gray-50 p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-300 transition-all duration-200 min-h-[80px] group"
                                                    >
                                                        {recording.remarks ? (
                                                            <div>
                                                                <span className="text-gray-700 text-sm leading-relaxed">{recording.remarks}</span>
                                                                <div className="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                    Click to edit remarks
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center text-gray-400 group-hover:text-blue-400 transition-colors">
                                                                <svg className="w-6 h-6 mx-auto mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                </svg>
                                                                <span className="text-xs italic">Click to add remarks</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Empty State */}
                        {recordings.length === 0 && (
                            <div className="text-center py-12 bg-gray-50">
                                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings found</h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    No leave recordings found for {employee.firstname} {employee.lastname} in {selectedYear}.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Summary Cards */}
                    {recordings.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                            {/* Cards content unchanged */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center">
                                    <div className="bg-blue-100 p-3 rounded-lg">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total VL Balance</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {safeToFixed(recordings.reduce((sum, rec) => sum + safeNumber(rec.vl_balance), 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center">
                                    <div className="bg-green-100 p-3 rounded-lg">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total SL Balance</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {safeToFixed(recordings.reduce((sum, rec) => sum + safeNumber(rec.sl_balance), 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center">
                                    <div className="bg-red-100 p-3 rounded-lg">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Lates</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {safeToFixed(recordings.reduce((sum, rec) => {
                                                const lates = safeNumber(rec.total_lates);
                                                return lates > 0 ? sum + lates : sum;
                                            }, 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center">
                                    <div className="bg-purple-100 p-3 rounded-lg">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Leaves</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                            {safeToFixed(recordings.reduce((sum, rec) => sum + safeNumber(rec.total_vl_sl), 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </HRLayout>
    );
};

export default EmployeeRecordings;