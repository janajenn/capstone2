<?php

namespace App\Services;

use App\Models\LeaveDonation;
use App\Models\LeaveBalance;
use App\Models\Employee;
use App\Models\LeaveType;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeaveDonationService
{
    public function donateMaternityLeave($donorEmployeeId, $recipientEmployeeId, $days = 7)
    {
        Log::info('🚀 LEAVE DONATION SERVICE STARTED', [
            'donor' => $donorEmployeeId,
            'recipient' => $recipientEmployeeId,
            'days' => $days
        ]);

        try {
            return DB::transaction(function () use ($donorEmployeeId, $recipientEmployeeId, $days) {
                // 1. Validate donor (female with maternity leave)
                $donor = Employee::with(['user', 'leaveBalances' => function($query) {
                    $query->whereHas('leaveType', function($q) {
                        $q->where('code', 'ML');
                    });
                }])->where('employee_id', $donorEmployeeId)->first();

                if (!$donor) {
                    throw new \Exception('Donor employee not found.');
                }

                // Check if donor is female
                if (strtolower($donor->gender) !== 'female') {
                    throw new \Exception('Only female employees can donate maternity leave.');
                }

                // 2. Validate recipient (male government employee)
                $recipient = Employee::with(['user'])->where('employee_id', $recipientEmployeeId)->first();

                if (!$recipient) {
                    throw new \Exception('Recipient employee not found.');
                }

                // Check if recipient is male
                if (strtolower($recipient->gender) !== 'male') {
                    throw new \Exception('Maternity leave can only be donated to male employees.');
                }

                // 3. Get maternity leave balance for donor
                $maternityBalance = LeaveBalance::where('employee_id', $donorEmployeeId)
                    ->whereHas('leaveType', function($query) {
                        $query->where('code', 'ML');
                    })
                    ->first();

                if (!$maternityBalance) {
                    throw new \Exception('Donor does not have maternity leave balance.');
                }

                // 4. Check if donor has sufficient balance
                if ($maternityBalance->balance < $days) {
                    throw new \Exception("Insufficient maternity leave balance. Available: {$maternityBalance->balance} days, Required: {$days} days.");
                }

                // 5. Create donation record with pending_hr status
                $donation = LeaveDonation::create([
                    'donor_employee_id' => $donorEmployeeId,
                    'recipient_employee_id' => $recipientEmployeeId,
                    'days_donated' => $days,
                    'status' => 'pending_hr', // Changed from 'completed' to 'pending_hr'
                    'remarks' => "Maternity leave donation of {$days} days - Pending HR Approval",
                    'donated_at' => null, // Will be set when HR approves
                ]);

                Log::info('✅ LEAVE DONATION REQUEST CREATED - PENDING HR APPROVAL', [
                    'donation_id' => $donation->id,
                    'status' => 'pending_hr'
                ]);

                return [
                    'success' => true,
                    'donation_id' => $donation->id,
                    'days_donated' => $days,
                    'status' => 'pending_hr',
                    'message' => "Maternity leave donation request submitted successfully! Waiting for HR approval."
                ];
            });
        } catch (\Exception $e) {
            Log::error('💥 LEAVE DONATION FAILED: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * HR approves the donation request
     */
    public function approveDonation($donationId, $hrUserId, $remarks = null)
    {
        Log::info('🎯 HR APPROVING DONATION', [
            'donation_id' => $donationId,
            'hr_user_id' => $hrUserId
        ]);

        try {
            return DB::transaction(function () use ($donationId, $hrUserId, $remarks) {
                // 1. Get the donation request
                $donation = LeaveDonation::with(['donor', 'recipient'])->findOrFail($donationId);

                if (!$donation->isPendingHr()) {
                    throw new \Exception('This donation request has already been processed.');
                }

                // 2. Get maternity leave balance for donor
                $maternityBalance = LeaveBalance::where('employee_id', $donation->donor_employee_id)
                    ->whereHas('leaveType', function($query) {
                        $query->where('code', 'ML');
                    })
                    ->first();

                if (!$maternityBalance) {
                    throw new \Exception('Donor does not have maternity leave balance.');
                }

                // 3. Check if donor still has sufficient balance
                if ($maternityBalance->balance < $donation->days_donated) {
                    throw new \Exception("Insufficient maternity leave balance. Available: {$maternityBalance->balance} days, Required: {$donation->days_donated} days.");
                }

                // 4. Get paternity leave balance for recipient (create if doesn't exist)
                $paternityBalance = LeaveBalance::where('employee_id', $donation->recipient_employee_id)
                    ->whereHas('leaveType', function($query) {
                        $query->where('code', 'PL');
                    })
                    ->first();

                if (!$paternityBalance) {
                    // Get paternity leave type
                    $paternityLeaveType = LeaveType::where('code', 'PL')->first();
                    if (!$paternityLeaveType) {
                        throw new \Exception('Paternity leave type not found in system.');
                    }

                    // Create paternity balance record
                    $paternityBalance = LeaveBalance::create([
                        'employee_id' => $donation->recipient_employee_id,
                        'leave_type_id' => $paternityLeaveType->id,
                        'year' => now()->year,
                        'total_earned' => 0,
                        'total_used' => 0,
                        'balance' => 0,
                    ]);
                }

                // 5. Perform the donation transaction
                // Deduct from donor's maternity leave
                $maternityBalance->balance -= $donation->days_donated;
                $maternityBalance->total_used += $donation->days_donated;
                $maternityBalance->save();

                // Add to recipient's paternity leave
                $paternityBalance->balance += $donation->days_donated;
                $paternityBalance->total_earned += $donation->days_donated;
                $paternityBalance->save();

                // 6. Update donation record with approval details
                $donation->update([
                    'status' => 'completed',
                    'hr_approved_by' => $hrUserId,
                    'hr_approved_at' => now(),
                    'hr_remarks' => $remarks,
                    'donated_at' => now(),
                    'remarks' => "Maternity leave donation of {$donation->days_donated} days - Approved by HR"
                ]);

                // 7. Log the transaction
                $this->createDonationLog($donation, $maternityBalance, $paternityBalance);

                Log::info('✅ LEAVE DONATION APPROVED AND COMPLETED', [
                    'donation_id' => $donation->id,
                    'donor_balance_after' => $maternityBalance->balance,
                    'recipient_balance_after' => $paternityBalance->balance
                ]);

                return [
                    'success' => true,
                    'donation_id' => $donation->id,
                    'days_donated' => $donation->days_donated,
                    'donor_new_balance' => $maternityBalance->balance,
                    'recipient_new_balance' => $paternityBalance->balance,
                    'message' => "Maternity leave donation approved and completed successfully!"
                ];
            });
        } catch (\Exception $e) {
            Log::error('💥 LEAVE DONATION APPROVAL FAILED: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * HR rejects the donation request
     */
    public function rejectDonation($donationId, $hrUserId, $remarks)
    {
        try {
            $donation = LeaveDonation::findOrFail($donationId);

            if (!$donation->isPendingHr()) {
                throw new \Exception('This donation request has already been processed.');
            }

            $donation->update([
                'status' => 'cancelled',
                'hr_approved_by' => $hrUserId,
                'hr_approved_at' => now(),
                'hr_remarks' => $remarks,
                'remarks' => "Maternity leave donation cancelled by HR: {$remarks}"
            ]);

            Log::info('❌ LEAVE DONATION REJECTED BY HR', [
                'donation_id' => $donation->id,
                'hr_remarks' => $remarks
            ]);

            return [
                'success' => true,
                'message' => 'Donation request rejected successfully.'
            ];

        } catch (\Exception $e) {
            Log::error('💥 LEAVE DONATION REJECTION FAILED: ' . $e->getMessage());
            throw $e;
        }
    }

    // ... rest of your existing methods (canDonateMaternityLeave, getEligibleRecipients, etc.)
    
    /**
     * Get pending HR approval donations
     */
    public function getPendingHrApprovals()
    {
        return LeaveDonation::with(['donor', 'recipient', 'donor.department', 'recipient.department'])
            ->where('status', 'pending_hr')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get all donation requests for HR tracking
     */
    public function getAllDonationRequests($filters = [])
    {
        $query = LeaveDonation::with([
            'donor', 
            'recipient', 
            'donor.department', 
            'recipient.department',
            'hrApprover'
        ]);

        if (isset($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['search']) && $filters['search']) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->whereHas('donor', function($q) use ($search) {
                    $q->where('firstname', 'like', "%{$search}%")
                      ->orWhere('lastname', 'like', "%{$search}%");
                })->orWhereHas('recipient', function($q) use ($search) {
                    $q->where('firstname', 'like', "%{$search}%")
                      ->orWhere('lastname', 'like', "%{$search}%");
                });
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate(10);
    }

    private function createDonationLog($donation, $maternityBalance, $paternityBalance)
    {
        Log::info('📝 Creating donation log...', [
            'donation_id' => $donation->id, // Use auto-increment ID
            'donor_employee_id' => $donation->donor_employee_id,
            'recipient_employee_id' => $donation->recipient_employee_id,
            'days_donated' => $donation->days_donated,
            'maternity_balance_after' => $maternityBalance->balance,
            'paternity_balance_after' => $paternityBalance->balance
        ]);
    }

    /**
     * Check if employee can donate maternity leave
     */
    public function canDonateMaternityLeave($employeeId)
    {
        try {
            $employee = Employee::with(['leaveBalances' => function($query) {
                $query->whereHas('leaveType', function($q) {
                    $q->where('code', 'ML');
                });
            }])->where('employee_id', $employeeId)->first();

            Log::info('🔍 Checking donation eligibility for employee:', [
                'employee_id' => $employeeId,
                'employee_found' => !!$employee,
                'employee_gender' => $employee->gender ?? 'not found',
                'leave_balances_count' => $employee ? $employee->leaveBalances->count() : 0
            ]);

            if (!$employee) {
                Log::warning('❌ Employee not found', ['employee_id' => $employeeId]);
                return false;
            }

            if (strtolower($employee->gender) !== 'female') {
                Log::warning('❌ Employee is not female', ['gender' => $employee->gender]);
                return false;
            }

            $maternityBalance = $employee->leaveBalances->first();
            if (!$maternityBalance) {
                Log::warning('❌ No maternity balance found for employee', ['employee_id' => $employeeId]);
                return false;
            }

            Log::info('✅ Eligibility check passed', [
                'balance' => $maternityBalance->balance,
                'required' => 7,
                'can_donate' => $maternityBalance->balance >= 7
            ]);

            return $maternityBalance->balance >= 7;
        } catch (\Exception $e) {
            Log::error('❌ Error checking maternity donation eligibility: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get eligible male recipients
     */
    public function getEligibleRecipients()
    {
        try {
            $recipients = Employee::with(['department', 'user'])
                ->where('gender', 'male')
                ->where('status', 'active')
                ->get()
                ->map(function ($employee) {
                    return [
                        'employee_id' => $employee->employee_id,
                        'name' => $employee->firstname . ' ' . $employee->lastname,
                        'position' => $employee->position,
                        'department' => $employee->department?->name,
                    ];
                });

            Log::info('📋 Found eligible recipients', ['count' => $recipients->count()]);
            return $recipients;
        } catch (\Exception $e) {
            Log::error('❌ Error getting eligible recipients: ' . $e->getMessage());
            return collect();
        }
    }

    /**
     * Get donation history for employee
     */
    public function getDonationHistory($employeeId)
    {
        return LeaveDonation::with(['donor', 'recipient'])
            ->where('donor_employee_id', $employeeId)
            ->orWhere('recipient_employee_id', $employeeId)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}