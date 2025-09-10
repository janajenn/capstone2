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
        
        // Check if employee has sufficient leave credits using LeaveCredit table
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
        
        // Check if the specific leave type has more than 15 days
        if ($availableBalance <= 15) {
            throw new Exception('Employee must have more than 15 days of ' . $leaveType . ' credits to monetize.');
        }
        
        // Check if employee has already converted maximum days this year
        $totalConvertedThisYear = CreditConversion::where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->forYear()
            ->sum('credits_requested');
            
        if (($totalConvertedThisYear + $creditsRequested) > 10) {
            throw new Exception('Maximum of 10 days can be monetized per year. Already converted: ' . $totalConvertedThisYear . ' days.');
        }
        
        // Check if requested credits exceed available balance for this leave type
        if ($creditsRequested > $availableBalance) {
            throw new Exception('Requested credits exceed available balance for ' . $leaveType . '.');
        }
        
        // Calculate cash equivalent
        $equivalentCash = $this->calculateCashEquivalent($employee->monthly_salary, $creditsRequested);
        
        // Create conversion request
        $conversion = CreditConversion::create([
            'employee_id' => $employeeId,
            'leave_type' => $leaveType,
            'credits_requested' => $creditsRequested,
            'equivalent_cash' => $equivalentCash,
            'status' => 'pending',
            'submitted_at' => Carbon::now(),
            'remarks' => $remarks,
        ]);
        
        return $conversion;
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
     * Calculate cash equivalent for leave credits
     */
    private function calculateCashEquivalent($monthlySalary, $creditsRequested)
    {
        // Formula: (monthly_salary / 22) * credits_requested
        // Assuming 22 working days per month
        $dailyRate = $monthlySalary / 22;
        return $dailyRate * $creditsRequested;
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
        
        // Check if the specific leave type has more than 15 days
        if ($availableBalance <= 15) {
            return [
                'eligible' => false,
                'reason' => 'Insufficient ' . $leaveType . ' credits (more than 15 days required)',
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
}
