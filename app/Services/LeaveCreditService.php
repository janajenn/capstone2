<?php

namespace App\Services;

use App\Models\LeaveRequest;
use App\Models\LeaveCredit;
use App\Models\LeaveCreditLog;
use App\Models\AttendanceLog;
use App\Services\NotificationService;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\LeaveRecordingService;
use Carbon\Carbon;

class LeaveCreditService
{
    public function deductLeaveCredits(LeaveRequest $leaveRequest, $targetBalance = null)
{
    Log::info('🚀 LEAVE CREDIT SERVICE STARTED for leave request ID: ' . $leaveRequest->id);

    try {
        return DB::transaction(function () use ($leaveRequest, $targetBalance) {
            Log::info('📦 Transaction started');

            $leaveType = $leaveRequest->leaveType;
            // Use target balance if given, otherwise use leave type code
            $balanceType = $targetBalance ?? $leaveType->code;
            Log::info('📋 Balance Type: ' . $balanceType);

            // For now, we only support VL and SL balances
            if (!in_array($balanceType, ['SL', 'VL'])) {
                Log::info("⏭️ Skipping deduction for unsupported balance type: {$balanceType}");
                return null;
            }

            $workingDays = $this->calculateWorkingDaysFromSelectedDates($leaveRequest);
            Log::info("📅 Working days to deduct: {$workingDays}");

            $leaveCredit = LeaveCredit::where('employee_id', $leaveRequest->employee_id)->first();

            if (!$leaveCredit) {
                Log::error("❌ No leave credits found for employee: {$leaveRequest->employee_id}");
                throw new \Exception('No leave credits found for this employee.');
            }

            Log::info("💳 Current balances - SL: {$leaveCredit->sl_balance}, VL: {$leaveCredit->vl_balance}");

            $balanceField = $this->getBalanceField($balanceType); // 'sl_balance' or 'vl_balance'
            $currentBalance = $leaveCredit->{$balanceField};

            $daysToDeduct = 0;
            $daysWithoutPay = $workingDays;

            if ($currentBalance > 1) {
                $daysToDeduct = min($workingDays, $currentBalance - 1);
                $daysWithoutPay = $workingDays - $daysToDeduct;
                Log::info("✅ Deducting {$daysToDeduct} days, leaving 1 credit. {$daysWithoutPay} days without pay.");
            } else {
                $daysToDeduct = 0;
                $daysWithoutPay = $workingDays;
                Log::info("⚠️ Insufficient credits (≤1), deducting 0 days. All {$daysWithoutPay} days without pay.");
            }

            $balanceBefore = $currentBalance;
            $newBalance = $currentBalance - $daysToDeduct;
            $newBalance = max(0, $newBalance);

            $leaveCredit->{$balanceField} = $newBalance;
            $leaveCredit->last_updated = now();
            $leaveCredit->save();

            Log::info("💰 Balance updated: {$balanceBefore} - {$daysToDeduct} = {$newBalance}");

            $leaveRequest->update([
                'days_with_pay' => $daysToDeduct,
                'days_without_pay' => $daysWithoutPay
            ]);

            Log::info("📊 Leave request updated - With Pay: {$daysToDeduct}, Without Pay: {$daysWithoutPay}");

            $this->createCreditLog($leaveRequest, $balanceType, $daysToDeduct, $newBalance);

            // Regenerate monthly recordings for the affected year(s)
            $yearFrom = Carbon::parse($leaveRequest->date_from)->year;
            $yearTo   = Carbon::parse($leaveRequest->date_to)->year;
            app(LeaveRecordingService::class)->generateForEmployeeYear($leaveRequest->employee_id, $yearFrom);
            if ($yearTo !== $yearFrom) {
                app(LeaveRecordingService::class)->generateForEmployeeYear($leaveRequest->employee_id, $yearTo);
            }

            Log::info('🎉 LEAVE CREDIT SERVICE COMPLETED SUCCESSFULLY');

            return [
                'success' => true,
                'message' => "Deducted {$daysToDeduct} days, {$daysWithoutPay} days without pay.",
                'days_deducted' => $daysToDeduct,
                'days_without_pay' => $daysWithoutPay,
                'new_balance' => $newBalance
            ];
        });
    } catch (\Exception $e) {
        Log::error('💥 Exception in LeaveCreditService: ' . $e->getMessage());
        Log::error('📝 Stack trace: ' . $e->getTraceAsString());
        throw $e;
    }
}

// ✅ NEW METHOD: Calculate working days from selected_dates
private function calculateWorkingDaysFromSelectedDates(LeaveRequest $leaveRequest)
{
    // First, try to use selected_dates for accurate calculation
    $selectedDates = [];

    if (!empty($leaveRequest->selected_dates)) {
        if (is_array($leaveRequest->selected_dates)) {
            $selectedDates = $leaveRequest->selected_dates;
        } elseif (is_string($leaveRequest->selected_dates)) {
            $decoded = json_decode($leaveRequest->selected_dates, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $selectedDates = $decoded;
            }
        }
    }

    // If we have selected dates, count them (they should already exclude weekends)
    if (!empty($selectedDates)) {
        $workingDays = count($selectedDates);
        Log::info("📅 Using selected_dates count: {$workingDays} days");
        return $workingDays;
    }

    // Fallback: Calculate from date range (excluding weekends)
    $period = CarbonPeriod::create($leaveRequest->date_from, $leaveRequest->date_to);
    $workingDays = collect($period)->filter(function ($date) {
        return !$date->isWeekend();
    })->count();

    Log::info("📅 Using date range calculation: {$workingDays} days");
    return $workingDays;
}



