<?php

namespace App\Services;

use App\Models\CreditConversion;
use App\Models\LeaveBalance;
use App\Models\LeaveCredit;
use App\Models\LeaveCreditLog; // Add this import
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Exception;

class CreditConversionService
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Request leave credit to cash conversion
     */
    public function requestConversion($employeeId, $leaveType, $creditsRequested, $remarks = null)
    {
        // NEW RULE: Only VL credits can be monetized
        if ($leaveType !== 'VL') {
            throw new Exception('Only Vacation Leave (VL) credits can be monetized. Sick Leave (SL) credits are not eligible for cash conversion.');
        }

        // Validate employee exists
        $employee = Employee::findOrFail($employeeId);
        
        // Check if employee has at least 10 leave credits
        $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();
        
        if (!$leaveCredit) {
            throw new Exception('Leave credit record not found for employee.');
        }
        
        // Get the appropriate balance for the specific leave type
        $availableBalance = 0;
        if ($leaveType === 'VL') {
            $availableBalance = $leaveCredit->vl_balance ?? 0;
        }
        
        // NEW RULE: Minimum 10 credits required
        if ($availableBalance < 10) {
            throw new Exception('You need at least 10 VL credits to request monetization.');
        }
        
        // NEW RULE: Minimum conversion is 10 days (even if requesting fewer)
        $effectiveCredits = max($creditsRequested, 10);
        
        // Check if requested credits exceed available balance
        if ($effectiveCredits > $availableBalance) {
            throw new Exception('Requested credits exceed available VL balance.');
        }
        
        // Check if employee has already converted maximum days this year
        $totalConvertedThisYear = CreditConversion::where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->forYear()
            ->sum('credits_requested');
            
        if (($totalConvertedThisYear + $effectiveCredits) > 10) {
            throw new Exception('Maximum of 10 VL days can be monetized per year. Already converted: ' . $totalConvertedThisYear . ' days.');
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

        // 🔔 Send notification to HR about new conversion request
        try {
            $this->notifyHRAboutConversionRequest($conversion, $employee);
        } catch (\Exception $e) {
            \Log::error('Failed to send HR notification for conversion request: ' . $e->getMessage());
        }
        
        return $conversion;
    }

    /**
     * 🔔 Notify HR about new conversion request
     */
    private function notifyHRAboutConversionRequest($conversion, $employee)
    {
        $employeeName = $employee->firstname . ' ' . $employee->lastname;
        $creditsRequested = $conversion->credits_requested;
        $cashEquivalent = $conversion->equivalent_cash;
        
        $title = 'New VL Credit Conversion Request';
        $message = "{$employeeName} has submitted a request to convert {$creditsRequested} VL credits (₱" . number_format($cashEquivalent, 2) . ").";
        
        // Get all HR users
        $hrUsers = \App\Models\User::where('role', 'hr')->get();
        
        foreach ($hrUsers as $hrUser) {
            $hrEmployeeId = $this->notificationService->getEmployeeIdFromUserId($hrUser->id);
            if ($hrEmployeeId) {
                $this->notificationService->createHRNotification(
                    $hrEmployeeId,
                    'credit_conversion_submission',
                    $title,
                    $message,
                    [
                        'conversion_id' => $conversion->conversion_id,
                        'employee_name' => $employeeName,
                        'employee_id' => $employee->employee_id,
                        'credits_requested' => $creditsRequested,
                        'cash_equivalent' => $cashEquivalent,
                        'submitted_at' => $conversion->submitted_at,
                    ]
                );
            }
        }
        
        \Log::info("HR notifications sent for conversion request #{$conversion->conversion_id}");
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
        $conversion = CreditConversion::with('employee')->findOrFail($conversionId);
        
        \Log::info("=== STARTING CONVERSION APPROVAL ===");

        if ($conversion->status !== 'pending') {
            throw new Exception('Conversion request is not pending.');
        }

        // Get current balance
        $leaveCredit = LeaveCredit::where('employee_id', $conversion->employee_id)->first();
        if (!$leaveCredit) {
            throw new Exception('Leave credit record not found for employee.');
        }

        $currentBalance = $leaveCredit->vl_balance;
        $creditsToDeduct = $conversion->credits_requested;
        $newBalance = $currentBalance - $creditsToDeduct;

        // Validate sufficient balance
        if ($newBalance < 0) {
            throw new Exception("Insufficient VL credits. Current balance: {$currentBalance}, Requested: {$creditsToDeduct}");
        }

        // Update conversion status
        $conversion->update([
            'status' => 'approved',
            'approved_by' => $approvedBy,
            'approved_at' => Carbon::now(),
            'remarks' => $remarks,
        ]);

        \Log::info("Conversion status updated to 'approved'");

        // ✅ Update the balance FIRST
        $leaveCredit->update(['vl_balance' => $newBalance]);
        \Log::info("Leave credit balance updated from {$currentBalance} to {$newBalance}");

        // ✅ THEN create the log with correct balances
        $this->createLeaveCreditLog($conversion, $currentBalance, $newBalance);

        // Send notifications
        $this->notifyAccountingAboutApprovedConversion($conversion);
        $this->notificationService->notifyCreditConversionStatus($conversion);

        \Log::info("=== CONVERSION APPROVAL COMPLETED ===");

        return $conversion;
    });
}

