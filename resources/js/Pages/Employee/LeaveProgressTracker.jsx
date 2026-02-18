import React from 'react';
import { motion } from 'framer-motion';

const LeaveProgressTracker = ({ 
    approvals, 
    isDeptHead = false, 
    isAdmin = false, 
    isRecalled = false, 
    recallData = null 
}) => {
    // If recalled, show special recalled status
    if (isRecalled) {
        return (
            <div className="w-full px-6 py-8">
                <div className="text-center">
                    {/* Recalled Icon */}
                    <motion.div
                        className="flex items-center justify-center w-20 h-20 rounded-full bg-red-100 border-2 border-red-300 mx-auto mb-4"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </motion.div>

                    {/* Rest of recalled section remains the same */}
                    <h3 className="text-lg font-semibold text-red-700 mb-2">Leave Recalled</h3>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                        <div className="text-sm text-red-800 space-y-2">
                            <div className="flex justify-between">
                                <span className="font-medium">Original Dates:</span>
                                <span>
                                    {recallData ? new Date(recallData.original_date_from).toLocaleDateString() : 'N/A'} - 
                                    {recallData ? new Date(recallData.original_date_to).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">New Dates:</span>
                                <span>
                                    {recallData ? new Date(recallData.new_date_from).toLocaleDateString() : 'N/A'} - 
                                    {recallData ? new Date(recallData.new_date_to).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                            <div className="mt-3">
                                <span className="font-medium block mb-1">Reason for Recall:</span>
                                <p className="text-red-700 bg-red-100 p-2 rounded text-xs">
                                    {recallData?.reason || 'No reason provided'}
                                </p>
                            </div>
                            {recallData?.recalled_at && (
                                <div className="text-xs text-red-600 mt-2">
                                    Recalled on: {new Date(recallData.recalled_at).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-center text-xs text-gray-600 bg-gray-100 px-3 py-2 rounded-full">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        View Only - This leave has been recalled by administration
                    </div>
                </div>
            </div>
        );
    }

    // Define the steps in order with Heroicons - conditionally exclude dept_head for dept heads and admins
    const baseSteps = [
        { 
            id: 'submitted', 
            label: 'Submitted', 
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        { 
            id: 'hr', 
            label: 'HR Review', 
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        { 
            id: 'dept_head', 
            label: 'Dept. Head', 
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        },
        { 
            id: 'admin', 
            label: 'Admin', 
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
    ];

    // For department heads and admins, remove the dept_head step (3-step process)
    const steps = (isDeptHead || isAdmin) 
        ? baseSteps.filter(step => step.id !== 'dept_head')
        : baseSteps;

    // Get the current status for each role
    const getStatus = (role) => {
        if (!approvals) return 'pending';
        const approval = approvals.find(a => a.role === role);
        return approval?.status || 'pending';
    };

    // Check if any step has been rejected
    const hasRejection = () => {
        if (!approvals) return false;
        return approvals.some(a => a.status === 'rejected');
    };

    // Get the first rejected step
    const getFirstRejectedStep = () => {
        if (!approvals) return null;
        const rejectedApproval = approvals.find(a => a.status === 'rejected');
        return rejectedApproval?.role;
    };

    // Get approval details for each role
    const getApprovalDetails = (role) => {
        if (!approvals) return null;
        const approval = approvals.find(a => a.role === role);
        return approval || null;
    };

    // Format approver name - handle different data structures
    const formatApproverName = (approval) => {
        if (!approval) return null;
        
        console.log('Approval data:', approval); // Debug log
        
        // If approved_by is a string (name)
        if (typeof approval.approved_by === 'string') {
            return approval.approved_by;
        }
        
        // If approved_by is an object with user data
        if (approval.approved_by && typeof approval.approved_by === 'object') {
            if (approval.approved_by.name) return approval.approved_by.name;
            if (approval.approved_by.firstname && approval.approved_by.lastname) {
                return `${approval.approved_by.firstname} ${approval.approved_by.lastname}`;
            }
        }
        
        // If we have approver relation data
        if (approval.approver) {
            if (approval.approver.name) return approval.approver.name;
            if (approval.approver.firstname && approval.approver.lastname) {
                return `${approval.approver.firstname} ${approval.approver.lastname}`;
            }
        }
        
        return null;
    };

    // Format approval date
    const formatApprovalDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    // FIXED: Determine which step is current - now handles rejections properly
    const getCurrentStepIndex = () => {
        // If there's a rejection, the current step should be the rejected step
        if (hasRejection()) {
            const rejectedRole = getFirstRejectedStep();
            const rejectedStepIndex = steps.findIndex(step => step.id === rejectedRole);
            return rejectedStepIndex !== -1 ? rejectedStepIndex : steps.length - 1;
        }

        if (isDeptHead || isAdmin) {
            // For department heads and admins: submitted -> hr -> admin (3 steps)
            if (getStatus('admin') === 'approved') return steps.length - 1;
            if (getStatus('hr') === 'approved') return 2;
            if (getStatus('hr') === 'pending') return 1;
            return 0;
        } else {
            // For regular employees: submitted -> hr -> dept_head -> admin (4 steps)
            if (getStatus('admin') === 'approved') return steps.length - 1;
            if (getStatus('dept_head') === 'approved') return 3;
            if (getStatus('hr') === 'approved') return 2;
            if (getStatus('hr') === 'pending') return 1;
            return 0;
        }
    };

    const currentStepIndex = getCurrentStepIndex();

    // Status colors
    const statusColors = {
        approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        rejected: 'bg-rose-50 text-rose-700 border-rose-200',
        pending: 'bg-amber-50 text-amber-700 border-amber-200'
    };

    // Status icons
    const statusIcons = {
        approved: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
        ),
        rejected: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        ),
        pending: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
        )
    };

    // FIXED: Get step icon based on status, not just completion
    const getStepIcon = (step, index, isCompleted, isCurrent, status) => {
        // If this step has been rejected, show X icon
        if (status === 'rejected') {
            return (
                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            );
        }
        
        // If completed and approved, show checkmark
        if (isCompleted) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            );
        }
        
        // Otherwise show the step icon
        return (
            <div className={`${isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>
                {step.icon}
            </div>
        );
    };

    // Get appropriate status message based on current step and user type
    const getStatusMessage = () => {
        // If there's a rejection, show rejection message
        if (hasRejection()) {
            const rejectedRole = getFirstRejectedStep();
            if (rejectedRole === 'hr') return "Your request has been rejected by HR";
            if (rejectedRole === 'dept_head') return "Your request has been rejected by Department Head";
            if (rejectedRole === 'admin') return "Your request has been rejected by Admin";
            return "Your request has been rejected";
        }

        const currentStep = steps[currentStepIndex];
        
        if (isDeptHead || isAdmin) {
            // Special messages for department heads and admins
            if (currentStep.id === 'submitted') {
                return "Your request has been submitted and is awaiting HR review";
            } else if (currentStep.id === 'hr') {
                if (getStatus('hr') === 'approved') {
                    return "Approved by HR - Awaiting Admin approval";
                } else {
                    return "Awaiting HR review";
                }
            } else if (currentStep.id === 'admin') {
                if (getStatus('admin') === 'approved') {
                    return "Approved by Admin - Your leave has been fully approved";
                } else {
                    return "Awaiting Admin approval - Department Head approval bypassed";
                }
            }
        } else {
            // Regular employee messages
            if (currentStep.id === 'submitted') {
                return "Your request has been submitted and is awaiting HR review";
            } else if (currentStep.id === 'hr') {
                return getStatus('hr') === 'approved' 
                    ? "Approved by HR - Awaiting Department Head approval"
                    : "Awaiting HR approval";
            } else if (currentStep.id === 'dept_head') {
                return getStatus('dept_head') === 'approved' 
                    ? "Approved by Department Head - Awaiting Admin approval"
                    : "Awaiting Department Head approval";
            } else if (currentStep.id === 'admin') {
                return getStatus('admin') === 'approved' 
                    ? "Approved by Admin - Your leave has been fully approved"
                    : "Awaiting Admin approval";
            }
        }
        
        return "Processing your leave request";
    };

    // FIXED: Get step background color based on status
    const getStepBackgroundColor = (index, isCompleted, isCurrent, status) => {
        if (status === 'rejected') {
            return 'bg-rose-500 border-rose-600 text-white shadow-sm';
        }
        if (isCompleted) {
            return 'bg-emerald-500 border-emerald-600 text-white shadow-sm';
        }
        if (isCurrent) {
            return 'bg-white border-blue-500 text-blue-600 shadow-md';
        }
        return 'bg-white border-gray-200 text-gray-400 shadow-sm';
    };

    return (
        <div className="w-full px-6 py-8">
            <div className="relative">
                {/* Progress line - HIDE if there's a rejection */}
                {!hasRejection() && (
                    <>
                        <div className="absolute top-7 left-16 right-16 h-0.5 bg-gray-100 rounded-full z-0">
                            <motion.div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full z-0"
                                initial={{ width: 0 }}
                                animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>
                    </>
                )}

                <div className="flex justify-between relative z-10">
                    {steps.map((step, index) => {
                        const status = step.id === 'submitted' ? 'pending' : getStatus(step.id);
                        const isCompleted = !hasRejection() && index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const isPending = index > currentStepIndex;
                        const approvalDetails = step.id !== 'submitted' ? getApprovalDetails(step.id) : null;
                        const approverName = approvalDetails ? formatApproverName(approvalDetails) : null;
                        const approvalDate = approvalDetails?.approved_at ? formatApprovalDate(approvalDetails.approved_at) : null;

                        return (
                            <div key={step.id} className="flex flex-col items-center flex-1">
                                {/* Step indicator */}
                                <motion.div
                                    className={`flex items-center justify-center w-14 h-14 rounded-full border-2 mb-3 transition-all duration-200 ${getStepBackgroundColor(index, isCompleted, isCurrent, status)}`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                    {getStepIcon(step, index, isCompleted, isCurrent, status)}
                                </motion.div>

                                {/* Step label and status */}
                                <div className="text-center px-2">
                                    <div className={`text-sm font-medium mb-1 ${
                                        status === 'rejected' ? 'text-rose-600' :
                                        isCompleted ? 'text-gray-900' : 
                                        isCurrent ? 'text-blue-600' : 
                                        'text-gray-500'
                                    }`}>
                                        {step.label}
                                    </div>

                                    {step.id !== 'submitted' && (
                                        <motion.div
                                            className={`inline-flex items-center text-xs px-2 py-1 rounded-full border ${statusColors[status]}`}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <span className="mr-1">{statusIcons[status]}</span>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </motion.div>
                                    )}

                                    {/* Approver Name and Date - Show for completed/rejected steps */}
                                    {approverName && approvalDate && status !== 'pending' && (
                                        <motion.div
                                            className="mt-2 text-xs text-gray-600 space-y-1"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <div className="font-medium text-gray-900">
                                                {approverName}
                                            </div>
                                            <div className="text-gray-500">
                                                {approvalDate}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Status details card */}
            <motion.div
                className={`mt-8 p-4 rounded-lg border shadow-xs ${
                    hasRejection() 
                        ? 'bg-rose-50 border-rose-200' 
                        : 'bg-white border-gray-100'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h4 className={`text-sm font-semibold mb-3 flex items-center ${
                    hasRejection() ? 'text-rose-800' : 'text-gray-900'
                }`}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {hasRejection() ? 'Rejection Details' : 'Current Status'}
                </h4>
                <div className="flex items-start">
                    <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${
                        hasRejection() ? 'bg-rose-500' :
                        steps[currentStepIndex].id === 'submitted' ? 'bg-blue-500' :
                        getStatus(steps[currentStepIndex].id) === 'approved' ? 'bg-emerald-500' :
                        getStatus(steps[currentStepIndex].id) === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                    <p className={`text-sm leading-relaxed ${
                        hasRejection() ? 'text-rose-700 font-medium' : 'text-gray-700'
                    }`}>
                        {getStatusMessage()}
                    </p>
                </div>
                
                {/* Show rejection remarks if available */}
                {hasRejection() && (
                    <div className="mt-3 p-3 bg-rose-100 rounded border border-rose-200">
                        <p className="text-xs text-rose-800">
                            <span className="font-semibold">Rejection remarks: </span>
                            {getApprovalDetails(getFirstRejectedStep())?.remarks || 'No remarks provided'}
                        </p>
                    </div>
                )}
                
                {/* Special note for department heads and admins */}
                {(isDeptHead || isAdmin) && currentStepIndex >= 1 && !hasRejection() && (
                    <div className="mt-2 flex items-start text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>
                            {isAdmin 
                                ? "As an Admin, your request bypasses the Department Head approval step."
                                : "As a Department Head, your request bypasses the Department Head approval step."
                            }
                        </span>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default LeaveProgressTracker;