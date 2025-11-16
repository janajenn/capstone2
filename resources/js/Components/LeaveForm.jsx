import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
   // Get leave credit data from logs - UPDATED to show whole numbers only
const getLeaveCreditData = (leaveType) => {
    if (!employee?.leave_credit_logs) return null;
    
    // Filter out late deductions and sort by date
    const relevantLogs = employee.leave_credit_logs
        .filter(log => 
            log.type === leaveType && 
            (!log.remarks || !log.remarks.includes('Late')) // Exclude late deductions
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (relevantLogs.length === 0) return null;
    
    const latestLog = relevantLogs[0];
    
    return {
        total_earned: Math.round(latestLog.balance_before), // Round to whole number
        less_application: Math.round(latestLog.points_deducted), // Round to whole number
        balance: Math.round(latestLog.balance_after) // Round to whole number
    };
};

    // Debug logging
    console.log('=== ALL LEAVE CREDIT LOGS ===');
    console.log('Employee ID:', employee?.employee_id);
    if (employee?.leave_credit_logs) {
        employee.leave_credit_logs.forEach((log, index) => {
            console.log(`Log ${index}:`, {
                type: log.type,
                date: log.date,
                balance_before: log.balance_before,
                points_deducted: log.points_deducted,
                balance_after: log.balance_after,
                remarks: log.remarks
            });
        });
    }
    console.log('=============================');
    
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



    const downloadPDF = () => {
        const formElement = document.getElementById('leave-form-content');
        
        // Reduced scale for moderate zoom
        const scale = 3.5; // Reduced from 5 to 3.5
        
        html2canvas(formElement, {
            scale: scale,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            dpi: 470, // Reduced from 400
            letterRendering: true,
            allowTaint: true
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
            // Reduced zoom factor - fit to page with slight margin
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 1.3; // Reduced from 1.1 to 0.95
            
            // Center the image with small margins
            const xPosition = (pdfWidth - imgWidth * ratio) / 2 + 5;

            const yPosition = (pdfHeight - imgHeight * ratio) / 2;
            
            pdf.addImage(imgData, 'JPEG', xPosition, yPosition, imgWidth * ratio, imgHeight * ratio);
            
            pdf.setProperties({
                title: 'Leave Application Form',
                subject: 'Employee Leave Request',
                author: 'HR System'
            });
            
            pdf.save('leave-application-form.pdf');
        }).catch(error => {
            console.error('Error generating PDF:', error);
        });
    };


     return (
        <div className="leave-form-container">
            {/* SIMPLE DOWNLOAD BUTTONS */}
            <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                
                <button onClick={downloadPDF} style={{...buttonStyle, backgroundColor: '#28a745', marginLeft: '10px'}}>
                    📄 Download PDF
                </button>
            </div>


            <div id="leave-form-content">
            {/* Leave Form */}
            <div className="leave-form-page">
               {/* Header */}
<div className="form-header">
    {/* Top section with form number and logo space */}
    <div className="header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        {/* Civil Service Form Number - Top Left */}
        <div className="form-number" style={{ fontSize: '11px', fontWeight: 'bold' }}>
            Civil Service Form No. 6, Revised 2020
        </div>
        {/* Logo Space - Top Right */}
<div className="logo-space" style={{ width: '80px', height: '80px' }}>
    <img 
        src="\public\assets\Opol_logo.png" 
        alt="Opol Logo" 
        style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain' 
        }} 
    />
            Opol Logo
        </div>
    </div>

    {/* Government Info - Centered */}
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
                                <strong style={{ marginRight: '220px' }}>1.Office/Department: {employee?.department?.name || 'N/A'}</strong>
                                <strong>2.Name: {employee?.full_name || 'N/A'}</strong>
                            </td>
                        </tr>
                        <tr>
                            <td className="left-section">
                                <strong style={{ marginRight: '216px' }}>3.Date of filing: {formatDate(leaveRequest?.created_at)}</strong>
                                <strong style={{ marginRight: '140px' }}>4.Position: {employee?.position || 'N/A'}</strong>
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
                                </div>
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('FL') ? 'checked' : ''}`}>
                                        {isLeaveType('FL') ? '✓' : ''}
                                    </span> Forced Leave
                                </div>
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('SL') ? 'checked' : ''}`}>
                                        {isLeaveType('SL') ? '✓' : ''}
                                    </span> Sick Leave
                                </div>
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('ML') ? 'checked' : ''}`}>
                                        {isLeaveType('ML') ? '✓' : ''}
                                    </span> Maternity Leave
                                </div>
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('PL') ? 'checked' : ''}`}>
                                        {isLeaveType('PL') ? '✓' : ''}
                                    </span> Paternity Leave
                                </div>
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('SPL') ? 'checked' : ''}`}>
                                        {isLeaveType('SPL') ? '✓' : ''}
                                    </span> Special Privilege Leave
                                </div>
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('SOLOPL') ? 'checked' : ''}`}>
                                        {isLeaveType('SOLOPL') ? '✓' : ''}
                                    </span> Solo Parent Leave
                                </div>
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('STL') ? 'checked' : ''}`}>
                                        {isLeaveType('STL') ? '✓' : ''}
                                    </span> Study Leave
                                </div>
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('10DVL') ? 'checked' : ''}`}>
                                        {isLeaveType('10DVL') ? '✓' : ''}
                                    </span> 10-Day VAWC Leave
                                </div>
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('RL') ? 'checked' : ''}`}>
                                        {isLeaveType('RL') ? '✓' : ''}
                                    </span> Rehabilitation Privilege
                                </div>
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('SLBW') ? 'checked' : ''}`}>
                                        {isLeaveType('SLBW') ? '✓' : ''}
                                    </span> Special Leave Benefits for Women
                                </div>
                                
                                <div className="leave-type-option">
                                    <span className={`checkbox ${isLeaveType('AL') ? 'checked' : ''}`}>
                                        {isLeaveType('AL') ? '✓' : ''}
                                    </span> Adoption Leave
                                </div>
                                
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
                                        In case of Vacation Leave:<br />
                                        <span className={`checkbox ${leaveDetails.vacationLocation === 'within_philippines' ? 'checked' : ''}`}>
                                            {leaveDetails.vacationLocation === 'within_philippines' ? '✓' : ''}
                                        </span> Within the Philippines : _______________________________________<br />
                                        <span className={`checkbox ${leaveDetails.vacationLocation === 'abroad' ? 'checked' : ''}`}>
                                            {leaveDetails.vacationLocation === 'abroad' ? '✓' : ''}
                                        </span> Abroad (Specify):_____________________________________________<br />
                                        {leaveDetails.vacationLocation && (
                                            <>
                                                <strong>Location: {leaveDetails.vacationLocation === 'within_philippines' ? 'Within Philippines' : 'Abroad'}</strong><br />
                                            </>
                                        )}
                                    </div>
                                    
                                    {/* Sick Leave */}
                                    <div>
                                        In case of Sick Leave:<br />
                                        <span className={`checkbox ${leaveDetails.sick_type === 'in_hospital' ? 'checked' : ''}`}>
                                            {leaveDetails.sick_type === 'in_hospital' ? '✓' : ''}
                                        </span> In Hospital (Specify illness):_____________________________________<br />
                                        <span className={`checkbox ${leaveDetails.sick_type === 'outpatient' ? 'checked' : ''}`}>
                                            {leaveDetails.sick_type === 'outpatient' ? '✓' : ''}
                                        </span> Out Patient (Specify illness):_____________________________________<br />
                                        {leaveDetails.illness && ( <>
                                            <strong>Illness/Reason: {leaveDetails.illness}</strong><br />
                                            </>)}
                                    </div>

                                    {/* Special Leave Benefits for Women */}
                                    <div>
                                        In case of Special Leave Benefits for Women:<br />
                                        Specify Illness: ___________________________________________________
                                    </div>

                                    {/* Study Leave */}
                                    <div>
                                        In case of Study Leave:<br />
                                        <span className={`checkbox ${leaveDetails.studyPurpose === 'masters_completion' ? 'checked' : ''}`}>
                                            {leaveDetails.studyPurpose === 'masters_completion' ? '✓' : ''}
                                        </span> Completion of Master's<br />    
                                        <span className={`checkbox ${leaveDetails.studyPurpose === 'board_exam' ? 'checked' : ''}`}>
                                            {leaveDetails.studyPurpose === 'board_exam' ? '✓' : ''}
                                        </span> BAR/Board Exam Review<br />
                                        <span className={`checkbox ${leaveDetails.studyPurpose === 'continuing_education' ? 'checked' : ''}`}>
                                            {leaveDetails.studyPurpose === 'continuing_education' ? '✓' : ''}
                                        </span> Continuing Education<br />
                                        {leaveDetails.studyPurpose && ( <>
                                            <strong>Purpose: {leaveDetails.studyPurpose === 'masters_completion' ? 'Completion of Master\'s' :
                                                     leaveDetails.studyPurpose === 'board_exam' ? 'BAR/Board Exam Review' :
                                                     leaveDetails.studyPurpose === 'continuing_education' ? 'Continuing Education' : 'Other'}</strong><br />
                                            </>)}
                                    </div>

                                    

                                    Other Purpose:_____________________________________<br />
                                    <span className="checkbox"></span> Monetization of Leave Credits<br />
                                    <span className="checkbox"></span> Terminal Leave<br />
                                    
                                </div>
                            </td>
                        </tr>
                        
                        <tr>
                            <td>
                                6.C NUMBER OF WORKING DAYS APPLIED FOR<br />
                                <strong>{(leaveRequest?.days_with_pay || 0) + (leaveRequest?.days_without_pay || 0)} days</strong><br />
                                Inclusive Dates: <br />
                                <strong>{formatDate(leaveRequest?.start_date)} to {formatDate(leaveRequest?.end_date)}</strong>
                            </td>
                            <td>
                                6.D COMMUTATION<br />
                                <span className="checkbox checked">✓</span> Not Requested<br />
                                <span className="checkbox"></span> Requested
                                
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
                                7.A CERTIFICATION OF LEAVE CREDITS<br />
                                <div style={{ textAlign: 'center' }}>
                                    As of {getHRApprovalDate()} <br />
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
                                <span className="checkbox"></span> For disapproval due to: _____________________________________<br />
                                ___________________________________________________________<br /><br />
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
               {/* Final Approval Section */}
