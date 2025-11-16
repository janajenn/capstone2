// resources/js/Utils/pdfGenerator.js
import jsPDF from 'jspdf';

export const generateEmployeePDF = (employees, departments, selectedDepartment, searchTerm) => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Employee List', 20, 20);
    
    // Date and filters
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    
    let filtersText = 'All Employees';
    if (selectedDepartment && searchTerm) {
        const deptName = departments.find(d => d.id == selectedDepartment)?.name;
        filtersText = `Department: ${deptName}, Search: "${searchTerm}"`;
    } else if (selectedDepartment) {
        const deptName = departments.find(d => d.id == selectedDepartment)?.name;
        filtersText = `Department: ${deptName}`;
    } else if (searchTerm) {
        filtersText = `Search: "${searchTerm}"`;
    }
    doc.text(filtersText, 20, 35);
    
    // Simple table implementation - using Contact Number instead of Email
    const headers = ['Name', 'Position', 'Department', 'Status', 'Contact Number'];
    let yPosition = 50;
    
    // Table headers
    doc.setFillColor(79, 70, 229);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, yPosition, 170, 10, 'F');
    doc.text(headers[0], 22, yPosition + 7);
    doc.text(headers[1], 60, yPosition + 7);
    doc.text(headers[2], 100, yPosition + 7);
    doc.text(headers[3], 140, yPosition + 7);
    doc.text(headers[4], 160, yPosition + 7);
    
    yPosition += 10;
    
    // Table rows
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    
    const sortedEmployeesForPDF = employees.data ? [...employees.data].sort((a, b) => {
        const nameA = `${a.firstname} ${a.lastname}`.toLowerCase();
        const nameB = `${b.firstname} ${b.lastname}`.toLowerCase();
        return nameA.localeCompare(nameB);
    }) : [];
    
    sortedEmployeesForPDF.forEach((emp, index) => {
        if (yPosition > 280) { // New page if near bottom
            doc.addPage();
            yPosition = 20;
        }
        
        // Alternate row colors
        if (index % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(20, yPosition, 170, 8, 'F');
        }
        
        doc.text(`${emp.firstname} ${emp.lastname}`, 22, yPosition + 6);
        doc.text(emp.position || 'N/A', 60, yPosition + 6);
        doc.text(emp.department?.name || 'N/A', 100, yPosition + 6);
        doc.text(emp.status || 'N/A', 140, yPosition + 6);
        doc.text(emp.contact_number || 'N/A', 160, yPosition + 6);
        
        yPosition += 8;
    });
    
    // Save the PDF
    const fileName = `employee-list-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};