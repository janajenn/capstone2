<?php

namespace App\Services;

use App\Models\LeaveRequest;
use App\Models\LeaveCredit;
use App\Models\LeaveCreditLog;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeaveCreditService
{
    public function deductLeaveCredits(LeaveRequest $leaveRequest)
    {
        Log::info('🚀 LEAVE CREDIT SERVICE STARTED for leave request ID: ' . $leaveRequest->id);

        try {
            return DB::transaction(function () use ($leaveRequest) {
                Log::info('📦 Transaction started');

                // Get leave type CODE from relationship (not the name)
                $leaveTypeCode = $leaveRequest->leaveType->code;
                Log::info('📋 Leave Type Code: ' . $leaveTypeCode);

                // Only process SL and VL leave types (checking the CODE now)
                if (!in_array($leaveTypeCode, ['SL', 'VL'])) {
                    Log::info("⏭️ Skipping deduction for non-SL/VL leave type code: {$leaveTypeCode}");
                    return null;
                }

                // Calculate working days (excluding weekends)
                $period = CarbonPeriod::create($leaveRequest->date_from, $leaveRequest->date_to);
                $workingDays = collect($period)->filter(function ($date) {
                    return !$date->isWeekend();
                })->count();

                Log::info("📅 Working days to deduct: {$workingDays}");

                // Get leave credit record
                $leaveCredit = LeaveCredit::where('employee_id', $leaveRequest->employee_id)->first();

                if (!$leaveCredit) {
                    Log::error("❌ No leave credits found for employee: {$leaveRequest->employee_id}");
                    throw new \Exception('No leave credits found for this employee.');
                }

                Log::info("💳 Current balances - SL: {$leaveCredit->sl_balance}, VL: {$leaveCredit->vl_balance}");

                // Check sufficient balance
                $balanceField = $this->getBalanceField($leaveTypeCode);
                $currentBalance = $leaveCredit->{$balanceField};

                if ($currentBalance < $workingDays) {
                    Log::error("❌ Insufficient {$leaveTypeCode} balance: {$currentBalance} available, {$workingDays} required");
                    throw new \Exception("Insufficient {$leaveTypeCode} balance");
                }

                // Deduct from balance
                $leaveCredit->{$balanceField} -= $workingDays;
                $leaveCredit->last_updated = now();
                $leaveCredit->save();

                Log::info("✅ Deducted {$workingDays} days. New {$balanceField}: {$leaveCredit->{$balanceField}}");

                // Log the deduction
                $this->createCreditLog($leaveRequest, $leaveTypeCode, $workingDays, $leaveCredit->{$balanceField});

                Log::info('🎉 LEAVE CREDIT SERVICE COMPLETED SUCCESSFULLY');
                return true;
            });
        } catch (\Exception $e) {
            Log::error('💥 Exception in LeaveCreditService: ' . $e->getMessage());
            Log::error('📝 Stack trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }

    private function getBalanceField($leaveTypeCode)
    {
        return match($leaveTypeCode) {
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

            $log = LeaveCreditLog::create([
                'employee_id' => $leaveRequest->employee_id,
                'type' => $typeCode, // Use the code directly (SL, VL)
                'date' => now(),
                'year' => now()->year,
                'month' => now()->month,
                'points_deducted' => $daysDeducted,
                'balance_before' => $balanceBefore,
                'balance_after' => $newBalance,
                'remarks' => "Auto deducted after Admin approval of leave request ID #{$leaveRequest->id}",
            ]);

            Log::info("✅ Credit log created with ID: {$log->id} - Balance before: {$balanceBefore}, Balance after: {$newBalance}");
            return $log;
        } catch (\Exception $e) {
            Log::error('❌ Failed to create credit log: ' . $e->getMessage());
            throw $e;
        }
    }
}
