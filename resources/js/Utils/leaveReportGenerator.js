// resources/js/Utils/leaveReportGenerator.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateLeaveReportPDF = (data) => {
    const { year, month, leaveReportsData, monthlyStats, departmentStats, leaveTypeStats } = data;
    
    // Create PDF with better default settings
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    // Set default font
    doc.setFont('helvetica');
    
    // Minimalist Company Header - lighter color for subtlety
    doc.setFillColor(243, 244, 246); // Soft gray background
    doc.rect(0, 0, 210, 20, 'F');
    
    // Company Name
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'bold');
    doc.text('MUNICIPALITY OF OPOL', 105, 12, { align: 'center' });
    
    // Report Title and Period on next line
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let periodText = `Employee Leave Report | Year: ${year}`;
    if (month && month !== '') {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        periodText += ` | Month: ${monthNames[parseInt(month) - 1]}`;
    } else {
        periodText += ` | All Months`;
    }
    doc.text(periodText, 105, 18, { align: 'center' });
    
    let yPosition = 30;

    // Check if there's data
    if (!leaveReportsData || leaveReportsData.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text('No employees took leave during the selected period.', 15, yPosition);
        doc.save(`leave-report-${year}${month ? '-' + month : ''}.pdf`);
        return;
    }

    // Group leave requests by month
    const leavesByMonth = groupLeavesByMonth(leaveReportsData, year, month);

    // Sort months in correct order (January to December)
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const sortedMonths = Object.keys(leavesByMonth).sort((a, b) => {
        const getMonthNumber = (monthYearStr) => {
            const monthName = monthYearStr.split(' ')[0];
            return monthNames.indexOf(monthName);
        };
        return getMonthNumber(a) - getMonthNumber(b);
    });

    // Generate monthly sections in correct order
    sortedMonths.forEach(monthKey => {
        const monthData = leavesByMonth[monthKey];
        
        // Check if we need a new page
        if (yPosition > 240) {
            doc.addPage();
            yPosition = 15;
            addPageHeader(doc, year, month);
        }

        // Clear Month Title - bold with subtle underline
        doc.setFontSize(14);
        doc.setTextColor(55, 65, 81);
        doc.setFont('helvetica', 'bold');
        doc.text(monthKey, 15, yPosition);
        
        // Subtle underline
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.5);
        doc.line(15, yPosition + 2, 195, yPosition + 2);
        
        // Month summary
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.setFont('helvetica', 'normal');
        const monthTotal = monthlyStats?.[monthKey] || monthData.length;
        doc.text(`Total Leave Requests: ${monthTotal}`, 15, yPosition + 10);
        
        yPosition += 20;

        if (monthData.length === 0) {
            doc.setFontSize(11);
            doc.setTextColor(156, 163, 175);
            doc.text('No leave requests for this month.', 15, yPosition);
            yPosition += 20;
            return;
        }

        // Group leaves by employee to avoid repetition
        const groupedByEmployee = groupLeavesByEmployee(monthData);

        // Prepare table data for this month with grouped employees
        const tableData = prepareGroupedTableData(groupedByEmployee);

        // Clean full-width table with soft margins (10mm each side)
        autoTable(doc, {
            startY: yPosition,
            head: [['Employee Name', 'Department', 'Leave Type', 'Duration', 'Status']],
            body: tableData,
            headStyles: {
                fillColor: [243, 244, 246], // Soft gray header
                textColor: [55, 65, 81],
                fontStyle: 'bold',
                fontSize: 10,
                cellPadding: 4,
                halign: 'left',
                valign: 'middle'
            },
            styles: {
                fontSize: 9,
                cellPadding: 4,
                overflow: 'linebreak',
                cellWidth: 'wrap',
                lineColor: [229, 231, 235],
                lineWidth: 0.2, // Thinner lines for minimalism
                textColor: [55, 65, 81],
                font: 'helvetica',
                valign: 'middle'
            },
            columnStyles: {
                0: { cellWidth: 50, halign: 'left' }, // Employee Name
                1: { cellWidth: 40, halign: 'left' }, // Department
                2: { cellWidth: 35, halign: 'left' }, // Leave Type
                3: { cellWidth: 25, halign: 'center' }, // Duration
                4: { 
                    cellWidth: 40, 
                    halign: 'center',
                    fontSize: 8, // SMALLER FONT SIZE for status column
                    cellPadding: 3 // Reduced padding for status column
                } // Status
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250] // Very subtle alternate
            },
            margin: { left: 10, right: 10 },
            tableWidth: 190,
            theme: 'grid',
            pageBreak: 'auto',
            rowPageBreak: 'avoid', // Avoid splitting rows across pages
            didParseCell: function(data) {
                // Subtle color code for status
                if (data.column.index === 4) {
                    const status = data.cell.raw;
                    if (status.includes('✓')) {
                        data.cell.styles.fillColor = [240, 253, 244]; // Softer green
                        data.cell.styles.textColor = [21, 128, 61];
                    } else if (status.includes('⏳')) {
                        data.cell.styles.fillColor = [254, 252, 232]; // Softer yellow
                        data.cell.styles.textColor = [180, 83, 9];
                    } else if (status.includes('✗')) {
                        data.cell.styles.fillColor = [255, 241, 242]; // Softer red
                        data.cell.styles.textColor = [185, 28, 28];
                    }
                    
                    // Force smaller font size for status column
                    data.cell.styles.fontSize = 8;
                    data.cell.styles.cellPadding = 3;
                }
                
                // Style for grouped employee rows (where department is empty)
                if (data.column.index === 1 && data.cell.raw === '') {
                    data.cell.styles.fillColor = [250, 250, 250];
                    data.cell.styles.fontStyle = 'normal';
                }
                
                // Style for main employee row (bold)
                if (data.column.index === 0 && data.cell.raw && !data.cell.raw.startsWith(' ')) {
                    data.cell.styles.fontStyle = 'bold';
                }
                
                // Style for subsequent leave rows (indented)
                if (data.column.index === 0 && data.cell.raw && data.cell.raw.startsWith(' ')) {
                    data.cell.styles.fontStyle = 'normal';
                    data.cell.styles.textColor = [75, 85, 99];
                }
            }
        });

        yPosition = doc.lastAutoTable.finalY + 25; // Increased spacing for clean look
    });

    // Add annual summary section - FIXED: Pass leavesByMonth as the last parameter
    addSummarySection(doc, leaveReportsData, monthlyStats, departmentStats, leaveTypeStats, year, month, sortedMonths, leavesByMonth);

    // Add minimalist footer
    addFooter(doc);

    // Save the PDF
    const fileName = `Leave-Report-${year}${month ? '-' + monthNames[parseInt(month) - 1] : ''}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};

// NEW: Group leaves by employee to avoid repetition
const groupLeavesByEmployee = (monthData) => {
    const grouped = {};
    
    monthData.forEach(leave => {
        const employeeId = leave.employee_id || `${leave.employee.firstname}-${leave.employee.lastname}`;
        
        if (!grouped[employeeId]) {
            grouped[employeeId] = {
                employee: leave.employee,
                leaves: []
            };
        }
        
        grouped[employeeId].leaves.push(leave);
    });
    
    return grouped;
};

// NEW: Prepare table data with grouped employees (FIXED: removed redundant leave type)
const prepareGroupedTableData = (groupedByEmployee) => {
    const tableData = [];
    
    Object.values(groupedByEmployee).forEach((employeeGroup, index) => {
        const { employee, leaves } = employeeGroup;
        
        // Add main employee row (first leave)
        if (leaves.length > 0) {
            const firstLeave = leaves[0];
            tableData.push([
                `${employee.firstname} ${employee.lastname}`,
                employee.department?.name || 'N/A',
                firstLeave.leave_type?.name || 'N/A',
                `${firstLeave.duration || calculateDuration(firstLeave.date_from, firstLeave.date_to)}`,
                formatStatus(firstLeave.status, firstLeave.approvals || [])
            ]);
            
            // Add additional leaves for the same employee (without repeating name and department)
            for (let i = 1; i < leaves.length; i++) {
                const leave = leaves[i];
                tableData.push([
                    ``, // Empty name for subsequent rows
                    '', // Empty department for subsequent rows
                    leave.leave_type?.name || 'N/A',
                    `${leave.duration || calculateDuration(leave.date_from, leave.date_to)}`,
                    formatStatus(leave.status, leave.approvals || [])
                ]);
            }
            
            // Add a blank row for separation between employees (except for last employee)
            if (index < Object.values(groupedByEmployee).length - 1) {
                tableData.push(['', '', '', '', '']);
            }
        }
    });
    
    return tableData;
};

// Helper function to add page headers (minimalist)
const addPageHeader = (doc, year, month) => {
    doc.setFillColor(243, 244, 246);
    doc.rect(0, 0, 210, 15, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    let periodText = `Employee Leave Report | Year: ${year}`;
    if (month && month !== '') {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        periodText += ` | Month: ${monthNames[parseInt(month) - 1]}`;
    }
    doc.text(periodText, 105, 10, { align: 'center' });
};

// Helper function to add summary section (simplified to tables for minimalism)
// FIXED: Added leavesByMonth as the last parameter
const addSummarySection = (doc, leaveReportsData, monthlyStats, departmentStats, leaveTypeStats, year, month, sortedMonths, leavesByMonth) => {
    doc.addPage();
    let yPosition = 15;

    // Clear Summary Title
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'bold');
    doc.text('Annual Leave Summary', 15, yPosition);
    
    // Subtle underline
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(15, yPosition + 2, 195, yPosition + 2);
    
    yPosition += 15;

    // Monthly Breakdown Table
    const monthlyData = sortedMonths.map(monthKey => {
        const monthLeaves = leavesByMonth[monthKey] || [];
        const totalRequests = monthlyStats?.[monthKey] || monthLeaves.length;
        const totalDays = monthLeaves.reduce((sum, leave) => sum + (leave.duration || calculateDuration(leave.date_from, leave.date_to)), 0);
        const status = calculateStatusBreakdownForMonth(monthLeaves);
        return [
            monthKey.split(' ')[0], // Month name only
            totalRequests.toString(),
            totalDays.toString(),
            status.approved.toString(),
            (status.pending_hr + status.pending_dept_head + status.pending_admin).toString(),
            status.rejected.toString()
        ];
    });

    autoTable(doc, {
        startY: yPosition,
        head: [['Month', 'Requests', 'Total Days', 'Approved', 'Pending', 'Rejected']],
        body: monthlyData,
        headStyles: {
            fillColor: [243, 244, 246],
            textColor: [55, 65, 81],
            fontStyle: 'bold',
            fontSize: 10,
            cellPadding: 4,
            halign: 'left'
        },
        styles: {
            fontSize: 9,
            cellPadding: 4,
            lineColor: [229, 231, 235],
            lineWidth: 0.2,
            textColor: [55, 65, 81],
            font: 'helvetica'
        },
        columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 30, halign: 'center' },
            3: { cellWidth: 30, halign: 'center' },
            4: { cellWidth: 30, halign: 'center' },
            5: { cellWidth: 30, halign: 'center' }
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 10, right: 10 },
        tableWidth: 190
    });

    yPosition = doc.lastAutoTable.finalY + 20;

    // Overall Key Metrics (simple list instead of cards)
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Metrics', 15, yPosition);
    doc.line(15, yPosition + 2, 195, yPosition + 2);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const totalEmployeesOnLeave = monthlyStats?.totalEmployees || leaveReportsData.length;
    const uniqueDepartments = departmentStats?.uniqueCount || new Set(leaveReportsData.map(emp => emp.department?.name || 'No Department')).size;
    const totalLeaveDays = departmentStats?.totalDays || leaveReportsData.reduce((sum, emp) => {
        const leaveRequests = Array.isArray(emp.leave_requests) ? emp.leave_requests : [];
        return sum + leaveRequests.reduce((empSum, req) => empSum + (req.duration || calculateDuration(req.date_from, req.date_to) || 0), 0);
    }, 0);
    const statusBreakdown = monthlyStats?.statusBreakdown || calculateStatusBreakdown(leaveReportsData);

    doc.text(`Total Employees on Leave: ${totalEmployeesOnLeave}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Unique Departments: ${uniqueDepartments}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Total Leave Days: ${totalLeaveDays}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Fully Approved: ${statusBreakdown.approved}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Pending Approval: ${statusBreakdown.pending_hr + statusBreakdown.pending_dept_head + statusBreakdown.pending_admin}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Rejected: ${statusBreakdown.rejected}`, 15, yPosition);
    yPosition += 20;

    // Department Breakdown Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Department Breakdown', 15, yPosition);
    doc.line(15, yPosition + 2, 195, yPosition + 2);
    yPosition += 10;

    const deptData = departmentStats?.breakdown || Object.entries(leaveReportsData.reduce((acc, employee) => {
        const deptName = employee.department?.name || 'No Department';
        if (!acc[deptName]) acc[deptName] = { count: 0, totalDays: 0 };
        acc[deptName].count++;
        const leaveRequests = Array.isArray(employee.leave_requests) ? employee.leave_requests : [];
        acc[deptName].totalDays += leaveRequests.reduce((days, req) => days + (req.duration || calculateDuration(req.date_from, req.date_to) || 0), 0);
        return acc;
    }, {})).sort((a, b) => b[1].count - a[1].count).map(([deptName, data]) => [deptName, data.count.toString(), data.totalDays.toString()]);

    autoTable(doc, {
        startY: yPosition,
        head: [['Department', 'Employees', 'Total Days']],
        body: deptData,
        headStyles: {
            fillColor: [243, 244, 246],
            textColor: [55, 65, 81],
            fontStyle: 'bold',
            fontSize: 10,
            cellPadding: 4,
            halign: 'left'
        },
        styles: {
            fontSize: 9,
            cellPadding: 4,
            lineColor: [229, 231, 235],
            lineWidth: 0.2,
            textColor: [55, 65, 81],
            font: 'helvetica'
        },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 45, halign: 'center' },
            2: { cellWidth: 45, halign: 'center' }
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 10, right: 10 },
        tableWidth: 190
    });

    yPosition = doc.lastAutoTable.finalY + 20;

    // Leave Type Breakdown Table if available
    if (leaveTypeStats && Object.keys(leaveTypeStats).length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Leave Type Breakdown', 15, yPosition);
        doc.line(15, yPosition + 2, 195, yPosition + 2);
        yPosition += 10;

        const typeData = Object.entries(leaveTypeStats).map(([typeName, count]) => [typeName, count.toString()]);

        autoTable(doc, {
            startY: yPosition,
            head: [['Leave Type', 'Count']],
            body: typeData,
            headStyles: {
                fillColor: [243, 244, 246],
                textColor: [55, 65, 81],
                fontStyle: 'bold',
                fontSize: 10,
                cellPadding: 4,
                halign: 'left'
            },
            styles: {
                fontSize: 9,
                cellPadding: 4,
                lineColor: [229, 231, 235],
                lineWidth: 0.2,
                textColor: [55, 65, 81],
                font: 'helvetica'
            },
            columnStyles: {
                0: { cellWidth: 120 },
                1: { cellWidth: 70, halign: 'center' }
            },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            margin: { left: 10, right: 10 },
            tableWidth: 190
        });
    }
};

// Helper function to add footer (minimalist)
const addFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Subtle footer line
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.2);
        doc.line(10, 280, 200, 280);
        
        // Page number
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        
        // Generated timestamp
        const generatedDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.text(`Generated on ${generatedDate}`, 105, 290, { align: 'center' });
        
        // Confidential notice
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text('Confidential - For Internal Use Only', 105, 295, { align: 'center' });
    }
};

// Additional helper for monthly status breakdown
const calculateStatusBreakdownForMonth = (monthLeaves) => {
    const breakdown = {
        approved: 0,
        pending_hr: 0,
        pending_dept_head: 0,
        pending_admin: 0,
        rejected: 0
    };

    monthLeaves.forEach(leave => {
        switch (leave.status) {
            case 'approved':
                breakdown.approved++;
                break;
            case 'pending':
                breakdown.pending_hr++;
                break;
            case 'pending_dept_head':
                breakdown.pending_dept_head++;
                break;
            case 'pending_admin':
                breakdown.pending_admin++;
                break;
            case 'rejected':
                breakdown.rejected++;
                break;
        }
    });

    return breakdown;
};

// Other helper functions remain the same
const groupLeavesByMonth = (leaveReportsData, year, selectedMonth) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const leavesByMonth = {};
    
    if (selectedMonth && selectedMonth !== '') {
        const monthIndex = parseInt(selectedMonth) - 1;
        leavesByMonth[monthNames[monthIndex] + ` ${year}`] = [];
    } else {
        monthNames.forEach(monthName => {
            leavesByMonth[monthName + ` ${year}`] = [];
        });
    }

    leaveReportsData.forEach(employee => {
        const leaveRequests = Array.isArray(employee.leave_requests) ? employee.leave_requests : [];
        
        leaveRequests.forEach(leave => {
            if (!leave.date_from) return;
            
            const leaveDate = new Date(leave.date_from);
            const leaveMonth = leaveDate.getMonth();
            const leaveYear = leaveDate.getFullYear();
            
            if (leaveYear.toString() !== year.toString()) return;
            
            const monthKey = monthNames[leaveMonth] + ` ${leaveYear}`;
            
            if (selectedMonth && selectedMonth !== '') {
                const targetMonth = parseInt(selectedMonth) - 1;
                if (leaveMonth !== targetMonth) return;
            }
            
            if (!leavesByMonth[monthKey]) {
                leavesByMonth[monthKey] = [];
            }
            
            leavesByMonth[monthKey].push({
                ...leave,
                employee: {
                    firstname: employee.firstname,
                    lastname: employee.lastname,
                    department: employee.department,
                    employee_id: employee.employee_id
                }
            });
        });
    });

    return leavesByMonth;
};

// UPDATED: Shorter status text to prevent overflow
const formatStatus = (status, approvals = []) => {
    const hrApproved = approvals.some(app => app.role === 'hr' && app.status === 'approved');
    const deptHeadApproved = approvals.some(app => app.role === 'dept_head' && app.status === 'approved');
    const adminApproved = approvals.some(app => app.role === 'admin' && app.status === 'approved');
    
    if (adminApproved) {
        return ' Approved';
    }
    
    switch (status) {
        case 'approved':
            return 'Approved';
        case 'pending':
            return hrApproved ? ' Pending Dept' : ' Pending HR';
        case 'pending_dept_head':
            return ' Pending Dept';
        case 'pending_admin':
            return ' Pending Admin';
        case 'rejected':
            return ' Rejected';
        default:
            return status.charAt(0).toUpperCase() + status.slice(1);
    }
};

const calculateStatusBreakdown = (leaveReportsData) => {
    const breakdown = {
        approved: 0,
        pending_hr: 0,
        pending_dept_head: 0,
        pending_admin: 0,
        rejected: 0
    };

    leaveReportsData.forEach(employee => {
        const leaveRequests = Array.isArray(employee.leave_requests) ? employee.leave_requests : [];
        leaveRequests.forEach(leave => {
            switch (leave.status) {
                case 'approved':
                    breakdown.approved++;
                    break;
                case 'pending':
                    breakdown.pending_hr++;
                    break;
                case 'pending_dept_head':
                    breakdown.pending_dept_head++;
                    break;
                case 'pending_admin':
                    breakdown.pending_admin++;
                    break;
                case 'rejected':
                    breakdown.rejected++;
                    break;
            }
        });
    });

    return breakdown;
};

const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
};