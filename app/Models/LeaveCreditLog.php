<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveCreditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'type',
        'date',
        'year',
        'month',
        'points_deducted',
        'balance_before',
        'balance_after',
        'remarks',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Create a leave credit log with automatic balance calculation
     * 
     * @param int $employeeId
     * @param string $type 'SL' or 'VL'
     * @param float $pointsDeducted
     * @param string|null $remarks
     * @param \DateTime|null $date
     * @return LeaveCreditLog
     * @throws \Exception
     */
    public static function createWithBalanceCalculation(
        int $employeeId, 
        string $type, 
        float $pointsDeducted, 
        ?string $remarks = null,
        ?\DateTime $date = null
    ): LeaveCreditLog {
        // Get or create leave credit record
        $leaveCredit = LeaveCredit::getOrCreateForEmployee($employeeId);
        
        // Get current balance before deduction
        $balanceBefore = $leaveCredit->getBalanceForType($type);
        
        // Calculate balance after deduction
        $balanceAfter = $balanceBefore - $pointsDeducted;
        
        // Validate sufficient balance
        if ($balanceAfter < 0) {
            throw new \Exception("Insufficient {$type} balance. Available: {$balanceBefore}, Required: {$pointsDeducted}");
        }
        
        // Deduct from leave credits table
        if (!$leaveCredit->deductBalance($type, $pointsDeducted)) {
            throw new \Exception("Failed to deduct balance from leave credits");
        }
        
        // Create the log entry
        $logDate = $date ?? now();
        
        return static::create([
            'employee_id' => $employeeId,
            'type' => strtoupper($type),
            'date' => $logDate,
            'year' => $logDate->year,
            'month' => $logDate->month,
            'points_deducted' => $pointsDeducted,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
            'remarks' => $remarks ?? "Automatic deduction - {$type} leave",
        ]);
    }

    /**
     * Get the leave credit record for this log's employee
     * 
     * @return LeaveCredit|null
     */
    public function getLeaveCredit(): ?LeaveCredit
    {
        return LeaveCredit::where('employee_id', $this->employee_id)->first();
    }
}
