<?php

namespace App\Services;

use App\Models\CreditConversion;
use App\Models\LeaveCredit;
use App\Models\LeaveCreditLog;
use App\Models\Employee;
use App\Models\User;
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
        // Only VL credits can be monetized
        if ($leaveType !== 'VL') {
            throw new Exception('Only Vacation Leave (VL) credits can be monetized.');
        }

        $employee = Employee::findOrFail($employeeId);
        $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();
        
        if (!$leaveCredit) {
            throw new Exception('Leave credit record not found for employee.');
        }
        
        $availableBalance = $leaveCredit->vl_balance ?? 0;
        
        // Minimum 15 credits required
        if ($availableBalance < 15) {
            throw new Exception('You need at least 15 VL credits to request monetization.');
        }
        
        // Validate credits requested (minimum 10, maximum available balance)
        $effectiveCredits = max($creditsRequested, 10);
        if ($effectiveCredits < 10) {
            throw new Exception('Minimum 10 credits required for conversion.');
        }
        
        if ($effectiveCredits > $availableBalance) {
            throw new Exception('Requested credits exceed available VL balance.');
        }
        
        // Check annual quota
        $totalConvertedThisYear = CreditConversion::where('employee_id', $employeeId)
            ->where('status', 'admin_approved')
            ->forYear()
            ->sum('credits_requested');
            
        if (($totalConvertedThisYear + $effectiveCredits) > 10) {
            throw new Exception('Maximum of 10 VL days can be monetized per year. Already converted: ' . $totalConvertedThisYear . ' days.');
        }
        
        // Calculate cash equivalent
        $equivalentCash = $this->calculateCashEquivalent($employee->monthly_salary, $effectiveCredits);
        
        // Create conversion request - start with HR approval
        $conversion = CreditConversion::create([
            'employee_id' => $employeeId,
            'leave_type' => $leaveType,
            'credits_requested' => $effectiveCredits,
            'equivalent_cash' => $equivalentCash,
            'status' => 'pending', // Start with HR approval
            'submitted_at' => Carbon::now(),
            'employee_remarks' => $remarks,
        ]);

        // Notify HR (you can implement this later)
        // $this->notifyHRAboutConversionRequest($conversion, $employee);
        
        return $conversion;
    }

    /**
     * HR approves the conversion request
     */
    public function hrApproveConversion($conversionId, $approvedBy, $remarks = null)
    {
        \Log::info('=== SERVICE: HR APPROVAL START ===');
        
        return DB::transaction(function () use ($conversionId, $approvedBy, $remarks) {
            try {
                $conversion = CreditConversion::with('employee.department')->find($conversionId);
                
                if (!$conversion) {
                    \Log::error('Service: Conversion not found', ['conversion_id' => $conversionId]);
                    throw new Exception('Conversion request not found.');
                }
    
                \Log::info('Service: Found conversion', [
                    'conversion_id' => $conversion->conversion_id,
                    'current_status' => $conversion->status,
                    'employee_id' => $conversion->employee_id,
                    'employee_name' => $conversion->employee ? $conversion->employee->firstname . ' ' . $conversion->employee->lastname : 'N/A'
                ]);
    
                // Check if conversion is pending
                if ($conversion->status !== 'pending') {
                    \Log::warning('Service: Conversion not in pending status', [
                        'current_status' => $conversion->status,
                        'required_status' => 'pending'
                    ]);
                    throw new Exception("Conversion request is not pending HR approval. Current status: {$conversion->status}");
                }
    
                // Check if it's VL (should be enforced by frontend, but double-check)
                if ($conversion->leave_type !== 'VL') {
                    \Log::warning('Service: Non-VL conversion attempt', [
                        'leave_type' => $conversion->leave_type
                    ]);
                    throw new Exception('Only Vacation Leave (VL) credits can be monetized.');
                }
    
                \Log::info('Service: Updating conversion status to hr_approved');
                
                // Update to HR approved status
                $updateResult = $conversion->update([
                    'status' => 'hr_approved',
                    'hr_approved_by' => $approvedBy,
                    'hr_approved_at' => Carbon::now(),
                    'hr_remarks' => $remarks,
                ]);
    
                \Log::info('Service: Update result', ['success' => $updateResult]);
    
                // Reload to verify changes
                $conversion->refresh();
                
                \Log::info('Service: HR Approval Completed Successfully', [
                    'new_status' => $conversion->status,
                    'hr_approved_by' => $conversion->hr_approved_by,
                    'hr_approved_at' => $conversion->hr_approved_at
                ]);
    
                return $conversion;
    
            } catch (\Exception $e) {
                \Log::error('Service: HR Approval Failed', [
                    'conversion_id' => $conversionId,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                throw $e; // Re-throw to be caught by controller
            }
        });
    }
    /**
     * Department Head approves the conversion request
     */
    public function deptHeadApproveConversion($conversionId, $approvedBy, $remarks = null)
    {
        return DB::transaction(function () use ($conversionId, $approvedBy, $remarks) {
            $conversion = CreditConversion::with('employee.department')->findOrFail($conversionId);

            if (!$conversion->isHrApproved()) {
                throw new Exception('Conversion request is not pending Department Head approval.');
            }

            // Update to Dept Head approved status - NO DEDUCTION HERE
            $conversion->update([
                'status' => 'dept_head_approved',
                'dept_head_approved_by' => $approvedBy,
                'dept_head_approved_at' => Carbon::now(),
                'dept_head_remarks' => $remarks,
            ]);

            // Notify Admin (you can implement this later)
            // $this->notifyAdminAboutConversion($conversion);

            return $conversion;
        });
    }

    /**
     * Admin approves the conversion request (FINAL APPROVAL - DEDUCTION HAPPENS HERE)
     */


  
   

     /**
      * Admin approves the conversion request (FINAL APPROVAL - DEDUCTION HAPPENS HERE)
      */
     public function adminApproveConversion($conversionId, $approvedBy, $remarks = null)
     {
         \Log::info('=== SIMPLIFIED ADMIN APPROVAL START ===');
     
         return DB::transaction(function () use ($conversionId, $approvedBy, $remarks) {
             try {
                 // Get conversion
                 $conversion = CreditConversion::with('employee')->findOrFail($conversionId);
                 \Log::info('Conversion found', ['id' => $conversion->conversion_id, 'status' => $conversion->status]);
     
                 // Simple status check
                 if ($conversion->status !== 'dept_head_approved') {
                     throw new Exception('Conversion must be dept_head_approved for admin approval. Current: ' . $conversion->status);
                 }
     
                 // Get leave credit
                 $leaveCredit = LeaveCredit::where('employee_id', $conversion->employee_id)->firstOrFail();
                 \Log::info('Leave credit found', ['employee_id' => $conversion->employee_id, 'current_balance' => $leaveCredit->vl_balance]);
     
                 // Store balance before deduction
                 $balanceBefore = (float) $leaveCredit->vl_balance;
                 $creditsToDeduct = (float) $conversion->credits_requested;
                 $balanceAfter = $balanceBefore - $creditsToDeduct;
                 
                 if ($balanceAfter < 0) {
                     throw new Exception("Insufficient credits. Current: {$balanceBefore}, Needed: {$creditsToDeduct}");
                 }
     
                 // Update leave credit
                 $leaveCredit->vl_balance = $balanceAfter;
                 $leaveCredit->save();
     
                 // Update conversion
                 $conversion->status = 'admin_approved';
                 $conversion->admin_approved_by = $approvedBy;
                 $conversion->admin_approved_at = Carbon::now();
                 $conversion->admin_remarks = $remarks;
                 $conversion->save();
     
                 // ✅ AUTOMATICALLY CREATE LEAVE CREDITS LOG ENTRY
                 $this->createLeaveCreditLogEntry(
                     $conversion->employee_id,
                     $conversion->leave_type,
                     $creditsToDeduct,
                     $balanceBefore,
                     $balanceAfter,
                     $conversion
                 );
     
                 \Log::info('Admin approval successful');
     
                 return $conversion;
     
             } catch (\Exception $e) {
                 \Log::error('Admin approval failed', [
                     'conversion_id' => $conversionId,
                     'error' => $e->getMessage()
                 ]);
                 throw $e;
             }
         });
     }
     
     /**
      * Create leave credit log entry with the specified structure
      */
     private function createLeaveCreditLogEntry($employeeId, $leaveType, $pointsDeducted, $balanceBefore, $balanceAfter, $conversion)
     {
         $now = Carbon::now();
         
         LeaveCreditLog::create([
             'employee_id' => $employeeId,
             'type' => $leaveType, // 'VL' or 'SL'
             'date' => $now->toDateString(), // Current date
             'year' => $now->year, // Current year
             'month' => $now->month, // Current month (1-12)
             'points_deducted' => $pointsDeducted,
             'balance_before' => $balanceBefore,
             'balance_after' => $balanceAfter,
             'remarks' => "Credit conversion to cash approved - Request #{$conversion->conversion_id}",
             'created_at' => $now,
             'updated_at' => $now,
         ]);
     
         \Log::info('Leave credit log entry created', [
             'employee_id' => $employeeId,
             'points_deducted' => $pointsDeducted,
             'balance_before' => $balanceBefore,
             'balance_after' => $balanceAfter
         ]);
     }
    /**
     * Reject conversion request at any stage
     */
    public function rejectConversion($conversionId, $rejectedBy, $remarks, $rejectedByRole)
    {
        $conversion = CreditConversion::findOrFail($conversionId);

        if ($conversion->isRejected() || $conversion->isFullyApproved()) {
            throw new Exception('Conversion request cannot be rejected in its current status.');
        }

        $updateData = [
            'status' => 'rejected',
        ];

        // Track who rejected it
        switch ($rejectedByRole) {
            case 'hr':
                $updateData['hr_approved_by'] = $rejectedBy;
                $updateData['hr_approved_at'] = Carbon::now();
                $updateData['hr_remarks'] = $remarks;
                break;
            case 'dept_head':
                $updateData['dept_head_approved_by'] = $rejectedBy;
                $updateData['dept_head_approved_at'] = Carbon::now();
                $updateData['dept_head_remarks'] = $remarks;
                break;
            case 'admin':
                $updateData['admin_approved_by'] = $rejectedBy;
                $updateData['admin_approved_at'] = Carbon::now();
                $updateData['admin_remarks'] = $remarks;
                break;
        }

        $conversion->update($updateData);

        // Send notification (you can implement this later)
        // $this->notificationService->notifyCreditConversionStatus($conversion);

        return $conversion;
    }

    /**
     * Get conversion statistics for an employee
     */
    public function getEmployeeConversionStats($employeeId, $year = null)
    {
        $year = $year ?? Carbon::now()->year;
        
        $totalConverted = CreditConversion::where('employee_id', $employeeId)
            ->where('status', 'admin_approved') // Only count fully approved conversions
            ->forYear($year)
            ->sum('credits_requested');
            
        $totalCashReceived = CreditConversion::where('employee_id', $employeeId)
            ->where('status', 'admin_approved') // Only count fully approved conversions
            ->forYear($year)
            ->sum('equivalent_cash');
            
        $pendingRequests = CreditConversion::where('employee_id', $employeeId)
            ->whereIn('status', ['pending', 'hr_approved', 'dept_head_approved']) // All pending stages
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
        // Only VL credits can be monetized
        if ($leaveType !== 'VL') {
            return [
                'eligible' => false,
                'reason' => 'Only Vacation Leave (VL) credits can be monetized',
                'available_balance' => 0
            ];
        }

        $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();
        
        if (!$leaveCredit) {
            return [
                'eligible' => false,
                'reason' => 'Leave credit record not found',
                'available_balance' => 0
            ];
        }
        
        $availableBalance = $leaveCredit->vl_balance ?? 0;
        
        // Minimum 15 credits required
        if ($availableBalance < 15) {
            return [
                'eligible' => false,
                'reason' => 'You need at least 15 VL credits to request monetization',
                'available_balance' => $availableBalance
            ];
        }
        
        $totalConvertedThisYear = CreditConversion::where('employee_id', $employeeId)
            ->where('status', 'admin_approved') // Only count fully approved conversions
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
     * Calculate cash equivalent
     */
    private function calculateCashEquivalent($monthlySalary, $credits)
    {
        // Simple calculation: daily rate * credits
        $dailyRate = $monthlySalary / 22; // Assuming 22 working days per month
        $cashValue = $dailyRate * $credits;
        return round($cashValue, 2);
    }

    /**
     * Create leave credit log for the deduction
     */
    private function createLeaveCreditLog($conversion, $currentBalance, $newBalance)
    {
        LeaveCreditLog::create([
            'employee_id' => $conversion->employee_id,
            'leave_type' => $conversion->leave_type,
            'previous_balance' => $currentBalance,
            'new_balance' => $newBalance,
            'change_amount' => -$conversion->credits_requested,
            'reason' => 'Credit conversion to cash - Admin approved',
            'reference_id' => $conversion->conversion_id,
            'reference_type' => CreditConversion::class,
            'created_at' => Carbon::now(),
        ]);
    }

    // Placeholder notification methods - implement these when ready
    private function notifyHRAboutConversionRequest($conversion, $employee) {}
    private function notifyDeptHeadAboutConversion($conversion) {}
    private function notifyAdminAboutConversion($conversion) {}
    private function notifyAccountingAboutApprovedConversion($conversion) {}
}