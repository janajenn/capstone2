<?php

namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class AttendanceImportService
{
    protected $errors = [];
    protected $successCount = 0;
    protected $processedRows = [];
    protected $currentEmployee = null;

   
 /**
     * Generate visual preview of Excel file
     */
    /**
 * Generate visual preview of Excel file - show more data
 */
/**
 * Generate visual preview of Excel file - show ALL rows
 */
public function generateVisualPreview($filePath)
{
    try {
        $spreadsheet = IOFactory::load($filePath);
        $worksheet = $spreadsheet->getActiveSheet();
        
        // Get ALL rows from the file
        $rows = $worksheet->toArray();
        
        // Remove completely empty rows but keep rows with at least some data
        $filteredRows = [];
        foreach ($rows as $row) {
            // Check if row has any non-empty, non-null values
            $hasData = false;
            foreach ($row as $cell) {
                if ($cell !== null && $cell !== '' && trim($cell) !== '') {
                    $hasData = true;
                    break;
                }
            }
            if ($hasData) {
                $filteredRows[] = $row;
            }
        }

        // If no data found after filtering, use original rows
        if (empty($filteredRows)) {
            $filteredRows = $rows;
        }

        // Determine column count from all rows
        $columnCount = 0;
        foreach ($filteredRows as $row) {
            $columnCount = max($columnCount, count($row));
        }

        // Generate HTML table preview with ALL rows
        $htmlPreview = $this->generateHtmlTable($filteredRows, $columnCount);

        return [
            'success' => true,
            'preview' => $htmlPreview,
            'summary' => [
                'total_rows' => count($rows),
                'displayed_rows' => count($filteredRows),
                'columns' => $columnCount,
                'file_type' => pathinfo($filePath, PATHINFO_EXTENSION)
            ]
        ];

    } catch (\Exception $e) {
        Log::error('Visual preview failed: ' . $e->getMessage());
        return [
            'success' => false,
            'message' => 'Failed to generate visual preview: ' . $e->getMessage()
        ];
    }
}
    /**
     * Generate HTML table that looks like Excel
     */
    protected function generateHtmlTable($rows, $columnCount)
    {
        $html = '<div class="excel-preview-container">';
        $html .= '<div class="excel-preview">';
        $html .= '<table class="excel-style-table">';
        
        // Add headers (column letters)
        $html .= '<thead>';
        $html .= '<tr class="column-headers">';
        $html .= '<th class="row-header"></th>'; // Empty corner cell
        for ($col = 0; $col < $columnCount; $col++) {
            $columnLetter = $this->getColumnLetter($col);
            $html .= '<th class="column-header">' . $columnLetter . '</th>';
        }
        $html .= '</tr>';
        $html .= '</thead>';
        
        $html .= '<tbody>';
        
        foreach ($rows as $rowIndex => $row) {
            $html .= '<tr>';
            $html .= '<td class="row-header">' . ($rowIndex + 1) . '</td>'; // Row number
            
            for ($col = 0; $col < $columnCount; $col++) {
                $cellValue = $row[$col] ?? '';
                $cellClass = $this->getCellClass($cellValue, $rowIndex, $col);
                
                $html .= '<td class="' . $cellClass . '">';
                $html .= htmlspecialchars($this->formatCellValue($cellValue));
                $html .= '</td>';
            }
            $html .= '</tr>';
        }
        
        $html .= '</tbody>';
        $html .= '</table>';
        $html .= '</div>';
        $html .= '</div>';

        return $html;
    }

    /**
     * Get Excel-style column letter (A, B, C, ..., Z, AA, AB, etc.)
     */
    protected function getColumnLetter($index)
    {
        $letters = '';
        while ($index >= 0) {
            $letters = chr(65 + ($index % 26)) . $letters;
            $index = floor($index / 26) - 1;
        }
        return $letters;
    }

    /**
     * Format cell value for display
     */
    protected function formatCellValue($value)
    {
        if ($value === null || $value === '') {
            return '';
        }

        // Handle dates
        if ($this->isDateValue($value)) {
            try {
                return Carbon::parse($value)->format('m/d/Y');
            } catch (\Exception $e) {
                return $value;
            }
        }

        // Handle numbers
        if (is_numeric($value)) {
            return number_format($value, 2);
        }

        return $value;
    }


    protected function isDateValue($value)
    {
        if (!is_string($value)) {
            return false;
        }

        $datePatterns = [
            '/^\d{1,2}\/\d{1,2}\/\d{4}/', // mm/dd/yyyy
            '/^\d{4}-\d{1,2}-\d{1,2}/',   // yyyy-mm-dd
            '/^\d{1,2}-\d{1,2}-\d{4}/',   // mm-dd-yyyy
        ];

        foreach ($datePatterns as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get CSS class for cell based on content and position
     */
    protected function getCellClass($value, $rowIndex, $colIndex)
    {
        $classes = ['excel-cell'];

        // First row is likely header
        if ($rowIndex === 0) {
            $classes[] = 'header-cell';
        }

        // Empty cells
        if (empty($value)) {
            $classes[] = 'empty-cell';
        }

        // Numeric cells
        if (is_numeric($value)) {
            $classes[] = 'numeric-cell';
        }

        // Date cells
        if ($this->isDateValue($value)) {
            $classes[] = 'date-cell';
        }

        // Employee header cells
        if (is_string($value) && $this->isEmployeeHeader($value)) {
            $classes[] = 'employee-header-cell';
        }

        return implode(' ', $classes);
    }



    public function previewExcel($filePath)
    {
        $this->errors = [];
        $this->processedRows = [];
        $this->currentEmployee = null;

        try {
            $spreadsheet = IOFactory::load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            $previewData = [
                'total_rows' => count($rows),
                'headers' => [],
                'sample_data' => [],
                'employees_found' => [],
                'summary' => [
                    'employee_count' => 0,
                    'date_range' => [],
                    'potential_records' => 0
                ]
            ];

            // Get headers from first row
            if (!empty($rows) && is_array($rows[0])) {
                $previewData['headers'] = array_slice($rows[0], 0, 10);
            }

            // Process first 20 rows for preview
            $sampleRows = array_slice($rows, 0, 20);
            $employeeCount = 0;
            $dates = [];

            foreach ($sampleRows as $rowIndex => $row) {
                try {
                    $previewRow = $this->previewRow($row, $rowIndex + 1);
                    
                    if ($previewRow) {
                        $previewData['sample_data'][] = $previewRow;
                        
                        // Track unique employees
                        if ($previewRow['employee_name'] && !in_array($previewRow['employee_name'], $previewData['employees_found'])) {
                            $previewData['employees_found'][] = $previewRow['employee_name'];
                            $employeeCount++;
                        }

                        // Track dates
                        if ($previewRow['work_date']) {
                            $dates[] = $previewRow['work_date'];
                        }
                    }
                } catch (\Exception $e) {
                    // Continue processing other rows even if one fails
                    \Log::error("Error previewing row {$rowIndex}: " . $e->getMessage());
                    continue;
                }
            }

            // Calculate summary
            $previewData['summary'] = [
                'employee_count' => $employeeCount,
                'date_range' => $this->getDateRange($dates),
                'potential_records' => $this->estimateTotalRecords($rows),
                'file_structure' => $this->analyzeFileStructure($rows)
            ];

            return [
                'success' => true,
                'preview_data' => $previewData,
                'errors' => $this->errors
            ];

        } catch (\Exception $e) {
            Log::error('Attendance preview failed: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to preview Excel file: ' . $e->getMessage(),
                'errors' => $this->errors
            ];
        }
    }

    /**
     * Preview a single row without saving
     */
    protected function previewRow($row, $rowNumber)
    {
        if (!is_array($row) || empty($row) || !isset($row[0])) {
            return null;
        }

        $firstCell = $row[0];

        // Check if this is an employee header row
        if (is_string($firstCell) && $this->isEmployeeHeader($firstCell)) {
            $employeeInfo = $this->extractEmployeeInfo($firstCell);
            
            if ($employeeInfo) {
                $this->currentEmployee = Employee::where('biometric_id', $employeeInfo['biometric_id'])->first();
                
                if ($this->currentEmployee) {
                    return [
                        'row_number' => $rowNumber,
                        'type' => 'employee_header',
                        'employee_name' => $employeeInfo['name'],
                        'biometric_id' => $employeeInfo['biometric_id'],
                        'employee_found' => true,
                        'work_date' => null,
                        'schedule' => null,
                        'time_in' => null,
                        'time_out' => null,
                        'status' => 'Employee Header'
                    ];
                } else {
                    $this->addError($rowNumber, "Employee not found: {$employeeInfo['name']} (ID: {$employeeInfo['biometric_id']})");
                    return [
                        'row_number' => $rowNumber,
                        'type' => 'employee_header',
                        'employee_name' => $employeeInfo['name'],
                        'biometric_id' => $employeeInfo['biometric_id'],
                        'employee_found' => false,
                        'work_date' => null,
                        'schedule' => null,
                        'time_in' => null,
                        'time_out' => null,
                        'status' => 'Employee Not Found'
                    ];
                }
            }
            return null;
        }

        // Skip if no current employee is set
        if (!$this->currentEmployee) {
            return null;
        }

        // Skip if this is not a date row (header, empty, or other non-date content)
        if (!is_string($firstCell) || empty(trim($firstCell))) {
            return null;
        }

        // Skip header rows - FIXED: Check if it's a header row
        if ($this->isHeaderRow($firstCell)) {
            return null;
        }

        // Parse the date (format: "08/01/2025 Fri")
        $workDate = $this->parseDateFromString(trim($firstCell));
        if (!$workDate) {
            $this->addError($rowNumber, "Invalid date format: {$firstCell}");
            return null;
        }

        // Check if rest day
        $remarks = isset($row[2]) ? trim($row[2]) : '';
        if (strtoupper($remarks) === 'RESTDAY') {
            return [
                'row_number' => $rowNumber,
                'type' => 'attendance_record',
                'employee_name' => $this->currentEmployee->firstname . ' ' . $this->currentEmployee->lastname,
                'biometric_id' => $this->currentEmployee->biometric_id,
                'employee_found' => true,
                'work_date' => $workDate->format('Y-m-d'),
                'schedule' => isset($row[1]) ? trim($row[1]) : '',
                'time_in' => null,
                'time_out' => null,
                'remarks' => 'RESTDAY',
                'status' => 'Rest Day (Will be skipped)'
            ];
        }

        // Parse times
        $timeIn = $this->parseTime(isset($row[4]) ? $row[4] : null, $workDate);
        $timeOut = $this->parseTimeOut(isset($row[6]) ? $row[6] : null, $workDate);

        // Check existing record
        $existingLog = AttendanceLog::where('employee_id', $this->currentEmployee->employee_id)
            ->where('work_date', $workDate)
            ->first();

        $status = $existingLog ? 'Existing Record (Will be updated)' : 'New Record (Will be created)';

        return [
            'row_number' => $rowNumber,
            'type' => 'attendance_record',
            'employee_name' => $this->currentEmployee->firstname . ' ' . $this->currentEmployee->lastname,
            'biometric_id' => $this->currentEmployee->biometric_id,
            'employee_found' => true,
            'work_date' => $workDate->format('Y-m-d'),
            'schedule' => isset($row[1]) ? trim($row[1]) : '',
            'time_in' => $timeIn ? $timeIn->format('H:i') : 'Not Recorded',
            'time_out' => $timeOut ? $timeOut->format('H:i') : 'Not Recorded',
            'remarks' => $remarks,
            'status' => $status,
            'existing_record' => $existingLog ? true : false
        ];
    }


    protected function isEmployeeHeader($cellContent)
    {
        if (!is_string($cellContent)) {
            return false;
        }
        
        return preg_match('/[A-Za-z\s,]+\(\d+\)/', $cellContent);
    }

    /**
     * Extract employee name and biometric ID from header string
     */
    protected function extractEmployeeInfo($headerString)
    {
        if (!is_string($headerString)) {
            return null;
        }
        
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
     * Analyze file structure
     */
    protected function analyzeFileStructure($rows)
    {
        $structure = [
            'has_employee_headers' => false,
            'has_date_column' => false,
            'has_time_columns' => false,
            'estimated_columns' => 0
        ];

        foreach ($rows as $row) {
            if (is_array($row)) {
                $structure['estimated_columns'] = max($structure['estimated_columns'], count(array_filter($row)));
            }

            $firstCell = $row[0] ?? null;
            
            if (is_string($firstCell) && $this->isEmployeeHeader($firstCell)) {
                $structure['has_employee_headers'] = true;
            }

            if (is_string($firstCell) && $this->parseDateFromString(trim($firstCell))) {
                $structure['has_date_column'] = true;
            }

            if (isset($row[4]) || isset($row[6])) {
                $structure['has_time_columns'] = true;
            }

            // Stop after checking first 10 rows
            if ($structure['has_employee_headers'] && $structure['has_date_column'] && $structure['has_time_columns']) {
                break;
            }
        }

        return $structure;
    }

    /**
     * Estimate total records in file
     */
    protected function estimateTotalRecords($rows)
    {
        $recordCount = 0;
        $currentEmployee = null;

        foreach ($rows as $row) {
            if (!is_array($row) || empty($row)) continue;

            $firstCell = $row[0] ?? '';

            if (is_string($firstCell) && $this->isEmployeeHeader($firstCell)) {
                $employeeInfo = $this->extractEmployeeInfo($firstCell);
                $currentEmployee = $employeeInfo ? Employee::where('biometric_id', $employeeInfo['biometric_id'])->first() : null;
                continue;
            }

            if ($currentEmployee && is_string($firstCell) && $this->parseDateFromString(trim($firstCell))) {
                $recordCount++;
            }
        }

        return $recordCount;
    }

    /**
     * Get date range from dates array
     */
    protected function getDateRange($dates)
    {
        if (empty($dates)) {
            return ['start' => null, 'end' => null];
        }

        try {
            $carbonDates = array_map(function($date) {
                return Carbon::parse($date);
            }, $dates);

            $minDate = min($carbonDates);
            $maxDate = max($carbonDates);

            return [
                'start' => $minDate->format('Y-m-d'),
                'end' => $maxDate->format('Y-m-d'),
                'days' => $minDate->diffInDays($maxDate) + 1
            ];
        } catch (\Exception $e) {
            return ['start' => null, 'end' => null];
        }
    }
   
   
   
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
   

    /**
     * Extract employee name and biometric ID from header string
     */
   /**
     * Check if a cell content indicates a header row
     * FIXED: This method now only accepts strings
     */
    protected function isHeaderRow($cellContent)
    {
        // If it's not a string, it can't be a header
        if (!is_string($cellContent)) {
            return false;
        }

        $headerPatterns = ['Date', 'Schedule', 'Remarks', 'Absent', 'Time IN', 'Breaks', 'Time Out', 'Hrs Work', 'Late'];
        
        foreach ($headerPatterns as $pattern) {
            if (stripos($cellContent, $pattern) !== false) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if a row is a header row (contains column headers)
     */
 

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

    /**
     * Add error to errors array
     */
    protected function addError($rowNumber, $message)
    {
        $this->errors[] = [
            'row' => $rowNumber,
            'message' => $message
        ];
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




    public function previewWithSimulation($filePath, $options = [])
    {
        $previewResult = $this->previewExcel($filePath);
        
        if (!$previewResult['success']) {
            return $previewResult;
        }

        // Simulate the import to get more accurate results
        $simulationResult = $this->simulateImport($filePath, $options);
        
        $previewResult['simulation'] = $simulationResult;
        $previewResult['import_summary'] = [
            'total_records' => $simulationResult['total_records'],
            'new_records' => $simulationResult['new_records'],
            'updated_records' => $simulationResult['updated_records'],
            'skipped_records' => $simulationResult['skipped_records'],
            'employees_affected' => $simulationResult['employees_affected'],
            'date_range' => $simulationResult['date_range']
        ];

        return $previewResult;
    }

    /**
     * Simulate import without saving to database
     */
    protected function simulateImport($filePath, $options = [])
    {
        $this->errors = [];
        $this->processedRows = [];
        $this->currentEmployee = null;

        $simulationResult = [
            'total_records' => 0,
            'new_records' => 0,
            'updated_records' => 0,
            'skipped_records' => 0,
            'employees_affected' => [],
            'date_range' => ['start' => null, 'end' => null],
            'potential_issues' => []
        ];

        try {
            $spreadsheet = IOFactory::load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            $dates = [];
            $employees = [];

            foreach ($rows as $rowIndex => $row) {
                try {
                    $result = $this->simulateRow($row, $rowIndex + 1, $options);
                    
                    if ($result) {
                        $simulationResult['total_records']++;
                        
                        if ($result['action'] === 'create') {
                            $simulationResult['new_records']++;
                        } elseif ($result['action'] === 'update') {
                            $simulationResult['updated_records']++;
                        } elseif ($result['action'] === 'skip') {
                            $simulationResult['skipped_records']++;
                        }

                        // Track employees
                        if ($result['employee_id'] && !in_array($result['employee_id'], $employees)) {
                            $employees[] = $result['employee_id'];
                            $simulationResult['employees_affected'][] = [
                                'employee_id' => $result['employee_id'],
                                'name' => $result['employee_name']
                            ];
                        }

                        // Track dates
                        if ($result['work_date']) {
                            $dates[] = $result['work_date'];
                        }

                        // Check for potential issues
                        if ($result['has_issues']) {
                            $simulationResult['potential_issues'][] = $result;
                        }
                    }
                } catch (\Exception $e) {
                    // Continue processing other rows
                    continue;
                }
            }

            // Calculate date range
            if (!empty($dates)) {
                $carbonDates = array_map(function($date) {
                    return Carbon::parse($date);
                }, $dates);
                
                $minDate = min($carbonDates);
                $maxDate = max($carbonDates);
                
                $simulationResult['date_range'] = [
                    'start' => $minDate->format('Y-m-d'),
                    'end' => $maxDate->format('Y-m-d'),
                    'days' => $minDate->diffInDays($maxDate) + 1
                ];
            }

            return $simulationResult;

        } catch (\Exception $e) {
            \Log::error('Import simulation failed: ' . $e->getMessage());
            return $simulationResult;
        }
    }

    /**
     * Simulate processing a single row
     */
    protected function simulateRow($row, $rowNumber, $options = [])
    {
        if (!is_array($row) || empty($row) || !isset($row[0])) {
            return null;
        }

        $firstCell = $row[0];

        // Handle employee headers
        if (is_string($firstCell) && $this->isEmployeeHeader($firstCell)) {
            $employeeInfo = $this->extractEmployeeInfo($firstCell);
            
            if ($employeeInfo) {
                $this->currentEmployee = Employee::where('biometric_id', $employeeInfo['biometric_id'])->first();
            }
            return null;
        }

        // Skip if no current employee
        if (!$this->currentEmployee) {
            return null;
        }

        // Skip header rows
        if (!is_string($firstCell) || empty(trim($firstCell)) || $this->isHeaderRow($firstCell)) {
            return null;
        }

        // Parse date
        $workDate = $this->parseDateFromString(trim($firstCell));
        if (!$workDate) {
            return null;
        }

        $result = [
            'row_number' => $rowNumber,
            'employee_id' => $this->currentEmployee->employee_id,
            'employee_name' => $this->currentEmployee->firstname . ' ' . $this->currentEmployee->lastname,
            'work_date' => $workDate->format('Y-m-d'),
            'has_issues' => false,
            'issues' => []
        ];

        // Check rest day
        $remarks = isset($row[2]) ? trim($row[2]) : '';
        if (strtoupper($remarks) === 'RESTDAY') {
            $result['action'] = 'skip';
            $result['reason'] = 'Rest day';
            return $result;
        }

        // Check existing record
        $existingLog = AttendanceLog::where('employee_id', $this->currentEmployee->employee_id)
            ->where('work_date', $workDate)
            ->first();

        if ($existingLog) {
            if ($options['overwrite'] ?? false) {
                $result['action'] = 'update';
                $result['existing_data'] = [
                    'time_in' => $existingLog->time_in,
                    'time_out' => $existingLog->time_out,
                    'remarks' => $existingLog->remarks
                ];
            } else {
                $result['action'] = 'skip';
                $result['reason'] = 'Record exists (overwrite disabled)';
                $result['has_issues'] = true;
                $result['issues'][] = 'Record already exists';
            }
        } else {
            $result['action'] = 'create';
        }

        // Parse times and check for data quality issues
        $timeIn = $this->parseTime(isset($row[4]) ? $row[4] : null, $workDate);
        $timeOut = $this->parseTimeOut(isset($row[6]) ? $row[6] : null, $workDate);

        if (!$timeIn && !$timeOut) {
            $result['has_issues'] = true;
            $result['issues'][] = 'No time records';
        } elseif (!$timeIn) {
            $result['has_issues'] = true;
            $result['issues'][] = 'Missing time in';
        } elseif (!$timeOut) {
            $result['has_issues'] = true;
            $result['issues'][] = 'Missing time out';
        }

        $result['time_in'] = $timeIn ? $timeIn->format('H:i') : null;
        $result['time_out'] = $timeOut ? $timeOut->format('H:i') : null;

        return $result;
    }
}