<?php

namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\IOFactory;

class AttendanceImportService
{
    protected $errors = [];
    protected $successCount = 0;
    protected $processedRows = [];
    protected $currentEmployee = null;

    public function importFromExcel($filePath, $options = [])
    {
        $this->errors = [];
        $this->successCount = 0;
        $this->processedRows = [];
        $this->currentEmployee = null;

        try {
            $spreadsheet = IOFactory::load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            \Log::info("Excel file loaded successfully", [
                'total_rows' => count($rows),
                'first_few_rows' => array_slice($rows, 0, 10)
            ]);

            foreach ($rows as $rowIndex => $row) {
                try {
                    $this->processRow($row, $rowIndex + 1, $options);
                } catch (\Exception $e) {
                    \Log::error("Error processing row " . ($rowIndex + 1), [
                        'error' => $e->getMessage(),
                        'row' => $row
                    ]);
                    $this->addError($rowIndex + 1, "Error processing row: " . $e->getMessage());
                }
            }

            return [
                'success' => true,
                'success_count' => $this->successCount,
                'error_count' => count($this->errors),
                'errors' => $this->errors,
                'processed_rows' => $this->processedRows
            ];

        } catch (\Exception $e) {
            Log::error('Attendance import failed: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to process Excel file: ' . $e->getMessage(),
                'errors' => $this->errors
            ];
        }
    }

