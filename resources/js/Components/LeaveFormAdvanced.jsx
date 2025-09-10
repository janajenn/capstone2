import React, { useMemo } from 'react';

export default function LeaveFormAdvanced({ leaveRequest, employee, approvers, leaveTypeMapping = null }) {
    // Default leave type mapping if none provided
    const defaultLeaveTypeMapping = {
        'VL': 'VACATION LEAVE',
            'SL': 'SICK LEAVE',
                'ML': 'MATERNITY LEAVE',
                'PL': 'PATERNITY LEAVE',
            'SPL': 'SPECIAL PRIVILEGE LEAVE',
            'SOLOPL': 'SOLO PARENT LEAVE',
            'STL': 'STUDY LEAVE',
            '10DVL': '10-DAY VAWC LEAVE',
            'RP': 'REHABILITATION PRIVILEGE',
            'SLBW': 'SPECIAL LEAVE BENEFITS FOR WOMEN',
            'AL': 'ADOPTION LEAVE',
            'FL': 'FORCE LEAVE'
    };

    const leaveTypes = leaveTypeMapping || defaultLeaveTypeMapping;

    // Memoized calculations for performance
    const formData = useMemo(() => {
        const startDate = leaveRequest?.start_date ? new Date(leaveRequest.start_date) : null;
        const endDate = leaveRequest?.end_date ? new Date(leaveRequest.end_date) : null;
        
        // Calculate working days (excluding weekends)
        const calculateWorkingDays = () => {
            if (!startDate || !endDate) return 0;
            
            let workingDays = 0;
            const currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                const dayOfWeek = currentDate.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
                    workingDays++;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            return workingDays;
        };

        // Get leave type details
        const getLeaveTypeDetails = () => {
            const type = leaveRequest?.leave_type;
            return {
                type,
                displayName: leaveTypes[type] || type,
                isVacation: ['VL', 'SPL'].includes(type),
                isSick: ['SL', 'SLW'].includes(type),
                isMaternity: type === 'ML',
                isPaternity: type === 'PL',
                isStudy: type === 'STL',
                isSpecial: ['SOLOPL', '10DVL', 'RP', 'AL', 'FL', 'BL', 'CL', 'SLBW'].includes(type)
            };
        };

        // Calculate leave credits impact
        const getLeaveCreditsImpact = () => {
            const workingDays = calculateWorkingDays();
            const type = leaveRequest?.leave_type;
            
            if (type === 'VL') {
                return {
                    vacation: workingDays,
                    sick: 0,
                    vacationBalance: (employee?.leave_credits?.vacation_leave || 0) - workingDays,
                    sickBalance: employee?.leave_credits?.sick_leave || 0
                };
            } else if (type === 'SL') {
                return {
                    vacation: 0,
                    sick: workingDays,
                    vacationBalance: employee?.leave_credits?.vacation_leave || 0,
                    sickBalance: (employee?.leave_credits?.sick_leave || 0) - workingDays
                };
            } else {
                return {
                    vacation: 0,
                    sick: 0,
                    vacationBalance: employee?.leave_credits?.vacation_leave || 0,
                    sickBalance: employee?.leave_credits?.sick_leave || 0
                };
            }
        };

        return {
            workingDays: calculateWorkingDays(),
            leaveTypeDetails: getLeaveTypeDetails(),
            leaveCreditsImpact: getLeaveCreditsImpact(),
            startDate,
            endDate
        };
    }, [leaveRequest, employee, leaveTypes]);

    // Helper function to format date
    const formatDate = (date) => {
        if (!date) return '';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Helper function to check if leave type matches
    const isLeaveType = (type) => {
        return leaveRequest?.leave_type === type;
    };

    // Helper function to get approver by role
    const getApproverByRole = (role) => {
        if (!approvers || approvers.length === 0) return null;
        return approvers.find(approver => approver.role === role);
    };

    // Helper function to get leave details and checkboxes from field_value
    const getLeaveDetails = () => {
        const details = leaveRequest?.details || [];
        
        // Extract field_value from leave_request_details
        const fieldValues = details.map(d => d.field_value).filter(Boolean);
        
        return {
            // Vacation Leave options
            vacationLocation: fieldValues.find(v => ['within_philippines', 'abroad'].includes(v)) || null,
            
            // Sick Leave options
            sickType: fieldValues.find(v => ['in_hospital', 'outpatient'].includes(v)) || null,
            illness: fieldValues.find(v => v && !['in_hospital', 'outpatient', 'within_philippines', 'abroad', 'masters_completion', 'board_exam', 'continuing_education', 'gynecological_surgery', 'miscarriage'].includes(v)) || null,
            
            // Study Leave options
            studyPurpose: fieldValues.find(v => ['masters_completion', 'board_exam', 'continuing_education'].includes(v)) || null,
            
            // Special Leave Benefits for Women
            slbwCondition: fieldValues.find(v => ['gynecological_surgery', 'miscarriage'].includes(v)) || null,
            
            // Maternity Leave
            expectedDeliveryDate: fieldValues.find(v => v && v.includes('-') && v.length === 10) || null,
            physicianName: fieldValues.find(v => v && v.includes('Dr.') || v.includes('dr.')) || null
        };
    };

    // Helper function to get reason for leave
    const getLeaveReason = () => {
        return leaveRequest?.reason || leaveRequest?.remarks || 'Not specified';
    };

    const leaveDetails = getLeaveDetails();

    return (
        <div className="leave-form-container">
            {/* Print Button */}
            <div className="print-controls">
                <button 
                    onClick={() => window.print()} 
                    className="print-button"
                >
                    🖨️ Print Form
                </button>
            </div>

            {/* Leave Form */}
            <div className="leave-form-page">
                {/* Header */}
                <div className="form-header">
                    <div className="government-info">
                        Republic of the Philippines<br />
                        Local Government Unit of Opol<br />
                        Zone 3, Poblacion Opol, Misamis Oriental<br />
                    </div>
                </div>

                <div className="form-title">APPLICATION FOR LEAVE</div>

                {/* Form Header Table - Exact format from image */}
                <table className="form-header-table">
                    <tbody>
                        <tr>
                            <td className="left-section">
                                Office/Department:
                            </td>
                            <td className="right-section">
                                Name: (Last) (First) (Middle)
                            </td>
                        </tr>
                        <tr>
                            <td className="left-section">
                                Date of filing:
                            </td>
                            <td className="middle-section">
                                Position:
                            </td>
                            <td className="right-section">
                                Salary:
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Basic Information Table - Populated data */}
                <table className="form-info-table">
                    <tbody>
                        <tr>
                            <td className="left-section">
                                <strong>{employee?.department?.name || 'N/A'}</strong>
                            </td>
                            <td className="right-section">
                                <strong>{employee?.full_name || 'N/A'}</strong>
                            </td>
                        </tr>
                        <tr>
                            <td className="left-section">
                                <strong>{formatDate(leaveRequest?.created_at)}</strong>
                            </td>
                            <td className="middle-section">
                                <strong>{employee?.position || 'N/A'}</strong>
                            </td>
                            <td className="right-section">
                                <strong>₱{employee?.salary ? Number(employee.salary).toLocaleString() : 'N/A'}</strong>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <br />

                {/* Leave Details Section */}
                <div className="section-title">6. DETAILS OF APPLICATION</div>

                <table className="form-table bordered">
                    <tbody>
                        <tr>
                            <td style={{ width: '50%' }}>
                                6.A TYPE OF LEAVE TO BE AVAILED OF:<br /><br />
                                
                                {Object.entries(leaveTypes).map(([code, name]) => (
                                    <div key={code} className="leave-type-option">
                                        <span className={`checkbox ${isLeaveType(code) ? 'checked' : ''}`}>
                                            {isLeaveType(code) ? '✓' : ''}
                                        </span> {name}
                                    </div>
                                ))}
                                
                                <br /><br />
                                <div className="leave-type-option">
                                    <span className="checkbox"></span> Others: 
                                </div><br />
                                ________________________________________
                            </td>
                            
                            <td style={{ width: '50%' }}>
    6.B DETAILS OF LEAVE<br /><br />
    
    {/* Always show all leave type fields */}
    <div>
        {/* Vacation Leave */}
        <div>
            In case of Vacation/Special Privilege Leave:<br />
            <span className={`checkbox ${leaveDetails.vacationLocation === 'within_philippines' ? 'checked' : ''}`}>
                {leaveDetails.vacationLocation === 'within_philippines' ? '✓' : ''}
            </span> Within the Philippines : _______________________________________<br /><br />
            <span className={`checkbox ${leaveDetails.vacationLocation === 'abroad' ? 'checked' : ''}`}>
                {leaveDetails.vacationLocation === 'abroad' ? '✓' : ''}
            </span> Abroad (Specify):_____________________________________________<br /><br />
            {leaveDetails.vacationLocation && ( <>
                <strong>Location: {leaveDetails.vacationLocation === 'within_philippines' ? 'Within Philippines' : 'Abroad'}</strong><br /><br />
            </>
            )}
        </div>
        
        {/* Sick Leave */}
        <div>
            In case of Sick Leave:<br />
            <span className={`checkbox ${leaveDetails.sickType === 'in_hospital' ? 'checked' : ''}`}>
                {leaveDetails.sickType === 'in_hospital' ? '✓' : ''}
            </span> In Hospital (Specify illness):_____________________________________<br /><br />
            <span className={`checkbox ${leaveDetails.sickType === 'outpatient' ? 'checked' : ''}`}>
                {leaveDetails.sickType === 'outpatient' ? '✓' : ''}
            </span> Out Patient (Specify illness):_____________________________________<br /><br />
            {leaveDetails.illness && ( <>
                <strong>Illness/Reason: {leaveDetails.illness}</strong><br /><br />
            </>
            )}
        </div>

        {/* Special Leave Benefits for Women */}
        <div>
            In case of Special Leave Benefits for Women:<br />
            <span className={`checkbox ${leaveDetails.slbwCondition === 'gynecological_surgery' ? 'checked' : ''}`}>
                {leaveDetails.slbwCondition === 'gynecological_surgery' ? '✓' : ''}
            </span> Gynecological Surgery<br /><br />
            <span className={`checkbox ${leaveDetails.slbwCondition === 'miscarriage' ? 'checked' : ''}`}>
                {leaveDetails.slbwCondition === 'miscarriage' ? '✓' : ''}
            </span> Miscarriage<br /><br />
            {leaveDetails.slbwCondition && ( 
                <>
                <strong>Condition: {leaveDetails.slbwCondition === 'gynecological_surgery' ? 'Gynecological Surgery' : 'Miscarriage'}</strong><br /><br />
              </> ) }
        </div>

        {/* Study Leave */}
        <div>
            In case of Study Leave:<br />
            <span className={`checkbox ${leaveDetails.studyPurpose === 'masters_completion' ? 'checked' : ''}`}>
                {leaveDetails.studyPurpose === 'masters_completion' ? '✓' : ''}
            </span> Completion of Master's<br /><br />
            <span className={`checkbox ${leaveDetails.studyPurpose === 'board_exam' ? 'checked' : ''}`}>
                {leaveDetails.studyPurpose === 'board_exam' ? '✓' : ''}
            </span> BAR/Board Exam Review<br /><br />
            <span className={`checkbox ${leaveDetails.studyPurpose === 'continuing_education' ? 'checked' : ''}`}>
                {leaveDetails.studyPurpose === 'continuing_education' ? '✓' : ''}
            </span> Continuing Education<br /><br />
            {leaveDetails.studyPurpose && ( 
                <>
                <strong>Purpose: {leaveDetails.studyPurpose === 'masters_completion' ? 'Completion of Master\'s' :
                         leaveDetails.studyPurpose === 'board_exam' ? 'BAR/Board Exam Review' :
                         leaveDetails.studyPurpose === 'continuing_education' ? 'Continuing Education' : 'Other'}</strong><br /><br />
            </>)}
        </div>

        {/* Always show Maternity Leave if applicable */}
        {isLeaveType('ML') && (
            <div>
                In case of Maternity Leave:<br />
                <strong>Expected Delivery: {leaveDetails.expectedDeliveryDate ? formatDate(leaveDetails.expectedDeliveryDate) : 'Not specified'}</strong><br /><br />
                <strong>Physician: {leaveDetails.physicianName || 'Not specified'}</strong><br /><br />
            </div>
        )}

        Other Purpose:_____________________________________<br /><br />
        <span className="checkbox"></span> Monetization of Leave Credits<br /><br />
        <span className="checkbox"></span> Terminal Leave<br /><br />
        <br />
    </div>
</td>
                        </tr>
                        
                        <tr>
                            <td>
                                6.C NUMBER OF WORKING DAYS APPLIED FOR<br /><br />
                                <strong>{formData.workingDays} days</strong><br /><br />
                                Inclusive Dates: <br />
                                <strong>{formatDate(formData.startDate)} to {formatDate(formData.endDate)}</strong>
                            </td>
                            <td>
                                6.D COMMUTATION<br />
                                <span className="checkbox"></span> Not Requested<br />
                                <span className="checkbox"></span> Requested<br /><br />
                                
                                <div className="signature-section">
                                    <div className="system-signature">System-Generated Signature</div>
                                    <div className="signature-label">(Signature of Applicant)</div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <br />

                {/* Action Details Section */}
                <div className="section-title" style={{ textAlign: 'center' }}>
                    7. DETAILS OF ACTION ON APPLICATION
                </div>

                <table className="form-table bordered">
                    <tbody>
                        <tr>
                            <td style={{ width: '50%' }}>
                                7.A CERTIFICATION OF LEAVE CREDITS<br /><br />
                                <div style={{ textAlign: 'center' }}>
                                    As of {formatDate(new Date())} <br /><br />
                                </div>
                                
                                <table className="leave-credits-table">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Vacation Leave</th>
                                            <th>Sick Leave</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Total Earned</td>
                                            <td>{employee?.leave_credits?.vacation_leave || '__'}</td>
                                            <td>{employee?.leave_credits?.sick_leave || '__'}</td>
                                        </tr>
                                        <tr>
                                            <td>Less this application</td>
                                            <td>{formData.leaveCreditsImpact.vacation}</td>
                                            <td>{formData.leaveCreditsImpact.sick}</td>
                                        </tr>
                                        <tr>
                                            <td>Balance</td>
                                            <td>{formData.leaveCreditsImpact.vacationBalance}</td>
                                            <td>{formData.leaveCreditsImpact.sickBalance}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                
                                <br />
                                <div className="signature-section">
                                    <div className="approver-signature-line">
                                        {getApproverByRole('hr')?.name || 'HRMO-Designate'}
                                    </div>
                                    <div className="verification-text">Verified & Approved (System-Generated)</div>
                                    <div className="signature-label">(HRMO-Designate)</div>
                                </div>
                            </td>
                            
                            <td style={{ width: '50%' }}>
                                7.B RECOMMENDATION<br />
                                <span className="checkbox checked">✓</span> For approval<br />
                                <span className="checkbox"></span> For disapproval due to: _____________________________________<br /><br />
                                ___________________________________________________________<br /><br /><br /><br /><br /><br />
                                <div className="signature-section">
                                    <div className="approver-signature-line">
                                        {getApproverByRole('dept_head')?.name || 'Department Head'}
                                    </div>
                                    <div className="verification-text">Verified & Approved (System-Generated)</div>
                                    <div className="signature-label">(Department Head/Authorized Personnel)</div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <br />

                {/* Final Approval Section */}
                <table className="final-approval-table">
                    <tbody>
                        <tr>
                            <td style={{ width: '50%', borderRight: 'none' }}>
                                7.C APPROVED FOR:<br />
                                <strong>{formData.workingDays} days with pay</strong><br />
                                _____ days without pay<br />
                                _____ others (specify)__________
                            </td>
                            <td style={{ width: '50%', borderLeft: 'none' }}>
                                7.D DISAPPROVED DUE TO:<br />
                                ______________________________________________________________<br /><br />
                                ______________________________________________________________
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2" style={{ textAlign: 'center', paddingTop: '40px', borderTop: 'none' }}>
                                <div className="approver-signature">
                                    <div className="approver-signature-line">
                                        {getApproverByRole('admin')?.name || 'Municipal Vice Mayor'}
                                    </div>
                                    <div className="approver-role">
                                        {getApproverByRole('admin')?.role === 'admin' ? 'Municipal Vice Mayor' : 'Administrator'}
                                    </div>
                                    <div className="verification-text">Verified & Approved (System-Generated)</div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Print Styles */}
            <style jsx>{`
                .leave-form-container {
                    font-family: Arial, sans-serif;
                    font-size: 11px;
                    background: #fffafa;
                    padding: 30px;
                }

                .print-controls {
                    text-align: right;
                    margin-bottom: 10px;
                }

                .print-button {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }

                .print-button:hover {
                    background: #0056b3;
                }

                .leave-form-page {
                    width: 816px;
                    min-height: 1056px;
                    margin: auto;
                    background: white;
                    padding: 40px;
                    box-shadow: 0 0 5px rgba(0,0,0,0.3);
                    border: 1px solid #000;
                }

                .form-header {
                    text-align: center;
                }

                .government-info {
                    font-size: 11px;
                }

                .form-title {
                    text-align: center;
                    font-weight: bold;
                    font-size: 14px;
                    margin-top: 10px;
                }

                /* Form Header Table - Exact format from image */
                .form-header-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 10px;
                }

                .form-header-table td {
                    padding: 8px;
                    border: 1px solid #000;
                    vertical-align: top;
                }

                .form-header-table .left-section {
                    width: 30%;
                }

                .form-header-table .middle-section {
                    width: 35%;
                }

                .form-header-table .right-section {
                    width: 35%;
                }

                /* Form Info Table - Populated data */
                .form-info-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }

                .form-info-table td {
                    padding: 8px;
                    border: 1px solid #000;
                    vertical-align: top;
                }

                .form-info-table .left-section {
                    width: 30%;
                }

                .form-info-table .middle-section {
                    width: 35%;
                }

                .form-info-table .right-section {
                    width: 35%;
                }

                .section-title {
                    font-weight: bold;
                    background: #eee;
                    padding: 2px 4px;
                    border: 1px solid #000;
                    margin-bottom: 5px;
                }

                .form-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .form-table td, .form-table th {
                    padding: 3px;
                    vertical-align: top;
                }

                .bordered td, .bordered th {
                    border: 1px solid #000;
                }

                .leave-type-option {
                    margin-bottom: 2px;
                }

                .checkbox {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border: 1px solid #000;
                    margin-right: 3px;
                    text-align: center;
                    line-height: 12px;
                    font-size: 10px;
                }

                .checkbox.checked {
                    background: #000;
                    color: white;
                }

                .leave-credits-table {
                    width: 100%;
                    border: 1px solid #000;
                    text-align: center;
                    border-collapse: collapse;
                }

                .leave-credits-table th,
                .leave-credits-table td {
                    border: 1px solid #000;
                    padding: 3px;
                }

                .signature-section {
                    text-align: center;
                    margin-top: 20px;
                }

                .system-signature {
                    font-weight: bold;
                    color: #666;
                    font-style: italic;
                }

                .approver-signature-line {
                    width: 200px;
                    margin: 0 auto;
                    border-bottom: 1px solid #000;
                    height: 25px;
                    line-height: 25px;
                    font-weight: bold;
                }

                .verification-text {
                    margin-top: 5px;
                    font-weight: bold;
                    color: #666;
                    font-style: italic;
                }

                .approver-role {
                    margin-top: 5px;
                    font-weight: bold;
                    font-size: 10px;
                }

                .signature-label {
                    margin-top: 5px;
                    font-size: 10px;
                    color: #666;
                }

                .final-approval-table {
                    width: 100%;
                    border: 1px solid #000;
                    border-collapse: collapse;
                }

                .final-approval-table td {
                    padding: 3px;
                    border: 1px solid #000;
                }

                .approver-signature {
                    text-align: center;
                }

                /* Print-specific styles */
                @media print {
                    /* Hide all page elements except the form */
                    body * {
                        visibility: hidden;
                    }
                    
                    .leave-form-container,
                    .leave-form-container * {
                        visibility: visible;
                    }
                    
                    .leave-form-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        padding: 0;
                        margin: 0;
                        background: white;
                    }
                    
                    .print-controls {
                        display: none;
                    }
                    
                    .leave-form-page {
                        box-shadow: none;
                        border: none;
                        margin: 0;
                        padding: 20px;
                        width: 100%;
                        min-height: auto;
                    }
                    
                    /* Ensure proper page breaks */
                    .leave-form-page {
                        page-break-inside: avoid;
                    }
                    
                    /* Remove any background colors for better printing */
                    .section-title {
                        background: #f0f0f0 !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}
