import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import DeptHeadLayout from '@/Layouts/DeptHeadLayout';
import Swal from 'sweetalert2';
import { 
    Calendar, 
    User, 
    FileText, 
    Clock,
    CheckCircle,
    XCircle,
    ArrowLeft,
    Download,
    Eye,
    // BuildingOffice
} from 'lucide-react';

const StatusBadge = ({ status }) => {
    const statusConfig = {
        'Pending': {
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-200',
            icon: Clock,
        },
        'Reviewed': {
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
            icon: Eye,
        },
        'Approved': {
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            icon: CheckCircle,
        },
        'Rejected': {
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            icon: XCircle,
        },
    };

    const config = statusConfig[status] || statusConfig.Pending;
    const IconComponent = config.icon;

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
            <IconComponent className="w-3 h-3 mr-1" />
            {status}
        </span>
    );
};

export default function ShowAttendanceCorrection({ auth, correction }) {
    const { flash } = usePage().props;
    const [reviewModal, setReviewModal] = useState({
        isOpen: false,
        action: null // 'review' or 'reject'
    });
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // SweetAlert2 for success/error messages
    useEffect(() => {
        if (flash.success) {
            Swal.fire({
                title: 'Success!',
                text: flash.success,
                icon: 'success',
                confirmButtonColor: '#10B981',
                background: '#ffffff',
                customClass: {
                    popup: 'rounded-2xl shadow-2xl border border-gray-200',
                    title: 'text-xl font-bold text-green-600'
                }
            });
        }
        if (flash.error) {
            Swal.fire({
                title: 'Error!',
                text: flash.error,
                icon: 'error',
                confirmButtonColor: '#EF4444',
                background: '#ffffff',
                customClass: {
                    popup: 'rounded-2xl shadow-2xl border border-gray-200',
                    title: 'text-xl font-bold text-red-600'
                }
            });
        }
    }, [flash]);

    const handleReview = (action) => {
        setReviewModal({ isOpen: true, action });
    };

    const closeModal = () => {
        setReviewModal({ isOpen: false, action: null });
        setRemarks('');
    };

    const submitAction = () => {
        if (reviewModal.action === 'reject' && !remarks.trim()) {
            Swal.fire({
                title: 'Remarks Required',
                text: 'Please provide a reason for rejection.',
                icon: 'warning',
                confirmButtonColor: '#F59E0B',
                background: '#ffffff'
            });
            return;
        }

        setIsSubmitting(true);

        const url = reviewModal.action === 'review' 
            ? route('dept_head.attendance-corrections.review', correction.id)
            : route('dept_head.attendance-corrections.reject', correction.id);

        router.post(url, { remarks: remarks.trim() }, {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                // SweetAlert will be triggered by the flash message
            },
            onError: () => {
                Swal.fire({
                    title: 'Action Failed',
                    text: 'There was an error processing your request. Please try again.',
                    icon: 'error',
                    confirmButtonColor: '#EF4444',
                    background: '#ffffff'
                });
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <DeptHeadLayout user={auth.user}>
            <Head title={`Correction Request - ${correction.employee_name}`} />

            {/* Review/Reject Modal */}
            {reviewModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl mx-auto mb-4 ${
                            reviewModal.action === 'review' ? 'bg-blue-100' : 'bg-red-100'
                        }`}>
                            {reviewModal.action === 'review' ? (
                                <Eye className="w-6 h-6 text-blue-600" />
                            ) : (
                                <XCircle className="w-6 h-6 text-red-600" />
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                            {reviewModal.action === 'review' ? 'Mark as Reviewed' : 'Reject Request'}
                        </h3>
                        <p className="text-sm text-gray-600 text-center mb-6">
                            {reviewModal.action === 'review' 
                                ? 'This will mark the request as reviewed and forward it to HR for final approval.'
                                : 'This will reject the request and notify the employee.'}
                        </p>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {reviewModal.action === 'review' ? 'Remarks (Optional)' : 'Reason for Rejection (Required)'}
                            </label>
                            <textarea 
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows="3"
                                className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:border-yellow-500 transition-all duration-300"
                                placeholder={reviewModal.action === 'review' 
                                    ? 'Add any additional remarks for HR...' 
                                    : 'Please provide the reason for rejection...'
                                }
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={closeModal}
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={submitAction}
                                disabled={isSubmitting}
                                className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${
                                    reviewModal.action === 'review'
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg'
                                        : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg'
                                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? 'Processing...' : 
                                    reviewModal.action === 'review' ? 'Mark as Reviewed' : 'Reject Request'
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <Link 
                            href={route('dept_head.attendance-corrections')}
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Correction Requests
                        </Link>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    Correction Request Details
                                </h1>
                                <p className="text-gray-600">
                                    Review attendance correction request from {correction.employee_name}
                                </p>
                            </div>
                            <div className="text-right">
                                <StatusBadge status={correction.status} />
                                <div className="text-sm text-gray-500 mt-1">
                                    Submitted on {formatDate(correction.created_at)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Request Information */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                    <FileText className="w-5 h-5 mr-2" />
                                    Request Information
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Explanation</label>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <p className="text-gray-900 whitespace-pre-wrap">{correction.explanation}</p>
                                        </div>
                                    </div>

                                    {correction.proof_image && (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Proof Image</label>
        <div className="mt-2">
            <a
                href={`/attendance-corrections/${correction.id}/view-proof`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
            >
                <Eye className="w-4 h-4 mr-2" />
                View Proof Image
            </a>
        </div>
    </div>
)}
                                </div>
                            </div>

                            {/* Action Buttons - Only show for pending requests */}
                            {correction.status === 'Pending' && (
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Actions</h2>
                                    <div className="flex space-x-4">
                                        <button
                                            onClick={() => handleReview('review')}
                                            className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            Mark as Reviewed
                                        </button>
                                        <button
                                            onClick={() => handleReview('reject')}
                                            className="flex items-center px-6 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject Request
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Employee Information */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                    <User className="w-5 h-5 mr-2" />
                                    Employee Information
                                </h2>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Employee Name</label>
                                        <p className="text-gray-900 font-medium">{correction.employee_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Department</label>
                                        <p className="text-gray-900">{correction.department}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Date */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Attendance Date
                                </h2>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900 mb-1">
                                        {new Date(correction.attendance_date).getDate()}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {new Date(correction.attendance_date).toLocaleDateString('en-US', {
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {new Date(correction.attendance_date).toLocaleDateString('en-US', {
                                            weekday: 'long'
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Status History */}
                            {(correction.reviewed_at || correction.remarks) && (
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Status History</h2>
                                    <div className="space-y-3">
                                        {correction.reviewed_at && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Reviewed By</label>
                                                <p className="text-gray-900">{correction.reviewed_by}</p>
                                                <p className="text-xs text-gray-500">{formatDate(correction.reviewed_at)}</p>
                                            </div>
                                        )}
                                        {correction.remarks && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Remarks</label>
                                                <p className="text-gray-900 text-sm mt-1 p-2 bg-gray-50 rounded-xl border">
                                                    {correction.remarks}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DeptHeadLayout>
    );
}