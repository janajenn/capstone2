<?php

namespace App\Services;

use App\Models\LeaveRequest;
use App\Models\LeaveBalance;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\CarbonPeriod;

class LeaveBalanceService
{
    /**
     * Deduct leave balance for non-SL/VL leave types
     *
     * @param LeaveRequest $leaveRequest
     * @return bool
     * @throws \Exception
     */
    public function deductLeaveBalance(LeaveRequest $leaveRequest)
    {
        Log::info('🚀 LEAVE BALANCE SERVICE STARTED for leave request ID: ' . $leaveRequest->id);

        try {
            return DB::transaction(function () use ($leaveRequest) {
                Log::info('📦 Transaction started for leave balance deduction');

                // Get leave type CODE from relationship
                $leaveTypeCode = $leaveRequest->leaveType->code;
                Log::info('📋 Leave Type Code: ' . $leaveTypeCode);

                // Skip deduction for SL and VL leave types (these are handled by LeaveCreditService)
                if (in_array($leaveTypeCode, ['SL', 'VL'])) {
                    Log::info("⏭️ Skipping balance deduction for SL/VL leave type code: {$leaveTypeCode}");
                    return null;
                }

                // Calculate working days (excluding weekends)
                $period = CarbonPeriod::create($leaveRequest->date_from, $leaveRequest->date_to);
                $workingDays = collect($period)->filter(function ($date) {
                    return !$date->isWeekend();
                })->count();

                Log::info("📅 Working days to deduct: {$workingDays} for leave type: {$leaveTypeCode}");

                // Get current year
                $currentYear = now()->year;
                
                // Retrieve leave balance record for employee, leave type, and current year
                $leaveBalance = LeaveBalance::where('employee_id', $leaveRequest->employee_id)
                    ->where('leave_type_id', $leaveRequest->leave_type_id)
                    ->where('year', $currentYear)
                    ->first();

                // Throw exception if no leave balance record exists
                if (!$leaveBalance) {
                    Log::error("❌ No leave balance found for employee: {$leaveRequest->employee_id}, " .
                              "leave type: {$leaveRequest->leaveType->name} (ID: {$leaveRequest->leave_type_id}), year: {$currentYear}");
                    throw new \Exception("No leave balance available for {$leaveRequest->leaveType->name} in {$currentYear}. Please contact HR.");
                }

                Log::info("💳 Current balance - Earned: {$leaveBalance->total_earned}, " .
                         "Used: {$leaveBalance->total_used}, Balance: {$leaveBalance->balance}");

                // Check if balance is sufficient
                if ($leaveBalance->balance < $workingDays) {
                    Log::warning("⚠️ Insufficient balance: {$leaveBalance->balance} available, {$workingDays} required - returning insufficient balance result");
                    return [
                        'success' => false,
                        'message' => "Insufficient {$leaveRequest->leaveType->name} balance",
                        'available_balance' => $leaveBalance->balance,
                        'required_days' => $workingDays
                    ];
                }

                // Ensure balance doesn't go negative (additional safety check)
                $newBalance = max(0, $leaveBalance->balance - $workingDays);

                // Update leave balance record according to your schema
                $leaveBalance->total_used += $workingDays;
                $leaveBalance->balance = $newBalance;
                $leaveBalance->updated_at = now();
                $leaveBalance->save();

                Log::info("✅ Deducted {$workingDays} days. New balance: {$leaveBalance->balance}, " .
                         "Total used: {$leaveBalance->total_used}");

                // Log the balance deduction
                $this->createBalanceLog($leaveRequest, $leaveTypeCode, $workingDays, $leaveBalance);

                Log::info('🎉 LEAVE BALANCE SERVICE COMPLETED SUCCESSFULLY');
                return [
                    'success' => true,
                    'message' => "Successfully deducted {$workingDays} days from {$leaveRequest->leaveType->name} balance",
                    'days_deducted' => $workingDays,
                    'new_balance' => $leaveBalance->balance
                ];
            });
        } catch (\Exception $e) {
            Log::error('💥 Exception in LeaveBalanceService: ' . $e->getMessage());
            Log::error('📝 Stack trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }

    /**
     * Create a log entry for balance deduction
     *
     * @param LeaveRequest $leaveRequest
     * @param string $leaveTypeCode
     * @param int $daysDeducted
     * @param LeaveBalance $leaveBalance
     * @return void
     */
    private function createBalanceLog(LeaveRequest $leaveRequest, string $leaveTypeCode, int $daysDeducted, LeaveBalance $leaveBalance)
    {
        Log::info('📝 Creating balance log entry...');

        try {
            // Log data based on your actual schema
            $logData = [
                'employee_id' => $leaveRequest->employee_id,
                'leave_request_id' => $leaveRequest->id,
                'leave_type_id' => $leaveRequest->leave_type_id,
                'leave_type_code' => $leaveTypeCode,
                'days_deducted' => $daysDeducted,
                'balance_before' => $leaveBalance->balance + $daysDeducted,
                'balance_after' => $leaveBalance->balance,
                'total_used_before' => $leaveBalance->total_used - $daysDeducted,
                'total_used_after' => $leaveBalance->total_used,
                'total_earned' => $leaveBalance->total_earned,
                'year' => $leaveBalance->year,
                'remarks' => "Auto deducted after Admin approval of leave request ID #{$leaveRequest->id}",
                'timestamp' => now()
            ];

            Log::info("✅ Balance log created: " . json_encode($logData));
            
        } catch (\Exception $e) {
            Log::error('❌ Failed to create balance log: ' . $e->getMessage());
            // Don't throw exception here as the main transaction already succeeded
        }
    }

    /**
     * Optional: Method to get current balance for a specific employee and leave type
     */
    public function getCurrentBalance($employeeId, $leaveTypeId, $year = null)
    {
        $year = $year ?? now()->year;
        
        return LeaveBalance::where('employee_id', $employeeId)
            ->where('leave_type_id', $leaveTypeId)
            ->where('year', $year)
            ->first();
    }
}