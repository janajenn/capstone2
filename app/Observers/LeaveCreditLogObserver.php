<?php

namespace App\Observers;

use App\Models\LeaveCreditLog;
use App\Models\LeaveCredit;
use Illuminate\Support\Facades\Log;

class LeaveCreditLogObserver
{
    /**
     * Handle the LeaveCreditLog "creating" event.
     * This runs before the model is saved to the database.
     */
    public function creating(LeaveCreditLog $leaveCreditLog): void
    {
        // Only auto-populate if balance_before is not already set
        if ($leaveCreditLog->balance_before === null && $leaveCreditLog->balance_after === null) {
            $this->populateBalances($leaveCreditLog);
        }
    }

    /**
     * Handle the LeaveCreditLog "created" event.
     * This runs after the model is saved to the database.
     */
    public function created(LeaveCreditLog $leaveCreditLog): void
    {
        // Update the leave_credits table if this is a deduction
        if ($leaveCreditLog->points_deducted > 0) {
            $this->updateLeaveCredits($leaveCreditLog);
        }
    }

    /**
     * Populate balance_before and balance_after automatically
     */
    private function populateBalances(LeaveCreditLog $leaveCreditLog): void
    {
        try {
            // Get or create leave credit record
            $leaveCredit = LeaveCredit::getOrCreateForEmployee($leaveCreditLog->employee_id);
            
            // Get current balance before deduction
            $balanceBefore = $leaveCredit->getBalanceForType($leaveCreditLog->type);
            
            // Calculate balance after deduction
            $balanceAfter = $balanceBefore - $leaveCreditLog->points_deducted;
            
            // Set the balances
            $leaveCreditLog->balance_before = $balanceBefore;
            $leaveCreditLog->balance_after = $balanceAfter;
            
            Log::info("LeaveCreditLogObserver: Auto-populated balances for employee {$leaveCreditLog->employee_id}, type {$leaveCreditLog->type}. Before: {$balanceBefore}, After: {$balanceAfter}");
            
        } catch (\Exception $e) {
            Log::error("LeaveCreditLogObserver: Failed to populate balances - " . $e->getMessage());
            // Don't throw exception here to avoid breaking the creation process
            // The balances will remain null and can be handled manually
        }
    }

    /**
     * Update the leave_credits table after creating a log entry
     */
    private function updateLeaveCredits(LeaveCreditLog $leaveCreditLog): void
    {
        try {
            $leaveCredit = LeaveCredit::where('employee_id', $leaveCreditLog->employee_id)->first();
            
            if (!$leaveCredit) {
                Log::warning("LeaveCreditLogObserver: No leave credit record found for employee {$leaveCreditLog->employee_id}");
                return;
            }
            
            // Deduct the points from the appropriate balance
            $field = $leaveCredit->getBalanceFieldForType($leaveCreditLog->type);
            
            if ($field) {
                $leaveCredit->{$field} = $leaveCreditLog->balance_after;
                $leaveCredit->last_updated = now();
                $leaveCredit->save();
                
                Log::info("LeaveCreditLogObserver: Updated leave credits for employee {$leaveCreditLog->employee_id}, {$field} = {$leaveCreditLog->balance_after}");
            }
            
        } catch (\Exception $e) {
            Log::error("LeaveCreditLogObserver: Failed to update leave credits - " . $e->getMessage());
        }
    }
}