    protected function processRow($row, $rowNumber, $options = [])
    {
        if (!is_array($row) || empty($row) || !isset($row[0])) {
            return;
        }

        $firstCell = $row[0];

        // Check if this is an employee header row (contains name and biometric code)
        if (is_string($firstCell) && $this->isEmployeeHeader($firstCell)) {
            $employeeInfo = $this->extractEmployeeInfo($firstCell);
            
            if ($employeeInfo) {
                $this->currentEmployee = Employee::where('biometric_id', $employeeInfo['biometric_id'])->first();
                
                if ($this->currentEmployee) {
                    \Log::info("Set current employee: {$this->currentEmployee->firstname} {$this->currentEmployee->lastname} (Biometric ID: {$employeeInfo['biometric_id']})");
                    
                    // Log for verification
                    \Log::info("Employee details", [
                        'extracted_name' => $employeeInfo['name'],
                        'extracted_biometric_id' => $employeeInfo['biometric_id'],
                        'found_employee_id' => $this->currentEmployee->employee_id,
                        'found_name' => $this->currentEmployee->firstname . ' ' . $this->currentEmployee->lastname
                    ]);
                } else {
                    $this->addError($rowNumber, "Employee not found with biometric ID: {$employeeInfo['biometric_id']} - Name: {$employeeInfo['name']}");
                }
            }
            return; // Skip processing employee header rows as attendance data
        }

        // Skip if no current employee is set
        if (!$this->currentEmployee) {
            \Log::warning("Skipping row {$rowNumber} - no current employee set");
            return;
        }

        // Skip if this is not a date row (header, empty, or other non-date content)
        if (!is_string($firstCell) || empty(trim($firstCell)) || $this->isHeaderRow($firstCell)) {
            return;
        }

        // Parse the date (format: "08/01/2025 Fri")
        $workDate = $this->parseDateFromString(trim($firstCell));
        if (!$workDate) {
            $this->addError($rowNumber, "Invalid date format: {$firstCell}");
            return;
        }

        // Check if rest day
        $remarks = isset($row[2]) ? trim($row[2]) : '';
        if (strtoupper($remarks) === 'RESTDAY') {
            $this->processedRows[] = [
                'row' => $rowNumber,
                'employee' => $this->currentEmployee->firstname . ' ' . $this->currentEmployee->lastname,
                'date' => $workDate->format('Y-m-d'),
                'status' => 'RESTDAY (Skipped)'
            ];
            \Log::info("Skipped rest day for {$this->currentEmployee->firstname} on {$workDate->format('Y-m-d')}");
            return;
        }

        // Parse schedule (Column B: "8:00 AM - 5:00 PM")
        $scheduleString = isset($row[1]) ? trim($row[1]) : '';
        $scheduleParts = $this->parseScheduleString($scheduleString);
        
        // Parse times
        $timeIn = $this->parseTime(isset($row[4]) ? $row[4] : null, $workDate);
        $timeOut = $this->parseTimeOut(isset($row[6]) ? $row[6] : null, $workDate);
        $breakTimes = $this->parseBreakTimes(isset($row[5]) ? $row[5] : null);

        // Check absent flag (Column D: 1 or 0)
        $absentFlag = isset($row[3]) ? intval($row[3]) : 0;
        $isAbsent = $absentFlag === 1;

        // Calculate derived fields
        $lateMinutes = $this->calculateLateMinutes($scheduleParts['start'] ?? null, $timeIn);
        $hoursWorked = $this->calculateHoursWorked($timeIn, $timeOut, $breakTimes['start'] ?? null, $breakTimes['end'] ?? null);

        // Use existing remarks or generate new ones
        if (empty($remarks)) {
            $remarks = $this->generateRemarks($lateMinutes, $timeIn, $timeOut, $isAbsent);
        }

        // Check for existing record
        $existingLog = AttendanceLog::where('employee_id', $this->currentEmployee->employee_id)
            ->where('work_date', $workDate)
            ->first();

        if ($existingLog && !($options['overwrite'] ?? false)) {
            $this->addError($rowNumber, "Record already exists for {$this->currentEmployee->firstname} on {$workDate->format('Y-m-d')}");
            return;
        }

        // Prepare attendance data
        $attendanceData = [
            'employee_id' => $this->currentEmployee->employee_id,
            'work_date' => $workDate,
            'schedule_start' => $scheduleParts['start'] ?? null,
            'schedule_end' => $scheduleParts['end'] ?? null,
            'time_in' => $timeIn,
            'time_out' => $timeOut,
            'break_start' => $breakTimes['start'] ?? null,
            'break_end' => $breakTimes['end'] ?? null,
            'hrs_worked_minutes' => $hoursWorked,
            'late_minutes' => $lateMinutes,
            'remarks' => $remarks,
            'absent' => $isAbsent,
            'raw_row' => json_encode($row)
        ];

        \Log::info("Prepared attendance data", [
            'employee_id' => $this->currentEmployee->employee_id,
            'work_date' => $workDate->format('Y-m-d'),
            'schedule_start' => $scheduleParts['start'],
            'schedule_end' => $scheduleParts['end'],
            'time_in' => $timeIn ? $timeIn->format('Y-m-d H:i:s') : null,
            'late_minutes' => $lateMinutes
        ]);

        // Save record
        if ($existingLog) {
            $existingLog->update($attendanceData);
            $action = 'updated';
        } else {
            AttendanceLog::create($attendanceData);
            $action = 'created';
        }

        $this->successCount++;
        $this->processedRows[] = [
            'row' => $rowNumber,
            'employee' => $this->currentEmployee->firstname . ' ' . $this->currentEmployee->lastname,
            'date' => $workDate->format('Y-m-d'),
            'status' => $action,
            'time_in' => $timeIn ? $timeIn->format('H:i') : 'None',
            'time_out' => $timeOut ? $timeOut->format('H:i') : 'None',
            'hours_worked' => $this->formatMinutesToHours($hoursWorked),
            'late_minutes' => $lateMinutes
        ];

        \Log::info("Successfully processed attendance for {$this->currentEmployee->firstname} on {$workDate->format('Y-m-d')}", [
            'employee_id' => $this->currentEmployee->employee_id,
            'time_in' => $timeIn ? $timeIn->format('H:i:s') : null,
            'time_out' => $timeOut ? $timeOut->format('H:i:s') : null,
            'absent' => $isAbsent
        ]);
    }

    /**
     * Check if a row is an employee header (contains name and biometric ID in parentheses)
     */
    protected function isEmployeeHeader($cellContent)
    {
        return preg_match('/[A-Za-z\s,]+\(\d+\)/', $cellContent);
    }

