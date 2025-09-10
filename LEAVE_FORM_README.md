# Leave Form React Components

This document explains how to use the React-based leave form components that convert your HTML leave form into dynamic, data-driven components for your HR system.

## 🚀 Features

- **Dynamic Data Population**: Automatically fills form fields based on leave request data
- **Print-Ready**: Optimized CSS for printing with professional layout
- **Multiple Leave Types**: Supports all standard leave types (VL, SL, ML, PL, etc.)
- **Smart Calculations**: Automatically calculates working days and leave credit impacts
- **Approver Integration**: Displays approver names from the leave_approvals table
- **Responsive Design**: Works on all device sizes
- **Customizable**: Easy to modify leave type mappings and styling

## 📁 Components

### 1. LeaveForm.jsx (Basic Version)
- Simple, straightforward implementation
- Good for basic use cases
- Easy to customize

### 2. LeaveFormAdvanced.jsx (Advanced Version)
- Enhanced functionality with memoized calculations
- Better performance for complex forms
- More intelligent leave type detection
- Working days calculation excludes weekends
- Dynamic leave credit impact calculations

## 🎯 Quick Start

### Basic Usage

```jsx
import LeaveForm from '@/Components/LeaveForm';

<LeaveForm 
    leaveRequest={leaveRequestData}
    employee={employeeData}
    approvers={approversData}
/>
```

### Advanced Usage

```jsx
import LeaveFormAdvanced from '@/Components/LeaveFormAdvanced';

<LeaveFormAdvanced 
    leaveRequest={leaveRequestData}
    employee={employeeData}
    approvers={approversData}
    leaveTypeMapping={customLeaveTypes}
/>
```

## 📊 Required Data Structure

### leaveRequest Object
```javascript
{
    id: 1,
    leave_type: 'VL', // Leave type code
    start_date: '2024-01-15',
    end_date: '2024-01-19',
    created_at: '2024-01-10',
    status: 'approved',
    reason: 'Personal vacation', // Optional
    remarks: 'Additional notes' // Optional
}
```

### employee Object
```javascript
{
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
}
```

### approvers Array
```javascript
[
    {
        name: 'Maria Santos, HRMO IV',
        role: 'HRMO-Designate'
    },
    {
        name: 'Pedro Martinez, Department Head',
        role: 'Department Head'
    },
    {
        name: 'Ana Rodriguez, Municipal Vice Mayor',
        role: 'Municipal Vice Mayor'
    }
]
```

## 🎨 Leave Type Mapping

### Default Leave Types
```javascript
{
    'VL': 'Vacation Leave',
    'SL': 'Sick Leave',
    'ML': 'Maternity Leave',
    'PL': 'Paternity Leave',
    'SPL': 'Special Privilege Leave',
    'SPL_W': 'Solo Parent Leave',
    'STL': 'Study Leave',
    'VAWC': '10-Day VAWC Leave',
    'RP': 'Rehabilitation Privilege',
    'SLW': 'Special Leave for Women',
    'AL': 'Adoption Leave',
    'MFL': 'Mandatory/Forced Leave',
    'BL': 'Birthday Leave',
    'CL': 'Calamity Leave',
    'SLB': 'Special Leave Benefits'
}
```

### Custom Leave Type Mapping
```jsx
const customLeaveTypes = {
    'CUSTOM_VL': 'Custom Vacation Leave',
    'EXTENDED_SL': 'Extended Sick Leave',
    // Add your custom types here
};

<LeaveFormAdvanced 
    leaveRequest={leaveRequest}
    employee={employee}
    approvers={approvers}
    leaveTypeMapping={customLeaveTypes}
/>
```

## 🔧 Integration with HR System

### 1. In Your HR Leave Requests Page

```jsx
import React, { useState } from 'react';
import LeaveForm from '@/Components/LeaveForm';

export default function HRLeaveRequests({ leaveRequests, employees, approvers }) {
    const [selectedRequest, setSelectedRequest] = useState(null);

    const handleGenerateForm = (request) => {
        setSelectedRequest(request);
    };

    return (
        <div>
            {/* Your existing leave requests table */}
            <table>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Leave Type</th>
                        <th>Dates</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {leaveRequests.map(request => (
                        <tr key={request.id}>
                            <td>{request.employee_name}</td>
                            <td>{request.leave_type}</td>
                            <td>{request.start_date} - {request.end_date}</td>
                            <td>{request.status}</td>
                            <td>
                                {request.status === 'approved' && (
                                    <button 
                                        onClick={() => handleGenerateForm(request)}
                                        className="btn btn-primary"
                                    >
                                        Generate Form
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Leave Form Modal/Display */}
            {selectedRequest && (
                <div className="modal">
                    <div className="modal-content">
                        <LeaveForm 
                            leaveRequest={selectedRequest}
                            employee={employees.find(emp => emp.id === selectedRequest.employee_id)}
                            approvers={approvers.filter(ap => ap.leave_request_id === selectedRequest.id)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
```

