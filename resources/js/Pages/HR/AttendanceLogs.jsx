import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import HRLayout from '@/Layouts/HRLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { 
    Calendar,
    Filter,
    Download,
    Eye,
    AlertCircle
} from 'lucide-react';

export default function AttendanceLogs({ auth, initialLogs, employees: employeeList }) {
    const [employees, setEmployees] = useState(initialLogs?.data || []);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        employee_name: '',
        department_id: ''
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
            const data = await response.json();
            setEmployees(data.data);
        } catch (error) {
            showMessage('Failed to fetch employee data', 'error');
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

    return (
        <HRLayout user={auth.user}>
            <Head title="Attendance Logs" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Attendance Logs</h1>
                        <p className="text-muted-foreground">
                            View and manage employee attendance records
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

                {/* Filters */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <Filter className="w-5 h-5 mr-2" />
                            Filters
                        </h3>
                    </div>
                    <div className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <InputLabel htmlFor="start_date" value="Start Date" />
                                <TextInput
                                    id="start_date"
                                    type="date"
                                    value={filters.start_date}
                                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="end_date" value="End Date" />
                                <TextInput
                                    id="end_date"
                                    type="date"
                                    value={filters.end_date}
                                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="employee_name" value="Employee Name" />
                                <TextInput
                                    id="employee_name"
                                    type="text"
                                    value={filters.employee_name}
                                    onChange={(e) => handleFilterChange('employee_name', e.target.value)}
                                    placeholder="Search by name..."
                                />
                            </div>
                            <div className="flex items-end">
                                <SecondaryButton 
                                    onClick={() => setFilters({ start_date: '', end_date: '', employee_name: '', department_id: '' })}
                                    className="w-full"
                                >
                                    Clear Filters
                                </SecondaryButton>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Attendance Logs Table */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Employee Attendance Summary</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {employees.length} employee(s) with attendance records
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        ) : employees.length === 0 ? (
                            <div className="text-center py-8">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No employees with attendance records found</p>
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
                                                <span className="font-medium">{employee.total_hours}h</span>
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