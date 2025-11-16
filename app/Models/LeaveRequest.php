<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveRequest extends Model
{
    use HasFactory;

     protected $fillable = ['employee_id', 'leave_type_id', 'date_from', 'date_to','selected_days', 'reason', 'status', 'attachment_path', 'days_with_pay', 'days_without_pay'];


     protected $casts = [
        'selected_dates' => 'array'

     ];

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


// app/Models/LeaveRequest.php - Add these methods

public function rescheduleRequests()
{
    return $this->hasMany(LeaveRescheduleRequest::class, 'original_leave_request_id');
}

public function latestReschedule()
{
    return $this->hasOne(LeaveRescheduleRequest::class, 'original_leave_request_id')->latest();
}

public function hasRescheduleHistory()
{
    return $this->rescheduleRequests()->exists();
}

public function isRescheduled()
{
    return $this->rescheduleRequests()->where('status', 'approved')->exists();
}

public function getRescheduleHistoryAttribute()
{
    return $this->rescheduleRequests()->orderBy('created_at', 'desc')->get();
}
}
