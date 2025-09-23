<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveRequest extends Model
{
    use HasFactory;

     protected $fillable = ['employee_id', 'leave_type_id', 'date_from', 'date_to', 'reason', 'status', 'attachment_path', 'days_with_pay', 'days_without_pay'];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_id');
    }

    public function approvals()
    {
        return $this->hasMany(LeaveApproval::class, 'leave_id');
    }

    public function details()
    {
        return $this->hasMany(LeaveRequestDetail::class, 'leave_request_id');
    }

    public function recalls()
    {
        return $this->hasMany(LeaveRecall::class, 'leave_request_id');
    }
}
