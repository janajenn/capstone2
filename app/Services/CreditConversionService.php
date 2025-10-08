<?php

namespace App\Services;

use App\Models\CreditConversion;
use App\Models\LeaveBalance;
use App\Models\LeaveCredit;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Exception;

class CreditConversionService
{
    /**
     * Request leave credit to cash conversion
     */
    public function requestConversion($employeeId, $leaveType, $creditsRequested, $remarks = null)
    {
        // Validate employee exists
        $employee = Employee::findOrFail($employeeId);
        
        // Check if employee has at least 10 leave credits
        $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();
        
        if (!$leaveCredit) {
            throw new Exception('Leave credit record not found for employee.');
        }
        
        // Get the appropriate balance for the specific leave type
        $availableBalance = 0;
        if ($leaveType === 'SL') {
            $availableBalance = $leaveCredit->sl_balance ?? 0;
        } elseif ($leaveType === 'VL') {
            $availableBalance = $leaveCredit->vl_balance ?? 0;
        }
        
        // NEW RULE: Minimum 10 credits required
        if ($availableBalance < 10) {
            throw new Exception('You need at least 10 leave credits to request monetization.');
        }
        
        // NEW RULE: Minimum conversion is 10 days (even if requesting fewer)
        $effectiveCredits = max($creditsRequested, 10);
        
        // Check if requested credits exceed available balance
        if ($effectiveCredits > $availableBalance) {
            throw new Exception('Requested credits exceed available balance for ' . $leaveType . '.');
        }
        
        // Check if employee has already converted maximum days this year
        $totalConvertedThisYear = CreditConversion::where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->forYear()
            ->sum('credits_requested');
            
        if (($totalConvertedThisYear + $effectiveCredits) > 10) {
            throw new Exception('Maximum of 10 days can be monetized per year. Already converted: ' . $totalConvertedThisYear . ' days.');
        }
        
        // Calculate cash equivalent using new formula
        $equivalentCash = $this->calculateCashEquivalent($employee->monthly_salary, $effectiveCredits);
        
        // Create conversion request
        $conversion = CreditConversion::create([
            'employee_id' => $employeeId,
            'leave_type' => $leaveType,
            'credits_requested' => $effectiveCredits,
            'equivalent_cash' => $equivalentCash,
            'status' => 'pending',
            'submitted_at' => Carbon::now(),
            'remarks' => $remarks,
        ]);
        
        return $conversion;
    }
    
    /**
     * Calculate cash equivalent for leave credits using new formula
     * cash_value = monthly_salary × 10 × 0.0481927
     */
    private function calculateCashEquivalent($monthlySalary, $creditsRequested)
    {
        // NEW FORMULA: monthly_salary × 10 × 0.0481927
        // For minimum 10 days conversion
        $cashValue = $monthlySalary * 10 * 0.0481927;
        
        // Round to 2 decimal places
        return round($cashValue, 2);
    }
    
    /**
     * Approve leave credit to cash conversion
     */
    public function approveConversion($conversionId, $approvedBy, $remarks = null)
    {
        return DB::transaction(function () use ($conversionId, $approvedBy, $remarks) {
            $conversion = CreditConversion::findOrFail($conversionId);
            
            if ($conversion->status !== 'pending') {
                throw new Exception('Conversion request is not pending.');
            }
            
            // Update conversion status
            $conversion->update([
                'status' => 'approved',
                'approved_at' => Carbon::now(),
                'approved_by' => $approvedBy,
                'remarks' => $remarks,
            ]);
            
            // Deduct leave credits from employee's balance using LeaveCredit table
            $leaveCredit = LeaveCredit::where('employee_id', $conversion->employee_id)->first();
            if ($leaveCredit) {
                if ($conversion->leave_type === 'SL') {
                    $leaveCredit->update([
                        'sl_balance' => $leaveCredit->sl_balance - $conversion->credits_requested
                    ]);
                } elseif ($conversion->leave_type === 'VL') {
                    $leaveCredit->update([
                        'vl_balance' => $leaveCredit->vl_balance - $conversion->credits_requested
                    ]);
                }
            }
            
            return $conversion;
        });
    }
    
    /**
     * Reject leave credit to cash conversion
     */
    public function rejectConversion($conversionId, $rejectedBy, $remarks = null)
    {
        $conversion = CreditConversion::findOrFail($conversionId);
        
        if ($conversion->status !== 'pending') {
            throw new Exception('Conversion request is not pending.');
        }
        
        $conversion->update([
            'status' => 'rejected',
            'approved_at' => Carbon::now(),
            'approved_by' => $rejectedBy,
            'remarks' => $remarks,
        ]);
        
        return $conversion;
    }
    
    /**
     * Get conversion statistics for an employee
     */
    public function getEmployeeConversionStats($employeeId, $year = null)
    {
        $year = $year ?? Carbon::now()->year;
        
        $totalConverted = CreditConversion::where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->forYear($year)
            ->sum('credits_requested');
            
        $totalCashReceived = CreditConversion::where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->forYear($year)
            ->sum('equivalent_cash');
            
        $pendingRequests = CreditConversion::where('employee_id', $employeeId)
            ->where('status', 'pending')
            ->forYear($year)
            ->count();
            
        return [
            'total_converted_days' => $totalConverted,
            'total_cash_received' => $totalCashReceived,
            'pending_requests' => $pendingRequests,
            'remaining_quota' => max(0, 10 - $totalConverted),
        ];
    }
    
    /**
     * Check if employee is eligible for conversion
     */
    public function checkEligibility($employeeId, $leaveType)
    {
        // Use LeaveCredit table instead of LeaveBalance to match the system
        $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();
        
        if (!$leaveCredit) {
            return [
                'eligible' => false,
                'reason' => 'Leave credit record not found',
                'available_balance' => 0
            ];
        }
        
        // Get the appropriate balance for the specific leave type
        $availableBalance = 0;
        if ($leaveType === 'SL') {
            $availableBalance = $leaveCredit->sl_balance ?? 0;
        } elseif ($leaveType === 'VL') {
            $availableBalance = $leaveCredit->vl_balance ?? 0;
        }
        
        // NEW RULE: Minimum 10 credits required
        if ($availableBalance < 10) {
            return [
                'eligible' => false,
                'reason' => 'You need at least 10 leave credits to request monetization',
                'available_balance' => $availableBalance
            ];
        }
        
        $totalConvertedThisYear = CreditConversion::where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->forYear()
            ->sum('credits_requested');
            
        if ($totalConvertedThisYear >= 10) {
            return [
                'eligible' => false,
                'reason' => 'Maximum annual quota reached (10 days)',
                'available_quota' => 0
            ];
        }
        
        return [
            'eligible' => true,
            'available_balance' => $availableBalance,
            'available_quota' => 10 - $totalConvertedThisYear,
            'reason' => 'Eligible for conversion'
        ];
    }

    /**
     * Calculate potential cash value for display
     */
    public function calculatePotentialCash($monthlySalary)
    {
        // Calculate using the new formula: monthly_salary × 10 × 0.0481927
        $cashValue = $monthlySalary * 10 * 0.0481927;
        
        return round($cashValue, 2);
    }
}