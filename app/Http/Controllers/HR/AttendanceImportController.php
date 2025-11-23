<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Services\AttendanceImportService;
use App\Services\LeaveCreditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use App\Models\AttendanceCorrection;

class AttendanceImportController extends Controller
{
    protected $importService;

    public function __construct(AttendanceImportService $importService)
    {
        $this->importService = $importService;
    }




    /**
     * Show the attendance import page
     */
    public function index()
    {
        return Inertia::render('HR/AttendanceImport');
    }

    /**
     * Handle attendance import from Excel file
     */
    public function import(Request $request)
    {
        // Log the request for debugging
        \Log::info('Attendance import request', [
            'has_file' => $request->hasFile('file'),
            'all_files' => $request->allFiles(),
            'all_input' => $request->all(),
            'content_type' => $request->header('Content-Type')
        ]);
    
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // 10MB max
            'overwrite' => 'boolean'
        ], [
            'file.required' => 'Please select a file to upload.',
            'file.file' => 'The uploaded file is not valid.',
            'file.max' => 'The file may not be greater than 10MB.'
        ]);
    
        // Custom validation for file extension
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());
            $allowedExtensions = ['xlsx', 'xls', 'csv'];
            
            if (!in_array($extension, $allowedExtensions)) {
                $validator->errors()->add('file', 'The file must be a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
            }
        }
    
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
                'debug' => [
                    'has_file' => $request->hasFile('file'),
                    'file_size' => $request->hasFile('file') ? $request->file('file')->getSize() : 'no file',
                    'file_mime' => $request->hasFile('file') ? $request->file('file')->getMimeType() : 'no file',
                    'overwrite' => $request->input('overwrite'),
                    'all_input' => $request->all(),
                    'content_type' => $request->header('Content-Type'),
                    'method' => $request->method()
                ]
            ], 422);
        }
    
        try {
            $file = $request->file('file');
            $overwrite = $request->boolean('overwrite', false);
    
            // Store and process file
            $filePath = $file->store('temp/attendance-imports');
            $fullPath = storage_path('app/' . $filePath);
    
            // Process the import
            $result = $this->importService->importFromExcel($fullPath, [
                'overwrite' => $overwrite
            ]);
    
            // Clean up temporary file
            Storage::delete($filePath);
    
            if ($result['success']) {
                if ($result['success_count'] === 0) {
                    \Log::warning('Import completed but 0 records were imported', $result);
                    
                    // FIX: Use Inertia redirect with data
                    return redirect()->back()->with([
                        'warning' => 'No records were imported. This could be because:',
                        'importResult' => $result,
                        'reasons' => [
                            'The file format may not match the expected template',
                            'All records in the file may already exist in the system',
                            'The file may contain invalid or duplicate data',
                            'No valid employee records were found in the file'
                        ]
                    ]);
                }
    
                // ✅ CRITICAL: Process late credits IMMEDIATELY after successful import
                $leaveCreditService = new LeaveCreditService();
                $lateCreditResult = $leaveCreditService->processLateCreditsForRecentImports();
                
                \Log::info("✅ Automatic late credit processing completed", $lateCreditResult);
    
                 // FIX: Use Inertia redirect with data
            return redirect()->back()->with([
                'success' => "Successfully imported {$result['success_count']} records. " . 
                           "Processed late credits for {$lateCreditResult['processed_count']} employees.",
                'importResult' => $result,
                'lateCreditResult' => $lateCreditResult
            ]);
        } else {
            // FIX: Use Inertia redirect with error
            return redirect()->back()->with([
                'error' => 'Import failed: ' . ($result['message'] ?? 'Unknown error occurred'),
                'importResult' => $result
            ]);
        }

    } catch (\Exception $e) {
        // FIX: Use Inertia redirect with error
        return redirect()->back()->with([
            'error' => 'Import failed: ' . $e->getMessage()
        ]);
    }
}

    /**
     * Get attendance import template
     */
    public function downloadTemplate()
    {
        $templateData = [
            ['Employee Name', 'Biometric Code', 'Work Date', 'Schedule Start', 'Schedule End', 'Time In', 'Time Out', 'Break Start', 'Break End'],
            ['John Doe', '22', '2024-01-15', '08:00', '17:00', '2024-01-15 08:05', '2024-01-15 17:00', '12:00', '13:00'],
            ['Jane Smith', '23', '2024-01-15', '08:00', '17:00', '2024-01-15 07:55', '2024-01-15 17:05', '12:00', '13:00']
        ];

        $filename = 'attendance_import_template.csv';
        $filepath = storage_path('app/temp/' . $filename);

        // Create directory if it doesn't exist
        if (!file_exists(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }

        $file = fopen($filepath, 'w');
        
        foreach ($templateData as $row) {
            fputcsv($file, $row);
        }
        
        fclose($file);

        return response()->download($filepath, $filename)->deleteFileAfterSend(true);
    }

    /**
     * Show HR attendance logs index page
     */
    public function attendanceLogs()
    {
        $employees = \App\Models\Employee::with('department')
            ->whereHas('attendanceLogs')
            ->orderBy('firstname')
            ->orderBy('lastname')
            ->get()
            ->map(function($employee) {
                $logs = $employee->attendanceLogs;
                return [
                    'employee_id' => $employee->employee_id,
                    'firstname' => $employee->firstname,
                    'lastname' => $employee->lastname,
                    'department' => $employee->department->name ?? 'No Department',
                    'biometric_id' => $employee->biometric_id,
                    'total_logs' => $logs->count(),
                    'working_days' => $logs->where('absent', false)->count(),
                    'absent_days' => $logs->where('absent', true)->count(),
                    'total_hours' => round($logs->sum('hrs_worked_minutes') / 60, 2),
                    'latest_log_date' => $logs->max('work_date'),
                    'earliest_log_date' => $logs->min('work_date')
                ];
            });
    
        // FIX: Make sure this path matches your actual file structure
        return \Inertia\Inertia::render('HR/AttendanceLogs', [
            'initialLogs' => $employees,
            'employees' => \App\Models\Employee::select('employee_id', 'firstname', 'lastname')->get()
        ]);
    }

    /**
     * Get attendance logs with pagination
     */
   /**
 * Get attendance logs with advanced filtering
 */
public function getAttendanceLogs(Request $request)
{
    // Get unique employees who have attendance logs
    $query = \App\Models\Employee::with('department')
        ->whereHas('attendanceLogs')
        ->orderBy('firstname')
        ->orderBy('lastname');

    // Filter by department if specified
    if ($request->filled('department_id')) {
        $query->where('department_id', $request->department_id);
    }

    // Filter by employee name if specified
    if ($request->filled('employee_name')) {
        $query->where(function($q) use ($request) {
            $q->where('firstname', 'like', '%' . $request->employee_name . '%')
              ->orWhere('lastname', 'like', '%' . $request->employee_name . '%');
        });
    }

    $employees = $query->get();

    // Add attendance summary for each employee with advanced metrics
    $employeesWithSummary = $employees->map(function($employee) use ($request) {
        $logsQuery = $employee->attendanceLogs();
        
        // Apply date filters if provided
        if ($request->filled('start_date')) {
            $logsQuery->where('work_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $logsQuery->where('work_date', '<=', $request->end_date);
        }

        $logs = $logsQuery->get();
        
        // Calculate advanced metrics
        $lateCount = $logs->where('late_minutes', '>', 0)->count();
        
        // Check for missing time in/out
        $hasMissingTimeIn = $logs->where('time_in', null)->where('time_out', '!=', null)->count() > 0;
        $hasMissingTimeOut = $logs->where('time_out', null)->where('time_in', '!=', null)->count() > 0;
        
        $totalHours = round($logs->sum('hrs_worked_minutes') / 60, 2);
        
        return [
            'employee_id' => $employee->employee_id,
            'firstname' => $employee->firstname,
            'lastname' => $employee->lastname,
            'department' => $employee->department->name ?? 'No Department',
            'biometric_id' => $employee->biometric_id,
            'total_logs' => $logs->count(),
            'working_days' => $logs->where('absent', false)->count(),
            'absent_days' => $logs->where('absent', true)->count(),
            'total_hours' => $totalHours,
            'late_count' => $lateCount,
            'has_missing_time_in' => $hasMissingTimeIn,
            'has_missing_time_out' => $hasMissingTimeOut,
            'latest_log_date' => $logs->max('work_date'),
            'earliest_log_date' => $logs->min('work_date')
        ];
    });

    // Apply advanced filtering based on attendance issues
    if ($request->filled('attendance_issue')) {
        $employeesWithSummary = $employeesWithSummary->filter(function($employee) use ($request) {
            switch ($request->attendance_issue) {
                case 'late':
                    return $employee['late_count'] > 0;
                    
                case 'missing_time_out':
                    return $employee['has_missing_time_out'];
                    
                case 'missing_time_in':
                    return $employee['has_missing_time_in'];
                    
                case 'multiple_lates':
                    $threshold = $request->filled('late_threshold') ? $request->late_threshold : 10;
                    return $employee['late_count'] >= $threshold;
                    
                case 'insufficient_hours':
                    $threshold = $request->filled('hours_threshold') ? $request->hours_threshold : 8;
                    return $employee['total_hours'] < $threshold;
                    
                default:
                    return true;
            }
        })->values();
    }

    return response()->json([
        'data' => $employeesWithSummary,
        'total' => $employeesWithSummary->count()
    ]);
}

    /**
     * View individual employee attendance logs
     */
    /**
 * View individual employee attendance logs with advanced filtering
 */
/**
 * View individual employee attendance logs with advanced filtering - FIXED
 */
/**
 * View individual employee attendance logs with correction data
 */
public function viewEmployeeLogs($employeeId, Request $request)
{
    $employee = \App\Models\Employee::with('department')->findOrFail($employeeId);
    
    // Get query parameters for filtering
    $month = $request->get('month', \Carbon\Carbon::now()->format('Y-m'));
    $period = $request->get('period', 'full');
    $startDate = $request->get('start_date');
    $endDate = $request->get('end_date');
    
    // Advanced filtering parameters
    $attendanceIssue = $request->get('attendance_issue');
    $lateThreshold = $request->get('late_threshold', 10);
    $hoursThreshold = $request->get('hours_threshold', 8);
    
    // If custom date range is provided, use it instead of month/period
    if ($startDate && $endDate) {
        $startDate = \Carbon\Carbon::parse($startDate)->startOfDay();
        $endDate = \Carbon\Carbon::parse($endDate)->endOfDay();
    } else {
        // Parse month and year (existing logic)
        $startDate = \Carbon\Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();
        
        // Adjust date range based on period filter
        if ($period === 'first_half') {
            $endDate = $startDate->copy()->addDays(14); // 1-15
        } elseif ($period === 'second_half') {
            $startDate = $startDate->copy()->addDays(15); // 16-end
        }
    }

    // Get ALL attendance logs for the employee
    $allAttendanceLogs = \App\Models\AttendanceLog::where('employee_id', $employeeId)
        ->orderBy('work_date', 'desc')
        ->get();

    // Get correction requests for this employee
    $correctionRequests = \App\Models\AttendanceCorrection::with(['employee', 'department', 'reviewer'])
        ->where('employee_id', $employeeId)
        ->whereBetween('attendance_date', [$startDate, $endDate])
        ->get()
        ->keyBy(function($correction) {
            return $correction->attendance_date->format('Y-m-d');
        });

    // Generate all days in the selected period for complete view
    $allDaysInPeriod = collect();
    $currentDate = $startDate->copy();
    while ($currentDate <= $endDate) {
        $allDaysInPeriod->push($currentDate->copy());
        $currentDate->addDay();
    }

    
    
    // Create a complete view with all days, filling in missing days
    $completeAttendanceView = $allDaysInPeriod->map(function ($date) use ($allAttendanceLogs, $correctionRequests) {
        // Convert date to Carbon for proper comparison
        $dateString = $date->format('Y-m-d');
        
        $log = $allAttendanceLogs->first(function ($log) use ($dateString) {
            return $log->work_date->format('Y-m-d') === $dateString;
        });

        $correction = $correctionRequests->get($dateString);

        if ($log) {
            $logData = $this->formatLogData($log);
            
            // Add correction data if exists
            if ($correction) {
                $logData = array_merge($logData, [
                    'correction_status' => $correction->status,
                    'correction_request_id' => $correction->id,
                    'correction_explanation' => $correction->explanation,
                    'correction_proof_image' => $correction->proof_image,
                    'correction_remarks' => $correction->remarks,
                    'correction_employee_name' => $correction->employee ? 
                        $correction->employee->firstname . ' ' . $correction->employee->lastname : 
                        'Unknown Employee',
                    'correction_department' => $correction->department ? $correction->department->name : 'No Department',
                    'correction_reviewed_by' => $correction->reviewer ? $correction->reviewer->name : null,
                    'correction_reviewed_at' => $correction->reviewed_at ? 
                        $correction->reviewed_at->format('M d, Y g:i A') : null,
                ]);
            }

            return [
                'date' => $dateString,
                'date_formatted' => $date->format('M d, Y'),
                'day_of_week' => $date->format('l'),
                'has_log' => true,
                'log_data' => $logData
            ];
        } else {
            // No log for this day - determine if it's a rest day or absent
            $isWeekend = $date->isWeekend();
            $isRestDay = $isWeekend; // You can add more logic here for holidays, etc.
            
            $dayData = [
                'date' => $dateString,
                'date_formatted' => $date->format('M d, Y'),
                'day_of_week' => $date->format('l'),
                'has_log' => false,
                'status' => $isRestDay ? 'Rest Day' : 'Absent',
                'log_data' => null
            ];

            // Add correction data if exists for days without logs
            if ($correction) {
                $dayData['has_log'] = true; // Force has_log to true to show correction
                $dayData['log_data'] = [
                    'correction_status' => $correction->status,
                    'correction_request_id' => $correction->id,
                    'correction_explanation' => $correction->explanation,
                    'correction_proof_image' => $correction->proof_image,
                    'correction_remarks' => $correction->remarks,
                    'correction_employee_name' => $correction->employee ? 
                        $correction->employee->firstname . ' ' . $correction->employee->lastname : 
                        'Unknown Employee',
                    'correction_department' => $correction->department ? $correction->department->name : 'No Department',
                    'status' => 'Correction Request',
                    'time_in' => 'N/A',
                    'time_out' => 'N/A',
                    'schedule_formatted' => 'N/A',
                    'hrs_worked_formatted' => 'N/A',
                    'remarks' => 'Correction Request Pending'
                ];
            }

            return $dayData;
        }
    });

    // Apply advanced filtering based on attendance issues
    $filteredAttendanceLogs = $completeAttendanceView;

    if ($attendanceIssue) {
        $filteredAttendanceLogs = $filteredAttendanceLogs->filter(function ($day) use ($attendanceIssue, $lateThreshold, $hoursThreshold) {
            // Skip days without logs for most filters (except absent)
            if (!$day['has_log'] || !$day['log_data']) {
                // For absent filter, include days marked as absent
                if ($attendanceIssue === 'absent' && isset($day['status']) && $day['status'] === 'Absent') {
                    return true;
                }
                return false;
            }

            $logData = $day['log_data'];

            switch ($attendanceIssue) {
                case 'late':
                    return $logData['late_minutes'] > 0;
                    
                case 'missing_time_out':
                    // Check if time_out is missing/null/empty but time_in exists
                    $hasTimeIn = !empty($logData['time_in']) && $logData['time_in'] !== 'No time in';
                    $hasTimeOut = !empty($logData['time_out']) && $logData['time_out'] !== 'No time out';
                    return $hasTimeIn && !$hasTimeOut;
                    
                case 'missing_time_in':
                    // Check if time_in is missing/null/empty but time_out exists
                    $hasTimeIn = !empty($logData['time_in']) && $logData['time_in'] !== 'No time in';
                    $hasTimeOut = !empty($logData['time_out']) && $logData['time_out'] !== 'No time out';
                    return !$hasTimeIn && $hasTimeOut;
                    
                case 'absent':
                    return $logData['absent'] === true;
                    
                case 'insufficient_hours':
                    // Convert hours worked to decimal hours for comparison
                    $hoursWorked = $logData['hrs_worked_minutes'] / 60;
                    return $hoursWorked < $hoursThreshold;
                    
                default:
                    return true;
            }
        })->values();
    }

    // Calculate summary statistics based on FILTERED data
    $totalDays = $startDate->diffInDays($endDate) + 1;
    
    // Count working/absent days from filtered logs
    $workingDays = $filteredAttendanceLogs->filter(function($day) {
        return $day['has_log'] && $day['log_data'] && !$day['log_data']['absent'];
    })->count();
    
    $absentDays = $filteredAttendanceLogs->filter(function($day) {
        return ($day['has_log'] && $day['log_data'] && $day['log_data']['absent']) || 
               (!$day['has_log'] && isset($day['status']) && $day['status'] === 'Absent');
    })->count();
    
    $restDays = $totalDays - $workingDays - $absentDays;
    
    // Calculate hours and late minutes from filtered logs with actual data
    $totalHoursWorked = $filteredAttendanceLogs->sum(function($day) {
        if ($day['has_log'] && $day['log_data'] && isset($day['log_data']['hrs_worked_minutes'])) {
            return $day['log_data']['hrs_worked_minutes'] / 60;
        }
        return 0;
    });
    
    $totalLateMinutes = $filteredAttendanceLogs->sum(function($day) {
        if ($day['has_log'] && $day['log_data'] && isset($day['log_data']['late_minutes'])) {
            return $day['log_data']['late_minutes'];
        }
        return 0;
    });

    // Calculate filtered counts
    $lateCount = $filteredAttendanceLogs->filter(function($day) {
        return $day['has_log'] && $day['log_data'] && isset($day['log_data']['late_minutes']) && $day['log_data']['late_minutes'] > 0;
    })->count();

    $missingTimeInCount = $filteredAttendanceLogs->filter(function($day) {
        if (!$day['has_log'] || !$day['log_data']) return false;
        $logData = $day['log_data'];
        $hasTimeIn = !empty($logData['time_in']) && $logData['time_in'] !== 'No time in';
        $hasTimeOut = !empty($logData['time_out']) && $logData['time_out'] !== 'No time out';
        return !$hasTimeIn && $hasTimeOut;
    })->count();

    $missingTimeOutCount = $filteredAttendanceLogs->filter(function($day) {
        if (!$day['has_log'] || !$day['log_data']) return false;
        $logData = $day['log_data'];
        $hasTimeIn = !empty($logData['time_in']) && $logData['time_in'] !== 'No time in';
        $hasTimeOut = !empty($logData['time_out']) && $logData['time_out'] !== 'No time out';
        return $hasTimeIn && !$hasTimeOut;
    })->count();

    // Get correction statistics
    $correctionStats = [
        'reviewed' => \App\Models\AttendanceCorrection::where('status', 'Reviewed')->count(),
        'total' => \App\Models\AttendanceCorrection::count()
    ];

    // Get available months for dropdown from all logs
    $availableMonths = $allAttendanceLogs->map(function ($log) {
        return $log->work_date->format('Y-m');
    })->unique()->sort()->values();

    return \Inertia\Inertia::render('HR/EmployeeAttendanceLogs', [
        'employee' => [
            'employee_id' => $employee->employee_id,
            'firstname' => $employee->firstname,
            'lastname' => $employee->lastname,
            'department' => $employee->department->name ?? 'No Department',
            'biometric_id' => $employee->biometric_id
        ],
        'attendanceLogs' => $filteredAttendanceLogs->values(),
        'summary' => [
            'total_days' => $totalDays,
            'working_days' => $workingDays,
            'absent_days' => $absentDays,
            'rest_days' => $restDays,
            'total_hours_worked' => round($totalHoursWorked, 2),
            'total_late_minutes' => $totalLateMinutes,
            'average_hours_per_day' => $workingDays > 0 ? round($totalHoursWorked / $workingDays, 2) : 0,
            'filtered_count' => $filteredAttendanceLogs->count(),
            'late_count' => $lateCount,
            'missing_time_in_count' => $missingTimeInCount,
            'missing_time_out_count' => $missingTimeOutCount,
        ],
        'correctionStats' => $correctionStats,
        'filters' => [
            'month' => $month,
            'period' => $period,
            'available_months' => $availableMonths,
            'attendance_issue' => $attendanceIssue,
            'late_threshold' => $lateThreshold,
            'hours_threshold' => $hoursThreshold,
            'start_date' => $request->get('start_date'),
            'end_date' => $request->get('end_date'),
        ]
    ]);
}
    /**
     * Format log data for display
     */
   
    /**
     * Calculate late minutes based on schedule and time in
     */
    private function calculateLateMinutes($scheduleStart, $timeIn)
    {
        if (!$scheduleStart || !$timeIn) {
            return 0;
        }

        try {
            // Parse schedule start time - try different formats
            $scheduleTime = null;
            if (is_string($scheduleStart)) {
                // Try different time formats
                $formats = ['H:i:s', 'H:i', 'g:i A', 'G:i:s', 'G:i'];
                foreach ($formats as $format) {
                    try {
                        $scheduleTime = \Carbon\Carbon::createFromFormat($format, $scheduleStart);
                        break;
                    } catch (\Exception $e) {
                        continue;
                    }
                }
                
                // If no format worked, try Carbon's parse
                if (!$scheduleTime) {
                    $scheduleTime = \Carbon\Carbon::parse($scheduleStart);
                }
            } else {
                $scheduleTime = \Carbon\Carbon::parse($scheduleStart);
            }
            
            // Parse time in (full datetime)
            $timeInTime = \Carbon\Carbon::parse($timeIn);
            
            // Create time-only objects for comparison
            $scheduleTimeOnly = \Carbon\Carbon::createFromTime(
                $scheduleTime->hour, 
                $scheduleTime->minute, 
                $scheduleTime->second
            );
            
            $timeInTimeOnly = \Carbon\Carbon::createFromTime(
                $timeInTime->hour, 
                $timeInTime->minute, 
                $timeInTime->second
            );
            
            // Only calculate late minutes if time in is AFTER schedule start
            if ($timeInTimeOnly->greaterThan($scheduleTimeOnly)) {
                $lateMinutes = $timeInTimeOnly->diffInMinutes($scheduleTimeOnly);
                return $lateMinutes;
            }
            
            // If time in is before or equal to schedule start, no late minutes
            return 0;
            
        } catch (\Exception $e) {
            // If parsing fails, return 0 (no late minutes)
            \Log::error('Error calculating late minutes: ' . $e->getMessage(), [
                'schedule_start' => $scheduleStart,
                'time_in' => $timeIn
            ]);
            return 0;
        }
    }

    /**
     * Generate remarks with late minutes
     */
    private function generateRemarks($log)
    {
        if ($log->absent) {
            return 'Absent';
        }

        if (!$log->time_in && !$log->time_out) {
            return 'No Time Records';
        }

        $lateMinutes = $this->calculateLateMinutes($log->schedule_start, $log->time_in);
        
        if ($lateMinutes > 0) {
            return "Late by {$lateMinutes} minute" . ($lateMinutes > 1 ? 's' : '');
        }

        return 'On Time';
    }

    /**
     * Format minutes to hours:minutes
     */
    
    /**
     * Delete attendance log
     */
    public function deleteLog($id)
    {
        try {
            $log = \App\Models\AttendanceLog::findOrFail($id);
            $log->delete();

            return response()->json([
                'success' => true,
                'message' => 'Attendance log deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete attendance log: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk delete attendance logs
     */
    public function bulkDelete(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:attendance_logs,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $deletedCount = \App\Models\AttendanceLog::whereIn('id', $request->ids)->delete();

            return response()->json([
                'success' => true,
                'message' => "Successfully deleted {$deletedCount} attendance logs"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete attendance logs: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Preview attendance file before import
     */
   /**
 * Preview attendance file before import
 */
public function preview(Request $request)
{
    $validator = Validator::make($request->all(), [
        'file' => 'required|file|max:10240', // 10MB max
    ], [
        'file.required' => 'Please select a file to upload.',
        'file.file' => 'The uploaded file is not valid.',
        'file.max' => 'The file may not be greater than 10MB.'
    ]);

    // Custom validation for file extension
    if ($request->hasFile('file')) {
        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $allowedExtensions = ['xlsx', 'xls', 'csv'];
        
        if (!in_array($extension, $allowedExtensions)) {
            $validator->errors()->add('file', 'The file must be a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
        }
    }

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422);
    }

    try {
        $file = $request->file('file');
        
        // Store file temporarily for preview
        $filePath = $file->store('temp/attendance-previews');
        $fullPath = storage_path('app/' . $filePath);

        // Get preview data - FIXED: Use previewExcel instead of previewWithSimulation
        $previewResult = $this->importService->previewExcel($fullPath);

        // Clean up temporary file
        Storage::delete($filePath);

        return response()->json($previewResult);

    } catch (\Exception $e) {
        \Log::error('Preview failed: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Preview failed: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * Process the actual import after confirmation
     */
    public function processImport(Request $request)
    {
        // This is your existing import method, but renamed
        return $this->import($request);
    }



    private function formatLogData($log)
    {
        \Log::info("DEBUG Log Data for Break Time", [
            'log_id' => $log->id,
            'break_start' => $log->break_start,
            'break_end' => $log->break_end,
            'break_formatted' => $log->break_formatted,
            'has_break_start' => !empty($log->break_start),
            'has_break_end' => !empty($log->break_end),
        ]);
        
        // Format break times for display
        $breakStartFormatted = $log->break_start ? 
            \Carbon\Carbon::parse($log->break_start)->format('h:i A') : null;
        $breakEndFormatted = $log->break_end ? 
            \Carbon\Carbon::parse($log->break_end)->format('h:i A') : null;
        
        $breakFormatted = null;
        if ($breakStartFormatted && $breakEndFormatted) {
            $breakFormatted = "{$breakStartFormatted} - {$breakEndFormatted}";
        } elseif ($breakStartFormatted) {
            $breakFormatted = "Started {$breakStartFormatted}";
        } elseif ($breakEndFormatted) {
            $breakFormatted = "Ended {$breakEndFormatted}";
        }
        
        // NEW: Apply the working hours computation logic
        $hoursWorkedFormatted = $this->formatHoursWorkedForDisplay($log->hrs_worked_minutes);
        
        // NEW: Calculate undertime
        $undertimeData = $this->calculateUndertime($log);
        
        return [
            'id' => $log->id,
            'schedule_start' => $log->schedule_start,
            'schedule_end' => $log->schedule_end,
            'schedule_formatted' => $log->schedule_formatted,
            'time_in' => $log->time_in_formatted,
            'time_out' => $log->time_out_formatted,
            'break_start' => $log->break_start, // Raw break start
            'break_end' => $log->break_end,     // Raw break end
            'break_start_formatted' => $breakStartFormatted, // Formatted break start
            'break_end_formatted' => $breakEndFormatted,     // Formatted break end
            'break_formatted' => $breakFormatted, // Combined break time string
            'hrs_worked_minutes' => $log->hrs_worked_minutes,
            'hrs_worked_formatted' => $hoursWorkedFormatted, // UPDATED: Use new formatting
            'late_minutes' => $log->late_minutes,
            'late_formatted' => $log->late_formatted,
            'remarks' => $log->remarks,
            'absent' => $log->absent,
            'status' => $log->status,
            // NEW: Undertime data
            'has_undertime' => $undertimeData['has_undertime'],
            'undertime_minutes' => $undertimeData['undertime_minutes'],
            'undertime_formatted' => $undertimeData['undertime_formatted'],
            'is_early_out' => $undertimeData['is_early_out']
        ];
    }



    /**
 * Calculate undertime for early time-outs
 */
private function calculateUndertime($log)
{
    $result = [
        'has_undertime' => false,
        'undertime_minutes' => 0,
        'undertime_formatted' => '',
        'is_early_out' => false
    ];

    // Skip if no schedule end or time out
    if (!$log->schedule_end || !$log->time_out || $log->absent) {
        return $result;
    }

    try {
        // Parse schedule end time
        $scheduleEnd = null;
        if (is_string($log->schedule_end)) {
            $formats = ['H:i:s', 'H:i', 'g:i A', 'G:i:s', 'G:i'];
            foreach ($formats as $format) {
                try {
                    $scheduleEnd = \Carbon\Carbon::createFromFormat($format, $log->schedule_end);
                    break;
                } catch (\Exception $e) {
                    continue;
                }
            }
            
            if (!$scheduleEnd) {
                $scheduleEnd = \Carbon\Carbon::parse($log->schedule_end);
            }
        } else {
            $scheduleEnd = \Carbon\Carbon::parse($log->schedule_end);
        }

        // Parse actual time out
        $timeOut = \Carbon\Carbon::parse($log->time_out);

        // Create comparable time objects (same date)
        $workDate = $timeOut->copy()->startOfDay();
        $scheduleEndTime = $workDate->copy()->setTimeFromTimeString($scheduleEnd->format('H:i:s'));

        \Log::info("Undertime calculation", [
            'schedule_end_raw' => $log->schedule_end,
            'schedule_end_parsed' => $scheduleEndTime->format('Y-m-d H:i:s'),
            'time_out_raw' => $log->time_out,
            'time_out_parsed' => $timeOut->format('Y-m-d H:i:s'),
            'is_early' => $timeOut->lessThan($scheduleEndTime)
        ]);

        // Check if time out is earlier than schedule end
        if ($timeOut->lessThan($scheduleEndTime)) {
            $undertimeMinutes = $scheduleEndTime->diffInMinutes($timeOut);
            
            // Only count as undertime if it's significant (more than 5 minutes)
            if ($undertimeMinutes > 5) {
                $result['has_undertime'] = true;
                $result['undertime_minutes'] = $undertimeMinutes;
                $result['undertime_formatted'] = $this->formatUndertimeMinutes($undertimeMinutes);
                $result['is_early_out'] = true;

                \Log::info("Undertime detected", [
                    'employee_id' => $log->employee_id,
                    'work_date' => $log->work_date,
                    'schedule_end' => $scheduleEndTime->format('H:i:s'),
                    'actual_out' => $timeOut->format('H:i:s'),
                    'undertime_minutes' => $undertimeMinutes
                ]);
            }
        }

    } catch (\Exception $e) {
        \Log::error("Error calculating undertime", [
            'log_id' => $log->id,
            'schedule_end' => $log->schedule_end,
            'time_out' => $log->time_out,
            'error' => $e->getMessage()
        ]);
    }

    return $result;
}



/**
 * Format undertime minutes for display
 */
private function formatUndertimeMinutes($minutes)
{
    if ($minutes < 60) {
        return "{$minutes}m";
    }
    
    $hours = floor($minutes / 60);
    $remainingMinutes = $minutes % 60;
    
    if ($remainingMinutes > 0) {
        return "{$hours}h {$remainingMinutes}m";
    }
    
    return "{$hours}h";
}


    /**
 * Format hours worked according to the new computation rules
 * - If 8 hours or above: display "8"
 * - If below 8 hours: display full time (e.g., "7h and 40 minutes")
 */
/**
 * Format hours worked according to the new computation rules
 * - If 8 hours or above: display "8"
 * - If below 8 hours: display full time in "Xh Ym" format
 */
private function formatHoursWorkedForDisplay($minutes)
{
    if (!$minutes || $minutes <= 0) {
        return '0';
    }

    // Convert minutes to hours
    $hours = $minutes / 60;
    
    // Apply the new rule: if 8 or above, display "8"
    if ($hours >= 8) {
        return '8';
    }
    
    // If below 8 hours, display full time in "Xh Ym" format
    $wholeHours = floor($hours);
    $remainingMinutes = $minutes % 60;
    
    if ($wholeHours > 0 && $remainingMinutes > 0) {
        return "{$wholeHours}h {$remainingMinutes}m";
    } elseif ($wholeHours > 0) {
        return "{$wholeHours}h";
    } else {
        return "{$remainingMinutes}m";
    }
}
/**
 * Calculate hours worked including break deduction
 */
/**
 * Calculate hours worked with fixed 1-hour break deduction for standard schedules
 * and overtime break handling
 */
/**
 * SIMPLE & RELIABLE hours calculation with guaranteed 1-hour break deduction
 */
/**
 * ROBUST hours calculation with missing break handling and visual warnings
 */
/**
 * Calculate hours worked according to fixed shift policy
 * - Strictly 8 hours total, minus breaks
 * - Late time-in cannot be offset by extending time-out
 * - Working hours bounded by schedule itself
 */
/**
 * Calculate hours worked according to FIXED SHIFT policy
 * - Working hours bounded by schedule itself, not total logged time
 * - Late time-in cannot be offset by extending time-out
 */
protected function calculateHoursWorked($timeIn, $timeOut, $breakStart, $breakEnd, $scheduleStart = null, $scheduleEnd = null)
{
    if (!$timeIn || !$timeOut) {
        return 0;
    }

    try {
        $start = Carbon::parse($timeIn);
        $end = Carbon::parse($timeOut);
        
        // FIXED SHIFT POLICY: Always deduct 1 hour break for standard schedules
        $breakDeductionMinutes = 60;

        // Calculate hours based on SCHEDULE BOUNDARIES, not actual times
        $regularHoursMinutes = $this->calculateFixedShiftHours(
            $start, $end, $scheduleStart, $scheduleEnd, $breakDeductionMinutes
        );

        \Log::info("🎯 FIXED SHIFT CALCULATION APPLIED", [
            'schedule' => $scheduleStart . ' - ' . $scheduleEnd,
            'actual_times' => $start->format('H:i') . ' - ' . $end->format('H:i'),
            'break_deduction' => '60 minutes (fixed)',
            'calculated_hours' => $regularHoursMinutes . ' minutes',
            'formatted_hours' => $this->formatMinutesToHours($regularHoursMinutes),
            'policy' => 'Fixed Shift - Bounded by schedule'
        ]);

        return max(0, $regularHoursMinutes);

    } catch (\Exception $e) {
        \Log::error("Error in fixed shift calculation", [
            'error' => $e->getMessage()
        ]);
        return 0;
    }
}

/**
 * Calculate hours based on fixed shift boundaries
 */
protected function calculateFixedShiftHours($timeIn, $timeOut, $scheduleStart, $scheduleEnd, $breakDeductionMinutes)
{
    // If no schedule, fallback to capped calculation
    if (!$scheduleStart || !$scheduleEnd) {
        $totalMinutes = $timeOut->diffInMinutes($timeIn);
        return min(max(0, $totalMinutes - $breakDeductionMinutes), 8 * 60);
    }

    try {
        // Parse schedule times with the actual work date
        $scheduleStartTime = $this->parseScheduleTime($scheduleStart, $timeIn);
        $scheduleEndTime = $this->parseScheduleTime($scheduleEnd, $timeIn);
        
        // 🎯 FIXED SHIFT CORE LOGIC: Work only counts within schedule boundaries
        $effectiveStart = $timeIn->greaterThan($scheduleStartTime) ? $timeIn : $scheduleStartTime;
        $effectiveEnd = $timeOut->lessThan($scheduleEndTime) ? $timeOut : $scheduleEndTime;
        
        // Calculate actual worked minutes within schedule
        $workedMinutes = $effectiveEnd->diffInMinutes($effectiveStart);
        
        // Apply break deduction
        $netMinutes = max(0, $workedMinutes - $breakDeductionMinutes);
        
        // Never exceed 8 hours
        $finalMinutes = min($netMinutes, 8 * 60);

        \Log::info("📊 FIXED SHIFT BREAKDOWN", [
            'schedule_boundaries' => $scheduleStartTime->format('H:i') . ' - ' . $scheduleEndTime->format('H:i'),
            'effective_work_period' => $effectiveStart->format('H:i') . ' - ' . $effectiveEnd->format('H:i'),
            'worked_minutes_in_schedule' => $workedMinutes,
            'break_deduction_applied' => $breakDeductionMinutes,
            'net_minutes_after_break' => $netMinutes,
            'final_regular_minutes' => $finalMinutes,
            'late_impact' => $timeIn->greaterThan($scheduleStartTime) ? 'REDUCED_HOURS' : 'FULL_HOURS'
        ]);

        return $finalMinutes;

    } catch (\Exception $e) {
        \Log::error("Error in fixed shift calculation", [
            'error' => $e->getMessage()
        ]);
        
        // Fallback
        $totalMinutes = $timeOut->diffInMinutes($timeIn);
        return min(max(0, $totalMinutes - $breakDeductionMinutes), 8 * 60);
    }
}

/**
 * Parse schedule time with correct date context
 */
protected function parseScheduleTime($scheduleTime, $workDate)
{
    try {
        if ($scheduleTime instanceof Carbon) {
            return $workDate->copy()->setTimeFromTimeString($scheduleTime->format('H:i:s'));
        }

        // Handle different time formats
        $formats = ['H:i:s', 'H:i', 'g:i A', 'G:i:s', 'G:i'];
        foreach ($formats as $format) {
            try {
                $time = Carbon::createFromFormat($format, $scheduleTime);
                return $workDate->copy()->setTimeFromTimeString($time->format('H:i:s'));
            } catch (\Exception $e) {
                continue;
            }
        }

        // Final fallback
        $time = Carbon::parse($scheduleTime);
        return $workDate->copy()->setTimeFromTimeString($time->format('H:i:s'));

    } catch (\Exception $e) {
        \Log::warning("Failed to parse schedule time", [
            'schedule_time' => $scheduleTime,
            'error' => $e->getMessage()
        ]);
        return $workDate->copy();
    }
}

/**
 * Calculate regular hours according to fixed shift policy
 */
/**
 * Calculate regular hours according to fixed shift policy
 */
/**
 * Calculate regular hours according to fixed shift policy
 * - Working hours = Schedule duration minus breaks minus late time
 * - Never exceed scheduled hours regardless of actual time worked
 */
/**
 * Calculate regular hours according to fixed shift policy
 * - Working hours = Schedule duration minus breaks
 * - Late time reduces the actual worked hours within the schedule
 */
protected function calculateRegularHours($timeIn, $timeOut, $scheduleStart, $scheduleEnd, $breakDeductionMinutes)
{
    // If no schedule defined, use fallback calculation
    if (!$scheduleStart || !$scheduleEnd) {
        return $this->calculateFallbackHours($timeIn, $timeOut, $breakDeductionMinutes);
    }

    try {
        // Parse schedule times
        $scheduleStartTime = $this->parseScheduleTime($scheduleStart, $timeIn);
        $scheduleEndTime = $this->parseScheduleTime($scheduleEnd, $timeIn);
        
        // FIXED SHIFT RULE: Working hours are bounded by schedule itself
        // Effective start time is the LATER of schedule start or actual time-in
        $effectiveStart = $timeIn->greaterThan($scheduleStartTime) ? $timeIn : $scheduleStartTime;
        
        // Effective end time is the EARLIER of schedule end or actual time-out
        $effectiveEnd = $timeOut->lessThan($scheduleEndTime) ? $timeOut : $scheduleEndTime;
        
        // Calculate actual worked minutes within schedule boundaries
        $workedMinutes = $effectiveEnd->diffInMinutes($effectiveStart);
        
        // Apply break deduction
        $regularHoursMinutes = max(0, $workedMinutes - $breakDeductionMinutes);
        
        // Cap at maximum of scheduled hours (8 hours)
        $maxScheduledMinutes = 8 * 60;
        $cappedMinutes = min($regularHoursMinutes, $maxScheduledMinutes);
        
        \Log::info("CORRECT Fixed Shift Calculation", [
            'schedule' => $scheduleStartTime->format('H:i') . ' - ' . $scheduleEndTime->format('H:i'),
            'actual_time' => $timeIn->format('H:i') . ' - ' . $timeOut->format('H:i'),
            'effective_work_time' => $effectiveStart->format('H:i') . ' - ' . $effectiveEnd->format('H:i'),
            'worked_minutes' => $workedMinutes . ' minutes',
            'break_deduction' => $breakDeductionMinutes . ' minutes',
            'regular_hours_before_cap' => $regularHoursMinutes . ' minutes',
            'regular_hours_after_cap' => $cappedMinutes . ' minutes',
            'is_late' => $timeIn->greaterThan($scheduleStartTime),
            'late_minutes' => $timeIn->diffInMinutes($scheduleStartTime) . ' minutes'
        ]);

        return $cappedMinutes;

    } catch (\Exception $e) {
        \Log::error("Error in correct hours calculation", [
            'error' => $e->getMessage()
        ]);
        
        return $this->calculateFallbackHours($timeIn, $timeOut, $breakDeductionMinutes);
    }
}

/**
 * Fallback calculation when schedule parsing fails
 */
protected function calculateFallbackHours($timeIn, $timeOut, $breakDeductionMinutes)
{
    $totalMinutes = $timeOut->diffInMinutes($timeIn);
    $netMinutes = max(0, $totalMinutes - $breakDeductionMinutes);
    return min($netMinutes, 8 * 60);
}

/**
 * Professional break deduction - always 1 hour for standard schedules
 */
protected function calculateBreakDeductionWithMissingHandling($breakStart, $breakEnd, $timeIn, $timeOut)
{
    // For fixed shift policy, ALWAYS deduct 1 hour regardless of actual break
    $standardBreakMinutes = 60;
    
    \Log::info("Professional Break Deduction", [
        'actual_break_recorded' => $breakStart && $breakEnd ? 'Yes' : 'No',
        'break_duration_applied' => $standardBreakMinutes . ' minutes',
        'policy' => 'Fixed 1-hour break deduction for standard schedules'
    ]);
    
    return $standardBreakMinutes;
}

/**
 * Enhanced late calculation with better logging
 */


/**
 * Parse time for comparison (utility method)
 */
protected function parseTimeForComparison($timeString)
{
    if ($timeString instanceof Carbon) {
        return $timeString;
    }

    $formats = ['H:i:s', 'H:i', 'g:i A', 'G:i:s', 'G:i'];
    foreach ($formats as $format) {
        try {
            return Carbon::createFromFormat($format, $timeString);
        } catch (\Exception $e) {
            continue;
        }
    }

    return Carbon::parse($timeString);
}
/**
 * Simplified break deduction - always 1 hour for standard schedules
 */
protected function calculateBreakDeduction($timeIn, $timeOut, $breakStart, $breakEnd, $isStandardSchedule)
{
    // For fixed shift policy, always use 1-hour break deduction
    return 60; // 1 hour in minutes
}

/**
 * Determine the status of break data
 */
protected function getBreakStatus($breakStart, $breakEnd)
{
    $hasStart = $breakStart && $breakStart !== 'No break' && $breakStart !== 'null' && trim($breakStart) !== '';
    $hasEnd = $breakEnd && $breakEnd !== 'No break' && $breakEnd !== 'null' && trim($breakEnd) !== '';

    if ($hasStart && $hasEnd) {
        return 'complete';
    } elseif (!$hasStart && $hasEnd) {
        return 'missing_start';
    } elseif ($hasStart && !$hasEnd) {
        return 'missing_end';
    } else {
        return 'missing_both';
    }
}

/**
 * Calculate default break deduction when no break data is available
 */
protected function calculateDefaultBreakDeduction($totalMinutes)
{
    // Intelligent default break deduction based on shift length
    if ($totalMinutes <= 4 * 60) {
        return 0; // No break for shifts under 4 hours
    } elseif ($totalMinutes <= 6 * 60) {
        return 30; // 30-minute break for 4-6 hour shifts
    } else {
        return 60; // 1-hour break for shifts over 6 hours
    }
}

/**
 * Calculate actual break duration
 */
protected function calculateActualBreakMinutes($breakStart, $breakEnd)
{
    if (!$breakStart || !$breakEnd) {
        return 0;
    }

    try {
        // Handle "null" or "No break" strings
        if ($breakStart === 'No break' || $breakEnd === 'No break' || 
            $breakStart === 'null' || $breakEnd === 'null') {
            return 0;
        }

        $breakStartTime = Carbon::parse($breakStart);
        $breakEndTime = Carbon::parse($breakEnd);
        $breakMinutes = $breakEndTime->diffInMinutes($breakStartTime);

        // If break is unrealistically short (less than 5 minutes), use default
        if ($breakMinutes < 5) {
            return 60; // Default to 1 hour for unrealistic short breaks
        }

        return max(0, $breakMinutes);

    } catch (\Exception $e) {
        return 60; // Default to 1 hour on error
    }
}

/**
 * Calculate actual break duration - SIMPLIFIED
 */


/**
 * Check if this is a standard 8 AM - 5 PM schedule
 */
protected function isStandardSchedule($scheduleStart, $scheduleEnd)
{
    if (!$scheduleStart || !$scheduleEnd) {
        return false;
    }

    try {
        // Normalize schedule times for comparison
        $normalizedStart = $this->normalizeTime($scheduleStart);
        $normalizedEnd = $this->normalizeTime($scheduleEnd);

        // Check if schedule matches standard 8 AM - 5 PM
        $isStandard = ($normalizedStart === '08:00:00' || $normalizedStart === '08:00') && 
                     ($normalizedEnd === '17:00:00' || $normalizedEnd === '17:00');

        \Log::info("Schedule check", [
            'schedule_start' => $scheduleStart,
            'schedule_end' => $scheduleEnd,
            'normalized_start' => $normalizedStart,
            'normalized_end' => $normalizedEnd,
            'is_standard' => $isStandard
        ]);

        return $isStandard;

    } catch (\Exception $e) {
        \Log::warning("Error checking standard schedule", [
            'schedule_start' => $scheduleStart,
            'schedule_end' => $scheduleEnd,
            'error' => $e->getMessage()
        ]);
        return false;
    }
}

/**
 * Normalize time to HH:MM:SS format
 */
protected function normalizeTime($timeString)
{
    if (!$timeString) {
        return null;
    }

    try {
        if ($timeString instanceof Carbon) {
            return $timeString->format('H:i:s');
        }

        $time = Carbon::parse($timeString);
        return $time->format('H:i:s');
    } catch (\Exception $e) {
        // If parsing fails, try to extract time from string
        if (preg_match('/(\d{1,2}):(\d{2})/', $timeString, $matches)) {
            $hours = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            $minutes = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
            return "{$hours}:{$minutes}:00";
        }
        return null;
    }
}

/**
 * Calculate break deduction based on the new rules
 */


/**
 * Check if shift includes the standard noon break period (12:00 PM - 1:00 PM)
 */
protected function shiftIncludesNoonBreak($timeIn, $timeOut)
{
    try {
        $noonStart = Carbon::parse($timeIn->format('Y-m-d') . ' 12:00:00');
        $noonEnd = Carbon::parse($timeIn->format('Y-m-d') . ' 13:00:00');

        // Check if work period overlaps with noon break period
        $includesNoon = $timeIn < $noonEnd && $timeOut > $noonStart;

        \Log::info("Noon break check", [
            'time_in' => $timeIn->format('Y-m-d H:i:s'),
            'time_out' => $timeOut->format('Y-m-d H:i:s'),
            'noon_start' => $noonStart->format('Y-m-d H:i:s'),
            'noon_end' => $noonEnd->format('Y-m-d H:i:s'),
            'includes_noon' => $includesNoon
        ]);

        return $includesNoon;

    } catch (\Exception $e) {
        \Log::warning("Error checking noon break period", [
            'error' => $e->getMessage()
        ]);
        return false;
    }
}

/**
 * Calculate actual break duration in minutes
 */


    /**
 * Process late credits after successful import
 */
public function processLateCreditsAfterImport($processedRows)
{
    try {
        $leaveCreditService = new \App\Services\LeaveCreditService();
        $processedLates = 0;
        $failedLates = 0;

        foreach ($processedRows as $row) {
            if (isset($row['late_minutes']) && $row['late_minutes'] > 0) {
                $result = $leaveCreditService->deductLateCredits(
                    $row['employee_id'] ?? null,
                    $row['late_minutes']
                );

                if ($result['success']) {
                    $processedLates++;
                    \Log::info("✅ Processed late credits after import", [
                        'employee_id' => $row['employee_id'],
                        'late_minutes' => $row['late_minutes'],
                        'deducted_amount' => $result['deducted_amount']
                    ]);
                } else {
                    $failedLates++;
                    \Log::warning("⚠️ Failed to process late credits after import", [
                        'employee_id' => $row['employee_id'],
                        'late_minutes' => $row['late_minutes'],
                        'error' => $result['message']
                    ]);
                }
            }
        }

        return [
            'processed_lates' => $processedLates,
            'failed_lates' => $failedLates
        ];
    } catch (\Exception $e) {
        \Log::error('Error processing late credits after import: ' . $e->getMessage());
        return [
            'processed_lates' => 0,
            'failed_lates' => 0,
            'error' => $e->getMessage()
        ];
    }
}


public function visualPreview(Request $request)
{
    $validator = Validator::make($request->all(), [
        'file' => 'required|file|max:10240',
    ], [
        'file.required' => 'Please select a file to upload.',
        'file.file' => 'The uploaded file is not valid.',
        'file.max' => 'The file may not be greater than 10MB.'
    ]);

    // File extension validation
    if ($request->hasFile('file')) {
        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $allowedExtensions = ['xlsx', 'xls', 'csv'];
        
        if (!in_array($extension, $allowedExtensions)) {
            $validator->errors()->add('file', 'The file must be a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
        }
    }

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422);
    }

    try {
        $file = $request->file('file');
        
        // Store file temporarily
        $filePath = $file->store('temp/attendance-previews');
        $fullPath = storage_path('app/' . $filePath);

        // Generate visual preview
        $previewResult = $this->importService->generateVisualPreview($fullPath);

        // Clean up temporary file
        Storage::delete($filePath);

        return response()->json($previewResult);

    } catch (\Exception $e) {
        \Log::error('Visual preview failed: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Preview failed: ' . $e->getMessage()
        ], 500);
    }
}


/**
 * Compare processed logs with raw logs for an employee
 */
public function compareWithRawLogs($employeeId, Request $request)
{
    \Log::info('🎯 === COMPARE WITH RAW LOGS METHOD CALLED ===', [
        'employee_id' => $employeeId,
        'request_params' => $request->all()
    ]);

    try {
        // Debug: Check if employee exists
        $employee = \App\Models\Employee::with('department')->find($employeeId);
        
        if (!$employee) {
            \Log::error('❌ Employee not found', ['employee_id' => $employeeId]);
            return redirect()->back()->with('error', 'Employee not found');
        }

        \Log::info('✅ Employee found:', [
            'employee_id' => $employee->employee_id,
            'name' => $employee->firstname . ' ' . $employee->lastname
        ]);

        // Get the same date range as the current view
        $month = $request->get('month', \Carbon\Carbon::now()->format('Y-m'));
        $period = $request->get('period', 'full');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        
        // Calculate date range (same logic as viewEmployeeLogs)
        if ($startDate && $endDate) {
            $startDate = \Carbon\Carbon::parse($startDate)->startOfDay();
            $endDate = \Carbon\Carbon::parse($endDate)->endOfDay();
        } else {
            $startDate = \Carbon\Carbon::createFromFormat('Y-m', $month)->startOfMonth();
            $endDate = $startDate->copy()->endOfMonth();
            
            if ($period === 'first_half') {
                $endDate = $startDate->copy()->addDays(14);
            } elseif ($period === 'second_half') {
                $startDate = $startDate->copy()->addDays(15);
            }
        }

        \Log::info('📅 Date range for comparison:', [
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'month' => $month,
            'period' => $period
        ]);

        // DEBUG: Check ALL data first
        $allProcessed = \App\Models\AttendanceLog::where('employee_id', $employeeId)->get();
        $allRaw = \App\Models\AttendanceLogRaw::where('employee_id', $employeeId)->get();

        \Log::info('🔍 ALL DATA CHECK:', [
            'total_processed_logs' => $allProcessed->count(),
            'total_raw_logs' => $allRaw->count(),
            'processed_dates' => $allProcessed->pluck('work_date')->toArray(),
            'raw_dates' => $allRaw->pluck('work_date')->toArray()
        ]);

        // Get processed logs with DEBUG
        $processedLogs = \App\Models\AttendanceLog::where('employee_id', $employeeId)
            ->whereBetween('work_date', [$startDate, $endDate])
            ->orderBy('work_date', 'asc')
            ->get();

        \Log::info('📊 Processed logs query results:', [
            'query_conditions' => [
                'employee_id' => $employeeId,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d')
            ],
            'found_count' => $processedLogs->count(),
            'found_dates' => $processedLogs->pluck('work_date')->toArray(),
            'sql_query' => \App\Models\AttendanceLog::where('employee_id', $employeeId)
                ->whereBetween('work_date', [$startDate, $endDate])->toSql()
        ]);

        // Get raw logs with DEBUG
        $rawLogs = \App\Models\AttendanceLogRaw::where('employee_id', $employeeId)
            ->whereBetween('work_date', [$startDate, $endDate])
            ->orderBy('work_date', 'asc')
            ->get();

        \Log::info('📋 Raw logs query results:', [
            'query_conditions' => [
                'employee_id' => $employeeId,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d')
            ],
            'found_count' => $rawLogs->count(),
            'found_dates' => $rawLogs->pluck('work_date')->toArray(),
            'sql_query' => \App\Models\AttendanceLogRaw::where('employee_id', $employeeId)
                ->whereBetween('work_date', [$startDate, $endDate])->toSql()
        ]);

        // Create comparison data
        $comparisonData = $this->createComparisonData($processedLogs, $rawLogs, $startDate, $endDate);

        \Log::info('📈 Comparison data created:', [
            'total_comparison_entries' => count($comparisonData),
            'entries_with_data' => collect($comparisonData)->filter(function($entry) {
                return $entry['has_processed'] || $entry['has_raw'];
            })->count()
        ]);

        return \Inertia\Inertia::render('HR/AttendanceComparison', [
            'employee' => [
                'employee_id' => $employee->employee_id,
                'firstname' => $employee->firstname,
                'lastname' => $employee->lastname,
                'department' => $employee->department->name ?? 'No Department',
                'biometric_id' => $employee->biometric_id
            ],
            'comparisonData' => $comparisonData,
            'summary' => $this->getComparisonSummary($comparisonData),
            'dateRange' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
                'period' => $period,
                'month' => $month
            ],
            'filters' => $request->only(['month', 'period', 'start_date', 'end_date'])
        ]);

    } catch (\Exception $e) {
        \Log::error('❌ Error in compareWithRawLogs: ' . $e->getMessage(), [
            'employee_id' => $employeeId,
            'trace' => $e->getTraceAsString()
        ]);
        return redirect()->back()->with('error', 'Failed to load comparison: ' . $e->getMessage());
    }
}

/**
 * Create comparison data between processed and raw logs
 */
private function createComparisonData($processedLogs, $rawLogs, $startDate, $endDate)
{
    \Log::info('🔄 Creating comparison data...', [
        'processed_count' => $processedLogs->count(),
        'raw_count' => $rawLogs->count(),
        'date_range' => [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]
    ]);

    $comparisonData = [];
    $currentDate = $startDate->copy();

    // Create entries for all dates in the range
    while ($currentDate <= $endDate) {
        $dateString = $currentDate->format('Y-m-d');
        
        // Find logs for this specific date
        $processedLog = $processedLogs->first(function ($log) use ($dateString) {
            return $log->work_date->format('Y-m-d') === $dateString;
        });

        $rawLog = $rawLogs->first(function ($log) use ($dateString) {
            return $log->work_date->format('Y-m-d') === $dateString;
        });

        $comparisonData[] = $this->createComparisonEntry($dateString, $processedLog, $rawLog);
        
        $currentDate->addDay();
    }

    \Log::info('📈 Comparison data created:', [
        'total_entries' => count($comparisonData),
        'entries_with_processed_data' => collect($comparisonData)->where('has_processed', true)->count(),
        'entries_with_raw_data' => collect($comparisonData)->where('has_raw', true)->count(),
        'sample_entries' => collect($comparisonData)->where('has_processed', true)->take(3)->map(function($entry) {
            return [
                'date' => $entry['date'],
                'status' => $entry['status'],
                'has_processed' => $entry['has_processed'],
                'has_raw' => $entry['has_raw']
            ];
        })
    ]);

    return $comparisonData;
}

/**
 * Create a single comparison entry - FIXED VERSION
 */
private function createComparisonEntry($date, $processedLog, $rawLog)
{
    \Log::info('📝 Creating comparison entry:', [
        'date' => $date,
        'has_processed' => !is_null($processedLog),
        'has_raw' => !is_null($rawLog)
    ]);

    $entry = [
        'date' => $date,
        'date_formatted' => \Carbon\Carbon::parse($date)->format('M d, Y'),
        'day_of_week' => \Carbon\Carbon::parse($date)->format('l'),
        'has_processed' => !is_null($processedLog),
        'has_raw' => !is_null($rawLog),
        'status' => 'match', // Default status
        'differences' => []
    ];

    // If both logs exist, compare them
    if ($processedLog && $rawLog) {
        $entry = $this->compareLogs($entry, $processedLog, $rawLog);
        \Log::info('✅ Both logs exist - compared', ['date' => $date, 'status' => $entry['status']]);
    } 
    // If only processed log exists
    elseif ($processedLog && !$rawLog) {
        $entry['status'] = 'missing_raw';
        $entry['differences'][] = 'Raw log missing - data was processed but no raw record found';
        \Log::info('⚠️ Only processed log exists', ['date' => $date]);
    }
    // If only raw log exists
    elseif (!$processedLog && $rawLog) {
        $entry['status'] = 'missing_processed';
        $entry['differences'][] = 'Processed log missing - raw data exists but was not processed';
        \Log::info('⚠️ Only raw log exists', ['date' => $date]);
    }
    // If neither exists
    else {
        $entry['status'] = 'no_data';
        \Log::info('❌ No logs exist', ['date' => $date]);
    }

    // Add log data for display - FIXED: Use proper formatting
    $entry['processed_data'] = $processedLog ? $this->formatLogDataForComparison($processedLog) : null;
    $entry['raw_data'] = $rawLog ? $this->formatRawLogDataForComparison($rawLog) : null;

    return $entry;
}

/**
 * Format processed log data for comparison display - NEW METHOD
 */
/**
 * Format processed log data for comparison display - ENHANCED
 */
private function formatLogDataForComparison($log)
{
    return [
        'schedule_start' => $log->schedule_start ? \Carbon\Carbon::parse($log->schedule_start)->format('H:i') : null,
        'schedule_end' => $log->schedule_end ? \Carbon\Carbon::parse($log->schedule_end)->format('H:i') : null,
        'schedule_formatted' => $log->schedule_formatted ?? ($log->schedule_start && $log->schedule_end 
            ? \Carbon\Carbon::parse($log->schedule_start)->format('H:i') . ' - ' . \Carbon\Carbon::parse($log->schedule_end)->format('H:i')
            : 'N/A'),
        'time_in' => $log->time_in ? \Carbon\Carbon::parse($log->time_in)->format('H:i') : null,
        'time_out' => $log->time_out ? \Carbon\Carbon::parse($log->time_out)->format('H:i') : null,
        'break_start' => $log->break_start,
        'break_end' => $log->break_end,
        'break_formatted' => $log->break_formatted,
        'hrs_worked_minutes' => $log->hrs_worked_minutes,
        'hrs_worked_formatted' => $this->formatMinutesToHours($log->hrs_worked_minutes),
        'late_minutes' => $log->late_minutes,
        'late_formatted' => $this->formatMinutesToHours($log->late_minutes),
        'remarks' => $log->remarks,
        'absent' => $log->absent,
        'status' => $log->status
    ];
}

/**
 * Format raw log data for comparison display - ENHANCED
 */
private function formatRawLogDataForComparison($log)
{
    return [
        'schedule_start' => $log->schedule_start ? \Carbon\Carbon::parse($log->schedule_start)->format('H:i') : null,
        'schedule_end' => $log->schedule_end ? \Carbon\Carbon::parse($log->schedule_end)->format('H:i') : null,
        'time_in' => $log->time_in ? \Carbon\Carbon::parse($log->time_in)->format('H:i') : null,
        'time_out' => $log->time_out ? \Carbon\Carbon::parse($log->time_out)->format('H:i') : null,
        'break_start' => $log->break_start,
        'break_end' => $log->break_end,
        'hrs_worked_minutes' => $log->hrs_worked_minutes,
        'hrs_worked_formatted' => $this->formatMinutesToHours($log->hrs_worked_minutes),
        'late_minutes' => $log->late_minutes,
        'late_formatted' => $this->formatMinutesToHours($log->late_minutes),
        'remarks' => $log->remarks,
        'absent' => $log->absent,
        'import_batch' => $log->import_batch,
        'created_at' => $log->created_at?->format('Y-m-d H:i:s'),
        'raw_row' => $log->raw_row
    ];
}
/**
 * Compare processed and raw logs for differences
 */
private function compareLogs($entry, $processedLog, $rawLog)
{
    \Log::info('🔍 Comparing logs for date:', ['date' => $entry['date']]);

    $differences = [];

    // Compare time in
    $timeInDiff = $this->compareTimes($processedLog->time_in, $rawLog->time_in);
    if ($timeInDiff) {
        $differences[] = 'Time In differs';
        \Log::info('⏰ Time In difference found', [
            'processed' => $processedLog->time_in,
            'raw' => $rawLog->time_in
        ]);
    }

    // Compare time out
    $timeOutDiff = $this->compareTimes($processedLog->time_out, $rawLog->time_out);
    if ($timeOutDiff) {
        $differences[] = 'Time Out differs';
        \Log::info('⏰ Time Out difference found', [
            'processed' => $processedLog->time_out,
            'raw' => $rawLog->time_out
        ]);
    }

    // Compare schedule start
    $scheduleStartDiff = $this->compareTimes($processedLog->schedule_start, $rawLog->schedule_start);
    if ($scheduleStartDiff) {
        $differences[] = 'Schedule Start differs';
    }

    // Compare schedule end
    $scheduleEndDiff = $this->compareTimes($processedLog->schedule_end, $rawLog->schedule_end);
    if ($scheduleEndDiff) {
        $differences[] = 'Schedule End differs';
    }

    // Compare hours worked (with tolerance for calculation differences)
    $hoursDiff = abs(($processedLog->hrs_worked_minutes - $rawLog->hrs_worked_minutes));
    if ($hoursDiff > 5) { // 5 minutes tolerance
        $differences[] = "Hours Worked differs by {$hoursDiff} minutes";
        \Log::info('⏱️ Hours difference found', [
            'processed_minutes' => $processedLog->hrs_worked_minutes,
            'raw_minutes' => $rawLog->hrs_worked_minutes,
            'difference' => $hoursDiff
        ]);
    }

    // Compare late minutes
    $lateDiff = abs(($processedLog->late_minutes - $rawLog->late_minutes));
    if ($lateDiff > 5) { // 5 minutes tolerance
        $differences[] = "Late Minutes differ by {$lateDiff} minutes";
    }

    // Compare remarks
    if ($processedLog->remarks != $rawLog->remarks) {
        $differences[] = 'Remarks differ';
    }

    // Compare absent status
    if ($processedLog->absent != $rawLog->absent) {
        $differences[] = 'Absent status differs';
    }

    if (count($differences) > 0) {
        $entry['status'] = 'mismatch';
        $entry['differences'] = $differences;
        \Log::info('❌ Mismatch found', [
            'date' => $entry['date'],
            'differences_count' => count($differences),
            'differences' => $differences
        ]);
    } else {
        \Log::info('✅ Perfect match', ['date' => $entry['date']]);
    }

    return $entry;
}

/**
 * Compare two time values with tolerance for formatting differences
 */
private function compareTimes($time1, $time2)
{
    if (is_null($time1) && is_null($time2)) {
        return false;
    }

    if (is_null($time1) || is_null($time2)) {
        return true;
    }

    try {
        $time1 = \Carbon\Carbon::parse($time1);
        $time2 = \Carbon\Carbon::parse($time2);

        // Consider times different if they differ by more than 1 minute
        return $time1->diffInMinutes($time2) > 1;
    } catch (\Exception $e) {
        return true; // If parsing fails, consider them different
    }
}

/**
 * Format raw log data for display
 */
private function formatRawLogData($rawLog)
{
    return [
        'schedule_start' => $rawLog->schedule_start ? \Carbon\Carbon::parse($rawLog->schedule_start)->format('H:i') : null,
        'schedule_end' => $rawLog->schedule_end ? \Carbon\Carbon::parse($rawLog->schedule_end)->format('H:i') : null,
        'time_in' => $rawLog->time_in ? \Carbon\Carbon::parse($rawLog->time_in)->format('H:i') : null,
        'time_out' => $rawLog->time_out ? \Carbon\Carbon::parse($rawLog->time_out)->format('H:i') : null,
        'break_start' => $rawLog->break_start,
        'break_end' => $rawLog->break_end,
        'hrs_worked_minutes' => $rawLog->hrs_worked_minutes,
        'hrs_worked_formatted' => $this->formatMinutesToHours($rawLog->hrs_worked_minutes),
        'late_minutes' => $rawLog->late_minutes,
        'late_formatted' => $this->formatMinutesToHours($rawLog->late_minutes),
        'remarks' => $rawLog->remarks,
        'absent' => $rawLog->absent,
        'import_batch' => $rawLog->import_batch,
        'created_at' => $rawLog->created_at?->format('Y-m-d H:i:s'),
        'raw_row' => $rawLog->raw_row
    ];
}

/**
 * Get comparison summary statistics
 */
private function getComparisonSummary($comparisonData)
{
    $totalDays = count($comparisonData);
    $matchCount = 0;
    $mismatchCount = 0;
    $missingRawCount = 0;
    $missingProcessedCount = 0;
    $noDataCount = 0;

    foreach ($comparisonData as $entry) {
        switch ($entry['status']) {
            case 'match':
                $matchCount++;
                break;
            case 'mismatch':
                $mismatchCount++;
                break;
            case 'missing_raw':
                $missingRawCount++;
                break;
            case 'missing_processed':
                $missingProcessedCount++;
                break;
            case 'no_data':
                $noDataCount++;
                break;
        }
    }

    return [
        'total_days' => $totalDays,
        'match_count' => $matchCount,
        'mismatch_count' => $mismatchCount,
        'missing_raw_count' => $missingRawCount,
        'missing_processed_count' => $missingProcessedCount,
        'no_data_count' => $noDataCount,
        'match_percentage' => $totalDays > 0 ? round(($matchCount / $totalDays) * 100, 2) : 0,
        'data_quality_score' => $totalDays > 0 ? round((($matchCount + $mismatchCount) / $totalDays) * 100, 2) : 0
    ];
}

/**
 * Format minutes to hours:minutes
 */
/**
 * Format minutes to hours according to the new computation rules
 */
private function formatMinutesToHours($minutes)
{
    if (!$minutes || $minutes <= 0) {
        return '0';
    }

    // Convert minutes to hours
    $hours = $minutes / 60;
    
    // Apply the new rule: if 8 or above, display "8"
    if ($hours >= 8) {
        return '8';
    }
    
    // If below 8 hours, display full time in "Xh Ym" format
    $wholeHours = floor($hours);
    $remainingMinutes = $minutes % 60;
    
    if ($wholeHours > 0 && $remainingMinutes > 0) {
        return "{$wholeHours}h {$remainingMinutes}m";
    } elseif ($wholeHours > 0) {
        return "{$wholeHours}h";
    } else {
        return "{$remainingMinutes}m";
    }
}

/**
 * Get comparison summary statistics
 */


 public function correctionRequests(Request $request)
 {
     $perPage = 10;
     
     $query = AttendanceCorrection::with([
         'employee.department',
         'reviewer',
         'department'
     ])->where('status', 'Reviewed'); // Only show corrections reviewed by Dept Head

     // Employee search filter
     if ($request->has('employee') && !empty($request->employee)) {
         $query->whereHas('employee', function ($q) use ($request) {
             $q->where('firstname', 'like', "%{$request->employee}%")
               ->orWhere('lastname', 'like', "%{$request->employee}%");
         });
     }

     // Date filter
     if ($request->has('date') && !empty($request->date)) {
         $query->whereDate('attendance_date', $request->date);
     }

     $corrections = $query->orderBy('created_at', 'desc')
                         ->paginate($perPage)
                         ->withQueryString();

     // Transform corrections for frontend
     $transformedCorrections = $corrections->getCollection()->map(function ($correction) {
         return $this->transformCorrectionData($correction);
     });

     $corrections->setCollection($transformedCorrections);

     // Statistics
     $reviewedCount = AttendanceCorrection::where('status', 'Reviewed')->count();
     $totalCount = AttendanceCorrection::count();

     return Inertia::render('HR/AttendanceCorrections', [
         'corrections' => $corrections,
         'stats' => [
             'reviewed' => $reviewedCount,
             'total' => $totalCount,
         ],
         'filters' => $request->only(['employee', 'date']),
     ]);
 }

 /**
  * Show specific correction request details
  */
 public function showCorrection($id)
 {
     $correction = AttendanceCorrection::with([
         'employee.department',
         'reviewer',
         'department'
     ])->findOrFail($id);

     // Ensure correction is in Reviewed status
     if ($correction->status !== 'Reviewed') {
         abort(403, 'This correction request is not ready for HR review.');
     }

     $transformedCorrection = $this->transformCorrectionData($correction);

     return Inertia::render('HR/ShowAttendanceCorrection', [
         'correction' => $transformedCorrection,
     ]);
 }

 /**
  * Approve correction request
  */
 public function approveCorrection(Request $request, $id)
 {
     try {
         $user = $request->user();
         
         $validated = $request->validate([
             'remarks' => 'nullable|string|max:500'
         ]);

         $correction = AttendanceCorrection::with(['employee', 'department'])->findOrFail($id);

         // Check if correction is in correct status
         if ($correction->status !== 'Reviewed') {
             return back()->with('error', 'This correction request is not ready for approval.');
         }

         // Update correction status to Approved
         $correction->update([
             'status' => 'Approved',
             'approved_by' => $user->id,
             'approved_at' => now(),
             'remarks' => $validated['remarks'] ?? $correction->remarks
         ]);

         // Notify employee about approval
         $this->notificationService->createEmployeeNotification(
             $correction->employee_id,
             'attendance_correction_approved',
             'Attendance Correction Request Approved',
             "Your attendance correction request for {$correction->attendance_date} has been approved by HR.",
             [
                 'correction_id' => $correction->id,
                 'attendance_date' => $correction->attendance_date,
                 'remarks' => $validated['remarks'],
                 'status' => 'Approved'
             ]
         );

         return redirect()->route('hr.attendance-corrections')->with('success', 'Correction request approved successfully!');

     } catch (\Exception $e) {
         \Log::error('Failed to approve attendance correction: ' . $e->getMessage(), [
             'correction_id' => $id,
             'user_id' => $request->user()->id
         ]);

         return back()->with('error', 'Failed to approve correction request: ' . $e->getMessage());
     }
 }

 /**
  * Reject correction request
  */
 public function rejectCorrection(Request $request, $id)
 {
     try {
         $user = $request->user();
         
         $validated = $request->validate([
             'remarks' => 'required|string|max:500'
         ]);

         $correction = AttendanceCorrection::with(['employee', 'department'])->findOrFail($id);

         // Check if correction is in correct status
         if ($correction->status !== 'Reviewed') {
             return back()->with('error', 'This correction request is not ready for rejection.');
         }

         // Update correction status to Rejected
         $correction->update([
             'status' => 'Rejected',
             'approved_by' => $user->id,
             'approved_at' => now(),
             'remarks' => $validated['remarks']
         ]);

         // Notify employee about rejection
         $this->notificationService->createEmployeeNotification(
             $correction->employee_id,
             'attendance_correction_rejected',
             'Attendance Correction Request Rejected',
             "Your attendance correction request for {$correction->attendance_date} has been rejected by HR. Reason: {$validated['remarks']}",
             [
                 'correction_id' => $correction->id,
                 'attendance_date' => $correction->attendance_date,
                 'remarks' => $validated['remarks'],
                 'status' => 'Rejected'
             ]
         );

         return redirect()->route('hr.attendance-corrections')->with('success', 'Correction request rejected successfully!');

     } catch (\Exception $e) {
         \Log::error('Failed to reject attendance correction: ' . $e->getMessage(), [
             'correction_id' => $id,
             'user_id' => $request->user()->id
         ]);

         return back()->with('error', 'Failed to reject correction request: ' . $e->getMessage());
     }
 }

 /**
  * View proof image for HR
  */
/**
 * View proof image for HR - DEBUG VERSION
 */
/**
 * View proof image for HR - FIXED VERSION
 */
public function viewProofImage($id)
{
    $correction = AttendanceCorrection::findOrFail($id);
    $user = auth()->user();
    
    // DEBUG: Log user information for troubleshooting
    \Log::info('🔍 HR PROOF IMAGE ACCESS DEBUG', [
        'user_id' => $user->id,
        'user_role' => $user->role,
        'correction_id' => $id,
        'correction_status' => $correction->status,
        'employee_id' => $correction->employee_id,
        'department_id' => $correction->department_id
    ]);

    // ✅ PROPER AUTHORIZATION FOR HR
    $allowedRoles = ['admin', 'hr'];
    $canAccess = in_array($user->role, $allowedRoles);

    if (!$canAccess) {
        \Log::warning('❌ UNAUTHORIZED HR ACCESS ATTEMPT', [
            'user_id' => $user->id,
            'user_role' => $user->role,
            'allowed_roles' => $allowedRoles
        ]);
        abort(403, 'Unauthorized action.');
    }

    // Check if correction is in a status that HR should be able to view
    $allowedStatuses = ['Reviewed', 'Approved', 'Rejected'];
    if (!in_array($correction->status, $allowedStatuses)) {
        \Log::warning('❌ HR ATTEMPTED TO VIEW NON-REVIEWED CORRECTION', [
            'correction_id' => $id,
            'current_status' => $correction->status,
            'allowed_statuses' => $allowedStatuses
        ]);
        abort(403, 'This correction request is not available for HR review yet.');
    }

    if (!$correction->proof_image || !Storage::disk('public')->exists($correction->proof_image)) {
        \Log::error('❌ PROOF IMAGE NOT FOUND', [
            'correction_id' => $id,
            'proof_image_path' => $correction->proof_image,
            'file_exists' => $correction->proof_image ? Storage::disk('public')->exists($correction->proof_image) : false
        ]);
        abort(404, 'Proof image not found.');
    }

    // Return the image as a response for viewing
    $filePath = Storage::disk('public')->path($correction->proof_image);
    $mimeType = mime_content_type($filePath);
    
    \Log::info('✅ HR PROOF IMAGE ACCESS GRANTED', [
        'correction_id' => $id,
        'file_path' => $correction->proof_image,
        'mime_type' => $mimeType
    ]);

    return response()->file($filePath, [
        'Content-Type' => $mimeType,
        'Content-Disposition' => 'inline; filename="' . basename($correction->proof_image) . '"'
    ]);
}
 /**
  * Transform correction data for display
  */
 private function transformCorrectionData($correction)
 {
     return [
         'id' => $correction->id,
         'employee_id' => $correction->employee_id,
         'employee_name' => $correction->employee ? 
             $correction->employee->firstname . ' ' . $correction->employee->lastname : 
             'Unknown Employee',
         'department' => $correction->department ? $correction->department->name : 'No Department',
         'attendance_date' => $correction->attendance_date,
         'attendance_date_formatted' => \Carbon\Carbon::parse($correction->attendance_date)->format('M d, Y'),
         'explanation' => $correction->explanation,
         'proof_image' => $correction->proof_image,
         'status' => $correction->status,
         'remarks' => $correction->remarks,
         'reviewed_by' => $correction->reviewer ? $correction->reviewer->name : null,
         'reviewed_at' => $correction->reviewed_at ? 
             $correction->reviewed_at->format('M d, Y g:i A') : null,
         'approved_by' => $correction->approver ? $correction->approver->name : null,
         'approved_at' => $correction->approved_at ? 
             $correction->approved_at->format('M d, Y g:i A') : null,
         'created_at' => $correction->created_at->format('M d, Y g:i A'),
         'created_at_raw' => $correction->created_at,
     ];
 }

 /**
  * Get correction statistics for HR dashboard
  */
 public function getCorrectionStats(Request $request)
 {
     $reviewedCorrections = AttendanceCorrection::where('status', 'Reviewed')->count();
     $totalCorrections = AttendanceCorrection::count();

     return response()->json([
         'reviewed_corrections' => $reviewedCorrections,
         'total_corrections' => $totalCorrections
     ]);
 }



 /**
 * Update specific field in attendance record
 */
/**
 * Update specific field in attendance record
 */
/**
 * Update specific field in attendance record with full recalculation
 */
/**
 * Update specific field in attendance record with immediate recalculation
 */
/**
 * Update specific field in attendance record with immediate recalculation
 */
/**
 * Update specific field in attendance record with immediate recalculation
 */
/**
 * Update specific field in attendance record with immediate recalculation - FIXED VERSION
 */
public function updateAttendanceField(Request $request, $id)
{
    \Log::info('✏️ BACKEND: updateAttendanceField called', [
        'attendance_id' => $id,
        'field' => $request->field,
        'value' => $request->value,
        'all_request_data' => $request->all()
    ]);

    try {
        $user = $request->user();
        
        // Check if user has HR role
        if (!in_array($user->role, ['admin', 'hr'])) {
            return back()->with('error', 'Unauthorized action.');
        }

        $attendanceLog = \App\Models\AttendanceLog::findOrFail($id);

        \Log::info('📊 BACKEND: Found attendance log', [
            'employee_id' => $attendanceLog->employee_id,
            'work_date' => $attendanceLog->work_date,
            'current_time_in' => $attendanceLog->time_in,
            'current_schedule_start' => $attendanceLog->schedule_start,
            'current_late_minutes' => $attendanceLog->late_minutes,
            'current_remarks' => $attendanceLog->remarks
        ]);

        $field = $request->field;
        $value = $request->value;

        $updateData = [];

        switch ($field) {
            case 'time_in':
            case 'time_out':
            case 'break_start':
            case 'break_end':
                if ($value) {
                    // Convert time to full datetime using the CORRECT work date
                    $updateData[$field] = $attendanceLog->work_date->format('Y-m-d') . ' ' . $value . ':00';
                    \Log::info("🕒 BACKEND: Setting {$field}", [
                        'input_value' => $value,
                        'converted_value' => $updateData[$field]
                    ]);
                } else {
                    $updateData[$field] = null;
                }
                break;

            case 'schedule':
                // Handle both schedule_start and schedule_end from the same edit
                if ($request->has('schedule_start')) {
                    $updateData['schedule_start'] = $request->schedule_start ? $attendanceLog->work_date->format('Y-m-d') . ' ' . $request->schedule_start . ':00' : null;
                }
                if ($request->has('schedule_end')) {
                    $updateData['schedule_end'] = $request->schedule_end ? $attendanceLog->work_date->format('Y-m-d') . ' ' . $request->schedule_end . ':00' : null;
                }
                break;

            case 'schedule_start':
            case 'schedule_end':
                if ($value) {
                    // ✅ FIX: Use the CORRECT work date for schedule times
                    $updateData[$field] = $attendanceLog->work_date->format('Y-m-d') . ' ' . $value . ':00';
                    \Log::info("🕒 BACKEND: Setting {$field} with correct work date", [
                        'input_value' => $value,
                        'work_date' => $attendanceLog->work_date->format('Y-m-d'),
                        'converted_value' => $updateData[$field]
                    ]);
                } else {
                    $updateData[$field] = null;
                }
                break;

            case 'remarks':
                $updateData['remarks'] = $value;
                break;

            default:
                return back()->with('error', 'Invalid field specified.');
        }

        \Log::info('🔄 BACKEND: Before recalculation', [
            'update_data' => $updateData,
            'current_data' => [
                'time_in' => $attendanceLog->time_in,
                'time_out' => $attendanceLog->time_out,
                'schedule_start' => $attendanceLog->schedule_start,
                'schedule_end' => $attendanceLog->schedule_end
            ]
        ]);

        // ✅ CRITICAL FIX: Always recalculate ALL dependent fields when any time-related field changes
        if (in_array($field, ['time_in', 'time_out', 'break_start', 'break_end', 'schedule', 'schedule_start', 'schedule_end'])) {
            $recalculatedData = $this->recalculateAllAttendanceData($attendanceLog, $updateData);
            $updateData = array_merge($updateData, $recalculatedData);
            
            \Log::info('🎯 BACKEND: After recalculation', [
                'recalculated_fields' => $recalculatedData,
                'late_minutes_calculated' => $recalculatedData['late_minutes'] ?? 'NOT_SET',
                'remarks_calculated' => $recalculatedData['remarks'] ?? 'NOT_SET'
            ]);
        }

        // Update the record
        $attendanceLog->update($updateData);

        // Refresh the model to get updated data
        $attendanceLog->refresh();

        \Log::info('✅ BACKEND: Attendance field updated', [
            'attendance_id' => $id,
            'final_data_in_db' => [
                'time_in' => $attendanceLog->time_in,
                'schedule_start' => $attendanceLog->schedule_start, // Check if this is fixed
                'schedule_end' => $attendanceLog->schedule_end,     // Check if this is fixed
                'late_minutes' => $attendanceLog->late_minutes,
                'remarks' => $attendanceLog->remarks,
                'status' => $attendanceLog->status
            ]
        ]);

        // For Inertia requests, return a redirect back with success message
        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Attendance record updated successfully!');
        }

        // For API requests (if any), return JSON
        return response()->json([
            'success' => true,
            'message' => 'Attendance record updated successfully!',
            'data' => $this->formatLogData($attendanceLog)
        ]);

    } catch (\Exception $e) {
        \Log::error('❌ BACKEND: Failed to update attendance field', [
            'attendance_id' => $id,
            'field' => $request->field,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        if ($request->header('X-Inertia')) {
            return back()->with('error', 'Failed to update attendance record: ' . $e->getMessage());
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to update attendance record: ' . $e->getMessage()
        ], 500);
    }
}
/**
 * Recalculate ALL dependent attendance data
 */
/**
 * Recalculate ALL dependent attendance data with proper remarks generation
 */
/**
 * Recalculate ALL dependent attendance data with proper remarks generation
 */
private function recalculateAllAttendanceData($attendanceLog, $updateData)
{
    $recalculated = [];
    
    try {
        // Get the current or updated values
        $timeIn = $updateData['time_in'] ?? $attendanceLog->time_in;
        $timeOut = $updateData['time_out'] ?? $attendanceLog->time_out;
        $breakStart = $updateData['break_start'] ?? $attendanceLog->break_start;
        $breakEnd = $updateData['break_end'] ?? $attendanceLog->break_end;
        $scheduleStart = $updateData['schedule_start'] ?? $attendanceLog->schedule_start;
        $scheduleEnd = $updateData['schedule_end'] ?? $attendanceLog->schedule_end;

        // ✅ FIX: Ensure schedule dates match the work date
        $workDate = $attendanceLog->work_date;
        if ($scheduleStart && !str_contains($scheduleStart, $workDate->format('Y-m-d'))) {
            \Log::warning('⚠️ BACKEND: Fixing schedule_start date mismatch', [
                'current_schedule_start' => $scheduleStart,
                'work_date' => $workDate->format('Y-m-d'),
                'fixed_schedule_start' => $workDate->format('Y-m-d') . ' ' . \Carbon\Carbon::parse($scheduleStart)->format('H:i:s')
            ]);
            $scheduleStart = $workDate->format('Y-m-d') . ' ' . \Carbon\Carbon::parse($scheduleStart)->format('H:i:s');
            $updateData['schedule_start'] = $scheduleStart; // Also update the data to be saved
        }
        
        if ($scheduleEnd && !str_contains($scheduleEnd, $workDate->format('Y-m-d'))) {
            \Log::warning('⚠️ BACKEND: Fixing schedule_end date mismatch', [
                'current_schedule_end' => $scheduleEnd,
                'work_date' => $workDate->format('Y-m-d'),
                'fixed_schedule_end' => $workDate->format('Y-m-d') . ' ' . \Carbon\Carbon::parse($scheduleEnd)->format('H:i:s')
            ]);
            $scheduleEnd = $workDate->format('Y-m-d') . ' ' . \Carbon\Carbon::parse($scheduleEnd)->format('H:i:s');
            $updateData['schedule_end'] = $scheduleEnd; // Also update the data to be saved
        }

        \Log::info('🔄 BACKEND: Recalculating all attendance data', [
            'time_in' => $timeIn,
            'time_out' => $timeOut,
            'schedule_start' => $scheduleStart,
            'schedule_end' => $scheduleEnd
        ]);

        // Recalculate late minutes - FIXED VERSION
        $lateMinutes = 0;
        if ($timeIn && $scheduleStart) {
            \Log::info('🔍 BACKEND: Late calculation inputs', [
                'schedule_start' => $scheduleStart,
                'time_in' => $timeIn,
                'schedule_start_type' => gettype($scheduleStart),
                'time_in_type' => gettype($timeIn)
            ]);
            
            $scheduleStartTime = \Carbon\Carbon::parse($scheduleStart);
            $actualTimeIn = \Carbon\Carbon::parse($timeIn);
            
            \Log::info('🔍 BACKEND: Parsed times', [
                'schedule_start_parsed' => $scheduleStartTime->format('Y-m-d H:i:s'),
                'time_in_parsed' => $actualTimeIn->format('Y-m-d H:i:s'),
                'schedule_time' => $scheduleStartTime->format('H:i:s'),
                'time_in_time' => $actualTimeIn->format('H:i:s')
            ]);
            
            if ($actualTimeIn->greaterThan($scheduleStartTime)) {
                $lateMinutes = $actualTimeIn->diffInMinutes($scheduleStartTime);
                \Log::info('🔍 BACKEND: Late minutes calculated', [
                    'late_minutes' => $lateMinutes,
                    'is_late' => true
                ]);
            } else {
                $lateMinutes = 0;
                \Log::info('🔍 BACKEND: No late minutes', [
                    'late_minutes' => 0,
                    'is_late' => false
                ]);
            }
            
        } else {
            $lateMinutes = 0;
            \Log::info('🔍 BACKEND: Missing data for late calculation', [
                'has_time_in' => !empty($timeIn),
                'has_schedule_start' => !empty($scheduleStart)
            ]);
        }
        $recalculated['late_minutes'] = $lateMinutes;

        // Recalculate hours worked using the service
        if ($timeIn && $timeOut) {
            $recalculated['hrs_worked_minutes'] = $this->importService->calculateHoursWorked(
                $timeIn, 
                $timeOut, 
                $breakStart, 
                $breakEnd,
                $scheduleStart,
                $scheduleEnd
            );
            
            \Log::info('⏱️ BACKEND: Hours worked recalculated', [
                'time_in' => $timeIn,
                'time_out' => $timeOut,
                'calculated_minutes' => $recalculated['hrs_worked_minutes']
            ]);
        } else {
            $recalculated['hrs_worked_minutes'] = 0;
        }

        // Recalculate undertime
        $undertimeData = $this->calculateUndertimeForUpdate($timeOut, $scheduleEnd, $attendanceLog->absent);
        $recalculated = array_merge($recalculated, $undertimeData);

        // ✅ CRITICAL FIX: Update status and remarks based on recalculated data
        $recalculated['absent'] = false; // Since we're editing, it's not absent
        $recalculated['status'] = $lateMinutes > 0 ? 'Late' : 'Present';
        
        // ✅ Generate proper remarks based on the recalculated late minutes
        $recalculated['remarks'] = $this->generateRemarksForUpdate($lateMinutes, $timeIn, $timeOut);

        \Log::info('✅ BACKEND: All fields recalculated', $recalculated);

    } catch (\Exception $e) {
        \Log::error('❌ BACKEND: Error recalculating attendance data', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
    }
    
    return $recalculated;
}

/**
 * Generate remarks for update operation with proper late handling
 */
private function generateRemarksForUpdate($lateMinutes, $timeIn, $timeOut)
{
    if (!$timeIn && !$timeOut) {
        return 'No Time Records';
    }

    if (!$timeIn) {
        return 'No Time In';
    }

    if (!$timeOut) {
        return 'No Time Out';
    }

    // ✅ CRITICAL: Generate proper late remarks
    if ($lateMinutes > 0) {
        return "Late by {$lateMinutes} minute" . ($lateMinutes > 1 ? 's' : '');
    }

    return 'On Time';
}
/**
 * Calculate undertime for update operation
 */
private function calculateUndertimeForUpdate($timeOut, $scheduleEnd, $isAbsent)
{
    $result = [
        'has_undertime' => false,
        'undertime_minutes' => 0,
        'undertime_formatted' => '',
        'is_early_out' => false
    ];

    // Skip if no schedule end or time out or absent
    if (!$scheduleEnd || !$timeOut || $isAbsent) {
        return $result;
    }

    try {
        // Parse schedule end time
        $scheduleEndTime = \Carbon\Carbon::parse($scheduleEnd);
        $timeOutTime = \Carbon\Carbon::parse($timeOut);

        // Check if time out is earlier than schedule end
        if ($timeOutTime->lessThan($scheduleEndTime)) {
            $undertimeMinutes = $scheduleEndTime->diffInMinutes($timeOutTime);
            
            // Only count as undertime if it's significant (more than 5 minutes)
            if ($undertimeMinutes > 5) {
                $result['has_undertime'] = true;
                $result['undertime_minutes'] = $undertimeMinutes;
                $result['undertime_formatted'] = $this->formatUndertimeMinutes($undertimeMinutes);
                $result['is_early_out'] = true;
            }
        }

    } catch (\Exception $e) {
        \Log::error("Error calculating undertime for update", [
            'schedule_end' => $scheduleEnd,
            'time_out' => $timeOut,
            'error' => $e->getMessage()
        ]);
    }

    return $result;
}

/**
 * Generate remarks for update operation
 */
/**
 * Generate remarks for update operation with proper late handling
 */


// private function recalculateAttendanceData($attendanceLog, $updateData)
// {
//     $recalculated = [];
    
//     try {
//         // Recalculate hours worked
//         if (isset($updateData['time_in']) && isset($updateData['time_out'])) {
//             $timeIn = \Carbon\Carbon::parse($updateData['time_in']);
//             $timeOut = \Carbon\Carbon::parse($updateData['time_out']);
            
//             $totalMinutes = $timeOut->diffInMinutes($timeIn);
            
//             // Deduct break time if provided
//             if (isset($updateData['break_start']) && isset($updateData['break_end'])) {
//                 $breakStart = \Carbon\Carbon::parse($updateData['break_start']);
//                 $breakEnd = \Carbon\Carbon::parse($updateData['break_end']);
//                 $breakMinutes = $breakEnd->diffInMinutes($breakStart);
//                 $totalMinutes -= $breakMinutes;
//             } else {
//                 // Default 1-hour break deduction
//                 $totalMinutes -= 60;
//             }
            
//             $recalculated['hrs_worked_minutes'] = max(0, $totalMinutes);
//         }
        
//         // Recalculate late minutes
//         if (isset($updateData['time_in']) && $attendanceLog->schedule_start) {
//             $scheduleStart = \Carbon\Carbon::parse($attendanceLog->schedule_start);
//             $actualTimeIn = \Carbon\Carbon::parse($updateData['time_in']);
            
//             if ($actualTimeIn->greaterThan($scheduleStart)) {
//                 $recalculated['late_minutes'] = $actualTimeIn->diffInMinutes($scheduleStart);
//             } else {
//                 $recalculated['late_minutes'] = 0;
//             }
//         }
        
//         // Update status
//         if (isset($updateData['time_in']) && isset($updateData['time_out'])) {
//             $recalculated['absent'] = false;
//             $recalculated['status'] = $recalculated['late_minutes'] > 0 ? 'Late' : 'Present';
//         }
        
//     } catch (\Exception $e) {
//         \Log::error('Error recalculating attendance data', [
//             'error' => $e->getMessage()
//         ]);
//     }
    
//     return $recalculated;
// }
}
