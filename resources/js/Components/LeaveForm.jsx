import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function LeaveForm({ leaveRequest, employee, approvers }) {

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const selectedDates = leaveRequest?.selected_dates || [];

    const formattedDates = selectedDates.map(date => {
        if (!date) return '';
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    });

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

    const isLeaveType = (type) => {
        return leaveRequest?.leave_type === type;
    };

    const getApproverByRole = (role) => {
        if (!approvers || approvers.length === 0) return null;
        const roleMapping = {
            'hr': 'HRMO-Designate',
            'dept_head': 'Department Head',
            'admin': 'Municipal Vice Mayor'
        };
        const displayRole = roleMapping[role];
        return approvers.find(approver => approver.role === displayRole) || null;
    };

    const getDisplayPosition = (approver, role) => {
        if (approver?.position) {
            return approver.position;
        }
        const fallbackPositions = {
            'hr': 'HRMO-Designate',
            'dept_head': 'Department Head',
            'admin': 'Municipal Vice Mayor'
        };
        return fallbackPositions[role] || 'Approver';
    };

    const getLeaveDetails = () => {
        const details = leaveRequest?.details || [];
        const fieldValues = details.map(d => d.field_value).filter(Boolean);
        return {
            vacationLocation: fieldValues.find(v => ['within_philippines', 'abroad'].includes(v)) || null,
            sick_type: fieldValues.find(v => ['in_hospital', 'outpatient'].includes(v)) || null,
            illness: fieldValues.find(v => v && !['in_hospital', 'outpatient', 'within_philippines', 'abroad', 'masters_completion', 'board_exam', 'continuing_education', 'gynecological_surgery', 'miscarriage'].includes(v)) || null,
            studyPurpose: fieldValues.find(v => ['masters_completion', 'board_exam', 'continuing_education'].includes(v)) || null,
            slbwCondition: fieldValues.find(v => ['gynecological_surgery', 'miscarriage'].includes(v)) || null,
            expectedDeliveryDate: fieldValues.find(v => v && v.includes('-') && v.length === 10) || null,
            physicianName: fieldValues.find(v => v && (v.includes('Dr.') || v.includes('dr.'))) || null
        };
    };

    const getLeaveCreditData = (leaveType) => {
        if (!employee?.leave_credit_logs || !leaveRequest?.id) return null;
        const totalDaysApplied = getTotalDaysApplied();
        const matchingLogs = employee.leave_credit_logs
            .filter(log => {
                const typeMatches = log.type === leaveType;
                const amountMatches = Math.round(log.points_deducted) === totalDaysApplied;
                const isDeduction = log.points_deducted > 0;
                const isNotLate = !log.remarks?.includes('Late');
                const isNotManual = !log.remarks?.includes('Manual');
                return typeMatches && amountMatches && isDeduction && isNotLate && isNotManual;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        if (matchingLogs.length > 0) {
            const exactMatch = matchingLogs[0];
            return {
                total_earned: Math.round(exactMatch.balance_before),
                less_application: Math.round(exactMatch.points_deducted),
                balance: Math.round(exactMatch.balance_after)
            };
        }
        const fallbackLogs = employee.leave_credit_logs
            .filter(log => {
                const typeMatches = log.type === leaveType;
                const isDeduction = log.points_deducted > 0;
                const isNotLate = !log.remarks?.includes('Late');
                const isNotManual = !log.remarks?.includes('Manual');
                if (leaveRequest.created_at) {
                    const logDate = new Date(log.date);
                    const requestDate = new Date(leaveRequest.created_at);
                    const timeDiff = Math.abs(logDate - requestDate);
                    const isRecent = timeDiff < (7 * 24 * 60 * 60 * 1000);
                    return typeMatches && isDeduction && isNotLate && isNotManual && isRecent;
                }
                return typeMatches && isDeduction && isNotLate && isNotManual;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        if (fallbackLogs.length > 0) {
            const fallbackLog = fallbackLogs[0];
            return {
                total_earned: Math.round(fallbackLog.balance_before),
                less_application: Math.round(fallbackLog.points_deducted),
                balance: Math.round(fallbackLog.balance_after)
            };
        }
        return null;
    };

    const formatSelectedDates = () => {
        if (!leaveRequest?.selected_dates || !Array.isArray(leaveRequest.selected_dates)) {
            return 'No dates selected';
        }
        const dates = leaveRequest.selected_dates;
        const formattedDates = dates.map(date => {
            if (!date) return '';
            const dateObj = new Date(date);
            return dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        });
        return formattedDates.join(', ');
    };

    const getWorkingDaysCount = () => {
        if (!selectedDates || selectedDates.length === 0) return 0;
        let workingDays = 0;
        selectedDates.forEach(date => {
            if (!date) return;
            const dateObj = new Date(date);
            const dayOfWeek = dateObj.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                workingDays++;
            }
        });
        return workingDays;
    };

    const formatSelectedDatesGrouped = () => {
        if (!leaveRequest?.selected_dates || !Array.isArray(leaveRequest.selected_dates)) {
            return 'No dates selected';
        }
        const dates = [...leaveRequest.selected_dates].sort();
        const groupedByMonth = {};
        dates.forEach(date => {
            if (!date) return;
            const dateObj = new Date(date);
            const monthYear = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
            });
            if (!groupedByMonth[monthYear]) {
                groupedByMonth[monthYear] = [];
            }
            groupedByMonth[monthYear].push(dateObj.getDate());
        });
        const result = [];
        for (const [monthYear, days] of Object.entries(groupedByMonth)) {
            const daysList = days.join(', ');
            result.push(`${monthYear}: ${daysList}`);
        }
        return result.join(' | ');
    };

    const getSelectedDatesCount = () => {
        if (!leaveRequest?.selected_dates || !Array.isArray(leaveRequest.selected_dates)) {
            return 0;
        }
        return leaveRequest.selected_dates.length;
    };

    const getTotalDaysApplied = () => {
        if (selectedDates && selectedDates.length > 0) {
            return selectedDates.length;
        }
        return leaveRequest?.total_days || 0;
    };

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

    const leaveDetails = getLeaveDetails();

    const downloadPDF = () => {
        const formElement = document.getElementById('leave-form-content');
        const scale = 3.5;
        html2canvas(formElement, {
            scale: scale,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            dpi: 470,
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
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 1.3;
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
            <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                <button onClick={downloadPDF} style={{ ...buttonStyle, backgroundColor: '#28a745', marginLeft: '10px' }}>
                    📄 Download PDF
                </button>
            </div>

            <div id="leave-form-content">
                <div className="leave-form-page">
                    <div className="form-header">
                        <div className="header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div className="form-number" style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                Civil Service Form No. 6, Revised 2020
                            </div>
                            <div className="logo-space" style={{ width: '80px', height: '80px' }}>
                                <img
                                    src="/assets/Opol_logo.png"
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

                        <div className="government-info">
                            Republic of the Philippines<br />
                            Local Government Unit of Opol<br />
                            Zone 3, Poblacion Opol, Misamis Oriental<br />
                        </div>
                    </div>

                    <div className="form-title">APPLICATION FOR LEAVE</div>

                    <table className="form-info-table">
                        <tbody>
                            <tr>
                                <td className="left-section" style={{ minWidth: '500px' }}>
                                    <strong style={{ marginRight: '220px' }}>1. Office/Department: {employee?.department?.name || 'N/A'}</strong>
                                    <strong>2. Name: {employee?.full_name || 'N/A'}</strong>
                                </td>
                            </tr>
                            <tr>
                                <td className="left-section">
                                    <strong style={{ marginRight: '216px' }}>3. Date of filing: {formatDate(leaveRequest?.created_at)}</strong>
                                    <strong style={{ marginRight: '140px' }}>4. Position: {employee?.position || 'N/A'}</strong>
                                    <strong>5. Salary: ₱{employee?.salary ? Number(employee.salary).toLocaleString() : 'N/A'}</strong>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <br />

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
                                    6. B DETAILS OF LEAVE<br /><br />

                                    <div>
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

                                        <div>
                                            In case of Sick Leave:<br />
                                            <span className={`checkbox ${leaveDetails.sick_type === 'in_hospital' ? 'checked' : ''}`}>
                                                {leaveDetails.sick_type === 'in_hospital' ? '✓' : ''}
                                            </span> In Hospital (Specify illness):_____________________________________<br />
                                            <span className={`checkbox ${leaveDetails.sick_type === 'outpatient' ? 'checked' : ''}`}>
                                                {leaveDetails.sick_type === 'outpatient' ? '✓' : ''}
                                            </span> Out Patient (Specify illness):_____________________________________<br />
                                            {leaveDetails.illness && (<>
                                                <strong>Illness/Reason: {leaveDetails.illness}</strong><br />
                                            </>)}
                                        </div>

                                        <div>
                                            In case of Special Leave Benefits for Women:<br />
                                            Specify Illness: ___________________________________________________
                                        </div>

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
                                            {leaveDetails.studyPurpose && (<>
                                                <strong>Purpose: {leaveDetails.studyPurpose === 'masters_completion' ? 'Completion of Master\'s' :
                                                    leaveDetails.studyPurpose === 'board_exam' ? 'BAR/Board Exam Review' :
                                                        leaveDetails.studyPurpose === 'continuing_education' ? 'Continuing Education' : 'Other'}</strong><br />
                                            </>)}
                                        </div>

                                        <br />
                                        <span className="checkbox"></span> Monetization of Leave Credits<br />
                                        <span className="checkbox"></span> Terminal Leave<br />

                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td>
                                    6. C NUMBER OF WORKING DAYS APPLIED FOR<br />
                                    <strong>{getWorkingDaysCount()} working days</strong><br />
                                    <br />
                                    <strong>INCLUSIVE DATES:</strong><br />
                                    <div style={{
                                        fontSize: '10px',
                                        lineHeight: '1.2',
                                        fontFamily: 'monospace',
                                        padding: '3px',
                                        backgroundColor: '#f5f5f5',
                                        borderRadius: '3px'
                                    }}>
                                        {formatSelectedDatesGrouped()}
                                    </div>
                                </td>
                                <td>
                                    6. D COMMUTATION<br />
                                    <span className="checkbox"></span> Not Requested<br />
                                    <span className="checkbox"></span> Requested<br /><br />
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <br />

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
                                                return hrApprover?.name || 'HRMO-Designate';
                                            })()}
                                        </div>
                                        <div className="verification-text">Reviewed and Certified by</div>
                                        <div className="signature-label">(HRMO-Designate)</div>
                                    </div>
                                </td>

                                <td style={{ width: '50%' }}>
                                    7. B RECOMMENDATION<br />
                                    <span className="checkbox checked">✓</span> For approval<br />
                                    <span className="checkbox"></span> For disapproval due to: _____________________________________<br />
                                    ___________________________________________________________<br /><br />
                                    <div className="signature-section">
                                        <div className="approver-signature-line">
                                            {getApproverByRole('dept_head')?.name || 'Department Head'}
                                        </div>
                                        <div className="verification-text"> Approval Duly Recorded and Authorized in the System by</div>
                                        <div className="signature-label">(Department Head/Authorized Personnel)</div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <br />

                    <table className="final-approval-table">
                        <tbody>
                            <tr>
                                <td style={{ width: '50%' }}>
                                    7.C APPROVED FOR: <br />
                                    <strong>{leaveRequest?.days_with_pay || 0} days with pay</strong><br />
                                    <strong>{leaveRequest?.days_without_pay || 0} days without pay</strong><br />
                                    _____ others (specify)
                                </td>
                                <td style={{ width: '50%' }}>
                                    7. D DISAPPROVED DUE TO:<br />
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
                                            {getDisplayPosition(getApproverByRole('admin'), 'admin')}
                                        </div>
                                        <div className="verification-text">Approval Duly Recorded and Authorized in the System by</div>
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
                    font-size: 12px;
                    background: white;
                    width: 100%;
                }

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
                    width: 1000px;
                    min-height: 1200px;
                    margin: auto;
                    background: white;
                    padding: 20px 25px;
                    box-shadow: 0 0 5px rgba(0,0,0,0.3);
                    border: 1px solid #000;
                    position: relative;
                    left: -20px;
                    top: -15px;
                }

                .form-header {
                    text-align: center;
                    margin-bottom: 5px;
                }

                .government-info {
                    font-size: 12px;
                    line-height: 1.2;
                }

                .form-title {
                    text-align: center;
                    font-weight: bold;
                    font-size: 16px;
                    margin-top: 8px;
                    margin-bottom: 10px;
                }

                .form-info-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 10px;
                }

                .form-info-table td {
                    padding: 6px;
                    border: 1px solid #000;
                    vertical-align: top;
                    font-size: 12px;
                }

                .form-info-table .left-section {
                    width: 100%;
                }

                .section-title {
                    font-weight: bold;
                    background: #eee;
                    padding: 4px 6px;
                    border: 1px solid #000;
                    margin-bottom: 6px;
                    font-size: 13px;
                }

                .form-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .form-table td, .form-table th {
                    padding: 4px;
                    vertical-align: top;
                    font-size: 12px;
                }

                .bordered td, .bordered th {
                    border: 1px solid #000;
                }

               .leave-type-option {
    display: flex;
    align-items: center;
    margin-bottom: 2px;
    font-size: 12px;
    line-height: 1.2;
}

