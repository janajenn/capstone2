<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\AttendanceLog;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AttendanceLogsController extends Controller
{
    /**
     * Display the employee's attendance logs
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        
        // Get the employee record for the authenticated user
        $employee = Employee::where('employee_id', $user->employee_id)->first();
        
        if (!$employee) {
            return redirect()->back()->withErrors([
                'message' => 'Employee record not found. Please contact HR.'
            ]);
        }

        // Get ALL attendance logs for the employee first
        $allAttendanceLogs = AttendanceLog::where('employee_id', $employee->employee_id)
            ->orderBy('work_date', 'desc')
            ->get();

        // Get query parameters - default to the most recent month with data
        $defaultMonth = $allAttendanceLogs->isNotEmpty() 
            ? $allAttendanceLogs->first()->work_date->format('Y-m')
            : Carbon::now()->format('Y-m');
            
        $month = $request->get('month', $defaultMonth);
        $period = $request->get('period', 'full'); // 'first_half', 'second_half', 'full'
        
        // If we have data but it's not in the current month, adjust the date range to show the actual data
        if ($allAttendanceLogs->isNotEmpty()) {
            $earliestDate = $allAttendanceLogs->min('work_date');
            $latestDate = $allAttendanceLogs->max('work_date');
            
            // If the requested month doesn't contain any data, adjust to show the actual data range
            $requestedStart = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
            $requestedEnd = $requestedStart->copy()->endOfMonth();
            
            if ($latestDate < $requestedStart || $earliestDate > $requestedEnd) {
                // No data in requested month, adjust to show the actual data range
                $month = $earliestDate->format('Y-m');
                \Log::info('Adjusted month to show actual data', [
                    'requested_month' => $request->get('month'),
                    'adjusted_month' => $month,
                    'data_range' => $earliestDate->format('Y-m-d') . ' to ' . $latestDate->format('Y-m-d')
                ]);
            }
        }
        
        // Parse month and year
        $startDate = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();
        
        // Adjust date range based on period filter
        if ($period === 'first_half') {
            $endDate = $startDate->copy()->addDays(14); // 1-15
        } elseif ($period === 'second_half') {
            $startDate = $startDate->copy()->addDays(15); // 16-end
        }

        // Debug logging
        \Log::info('Employee attendance logs query', [
            'employee_id' => $employee->employee_id,
            'total_logs_found' => $allAttendanceLogs->count(),
            'logs' => $allAttendanceLogs->take(5)->map(function ($log) {
                return [
                    'id' => $log->id,
                    'work_date' => $log->work_date,
                    'time_in' => $log->time_in,
                    'time_out' => $log->time_out,
                    'absent' => $log->absent
                ];
            })
        ]);

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

        // Debug logging
        \Log::info('Rendering attendance logs', [
            'employee_id' => $employee->employee_id,
            'total_logs' => $allAttendanceLogs->count(),
            'filtered_logs' => $attendanceLogs->count(),
            'complete_view_count' => $completeAttendanceView->count(),
            'sample_data' => $completeAttendanceView->take(2)->toArray()
        ]);
        
        // Debug specific log data
        $sampleLog = $attendanceLogs->first();
        if ($sampleLog) {
            \Log::info('Sample log data', [
                'raw_log' => $sampleLog->toArray(),
                'formatted_data' => $this->formatLogData($sampleLog)
            ]);
        }
        
        // Debug date matching
        \Log::info('Date matching debug', [
            'sample_log_date' => $attendanceLogs->first()?->work_date->format('Y-m-d'),
            'sample_period_date' => $allDaysInPeriod->first()?->format('Y-m-d'),
            'attendance_logs_count' => $attendanceLogs->count(),
            'days_in_period' => $allDaysInPeriod->count()
        ]);

        return Inertia::render('Employee/AttendanceLogs', [
            'employee' => [
                'employee_id' => $employee->employee_id,
                'firstname' => $employee->firstname,
                'lastname' => $employee->lastname,
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
     * Format schedule times
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
}
