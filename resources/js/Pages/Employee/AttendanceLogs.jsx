import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion,AnimatePresence } from 'framer-motion';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
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
    Filter,
    Plus
} from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.6,
            staggerChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { 
        opacity: 0, 
        y: 20,
        scale: 0.95
    },
    visible: { 
        opacity: 1, 
        y: 0,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    }
};

const cardHover = {
    hover: { 
        y: -2,
        transition: { duration: 0.2 }
    }
};

export default function AttendanceLogs({ auth, employee, attendanceLogs, summary, filters }) {
    const [selectedMonth, setSelectedMonth] = useState(filters.month);
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period);
    const [showFilters, setShowFilters] = useState(false);

    const handleFilterChange = () => {
        router.get('/employee/attendance-logs', { 
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

    const handleRequestLeave = (absentDate) => {
        // Redirect to request leave page with the absent date pre-filled
        router.visit('/employee/leave', {
            data: {
                prefill_date: absentDate
            }
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Present':
                return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'Late':
                return <Clock className="w-4 h-4 text-amber-500" />;
            case 'Absent':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'Rest Day':
                return <Calendar className="w-4 h-4 text-blue-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Late':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Absent':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'Rest Day':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            default:
                return 'bg-gray-50 text-gray-500 border-gray-200';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '-';
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getDayOfWeek = (dateString) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date(dateString).getDay()];
    };

    // Generate month options
    const generateMonthOptions = () => {
        const months = [];
        const currentDate = new Date();
        
        for (let i = 0; i < 12; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            months.push({ value, label });
        }
        
        return months;
    };

    return (
        <EmployeeLayout>
            <Head title="My Attendance Logs" />
            
            <motion.div 
                className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div className="mb-8" variants={itemVariants}>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                        My Attendance Logs
                    </h1>
                    <p className="text-gray-600 text-lg">View your daily attendance records and working hours</p>
                </motion.div>

                {/* Employee Info */}
                <motion.div 
                    className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100"
                    variants={itemVariants}
                    whileHover={cardHover}
                >
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {employee?.firstname} {employee?.lastname}
                            </h2>
                            <p className="text-gray-600 font-medium">{employee?.position}</p>
                            <p className="text-sm text-gray-500">{employee?.department?.name}</p>
                            {employee?.biometric_id && (
                                <p className="text-xs text-gray-400 mt-1">Biometric ID: {employee.biometric_id}</p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Summary Cards */}
                {summary && (
                    <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" variants={itemVariants}>
                        <motion.div 
                            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
                            whileHover={cardHover}
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Days</p>
                                    <p className="text-3xl font-bold text-gray-900">{summary.total_days}</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div 
                            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
                            whileHover={cardHover}
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Working Days</p>
                                    <p className="text-3xl font-bold text-gray-900">{summary.working_days}</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div 
                            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
                            whileHover={cardHover}
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                                    <XCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Absent Days</p>
                                    <p className="text-3xl font-bold text-gray-900">{summary.absent_days}</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div 
                            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
                            whileHover={cardHover}
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Hours</p>
                                    <p className="text-3xl font-bold text-gray-900">{summary.total_hours_worked}h</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Filters */}
                <motion.div 
                    className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100"
                    variants={itemVariants}
                    whileHover={cardHover}
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-800">Filters</h3>
                        <SecondaryButton
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center space-x-2 bg-transparent hover:bg-gray-50 border-gray-300 text-gray-700 shadow-sm"
                        >
                            <Filter className="w-4 h-4" />
                            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
                        </SecondaryButton>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Month
                                    </label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => handleMonthChange(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">All Months</option>
                                        {generateMonthOptions().map(month => (
                                            <option key={month.value} value={month.value}>
                                                {month.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Period
                                    </label>
                                    <select
                                        value={selectedPeriod}
                                        onChange={(e) => handlePeriodChange(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Full Month</option>
                                        <option value="1-15">1-15 (First Half)</option>
                                        <option value="16-31">16-End (Second Half)</option>
                                    </select>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Attendance Table */}
                <motion.div 
                    className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
                    variants={itemVariants}
                    whileHover={cardHover}
                >
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                        <h3 className="text-xl font-semibold text-gray-800">Attendance Records</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Schedule
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Time In
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Time Out
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Hours Worked
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Remarks
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {attendanceLogs && attendanceLogs.length > 0 ? (
                                    attendanceLogs.map((dayRecord, index) => {
                                        const log = dayRecord.log_data;
                                        const hasLog = dayRecord.has_log;
                                        const status = hasLog ? log?.status : dayRecord.status;
                                        const isAbsent = status === 'Absent';
                                        
                                        return (
                                            <motion.tr 
                                                key={index} 
                                                className="hover:bg-gray-50 transition-colors duration-200"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <motion.div 
                                                            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3"
                                                            whileHover={{ scale: 1.05 }}
                                                        >
                                                            <Calendar className="w-5 h-5 text-white" />
                                                        </motion.div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {dayRecord.date_formatted}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {dayRecord.day_of_week}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {hasLog && log?.schedule_formatted ? (
                                                        log.schedule_formatted
                                                    ) : (
                                                        <span className="text-gray-400 italic">No schedule</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                                    {hasLog && log?.time_in ? log.time_in : <span className="text-gray-400">-</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                                    {hasLog && log?.time_out ? log.time_out : <span className="text-gray-400">-</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {hasLog && log?.hrs_worked_formatted ? log.hrs_worked_formatted : <span className="text-gray-400">-</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {getStatusIcon(status)}
                                                        <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}>
                                                            {status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {hasLog && log?.remarks ? log.remarks : <span className="text-gray-400 italic">-</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {isAbsent ? (
                                                        <motion.div whileHover={{ scale: 1.02 }}>
                                                            <PrimaryButton
                                                                onClick={() => handleRequestLeave(dayRecord.date)}
                                                                className="flex items-center space-x-1 px-4 py-2 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                                <span>Request Leave</span>
                                                            </PrimaryButton>
                                                        </motion.div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm italic">-</span>
                                                    )}
                                                </td>
                                            </motion.tr>   
                                        );
                                    })
                                ) : (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="bg-white"
                                    >
                                        <td colSpan="8" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <motion.div 
                                                    className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4"
                                                    initial={{ scale: 0.8, rotate: -10 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    transition={{ type: "spring", stiffness: 200 }}
                                                >
                                                    <Calendar className="w-10 h-10 text-gray-400" />
                                                </motion.div>
                                                <h3 className="text-xl font-medium text-gray-900 mb-2">No attendance records found</h3>
                                                <p className="text-gray-500 max-w-md">No attendance logs available for the selected period. Try adjusting your filters.</p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </motion.div>
        </EmployeeLayout>
    );
}