import React from 'react';

export default function CreditConversionForm({ conversion, employee, approvers }) {
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

    // Helper function to get approver by role
    const getApproverByRole = (role) => {
        if (!approvers || approvers.length === 0) {
            return null;
        }
        
        const roleMapping = {
            'hr': 'HRMO-Designate',
            'dept_head': 'Department Head', 
            'admin': 'Municipal Vice Mayor'
        };
        
        const displayRole = roleMapping[role];
        return approvers.find(approver => approver.role === displayRole);
    };

    // Get HR approval date
    const getHRApprovalDate = () => {
        if (!approvers || approvers.length === 0) {
            return formatDate(new Date());
        }
        
        const hrApprover = approvers.find(approver => 
            approver.role === 'HRMO-Designate' || approver.role === 'hr'
        );
        
        if (hrApprover && hrApprover.approved_at) {
            return formatDate(hrApprover.approved_at);
        }
        
        return formatDate(new Date());
    };

    // Get leave credit data from logs
    const getLeaveCreditData = (leaveType) => {
        if (!employee?.leave_credit_logs) return null;
        
        const relevantLogs = employee.leave_credit_logs
            .filter(log => 
                log.type === leaveType && 
                (!log.remarks || !log.remarks.includes('Late'))
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (relevantLogs.length === 0) return null;
        
        const latestLog = relevantLogs[0];
        
        return {
            total_earned: latestLog.balance_before,
            less_application: 10, // Fixed to 10 days for monetization
            balance: latestLog.balance_after
        };
    };

    // Add this debug section at the top of your component
console.log('=== EMPLOYEE DATA DEBUG ===');
console.log('Full employee object:', employee);
console.log('Available properties:', employee ? Object.keys(employee) : 'No employee data');
console.log('Firstname:', employee?.firstname);
console.log('Middlename:', employee?.middlename);
console.log('Lastname:', employee?.lastname);
console.log('==========================');

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

            {/* Credit Conversion Form */}
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

                {/* Basic Information Table */}
                <table className="form-info-table">
                    <tbody>
                        <tr>
                            <td className="left-section" style={{ minWidth: '500px' }}>
                                <strong style={{ marginRight: '160px' }}>1.Office/Department: {employee?.department?.name || 'N/A'}</strong>
                                <strong>2.Name: {employee?.firstname } {employee?.middlename } {employee?.lastname || 'N/A'} </strong>
                            </td>
                        </tr>
                        <tr>
                            <td className="left-section">
                                <strong style={{ marginRight: '140px' }}>3.Date of filing: {formatDate(conversion?.submitted_at)}</strong>
                                <strong style={{ marginRight: '100px' }}>4.Position: {employee?.position || 'N/A'}</strong>
                                <strong>5.Salary: ₱{employee?.monthly_salary ? Number(employee.monthly_salary).toLocaleString() : 'N/A'}</strong>
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
                                    <span className="checkbox">
                                        {/* Vacation Leave checked for monetization */}
                                    </span> Vacation Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className="checkbox">
                                    </span> Forced Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className="checkbox">
                                    </span> Sick Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className="checkbox">
                                    </span> Maternity Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className="checkbox">
                                    </span> Paternity Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className="checkbox">
                                    </span> Special Privilege Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className="checkbox">
                                    </span> Solo Parent Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className="checkbox">
                                    </span> Study Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className="checkbox">
                                    </span> 10-Day VAWC Leave
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className="checkbox">
                                    </span> Rehabilitation Privilege
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className="checkbox">
                                    </span> Special Leave Benefits for Women
                                </div><br />
                                
                                <div className="leave-type-option">
                                    <span className="checkbox">
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
                                        In case of Vacation Leave:<br />
                                       Within the Philippines: _______________________ <br /> <br /> 
                                        Abroad (Specify):_____________________________________________<br /><br />
                                    </div>
                                    
                                    {/* Sick Leave */}
                                    <div>
                                        In case of Sick Leave:<br />
                                        In Hospital (Specify illness):_____________________________________<br /><br />
                                         Out Patient (Specify illness):_____________________________________<br /><br />
                                        
                                    </div>

                                    {/* Special Leave Benefits for Women */}
                                    <div>
                                        In case of Special Leave Benefits for Women:<br />
                                        Gynecological Surgery<br /><br />
                                        Miscarriage<br /><br />
                                        
                                    </div>

                                    {/* Study Leave */}
                                    <div>
                                        In case of Study Leave:<br />
                                         Completion of Master's<br /><br />
                                         BAR/Board Exam Review<br /><br />
                                        Continuing Education<br /><br />
                                        
                                    </div>

                                    

                                    Other Purpose:_____________________________________<br /><br />
                                    
                                    {/* Monetization of Leave Credits - CHECKED */}
                                    <span className="checkbox checked">✓</span> Monetization of Leave Credits<br /><br />
                                    
                                    <span className="checkbox"></span> Terminal Leave<br /><br />
                                    <br />
                                </div>
                            </td>
                        </tr>
                        
                        <tr>
                            <td>
                                6.C NUMBER OF WORKING DAYS APPLIED FOR<br /><br />
                                {/* Fixed to 10 days for monetization */}
                                <strong>10 days</strong><br /><br />
                                Inclusive Dates: <br />
                                
                            </td>
                            <td>
                                6.D COMMUTATION<br />
                                <span className="checkbox"></span> Not Requested<br />
                                {/* Requested - CHECKED for monetization */}
                                <span className="checkbox checked">✓</span> Requested<br /><br />
                                
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
                                                {getLeaveCreditData('VL')?.total_earned || '__'}
                                            </td>
                                            <td>
                                                {getLeaveCreditData('SL')?.total_earned || '__'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Less this application</td>
                                            <td>
                                                {/* Fixed to 10 days for monetization */}
                                                10
                                            </td>
                                            <td>
                                                0
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Balance</td>
                                            <td>
                                                {getLeaveCreditData('VL')?.balance || '__'}
                                            </td>
                                            <td>
                                                {getLeaveCreditData('SL')?.balance || '__'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                
                                <br />
                                <div className="signature-section">
                                    <div className="approver-signature-line">
                                        {getApproverByRole('hr')?.name || 'HRMO-Designate'}
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
                                {/* 10 days with pay for monetization */}
                                <strong>10 days with pay</strong><br />
                                <strong>0 days without pay</strong><br />
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
                    
                    .leave-form-page {
                        page-break-inside: avoid;
                    }
                    
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