private function createLeaveCreditLog(CreditConversion $conversion, $currentBalance, $newBalance)
{
    try {
        \Log::info("Creating leave credit log for conversion #{$conversion->conversion_id}");

        $log = LeaveCreditLog::create([
            'employee_id' => $conversion->employee_id,
            'type' => 'VL',
            'date' => now(),
            'year' => now()->year,
            'month' => now()->month,
            'points_deducted' => $conversion->credits_requested,
            'balance_before' => $currentBalance,
            'balance_after' => $newBalance,
            'remarks' => "Monetization of {$conversion->credits_requested} VL credits (Conversion #{$conversion->conversion_id})",
        ]);

        \Log::info("Leave credit log created successfully. Log ID: " . $log->id);

    } catch (\Exception $e) {
        \Log::error("Failed to create leave credit log for conversion #{$conversion->conversion_id}: " . $e->getMessage());
        throw new Exception("Failed to create leave credit log: " . $e->getMessage());
    }
}
    /**
     * ✅ NEW: Notify Accounting about approved conversion
     */
    private function notifyAccountingAboutApprovedConversion($conversion)
    {
        try {
            $employee = $conversion->employee;
            $employeeName = $employee->firstname . ' ' . $employee->lastname;
            $creditsRequested = $conversion->credits_requested;
            $cashEquivalent = $conversion->equivalent_cash;
            
            $title = 'VL Conversion Approved - Requires Accounting Processing';
            $message = "VL conversion request from {$employeeName} has been approved. {$creditsRequested} VL credits converted to ₱" . number_format($cashEquivalent, 2) . ". Please process the cash release.";
            
            // Get Accounting users (assuming they have role 'accounting' or use admin role)
            $accountingUsers = \App\Models\User::where('role', 'admin')->get(); // Adjust role as needed
            
            foreach ($accountingUsers as $accountingUser) {
                $accountingEmployeeId = $this->notificationService->getEmployeeIdFromUserId($accountingUser->id);
                if ($accountingEmployeeId) {
                    $this->notificationService->createAdminNotification(
                        $accountingEmployeeId,
                        'credit_conversion_approved',
                        $title,
                        $message,
                        [
                            'conversion_id' => $conversion->conversion_id,
                            'employee_name' => $employeeName,
                            'employee_id' => $employee->employee_id,
                            'credits_requested' => $creditsRequested,
                            'cash_equivalent' => $cashEquivalent,
                            'approved_at' => $conversion->approved_at,
                            'approved_by' => $conversion->approved_by,
                        ]
                    );
                }
            }
            
            \Log::info("Accounting notifications sent for approved conversion #{$conversion->conversion_id}");
            
        } catch (\Exception $e) {
            \Log::error("Failed to send accounting notification for conversion #{$conversion->conversion_id}: " . $e->getMessage());
        }
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

        // Send notification to employee about rejection
        $notificationService = new NotificationService();
        $notificationService->notifyCreditConversionStatus($conversion);
        
        return $conversion;
    }

    // ... rest of your existing methods remain the same ...
    
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
            
        // Get current VL balance
        $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();
        $availableVlBalance = $leaveCredit ? $leaveCredit->vl_balance : 0;
            
        return [
            'total_converted_days' => $totalConverted,
            'total_cash_received' => $totalCashReceived,
            'pending_requests' => $pendingRequests,
            'remaining_quota' => max(0, 10 - $totalConverted),
            'available_vl_balance' => $availableVlBalance,
        ];
    }
    
    /**
     * Check if employee is eligible for conversion
     */
    public function checkEligibility($employeeId, $leaveType)
    {
        // NEW RULE: Only VL credits can be monetized
        if ($leaveType !== 'VL') {
            return [
                'eligible' => false,
                'reason' => 'Only Vacation Leave (VL) credits can be monetized',
                'available_balance' => 0
            ];
        }

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
        $availableBalance = $leaveCredit->vl_balance ?? 0;
        
        // NEW RULE: Minimum 10 credits required
        if ($availableBalance < 10) {
            return [
                'eligible' => false,
                'reason' => 'You need at least 10 VL credits to request monetization',
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
            'reason' => 'Eligible for VL conversion'
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