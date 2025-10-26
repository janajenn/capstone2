import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { 
    Filter,
    Download,
    Eye,
    AlertCircle,
    Clock,
    UserCheck,
    UserX,
    TrendingUp,
    CheckCircle,
    XCircle
} from 'lucide-react';

// Simple Select component if you don't have one
const Select = ({ id, value, onChange, options = [], className = '' }) => {
    return (
        <select
            id={id}
            value={value}
            onChange={onChange}
            className={`border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm w-full ${className}`}
        >
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

export default function AttendanceLogs({ auth, initialLogs, employees: employeeList }) {
    const [employees, setEmployees] = useState(initialLogs || []);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        employee_name: '',
        department_id: '',
        attendance_issue: '',
        late_threshold: 10,
        hours_threshold: 8,
    });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const showMessage = (text, type = 'success') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000);
    };

    const fetchEmployees = async (params = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                ...filters,
                ...params
            });
            
            const response = await fetch(`/hr/attendance/logs/api?${queryParams}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setEmployees(data.data || []);
        } catch (error) {
            console.error('Fetch error:', error);
            showMessage('Failed to fetch employee data: ' + error.message, 'error');
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            start_date: '',
            end_date: '',
            employee_name: '',
            department_id: '',
            attendance_issue: '',
            late_threshold: 10,
            hours_threshold: 8,
        });
    };

    const handleViewEmployeeLogs = (employeeId) => {
        router.visit(`/hr/attendance/logs/employee/${employeeId}`);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const attendanceIssueOptions = [
        { value: '', label: 'All Employees' },
        { value: 'late', label: 'Employees with Late Logs' },
        { value: 'missing_time_out', label: 'Employees with Time In but No Time Out' },
        { value: 'missing_time_in', label: 'Employees with Time Out but No Time In' },
        { value: 'multiple_lates', label: 'Employees with Multiple Late Incidents' },
        { value: 'insufficient_hours', label: 'Employees with Less than 8 Working Hours' },
    ];

    return (
        <HRLayout user={auth.user}>
            <Head title="Attendance Logs" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Attendance Logs</h1>
                        <p className="text-muted-foreground">
                            View and manage employee attendance records with advanced filtering
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <SecondaryButton onClick={() => router.visit('/hr/attendance/import')}>
                            <Download className="w-4 h-4 mr-2" />
                            Import Data
                        </SecondaryButton>
                    </div>
                </div>

                {/* Message Display */}
                {message && (
                    <div className={`p-4 rounded-md ${
                        messageType === 'error' 
                            ? 'bg-red-50 border border-red-200 text-red-800' 
                            : 'bg-green-50 border border-green-200 text-green-800'
                    }`}>
                        <div className="flex items-center">
                            {messageType === 'error' ? (
                                <XCircle className="w-5 h-5 mr-2" />
                            ) : (
                                <CheckCircle className="w-5 h-5 mr-2" />
                            )}
                            {message}
                        </div>
                    </div>
                )}

                {/* Enhanced Filters */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <Filter className="w-5 h-5 mr-2" />
                            Advanced Filters
                        </h3>
                    </div>
                    <div className="px-6 py-4">
                        {/* Main Filters - Adjusted grid for better responsiveness */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                            {/* Date filters - 2 columns on md, 3 on lg */}
                            <div className="lg:col-span-1">
                                <InputLabel htmlFor="start_date" value="Start Date" />
                                <TextInput
                                    id="start_date"
                                    type="date"
                                    value={filters.start_date}
                                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="lg:col-span-1">
                                <InputLabel htmlFor="end_date" value="End Date" />
                                <TextInput
                                    id="end_date"
                                    type="date"
                                    value={filters.end_date}
                                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="lg:col-span-1">
                                <InputLabel htmlFor="employee_name" value="Employee Name" />
                                <TextInput
                                    id="employee_name"
                                    type="text"
                                    value={filters.employee_name}
                                    onChange={(e) => handleFilterChange('employee_name', e.target.value)}
                                    placeholder="Search by name..."
                                    className="w-full"
                                />
                            </div>
                            {/* Attendance Issue - Moved to its own row on smaller screens */}
                            <div className="md:col-span-2 lg:col-span-2">
                                <InputLabel htmlFor="attendance_issue" value="Attendance Issue" />
                                <Select
                                    id="attendance_issue"
                                    value={filters.attendance_issue}
                                    onChange={(e) => handleFilterChange('attendance_issue', e.target.value)}
                                    options={attendanceIssueOptions}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Conditional filters - Full width */}
                        {filters.attendance_issue === 'multiple_lates' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div className="lg:col-span-1">
                                    <InputLabel htmlFor="late_threshold" value="Late Count Threshold" />
                                    <TextInput
                                        id="late_threshold"
                                        type="number"
                                        min="1"
                                        value={filters.late_threshold}
                                        onChange={(e) => handleFilterChange('late_threshold', e.target.value)}
                                        placeholder="Minimum late incidents"
                                        className="w-full"
                                    />
                                </div>
                                <div className="md:col-span-1 lg:col-span-2 flex items-end">
                                    <p className="text-sm text-gray-500 mb-1">
                                        Show employees with at least {filters.late_threshold} late incidents
                                    </p>
                                </div>
                            </div>
                        )}

                        {filters.attendance_issue === 'insufficient_hours' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div className="lg:col-span-1">
                                    <InputLabel htmlFor="hours_threshold" value="Hours Threshold" />
                                    <TextInput
                                        id="hours_threshold"
                                        type="number"
                                        min="1"
                                        max="24"
                                        step="0.5"
                                        value={filters.hours_threshold}
                                        onChange={(e) => handleFilterChange('hours_threshold', e.target.value)}
                                        placeholder="Maximum hours threshold"
                                        className="w-full"
                                    />
                                </div>
                                <div className="md:col-span-1 lg:col-span-2 flex items-end">
                                    <p className="text-sm text-gray-500 mb-1">
                                        Show employees with less than {filters.hours_threshold} working hours
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="text-sm text-gray-500">
                                {filters.attendance_issue && (
                                    <div className="flex items-center">
                                        <Filter className="w-4 h-4 mr-1" />
                                        Filtering: {attendanceIssueOptions.find(opt => opt.value === filters.attendance_issue)?.label}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                                <SecondaryButton 
                                    onClick={clearFilters}
                                    className="w-full sm:w-auto justify-center"
                                >
                                    Clear All Filters
                                </SecondaryButton>
                                <PrimaryButton 
                                    onClick={() => fetchEmployees()} 
                                    disabled={loading}
                                    className="w-full sm:w-auto justify-center"
                                >
                                    {loading ? 'Applying...' : 'Apply Filters'}
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Attendance Logs Table */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Employee Attendance Summary</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {Array.isArray(employees) ? employees.length : 0} employee(s) matching your criteria
                            {filters.attendance_issue && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    Filtered: {attendanceIssueOptions.find(opt => opt.value === filters.attendance_issue)?.label}
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        ) : !Array.isArray(employees) || employees.length === 0 ? (
                            <div className="text-center py-8">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No employees found matching your criteria</p>
                                <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Records</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Days</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent Days</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late Count</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issues</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {employees.map((employee) => (
                                        <tr 
                                            key={employee.employee_id} 
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() => handleViewEmployeeLogs(employee.employee_id)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {employee.firstname} {employee.lastname}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ID: {employee.employee_id}
                                                    </div>
                                                    {employee.biometric_id && (
                                                        <div className="text-xs text-gray-400">
                                                            Biometric: {employee.biometric_id}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {employee.department}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {employee.total_logs} records
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {employee.working_days} days
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    {employee.absent_days} days
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className={`font-medium ${
                                                    employee.total_hours < 8 ? 'text-red-600' : 'text-gray-900'
                                                }`}>
                                                    {employee.total_hours}h
                                                    {employee.total_hours < 8 && (
                                                        <Clock className="w-4 h-4 inline ml-1 text-red-500" />
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    employee.late_count > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {employee.late_count || 0} times
                                                    {employee.late_count > 0 && (
                                                        <TrendingUp className="w-3 h-3 ml-1" />
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-1">
                                                    {employee.has_missing_time_in && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                            <UserX className="w-3 h-3 mr-1" />
                                                            Missing Time In
                                                        </span>
                                                    )}
                                                    {employee.has_missing_time_out && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            <UserCheck className="w-3 h-3 mr-1" />
                                                            Missing Time Out
                                                        </span>
                                                    )}
                                                    {employee.late_count >= (filters.late_threshold || 10) && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                                            Multiple Lates
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div>
                                                    <div className="text-xs text-gray-500">From: {formatDate(employee.earliest_log_date)}</div>
                                                    <div className="text-xs text-gray-500">To: {formatDate(employee.latest_log_date)}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewEmployeeLogs(employee.employee_id);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 flex items-center"
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View Logs
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </HRLayout>
    );
}