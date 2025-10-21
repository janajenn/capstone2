import React from 'react';

const CompactProgressIndicator = ({ 
    approvals, 
    isDeptHead = false, 
    isAdmin = false, 
    isRecalled = false, 
    onClick 
}) => {
    if (isRecalled) {
        return (
            <button
                onClick={onClick}
                className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full hover:bg-red-200 transition-colors"
            >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Recall Details
            </button>
        );
    }

    // Define steps based on user type - both dept heads and admins skip dept_head approval
    const steps = (isDeptHead || isAdmin)
        ? ['hr', 'admin'] // Dept heads and admins skip dept_head approval
        : ['hr', 'dept_head', 'admin']; // Regular employees

    const getStatus = (role) => {
        if (!approvals) return 'pending';
        const approval = approvals.find(a => a.role === role);
        return approval?.status || 'pending';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-500';
            case 'rejected': return 'bg-red-500';
            default: return 'bg-yellow-500';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved': return 'Approved';
            case 'rejected': return 'Rejected';
            default: return 'Pending';
        }
    };

    // Check if all approvals are complete
    const isComplete = steps.every(step => getStatus(step) === 'approved');
    const isRejected = steps.some(step => getStatus(step) === 'rejected');

    return (
        <button
            onClick={onClick}
            className="inline-flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-50 transition-colors w-full"
        >
            {/* Progress dots */}
            <div className="flex items-center justify-center space-x-1">
                {steps.map((step, index) => {
                    const status = getStatus(step);
                    const isLast = index === steps.length - 1;
                    
                    return (
                        <div key={step} className="flex items-center">
                            {/* Step indicator */}
                            <div 
                                className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}
                                title={`${step.toUpperCase()}: ${getStatusText(status)}`}
                            />
                            
                            {/* Connector line (except for last step) */}
                            {!isLast && (
                                <div className="w-3 h-0.5 bg-gray-300 mx-1" />
                            )}
                        </div>
                    );
                })}
            </div>
            
            {/* Status text */}
            <span className={`text-xs font-medium ${
                isComplete ? 'text-green-600' : 
                isRejected ? 'text-red-600' : 
                'text-yellow-600'
            }`}>
                {isComplete ? 'Complete' : isRejected ? 'Rejected' : 'In Progress'}
            </span>
        </button>
    );
};

export default CompactProgressIndicator;