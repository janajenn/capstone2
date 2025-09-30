<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveBalance extends Model
{
    use HasFactory;

    protected $fillable = ['employee_id', 'leave_type_id', 'year', 'total_earned', 'total_used', 'balance', 'remarks'];




    protected $casts = [
        'total_earned' => 'integer',
        'total_used' => 'integer',
        'balance' => 'integer',
        'year' => 'integer',
    ];


    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_id', 'id');
    }


    /**
     * Scope a query to only include balances for the current year.
    */
   public function scopeCurrentYear($query)
   {
       return $query->where('year', now()->year);
   }

   /**
    * Scope a query to only include balances for a specific employee.
    */
   public function scopeForEmployee($query, $employeeId)
   {
       return $query->where('employee_id', $employeeId);
   }

   /**
    * Scope a query to only include balances for a specific leave type.
    */
   public function scopeForLeaveType($query, $leaveTypeId)
   {
       return $query->where('leave_type_id', $leaveTypeId);
   }

}
