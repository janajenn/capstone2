// components/LeaveProgressTracker.jsx
import React from 'react';
import { motion } from 'framer-motion';

const LeaveProgressTracker = ({ approvals }) => {
    // Define the steps in order
    const steps = [
        { id: 'submitted', label: 'You (Submitted)', icon: '📝' },
        { id: 'hr', label: 'HR Review', icon: '👔' },
        { id: 'dept_head', label: 'Dept. Head', icon: '👨‍💼' },
        { id: 'admin', label: 'Final Approval', icon: '✅' },
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
        approved: 'bg-emerald-100 text-emerald-800',
        rejected: 'bg-rose-100 text-rose-800',
        pending: 'bg-amber-100 text-amber-800'
    };

    return (
        <div className="w-full px-4 py-6">
            <div className="relative">
                {/* Progress line */}
                <div className="absolute top-6 left-10 right-10 h-1.5 bg-gray-200 rounded-full z-0">
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full z-0"
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
                            <div key={step.id} className="flex flex-col items-center">
                                {/* Step indicator */}
                                <motion.div
                                    className={`flex items-center justify-center w-12 h-12 rounded-full shadow-sm border-2 mb-2
                                        ${isCompleted ? 'bg-emerald-500 border-emerald-600 text-white' :
                                          isCurrent ? 'bg-white border-blue-500 text-blue-600 shadow-md' :
                                          'bg-gray-50 border-gray-300 text-gray-400'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                    {isCompleted ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <span className="text-xl">{step.icon}</span>
                                    )}
                                </motion.div>

                                {/* Step label and status */}
                                <div className="text-center max-w-[100px]">
                                    <div className={`text-sm font-medium ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>
                                        {step.label}
                                    </div>

                                    {step.id !== 'submitted' && (
                                        <motion.div
                                            className={`mt-1 text-xs px-2 py-0.5 rounded-full ${statusColors[status]}`}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
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
                className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Status</h4>
                <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                        steps[currentStepIndex].id === 'submitted' ? 'bg-blue-500' :
                        getStatus(steps[currentStepIndex].id) === 'approved' ? 'bg-emerald-500' :
                        getStatus(steps[currentStepIndex].id) === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                    <p className="text-sm text-gray-600">
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