<table className="final-approval-table">
    <tbody>
        <tr>
            <td style={{ width: '50%' }}>
                7.C APPROVED FOR: <br />
                <strong>{leaveRequest?.days_with_pay || 0} days with pay</strong><br />
                <strong>{leaveRequest?.days_without_pay || 0} days without pay</strong><br />
                _____ others (specify)__________
            </td>
            <td style={{ width: '50%' }}>
                7.D DISAPPROVED DUE TO:<br />
                ______________________________________________________________<br />    
                ______________________________________________________________
            </td>
        </tr>
        <tr>
            <td colSpan="2" style={{ textAlign: 'center', paddingTop: '20px' }}>
                <div className="approver-signature">
                    <div className="approver-signature-line">
                        {getApproverByRole('admin')?.name || 'Municipal Vice Mayor'}
                    </div>
                    <div className="approver-role">
                        {getApproverByRole('admin')?.role === 'admin' ? 'Municipal Vice Mayor' : 'Administrator'}
                    </div>
                    <div className="verification-text">Digitally Signed and Approved by</div>
                </div>

                <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
            </td>
        </tr>
    </tbody>
</table>
            </div>
            </div>

            {/* Print Styles */}
            <style jsx>{`
                .leave-form-container {
                    font-family: Arial, sans-serif;
                    font-size: 12px; /* Slightly reduced from 13px */
                    background: white;
                    width: 100%;
                }
            
                /* Ensure the form content fits well in the modal */
                @media screen {
                    .leave-form-page {
                        border: none;
                        padding: 0;
                    }
                    
                    .leave-form-container {
                        background: transparent;
                    }
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
                    
    width: 1000px; /* Made wider */
    min-height: 1200px; /* Made taller */
                    margin: auto;
                    background: white;
                    padding: 20px 25px; /* Reduced top/bottom padding, kept side padding */
                    box-shadow: 0 0 5px rgba(0,0,0,0.3);
                    border: 1px solid #000;
                    position: relative;
                    left: -20px; /* Shift entire form to the left */
                    top: -15px; /* Shift entire form upward */
                }
            
                .form-header {
                    text-align: center;
                    margin-bottom: 5px; /* Reduced margin */
                }
            
                .government-info {
                    font-size: 12px; /* Slightly reduced */
                    line-height: 1.2; /* Tighter line spacing */
                }
            
                .form-title {
                    text-align: center;
                    font-weight: bold;
                    font-size: 16px; /* Slightly reduced from 18px */
                    margin-top: 8px; /* Reduced margin */
                    margin-bottom: 10px; /* Reduced margin */
                }
            
                /* Form Info Table - Populated data */
                .form-info-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 10px; /* Reduced margin */
                }
            
                .form-info-table td {
                    padding: 6px; /* Slightly reduced padding */
                    border: 1px solid #000;
                    vertical-align: top;
                    font-size: 12px; /* Slightly reduced */
                }
            
                .form-info-table .left-section {
                    width: 100%;
                }
            
                .section-title {
                    font-weight: bold;
                    background: #eee;
                    padding: 4px 6px; /* Reduced padding */
                    border: 1px solid #000;
                    margin-bottom: 6px; /* Reduced margin */
                    font-size: 13px; /* Slightly reduced */
                }
            
                .form-table {
                    width: 100%;
                    border-collapse: collapse;
                }
            
                .form-table td, .form-table th {
                    padding: 4px; /* Reduced padding */
                    vertical-align: top;
                    font-size: 12px; /* Slightly reduced */
                }
            
                .bordered td, .bordered th {
                    border: 1px solid #000;
                }
            
                .leave-type-option {
                    margin-bottom: 2px; /* Reduced spacing */
                    font-size: 12px; /* Slightly reduced */
                    line-height: 1.2; /* Tighter line spacing */
                }
            
                .checkbox {
                    display: inline-block;
                    width: 14px; /* Slightly reduced */
                    height: 14px; /* Slightly reduced */
                    border: 1px solid #000;
                    margin-right: 4px; /* Reduced spacing */
                    text-align: center;
                    line-height: 14px; /* Adjusted line height */
                    font-size: 11px; /* Slightly reduced */
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
                    font-size: 12px; /* Slightly reduced */
                }
            
                .leave-credits-table th,
                .leave-credits-table td {
                    border: 1px solid #000;
                    padding: 4px; /* Reduced padding */
                }
            
                .signature-section {
                    text-align: center;
                    margin-top: 15px; /* Reduced spacing */
                }
            
                .system-signature {
                    font-weight: bold;
                    color: #666;
                    font-style: italic;
                    font-size: 11px; /* Slightly reduced */
                }
            
                .approver-signature-line {
                    width: 250px; /* Slightly narrower */
                    margin: 0 auto;
                    border-bottom: 1px solid #000;
                    height: 30px; /* Reduced height */
                    line-height: 30px; /* Adjusted line height */
                    font-weight: bold;
                    font-size: 13px; /* Slightly reduced */
                }
            
                .verification-text {
                    margin-top: 5px; /* Reduced spacing */
                    font-weight: bold;
                    color: #666;
                    font-style: italic;
                    font-size: 11px; /* Slightly reduced */
                }
            
                .approver-role {
                    margin-top: 5px; /* Reduced spacing */
                    font-weight: bold;
                    font-size: 11px; /* Slightly reduced */
                }
            
                .signature-label {
                    margin-top: 5px; /* Reduced spacing */
                    font-size: 11px; /* Slightly reduced */
                    color: #666;
                }
            
               .final-approval-table {
    width: 100%;
    border: 1px solid #000;
    border-collapse: collapse;
}

.final-approval-table tr:first-child td {
    border-bottom: 1px solid #000;
    /* Remove all side borders */
    border-left: none !important;
    border-right: none !important;
}

.final-approval-table td {
    padding: 6px;
    /* Remove all borders by default */
    border: none;
    font-size: 12px;
}

/* Remove the border between 7C and 7D specifically */
.final-approval-table tr:first-child td:first-child {
    border-right: none !important;
}

.final-approval-table tr:first-child td:last-child {
    border-left: none !important;
}

.approver-signature {
    text-align: center;
}
                /* Reduce spacing between sections */
                br {
                    margin-bottom: 5px !important; /* Reduced spacing between sections */
                }
            
                /* Print-specific styles */
                @media print {
                    body * {
                        visibility: hidden;
                        margin: 0;
                        padding: 0;
                    }
                    
                    .leave-form-container,
                    .leave-form-container * {
                        visibility: visible;
                    }
                    
                    .leave-form-container {
                        position: absolute;
                        left: -5mm; /* Shift left for print */
                        top: -5mm; /* Shift up for print */
                        width: 103%; /* Slightly wider to compensate for shift */
                        padding: 0;
                        margin: 0;
                        background: white;
                    }
                    
                    .print-controls {
                        display: none;
                    }
                    
                    .leave-form-page {
                        width: 100% !important;
                        min-height: 95vh !important; /* Reduced height for print */
                        height: auto !important;
                        overflow: visible !important;
                        box-shadow: none !important;
                        border: none !important;
                        font-size: 12pt !important; /* Slightly reduced font for print */
                        position: relative !important;
                        transform: none !important;
                        transform-origin: top left !important;
                        left: 0 !important;
                        top: 0 !important;
                        padding: 10mm 12mm !important; /* Reduced padding for print */
                        margin: 0 auto !important;
                    }
                    
                    /* Ensure all content uses adjusted sizes */
                    .form-info-table,
                    .form-table,
                    .leave-credits-table,
                    .final-approval-table {
                        width: 100% !important;
                        font-size: 12pt !important;
                    }
                    
                    .form-info-table td,
                    .form-table td,
                    .leave-credits-table td,
                    .final-approval-table td {
                        word-wrap: break-word;
                        padding: 4px !important;
                        font-size: 12pt !important;
                    }
                    
                    .form-header,
                    .government-info {
                        font-size: 12pt !important;
                        line-height: 1.2 !important;
                    }
                    
                    .form-title {
                        font-size: 16pt !important;
                        margin: 10px 0 !important;
                    }
                    
                    .section-title {
                        font-size: 13pt !important;
                        background: rgb(200, 198, 198) !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        padding: 5px 8px !important;
                    }
                    
                    .leave-type-option {
                        font-size: 12pt !important;
                        margin-bottom: 3px !important;
                        line-height: 1.2 !important;
                    }
                    
                    .checkbox {
                        width: 14px !important;
                        height: 14px !important;
                        line-height: 14px !important;
                        font-size: 11px !important;
                    }
                    
                    .approver-signature-line {
                        width: 250px !important;
                        height: 30px !important;
                        line-height: 30px !important;
                        font-size: 13pt !important;
                    }
                    
                    .signature-label,
                    .verification-text,
                    .approver-role {
                        font-size: 11pt !important;
                    }
            
                    @page {
                        margin: 5mm; /* Reduced margins to use more paper space */
                        size: letter;
                    }
                    
                    * {
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    .leave-form-container * {
    box-sizing: border-box;
}

.leave-form-page {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
}

/* Ensure all text is crisp */
.form-header,
.form-title,
.form-info-table,
.form-table,
.leave-credits-table,
.final-approval-table {
    -webkit-font-smoothing: antialiased !important;
    -moz-osx-font-smoothing: grayscale !important;
}

/* Improve text rendering */
.leave-form-page * {
    text-rendering: optimizeLegibility !important;
}
                }
            `}</style>



        </div>

        
    );
}

// ADD THIS OUTSIDE YOUR COMPONENT
const buttonStyle = {
    background: '#007bff',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
};