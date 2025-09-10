<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Employee;

class LeaveCredit extends Model
{
    use HasFactory;

     protected $fillable = [
        'employee_id',
        'sl_balance',
        'vl_balance',
        'last_updated',
        'remarks',
    ];
    protected $casts = [
        'last_updated' => 'datetime',
    ];



public function employee()
{
    return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
}

/**
 * Get the current balance for a specific leave type
 * 
 * @param string $type 'SL' or 'VL'
 * @return float
 */
public function getBalanceForType(string $type): float
{
    return match(strtoupper($type)) {
        'SL' => (float) $this->sl_balance,
        'VL' => (float) $this->vl_balance,
        default => 0.0
    };
}

/**
 * Get the balance field name for a specific leave type
 * 
 * @param string $type 'SL' or 'VL'
 * @return string|null
 */
public function getBalanceFieldForType(string $type): ?string
{
    return match(strtoupper($type)) {
        'SL' => 'sl_balance',
        'VL' => 'vl_balance',
        default => null
    };
}

/**
 * Deduct points from the specified leave type balance
 * 
 * @param string $type 'SL' or 'VL'
 * @param float $points
 * @return bool
 */
public function deductBalance(string $type, float $points): bool
{
    $field = $this->getBalanceFieldForType($type);
    
    if (!$field) {
        return false;
    }
    
    $this->{$field} -= $points;
    $this->last_updated = now();
    
    return $this->save();
}

/**
 * Get or create leave credit record for an employee
 * 
 * @param int $employeeId
 * @return LeaveCredit
 */
public static function getOrCreateForEmployee(int $employeeId): LeaveCredit
{
    return static::firstOrCreate(
        ['employee_id' => $employeeId],
        [
            'sl_balance' => 0,
            'vl_balance' => 0,
            'last_updated' => now(),
            'remarks' => 'Auto-created leave credit record'
        ]
    );
}

}
