import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { 
    Calendar, 
    Clock, 
    User, 
    TrendingUp, 
    AlertCircle, 
    CheckCircle, 
    XCircle,
    ChevronLeft,
    Filter
} from 'lucide-react';

export default function EmployeeAttendanceLogs({ auth, employee, attendanceLogs, summary, filters }) {
    const [selectedMonth, setSelectedMonth] = useState(filters.month);
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period);
    const [showFilters, setShowFilters] = useState(false);

    const handleFilterChange = () => {
        router.get(`/hr/attendance/logs/employee/${employee.employee_id}`, { 
            month: selectedMonth, 
            period: selectedPeriod 
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleMonthChange = (month) => {
        setSelectedMonth(month);
        handleFilterChange();
    };

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        handleFilterChange();
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Present':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'Late':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'Absent':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'Rest Day':
                return <Calendar className="w-4 h-4 text-blue-500" />;
            case 'No Time Records':
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present':
                return 'bg-green-100 text-green-800';
            case 'Late':
                return 'bg-yellow-100 text-yellow-800';
            case 'Absent':
                return 'bg-red-100 text-red-800';
            case 'Rest Day':
                return 'bg-blue-100 text-blue-800';
            case 'No Time Records':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <HRLayout user={auth.user}>
            <Head title={`${employee.firstname} ${employee.lastname} - Attendance Logs`} />

            <div className="space-y-6">
                {/* Back Button and Filter Controls */}
                <div className="flex items-center justify-between">
                    <Link 
                        href="/hr/attendance/logs"
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Back to Employee Summary
                    </Link>
                    <SecondaryButton
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center space-x-2"
                    >
                        <Filter className="w-4 h-4" />
                        <span>Filter</span>
                    </SecondaryButton>
                </div>
                {/* Employee Info */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {employee.firstname} {employee.lastname}
                            </h2>
                            <p className="text-sm text-gray-600">
                                {employee.department} • Employee ID: {employee.employee_id}
                            </p>
                            {employee.biometric_id && (
                                <p className="text-xs text-gray-500">
                                    Biometric ID: {employee.biometric_id}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <Calendar className="w-8 h-8 text-blue-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Working Days</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.working_days}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <Clock className="w-8 h-8 text-green-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Hours Worked</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.total_hours_worked}h</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <XCircle className="w-8 h-8 text-red-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Absent Days</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.absent_days}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <TrendingUp className="w-8 h-8 text-purple-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Avg Hours/Day</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.average_hours_per_day}h</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
                        
                        {/* Month Filter */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {filters.available_months.map((month) => (
                                    <button
                                        key={month}
                                        onClick={() => handleMonthChange(month)}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                            selectedMonth === month
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {new Date(month + '-01').toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            year: 'numeric' 
                                        })}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Period Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handlePeriodChange('full')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        selectedPeriod === 'full'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Full Month
                                </button>
                                <button
                                    onClick={() => handlePeriodChange('first_half')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        selectedPeriod === 'first_half'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    1-15
                                </button>
                                <button
                                    onClick={() => handlePeriodChange('second_half')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        selectedPeriod === 'second_half'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    16-End
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance Logs Table */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Attendance Records - {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
                                month: 'long', 
                                year: 'numeric' 
                            })} 
                            {selectedPeriod === 'first_half' && ' (1-15)'}
                            {selectedPeriod === 'second_half' && ' (16-End)'}
                        </h3>
                    </div>
                    
                    {attendanceLogs && attendanceLogs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Schedule
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time In
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time Out
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hours Worked
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Remarks
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {attendanceLogs.map((day, index) => (
                                        <tr key={day.date || `day-${index}`} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {day.date_formatted}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {day.day_of_week}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {day.has_log && day.log_data ? (
                                                    day.log_data.schedule_formatted
                                                ) : (
                                                    <span className="text-gray-400">No schedule</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {day.has_log && day.log_data ? (
                                                    day.log_data.time_in || (
                                                        <span className="text-gray-400">No time in</span>
                                                    )
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {day.has_log && day.log_data ? (
                                                    day.log_data.time_out || (
                                                        <span className="text-gray-400">No time out</span>
                                                    )
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {day.has_log && day.log_data ? (
                                                    day.log_data.hrs_worked_formatted
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {getStatusIcon(day.has_log ? day.log_data?.status : day.status)}
                                                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(day.has_log ? day.log_data?.status : day.status)}`}>
                                                        {day.has_log ? day.log_data?.status : day.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {day.has_log && day.log_data ? (
                                                    day.log_data.remarks || (
                                                        <span className="text-gray-400">No remarks</span>
                                                    )
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                No attendance records found for the selected period.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </HRLayout>
    );
}
