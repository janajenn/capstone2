<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreditConversion extends Model
{
    use HasFactory;

    protected $fillable = ['employee_id', 'leave_type', 'credits_requested', 'equivalent_cash', 'status', 'submitted_at'];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class, 'leave_type', 'code');
    }
}
