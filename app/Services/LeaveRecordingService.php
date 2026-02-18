<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EmployeeMonthlyRecording;
use App\Models\LeaveCredit;
use App\Models\LeaveCreditLog;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class LeaveRecordingService
{
    public function generateForEmployeeYear(string $employeeId, int $year): void
    {
        $employee = Employee::findOrFail($employeeId);
        $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();

        $importedAt = $leaveCredit && $leaveCredit->imported_at
            ? Carbon::parse($leaveCredit->imported_at)
            : Carbon::create($year, 1, 1);

        $currentDate = Carbon::now();

        // Delete old records for this employee/year
        EmployeeMonthlyRecording::where('employee_id', $employeeId)
            ->where('year', $year)
            ->delete();

        // Running balances – start with the balance at the beginning of the year
        // For months before import, we won't create rows, but we need the balance
        // at the start of the first month after import. We'll compute it from logs.
        $prevVl = $this->getBalanceAtDate($employeeId, 'VL', $importedAt->copy()->startOfMonth());
        $prevSl = $this->getBalanceAtDate($employeeId, 'SL', $importedAt->copy()->startOfMonth());

        for ($month = 1; $month <= 12; $month++) {
            $monthStart = Carbon::create($year, $month, 1);
            $monthEnd = $monthStart->copy()->endOfMonth();
            $isFuture = $monthStart->gt($currentDate->endOfMonth());

            // Determine if this month is completely before import
            if ($monthEnd->lt($importedAt)) {
                continue; // skip months entirely before import
            }

            // For the import month itself, we need logs from import date onward
            $effectiveStart = $monthStart->lt($importedAt) ? $importedAt : $monthStart;

            // Compute earned, used, lates for the effective period
            $vlEarned = $this->sumEarnedBetween($employeeId, 'VL', $effectiveStart, $monthEnd);
            $slEarned = $this->sumEarnedBetween($employeeId, 'SL', $effectiveStart, $monthEnd);
            $vlUsed = $this->sumUsedBetween($employeeId, 'VL', $effectiveStart, $monthEnd);
            $slUsed = $this->sumUsedBetween($employeeId, 'SL', $effectiveStart, $monthEnd);
            $lates = $this->sumLateDeductionsBetween($employeeId, $effectiveStart, $monthEnd);

            // Compute balances after this month
            $vlBalance = round($prevVl + $vlEarned - $vlUsed, 3);
            $slBalance = round($prevSl + $slEarned - $slUsed, 3);

            // Store the recording (even for import month)
            $data = [
                'employee_id'     => $employeeId,
                'year'            => $year,
                'month'           => $month,
                'total_lates'     => $lates,
                'vl_earned'       => $vlEarned,
                'vl_used'         => $vlUsed,
                'vl_balance'      => $vlBalance,
                'sl_earned'       => $slEarned,
                'sl_used'         => $slUsed,
                'sl_balance'      => $slBalance,
                'total_vl_sl'     => round($vlBalance + $slBalance, 3),
                'inclusive_dates' => $this->getInclusiveDatesArray($employeeId, $year, $month),
                'remarks'         => $this->getRemarks($employeeId, $year, $month),
            ];

            // If this is a future month, leave earned/balance null
            if ($isFuture) {
                $data['vl_earned'] = $data['sl_earned'] = null;
                $data['vl_balance'] = $data['sl_balance'] = null;
                $data['total_vl_sl'] = null;
            }

            EmployeeMonthlyRecording::create($data);

            // Update running balances for next month
            $prevVl = $vlBalance;
            $prevSl = $slBalance;
        }

        Log::info("Generated monthly recordings for employee {$employeeId} year {$year}");
    }

    // ------------------------------------------------------------------------
    // New helper methods that sum logs between two dates
    // ------------------------------------------------------------------------

    private function sumEarnedBetween($employeeId, $type, Carbon $start, Carbon $end)
    {
        return LeaveCreditLog::where('employee_id', $employeeId)
            ->where('type', $type)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->where('remarks', 'like', '%Daily earned leave credit%')
            ->get()
            ->sum(fn($log) => $log->balance_after - $log->balance_before);
    }

    private function sumUsedBetween($employeeId, $type, Carbon $start, Carbon $end)
    {
        return LeaveCreditLog::where('employee_id', $employeeId)
            ->where('type', $type)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->where('points_deducted', '>', 0)
            ->sum('points_deducted');
    }

    private function sumLateDeductionsBetween($employeeId, Carbon $start, Carbon $end)
    {
        return LeaveCreditLog::where('employee_id', $employeeId)
            ->where('type', 'VL')
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->where('points_deducted', '>', 0)
            ->where(function ($q) {
                $q->where('remarks', 'like', '%late%')
                  ->orWhere('remarks', 'like', '%Late%');
            })
            ->sum('points_deducted');
    }

    /**
     * Get the balance at a specific date by summing all logs up to that date.
     * This assumes the leave_credits table holds the current balance.
     * We work backwards using logs.
     */
    private function getBalanceAtDate($employeeId, $type, Carbon $date)
    {
        $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();
        if (!$leaveCredit) return 0;

        $currentBalance = ($type === 'VL') ? $leaveCredit->vl_balance : $leaveCredit->sl_balance;

        // Sum all earned after the target date
        $earnedAfter = LeaveCreditLog::where('employee_id', $employeeId)
            ->where('type', $type)
            ->where('date', '>', $date)
            ->where('remarks', 'like', '%Daily earned leave credit%')
            ->get()
            ->sum(fn($log) => $log->balance_after - $log->balance_before);

        // Sum all used after the target date
        $usedAfter = LeaveCreditLog::where('employee_id', $employeeId)
            ->where('type', $type)
            ->where('date', '>', $date)
            ->where('points_deducted', '>', 0)
            ->sum('points_deducted');

        // Balance at date = current - earnedAfter + usedAfter
        return $currentBalance - $earnedAfter + $usedAfter;
    }

    // ------------------------------------------------------------------------
    // Existing helper methods (unchanged)
    // ------------------------------------------------------------------------

    private function getInclusiveDatesArray($employeeId, $year, $month)
    {
        $startDate = "{$year}-{$month}-01";
        $endDate = date('Y-m-t', strtotime($startDate));

        $leaveRequests = LeaveRequest::where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->whereHas('approvals', fn($q) => $q->where('role', 'admin')->where('status', 'approved'))
            ->whereHas('leaveType', fn($q) => $q->whereIn('code', ['VL', 'SL']))
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween('date_from', [$startDate, $endDate])
                  ->orWhereBetween('date_to', [$startDate, $endDate])
                  ->orWhere(function ($qq) use ($startDate, $endDate) {
                      $qq->where('date_from', '<=', $startDate)
                         ->where('date_to', '>=', $endDate);
                  });
            })
            ->with(['leaveType', 'approvals'])
            ->get();

        return $leaveRequests->map(fn($r) => [
            'from' => $r->date_from,
            'to'   => $r->date_to,
            'type' => $r->leaveType->name ?? 'Leave',
            'code' => $r->leaveType->code ?? '',
            'status' => $r->status,
            'approvals' => $r->approvals->map(fn($a) => [
                'role' => $a->role,
                'status' => $a->status,
            ]),
        ])->toArray();
    }

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

    // Optional: generate for all employees
    public function generateForAllEmployees(int $year): void
    {
        Employee::chunk(100, function ($employees) use ($year) {
            foreach ($employees as $employee) {
                $this->generateForEmployeeYear($employee->employee_id, $year);
            }
        });
    }
}