  private function getBalanceField($type)
{
    return match($type) {
        'SL' => 'sl_balance',
        'VL' => 'vl_balance',
        default => null
    };
}

    private function createCreditLog(LeaveRequest $leaveRequest, $typeCode, $daysDeducted, $newBalance)
    {
        Log::info('📝 Creating credit log entry...');

        try {
            // Get the current leave credit record to retrieve balance_before
            $leaveCredit = LeaveCredit::where('employee_id', $leaveRequest->employee_id)->first();

            if (!$leaveCredit) {
                Log::error("❌ No leave credits found for employee: {$leaveRequest->employee_id}");
                throw new \Exception('No leave credits found for this employee.');
            }

            // Calculate balance_before (current balance + points deducted)
            $balanceBefore = $newBalance + $daysDeducted;

            // ✅ FIXED: Use leave request dates instead of current date
            $leaveStartDate = $leaveRequest->date_from;
            $leaveYear = date('Y', strtotime($leaveStartDate));
            $leaveMonth = date('n', strtotime($leaveStartDate));

            Log::info("📅 Using leave request dates for log:", [
                'leave_start_date' => $leaveStartDate,
                'leave_year' => $leaveYear,
                'leave_month' => $leaveMonth,
                'current_date' => now()->format('Y-m-d'),
                'current_year' => now()->year,
                'current_month' => now()->month
            ]);

            $log = LeaveCreditLog::create([
                'employee_id' => $leaveRequest->employee_id,
                'type' => $typeCode,
                'date' => $leaveStartDate, // ✅ FIXED: Use leave start date
                'year' => $leaveYear, // ✅ FIXED: Use leave year
                'month' => $leaveMonth, // ✅ FIXED: Use leave month
                'points_deducted' => $daysDeducted,
                'balance_before' => $balanceBefore,
                'balance_after' => $newBalance,
                'remarks' => "Auto deducted after Admin approval of leave request ID #{$leaveRequest->id}",
            ]);

            Log::info("✅ Credit log created with ID: {$log->id}");
            Log::info("   - Balance before: {$balanceBefore}");
            Log::info("   - Balance after: {$newBalance}");
            Log::info("   - Date: {$leaveStartDate}");
            Log::info("   - Year: {$leaveYear}, Month: {$leaveMonth}");

            return $log;
        } catch (\Exception $e) {
            Log::error('❌ Failed to create credit log: ' . $e->getMessage());
            throw $e;
        }
    }


    /**
 * Process late deduction for a specific attendance log.
 * If overwrite is true, any existing late log for that date will be deleted before deduction.
 */
public function processLateForAttendanceLog($employeeId, $workDate, $lateMinutes, $overwrite = false)
{
    return $this->deductLateCredits($employeeId, $lateMinutes, $workDate, $overwrite);
}