    /**
     * Extract employee name and biometric ID from header string
     */
    protected function extractEmployeeInfo($headerString)
    {
        // Pattern to match: "Actub, Joseph A.     (22)"
        if (preg_match('/([A-Za-z\s,]+)\((\d+)\)/', $headerString, $matches)) {
            $name = trim($matches[1]);
            $biometricId = trim($matches[2]);
            
            return [
                'name' => $name,
                'biometric_id' => $biometricId
            ];
        }
        
        return null;
    }

    /**
     * Check if a row is a header row (contains column headers)
     */
    protected function isHeaderRow($cellContent)
    {
        $headerPatterns = ['Date', 'Schedule', 'Remarks', 'Absent', 'Time IN', 'Breaks', 'Time Out', 'Hrs Work', 'Late'];
        
        foreach ($headerPatterns as $pattern) {
            if (stripos($cellContent, $pattern) !== false) {
                return true;
            }
        }
        
        return false;
    }

    protected function parseDateFromString($dateString)
    {
        try {
            // Extract date part from "08/01/2025 Fri"
            $datePart = explode(' ', $dateString)[0];
            return Carbon::createFromFormat('m/d/Y', $datePart)->startOfDay();
        } catch (\Exception $e) {
            \Log::warning("Could not parse date: {$dateString}", ['error' => $e->getMessage()]);
            return null;
        }
    }

    protected function parseScheduleString($scheduleString)
{
    if (empty($scheduleString)) {
        return ['start' => null, 'end' => null];
    }

    try {
        $parts = explode(' - ', $scheduleString);
        if (count($parts) === 2) {
            // IMPORTANT: Store as TIME only, not datetime
            $startTime = Carbon::parse(trim($parts[0]))->format('H:i:s');
            $endTime = Carbon::parse(trim($parts[1]))->format('H:i:s');
            
            \Log::info("Parsed schedule", [
                'original' => $scheduleString,
                'start' => $startTime,
                'end' => $endTime
            ]);
            
            return [
                'start' => $startTime,  // This should be "08:00:00" not "2025-10-05 08:00:00"
                'end' => $endTime
            ];
        }
    } catch (\Exception $e) {
        \Log::warning("Failed to parse schedule string: {$scheduleString}", ['error' => $e->getMessage()]);
    }

    return ['start' => null, 'end' => null];
}
    protected function parseTime($timeString, $workDate)
    {
        if (empty($timeString)) {
            return null;
        }

        try {
            $time = Carbon::parse($timeString);
            return $workDate->copy()->setTimeFromTimeString($time->format('H:i:s'));
        } catch (\Exception $e) {
            return null;
        }
    }

    protected function parseTimeOut($timeString, $workDate)
    {
        if (empty($timeString)) {
            return null;
        }

        try {
            // Handle format like "8/4/2025 6:02 PM"
            return Carbon::parse($timeString);
        } catch (\Exception $e) {
            return null;
        }
    }

    protected function parseBreakTimes($breakString)
    {
        if (empty($breakString)) {
            return ['start' => null, 'end' => null];
        }

        try {
            // Handle format like "12:15 PM - 12:53 PM"
            $parts = explode(' - ', $breakString);
            if (count($parts) === 2) {
                return [
                    'start' => Carbon::parse(trim($parts[0]))->format('H:i:s'),
                    'end' => Carbon::parse(trim($parts[1]))->format('H:i:s')
                ];
            }
        } catch (\Exception $e) {
            // Ignore parsing errors for malformed break times
        }

        return ['start' => null, 'end' => null];
    }

