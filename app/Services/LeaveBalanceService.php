<?php

namespace App\Services;

use App\Models\LeaveRequest;
use App\Models\LeaveBalance;
use App\Models\LeaveBalanceLog; // Add this
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

                // Calculate working days (excluding weekends) - Use selected_dates count instead
                $workingDays = $this->calculateWorkingDaysFromSelectedDates($leaveRequest);

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

                // Store balance before deduction for logging
                $balanceBefore = $leaveBalance->balance;
                $totalUsedBefore = $leaveBalance->total_used;

                // Calculate new balance
                $balanceAfter = $balanceBefore - $workingDays;
                $totalUsedAfter = $totalUsedBefore + $workingDays;

                // Update leave balance record
                $leaveBalance->total_used = $totalUsedAfter;
                $leaveBalance->balance = $balanceAfter;
                $leaveBalance->updated_at = now();
                $leaveBalance->save();

                Log::info("✅ Deducted {$workingDays} days. New balance: {$leaveBalance->balance}, " .
                         "Total used: {$leaveBalance->total_used}");

                // Create balance log using new LeaveBalanceLog model
                $this->createBalanceLogNew(
                    $leaveRequest,
                    $leaveTypeCode,
                    $workingDays,
                    $balanceBefore,
                    $balanceAfter,
                    $totalUsedBefore,
                    $totalUsedAfter
                );

                // Update leave request with exact balance information for historical reference
                $leaveRequest->update([
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                    'days_with_pay' => $workingDays, // Ensure days_with_pay matches actual deduction
                    'days_without_pay' => 0, // For non-SL/VL, all days are with pay
                ]);

                Log::info('🎉 LEAVE BALANCE SERVICE COMPLETED SUCCESSFULLY');
                return [
                    'success' => true,
                    'message' => "Successfully deducted {$workingDays} days from {$leaveRequest->leaveType->name} balance",
                    'days_deducted' => $workingDays,
                    'new_balance' => $balanceAfter
                ];
            });
        } catch (\Exception $e) {
            Log::error('💥 Exception in LeaveBalanceService: ' . $e->getMessage());
            Log::error('📝 Stack trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }

    /**
     * Calculate working days from selected_dates array
     */
    private function calculateWorkingDaysFromSelectedDates(LeaveRequest $leaveRequest): int
    {
        // Use selected_dates if available (more accurate)
        if (!empty($leaveRequest->selected_dates)) {
            $selectedDates = is_array($leaveRequest->selected_dates) 
                ? $leaveRequest->selected_dates 
                : json_decode($leaveRequest->selected_dates, true);
            
            if (is_array($selectedDates) && count($selectedDates) > 0) {
                $workingDays = 0;
                foreach ($selectedDates as $date) {
                    $dateObj = new \DateTime($date);
                    if ($dateObj->format('N') < 6) { // Monday-Friday (1-5)
                        $workingDays++;
                    }
                }
                Log::info("📊 Using selected_dates count: {$workingDays} working days from " . count($selectedDates) . " selected dates");
                return $workingDays;
            }
        }

        // Fallback to date range calculation
        $period = CarbonPeriod::create($leaveRequest->date_from, $leaveRequest->date_to);
        $workingDays = collect($period)->filter(function ($date) {
            return !$date->isWeekend();
        })->count();
        
        Log::info("📊 Fallback to date range calculation: {$workingDays} working days");
        return $workingDays;
    }

    /**
     * NEW: Create balance log using LeaveBalanceLog model
     */
    private function createBalanceLogNew(
        LeaveRequest $leaveRequest,
        string $leaveTypeCode,
        int $daysDeducted,
        int $balanceBefore,
        int $balanceAfter,
        int $totalUsedBefore,
        int $totalUsedAfter
    ): void {
        Log::info('📝 Creating new balance log entry...');

        try {
            // Create log using the new model
            LeaveBalanceLog::create([
                'employee_id' => $leaveRequest->employee_id,
                'leave_type_id' => $leaveRequest->leave_type_id,
                'leave_request_id' => $leaveRequest->id,
                'year' => now()->year,
                'transaction_type' => 'deduction',
                'amount' => -$daysDeducted, // Negative for deduction
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'remarks' => "Leave request #{$leaveRequest->id} - {$leaveRequest->leaveType->name} - Approved by HR",
                'reference_type' => 'leave_request',
                'reference_id' => $leaveRequest->id,
                'created_by' => auth()->id(), // HR user who approved
            ]);

            Log::info("✅ New balance log created successfully for leave request #{$leaveRequest->id}");
            
        } catch (\Exception $e) {
            Log::error('❌ Failed to create new balance log: ' . $e->getMessage());
            // Don't throw exception here as the main transaction already succeeded
        }
    }

    /**
     * Get current balance for a specific employee and leave type
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