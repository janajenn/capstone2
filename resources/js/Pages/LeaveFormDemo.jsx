import React, { useState } from 'react';
import HRLayout from '@/Layouts/HRLayout';
import LeaveForm from '@/Components/LeaveForm';
import PageTransition from '@/Components/PageTransition';


export default function LeaveFormDemo({ auth }) {
    // Sample data to demonstrate the component
    const [selectedLeaveRequest, setSelectedLeaveRequest] = useState(0);
    
    const sampleLeaveRequests = [
        {
            id: 1,
            leave_type: 'VL',
            start_date: '2024-01-15',
            end_date: '2024-01-19',
            created_at: '2024-01-10',
            status: 'approved',
            reason: 'Personal vacation',
            details: [
                {
                    vacation_location: 'within_philippines'
                }
            ]
        },
        {
            id: 2,
            leave_type: 'SL',
            start_date: '2024-01-22',
            end_date: '2024-01-24',
            created_at: '2024-01-18',
            status: 'approved',
            reason: 'Medical checkup',
            details: [
                {
                    sick_type: 'outpatient',
                    illness: 'Regular medical checkup and consultation'
                }
            ]
        },
        {
            id: 3,
            leave_type: 'ML',
            start_date: '2024-02-01',
            end_date: '2025-05-01',
            created_at: '2024-01-25',
            status: 'approved',
            reason: 'Maternity leave',
            details: [
                {
                    expected_delivery_date: '2024-02-15',
                    physician_name: 'Dr. Maria Santos, OB-GYN'
                }
            ]
        },
        {
            id: 4,
            leave_type: 'STL',
            start_date: '2024-03-01',
            end_date: '2024-03-15',
            created_at: '2024-02-20',
            status: 'approved',
            reason: 'Board exam review',
            details: [
                {
                    study_purpose: 'board_exam'
                }
            ]
        },
        {
            id: 5,
            leave_type: 'SLW',
            start_date: '2024-04-01',
            end_date: '2024-04-05',
            created_at: '2024-03-25',
            status: 'approved',
            reason: 'Gynecological surgery',
            details: [
                {
                    slbw_condition: 'gynecological_surgery'
                }
            ]
        }
    ];

    const sampleEmployee = {
        full_name: 'Juan Dela Cruz Santos',
        position: 'Administrative Officer III',
        salary: 25000,
        department: {
            name: 'Human Resource Management Office'
        },
        leave_credits: {
            vacation_leave: 15,
            sick_leave: 15
        }
    };

    const sampleApprovers = [
        {
            name: 'Maria Santos, HRMO IV',
            role: 'hr'
        },
        {
            name: 'Pedro Martinez, Department Head',
            role: 'dept_head'
        },
        {
            name: 'Ana Rodriguez, Municipal Vice Mayor',
            role: 'admin'
        }
    ];

    const currentRequest = sampleLeaveRequests[selectedLeaveRequest];

    return (
        <HRLayout user={auth.user}>
            <PageTransition 
                animation="fade-slide-up"
                duration={500}
                delay={100}
                className="max-w-7xl mx-auto p-6 space-y-8"
            >
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Leave Form Generator</h1>
                    <p className="text-lg text-gray-600">
                        Generate official leave forms for approved leave requests
                    </p>
                </div>

                {/* Leave Request Selector */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-semibold mb-6">Select Leave Request</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sampleLeaveRequests.map((request, index) => (
                            <div
                                key={request.id}
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                    selectedLeaveRequest === index
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => setSelectedLeaveRequest(index)}
                            >
                                <h3 className="font-semibold text-lg mb-2">
                                    {request.leave_type === 'VL' ? 'Vacation Leave' :
                                     request.leave_type === 'SL' ? 'Sick Leave' :
                                     request.leave_type === 'ML' ? 'Maternity Leave' :
                                     request.leave_type === 'STL' ? 'Study Leave' :
                                     request.leave_type === 'SLW' ? 'Special Leave Benefits for Women' : request.leave_type}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    <strong>Dates:</strong> {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Reason:</strong> {request.reason}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Status:</strong> {request.status}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leave Form Display */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-semibold mb-6">Generated Leave Form</h2>
                    
                    <div className="text-sm text-gray-600 mb-4">
                        <p><strong>Selected Request:</strong> {currentRequest.leave_type} - {new Date(currentRequest.start_date).toLocaleDateString()} to {new Date(currentRequest.end_date).toLocaleDateString()}</p>
                        <p><strong>Employee:</strong> {sampleEmployee.full_name} - {sampleEmployee.position}</p>
                        <p><strong>Department:</strong> {sampleEmployee.department.name}</p>
                        <p><strong>Reason:</strong> {currentRequest.reason}</p>
                    </div>

                    <div className="border-t pt-6">
                        <LeaveForm 
                            leaveRequest={currentRequest}
                            employee={sampleEmployee}
                            approvers={sampleApprovers}
                        />
                    </div>
                </div>

                {/* Usage Instructions */}
                <div className="bg-blue-50 rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-blue-900">How to Use</h2>
                    <div className="space-y-2 text-blue-800">
                        <p>• <strong>Select a leave request:</strong> Choose from the approved requests above</p>
                        <p>• <strong>Review the form:</strong> All fields are automatically populated with request data</p>
                        <p>• <strong>Dynamic details:</strong> Section 6B shows specific details based on leave type</p>
                        <p>• <strong>Print the form:</strong> Click the print button to generate a print-friendly version</p>
                        <p>• <strong>Integration:</strong> Use this component in your HR leave requests section</p>
                    </div>
                </div>

                {/* Component Props Documentation */}
                <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Component Props</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">leaveRequest</h3>
                            <p className="text-sm text-gray-600">
                                Object containing leave request details (type, dates, status, reason, details array)
                            </p>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold text-lg mb-2">employee</h3>
                            <p className="text-sm text-gray-600">
                                Object with employee information (name, position, department, leave credits)
                            </p>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold text-lg mb-2">approvers</h3>
                            <p className="text-sm text-gray-600">
                                Array of approver objects with names and roles (hr, dept_head, admin)
                            </p>
                        </div>
                    </div>
                </div>

                {/* New Features */}
                <div className="bg-green-50 rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-green-900">New Features</h2>
                    <div className="space-y-2 text-green-800">
                        <p>• <strong>No table borders:</strong> Clean layout between Department, Name, and Date of Filing</p>
                        <p>• <strong>Dynamic leave details:</strong> Section 6B automatically shows relevant information based on leave type</p>
                        <p>• <strong>System-generated signatures:</strong> Professional signature lines with approver names</p>
                        <p>• <strong>Enhanced print functionality:</strong> Form-only printing with proper page isolation</p>
                        <p>• <strong>Leave type support:</strong> Vacation, Sick, Maternity, Study, and Special Leave Benefits for Women</p>
                    </div>
                </div>
            </PageTransition>
        </HRLayout>
    );
}