    protected function calculateLateMinutes($scheduleStart, $timeIn)
    {
        if (!$scheduleStart || !$timeIn) {
            \Log::info("Cannot calculate late minutes", [
                'schedule_start' => $scheduleStart,
                'time_in' => $timeIn,
                'reason' => !$scheduleStart ? 'no_schedule' : 'no_time_in'
            ]);
            return 0;
        }
    
        try {
            // Parse schedule start time (time only)
            $scheduleTime = null;
            if (is_string($scheduleStart)) {
                // Handle different time formats
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
            
            \Log::info("Debug time comparison", [
                'schedule_start_raw' => $scheduleStart,
                'schedule_parsed' => $scheduleTime->format('Y-m-d H:i:s'),
                'time_in_raw' => $timeIn,
                'time_in_parsed' => $timeInTime->format('Y-m-d H:i:s'),
                'schedule_time' => $scheduleTime->format('H:i:s'),
                'time_in_time' => $timeInTime->format('H:i:s')
            ]);
            
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
            
            \Log::info("Time-only comparison", [
                'schedule_time_only' => $scheduleTimeOnly->format('H:i:s'),
                'time_in_time_only' => $timeInTimeOnly->format('H:i:s'),
                'is_late' => $timeInTimeOnly->greaterThan($scheduleTimeOnly)
            ]);
            
            // Only calculate late minutes if time in is AFTER schedule start
            if ($timeInTimeOnly->greaterThan($scheduleTimeOnly)) {
                $lateMinutes = $timeInTimeOnly->diffInMinutes($scheduleTimeOnly);
                \Log::info("Employee is late", [
                    'late_minutes' => $lateMinutes,
                    'schedule_time' => $scheduleTimeOnly->format('H:i:s'),
                    'actual_time' => $timeInTimeOnly->format('H:i:s')
                ]);
                return $lateMinutes;
            }
    
            \Log::info("Employee is on time or early", [
                'schedule_time' => $scheduleTimeOnly->format('H:i:s'),
                'actual_time' => $timeInTimeOnly->format('H:i:s')
            ]);
            return 0;
            
        } catch (\Exception $e) {
            \Log::error("Error calculating late minutes", [
                'schedule_start' => $scheduleStart,
                'time_in' => $timeIn,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 0;
        }
    }


    public function debugLateCalculation()
    {
        // Test the specific case from your logs
        $scheduleStart = "08:00:00";
        $timeIn = "2025-09-12 08:01:00";
        
        \Log::info("🔍 DEBUG: Testing late calculation", [
            'schedule_start' => $scheduleStart,
            'time_in' => $timeIn
        ]);
        
        $lateMinutes = $this->calculateLateMinutes($scheduleStart, $timeIn);
        
        \Log::info("🔍 DEBUG: Late calculation result", [
            'late_minutes' => $lateMinutes,
            'expected' => 1
        ]);
        
        return $lateMinutes;
    }


    protected function calculateHoursWorked($timeIn, $timeOut, $breakStart, $breakEnd)
    {
        if (!$timeIn || !$timeOut) {
            return 0;
        }

        $start = Carbon::parse($timeIn);
        $end = Carbon::parse($timeOut);
        
        $totalMinutes = $end->diffInMinutes($start);

        // Subtract break time if provided
        if ($breakStart && $breakEnd) {
            $breakStartTime = Carbon::parse($breakStart);
            $breakEndTime = Carbon::parse($breakEnd);
            $breakMinutes = $breakEndTime->diffInMinutes($breakStartTime);
            $totalMinutes -= $breakMinutes;
        }

        return max(0, $totalMinutes);
    }

    protected function generateRemarks($lateMinutes, $timeIn, $timeOut, $isAbsent)
    {
        if ($isAbsent) {
            return 'Absent';
        }

        if (!$timeIn && !$timeOut) {
            return 'No Time Records';
        }

        if (!$timeIn) {
            return 'No Time In';
        }

        if (!$timeOut) {
            return 'No Time Out';
        }

        if ($lateMinutes > 0) {
            return "Late ({$lateMinutes} mins)";
        }

        return 'On Time';
    }

    protected function formatMinutesToHours($minutes)
    {
        if (!$minutes) return '0:00';
        
        $hours = floor($minutes / 60);
        $mins = $minutes % 60;
        return "{$hours}:" . str_pad($mins, 2, '0', STR_PAD_LEFT);
    }

    protected function addError($rowNumber, $message)
    {
        $this->errors[] = [
            'row' => $rowNumber,
            'message' => $message
        ];
    }
}