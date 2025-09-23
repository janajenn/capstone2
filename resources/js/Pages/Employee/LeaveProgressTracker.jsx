// components/LeaveProgressTracker.jsx
import React from 'react';
import { motion } from 'framer-motion';

const LeaveProgressTracker = ({ approvals }) => {
    // Define the steps in order with Heroicons
    const steps = [
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

    // Get the current status for each role
    const getStatus = (role) => {
        if (!approvals) return 'pending';
        const approval = approvals.find(a => a.role === role);
        return approval?.status || 'pending';
    };

    // Determine which step is current
    const getCurrentStepIndex = () => {
        if (getStatus('admin') === 'approved') return steps.length - 1;
        if (getStatus('dept_head') === 'approved') return 3;
        if (getStatus('hr') === 'approved') return 2;
        return 1; // Default to HR step if just submitted
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

    return (
        <div className="w-full px-6 py-8">
            <div className="relative">
                {/* Progress line */}
                <div className="absolute top-7 left-16 right-16 h-0.5 bg-gray-100 rounded-full z-0">
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full z-0"
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                </div>

                <div className="flex justify-between relative z-10">
                    {steps.map((step, index) => {
                        const isCompleted = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const isPending = index > currentStepIndex;
                        const status = getStatus(step.id === 'submitted' ? null : step.id);

                        return (
                            <div key={step.id} className="flex flex-col items-center flex-1">
                                {/* Step indicator */}
                                <motion.div
                                    className={`flex items-center justify-center w-14 h-14 rounded-full border-2 mb-3 transition-all duration-200
                                        ${isCompleted ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm' :
                                          isCurrent ? 'bg-white border-blue-500 text-blue-600 shadow-md' :
                                          'bg-white border-gray-200 text-gray-400 shadow-sm'}`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                    {isCompleted ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <div className={`${isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {step.icon}
                                        </div>
                                    )}
                                </motion.div>

                                {/* Step label and status */}
                                <div className="text-center px-2">
                                    <div className={`text-sm font-medium mb-1 ${
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
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Status details card */}
            <motion.div
                className="mt-8 bg-white p-4 rounded-lg border border-gray-100 shadow-xs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Current Status
                </h4>
                <div className="flex items-start">
                    <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${
                        steps[currentStepIndex].id === 'submitted' ? 'bg-blue-500' :
                        getStatus(steps[currentStepIndex].id) === 'approved' ? 'bg-emerald-500' :
                        getStatus(steps[currentStepIndex].id) === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                    <p className="text-sm text-gray-700 leading-relaxed">
                        {steps[currentStepIndex].id === 'submitted' ? (
                            "Your request has been submitted and is awaiting HR review"
                        ) : getStatus(steps[currentStepIndex].id) === 'pending' ? (
                            `Awaiting ${steps[currentStepIndex].label} approval`
                        ) : getStatus(steps[currentStepIndex].id) === 'approved' ? (
                            `Approved by ${steps[currentStepIndex].label}`
                        ) : (
                            `Rejected by ${steps[currentStepIndex].label}`
                        )}
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LeaveProgressTracker;