.checkbox {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    border: 1px solid #000;
    margin-right: 6px;
    text-align: center;
    line-height: 1;          /* reset line-height for better centering */
    font-size: 11px;
    margin-top: 10px;         /* ← nudge checkbox down – adjust this (1px or 2px) */
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
                    font-size: 12px;
                }

                .leave-credits-table th,
                .leave-credits-table td {
                    border: 1px solid #000;
                    padding: 4px;
                }

                .signature-section {
                    text-align: center;
                    margin-top: 15px;
                }

                .system-signature {
                    font-weight: bold;
                    color: #666;
                    font-style: italic;
                    font-size: 11px;
                }

                .approver-signature-line {
                    width: 250px;
                    margin: 0 auto;
                    border-bottom: 1px solid #000;
                    height: 30px;
                    line-height: 30px;
                    font-weight: bold;
                    font-size: 13px;
                }

                .verification-text {
                    margin-top: 5px;
                    font-weight: bold;
                    color: #666;
                    font-style: italic;
                    font-size: 11px;
                }

                .approver-role {
                    margin-top: 5px;
                    font-weight: bold;
                    font-size: 11px;
                }

                .signature-label {
                    margin-top: 5px;
                    font-size: 11px;
                    color: #666;
                }

               .final-approval-table {
                    width: 100%;
                    border: 1px solid #000;
                    border-collapse: collapse;
                }

                .final-approval-table tr:first-child td {
                    border-bottom: 1px solid #000;
                    border-left: none !important;
                    border-right: none !important;
                }

                .final-approval-table td {
                    padding: 6px;
                    border: none;
                    font-size: 12px;
                }

                .final-approval-table tr:first-child td:first-child {
                    border-right: none !important;
                }

                .final-approval-table tr:first-child td:last-child {
                    border-left: none !important;
                }

                .approver-signature {
                    text-align: center;
                }

                br {
                    margin-bottom: 5px !important;
                }

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
                        left: -5mm;
                        top: -5mm;
                        width: 103%;
                        padding: 0;
                        margin: 0;
                        background: white;
                    }

                    .print-controls {
                        display: none;
                    }

                    .leave-form-page {
                        width: 100% !important;
                        min-height: 95vh !important;
                        height: auto !important;
                        overflow: visible !important;
                        box-shadow: none !important;
                        border: none !important;
                        font-size: 12pt !important;
                        position: relative !important;
                        transform: none !important;
                        transform-origin: top left !important;
                        left: 0 !important;
                        top: 0 !important;
                        padding: 10mm 12mm !important;
                        margin: 0 auto !important;
                    }

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
                        margin: 5mm;
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

                    .form-header,
                    .form-title,
                    .form-info-table,
                    .form-table,
                    .leave-credits-table,
                    .final-approval-table {
                        -webkit-font-smoothing: antialiased !important;
                        -moz-osx-font-smoothing: grayscale !important;
                    }

                    .leave-form-page * {
                        text-rendering: optimizeLegibility !important;
                    }
                }
            `}</style>
        </div>
    );
}

const buttonStyle = {
    background: '#007bff',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
};
