import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2'; // Add this import
import { FileText } from 'lucide-react'; // Add this import
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import { 
    Calendar, 
    Clock, 
    User, 
    TrendingUp, 
    AlertCircle, 
    CheckCircle, 
    XCircle,
    Filter,
    Plus,
    AlertTriangle,
    Eye,
    MoreVertical,
    Upload,
    X
} from 'lucide-react';

// Simple Select component
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

// Correction Modal Component
const CorrectionModal = ({ isOpen, onClose, selectedDate, employee }) => {
    const [formData, setFormData] = useState({
        attendance_date: '',
        explanation: '',
        proof_image: null
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    // Reset form when modal opens/closes or date changes
    useEffect(() => {
        if (isOpen && selectedDate) {
            setFormData({
                attendance_date: selectedDate,
                explanation: '',
                proof_image: null
            });
            setErrors({});
        }
    }, [isOpen, selectedDate]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type and size
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            const maxSize = 5 * 1024 * 1024; // 5MB

            if (!validTypes.includes(file.type)) {
                setErrors(prev => ({ 
                    ...prev, 
                    proof_image: 'Please upload a valid image (JPEG, PNG, GIF)' 
                }));
                return;
            }

            if (file.size > maxSize) {
                setErrors(prev => ({ 
                    ...prev, 
                    proof_image: 'Image size must be less than 5MB' 
                }));
                return;
            }

            setFormData(prev => ({ ...prev, proof_image: file }));
            setErrors(prev => ({ ...prev, proof_image: null }));
        }
    };

    const removeFile = () => {
        setFormData(prev => ({ ...prev, proof_image: null }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});
    
        // Client-side validation
        const newErrors = {};
        if (!formData.explanation.trim()) {
            newErrors.explanation = 'Explanation is required';
        } else if (formData.explanation.trim().length < 10) {
            newErrors.explanation = 'Explanation must be at least 10 characters';
        }
    
        if (!formData.proof_image) {
            newErrors.proof_image = 'Proof image is required';
        }
    
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false);
            return;
        }
    
        // Submit form
        try {
            const submitData = new FormData();
            submitData.append('attendance_date', formData.attendance_date);
            submitData.append('explanation', formData.explanation);
            submitData.append('proof_image', formData.proof_image);
    
            await router.post('/employee/attendance-corrections', submitData, {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    // Show success message
                    Swal.fire({
                        icon: 'success',
                        title: 'Request Submitted!',
                        text: 'Your attendance correction request has been submitted successfully and is pending review.',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#10B981',
                    });
                },
                onError: (errors) => {
                    setErrors(errors);
                    // Show error message
                    Swal.fire({
                        icon: 'error',
                        title: 'Submission Failed',
                        text: 'There was an error submitting your request. Please try again.',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#EF4444',
                    });
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            console.error('Submission error:', error);
            setErrors({ submit: 'Failed to submit request. Please try again.' });
            setIsSubmitting(false);
            // Show error message
            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: 'There was an error submitting your request. Please try again.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#EF4444',
            });
        }
    };

    if (!isOpen) return null;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Request Attendance Correction</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Auto-filled Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                        <div>
                            <label className="text-sm font-medium text-blue-700">Employee Name</label>
                            <p className="text-lg font-semibold text-blue-900">
                                {employee?.firstname} {employee?.lastname}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-blue-700">Department</label>
                            <p className="text-lg font-semibold text-blue-900">
                                {employee?.department?.name}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-blue-700">Date to Correct</label>
                            <p className="text-lg font-semibold text-blue-900">
                                {new Date(selectedDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-blue-700">Current Status</label>
                            <p className="text-lg font-semibold text-blue-900">
                                Requesting Correction
                            </p>
                        </div>
                    </div>

                    {/* Explanation Field */}
                    <div>
                        <InputLabel htmlFor="explanation" value="Explanation *" />
                        <textarea
                            id="explanation"
                            value={formData.explanation}
                            onChange={(e) => handleInputChange('explanation', e.target.value)}
                            rows={4}
                            className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            placeholder="Please explain why you need this correction (e.g., biometric device malfunction, power outage, network issues, etc.)"
                        />
                        {errors.explanation && (
                            <p className="mt-1 text-sm text-red-600">{errors.explanation}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                            Minimum 10 characters. Describe the issue that prevented proper attendance recording.
                        </p>
                    </div>

                    {/* Proof Image Upload */}
                    <div>
                        <InputLabel htmlFor="proof_image" value="Proof Image *" />
                        <div className="mt-2">
                            {!formData.proof_image ? (
                                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <label
                                                htmlFor="proof_image"
                                                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                            >
                                                <span>Upload a file</span>
                                                <input
                                                    id="proof_image"
                                                    ref={fileInputRef}
                                                    name="proof_image"
                                                    type="file"
                                                    className="sr-only"
                                                    onChange={handleFileChange}
                                                    accept="image/*"
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            PNG, JPG, GIF up to 5MB
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-4 border border-green-300 bg-green-50 rounded-md">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <img
                                                src={URL.createObjectURL(formData.proof_image)}
                                                alt="Proof preview"
                                                className="h-16 w-16 object-cover rounded"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-green-800">
                                                {formData.proof_image.name}
                                            </p>
                                            <p className="text-sm text-green-600">
                                                {(formData.proof_image.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removeFile}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                        {errors.proof_image && (
                            <p className="mt-1 text-sm text-red-600">{errors.proof_image}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                            Upload a photo of your logbook, attendance proof, or any supporting document.
                        </p>
                    </div>

                    {/* Error Message */}
                    {errors.submit && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{errors.submit}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <SecondaryButton
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

// Kebab Menu Component
const KebabMenu = ({ date, status, onRequestLeave, onRequestCorrection }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    
    // Determine if Request Leave should be disabled
    const isRequestLeaveDisabled = status === 'Present' || status === 'Late';

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleRequestLeave = () => {
        if (isRequestLeaveDisabled) return;
        setIsOpen(false);
        onRequestLeave(date);
    };

    const handleRequestCorrection = () => {
        setIsOpen(false);
        onRequestCorrection(date);
    };

    return (
        <div className="relative" ref={menuRef}>
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <MoreVertical className="w-4 h-4 text-gray-600" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                    >
                        <div className="py-1">
                            <button
                                onClick={handleRequestLeave}
                                disabled={isRequestLeaveDisabled}
                                className={`flex items-center w-full px-4 py-2 text-sm transition-colors duration-200 ${
                                    isRequestLeaveDisabled
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                                title={isRequestLeaveDisabled ? "Cannot request leave for present days" : "Request leave for this day"}
                            >
                                <Plus className={`w-4 h-4 mr-2 ${
                                    isRequestLeaveDisabled ? 'text-gray-400' : 'text-emerald-500'
                                }`} />
                                Request Leave
                                {isRequestLeaveDisabled && (
                                    <span className="ml-auto text-xs text-gray-400">(Disabled)</span>
                                )}
                            </button>
                            <button
                                onClick={handleRequestCorrection}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                            >
                                <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
                                Request Correction
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

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

// Remove the cardHover object entirely and use inline animations instead

const cardHover = {
    y: -2,
    transition: { duration: 0.2 }
};

export default function AttendanceLogs({ auth, employee, attendanceLogs, summary, filters }) {
    const [selectedMonth, setSelectedMonth] = useState(filters.month);
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period);
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({
        start_date: filters.start_date || '',
        end_date: filters.end_date || ''
    });
    const [advancedFilters, setAdvancedFilters] = useState({
        attendance_issue: filters.attendance_issue || '',
        hours_threshold: filters.hours_threshold || 8,
    });

    // Add state for correction modal
    const [correctionModal, setCorrectionModal] = useState({
        isOpen: false,
        selectedDate: null
    });

    // Initialize filters from props
    useEffect(() => {
        setSelectedMonth(filters.month);
        setSelectedPeriod(filters.period);
        setDateRange({
            start_date: filters.start_date || '',
            end_date: filters.end_date || ''
        });
        setAdvancedFilters({
            attendance_issue: filters.attendance_issue || '',
            hours_threshold: filters.hours_threshold || 8,
        });
    }, [filters]);

    const handleFilterChange = () => {
        const params = {
            month: selectedMonth, 
            period: selectedPeriod,
            ...dateRange,
            ...advancedFilters
        };

        // Remove empty values
        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null) {
                delete params[key];
            }
        });

        router.get('/employee/attendance-logs', params, {
            preserveState: true,
            replace: true
        });
    };

    const handleDateRangeChange = (key, value) => {
        setDateRange(prev => ({ ...prev, [key]: value }));
    };

    const handleAdvancedFilterChange = (key, value) => {
        setAdvancedFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleMonthChange = (month) => {
        setSelectedMonth(month);
        setDateRange({ start_date: '', end_date: '' });
    };

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        setDateRange({ start_date: '', end_date: '' });
    };

    const clearAllFilters = () => {
        setDateRange({ start_date: '', end_date: '' });
        setAdvancedFilters({
            attendance_issue: '',
            hours_threshold: 8,
        });
        setSelectedMonth(filters.available_months?.[0] || new Date().toISOString().slice(0, 7));
        setSelectedPeriod('full');
    };

    // Update the handleRequestCorrection function
    const handleRequestCorrection = (date) => {
        setCorrectionModal({
            isOpen: true,
            selectedDate: date
        });
    };

    const closeCorrectionModal = () => {
        setCorrectionModal({
            isOpen: false,
            selectedDate: null
        });
    };

    const handleRequestLeave = (absentDate) => {
        router.visit(`/employee/leave?prefill_date=${absentDate}&prefill_for_absence=true`);
    };

    // Attendance issue options
    const attendanceIssueOptions = [
        { value: '', label: 'All Records' },
        { value: 'late', label: 'Late Records' },
        { value: 'missing_time_out', label: 'Missing Time Out' },
        { value: 'missing_time_in', label: 'Missing Time In' },
        { value: 'absent', label: 'Absent Days' },
        { value: 'insufficient_hours', label: 'Insufficient Hours' },
    ];

    // Period options
    const periodOptions = [
        { value: 'full', label: 'Full Month' },
        { value: 'first_half', label: 'First Half (1-15)' },
        { value: 'second_half', label: 'Second Half (16-End)' },
    ];

    // Calculate employee issues
    const calculateEmployeeIssues = () => {
        const issues = {
            hasLatesThisMonth: false,
            hasMissingTimeIn: false,
            hasMissingTimeOut: false,
            lateCount: 0,
        };

        if (!attendanceLogs || !Array.isArray(attendanceLogs)) return issues;

        attendanceLogs.forEach(day => {
            if (day.has_log && day.log_data) {
                if (day.log_data.status === 'Late') {
                    issues.lateCount++;
                    issues.hasLatesThisMonth = true;
                }
                if (day.log_data.time_in === 'No time in' || !day.log_data.time_in) {
                    issues.hasMissingTimeIn = true;
                }
                if (day.log_data.time_out === 'No time out' || !day.log_data.time_out) {
                    issues.hasMissingTimeOut = true;
                }
            }
        });

        return issues;
    };

    const employeeIssues = calculateEmployeeIssues();

    // Check if row should be highlighted
    const shouldHighlightRow = (day) => {
        if (!day.has_log || !day.log_data) return false;

        const isLate = day.log_data.status === 'Late';
        const hasMissingTimeIn = day.log_data.time_in === 'No time in' || !day.log_data.time_in;
        const hasMissingTimeOut = day.log_data.time_out === 'No time out' || !day.log_data.time_out;

        return isLate || hasMissingTimeIn || hasMissingTimeOut;
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

    const hasActiveFilters = () => {
        return dateRange.start_date || dateRange.end_date || advancedFilters.attendance_issue;
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
        <EmployeeLayout user={auth.user}>
            <Head title="My Attendance Logs" />
            
            {/* Correction Modal */}
            <CorrectionModal
                isOpen={correctionModal.isOpen}
                onClose={closeCorrectionModal}
                selectedDate={correctionModal.selectedDate}
                employee={employee}
            />

            <motion.div 
                className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div className="mb-8" variants={itemVariants}>
    <div className="flex items-center justify-between">
        <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                My Attendance Logs
            </h1>
            <p className="text-gray-600 text-lg">View your daily attendance records and working hours with advanced filtering</p>
        </div>
        <Link
            href="/employee/my-correction-requests"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
        >
            <FileText className="w-4 h-4 mr-2" />
            View My Correction Requests
        </Link>
    </div>
</motion.div>

                {/* Employee Info with Issue Indicators */}
                <motion.div 
                    className={`bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100 ${
                        (employeeIssues.hasLatesThisMonth || 
                         employeeIssues.hasMissingTimeIn || 
                         employeeIssues.hasMissingTimeOut) 
                            ? 'border-l-4 border-l-red-500' 
                            : ''
                    }`}
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                >
                    <div className="flex items-start justify-between">
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

                        {/* Issue Indicators */}
                        {(employeeIssues.hasLatesThisMonth || 
                          employeeIssues.hasMissingTimeIn || 
                          employeeIssues.hasMissingTimeOut) && (
                            <div className="flex flex-wrap gap-2">
                                {employeeIssues.hasLatesThisMonth && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Has Late Logs ({employeeIssues.lateCount} times)
                                    </span>
                                )}
                                {employeeIssues.hasMissingTimeIn && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Missing Time In
                                    </span>
                                )}
                                {employeeIssues.hasMissingTimeOut && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Missing Time Out
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Enhanced Summary Cards */}
                {summary && (
                    <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8" variants={itemVariants}>
                        <motion.div 
                            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
                            whileHover={{ y: -2 }}
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Working Days</p>
                                    <p className="text-2xl font-bold text-gray-900">{summary.working_days}</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div 
                            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
                            whileHover={{ y: -2 }}
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Hours Worked</p>
                                    <p className="text-2xl font-bold text-gray-900">{summary.total_hours_worked}h</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div 
                            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
                            whileHover={{ y: -2 }}
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                                    <XCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Absent Days</p>
                                    <p className="text-2xl font-bold text-gray-900">{summary.absent_days}</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div 
                            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
                            whileHover={{ y: -2 }}
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Avg Hours/Day</p>
                                    <p className="text-2xl font-bold text-gray-900">{summary.average_hours_per_day}h</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div 
                            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
                            whileHover={{ y: -2 }}
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Late Count</p>
                                    <p className="text-2xl font-bold text-gray-900">{summary.late_count || 0}</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div 
                            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
                            whileHover={{ y: -2 }}
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <Eye className="w-6 h-6 text-white" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Showing</p>
                                    <p className="text-2xl font-bold text-gray-900">{summary.filtered_count || attendanceLogs?.length || 0}</p>
                                    <p className="text-xs text-gray-500">records</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Enhanced Filters */}
                <motion.div 
                    className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100"
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                            <Filter className="w-5 h-5 mr-2" />
                            Advanced Filters
                        </h3>
                        <SecondaryButton
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center space-x-2 bg-transparent hover:bg-gray-50 border-gray-300 text-gray-700 shadow-sm"
                        >
                            <Filter className="w-4 h-4" />
                            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
                            {hasActiveFilters() && (
                                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                                    !
                                </span>
                            )}
                        </SecondaryButton>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6 space-y-6 overflow-hidden"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Date Filters */}
                                    <div className="space-y-4">
                                        <div>
                                            <InputLabel value="Month Selection" />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <InputLabel htmlFor="month" value="Month" />
                                                    <select
                                                        id="month"
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
                                                    <InputLabel htmlFor="period" value="Period" />
                                                    <select
                                                        id="period"
                                                        value={selectedPeriod}
                                                        onChange={(e) => handlePeriodChange(e.target.value)}
                                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        <option value="full">Full Month</option>
                                                        <option value="first_half">1-15 (First Half)</option>
                                                        <option value="second_half">16-End (Second Half)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <InputLabel value="Custom Date Range" />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <InputLabel htmlFor="start_date" value="Start Date" />
                                                    <TextInput
                                                        id="start_date"
                                                        type="date"
                                                        value={dateRange.start_date}
                                                        onChange={(e) => handleDateRangeChange('start_date', e.target.value)}
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="end_date" value="End Date" />
                                                    <TextInput
                                                        id="end_date"
                                                        type="date"
                                                        value={dateRange.end_date}
                                                        onChange={(e) => handleDateRangeChange('end_date', e.target.value)}
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Advanced Filters */}
                                    <div className="space-y-4">
                                        <div>
                                            <InputLabel htmlFor="attendance_issue" value="Attendance Issue" />
                                            <select
                                                id="attendance_issue"
                                                value={advancedFilters.attendance_issue}
                                                onChange={(e) => handleAdvancedFilterChange('attendance_issue', e.target.value)}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                {attendanceIssueOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {advancedFilters.attendance_issue === 'insufficient_hours' && (
    <div>
        <InputLabel htmlFor="hours_threshold" value="Hours Threshold" />
        <TextInput
            id="hours_threshold"
            type="number"
            min="1"
            max="24"
            step="0.5"
            value={advancedFilters.hours_threshold}
            onChange={(e) => handleAdvancedFilterChange('hours_threshold', e.target.value)}
            placeholder="Maximum hours threshold"
            className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
            Show records with less than {advancedFilters.hours_threshold} working hours
        </p>
    </div>
)}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                    <button
                                        onClick={clearAllFilters}
                                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                                    >
                                        Clear All Filters
                                    </button>
                                    <PrimaryButton onClick={handleFilterChange}>
                                        Apply Filters
                                    </PrimaryButton>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Filter Summary */}
                {hasActiveFilters() && (
                    <motion.div 
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Filter className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Active Filters:</span>
                                <div className="flex flex-wrap gap-2">
                                    {dateRange.start_date && dateRange.end_date && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Date Range: {dateRange.start_date} to {dateRange.end_date}
                                        </span>
                                    )}
                                    {advancedFilters.attendance_issue && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {attendanceIssueOptions.find(opt => opt.value === advancedFilters.attendance_issue)?.label}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={clearAllFilters}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Clear All
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Enhanced Attendance Table */}
                <motion.div 
                    className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                >
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-gray-800">
                                {dateRange.start_date || dateRange.end_date ? (
                                    <>
                                        My Attendance Records - {dateRange.start_date || 'Start'} to {dateRange.end_date || 'End'}
                                    </>
                                ) : (
                                    <>
                                        My Attendance Records - {selectedMonth ? new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
                                            month: 'long', 
                                            year: 'numeric' 
                                        }) : 'All Months'}
                                        {selectedPeriod === 'first_half' && ' (1-15)'}
                                        {selectedPeriod === 'second_half' && ' (16-End)'}
                                    </>
                                )}
                                {advancedFilters.attendance_issue && (
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                        • Filtered by: {attendanceIssueOptions.find(opt => opt.value === advancedFilters.attendance_issue)?.label}
                                    </span>
                                )}
                            </h3>
                            <div className="text-sm text-gray-500">
                                Showing {attendanceLogs?.length || 0} records
                            </div>
                        </div>
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
                                        
                                        return (
                                            <motion.tr 
                                                key={index} 
                                                className={`hover:bg-gray-50 transition-colors duration-200 ${
                                                    shouldHighlightRow(dayRecord) ? 'bg-red-50 border-l-4 border-l-red-500' : ''
                                                }`}
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
                                                    {hasLog && log?.time_in ? (
                                                        log.time_in
                                                    ) : (
                                                        <span className="text-red-500 font-medium">No time in</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                                    {hasLog && log?.time_out ? (
                                                        log.time_out
                                                    ) : (
                                                        <span className="text-red-500 font-medium">No time out</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {hasLog && log?.hrs_worked_formatted ? (
                                                        log.hrs_worked_formatted
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
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
                                                    {hasLog && log?.remarks ? (
                                                        log.remarks
                                                    ) : (
                                                        <span className="text-gray-400 italic">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <KebabMenu 
                                                        date={dayRecord.date}
                                                        status={status}
                                                        onRequestLeave={handleRequestLeave}
                                                        onRequestCorrection={handleRequestCorrection}
                                                    />
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
                                                <p className="text-gray-500 max-w-md">No attendance logs available for the selected period and filters.</p>
                                                {hasActiveFilters() && (
                                                    <button
                                                        onClick={clearAllFilters}
                                                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                                    >
                                                        Clear Filters
                                                    </button>
                                                )}
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