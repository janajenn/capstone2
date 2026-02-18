<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeMonthlyRecording extends Model
{
    protected $fillable = [
        'employee_id', 'year', 'month', 'total_lates',
        'vl_earned', 'vl_used', 'vl_balance',
        'sl_earned', 'sl_used', 'sl_balance',
        'total_vl_sl', 'remarks', 'inclusive_dates'
    ];

    protected $casts = [
        'inclusive_dates' => 'array',
        'total_lates'     => 'float',
        'vl_earned'       => 'float',
        'vl_used'         => 'float',
        'vl_balance'      => 'float',
        'sl_earned'       => 'float',
        'sl_used'         => 'float',
        'sl_balance'      => 'float',
        'total_vl_sl'     => 'float',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}