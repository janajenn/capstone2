import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import HRLayout from '@/Layouts/HRLayout';
import { Link } from '@inertiajs/react';

export default function MonetizationForm({ auth, conversion, employee, approvers }) {
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




    const downloadPDF = () => {
        const formElement = document.getElementById('monetization-form-content');
        
        // Create a clone to modify for PDF without affecting the screen display
        const clone = formElement.cloneNode(true);
        
        // Apply wider styles only to the PDF version
        const formPage = clone.querySelector('.monetization-form-page');
        if (formPage) {
            formPage.style.width = '1600px'; // Match the CSS width
            formPage.style.minHeight = '1900px';
            formPage.style.padding = '30px 35px';
            formPage.style.fontSize = '14px';
            formPage.style.left = '0';
            formPage.style.top = '0';
        }
        
        // Make all tables wider in the PDF version
        const tables = clone.querySelectorAll('table');
        tables.forEach(table => {
            table.style.width = '100%';
            table.style.fontSize = '14px';
        });
        
        // Make table cells taller for PDF
        const tableCells = clone.querySelectorAll('td, th');
        tableCells.forEach(cell => {
            cell.style.padding = '12px';
            cell.style.fontSize = '14px';
        });
        
        // Create temporary container for PDF generation
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.background = '#ffffff';
        tempContainer.appendChild(clone);
        document.body.appendChild(tempContainer);
        
        const scale = 4;
        
        html2canvas(clone, {
            scale: scale,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            dpi: 300,
            letterRendering: true,
            allowTaint: true,
            width: 1600,
            height: clone.scrollHeight,
            windowWidth: 1600,
            windowHeight: clone.scrollHeight
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
            
            // Use very small margins to maximize page usage
            const margin = 1;
            const maxWidth = pdfWidth - (2 * margin);
            const maxHeight = pdfHeight - (2 * margin);
            
            const widthRatio = maxWidth / imgWidth;
            const heightRatio = maxHeight / imgHeight;
            const ratio = Math.min(widthRatio, heightRatio);
            
            // Center the wider form in the PDF
            const xPosition = margin;
            const yPosition = margin;
            
            pdf.addImage(imgData, 'JPEG', xPosition, yPosition, imgWidth * ratio, imgHeight * ratio);
            
            pdf.setProperties({
                title: 'Monetization Application Form',
                subject: 'Employee VL Credit Monetization Request',
                author: 'HR System'
            });
            
            // Clean up
            document.body.removeChild(tempContainer);
            
            pdf.save('monetization-application-form.pdf');
        }).catch(error => {
            console.error('Error generating PDF:', error);
            document.body.removeChild(tempContainer);
        });
    };

    return (
        <HRLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section with Buttons */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="relative">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                                Monetization Form
                            </h1>
                            <p className="text-gray-600">Generate printable form for VL credit monetization</p>
                            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
                            {/* Close Button */}
                            <Link 
                                href={route('hr.credit-conversions')}
                                className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-medium rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center group"
                            >
                                <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Close
                            </Link>
                            
                            {/* Download Button */}
                            <button 
                                onClick={downloadPDF}
                                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center group relative overflow-hidden"
                            >
                                {/* Animated background effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                
                                {/* Button content */}
                                <svg className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="relative z-10 font-bold text-lg">Download PDF</span>
                                
                                {/* Success animation */}
                                <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 group-hover:right-4 transition-all duration-300 opacity-0 group-hover:opacity-100">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Important Notice */}
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-6 shadow-lg">
                    <div className="flex items-start">
                        <div className="p-2 rounded-2xl bg-blue-500 text-white mr-4">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-blue-900">Printing Instructions</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Click "Download PDF" to generate a printable version of this monetization form. 
                                The form follows the standard Civil Service format for leave applications.
                            </p>
                        </div>
                    </div>
                </div>

              {/* Form Container with proper spacing */}
{/* Form Container - Clean for PDF */}
<div className="bg-white border border-gray-200 p-6 mb-8">
    <div className="monetization-form-container" style={{ overflow: 'auto', maxWidth: '1000px', margin: '0 auto' }}>
        
        
   
        <div id="monetization-form-content">
                            {/* Monetization Form */}
                            <div className="monetization-form-page">
                                {/* Header */}
                                <div className="form-header">
                                    <div className="header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <div className="form-number" style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                            Civil Service Form No. 6, Revised 2020
                                        </div>
                                        <div className="logo-space" style={{ width: '80px', height: '80px' }}>
                                            <img 
                                                src="/public/assets/Opol_logo.png" 
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
                                                <strong style={{ marginRight: '216px' }}>3.Date of filing: {formatDate(conversion?.submitted_at)}</strong>
                                                <strong style={{ marginRight: '140px' }}>4.Position: {employee?.position || 'N/A'}</strong>
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
                                                    </span> Vacation Leave
                                                </div>
                                                
                                                <div className="leave-type-option">
                                                    <span className="checkbox">
                                                    </span> Forced Leave
                                                </div>
                                                
                                                <div className="leave-type-option">
                                                    <span className="checkbox">
                                                    </span> Sick Leave
                                                </div>
                                                
                                                <div className="leave-type-option">
                                                    <span className="checkbox">
                                                    </span> Maternity Leave
                                                </div>
                                                
                                                <div className="leave-type-option">
                                                    <span className="checkbox">
                                                    </span> Paternity Leave
                                                </div>
                                                
                                                <div className="leave-type-option">
                                                    <span className="checkbox">
                                                    </span> Special Privilege Leave
                                                </div>
                                                
                                                <div className="leave-type-option">
                                                    <span className="checkbox">
                                                    </span> Solo Parent Leave
                                                </div>
                                                
                                                <div className="leave-type-option">
                                                    <span className="checkbox">
                                                    </span> Study Leave
                                                </div>
                                                
                                                <div className="leave-type-option">
                                                    <span className="checkbox">
                                                    </span> 10-Day VAWC Leave
                                                </div>
                                                
                                                <div className="leave-type-option">
                                                    <span className="checkbox">
                                                    </span> Rehabilitation Privilege
                                                </div>
                                                <div className="leave-type-option">
                                                    <span className="checkbox">
                                                    </span> Special Leave Benefits for Women
                                                </div>
                                                
                                                <div className="leave-type-option">
                                                    <span className="checkbox">
                                                    </span> Adoption Leave
                                                </div>
                                                
                                                <div className="leave-type-option">
                                                    <span className="checkbox ">✓</span> Others: 
                                                </div><br />
                                                ________________________________________
                                            </td>
                                            
                                            <td style={{ width: '50%' }}>
                                                6.B DETAILS OF LEAVE<br /><br />
                                                
                                                <div>
                                                    {/* Vacation Leave */}
                                                    <div>
                                                        In case of Vacation Leave:<br />
                                                        <span className="checkbox">
                                                        </span> Within the Philippines : _______________________________________<br />
                                                        <span className="checkbox">
                                                        </span> Abroad (Specify):_____________________________________________<br />
                                                    </div>
                                                    
                                                    {/* Sick Leave */}
                                                    <div>
                                                        In case of Sick Leave:<br />
                                                        <span className="checkbox">
                                                        </span> In Hospital (Specify illness):_____________________________________<br />
                                                        <span className="checkbox">
                                                        </span> Out Patient (Specify illness):_____________________________________<br />
                                                    </div>

                                                    {/* Special Leave Benefits for Women */}
                                                    <div>
                                                        In case of Special Leave Benefits for Women:<br />
                                                        Specify Illness: ___________________________________________________
                                                    </div>

                                                    {/* Study Leave */}
                                                    <div>
                                                        In case of Study Leave:<br />
                                                        <span className="checkbox">
                                                        </span> Completion of Master's<br />    
                                                        <span className="checkbox">
                                                        </span> BAR/Board Exam Review<br />
                                                        <span className="checkbox">
                                                        </span> Continuing Education<br />
                                                    </div>

                                                    Other Purpose:_____________________________________<br />
                                                    <span className="checkbox checked">✓</span> <strong>Monetization of Leave Credits</strong><br />
                                                    <span className="checkbox">
                                                    </span> Terminal Leave<br />
                                                    
                                                </div>
                                            </td>
                                        </tr>
                                        
                                        <tr>
                                            <td>
                                                6.C NUMBER OF WORKING DAYS APPLIED FOR<br />
                                                <strong>10 days</strong><br />
                                                Inclusive Dates: <br />
                                                <strong>Not Applicable - Credit Monetization</strong>
                                            </td>
                                            <td>
                                                6.D COMMUTATION<br />
                                                <span className="checkbox">
                                                </span> Not Requested<br />
                                                <span className="checkbox checked">✓</span> Requested
                                                
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
                    As of {formatDate(conversion?.admin_approved_at || conversion?.dept_head_approved_at || conversion?.hr_approved_at || conversion?.submitted_at)}<br />
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
                                <strong>
                                    {conversion?.leave_credit_data?.total_earned ? 
                                        Math.round(conversion.leave_credit_data.total_earned) : 
                                        (conversion?.credits_requested ? 
                                            Math.ceil(parseFloat(conversion.credits_requested) + 1) : '10'
                                        )
                                    }
                                </strong>
                            </td>
                            <td>
                                __
                            </td>
                        </tr>
                        <tr>
                            <td>Less this application</td>
                            <td>
                                <strong>
                                    {conversion?.leave_credit_data?.less_application ? 
                                        Math.round(conversion.leave_credit_data.less_application) : 
                                        (conversion?.credits_requested || '9')
                                    }
                                </strong>
                            </td>
                            <td>
                                0
                            </td>
                        </tr>
                        <tr>
                            <td>Balance</td>
                            <td>
                                <strong>
                                    {conversion?.leave_credit_data?.balance ? 
                                        Math.round(conversion.leave_credit_data.balance) : 
                                        (conversion?.credits_requested ? 
                                            Math.ceil(parseFloat(conversion.credits_requested) + 1 - parseFloat(conversion.credits_requested)) : '1'
                                        )
                                    }
                                </strong>
                            </td>
                            <td>
                                __
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
                                <table className="final-approval-table">
                                    <tbody>
                                        <tr>
                                            <td style={{ width: '50%' }}>
                                                7.C APPROVED FOR: <br />
                                                <strong>10 days with pay</strong><br />
                                                <strong>0 days without pay</strong><br />
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

                                                <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx>{`
                .monetization-form-container {
    font-family: Arial, sans-serif;
    font-size: 13px; /* Slightly larger font */
    background: white;
    width: 100%;
}

.monetization-form-page {
    width: 900px; /* Normal width for screen */
    min-height: 1200px; /* Normal height for screen */
    margin: auto;
    background: white;
    padding: 20px 25px; /* Normal padding */
    box-shadow: 0 0 5px rgba(0,0,0,0.3);
    border: 1px solid #000;
    position: relative;
    left: 0;
    top: 0;
    transform: none;
    font-size: 12px; /* Normal font size */
}

.form-header {
    text-align: center;
    margin-bottom: 8px;
}

.government-info {
    font-size: 13px; /* Larger */
    line-height: 1.3;
}

.form-title {
    text-align: center;
    font-weight: bold;
    font-size: 18px; /* Larger title */
    margin-top: 12px;
    margin-bottom: 15px;
}

/* Make all tables wider and with more spacing */
.form-info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
}

.form-info-table td {
    padding: 10px; /* Increased from 8px */
    border: 1px solid #000;
    vertical-align: top;
    font-size: 13px;
    height: 50px; /* Added fixed height */
    min-height: 50px; /* Ensure minimum height */
}

.section-title {
    font-weight: bold;
    background: #eee;
    padding: 6px 8px; /* More padding */
    border: 1px solid #000;
    margin-bottom: 8px;
    font-size: 14px; /* Larger */
}

/* Make main form tables fill available space */
.form-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed; /* Ensure consistent column widths */
}

.form-table td, .form-table th {
    padding: 8px; /* Increased from 6px */
    vertical-align: top;
    font-size: 13px;
    height: 45px; /* Added fixed height */
    min-height: 45px; /* Ensure minimum height */
}

.bordered td, .bordered th {
    border: 1px solid #000;
}

/* Make the leave type options section larger */
.leave-type-option {
    margin-bottom: 4px; /* Increased from 3px */
    font-size: 13px;
    line-height: 1.6; /* Increased line height */
    padding: 2px 0; /* Added vertical padding */
    min-height: 20px; /* Ensure minimum height */
}
.checkbox {
    display: inline-block;
    width: 16px; /* Larger checkboxes */
    height: 16px;
    border: 1px solid #000;
    margin-right: 6px; /* More spacing */
    text-align: center;
    line-height: 16px;
    font-size: 12px; /* Slightly larger */
}

.checkbox.checked {
    background: #000;
    color: white;
}

/* Make leave credits table larger */
.leave-credits-table {
    width: 100%;
    border: 1px solid #000;
    text-align: center;
    border-collapse: collapse;
    font-size: 13px; /* Larger */
    margin: 10px 0; /* More spacing */
}

.leave-credits-table th,
.leave-credits-table td {
    border: 1px solid #000;
    padding: 8px; /* Increased from 6px */
    height: 50px; /* Increased from 35px */
    min-height: 50px; /* Ensure minimum height */
}

/* Make signature sections more prominent */
.signature-section {
    text-align: center;
    margin-top: 25px; /* Increased from 20px */
    min-height: 100px; /* Ensure minimum height for signature areas */
}

.system-signature {
    font-weight: bold;
    color: #666;
    font-style: italic;
    font-size: 12px; /* Larger */
}

.approver-signature-line {
    width: 300px;
    margin: 0 auto;
    border-bottom: 2px solid #000;
    height: 45px; /* Increased from 35px */
    line-height: 45px; /* Adjusted line height */
    font-weight: bold;
    font-size: 14px;
}

.verification-text {
    margin-top: 8px; /* More spacing */
    font-weight: bold;
    color: #666;
    font-style: italic;
    font-size: 12px; /* Larger */
}

.approver-role {
    margin-top: 8px; /* More spacing */
    font-weight: bold;
    font-size: 12px; /* Larger */
}

.signature-label {
    margin-top: 8px; /* More spacing */
    font-size: 12px; /* Larger */
    color: #666;
}

/* Make final approval table larger */
.final-approval-table {
    width: 100%;
    border: 1px solid #000;
    border-collapse: collapse;
    font-size: 13px; /* Larger */
}

.final-approval-table tr:first-child td {
    border-bottom: 1px solid #000;
    border-left: none !important;
    border-right: none !important;
    height: 80px; /* Increased from 60px */
    min-height: 80px; /* Ensure minimum height */
}

.final-approval-table td {
    padding: 10px; /* Increased from 8px */
    border: none;
    font-size: 13px;
    vertical-align: top;
    height: auto;
    min-height: 40px; /* Added minimum height */
}

.final-approval-table tr:first-child td:first-child {
    border-right: none !important;
}

.final-approval-table tr:first-child td:last-child {
    border-left: none !important;
}

.approver-signature {
    text-align: center;
    margin-top: 30px; /* More spacing for final signature */
}

/* Increase spacing between sections */
br {
    margin-bottom: 15px !important; /* Increased from 10px */
}

/* Print-specific styles */
@media print {
    body * {
        visibility: hidden;
        margin: 0;
        padding: 0;
    }
    
    .monetization-form-container,
    .monetization-form-container * {
        visibility: visible;
    }
    
    .monetization-form-container {
        position: absolute;
        left: 2mm; /* Adjusted right positioning */
        top: -8mm; /* Adjusted upward positioning */
        width: 108%;
        padding: 0;
        margin: 0;
        background: white;
    }
    
    .monetization-form-page {
        width: 100% !important;
        min-height: 95vh !important;
        height: auto !important;
        overflow: visible !important;
        box-shadow: none !important;
        border: none !important;
        font-size: 13pt !important; /* Larger font for print */
        position: relative !important;
        transform: none !important;
        transform-origin: top left !important;
        left: 0 !important;
        top: 0 !important;
        padding: 8mm 10mm !important; /* Adjusted padding */
        margin: 0 auto !important;
    }
    
    /* Make all tables fill the page in print */
    .form-info-table,
    .form-table,
    .leave-credits-table,
    .final-approval-table {
        width: 100% !important;
        font-size: 13pt !important;
    }
    
    .form-info-table td,
    .form-table td,
    .leave-credits-table td,
    .final-approval-table td {
        padding: 8px !important; /* Increased padding for print */
        font-size: 13pt !important;
        height: 45px !important; /* Added height for print */
        min-height: 45px !important;
    }
    
 .section-title {
    font-weight: bold;
    background: #eee;
    padding: 8px 10px; /* Increased from 6px 8px */
    border: 1px solid #000;
    margin-bottom: 12px; /* Increased from 8px */
    font-size: 14px;
    height: 40px; /* Added height */
    line-height: 24px; /* Center text vertically */
}
    
    .approver-signature-line {
        width: 280px !important;
        height: 40px !important;
        line-height: 40px !important;
        font-size: 14pt !important;
    }
    
    @page {
        margin: 3mm; /* Smaller margins to use more page space */
        size: letter;
    }
    
    * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .monetization-form-container * {
        box-sizing: border-box;
    }

    .monetization-form-page {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
    }


    .leave-credits-table th,
    .leave-credits-table td {
        height: 50px !important; /* Taller for print */
        min-height: 50px !important;
    }
    
    .final-approval-table tr:first-child td {
        height: 70px !important; /* Taller for print */
        min-height: 70px !important;
    }
    
    .approver-signature-line {
        height: 40px !important; /* Taller for print */
        line-height: 40px !important;
    }
    
    .section-title {
        height: 35px !important; /* Added height for print */
        line-height: 20px !important; /* Center text */
    }
    
    .leave-type-option {
        line-height: 1.8 !important; /* More spacing in print */
        margin-bottom: 5px !important;
    }


    /* These styles will be applied via JavaScript during PDF generation */
.pdf-wide-version {
    width: 1600px !important; /* Increased from 1400px */
    min-height: 1900px !important; /* Increased height to match */
    padding: 35px 40px !important; /* More padding */
    font-size: 15px !important; /* Slightly larger font */
}

.pdf-wide-table {
    width: 100% !important;
    font-size: 15px !important; /* Match the larger font */
}

.pdf-wide-cell {
    padding: 14px !important; /* More padding */
    font-size: 15px !important; /* Larger font */
    height: 65px !important; /* Taller cells */
    min-height: 65px !important;
}



            `}</style>
        </HRLayout>
    );
}