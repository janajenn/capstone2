<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveBalance extends Model
{
    use HasFactory;

    protected $fillable = ['employee_id', 'leave_type_id', 'year', 'total_earned', 'total_used', 'balance', 'remarks'];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_id', 'id');
    }
}
