<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Services\AttendanceImportService;
use App\Services\LeaveCreditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

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
                // ✅ CRITICAL: Process late credits IMMEDIATELY after successful import
                $leaveCreditService = new LeaveCreditService();
                $lateCreditResult = $leaveCreditService->processLateCreditsForRecentImports();
                
                \Log::info("✅ Automatic late credit processing completed", $lateCreditResult);
    
                return redirect()->back()->with([
                    'success' => "Successfully imported {$result['success_count']} records. " . 
                               "Processed late credits for {$lateCreditResult['processed_count']} employees.",
                    'importResult' => $result,
                    'lateCreditResult' => $lateCreditResult
                ]);
            }
    
        } catch (\Exception $e) {
            \Log::error('Import failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Import failed: ' . $e->getMessage()]);
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

        return \Inertia\Inertia::render('HR/AttendanceLogs', [
            'initialLogs' => $employees,
            'employees' => \App\Models\Employee::select('employee_id', 'firstname', 'lastname')->get()
        ]);
    }

    /**
     * Get attendance logs with pagination
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

        // Add attendance summary for each employee
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

        return response()->json([
            'data' => $employeesWithSummary,
            'total' => $employeesWithSummary->count()
        ]);
    }

    /**
     * View individual employee attendance logs
     */
    public function viewEmployeeLogs($employeeId, Request $request)
    {
        $employee = \App\Models\Employee::with('department')->findOrFail($employeeId);
        
        // Get query parameters
        $month = $request->get('month', \Carbon\Carbon::now()->format('Y-m'));
        $period = $request->get('period', 'full'); // 'first_half', 'second_half', 'full'
        
        // Parse month and year
        $startDate = \Carbon\Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();
        
        // Adjust date range based on period filter
        if ($period === 'first_half') {
            $endDate = $startDate->copy()->addDays(14); // 1-15
        } elseif ($period === 'second_half') {
            $startDate = $startDate->copy()->addDays(15); // 16-end
        }

        // Get ALL attendance logs for the employee
        $allAttendanceLogs = \App\Models\AttendanceLog::where('employee_id', $employeeId)
            ->orderBy('work_date', 'desc')
            ->get();

        // If we have data but it's not in the current month, adjust the date range to show the actual data
        if ($allAttendanceLogs->isNotEmpty()) {
            $earliestDate = $allAttendanceLogs->min('work_date');
            $latestDate = $allAttendanceLogs->max('work_date');
            
            // If the requested month doesn't contain any data, adjust to show the actual data range
            $requestedStart = \Carbon\Carbon::createFromFormat('Y-m', $month)->startOfMonth();
            $requestedEnd = $requestedStart->copy()->endOfMonth();
            
            if ($latestDate < $requestedStart || $earliestDate > $requestedEnd) {
                // No data in requested month, adjust to show the actual data range
                $month = $earliestDate->format('Y-m');
            }
        }

        // Recalculate dates with adjusted month
        $startDate = \Carbon\Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();
        
        // Adjust date range based on period filter
        if ($period === 'first_half') {
            $endDate = $startDate->copy()->addDays(14); // 1-15
        } elseif ($period === 'second_half') {
            $startDate = $startDate->copy()->addDays(15); // 16-end
        }

        // Filter by date range
        $attendanceLogs = $allAttendanceLogs->filter(function ($log) use ($startDate, $endDate) {
            return $log->work_date >= $startDate && $log->work_date <= $endDate;
        });
        
        // Generate all days in the selected period for complete view
        $allDaysInPeriod = collect();
        $currentDate = $startDate->copy();
        while ($currentDate <= $endDate) {
            $allDaysInPeriod->push($currentDate->copy());
            $currentDate->addDay();
        }
        
        // Create a complete view with all days, filling in missing days
        $completeAttendanceView = $allDaysInPeriod->map(function ($date) use ($attendanceLogs) {
            // Convert date to Carbon for proper comparison
            $dateString = $date->format('Y-m-d');
            
            $log = $attendanceLogs->first(function ($log) use ($dateString) {
                return $log->work_date->format('Y-m-d') === $dateString;
            });
            
            if ($log) {
                return [
                    'date' => $dateString,
                    'date_formatted' => $date->format('M d, Y'),
                    'day_of_week' => $date->format('l'),
                    'has_log' => true,
                    'log_data' => $this->formatLogData($log)
                ];
            } else {
                // No log for this day - determine if it's a rest day or absent
                $isWeekend = $date->isWeekend();
                $isRestDay = $isWeekend; // You can add more logic here for holidays, etc.
                
                return [
                    'date' => $dateString,
                    'date_formatted' => $date->format('M d, Y'),
                    'day_of_week' => $date->format('l'),
                    'has_log' => false,
                    'status' => $isRestDay ? 'Rest Day' : 'Absent',
                    'log_data' => null
                ];
            }
        });

        // Calculate summary statistics
        $totalDays = $startDate->diffInDays($endDate) + 1;
        $workingDays = $attendanceLogs->where('absent', false)->count();
        $absentDays = $attendanceLogs->where('absent', true)->count();
        $restDays = $totalDays - $workingDays - $absentDays;
        
        $totalHoursWorked = $attendanceLogs->sum('hrs_worked_minutes') / 60;
        $totalLateMinutes = $attendanceLogs->sum('late_minutes');
        
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
            'attendanceLogs' => $completeAttendanceView->values(),
            'summary' => [
                'total_days' => $totalDays,
                'working_days' => $workingDays,
                'absent_days' => $absentDays,
                'rest_days' => $restDays,
                'total_hours_worked' => round($totalHoursWorked, 2),
                'total_late_minutes' => $totalLateMinutes,
                'average_hours_per_day' => $workingDays > 0 ? round($totalHoursWorked / $workingDays, 2) : 0
            ],
            'filters' => [
                'month' => $month,
                'period' => $period,
                'available_months' => $availableMonths
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



    private function formatLogData($log)
    {
        \Log::info("DEBUG Accessors", [
            'schedule_start' => $log->schedule_start,
            'schedule_start_formatted' => $log->schedule_start_formatted,
            'schedule_formatted' => $log->schedule_formatted,
            'time_in' => $log->time_in,
            'time_in_formatted' => $log->time_in_formatted,
        ]);
        
        return [
            'id' => $log->id,
            'schedule_start' => $log->schedule_start,
            'schedule_end' => $log->schedule_end,
            'schedule_formatted' => $log->schedule_formatted,
            'time_in' => $log->time_in_formatted,
            'time_out' => $log->time_out_formatted,
            'break_start' => $log->break_start,
            'break_end' => $log->break_end,
            'break_formatted' => $log->break_formatted,
            'hrs_worked_minutes' => $log->hrs_worked_minutes,
            'hrs_worked_formatted' => $log->hrs_worked_formatted,
            'late_minutes' => $log->late_minutes,
            'late_formatted' => $log->late_formatted,
            'remarks' => $log->remarks,
            'absent' => $log->absent,
            'status' => $log->status
        ];
    }

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
}
