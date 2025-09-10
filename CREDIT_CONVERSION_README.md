# Leave Credit to Cash Conversion System

## Overview
This system allows employees to convert their unused leave credits to cash equivalent based on their monthly salary. The system enforces business rules and requires HR approval for all conversion requests.

## Business Rules

### Eligibility Requirements
- **Minimum Balance**: Employee must have at least 15 days of leave credits to monetize
- **Annual Quota**: Maximum of 10 days can be monetized per year
- **Leave Types**: Supports Sick Leave (SL) and Vacation Leave (VL)

### Calculation Formula
```
Cash Equivalent = (Monthly Salary ÷ 22) × Number of Days
```
- Assumes 22 working days per month
- Based on employee's current monthly salary

### Process Flow
1. **Employee Request**: Employee submits conversion request with desired days and leave type
2. **System Validation**: System checks eligibility and available balance
3. **HR Review**: HR reviews the request and can approve or reject
4. **Approval**: Upon approval, leave credits are deducted and cash equivalent is calculated
5. **Rejection**: If rejected, employee receives reason and no credits are deducted

## Features

### Employee Features
- **Request Form**: Submit new conversion requests
- **Eligibility Check**: Real-time validation of conversion eligibility
- **History View**: Track all conversion requests and their status
- **Statistics**: View annual conversion statistics and remaining quota

### HR Features
- **Request Management**: View and manage all conversion requests
- **Approval/Rejection**: Approve or reject requests with remarks
- **Employee Information**: View employee details and leave balances
- **Filtering**: Search and filter requests by status and employee

## Technical Implementation

### Database Tables
- `credit_conversions`: Stores conversion requests and their status
- `leave_balances`: Tracks employee leave credit balances
- `leave_credits`: Alternative leave credit tracking
- `employees`: Employee information including monthly salary

### Key Models
- `CreditConversion`: Main model for conversion requests
- `CreditConversionService`: Business logic service
- `Employee`: Employee information and relationships
- `LeaveBalance`: Leave credit balance tracking

### Controllers
- `EmployeeController`: Employee-facing conversion methods
- `HRController`: HR management methods

### Routes
```
Employee Routes:
- GET /employee/credit-conversion - Request form
- POST /employee/credit-conversion - Submit request
- GET /employee/credit-conversions - View history

HR Routes:
- GET /hr/credit-conversions - Manage requests
- GET /hr/credit-conversions/{id} - View details
- POST /hr/credit-conversions/{id}/approve - Approve request
- POST /hr/credit-conversions/{id}/reject - Reject request
```

## Usage Examples

### Employee Submitting Request
1. Navigate to Employee Dashboard → Credit Conversion
2. Select leave type (SL or VL)
3. Enter number of days to convert
4. Add optional remarks
5. Submit request

### HR Approving Request
1. Navigate to HR Dashboard → Credit Conversions
2. View pending requests
3. Click on specific request to view details
4. Click "Approve Request" or "Reject Request"
5. Add optional remarks
6. Confirm action

## Security Features
- Role-based access control (Employee vs HR)
- Input validation and sanitization
- Database transaction safety for credit deductions
- Audit trail of all approvals/rejections

## Error Handling
- Insufficient leave credits
- Exceeded annual quota
- Invalid leave type selection
- Database constraint violations

## Future Enhancements
- Email notifications for status changes
- Bulk approval/rejection
- Advanced reporting and analytics
- Integration with payroll systems
- Mobile app support

## Testing
To test the system:
1. Ensure database migrations are run
2. Create test employees with sufficient leave credits
3. Submit conversion requests as employee
4. Approve/reject requests as HR
5. Verify leave credit deductions
6. Check conversion history

## Support
For technical support or questions about the credit conversion system, please contact the development team.
