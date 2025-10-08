# Attendance Import System

This system allows HR personnel to import attendance data from Excel files into the attendance_logs table.

## How It Works

1. **Excel File Processing**: The system reads Excel files containing attendance data
2. **Biometric Code Matching**: Each row's biometric code is matched to an employee in the database
3. **Data Processing**: The system calculates derived fields like late minutes, hours worked, and remarks
4. **Database Storage**: All processed data is stored in the `attendance_logs` table

## Excel File Format

The system is designed to work with HRMO DTR (Daily Time Record) Excel files. The expected format is:

| Column | Field | Description | Example |
|--------|-------|-------------|---------|
| A | Date | Work date with day | 08/01/2025 Fri |
| B | Schedule | Scheduled work hours | 8:00 AM - 5:00 PM |
| C | Remarks | Day type or status | RESTDAY |
| D | Absent | Absent flag (1 or 0) | 0 |
| E | Time IN | Actual time in | 7:50 AM |
| F | Breaks | Break times | 12:15 PM - 12:53 PM |
| G | Time Out | Actual time out | 8/4/2025 6:02 PM |
| H | Hrs Work | Hours worked | 8 hrs |
| I | Late | Late minutes | 1 mins |

### Employee Information
The Excel file should contain employee information with biometric code in the format:
- Employee Name (Biometric Code) - e.g., "Actub, Joseph A. (22)"

## Database Schema

The `attendance_logs` table contains:

- `employee_id`: Links to the employees table
- `work_date`: Date of attendance
- `schedule_start/end`: Scheduled work hours
- `time_in/out`: Actual attendance times
- `break_start/end`: Break times (optional)
- `hrs_worked_minutes`: Calculated hours worked
- `late_minutes`: Calculated late minutes
- `remarks`: Auto-generated status (On Time, Late, Absent, etc.)
- `absent`: Boolean flag for absent employees
- `raw_row`: Original Excel row data (JSON)

## Usage

### 1. Access the Import Interface
- Navigate to `/hr/attendance/import`
- Only HR users can access this feature

### 2. Download Template
- Click "Download Template" to get a sample Excel file
- Use this template as a reference for your data format

### 3. Prepare Your Data
- Ensure biometric codes match existing employees
- Use proper date/time formats
- Include all required columns

### 4. Import Data
- Upload your Excel file
- Choose whether to overwrite existing records
- Click "Import Attendance Data"

### 5. Review Results
- The system will show success/error counts
- Review any errors and fix your data if needed
- Successfully imported records will be available in the attendance logs

## Viewing Attendance Logs

### Access Logs
- Navigate to `/hr/attendance/logs`
- View all imported attendance records
- Filter by date range, employee, or status

### Filtering Options
- **Date Range**: Filter by start and end dates
- **Employee**: Filter by specific employee
- **Status**: Filter by On Time, Late, or Absent

### Bulk Operations
- Select multiple records for bulk deletion
- Use checkboxes to select individual or all records

## Data Processing Logic

### Late Minutes Calculation
- If actual time in > scheduled start time
- Late minutes = actual time in - scheduled start time

### Hours Worked Calculation
- Total time = time out - time in
- Subtract break time if provided
- Result stored in minutes

### Remarks Generation
- **Absent**: No time in and no time out
- **No Time In**: Missing time in but has time out
- **No Time Out**: Has time in but missing time out
- **Late**: Time in is after scheduled start
- **On Time**: Time in is on or before scheduled start

### Absent Flag
- Set to true if both time in and time out are missing

## Error Handling

The system handles various error scenarios:

1. **Invalid Biometric Code**: Employee not found in database
2. **Invalid Date Format**: Cannot parse work date
3. **Invalid Time Format**: Cannot parse time fields
4. **Duplicate Records**: Same employee and date combination
5. **File Format Issues**: Unsupported file types or corrupted files

## Best Practices

1. **Data Validation**: Ensure biometric codes exist in the system
2. **Date Formats**: Use consistent date formats (YYYY-MM-DD)
3. **Time Formats**: Use 24-hour time format (HH:MM)
4. **Backup**: Always backup existing data before bulk imports
5. **Testing**: Test with small datasets before large imports

## Troubleshooting

### Common Issues

1. **"Employee with biometric code X not found"**
   - Check if the biometric code exists in the employees table
   - Ensure the biometric_id field is properly set

2. **"Invalid work date format"**
   - Use YYYY-MM-DD format for dates
   - Avoid ambiguous date formats

3. **"Attendance record already exists"**
   - Enable "Overwrite existing records" option
   - Or delete existing records first

4. **Import fails with file error**
   - Ensure file is in supported format (.xlsx, .xls, .csv)
   - Check file size (max 10MB)
   - Verify file is not corrupted

### File Size Limits
- Maximum file size: 10MB
- Supported formats: .xlsx, .xls, .csv
- Recommended: Use .xlsx for best compatibility

## API Endpoints

- `GET /hr/attendance/import` - Import interface
- `POST /hr/attendance/import` - Process import
- `GET /hr/attendance/template` - Download template
- `GET /hr/attendance/logs` - View attendance logs
- `GET /hr/attendance/logs/api` - API for logs (with filters)
- `DELETE /hr/attendance/logs/{id}` - Delete single log
- `POST /hr/attendance/logs/bulk-delete` - Bulk delete logs

## Security

- Only HR users can access import functionality
- File uploads are validated for type and size
- Temporary files are automatically cleaned up
- CSRF protection on all form submissions
