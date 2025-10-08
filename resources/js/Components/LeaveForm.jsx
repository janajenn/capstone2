import React from 'react';

export default function LeaveForm({ leaveRequest, employee, approvers }) {
    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Helper function to get leave type display name
    const getLeaveTypeDisplay = (type) => {
        const leaveTypes = {
            'VL': 'VACATION LEAVE',
            'SL': 'SICK LEAVE',
            'ML': 'MATERNITY LEAVE',
            'PL': 'PATERNITY LEAVE',
            'SPL': 'SPECIAL PRIVILEGE LEAVE',
            'SOLOPL': 'SOLO PARENT LEAVE',
            'STL': 'STUDY LEAVE',
            '10DVL': '10-DAY VAWC LEAVE',
            'RL': 'REHABILITATION PRIVILEGE',
            'SLBW': 'SPECIAL LEAVE BENEFITS FOR WOMEN',
            'AL': 'ADOPTION LEAVE',
            'FL': 'FORCE LEAVE'
        };
        return leaveTypes[type] || type;
    };

    // Helper function to check if leave type matches
    const isLeaveType = (type) => {
        return leaveRequest?.leave_type === type;
    };

    // Helper function to get approver by role
    const getApproverByRole = (role) => {
        console.log('Getting approver for role:', role);
        console.log('Approvers array:', approvers);
        if (!approvers || approvers.length === 0) {
            console.log('No approvers found, returning null');
            return null;
        }
        
        // Map the role parameter to the display role names
        const roleMapping = {
            'hr': 'HRMO-Designate',
            'dept_head': 'Department Head', 
            'admin': 'Municipal Vice Mayor'
        };
        
        const displayRole = roleMapping[role];
        const approver = approvers.find(approver => approver.role === displayRole);
        console.log('Found approver for role', role, ':', approver);
        return approver;
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
            sick_type: fieldValues.find(v => ['in_hospital', 'outpatient'].includes(v)) || null,
            illness: fieldValues.find(v => v && !['in_hospital', 'outpatient', 'within_philippines', 'abroad', 'masters_completion', 'board_exam', 'continuing_education', 'gynecological_surgery', 'miscarriage'].includes(v)) || null,
            
            // Study Leave options
            studyPurpose: fieldValues.find(v => ['masters_completion', 'board_exam', 'continuing_education'].includes(v)) || null,
            
            // Special Leave Benefits for Women
            slbwCondition: fieldValues.find(v => ['gynecological_surgery', 'miscarriage'].includes(v)) || null,
            
            // Maternity Leave
            expectedDeliveryDate: fieldValues.find(v => v && v.includes('-') && v.length === 10) || null,
            physicianName: fieldValues.find(v => v && (v.includes('Dr.') || v.includes('dr.'))) || null
        };
    };

    // Get working days from stored data
    const getWorkingDays = () => {
        // Use the stored working days from the leave request
        const daysWithPay = leaveRequest?.days_with_pay || 0;
        const daysWithoutPay = leaveRequest?.days_without_pay || 0;
        const totalDays = daysWithPay + daysWithoutPay;
        
        return totalDays > 0 ? totalDays : '';
    };

    // Get HR approval date
    const getHRApprovalDate = () => {
        if (!approvers || approvers.length === 0) {
            return formatDate(new Date());
        }
        
        // Find HR approver and get their approval date
        const hrApprover = approvers.find(approver => 
            approver.role === 'HRMO-Designate' || approver.role === 'hr'
        );
        
        if (hrApprover && hrApprover.approved_at) {
            return formatDate(hrApprover.approved_at);
        }
        
        // Fallback to current date if no HR approval date found
        return formatDate(new Date());
    };

    // Get leave credit data from logs
    const getLeaveCreditData = (leaveType) => {
        if (!employee?.leave_credit_logs) return null;
        
        // Find the most recent log for this leave type
        const relevantLogs = employee.leave_credit_logs.filter(log => 
            log.type === leaveType
        );
        
        if (relevantLogs.length === 0) return null;
        
        // Get the most recent log
        const latestLog = relevantLogs[0];
        
        return {
            total_earned: latestLog.balance_before,
            less_application: latestLog.points_deducted,
            balance: latestLog.balance_after
        };
    };

    const leaveDetails = getLeaveDetails();

    // Debug logging
    console.log('=== LEAVE FORM DEBUG ===');
    console.log('leaveRequest:', leaveRequest);
    console.log('leaveRequest.details:', leaveRequest?.details);
    console.log('leaveDetails:', leaveDetails);
    console.log('Field values:', leaveRequest?.details?.map(d => d.field_value).filter(Boolean));
    console.log('Employee leave credit logs:', employee?.leave_credit_logs);
    console.log('VL Credit Data:', getLeaveCreditData('VL'));
    console.log('SL Credit Data:', getLeaveCreditData('SL'));
    console.log('Specific checks:');
    console.log('- vacationLocation:', leaveDetails.vacationLocation);
    console.log('- sick_type:', leaveDetails.sick_type);
    console.log('- illness:', leaveDetails.illness);
    console.log('- studyPurpose:', leaveDetails.studyPurpose);
    console.log('- slbwCondition:', leaveDetails.slbwCondition);
    console.log('- expectedDeliveryDate:', leaveDetails.expectedDeliveryDate);
    console.log('- physicianName:', leaveDetails.physicianName);
    console.log('========================');

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

               

                {/* Basic Information Table - Populated data */}
                <table className="form-info-table">
    <tbody>
        <tr>
            <td className="left-section" style={{ minWidth: '500px' }}>
                <strong style={{ marginRight: '160px' }}>1.Office/Department: {employee?.department?.name || 'N/A'}</strong>
                <strong>2.Name: {employee?.full_name || 'N/A'}</strong>
            </td>
        </tr>
        <tr>
            <td className="left-section">
                <strong style={{ marginRight: '140px' }}>3.Date of filing: {formatDate(leaveRequest?.created_at)}</strong>
                <strong style={{ marginRight: '100px' }}>4.Position: {employee?.position || 'N/A'}</strong>
                <strong>5.Salary: ₱{employee?.salary ? Number(employee.salary).toLocaleString() : 'N/A'}</strong>
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
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('VL') ? 'checked' : ''}`}>
                                        {isLeaveType('VL') ? '✓' : ''}
                                    </span> Vacation Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('FL') ? 'checked' : ''}`}>
                                        {isLeaveType('FL') ? '✓' : ''}
                                    </span> Forced Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('SL') ? 'checked' : ''}`}>
                                        {isLeaveType('SL') ? '✓' : ''}
                                    </span> Sick Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('ML') ? 'checked' : ''}`}>
                                        {isLeaveType('ML') ? '✓' : ''}
                                    </span> Maternity Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('PL') ? 'checked' : ''}`}>
                                        {isLeaveType('PL') ? '✓' : ''}
                                    </span> Paternity Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('SPL') ? 'checked' : ''}`}>
                                        {isLeaveType('SPL') ? '✓' : ''}
                                    </span> Special Privilege Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('SOLOPL') ? 'checked' : ''}`}>
                                        {isLeaveType('SOLOPL') ? '✓' : ''}
                                    </span> Solo Parent Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('STL') ? 'checked' : ''}`}>
                                        {isLeaveType('STL') ? '✓' : ''}
                                    </span> Study Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('10DVL') ? 'checked' : ''}`}>
                                        {isLeaveType('10DVL') ? '✓' : ''}
                                    </span> 10-Day VAWC Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('RL') ? 'checked' : ''}`}>
                                        {isLeaveType('RL') ? '✓' : ''}
                                    </span> Rehabilitation Privilege
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('SLBW') ? 'checked' : ''}`}>
                                        {isLeaveType('SLBW') ? '✓' : ''}
                                    </span> Special Leave Benefits for Women
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('AL') ? 'checked' : ''}`}>
                                        {isLeaveType('AL') ? '✓' : ''}
                                    </span> Adoption Leave
                                </div><br /><br /><br /><br /><br />
                                
                                <div className="leave-type-option">
                                    <span className="checkbox"></span> Others: 
                                </div><br />
                                ________________________________________
                            </td>
                            
                            <td style={{ width: '50%' }}>
                                6.B DETAILS OF LEAVE<br /><br />
                                
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
                                        {leaveDetails.vacationLocation && (
                                            <>
                                                <strong>Location: {leaveDetails.vacationLocation === 'within_philippines' ? 'Within Philippines' : 'Abroad'}</strong><br /><br />
                                            </>
                                        )}
                                    </div>
                                    
                                    {/* Sick Leave */}
                                    <div>
                                        In case of Sick Leave:<br />
                                        <span className={`checkbox ${leaveDetails.sick_type === 'in_hospital' ? 'checked' : ''}`}>
                                            {leaveDetails.sick_type === 'in_hospital' ? '✓' : ''}
                                        </span> In Hospital (Specify illness):_____________________________________<br /><br />
                                        <span className={`checkbox ${leaveDetails.sick_type === 'outpatient' ? 'checked' : ''}`}>
                                            {leaveDetails.sick_type === 'outpatient' ? '✓' : ''}
                                        </span> Out Patient (Specify illness):_____________________________________<br /><br />
                                        {leaveDetails.illness && ( <>
                                            <strong>Illness/Reason: {leaveDetails.illness}</strong><br /><br />
                                            </>)}
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
                                        {leaveDetails.slbwCondition && ( <>
                                            <strong>Condition: {leaveDetails.slbwCondition === 'gynecological_surgery' ? 'Gynecological Surgery' : 'Miscarriage'}</strong><br /><br />
                                            </>)}
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
                                        {leaveDetails.studyPurpose && ( <>
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
                                <strong>{(leaveRequest?.days_with_pay || 0) + (leaveRequest?.days_without_pay || 0)} days</strong><br /><br />
                                Inclusive Dates: <br />
                                <strong>{formatDate(leaveRequest?.start_date)} to {formatDate(leaveRequest?.end_date)}</strong>
                            </td>
                            <td>
                                6.D COMMUTATION<br />
                                <span className="checkbox"></span> Not Requested<br />
                                <span className="checkbox"></span> Requested<br /><br />
                                
                                <div className="signature-section">
                                    <div className="system-signature">Digitally Signed by Applicant</div>
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
                                    As of {getHRApprovalDate()} <br /><br />
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
                                            <td>
                                                {isLeaveType('VL') 
                                                    ? (getLeaveCreditData('VL')?.total_earned || '__')
                                                    : '__'
                                                }
                                            </td>
                                            <td>
                                                {isLeaveType('SL') 
                                                    ? (getLeaveCreditData('SL')?.total_earned || '__')
                                                    : '__'
                                                }
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Less this application</td>
                                            <td>
                                                {isLeaveType('VL') 
                                                    ? (getLeaveCreditData('VL')?.less_application || '0')
                                                    : '0'
                                                }
                                            </td>
                                            <td>
                                                {isLeaveType('SL') 
                                                    ? (getLeaveCreditData('SL')?.less_application || '0')
                                                    : '0'
                                                }
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Balance</td>
                                            <td>
                                                {isLeaveType('VL') 
                                                    ? (getLeaveCreditData('VL')?.balance || '__')
                                                    : '__'
                                                }
                                            </td>
                                            <td>
                                                {isLeaveType('SL') 
                                                    ? (getLeaveCreditData('SL')?.balance || '__')
                                                    : '__'
                                                }
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                
                                <br />
                                <div className="signature-section">
                                    <div className="approver-signature-line">
                                        {(() => {
                                            const hrApprover = getApproverByRole('hr');
                                            console.log('HR Approver in template:', hrApprover);
                                            return hrApprover?.name || 'HRMO-Designate';
                                        })()}
                                    </div>
                                    <div className="verification-text">Digitally Signed and Certified by</div>
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
                                    <div className="verification-text">Digitally Signed and Approved by</div>
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
                                <strong>{leaveRequest?.days_with_pay || 0} days with pay</strong><br />
                                <strong>{leaveRequest?.days_without_pay || 0} days without pay</strong><br />
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
                                    <div className="verification-text">Digitally Signed and Approved by</div>
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
                    background: #f5f5f5;
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
                        background:rgb(200, 198, 198) !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}