### 2. Direct Integration in Existing Components

```jsx
// In your existing leave request detail component
import LeaveForm from '@/Components/LeaveForm';

export default function LeaveRequestDetail({ request, employee, approvers }) {
    return (
        <div>
            {/* Existing request details */}
            <div className="request-info">
                <h2>Leave Request Details</h2>
                {/* ... existing content ... */}
            </div>

            {/* Generate Form Button */}
            {request.status === 'approved' && (
                <div className="form-section">
                    <h3>Generate Official Form</h3>
                    <LeaveForm 
                        leaveRequest={request}
                        employee={employee}
                        approvers={approvers}
                    />
                </div>
            )}
        </div>
    );
}
```

## 🖨️ Printing Features

### Print Button
- Each form includes a print button
- Automatically hides print controls when printing
- Optimized layout for A4 paper

### Print CSS
- Removes shadows and borders for clean printing
- Adjusts margins and padding for paper format
- Hides interactive elements

### Print Preview
```javascript
// Programmatically trigger print
const handlePrint = () => {
    window.print();
};

// Or use the built-in print button
<button onClick={handlePrint}>Print Form</button>
```

## 🎨 Customization

### Styling
All styles are included using CSS-in-JS with the `styled-jsx` approach. You can:

1. **Modify existing styles** by editing the `<style jsx>` section
2. **Add custom CSS classes** to your global stylesheet
3. **Override specific styles** using CSS specificity

### Layout Adjustments
```jsx
// Modify form dimensions
.leave-form-page {
    width: 816px;        // A4 width in pixels
    min-height: 1056px;  // A4 height in pixels
    padding: 40px;       // Form margins
}
```

### Font and Typography
```jsx
// Change font family
.leave-form-container {
    font-family: 'Times New Roman', serif; // For more formal look
}

// Adjust font sizes
.form-title {
    font-size: 16px; // Larger title
}
```

## 📱 Responsive Design

### Mobile Optimization
- Forms are designed for A4 printing but work on mobile
- Print button is always visible
- Content scales appropriately

### Tablet Support
- Forms display properly on tablet devices
- Touch-friendly print button
- Optimized spacing for medium screens

## 🧪 Testing

### Demo Page
Use the included `LeaveFormDemo.jsx` page to test:

1. **Different leave types** - Switch between VL, SL, ML
2. **Date calculations** - Verify working days calculation
3. **Print functionality** - Test print layout
4. **Data population** - Verify all fields are filled correctly

### Sample Data
The demo includes realistic sample data for testing:
- Multiple leave request types
- Sample employee information
- Sample approver data

## 🚨 Troubleshooting

### Common Issues

#### 1. Form Not Displaying
- Check if all required props are passed
- Verify data structure matches expected format
- Check browser console for errors

#### 2. Print Not Working
- Ensure print button is visible
- Check browser print settings
- Verify no CSS conflicts

#### 3. Data Not Populating
- Verify leave request data structure
- Check employee object properties
- Ensure approvers array is properly formatted

#### 4. Styling Issues
- Check for CSS conflicts with your existing styles
- Verify Tailwind CSS is properly loaded
- Check browser developer tools for style overrides

### Debug Mode
```jsx
// Add console logs to debug data
console.log('Leave Request:', leaveRequest);
console.log('Employee:', employee);
console.log('Approvers:', approvers);
```

## 🔮 Future Enhancements

### Planned Features
- [ ] PDF export functionality
- [ ] Digital signature integration
- [ ] Form validation
- [ ] Multi-language support
- [ ] Template customization system

### Customization Ideas
- [ ] Brand-specific styling
- [ ] Department-specific forms
- [ ] Leave type-specific layouts
- [ ] Automated form generation
- [ ] Bulk form processing

## 📚 Resources

### Related Files
- `LeaveForm.jsx` - Basic leave form component
- `LeaveFormAdvanced.jsx` - Advanced leave form component
- `LeaveFormDemo.jsx` - Demo page for testing
- `transitions.css` - Page transition animations

### Dependencies
- React 18+
- Tailwind CSS (for demo page styling)
- styled-jsx (for component styling)

## 🤝 Contributing

### Adding New Features
1. Create a new branch for your feature
2. Implement the feature following existing patterns
3. Add appropriate tests and documentation
4. Submit a pull request

### Reporting Issues
1. Check the troubleshooting section
2. Provide reproduction steps
3. Include browser and device information
4. Share relevant code snippets

---

**Note**: These components are designed to work seamlessly with your existing Laravel + React Inertia setup. They automatically integrate with your page transition system and follow your established design patterns.