    /**
     * Deduct VL credits for late minutes
     */
   /**
 * Deduct VL credits for late minutes with specific date
 */
/**
 * Deduct VL credits for late minutes on a specific date.
 *
 * @param int|string $employeeId
 * @param int $lateMinutes
 * @param string|null $workDate (Y-m-d) – defaults to today
 * @param bool $overwrite – if true, delete any existing late log for this date before deducting
 * @return array
 */
public function deductLateCredits($employeeId, $lateMinutes, $workDate = null, $overwrite = false)
{
    \Log::info("🔍 DEBUG: deductLateCredits called", [
        'employee_id' => $employeeId,
        'late_minutes' => $lateMinutes,
        'work_date'    => $workDate,
        'overwrite'    => $overwrite
    ]);

    if ($lateMinutes <= 0) {
        return [
            'success' => false,
            'message' => 'No late minutes to process'
        ];
    }

    if (!$workDate) {
        $workDate = now()->toDateString();
    }

    try {
        return DB::transaction(function () use ($employeeId, $lateMinutes, $workDate, $overwrite) {
            // ------------------------------------------------
            // 1. Conversion table: minutes → day fraction
            // ------------------------------------------------
            $conversionTable = [
                1 => 0.002, 2 => 0.004, 3 => 0.006, 4 => 0.008, 5 => 0.010,
                6 => 0.012, 7 => 0.015, 8 => 0.017, 9 => 0.019, 10 => 0.021,
                11 => 0.023, 12 => 0.025, 13 => 0.027, 14 => 0.029, 15 => 0.031,
                16 => 0.033, 17 => 0.035, 18 => 0.037, 19 => 0.040, 20 => 0.042,
                21 => 0.044, 22 => 0.046, 23 => 0.048, 24 => 0.050, 25 => 0.052,
                26 => 0.054, 27 => 0.056, 28 => 0.058, 29 => 0.060, 30 => 0.062,
                31 => 0.065, 32 => 0.067, 33 => 0.069, 34 => 0.071, 35 => 0.073,
                36 => 0.075, 37 => 0.077, 38 => 0.079, 39 => 0.081, 40 => 0.083,
                41 => 0.085, 42 => 0.087, 43 => 0.090, 44 => 0.092, 45 => 0.094,
                46 => 0.096, 47 => 0.098, 48 => 0.100, 49 => 0.102, 50 => 0.104,
                51 => 0.106, 52 => 0.108, 53 => 0.110, 54 => 0.112, 55 => 0.115,
                56 => 0.117, 57 => 0.119, 58 => 0.121, 59 => 0.123, 60 => 0.125,
            ];

            $minutesToConvert = min($lateMinutes, 60);
            $dayFraction = $conversionTable[$minutesToConvert] ?? 0.125; // max 0.125 for 60+ minutes

            \Log::info("📊 Late minutes conversion", [
                'minutes'        => $minutesToConvert,
                'day_fraction'   => $dayFraction,
                'original_lates' => $lateMinutes
            ]);

            // ------------------------------------------------
            // 2. Handle overwrite: delete any existing late log for this date
            // ------------------------------------------------
            if ($overwrite) {
                $deleted = LeaveCreditLog::where('employee_id', $employeeId)
                    ->where('type', 'VL')
                    ->whereDate('date', $workDate)
                    ->where('remarks', 'like', '%Late%')
                    ->delete();

                \Log::info("🗑️ Overwrite mode: deleted $deleted existing late log(s) for employee $employeeId on $workDate");
            }

            // ------------------------------------------------
            // 3. Check if already processed (skip if not overwriting)
            // ------------------------------------------------
            $alreadyProcessed = LeaveCreditLog::where('employee_id', $employeeId)
                ->where('type', 'VL')
                ->whereDate('date', $workDate)
                ->where('remarks', 'like', '%Late%')
                ->exists();

            if ($alreadyProcessed && !$overwrite) {
                \Log::info("⏭️ Late already processed for employee $employeeId on $workDate, skipping.");
                return [
                    'success' => false,
                    'message' => 'Late deduction already exists for this date (use overwrite to replace).'
                ];
            }

            // ------------------------------------------------
            // 4. Get or create leave credit record
            // ------------------------------------------------
            $leaveCredit = LeaveCredit::firstOrCreate(
                ['employee_id' => $employeeId],
                ['sl_balance' => 0, 'vl_balance' => 0, 'last_updated' => now()]
            );

            \Log::info("💳 Current VL balance: {$leaveCredit->vl_balance}");

            // ------------------------------------------------
            // 5. Check if sufficient VL balance
            // ------------------------------------------------
            if ($leaveCredit->vl_balance < $dayFraction) {
                \Log::warning("⚠️ Insufficient VL balance for late deduction", [
                    'current_balance'   => $leaveCredit->vl_balance,
                    'required_deduction' => $dayFraction
                ]);
                return [
                    'success'          => false,
                    'message'          => 'Insufficient VL balance for late deduction',
                    'available_balance' => $leaveCredit->vl_balance,
                    'required_deduction' => $dayFraction
                ];
            }

            // ------------------------------------------------
            // 6. Perform deduction
            // ------------------------------------------------
            $balanceBefore = $leaveCredit->vl_balance;
            $leaveCredit->vl_balance -= $dayFraction;
            $leaveCredit->last_updated = now();
            $leaveCredit->save();

            \Log::info("✅ VL balance updated", [
                'balance_before' => $balanceBefore,
                'deducted'       => $dayFraction,
                'balance_after'  => $leaveCredit->vl_balance
            ]);

            // ------------------------------------------------
            // 7. Create log entry
            // ------------------------------------------------
            $this->createLateCreditLog(
                $employeeId,
                'VL',
                $dayFraction,
                $balanceBefore,
                $lateMinutes,
                $workDate
            );

            // ------------------------------------------------
            // 8. Send notification (optional)
            // ------------------------------------------------
            $this->sendLateDeductionNotification($employeeId, $dayFraction, $lateMinutes, $workDate);

            // ------------------------------------------------
            // 9. Return success response
            // ------------------------------------------------
            return [
                'success'         => true,
                'message'         => "Successfully deducted {$dayFraction} VL credits for {$lateMinutes} minutes late on {$workDate}",
                'deducted_amount' => $dayFraction,
                'new_balance'     => $leaveCredit->vl_balance,
                'work_date'       => $workDate
            ];
        });
    } catch (\Exception $e) {
        \Log::error('💥 Exception in deductLateCredits: ' . $e->getMessage(), [
            'employee_id' => $employeeId,
            'lateMinutes' => $lateMinutes,
            'workDate'    => $workDate,
            'trace'       => $e->getTraceAsString()
        ]);
        return [
            'success' => false,
            'message' => 'Error processing late credit deduction: ' . $e->getMessage()
        ];
    }
}
    /**
     * Create credit log for late deduction
     */
    /**
 * Create credit log for late deduction with specific date
 */
/**
 * Create credit log for late deduction with specific date
 */
private function createLateCreditLog($employeeId, $type, $pointsDeducted, $balanceBefore, $lateMinutes, $workDate = null)
{
    try {
        if (!$workDate) {
            $workDate = now()->toDateString();
        }

        $balanceAfter = $balanceBefore - $pointsDeducted;
        $workDateCarbon = \Carbon\Carbon::parse($workDate);

        LeaveCreditLog::create([
            'employee_id'     => $employeeId,
            'type'            => $type,
            'date'            => $workDate,           // ✅ Use the actual work date (August)
            'year'            => $workDateCarbon->year,  // ✅ Correct year (2024)
            'month'           => $workDateCarbon->month, // ✅ Correct month (8 for August)
            'points_deducted' => $pointsDeducted,
            'balance_before'  => $balanceBefore,
            'balance_after'   => $balanceAfter,
            'remarks'         => "Late - {$lateMinutes} minutes",
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        \Log::info("📝 Late credit log created WITH CORRECT DATE", [
            'employee_id'    => $employeeId,
            'type'           => $type,
            'work_date'      => $workDate,           // August date
            'log_year'       => $workDateCarbon->year,
            'log_month'      => $workDateCarbon->month,
            'points_deducted'=> $pointsDeducted,
            'balance_before' => $balanceBefore,
            'balance_after'  => $balanceAfter,
        ]);
    } catch (\Exception $e) {
        \Log::error('❌ Failed to create late credit log: ' . $e->getMessage());
        throw $e;
    }
}
    /**
     * Send notification to employee about late deduction
     */
   /**
 * Send notification to employee about late deduction
 */
private function sendLateDeductionNotification($employeeId, $dayFraction, $lateMinutes, $workDate = null)
{
    try {
        if (!$workDate) {
            $workDate = now()->toDateString();
        }

        $notificationService = new NotificationService();
        $formattedDate = \Carbon\Carbon::parse($workDate)->format('F j, Y');

        $notificationService->createLeaveRequestNotification(
            $employeeId,
            'late_deduction',
            null, // No leave request ID for late deductions
            'VL (Late Deduction)',
            $workDate,
            $workDate,
            "You have been deducted {$dayFraction} VL credits on {$formattedDate} due to a late arrival of {$lateMinutes} minutes."
        );

        \Log::info("📧 Late deduction notification sent", [
            'employee_id' => $employeeId,
            'day_fraction' => $dayFraction,
            'late_minutes' => $lateMinutes,
            'work_date' => $workDate
        ]);
    } catch (\Exception $e) {
        \Log::error('❌ Failed to send late deduction notification: ' . $e->getMessage());
        // Don't throw exception here as the main deduction was successful
    }
}

    /**
     * Process late credits for all employees with late minutes
     * This method should be called after attendance import
     */
    public function processLateCreditsForAllEmployees($date = null)
    {
        try {
            Log::info("🔄 Processing late credits for all employees", ['date' => $date]);

            // First, let's debug what's in the attendance_logs table
            $totalRecords = AttendanceLog::count();
            $recordsWithLateMinutes = AttendanceLog::where('late_minutes', '>', 0)->count();
            $recordsWithSchedule = AttendanceLog::whereNotNull('schedule_start')->where('schedule_start', '!=', '')->count();
            $recordsWithTimeIn = AttendanceLog::whereNotNull('time_in')->where('time_in', '!=', '')->count();

            Log::info("🔍 DEBUG: Attendance logs analysis", [
                'total_records' => $totalRecords,
                'records_with_late_minutes' => $recordsWithLateMinutes,
                'records_with_schedule' => $recordsWithSchedule,
                'records_with_time_in' => $recordsWithTimeIn
            ]);

            // Get some sample records to debug
            $sampleRecords = AttendanceLog::limit(5)->get(['id', 'employee_id', 'work_date', 'schedule_start', 'time_in', 'late_minutes']);
            Log::info("🔍 DEBUG: Sample attendance records", [
                'sample_records' => $sampleRecords->toArray()
            ]);

            // Get all employees with late minutes (if no specific date, get all recent records)
            if ($date) {
                $lateAttendanceLogs = AttendanceLog::whereDate('work_date', $date)
                    ->where('late_minutes', '>', 0)
                    ->with('employee')
                    ->get();
            } else {
                // Get all late attendance logs from the last 30 days to catch recent imports
                $lateAttendanceLogs = AttendanceLog::where('late_minutes', '>', 0)
                    ->where('work_date', '>=', now()->subDays(30))
                    ->with('employee')
                    ->get();
            }

            Log::info("📊 Found late attendance logs", [
                'count' => $lateAttendanceLogs->count(),
                'date' => $date,
                'date_range' => $date ? $date : 'last 30 days'
            ]);

            // If no late logs found, let's check for records that SHOULD be late
            if ($lateAttendanceLogs->count() === 0) {
                Log::info("🔍 DEBUG: No late logs found, checking for records that should be late");

                // Get records with both schedule and time_in
                $potentialLateRecords = AttendanceLog::whereNotNull('schedule_start')
                    ->where('schedule_start', '!=', '')
                    ->whereNotNull('time_in')
                    ->where('time_in', '!=', '')
                    ->where('work_date', '>=', now()->subDays(30))
                    ->limit(10)
                    ->get();

                Log::info("🔍 DEBUG: Records with schedule and time_in", [
                    'count' => $potentialLateRecords->count(),
                    'records' => $potentialLateRecords->map(function($record) {
                        return [
                            'id' => $record->id,
                            'employee_id' => $record->employee_id,
                            'work_date' => $record->work_date,
                            'schedule_start' => $record->schedule_start,
                            'time_in' => $record->time_in,
                            'late_minutes' => $record->late_minutes
                        ];
                    })->toArray()
                ]);

                // Manually check if any should be late
                foreach ($potentialLateRecords as $record) {
                    try {
                        $scheduleTime = \Carbon\Carbon::parse($record->schedule_start);
                        $actualTime = \Carbon\Carbon::parse($record->time_in);

                        if ($actualTime->greaterThan($scheduleTime)) {
                            $calculatedLate = $actualTime->diffInMinutes($scheduleTime);
                            Log::info("🔍 DEBUG: Record {$record->id} should be late", [
                                'employee_id' => $record->employee_id,
                                'work_date' => $record->work_date,
                                'schedule_start' => $record->schedule_start,
                                'time_in' => $record->time_in,
                                'calculated_late_minutes' => $calculatedLate,
                                'stored_late_minutes' => $record->late_minutes
                            ]);
                        }
                    } catch (\Exception $e) {
                        Log::error("🔍 DEBUG: Error checking record {$record->id}", [
                            'error' => $e->getMessage(),
                            'schedule_start' => $record->schedule_start,
                            'time_in' => $record->time_in
                        ]);
                    }
                }
            }

            $processedCount = 0;
            $failedCount = 0;

            foreach ($lateAttendanceLogs as $attendanceLog) {
                Log::info("🕐 Processing late attendance log", [
                    'employee_id' => $attendanceLog->employee_id,
                    'work_date' => $attendanceLog->work_date,
                    'late_minutes' => $attendanceLog->late_minutes
                ]);

                $result = $this->deductLateCredits(
                    $attendanceLog->employee_id,
                    $attendanceLog->late_minutes
                );

                if ($result['success']) {
                    $processedCount++;
                    Log::info("✅ Processed late credits for employee", [
                        'employee_id' => $attendanceLog->employee_id,
                        'work_date' => $attendanceLog->work_date,
                        'late_minutes' => $attendanceLog->late_minutes,
                        'deducted_amount' => $result['deducted_amount']
                    ]);
                } else {
                    $failedCount++;
                    Log::warning("⚠️ Failed to process late credits for employee", [
                        'employee_id' => $attendanceLog->employee_id,
                        'work_date' => $attendanceLog->work_date,
                        'late_minutes' => $attendanceLog->late_minutes,
                        'error' => $result['message']
                    ]);
                }
            }

            Log::info("🎉 Late credits processing completed", [
                'date' => $date,
                'date_range' => $date ? $date : 'last 30 days',
                'processed_count' => $processedCount,
                'failed_count' => $failedCount,
                'total_late_logs' => $lateAttendanceLogs->count()
            ]);

            return [
                'success' => true,
                'message' => "Processed late credits for {$processedCount} employees from " . ($date ? $date : 'last 30 days'),
                'processed_count' => $processedCount,
                'failed_count' => $failedCount,
                'total_late_logs' => $lateAttendanceLogs->count()
            ];
        } catch (\Exception $e) {
            Log::error('💥 Exception in processLateCreditsForAllEmployees: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error processing late credits: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process late credits for a specific date range
     * Useful for processing historical data
     */
    public function processLateCreditsForRecentImports()
    {
        try {
            \Log::info("🔄 Processing late credits for recent imports");

            // Get attendance logs with late minutes - EXTEND DATE RANGE for 2025 data
            $recentLateLogs = AttendanceLog::where('late_minutes', '>', 0)
                ->where('work_date', '>=', '2025-01-01') // Include all of 2025
                ->with('employee')
                ->get();

            \Log::info("📊 Found late attendance logs to process", [
                'count' => $recentLateLogs->count(),
                'date_range' => '2025-01-01 to present'
            ]);

            $processedCount = 0;
            $failedCount = 0;
            $alreadyProcessedCount = 0;

            foreach ($recentLateLogs as $attendanceLog) {
                // ✅ FIXED: More accurate duplicate check
                $alreadyProcessed = LeaveCreditLog::where('employee_id', $attendanceLog->employee_id)
                    ->where('type', 'VL')
                    ->where('remarks', 'like', '%Late%')
                    ->where('points_deducted', '>', 0)
                    ->whereDate('date', $attendanceLog->work_date) // Match exact work date
                    ->exists();

                if ($alreadyProcessed) {
                    $alreadyProcessedCount++;
                    \Log::info("⏭️ Late already processed for employee", [
                        'employee_id' => $attendanceLog->employee_id,
                        'work_date' => $attendanceLog->work_date,
                        'late_minutes' => $attendanceLog->late_minutes
                    ]);
                    continue;
                }

                \Log::info("🕐 Processing late attendance", [
                    'employee_id' => $attendanceLog->employee_id,
                    'work_date' => $attendanceLog->work_date, // Should be August 2025
                    'late_minutes' => $attendanceLog->late_minutes,
                    'schedule_start' => $attendanceLog->schedule_start,
                    'time_in' => $attendanceLog->time_in
                ]);

                // Process the late deduction
                $result = $this->deductLateCredits(
                    $attendanceLog->employee_id,
                    $attendanceLog->late_minutes,
                    $attendanceLog->work_date // ✅ Pass the August work date
                );

                if ($result['success']) {
                    $processedCount++;
                    \Log::info("✅ Processed late credits", [
                        'employee_id' => $attendanceLog->employee_id,
                        'work_date' => $attendanceLog->work_date,
                        'late_minutes' => $attendanceLog->late_minutes,
                        'deducted_amount' => $result['deducted_amount']
                    ]);
                } else {
                    $failedCount++;
                    \Log::warning("❌ Failed to process late credits", [
                        'employee_id' => $attendanceLog->employee_id,
                        'work_date' => $attendanceLog->work_date,
                        'error' => $result['message']
                    ]);
                }
            }

            \Log::info("🎉 Late credits processing completed", [
                'processed_count' => $processedCount,
                'failed_count' => $failedCount,
                'already_processed_count' => $alreadyProcessedCount,
                'total_found' => $recentLateLogs->count()
            ]);

            return [
                'success' => true,
                'message' => "Processed late credits for {$processedCount} employees. {$alreadyProcessedCount} were already processed.",
                'processed_count' => $processedCount,
                'failed_count' => $failedCount,
                'already_processed_count' => $alreadyProcessedCount,
                'total_found' => $recentLateLogs->count()
            ];

        } catch (\Exception $e) {
            \Log::error('💥 Error processing late credits for recent imports: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error processing late credits: ' . $e->getMessage()
            ];
        }
    }

    /**
 * Process late credits specifically for recently imported attendance records
//  */
// public function processLateCreditsForRecentImports()
// {
//     try {
//         \Log::info("🔄 Processing late credits for recent imports");

//         // Get attendance logs from the last 7 days that have late minutes but haven't been processed
//         $recentLateLogs = AttendanceLog::where('late_minutes', '>', 0)
//             ->where('work_date', '>=', now()->subDays(7))
//             ->whereDoesntHave('leaveCreditLogs', function($query) {
//                 $query->where('type', 'VL')
//                       ->where('remarks', 'like', '%Late%');
//             })
//             ->with('employee')
//             ->get();

//         \Log::info("📊 Found late attendance logs to process", [
//             'count' => $recentLateLogs->count(),
//             'date_range' => 'last 7 days'
//         ]);

//         $processedCount = 0;
//         $failedCount = 0;

//         foreach ($recentLateLogs as $attendanceLog) {
//             \Log::info("🕐 Processing late attendance", [
//                 'employee_id' => $attendanceLog->employee_id,
//                 'work_date' => $attendanceLog->work_date,
//                 'late_minutes' => $attendanceLog->late_minutes
//             ]);

//             $result = $this->deductLateCredits(
//                 $attendanceLog->employee_id,
//                 $attendanceLog->late_minutes
//             );

//             if ($result['success']) {
//                 $processedCount++;

//                 // Mark this log as processed by updating remarks or creating a relation
//                 $attendanceLog->update([
//                     'remarks' => $attendanceLog->remarks .
//                                (empty($attendanceLog->remarks) ? '' : ' | ') .
//                                "Late credits deducted: {$result['deducted_amount']} VL"
//                 ]);

//                 \Log::info("✅ Processed late credits", [
//                     'employee_id' => $attendanceLog->employee_id,
//                     'deducted_amount' => $result['deducted_amount']
//                 ]);
//             } else {
//                 $failedCount++;
//                 \Log::warning("❌ Failed to process late credits", [
//                     'employee_id' => $attendanceLog->employee_id,
//                     'error' => $result['message']
//                 ]);
//             }
//         }

//         return [
//             'success' => true,
//             'message' => "Processed late credits for {$processedCount} employees",
//             'processed_count' => $processedCount,
//             'failed_count' => $failedCount,
//             'total_found' => $recentLateLogs->count()
//         ];

//     } catch (\Exception $e) {
//         \Log::error('💥 Error processing late credits for recent imports: ' . $e->getMessage());
//         return [
//             'success' => false,
//             'message' => 'Error processing late credits: ' . $e->getMessage()
//         ];
//     }
// }
}
