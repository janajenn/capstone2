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
        $employee = Employee::where('employee_id', $user->employee_id)
            ->with('department')
            ->first();
        
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
        $period = $request->get('period', 'full');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $attendanceIssue = $request->get('attendance_issue');
        $hoursThreshold = $request->get('hours_threshold', 8);
        $lateThreshold = $request->get('late_threshold', 10);
        
        // Base query for filtering
        $filteredLogs = $allAttendanceLogs;

        // Apply date range filters
        if ($startDate && $endDate) {
            $filteredLogs = $filteredLogs->filter(function ($log) use ($startDate, $endDate) {
                return $log->work_date >= $startDate && $log->work_date <= $endDate;
            });
        } else {
            // Use month/period filtering if no custom date range
            $startDateObj = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
            $endDateObj = $startDateObj->copy()->endOfMonth();
            
            if ($period === 'first_half') {
                $endDateObj = $startDateObj->copy()->addDays(14);
            } elseif ($period === 'second_half') {
                $startDateObj = $startDateObj->copy()->addDays(15);
            }
            
            $filteredLogs = $filteredLogs->filter(function ($log) use ($startDateObj, $endDateObj) {
                return $log->work_date >= $startDateObj && $log->work_date <= $endDateObj;
            });
        }

        // Apply attendance issue filters
        if ($attendanceIssue) {
            $filteredLogs = $filteredLogs->filter(function ($log) use ($attendanceIssue, $hoursThreshold, $lateThreshold) {
                switch ($attendanceIssue) {
                    case 'late':
                        return $log->status === 'Late';
                    case 'missing_time_out':
                        return !$log->time_out && $log->time_in;
                    case 'missing_time_in':
                        return !$log->time_in && $log->time_out;
                    case 'absent':
                        return $log->absent || (!$log->time_in && !$log->time_out);
                    case 'insufficient_hours':
                        return $log->hrs_worked_minutes < ($hoursThreshold * 60);
                    default:
                        return true;
                }
            });
        }

        // Generate all days in the selected period for complete view
        $dateRangeStart = $startDate ? Carbon::parse($startDate) : Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $dateRangeEnd = $endDate ? Carbon::parse($endDate) : $dateRangeStart->copy()->endOfMonth();
        
        if ($period === 'first_half' && !$startDate) {
            $dateRangeEnd = $dateRangeStart->copy()->addDays(14);
        } elseif ($period === 'second_half' && !$startDate) {
            $dateRangeStart = $dateRangeStart->copy()->addDays(15);
        }

        $allDaysInPeriod = collect();
        $currentDate = $dateRangeStart->copy();
        while ($currentDate <= $dateRangeEnd) {
            $allDaysInPeriod->push($currentDate->copy());
            $currentDate->addDay();
        }

        // Create a complete view with all days, filling in missing days
        $completeAttendanceView = $allDaysInPeriod->map(function ($date) use ($filteredLogs) {
            $dateString = $date->format('Y-m-d');
            
            $log = $filteredLogs->first(function ($log) use ($dateString) {
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
                $isRestDay = $isWeekend;
                
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
        $totalDays = $dateRangeStart->diffInDays($dateRangeEnd) + 1;
        $workingDays = $filteredLogs->where('absent', false)->count();
        $absentDays = $filteredLogs->where('absent', true)->count();
        $restDays = $totalDays - $workingDays - $absentDays;
        
        $totalHoursWorked = $filteredLogs->sum('hrs_worked_minutes') / 60;
        $totalLateMinutes = $filteredLogs->sum('late_minutes');
        $lateCount = $filteredLogs->where('status', 'Late')->count();

        // Get available months for dropdown from all logs
        $availableMonths = $allAttendanceLogs->map(function ($log) {
            return $log->work_date->format('Y-m');
        })->unique()->sort()->values();

        return Inertia::render('Employee/AttendanceLogs', [
           'employee' => $employee->only([
        'employee_id', 
        'firstname', 
        'lastname', 
        'biometric_id', 
        'position'
    ]) + [
        'department' => $employee->department ? [
            'id' => $employee->department->id,
            'name' => $employee->department->name
        ] : null
    ],
            'attendanceLogs' => $completeAttendanceView->values(),
            'summary' => [
                'total_days' => $totalDays,
                'working_days' => $workingDays,
                'absent_days' => $absentDays,
                'rest_days' => $restDays,
                'total_hours_worked' => round($totalHoursWorked, 2),
                'total_late_minutes' => $totalLateMinutes,
                'average_hours_per_day' => $workingDays > 0 ? round($totalHoursWorked / $workingDays, 2) : 0,
                'late_count' => $lateCount,
                'filtered_count' => $completeAttendanceView->count()
            ],
            'filters' => [
                'month' => $month,
                'period' => $period,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'attendance_issue' => $attendanceIssue,
                'hours_threshold' => $hoursThreshold,
                'late_threshold' => $lateThreshold,
                'available_months' => $availableMonths
            ]
        ]);
    }

    /**
     * Format log data for display
     */
    private function formatLogData($log)
    {
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
