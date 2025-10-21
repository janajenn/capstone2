<?php

namespace App\Exports;

use App\Models\Employee;
use App\Models\Department;
use App\Models\LeaveCredit;
use App\Models\LeaveCreditLog;
use App\Models\LeaveRequest;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Carbon\Carbon;

class EmployeeRecordingsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithColumnWidths
{
    protected $departmentId;
    protected $year;

    public function __construct($departmentId = null, $year = null)
    {
        $this->departmentId = $departmentId;
        $this->year = $year ?? now()->year;
    }

    public function collection()
    {
        $query = Employee::with(['department', 'leaveCredit']);

        if ($this->departmentId) {
            $query->where('department_id', $this->departmentId);
        }

        return $query->orderBy('firstname')->orderBy('lastname')->get();
    }

    public function headings(): array
    {
        return [
            'Employee ID',
            'Employee Name',
            'Department',
            'Position',
            'Month',
            'VL Earned',
            'VL Used',
            'VL Balance',
            'SL Earned',
            'SL Used',
            'SL Balance',
            'Total Lates (Days)',
            'Remarks',
            'Total VL+SL'
        ];
    }

    public function map($employee): array
    {
        $recordings = $this->getEmployeeLeaveRecordings($employee->employee_id, $this->year);
        
        $rows = [];
        foreach ($recordings as $recording) {
            $rows[] = [
                $employee->employee_id,
                $employee->firstname . ' ' . $employee->lastname,
                $employee->department->name ?? 'N/A',
                $employee->position,
                $recording['date_month'],
                $recording['vl_earned'] ?? '0.000',
                $recording['vl_used'] ?? '0.000',
                $recording['vl_balance'] ?? '0.000',
                $recording['sl_earned'] ?? '0.000',
                $recording['sl_used'] ?? '0.000',
                $recording['sl_balance'] ?? '0.000',
                $recording['total_lates'] ?? '0.000',
                $recording['remarks'] ?? '',
                $recording['total_vl_sl'] ?? '0.000',
            ];
        }

        // If no recordings, include at least one row with basic info
        if (empty($rows)) {
            $rows[] = [
                $employee->employee_id,
                $employee->firstname . ' ' . $employee->lastname,
                $employee->department->name ?? 'N/A',
                $employee->position,
                'No data',
                '0.000',
                '0.000',
                '0.000',
                '0.000',
                '0.000',
                '0.000',
                '0.000',
                'No recordings found',
                '0.000',
            ];
        }

        return $rows;
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style the first row as bold text
            1 => ['font' => ['bold' => true]],
            // Set header background color
            1 => ['fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFE6E6FA']]],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 15, // Employee ID
            'B' => 25, // Employee Name
            'C' => 20, // Department
            'D' => 20, // Position
            'E' => 15, // Month
            'F' => 12, // VL Earned
            'G' => 12, // VL Used
            'H' => 12, // VL Balance
            'I' => 12, // SL Earned
            'J' => 12, // SL Used
            'K' => 12, // SL Balance
            'L' => 18, // Total Lates
            'M' => 30, // Remarks
            'N' => 15, // Total VL+SL
        ];
    }

    /**
     * Get employee leave recordings (replica of your HRController method)
     */
    private function getEmployeeLeaveRecordings($employeeId, $year)
    {
        $recordings = [];
        
        $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();

        if (!$leaveCredit || !$leaveCredit->imported_at) {
            $importedAt = Carbon::create($year, 1, 1);
        } else {
            $importedAt = Carbon::parse($leaveCredit->imported_at);
        }

        $importedYear = $importedAt->year;
        $importedMonth = $importedAt->month;

        $previous_vl = null;
        $previous_sl = null;
        
        for ($month = 1; $month <= 12; $month++) {
            $monthStart = Carbon::create($year, $month, 1);
            
            $isManual = $year < $importedYear || ($year === $importedYear && $month < $importedMonth);
            $isFuture = $year > now()->year || ($year === now()->year && $month > now()->month);
            
            $remarks = $this->getRemarks($employeeId, $year, $month);
            
            $earned = null;
            $vl_balance = null;
            $sl_balance = null;
            
            if ($isManual) {
                $remarks = 'Imported data';
            } elseif ($isFuture) {
                $remarks = 'Pending month';
            } else {
                $earned = $this->getLeaveEarned($employeeId, 'VL', $year, $month);
                if ($previous_vl === null) {
                    $previous_vl = $this->calculateImportedBalance($employeeId, 'VL', $importedAt);
                    $previous_sl = $this->calculateImportedBalance($employeeId, 'SL', $importedAt);
                }
                
                // Get regular usage (excluding lates)
                $vl_used = $this->getMonthlyUsed($employeeId, 'VL', $year, $month);
                $sl_used = $this->getMonthlyUsed($employeeId, 'SL', $year, $month);
                
                // Get late deductions (these are separate and only affect VL)
                $lates = $this->getTotalLates($employeeId, $year, $month);
                
                // Calculate balances including both regular usage and late deductions for VL
                $vl_balance = round($previous_vl + $earned - $vl_used - $lates, 3);
                $sl_balance = round($previous_sl + $earned - $sl_used, 3);
                
                $previous_vl = $vl_balance;
                $previous_sl = $sl_balance;
            }
            
            // Get values for display
            $vl_used = $this->getMonthlyUsed($employeeId, 'VL', $year, $month);
            $sl_used = $this->getMonthlyUsed($employeeId, 'SL', $year, $month);
            $lates = $this->getTotalLates($employeeId, $year, $month);
            
            $recordings[] = [
                'month' => $month,
                'year' => $year,
                'date_month' => $this->formatMonthYear($month, $year),
                'inclusive_dates' => $this->getInclusiveDates($employeeId, $year, $month),
                'total_lates' => round($lates, 3),
                'vl_earned' => $earned !== null ? round($earned, 3) : null,
                'vl_used' => round($vl_used, 3),
                'vl_balance' => $vl_balance,
                'sl_earned' => $earned !== null ? round($earned, 3) : null,
                'sl_used' => round($sl_used, 3),
                'sl_balance' => $sl_balance,
                'remarks' => $remarks,
                'total_vl_sl' => ($vl_balance !== null && $sl_balance !== null) ? round($vl_balance + $sl_balance, 3) : null,
            ];
        }
        
        return $recordings;
    }

    /**
     * Calculate the imported balance for a leave type
     */
    private function calculateImportedBalance($employeeId, $type, $importedAt)
    {
        $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();

        $currentBalance = ($type === 'VL') ? $leaveCredit->vl_balance : $leaveCredit->sl_balance;

        $start = $importedAt->copy()->startOfMonth();
        $end = Carbon::now()->startOfMonth();

        $totalMonths = $start->diffInMonths($end) + 1;
        $totalEarned = $totalMonths * 1.25;

        $totalDed = LeaveCreditLog::where('employee_id', $employeeId)
            ->where('type', $type)
            ->where('date', '>=', $start)
            ->sum('points_deducted');

        return $currentBalance - $totalEarned + $totalDed;
    }

    /**
     * Get monthly used leaves from logs (excluding late deductions)
     */
    private function getMonthlyUsed($employeeId, $type, $year, $month)
    {
        $query = LeaveCreditLog::where('employee_id', $employeeId)
            ->where('type', $type)
            ->where('year', $year)
            ->where('month', $month);

        // For VL type, exclude late deductions from the "used" calculation
        if ($type === 'VL') {
            $query->where(function($q) {
                $q->whereNull('remarks')
                  ->orWhere('remarks', 'not like', '%Late%');
            });
        }

        return $query->sum('points_deducted');
    }

    /**
     * Get leave earned for the month
     */
    private function getLeaveEarned($employeeId, $type, $year, $month)
    {
        $employee = Employee::find($employeeId);
        
        if ($employee && $employee->status === 'active') {
            return 1.25;
        }
        
        return 0;
    }

    /**
     * Get inclusive dates from leave requests (SL and VL only)
     */
    private function getInclusiveDates($employeeId, $year, $month)
    {
        $startDate = "{$year}-{$month}-01";
        $endDate = date('Y-m-t', strtotime($startDate));
        
        $leaveRequests = LeaveRequest::where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->whereHas('leaveType', function($query) {
                $query->whereIn('code', ['VL', 'SL']);
            })
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('date_from', [$startDate, $endDate])
                      ->orWhereBetween('date_to', [$startDate, $endDate])
                      ->orWhere(function ($q) use ($startDate, $endDate) {
                          $q->where('date_from', '<=', $startDate)
                            ->where('date_to', '>=', $endDate);
                      });
            })
            ->with('leaveType')
            ->get();
        
        return $leaveRequests->map(function ($request) {
            return [
                'from' => $request->date_from,
                'to' => $request->date_to,
                'type' => $request->leaveType->name ?? 'Leave',
                'code' => $request->leaveType->code ?? ''
            ];
        });
    }

    /**
     * Get total late deductions from leave_credit_logs for VL type with "Late" remarks
     */
    private function getTotalLates($employeeId, $year, $month)
    {
        return LeaveCreditLog::where('employee_id', $employeeId)
            ->where('type', 'VL')
            ->where('year', $year)
            ->where('month', $month)
            ->where('remarks', 'like', '%Late%')
            ->sum('points_deducted');
    }

    /**
     * Get remarks for the month from the latest log entry
     */
    private function getRemarks($employeeId, $year, $month)
    {
        $log = LeaveCreditLog::where('employee_id', $employeeId)
            ->where('year', $year)
            ->where('month', $month)
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->first();
        
        return $log->remarks ?? '';
    }

    /**
     * Format month and year for display
     */
    private function formatMonthYear($month, $year)
    {
        return date('F Y', strtotime("{$year}-{$month}-01"));
    }
}