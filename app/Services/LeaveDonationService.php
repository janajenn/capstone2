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

                // 5. Get paternity leave balance for recipient (create if doesn't exist)
                $paternityBalance = LeaveBalance::where('employee_id', $recipientEmployeeId)
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
                        'employee_id' => $recipientEmployeeId,
                        'leave_type_id' => $paternityLeaveType->id,
                        'year' => now()->year,
                        'total_earned' => 0,
                        'total_used' => 0,
                        'balance' => 0,
                    ]);
                }

                // 6. Perform the donation transaction
                // Deduct from donor's maternity leave
                $maternityBalance->balance -= $days;
                $maternityBalance->total_used += $days;
                $maternityBalance->save();

                // Add to recipient's paternity leave
                $paternityBalance->balance += $days;
                $paternityBalance->total_earned += $days;
                $paternityBalance->save();

                // 7. Create donation record (without donation_id)
                $donation = LeaveDonation::create([
                    'donor_employee_id' => $donorEmployeeId,
                    'recipient_employee_id' => $recipientEmployeeId,
                    'days_donated' => $days,
                    'status' => 'completed',
                    'remarks' => "Maternity leave donation of {$days} days",
                    'donated_at' => now(),
                ]);

                // 8. Log the transaction
                $this->createDonationLog($donation, $maternityBalance, $paternityBalance);

                Log::info('✅ LEAVE DONATION COMPLETED SUCCESSFULLY', [
                    'donation_id' => $donation->id, // Use the auto-increment ID instead
                    'donor_balance_after' => $maternityBalance->balance,
                    'recipient_balance_after' => $paternityBalance->balance
                ]);

                return [
                    'success' => true,
                    'donation_id' => $donation->id, // Use the auto-increment ID
                    'days_donated' => $days,
                    'donor_new_balance' => $maternityBalance->balance,
                    'recipient_new_balance' => $paternityBalance->balance,
                    'message' => "Successfully donated {$days} days of maternity leave."
                ];
            });
        } catch (\Exception $e) {
            Log::error('💥 LEAVE DONATION FAILED: ' . $e->getMessage());
            throw $e;
        }
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